import { create } from 'zustand';
import {
  Objective,
  KeyResult,
  Measurement,
  CheckIn,
  PerformanceEvaluation,
  Notification,
  ApprovalStep,
  KRStatus,
  ObjectiveLifecycleStatus,
  ObjectiveHealth,
  ApprovalState,
  AuditEntry,
} from '../../types';
import { getDb, saveDb, logAudit, createNotification } from '../../api/mockDb';
import {
  calculateKRAchievement,
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculateKRStatus,
  calculateObjectiveHealth,
  isKRDelayed,
} from '../../lib/calculations';

export interface OkrStoreState {
  objectives: Objective[];
  keyResults: KeyResult[];
  measurements: Measurement[];
  checkIns: CheckIn[];
  evaluations: PerformanceEvaluation[];
  notifications: Notification[];
  approvalSteps: ApprovalStep[];
  isLoaded: boolean;

  // Lifecycle & Sync
  init: () => void;
  refresh: () => void;

  // KR Actions
  updateKRProgress: (
    krId: number,
    newValue: number,
    comment: string | undefined,
    userId: number,
    overrideStatus?: KRStatus,
    overrideReason?: string
  ) => Promise<{ keyResult: KeyResult; measurement: Measurement }>;

  overrideKRStatus: (
    krId: number,
    status: KRStatus,
    reason: string,
    userId: number
  ) => Promise<KeyResult>;

  resetKRStatus: (krId: number, userId: number) => Promise<KeyResult>;

  createKeyResult: (
    data: {
      objectiveId: number;
      ownerId: number;
      name: string;
      description?: string;
      measurementTypeId: number;
      direction: KeyResult['direction'];
      baseline: number;
      target: number;
      current?: number;
      weightage: number;
      startDate: string;
      targetDate: string;
      kpiName?: string;
      checkInFrequency?: KeyResult['checkInFrequency'];
      frequencyType?: string;
      visibility?: KeyResult['visibility'];
      priority?: KeyResult['priority'];
      tags?: string[];
      alignedObjectiveId?: number;
      alignedObjectiveName?: string;
      alignedDepartmentName?: string;
    },
    userId: number
  ) => Promise<KeyResult>;

  // Objective Actions
  createObjective: (
    data: {
      cycleId: number;
      ownerId: number;
      level: Objective['level'];
      departmentId?: number;
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      weightage: number;
      parentObjectiveId?: number;
      perspective?: Objective['perspective'];
      visibility?: Objective['visibility'];
      priority?: Objective['priority'];
      tags?: string[];
      keyResults?: Array<Omit<KeyResult, 'id' | 'objectiveId' | 'achievementPercent' | 'status' | 'statusOverridden' | 'createdBy' | 'createdAt'>>;
    },
    userId: number
  ) => Promise<Objective>;

  updateObjective: (
    id: number,
    updates: Partial<Objective>,
    userId: number
  ) => Promise<Objective>;

  submitObjective: (id: number, userId: number) => Promise<void>;
  cancelObjective: (id: number, reason: string, userId: number) => Promise<void>;

  // Check-ins
  createCheckIn: (
    dto: {
      objectiveId: number;
      keyResultId?: number;
      employeeId: number;
      frequencyInterval?: number;
      frequencyUnit?: 'DAY' | 'WEEK' | 'MONTH';
      progressValue: number;
      remarks?: string;
      date?: string;
      planValue?: number;
      actualValue?: number;
      deltaValue?: number;
      deltaPercentage?: number;
      calculatedHealth?: KRStatus;
      overrideHealth?: KRStatus;
      overrideReason?: string;
      statusBannerText?: string;
      stageChangeText?: string;
      authorName?: string;
      attachmentType?: 'text' | 'voice' | 'video' | 'file';
    },
    userId: number
  ) => Promise<CheckIn>;

  markCheckInReviewed: (id: number, userId: number, remarks?: string) => Promise<void>;

  // Evaluations
  submitEvaluation: (
    evaluation: PerformanceEvaluation,
    userId: number,
    userRole: string
  ) => Promise<PerformanceEvaluation>;

  // Notifications
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: (userId: number) => Promise<void>;
}

/**
 * Pure enrichment function ensuring ALL objectives and key results
 * have strictly calculated, synchronized progress, expected pace, and health.
 */
export function computeEnrichedEntities(
  rawObjectives: Objective[],
  rawKeyResults: KeyResult[],
  demoDate: string
) {
  const objectiveMap = new Map(rawObjectives.map((o) => [o.id, o]));

  // Enrich every Key Result
  const enrichedKRs = rawKeyResults.map((kr) => {
    const parentObj = objectiveMap.get(kr.objectiveId);
    const isDraft = parentObj?.status === 'Draft';

    if (isDraft) {
      // Draft objectives have no actual progress, pace, health calculation, or achievement percent
      return {
        ...kr,
        current: kr.baseline,
        achievementPercent: 0,
        expectedPercent: 0,
        isDelayed: false,
        status: 'On Track' as KRStatus,
      };
    }

    const ach = calculateKRAchievement(kr.direction, kr.baseline, kr.target, kr.current);
    const exp = calculateExpectedProgress(kr.startDate, kr.targetDate, demoDate);
    const delayed = isKRDelayed(kr.targetDate, ach, demoDate);

    let status = kr.status;
    if (!kr.statusOverridden) {
      status = calculateKRStatus(ach, exp);
    }

    return {
      ...kr,
      achievementPercent: ach,
      expectedPercent: exp,
      isDelayed: delayed,
      status,
    };
  });

  // Enrich every Objective using its computed Key Results
  const enrichedObjectives = rawObjectives.map((obj) => {
    const isDraft = obj.status === 'Draft';
    if (isDraft) {
      return {
        ...obj,
        progress: 0,
        health: undefined, // No pace/health calculation shown for draft
        canCheckIn: false,
      };
    }

    const objKRs = enrichedKRs.filter((k) => k.objectiveId === obj.id);
    const progress = calculateObjectiveProgress(objKRs);
    const expected = calculateExpectedProgress(obj.startDate, obj.endDate, demoDate);
    const health =
      obj.status === 'Active' ? calculateObjectiveHealth(progress, expected) : undefined;

    return {
      ...obj,
      progress,
      health,
      canCheckIn: obj.status === 'Active',
    };
  });

  return { enrichedObjectives, enrichedKRs };
}

export const useOkrStore = create<OkrStoreState>((set, get) => ({
  objectives: [],
  keyResults: [],
  measurements: [],
  checkIns: [],
  evaluations: [],
  notifications: [],
  approvalSteps: [],
  isLoaded: false,

  init: () => {
    const db = getDb();
    const demoDate = db.devSettings.demoDate;
    const { enrichedObjectives, enrichedKRs } = computeEnrichedEntities(
      db.objectives,
      db.keyResults,
      demoDate
    );

    // Keep dbState in mockDb in sync
    db.objectives = enrichedObjectives;
    db.keyResults = enrichedKRs;

    set({
      objectives: enrichedObjectives,
      keyResults: enrichedKRs,
      measurements: [...db.measurements],
      checkIns: [...db.checkIns],
      evaluations: [...db.evaluations],
      notifications: [...db.notifications],
      approvalSteps: [...db.approvalSteps],
      isLoaded: true,
    });
  },

  refresh: () => {
    const db = getDb();
    const demoDate = db.devSettings.demoDate;
    const { enrichedObjectives, enrichedKRs } = computeEnrichedEntities(
      db.objectives,
      db.keyResults,
      demoDate
    );

    db.objectives = enrichedObjectives;
    db.keyResults = enrichedKRs;

    set({
      objectives: enrichedObjectives,
      keyResults: enrichedKRs,
      measurements: [...db.measurements],
      checkIns: [...db.checkIns],
      evaluations: [...db.evaluations],
      notifications: [...db.notifications],
      approvalSteps: [...db.approvalSteps],
    });
  },

  updateKRProgress: async (
    krId: number,
    newValue: number,
    comment: string | undefined,
    userId: number,
    overrideStatus?: KRStatus,
    overrideReason?: string
  ) => {
    const db = getDb();
    const krIndex = db.keyResults.findIndex((k) => k.id === krId);
    if (krIndex === -1) {
      throw new Error(`Key Result #${krId} not found`);
    }

    const kr = db.keyResults[krIndex];
    const parentObj = db.objectives.find((o) => o.id === kr.objectiveId);
    if (parentObj?.status === 'Draft') {
      throw new Error('Check-ins and progress updates are disabled for Draft objectives. The objective must be activated before recording progress.');
    }
    const oldValue = kr.current;
    const numValue = Number(newValue);

    kr.current = numValue;
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    if (overrideStatus) {
      kr.status = overrideStatus;
      kr.statusOverridden = true;
      kr.overrideReason = overrideReason;
    }

    // Compute new achievement percentage for this update
    const newAch = calculateKRAchievement(kr.direction, kr.baseline, kr.target, numValue);
    const exp = calculateExpectedProgress(kr.startDate, kr.targetDate, db.devSettings.demoDate);
    const calcStatus = overrideStatus || calculateKRStatus(newAch, exp);

    if (!kr.statusOverridden) {
      kr.status = calcStatus;
    }

    // Store previousValue & calculated progress in historical measurement timeline
    const measurement: Measurement = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      keyResultId: krId,
      value: numValue,
      previousValue: oldValue,
      progress: newAch,
      measuredAt: new Date().toISOString(),
      recordedBy: userId,
      comment,
    };
    db.measurements.unshift(measurement);

    // Pace warning notification
    if (calcStatus === 'At Risk' || calcStatus === 'In Trouble') {
      createNotification(
        kr.ownerId,
        'KR_PACE_WARNING',
        'KR Pace Warning',
        `Key Result "${kr.name}" has shifted to ${calcStatus}.`,
        'KEY_RESULT',
        kr.id
      );
    }

    logAudit(
      'KeyResults',
      krId,
      'UPDATE',
      userId,
      `Recorded progress update ${oldValue} -> ${numValue} (${newAch}%)`,
      [{ column: 'current', oldValue, newValue: numValue }]
    );

    // Save and re-enrich
    saveDb();
    get().refresh();

    const updatedKR = get().keyResults.find((k) => k.id === krId)!;
    return { keyResult: updatedKR, measurement };
  },

  overrideKRStatus: async (krId: number, status: KRStatus, reason: string, userId: number) => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === krId);
    if (!kr) throw new Error('Key Result not found');

    kr.status = status;
    kr.statusOverridden = true;
    kr.overrideReason = reason;
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    logAudit('KeyResults', krId, 'OVERRIDE', userId, `Overrode status to "${status}". Reason: ${reason}`);
    saveDb();
    get().refresh();
    return get().keyResults.find((k) => k.id === krId)!;
  },

  resetKRStatus: async (krId: number, userId: number) => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === krId);
    if (!kr) throw new Error('Key Result not found');

    kr.statusOverridden = false;
    kr.overrideReason = undefined;
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    logAudit('KeyResults', krId, 'UPDATE', userId, 'Reset status override to automatic calculation');
    saveDb();
    get().refresh();
    return get().keyResults.find((k) => k.id === krId)!;
  },

  createKeyResult: async (data, userId) => {
    const db = getDb();
    const newId = Date.now();
    const currentVal = data.current ?? data.baseline;
    const ach = calculateKRAchievement(data.direction, data.baseline, data.target, currentVal);

    const newKR: KeyResult = {
      id: newId,
      objectiveId: data.objectiveId,
      ownerId: data.ownerId,
      name: data.name,
      description: data.description,
      measurementTypeId: data.measurementTypeId,
      direction: data.direction,
      baseline: data.baseline,
      target: data.target,
      current: currentVal,
      achievementPercent: ach,
      weightage: data.weightage,
      startDate: data.startDate,
      targetDate: data.targetDate,
      status: 'On Track',
      statusOverridden: false,
      kpiName: data.kpiName,
      checkInFrequency: data.checkInFrequency,
      frequencyType: data.frequencyType,
      visibility: data.visibility,
      priority: data.priority,
      tags: data.tags,
      alignedObjectiveId: data.alignedObjectiveId,
      alignedObjectiveName: data.alignedObjectiveName,
      alignedDepartmentName: data.alignedDepartmentName,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    db.keyResults.push(newKR);

    // Initial measurement
    db.measurements.push({
      id: Date.now() + 10,
      keyResultId: newId,
      value: currentVal,
      previousValue: data.baseline,
      progress: ach,
      measuredAt: new Date().toISOString(),
      recordedBy: userId,
      comment: 'Initial baseline setup',
    });

    logAudit('KeyResults', newId, 'CREATE', userId, `Created KR "${newKR.name}" for Objective #${data.objectiveId}`);
    saveDb();
    get().refresh();
    return get().keyResults.find((k) => k.id === newId)!;
  },

  createObjective: async (data, userId) => {
    const db = getDb();
    const newId = Date.now();

    const newObj: Objective = {
      id: newId,
      cycleId: data.cycleId,
      ownerId: data.ownerId,
      level: data.level,
      departmentId: data.departmentId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      weightage: data.weightage,
      parentObjectiveId: data.parentObjectiveId,
      perspective: data.perspective,
      visibility: data.visibility,
      priority: data.priority,
      tags: data.tags,
      progress: 0,
      status: 'Draft',
      approvalState: 'NotSubmitted',
      submissionNo: 1,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    db.objectives.unshift(newObj);

    // Add child key results if provided
    if (data.keyResults && data.keyResults.length > 0) {
      data.keyResults.forEach((krData, index) => {
        const krId = Date.now() + index + 1;
        const currentVal = krData.current ?? krData.baseline;
        const ach = calculateKRAchievement(krData.direction, krData.baseline, krData.target, currentVal);

        const newKR: KeyResult = {
          ...krData,
          id: krId,
          objectiveId: newId,
          current: currentVal,
          achievementPercent: ach,
          status: 'On Track',
          statusOverridden: false,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };
        db.keyResults.push(newKR);

        // Initial measurement
        db.measurements.push({
          id: Date.now() + index + 100,
          keyResultId: krId,
          value: currentVal,
          previousValue: krData.baseline,
          progress: ach,
          measuredAt: new Date().toISOString(),
          recordedBy: userId,
          comment: 'Initial baseline setup',
        });
      });
    }

    logAudit('Objectives', newId, 'CREATE', userId, `Created objective "${newObj.title}" with ${data.keyResults?.length || 0} Key Results`);
    saveDb();
    get().refresh();
    return get().objectives.find((o) => o.id === newId)!;
  },

  updateObjective: async (id, updates, userId) => {
    const db = getDb();
    const obj = db.objectives.find((o) => o.id === id);
    if (!obj) throw new Error(`Objective #${id} not found`);

    Object.assign(obj, updates);
    obj.updatedBy = userId;
    obj.updatedAt = new Date().toISOString();

    logAudit('Objectives', id, 'UPDATE', userId, `Updated objective #${id}`);
    saveDb();
    get().refresh();
    return get().objectives.find((o) => o.id === id)!;
  },

  submitObjective: async (id, userId) => {
    const db = getDb();
    const obj = db.objectives.find((o) => o.id === id);
    if (!obj) throw new Error('Objective not found');

    const krs = db.keyResults.filter((k) => k.objectiveId === id);
    if (krs.length === 0) {
      throw new Error('An objective cannot be submitted without at least one Key Result.');
    }

    obj.status = 'Draft';
    obj.approvalState = 'PendingManager';
    obj.updatedBy = userId;
    obj.updatedAt = new Date().toISOString();

    // Create approval step
    const owner = db.users.find((u) => u.id === obj.ownerId);
    const approverId = owner?.managerId || 2;

    const newStep: ApprovalStep = {
      id: Date.now(),
      objectiveId: id,
      cycleId: obj.cycleId,
      employeeId: obj.ownerId,
      stage: 1,
      stageName: 'Manager Review',
      approverId,
      submissionNo: obj.submissionNo,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    db.approvalSteps.unshift(newStep);

    createNotification(
      approverId,
      'OBJECTIVE_SUBMITTED',
      'Objective Approval Requested',
      `${owner?.name || 'Employee'} submitted "${obj.title}" for review.`,
      'APPROVAL',
      newStep.id
    );

    logAudit('Objectives', id, 'SUBMIT', userId, `Submitted objective for Stage 1 approval`);
    saveDb();
    get().refresh();
  },

  cancelObjective: async (id, reason, userId) => {
    const db = getDb();
    const obj = db.objectives.find((o) => o.id === id);
    if (!obj) throw new Error('Objective not found');

    obj.status = 'Archived';
    obj.archiveReason = 'Cancelled';
    obj.updatedBy = userId;
    obj.updatedAt = new Date().toISOString();

    logAudit('Objectives', id, 'DELETE', userId, `Cancelled/Archived objective. Reason: ${reason}`);
    saveDb();
    get().refresh();
  },

  createCheckIn: async (dto, userId) => {
    const db = getDb();
    const newId = Date.now();

    // If key result is associated, update KR progress through unified progress update
    if (dto.keyResultId) {
      await get().updateKRProgress(
        dto.keyResultId,
        dto.actualValue ?? dto.progressValue,
        dto.remarks || 'Recorded via Check-in',
        userId,
        dto.overrideHealth || dto.calculatedHealth,
        dto.overrideReason
      );
    }

    const effectiveValue = dto.actualValue ?? dto.progressValue;
    const progressUpdate = {
      id: Date.now() + 1,
      progressValue: effectiveValue,
      progressPercentage: 0,
      updateDate: dto.date || new Date().toISOString(),
      remarks: dto.remarks,
      submittedBy: userId,
    };

    const newCheckIn: CheckIn = {
      id: newId,
      objectiveId: dto.objectiveId,
      keyResultId: dto.keyResultId,
      employeeId: dto.employeeId,
      authorName: dto.authorName,
      date: dto.date || new Date().toISOString(),
      status: 'SUBMITTED',
      frequencyInterval: dto.frequencyInterval || 1,
      frequencyUnit: dto.frequencyUnit || 'WEEK',
      planValue: dto.planValue,
      actualValue: effectiveValue,
      deltaValue: dto.deltaValue,
      deltaPercentage: dto.deltaPercentage,
      calculatedHealth: dto.calculatedHealth,
      overrideHealth: dto.overrideHealth,
      overrideReason: dto.overrideReason,
      statusBannerText: dto.statusBannerText,
      stageChangeText: dto.stageChangeText,
      remarks: dto.remarks,
      attachmentType: dto.attachmentType || 'text',
      progressUpdates: [progressUpdate],
    };

    db.checkIns.unshift(newCheckIn);
    logAudit('CheckIns', newId, 'CREATE', userId, `Submitted periodic check-in for Objective #${dto.objectiveId}`);
    saveDb();
    get().refresh();
    return newCheckIn;
  },

  markCheckInReviewed: async (id, userId, remarks) => {
    const db = getDb();
    const ci = db.checkIns.find((c) => c.id === id);
    if (!ci) throw new Error('Check-in not found');

    ci.status = 'REVIEWED';
    ci.reviewedBy = userId;
    ci.reviewedAt = new Date().toISOString();
    ci.reviewRemarks = remarks;

    logAudit('CheckIns', id, 'UPDATE', userId, `Marked check-in as reviewed`);
    saveDb();
    get().refresh();
  },

  submitEvaluation: async (evaluation, userId, userRole) => {
    const db = getDb();

    // STRICT ROLE PERMISSION ENFORCEMENT (Section 18)
    if (evaluation.evalType === 'SELF') {
      if (evaluation.employeeId !== userId) {
        throw new Error('Employees can only complete self-evaluations for themselves.');
      }
    } else if (evaluation.evalType === 'MANAGER') {
      if (userRole !== 'MANAGER' && userRole !== 'HR_ADMIN') {
        throw new Error('Only managers and HR administrators can submit Manager Evaluations.');
      }
      if (evaluation.employeeId === userId) {
        throw new Error('Managers cannot complete their own manager evaluation.');
      }
    } else if (evaluation.evalType === 'FINAL') {
      if (userRole !== 'HR_ADMIN') {
        throw new Error('Only HR Administrators can complete Final Evaluations.');
      }
    }

    const idx = db.evaluations.findIndex((e) => e.id === evaluation.id);
    const scoreSum = evaluation.responses.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Math.round(scoreSum / (evaluation.responses.length || 1));
    const ratingSum = evaluation.responses.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((ratingSum / (evaluation.responses.length || 1)) * 10) / 10;

    const saved: PerformanceEvaluation = {
      ...evaluation,
      status: 'SUBMITTED',
      overallScore: avgScore,
      overallRating: avgRating,
      submittedAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      db.evaluations[idx] = saved;
    } else {
      saved.id = Date.now();
      db.evaluations.push(saved);
    }

    logAudit('PerformanceEvaluations', saved.id, 'SUBMIT', userId, `Submitted ${saved.evalType} evaluation`);
    saveDb();
    get().refresh();
    return saved;
  },

  markNotificationRead: async (id) => {
    const db = getDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveDb();
      get().refresh();
    }
  },

  markAllNotificationsRead: async (userId) => {
    const db = getDb();
    db.notifications.forEach((n) => {
      if (n.employeeId === userId) n.read = true;
    });
    saveDb();
    get().refresh();
  },
}));

// Initialize store immediately on load
useOkrStore.getState().init();
