import {
  Objective,
  KeyResult,
  ApprovalStep,
  CheckIn,
  ProgressUpdate,
  Comment,
  Attachment,
  Score,
  Notification,
  AuditEntry,
  Template,
  Workflow,
  Cycle,
  Department,
  User,
  PerformanceReviewCycle,
  PerformanceEvaluation,
  EvaluationCriteria,
  KRStatus,
  ObjectiveLifecycleStatus,
  ObjectiveHealth,
  ApprovalState,
  Measurement,
  MeasurementType,
} from '../types';

import {
  getDb,
  saveDb,
  resetDb,
  enrichData,
  logAudit,
  createNotification,
  DevSettings,
} from './mockDb';

import {
  calculateKRAchievement,
  calculateExpectedProgress,
  calculateKRStatus,
  validateKRWeightages,
  calculateKRForecast,
} from '../lib/calculations';

// Simulated delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function simulateApi<T>(fn: () => T): Promise<T> {
  const db = getDb();
  const latency = db.devSettings.simulatedLatency || 400;
  await delay(latency);

  if (db.devSettings.simulateError) {
    throw new Error('Simulated server failure: 500 Internal Server Error (Ref: ERR-SIM-500)');
  }

  return fn();
}

// ============================================================================
// OBJECTIVES API
// ============================================================================

export interface ObjectiveFilters {
  cycleId?: number;
  ownerId?: number;
  departmentId?: number;
  status?: ObjectiveLifecycleStatus;
  health?: ObjectiveHealth;
  approvalState?: ApprovalState;
  search?: string;
}

export async function getObjectives(filters?: ObjectiveFilters): Promise<Objective[]> {
  return simulateApi(() => {
    const enriched = enrichData(getDb());
    let list = enriched.objectives;

    if (getDb().devSettings.simulateEmpty) {
      return [];
    }

    if (filters) {
      if (filters.cycleId) {
        list = list.filter((o) => o.cycleId === filters.cycleId);
      }
      if (filters.ownerId) {
        list = list.filter((o) => o.ownerId === filters.ownerId);
      }
      if (filters.departmentId) {
        list = list.filter((o) => o.departmentId === filters.departmentId);
      }
      if (filters.status) {
        list = list.filter((o) => o.status === filters.status);
      }
      if (filters.health) {
        list = list.filter((o) => o.health === filters.health);
      }
      if (filters.approvalState) {
        list = list.filter((o) => o.approvalState === filters.approvalState);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            (o.description && o.description.toLowerCase().includes(q))
        );
      }
    }

    return list;
  });
}

export async function getObjectiveById(id: number | string): Promise<{
  objective: Objective;
  keyResults: KeyResult[];
  parentObjective?: Objective;
  childObjectives: Objective[];
  approvalSteps: ApprovalStep[];
  comments: Comment[];
  attachments: Attachment[];
  scores: Score[];
  checkIns: CheckIn[];
}> {
  return simulateApi(() => {
    const enriched = enrichData(getDb());
    const obj = enriched.objectives.find((o) => String(o.id) === String(id));
    if (!obj) {
      throw new Error(`Objective #${id} not found.`);
    }

    const keyResults = enriched.keyResults.filter((kr) => String(kr.objectiveId) === String(id));
    const parentObjective = obj.parentObjectiveId
      ? enriched.objectives.find((o) => String(o.id) === String(obj.parentObjectiveId))
      : undefined;
    const childObjectives = enriched.objectives.filter((o) => String(o.parentObjectiveId) === String(id));
    const approvalSteps = enriched.approvalSteps.filter((s) => String(s.objectiveId) === String(id));
    const comments = enriched.comments.filter((c) => c.objectType === 'OBJECTIVE' && String(c.objectId) === String(id));
    const attachments = enriched.attachments.filter((a) => a.objectType === 'OBJECTIVE' && String(a.objectId) === String(id));
    const scores = enriched.scores.filter((s) => String(s.objectiveId) === String(id));
    const checkIns = enriched.checkIns.filter((ci) => String(ci.objectiveId) === String(id));

    return {
      objective: obj,
      keyResults,
      parentObjective,
      childObjectives,
      approvalSteps,
      comments,
      attachments,
      scores,
      checkIns,
    };
  });
}

export interface CreateObjectiveDTO {
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
  keyResults?: Omit<KeyResult, 'id' | 'objectiveId' | 'achievementPercent' | 'status' | 'statusOverridden' | 'createdBy' | 'createdAt'>[];
}

export async function createObjective(dto: CreateObjectiveDTO, userId: number): Promise<Objective> {
  return simulateApi(() => {
    const db = getDb();
    if (!dto.title || dto.title.length < 3) {
      throw new Error('Name must be 3 to 255 characters.');
    }

    const newId = Date.now();
    const newObjective: Objective = {
      id: newId,
      cycleId: dto.cycleId,
      ownerId: dto.ownerId,
      level: dto.level,
      departmentId: dto.departmentId,
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      weightage: dto.weightage,
      parentObjectiveId: dto.parentObjectiveId,
      status: 'Draft',
      approvalState: 'NotSubmitted',
      submissionNo: 1,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    db.objectives.unshift(newObjective);

    // If initial KRs provided
    if (dto.keyResults && dto.keyResults.length > 0) {
      dto.keyResults.forEach((krDto, idx) => {
        const krId = Date.now() + idx + 10;
        const newKR: KeyResult = {
          id: krId,
          objectiveId: newId,
          ownerId: krDto.ownerId || dto.ownerId,
          name: krDto.name,
          description: krDto.description,
          measurementTypeId: krDto.measurementTypeId,
          direction: krDto.direction,
          baseline: krDto.baseline,
          target: krDto.target,
          current: krDto.baseline,
          achievementPercent: 0,
          weightage: krDto.weightage,
          startDate: krDto.startDate || dto.startDate,
          targetDate: krDto.targetDate || dto.endDate,
          status: 'On Track',
          statusOverridden: false,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };
        db.keyResults.push(newKR);
      });
    }

    logAudit('Objectives', newId, 'CREATE', userId, `Created objective "${dto.title}"`);
    saveDb();
    return newObjective;
  });
}

export async function updateObjective(
  id: number,
  dto: Partial<CreateObjectiveDTO>,
  userId: number
): Promise<Objective> {
  return simulateApi(() => {
    const db = getDb();
    const idx = db.objectives.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Objective not found');

    const existing = db.objectives[idx];
    if (existing.status !== 'Draft' && existing.approvalState !== 'Returned') {
      throw new Error('Approved objectives cannot be edited directly. Request a change instead.');
    }

    const updated: Objective = {
      ...existing,
      ...dto,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    db.objectives[idx] = updated;

    logAudit('Objectives', id, 'UPDATE', userId, `Updated objective "${updated.title}"`);
    saveDb();
    return updated;
  });
}

export async function submitObjective(id: number | string, userId: number | string): Promise<{ objective: Objective; step: ApprovalStep }> {
  return simulateApi(() => {
    const db = getDb();
    const obj = db.objectives.find((o) => String(o.id) === String(id));
    if (!obj) throw new Error('Objective not found');

    const cycle = db.cycles.find((c) => String(c.id) === String(obj.cycleId));
    if (!cycle || cycle.status !== 'Active') {
      throw new Error('Objectives can be submitted only in an Active cycle.');
    }

    const krs = db.keyResults.filter((kr) => String(kr.objectiveId) === String(id));
    if (krs.length === 0) {
      throw new Error('Add at least one Key Result before submitting.');
    }

    const validation = validateKRWeightages(krs.map((k) => k.weightage));
    if (!validation.valid) {
      throw new Error(validation.message || 'KR weightages must total 100.');
    }

    const owner = db.users.find((u) => String(u.id) === String(obj.ownerId));
    const managerId = owner?.managerId || 2; // Default to Ravi Menon if unassigned

    // Determine initial stage
    const isOwnerManager = owner?.role === 'MANAGER';
    const isOwnerAdmin = owner?.role === 'HR_ADMIN';

    let nextApprovalState: ApprovalState = 'PendingManager';
    let targetApproverId = managerId;
    let stageNum: 1 | 2 = 1;
    let stageName = 'Manager Review';

    if (isOwnerAdmin) {
      // Goes to a different HR/Admin or manager
      nextApprovalState = 'PendingHR';
      targetApproverId = 3;
      stageNum = 2;
      stageName = 'HR/Admin Review';
    } else if (isOwnerManager) {
      // Goes to manager's manager or HR
      nextApprovalState = 'PendingManager';
      targetApproverId = owner?.managerId || 4;
      stageNum = 1;
      stageName = 'Manager Review';
    }

    const wasReturned = obj.approvalState === 'Returned';
    obj.approvalState = nextApprovalState;
    obj.submissionNo = (obj.submissionNo || 1) + (wasReturned ? 1 : 0);
    obj.updatedBy = Number(userId);
    obj.updatedAt = new Date().toISOString();

    const stepId = Date.now();
    const approvalStep: ApprovalStep = {
      id: stepId,
      objectiveId: obj.id,
      cycleId: obj.cycleId,
      employeeId: obj.ownerId,
      stage: stageNum,
      stageName,
      approverId: targetApproverId,
      submissionNo: obj.submissionNo,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    db.approvalSteps.unshift(approvalStep);

    // Notify approver
    createNotification(
      targetApproverId,
      'OBJECTIVE_SUBMITTED',
      'New OKR Submitted for Review',
      `${owner?.name || 'Employee'} submitted "${obj.title}" for approval.`,
      'APPROVAL',
      stepId
    );

    logAudit('Objectives', obj.id, 'SUBMIT', Number(userId) || 1, `Submitted objective for approval (Round ${obj.submissionNo})`);
    saveDb();

    return { objective: obj, step: approvalStep };
  });
}

export async function cancelObjective(id: number | string, reason: string, userId: number | string): Promise<Objective> {
  return simulateApi(() => {
    const db = getDb();
    const obj = db.objectives.find((o) => String(o.id) === String(id));
    if (!obj) throw new Error('Objective not found');

    obj.status = 'Archived';
    obj.archiveReason = 'Cancelled';
    obj.updatedBy = Number(userId);
    obj.updatedAt = new Date().toISOString();

    logAudit('Objectives', obj.id, 'UPDATE', Number(userId) || 1, `Cancelled objective: ${reason}`);
    saveDb();
    return obj;
  });
}

export async function markObjectiveCompleted(id: number | string, userId: number | string): Promise<Objective> {
  return simulateApi(() => {
    const db = getDb();
    const obj = db.objectives.find((o) => String(o.id) === String(id));
    if (!obj) throw new Error('Objective not found');

    obj.status = 'Completed';
    obj.updatedBy = Number(userId);
    obj.updatedAt = new Date().toISOString();

    logAudit('Objectives', obj.id, 'UPDATE', Number(userId) || 1, 'Marked objective as Completed');
    saveDb();
    return obj;
  });
}

// ============================================================================
// KEY RESULTS API
// ============================================================================

export interface CreateKeyResultDTO {
  objectiveId: number;
  ownerId: number;
  name: string;
  description?: string;
  measurementTypeId: number;
  direction: KeyResult['direction'];
  baseline: number;
  target: number;
  weightage: number;
  startDate: string;
  targetDate: string;
}

export async function getKeyResultById(id: number | string): Promise<{
  keyResult: KeyResult;
  objective: Objective;
  measurements: Measurement[];
  forecast: ReturnType<typeof calculateKRForecast>;
  comments: Comment[];
  activity: AuditEntry[];
}> {
  return simulateApi(() => {
    const enriched = enrichData(getDb());
    const kr = enriched.keyResults.find((k) => String(k.id) === String(id));
    if (!kr) throw new Error(`Key Result #${id} not found.`);

    const objective = enriched.objectives.find((o) => String(o.id) === String(kr.objectiveId))!;
    const measurements = enriched.measurements
      .filter((m) => String(m.keyResultId) === String(id))
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());

    const forecast = calculateKRForecast(
      measurements,
      kr.targetDate,
      kr.baseline,
      kr.target,
      kr.direction
    );

    const comments = enriched.comments.filter((c) => c.objectType === 'KEY_RESULT' && String(c.objectId) === String(id));
    const activity = enriched.auditLog.filter(
      (a) => a.table === 'KeyResults' && String(a.recordId) === String(id)
    );

    return {
      keyResult: kr,
      objective,
      measurements,
      forecast,
      comments,
      activity,
    };
  });
}

export async function createKeyResult(dto: CreateKeyResultDTO, userId: number): Promise<KeyResult> {
  return simulateApi(() => {
    const db = getDb();
    if (dto.direction === 'INCREASE' && dto.target <= dto.baseline) {
      throw new Error('For INCREASE the target must be higher than the baseline. For DECREASE it must be lower.');
    }
    if (dto.direction === 'DECREASE' && dto.target >= dto.baseline) {
      throw new Error('For INCREASE the target must be higher than the baseline. For DECREASE it must be lower.');
    }

    const obj = db.objectives.find((o) => o.id === dto.objectiveId);
    if (obj) {
      if (new Date(dto.startDate) < new Date(obj.startDate) || new Date(dto.targetDate) > new Date(obj.endDate)) {
        throw new Error("KR dates must be inside the objective's dates.");
      }
    }

    const newId = Date.now();
    const newKR: KeyResult = {
      id: newId,
      objectiveId: dto.objectiveId,
      ownerId: dto.ownerId,
      name: dto.name,
      description: dto.description,
      measurementTypeId: dto.measurementTypeId,
      direction: dto.direction,
      baseline: dto.baseline,
      target: dto.target,
      current: dto.baseline,
      achievementPercent: 0,
      weightage: dto.weightage,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      status: 'On Track',
      statusOverridden: false,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    db.keyResults.push(newKR);

    // Record initial measurement point
    db.measurements.push({
      id: Date.now() + 1,
      keyResultId: newId,
      value: dto.baseline,
      measuredAt: new Date().toISOString(),
      recordedBy: userId,
      comment: 'Initial baseline created',
    });

    logAudit('KeyResults', newId, 'CREATE', userId, `Created KR "${dto.name}"`);
    saveDb();
    return newKR;
  });
}

export async function updateKeyResult(
  id: number,
  dto: Partial<CreateKeyResultDTO>,
  userId: number
): Promise<KeyResult> {
  return simulateApi(() => {
    const db = getDb();
    const idx = db.keyResults.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error('Key Result not found');

    const updated = {
      ...db.keyResults[idx],
      ...dto,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    db.keyResults[idx] = updated;

    logAudit('KeyResults', id, 'UPDATE', userId, `Updated KR "${updated.name}"`);
    saveDb();
    return updated;
  });
}

export async function deleteKeyResult(id: number, userId: number): Promise<{ success: boolean }> {
  return simulateApi(() => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === id);
    if (!kr) throw new Error('Key Result not found');

    db.keyResults = db.keyResults.filter((k) => k.id !== id);
    logAudit('KeyResults', id, 'DELETE', userId, `Deleted KR "${kr.name}"`);
    saveDb();
    return { success: true };
  });
}

export async function addProgressUpdate(
  krId: number,
  value: number,
  comment: string | undefined,
  userId: number,
  overrideStatus?: KRStatus,
  overrideReason?: string
): Promise<{ keyResult: KeyResult; measurement: Measurement }> {
  return simulateApi(() => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === krId);
    if (!kr) throw new Error('Key Result not found');

    const oldValue = kr.current;
    kr.current = Number(value);
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    if (overrideStatus) {
      kr.status = overrideStatus;
      kr.statusOverridden = true;
      kr.overrideReason = overrideReason;
    }

    const measurementId = Date.now();
    const measurement: Measurement = {
      id: measurementId,
      keyResultId: krId,
      value: Number(value),
      measuredAt: new Date().toISOString(),
      recordedBy: userId,
      comment,
    };
    db.measurements.push(measurement);

    // Check if status worsened and notify owner/manager
    const asOf = db.devSettings.demoDate;
    const newAch = calculateKRAchievement(kr.direction, kr.baseline, kr.target, kr.current);
    const exp = calculateExpectedProgress(kr.startDate, kr.targetDate, asOf);
    const calcStatus = calculateKRStatus(newAch, exp);

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

    logAudit('KeyResults', krId, 'UPDATE', userId, `Recorded progress update ${oldValue} -> ${value}`, [
      { column: 'current', oldValue, newValue: value },
    ]);

    saveDb();
    return { keyResult: kr, measurement };
  });
}

export async function overrideKRStatus(
  krId: number,
  status: KRStatus,
  reason: string,
  userId: number
): Promise<KeyResult> {
  return simulateApi(() => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === krId);
    if (!kr) throw new Error('Key Result not found');
    if (!reason || reason.trim() === '') {
      throw new Error('Please explain why.');
    }

    kr.status = status;
    kr.statusOverridden = true;
    kr.overrideReason = reason;
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    logAudit('KeyResults', krId, 'OVERRIDE', userId, `Status overridden to ${status}: ${reason}`);
    saveDb();
    return kr;
  });
}

export async function resetKRStatus(krId: number, userId: number): Promise<KeyResult> {
  return simulateApi(() => {
    const db = getDb();
    const kr = db.keyResults.find((k) => k.id === krId);
    if (!kr) throw new Error('Key Result not found');

    kr.statusOverridden = false;
    kr.overrideReason = undefined;
    kr.updatedBy = userId;
    kr.updatedAt = new Date().toISOString();

    const asOf = db.devSettings.demoDate;
    const ach = calculateKRAchievement(kr.direction, kr.baseline, kr.target, kr.current);
    const exp = calculateExpectedProgress(kr.startDate, kr.targetDate, asOf);
    kr.status = calculateKRStatus(ach, exp);

    logAudit('KeyResults', krId, 'UPDATE', userId, 'Reset status to automatic calculation');
    saveDb();
    return kr;
  });
}

// ============================================================================
// APPROVALS API
// ============================================================================

export async function getApprovalSteps(approverId?: number): Promise<ApprovalStep[]> {
  return simulateApi(() => {
    const db = getDb();
    if (db.devSettings.simulateEmpty) return [];

    let steps = db.approvalSteps;
    if (approverId && !db.devSettings.bypassRoleRestrictions) {
      steps = steps.filter((s) => s.approverId === approverId);
    }
    return steps;
  });
}

export async function getApprovalStepById(stepId: number | string): Promise<{
  step: ApprovalStep;
  objective: Objective;
  keyResults: KeyResult[];
  priorSteps: ApprovalStep[];
  employee: User;
}> {
  return simulateApi(() => {
    const enriched = enrichData(getDb());
    const step = enriched.approvalSteps.find((s) => String(s.id) === String(stepId));
    if (!step) throw new Error(`Approval step #${stepId} not found`);

    const objective = enriched.objectives.find((o) => String(o.id) === String(step.objectiveId))!;
    const keyResults = enriched.keyResults.filter((k) => String(k.objectiveId) === String(step.objectiveId));
    const priorSteps = enriched.approvalSteps.filter(
      (s) => String(s.objectiveId) === String(step.objectiveId) && String(s.id) !== String(stepId)
    );
    const employee = enriched.users.find((u) => String(u.id) === String(step.employeeId)) || {
      id: step.employeeId,
      name: 'Employee',
      email: '',
      role: 'EMPLOYEE',
      title: 'Staff Member',
      departmentId: 1,
      active: true,
    } as User;

    return {
      step,
      objective,
      keyResults,
      priorSteps,
      employee,
    };
  });
}

export async function approveStep(
  stepId: number | string,
  approverId: number | string,
  comments?: string
): Promise<{ step: ApprovalStep; objective: Objective; nextStep?: ApprovalStep }> {
  return simulateApi(() => {
    const db = getDb();
    const step = db.approvalSteps.find((s) => String(s.id) === String(stepId));
    if (!step) throw new Error('Approval step not found');

    const obj = db.objectives.find((o) => String(o.id) === String(step.objectiveId));
    if (!obj) throw new Error('Objective not found');

    step.status = 'APPROVED';
    step.comments = comments;
    step.decidedAt = new Date().toISOString();

    let nextStep: ApprovalStep | undefined;

    if (step.stage === 1) {
      // Manager approved -> move to Stage 2 HR Review
      obj.approvalState = 'PendingHR';
      const nextStepId = Date.now();
      nextStep = {
        id: nextStepId,
        objectiveId: obj.id,
        cycleId: obj.cycleId,
        employeeId: obj.ownerId,
        stage: 2,
        stageName: 'HR/Admin Review',
        approverId: 3, // Priya Nair (HR Admin)
        submissionNo: step.submissionNo,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      db.approvalSteps.unshift(nextStep);

      // Notify Employee and HR
      createNotification(
        obj.ownerId,
        'MANAGER_APPROVED',
        'Manager Approved Your OKR',
        `Your objective "${obj.title}" was approved by your manager and forwarded to HR.`,
        'OBJECTIVE',
        obj.id
      );
      createNotification(
        3,
        'APPROVAL_REQUEST',
        'Level 2 HR Approval Needed',
        `Objective "${obj.title}" is ready for final approval.`,
        'APPROVAL',
        nextStepId
      );
    } else {
      // Stage 2 HR approved -> Active!
      obj.approvalState = 'Approved';
      obj.status = 'Active';

      createNotification(
        obj.ownerId,
        'FINAL_APPROVAL',
        'Objective is now Active!',
        `Your objective "${obj.title}" has been approved by HR and is now Active.`,
        'OBJECTIVE',
        obj.id
      );
      createNotification(
        step.approverId,
        'FINAL_APPROVAL',
        'Objective Final Approval Completed',
        `Final approval recorded for "${obj.title}".`,
        'OBJECTIVE',
        obj.id
      );
    }

    logAudit('ApprovalSteps', step.id, 'APPROVE', Number(approverId) || 1, comments || 'Approved step');
    saveDb();
    return { step, objective: obj, nextStep };
  });
}

export async function returnStep(
  stepId: number | string,
  approverId: number | string,
  comments: string
): Promise<{ step: ApprovalStep; objective: Objective }> {
  return simulateApi(() => {
    const db = getDb();
    if (!comments || comments.trim() === '') {
      throw new Error('Please explain why.');
    }

    const step = db.approvalSteps.find((s) => String(s.id) === String(stepId));
    if (!step) throw new Error('Approval step not found');

    const obj = db.objectives.find((o) => String(o.id) === String(step.objectiveId));
    if (!obj) throw new Error('Objective not found');

    step.status = 'RETURNED';
    step.comments = comments;
    step.decidedAt = new Date().toISOString();

    obj.approvalState = 'Returned';

    createNotification(
      obj.ownerId,
      'RETURNED_FOR_CHANGES',
      'Objective Returned for Changes',
      `"${obj.title}" was returned: "${comments}"`,
      'OBJECTIVE',
      obj.id
    );

    logAudit('ApprovalSteps', step.id, 'RETURN', Number(approverId) || 1, comments);
    saveDb();
    return { step, objective: obj };
  });
}

export async function rejectStep(
  stepId: number | string,
  approverId: number | string,
  comments: string
): Promise<{ step: ApprovalStep; objective: Objective }> {
  return simulateApi(() => {
    const db = getDb();
    if (!comments || comments.trim() === '') {
      throw new Error('Please explain why.');
    }

    const step = db.approvalSteps.find((s) => String(s.id) === String(stepId));
    if (!step) throw new Error('Approval step not found');

    const obj = db.objectives.find((o) => String(o.id) === String(step.objectiveId));
    if (!obj) throw new Error('Objective not found');

    step.status = 'REJECTED';
    step.comments = comments;
    step.decidedAt = new Date().toISOString();

    obj.approvalState = 'Rejected';

    createNotification(
      obj.ownerId,
      'OBJECTIVE_REJECTED',
      'Objective Rejected',
      `"${obj.title}" was rejected: "${comments}"`,
      'OBJECTIVE',
      obj.id
    );

    logAudit('ApprovalSteps', step.id, 'REJECT', Number(approverId) || 1, comments);
    saveDb();
    return { step, objective: obj };
  });
}

export async function reassignApprover(
  stepId: number | string,
  newApproverId: number | string,
  reason: string,
  adminId: number | string
): Promise<ApprovalStep> {
  return simulateApi(() => {
    const db = getDb();
    if (!reason || reason.trim() === '') throw new Error('Please explain why.');

    const step = db.approvalSteps.find((s) => String(s.id) === String(stepId));
    if (!step) throw new Error('Approval step not found');

    const oldApproverId = step.approverId;
    step.approverId = Number(newApproverId);

    createNotification(
      Number(newApproverId),
      'APPROVER_REASSIGNED',
      'Approval Reassigned to You',
      `An objective review has been reassigned to you. Reason: ${reason}`,
      'APPROVAL',
      step.id
    );

    logAudit(
      'ApprovalSteps',
      step.id,
      'UPDATE',
      Number(adminId) || 3,
      `Reassigned approver from ${oldApproverId} to ${newApproverId}. Reason: ${reason}`
    );
    saveDb();
    return step;
  });
}

// ============================================================================
// CHECK-INS API
// ============================================================================

export async function getCheckIns(employeeId?: number): Promise<CheckIn[]> {
  return simulateApi(() => {
    const db = getDb();
    if (db.devSettings.simulateEmpty) return [];

    let list = db.checkIns;
    if (employeeId && !db.devSettings.bypassRoleRestrictions) {
      list = list.filter((ci) => ci.employeeId === employeeId);
    }
    return list;
  });
}

export interface CreateCheckInDTO {
  objectiveId: number;
  keyResultId?: number;
  employeeId: number;
  frequencyInterval: number;
  frequencyUnit: 'DAY' | 'WEEK' | 'MONTH';
  progressValue: number;
  remarks?: string;
}

export async function createCheckIn(dto: CreateCheckInDTO, userId: number): Promise<CheckIn> {
  return simulateApi(() => {
    const db = getDb();
    const newId = Date.now();

    const progressUpdate: ProgressUpdate = {
      id: Date.now() + 1,
      progressValue: dto.progressValue,
      progressPercentage: 0,
      updateDate: new Date().toISOString(),
      remarks: dto.remarks,
      submittedBy: userId,
    };

    const newCheckIn: CheckIn = {
      id: newId,
      objectiveId: dto.objectiveId,
      keyResultId: dto.keyResultId,
      employeeId: dto.employeeId,
      date: new Date().toISOString(),
      status: 'SUBMITTED',
      frequencyInterval: dto.frequencyInterval,
      frequencyUnit: dto.frequencyUnit,
      progressUpdates: [progressUpdate],
    };

    db.checkIns.unshift(newCheckIn);

    // If key result is associated, update current value as well
    if (dto.keyResultId) {
      const kr = db.keyResults.find((k) => k.id === dto.keyResultId);
      if (kr) {
        kr.current = dto.progressValue;
        db.measurements.push({
          id: Date.now() + 2,
          keyResultId: kr.id,
          value: dto.progressValue,
          measuredAt: new Date().toISOString(),
          recordedBy: userId,
          comment: dto.remarks,
        });
      }
    }

    logAudit('CheckIns', newId, 'CREATE', userId, 'Submitted periodic check-in');
    saveDb();
    return newCheckIn;
  });
}

export async function markCheckInReviewed(
  checkInId: number,
  managerId: number,
  remarks?: string
): Promise<CheckIn> {
  return simulateApi(() => {
    const db = getDb();
    const ci = db.checkIns.find((c) => c.id === checkInId);
    if (!ci) throw new Error('Check-in not found');

    ci.status = 'REVIEWED';
    ci.reviewedBy = managerId;
    ci.reviewedAt = new Date().toISOString();
    ci.reviewRemarks = remarks;

    createNotification(
      ci.employeeId,
      'CHECK_IN_REVIEWED',
      'Check-in Reviewed',
      'Your manager has reviewed your recent check-in.',
      'CHECK_IN',
      checkInId
    );

    logAudit('CheckIns', checkInId, 'UPDATE', managerId, remarks || 'Marked check-in as reviewed');
    saveDb();
    return ci;
  });
}

// ============================================================================
// SCORES API
// ============================================================================

export async function getScores(cycleId?: number | string): Promise<Score[]> {
  return simulateApi(() => {
    const db = getDb();
    if (db.devSettings.simulateEmpty) return [];

    let scores = db.scores;
    if (cycleId) {
      scores = scores.filter((s) => String(s.cycleId) === String(cycleId));
    }
    return scores;
  });
}

export async function recalculateScores(cycleId: number | string, userId: number | string): Promise<Score[]> {
  return simulateApi(() => {
    const enriched = enrichData(getDb());
    const db = getDb();

    // Group active objectives by owner in cycle
    const cycleObjs = enriched.objectives.filter(
      (o) => String(o.cycleId) === String(cycleId) && (o.status === 'Active' || o.status === 'Completed')
    );

    const userMap = new Map<number | string, Objective[]>();
    for (const obj of cycleObjs) {
      const list = userMap.get(obj.ownerId) || [];
      list.push(obj);
      userMap.set(obj.ownerId, list);
    }

    userMap.forEach((objs, ownerId) => {
      const weightedSum = objs.reduce((acc, o) => acc + (o.progress || 0) * (o.weightage / 100), 0);
      const rawAchievement = Math.round(weightedSum * 100) / 100;
      const scoreVal = rawAchievement;

      // Update or create CALCULATED score - NEVER overwrite or change FINAL score
      const existingIdx = db.scores.findIndex(
        (s) => String(s.cycleId) === String(cycleId) && String(s.ownerId) === String(ownerId) && s.scoreType === 'CALCULATED'
      );

      if (existingIdx !== -1) {
        db.scores[existingIdx].calculatedScore = scoreVal;
        db.scores[existingIdx].rawAchievementPercent = rawAchievement;
        db.scores[existingIdx].createdAt = new Date().toISOString();
      } else {
        db.scores.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          cycleId: Number(cycleId),
          ownerId: Number(ownerId),
          rawAchievementPercent: rawAchievement,
          calculatedScore: scoreVal,
          scoreType: 'CALCULATED',
          createdAt: new Date().toISOString(),
        });
      }
    });

    logAudit('Scores', Number(cycleId), 'UPDATE', Number(userId) || 3, 'Recalculated scores for cycle');
    saveDb();
    return db.scores.filter((s) => String(s.cycleId) === String(cycleId));
  });
}

export async function recordFinalScore(
  cycleId: number | string,
  ownerId: number | string,
  score: number,
  recordedBy: number | string
): Promise<Score> {
  return simulateApi(() => {
    const db = getDb();
    const existing = db.scores.find(
      (s) => String(s.cycleId) === String(cycleId) && String(s.ownerId) === String(ownerId) && s.scoreType === 'FINAL'
    );
    if (existing) {
      throw new Error('A FINAL score is already recorded and cannot be altered.');
    }

    // Get current raw achievement from CALCULATED score if available, or fallback to score
    const calcScore = db.scores.find(
      (s) => String(s.cycleId) === String(cycleId) && String(s.ownerId) === String(ownerId) && s.scoreType === 'CALCULATED'
    );
    const rawAchievement = calcScore ? calcScore.rawAchievementPercent : score;

    const newScore: Score = {
      id: Date.now(),
      cycleId: Number(cycleId),
      ownerId: Number(ownerId),
      rawAchievementPercent: rawAchievement,
      calculatedScore: Number(score),
      scoreType: 'FINAL',
      createdAt: new Date().toISOString(),
      recordedBy: Number(recordedBy),
    };

    db.scores.push(newScore);

    createNotification(
      Number(ownerId),
      'FINAL_SCORE_RECORDED',
      'Final Score Recorded',
      `Your final OKR score of ${score} has been officially recorded by HR.`,
      'SCORE',
      newScore.id
    );

    logAudit('Scores', newScore.id, 'CREATE', Number(recordedBy) || 3, `Recorded FINAL score ${score} for user #${ownerId}`);
    saveDb();
    return newScore;
  });
}

// ============================================================================
// PERFORMANCE REVIEWS API
// ============================================================================

export async function getPerformanceReviewCycles(): Promise<PerformanceReviewCycle[]> {
  return simulateApi(() => getDb().reviewCycles);
}

export async function getEvaluations(cycleId?: number, userId?: number): Promise<PerformanceEvaluation[]> {
  return simulateApi(() => {
    const db = getDb();
    let evals = db.evaluations;
    if (cycleId) evals = evals.filter((e) => e.reviewCycleId === cycleId);
    if (userId && !db.devSettings.bypassRoleRestrictions) {
      evals = evals.filter((e) => e.employeeId === userId || e.evaluatorId === userId);
    }
    return evals;
  });
}

export async function getEvaluationCriteria(): Promise<EvaluationCriteria[]> {
  return simulateApi(() => getDb().criteria);
}

export async function submitEvaluation(
  evaluation: PerformanceEvaluation,
  userId: number
): Promise<PerformanceEvaluation> {
  return simulateApi(() => {
    const db = getDb();
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
    return saved;
  });
}

// ============================================================================
// TEMPLATES, CYCLES, MASTER DATA, AUDIT, NOTIFICATIONS
// ============================================================================

export async function getTemplates(): Promise<Template[]> {
  return simulateApi(() => getDb().templates);
}

export async function getCycles(): Promise<Cycle[]> {
  return simulateApi(() => getDb().cycles);
}

export async function createCycle(cycleData: Omit<Cycle, 'id'>, userId: number): Promise<Cycle> {
  return simulateApi(() => {
    const db = getDb();
    // Validate overlap
    const newStart = new Date(cycleData.startDate).getTime();
    const newEnd = new Date(cycleData.endDate).getTime();

    for (const c of db.cycles) {
      const cStart = new Date(c.startDate).getTime();
      const cEnd = new Date(c.endDate).getTime();
      if ((newStart >= cStart && newStart <= cEnd) || (newEnd >= cStart && newEnd <= cEnd)) {
        throw new Error(`These dates overlap the cycle ${c.name}.`);
      }
    }

    const newCycle: Cycle = {
      id: Date.now(),
      ...cycleData,
    };
    db.cycles.push(newCycle);

    logAudit('Cycles', newCycle.id, 'CREATE', userId, `Created cycle "${newCycle.name}"`);
    saveDb();
    return newCycle;
  });
}

export async function getDepartments(): Promise<Department[]> {
  return simulateApi(() => getDb().departments);
}

export async function getUsers(): Promise<User[]> {
  return simulateApi(() => getDb().users);
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  return simulateApi(() => getDb().auditLog);
}

export async function getNotifications(userId: number): Promise<Notification[]> {
  return simulateApi(() => {
    const db = getDb();
    if (db.devSettings.simulateEmpty) return [];
    return db.notifications.filter((n) => n.employeeId === userId);
  });
}

export async function markNotificationRead(id: number): Promise<void> {
  return simulateApi(() => {
    const db = getDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveDb();
    }
  });
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  return simulateApi(() => {
    const db = getDb();
    db.notifications.forEach((n) => {
      if (n.employeeId === userId) n.read = true;
    });
    saveDb();
  });
}

export async function addComment(
  objectType: Comment['objectType'],
  objectId: number | string,
  authorId: number | string,
  text: string,
  visibility: 'PUBLIC' | 'CONFIDENTIAL'
): Promise<Comment> {
  return simulateApi(() => {
    const db = getDb();
    const newComment: Comment = {
      id: Date.now(),
      objectType,
      objectId: Number(objectId),
      authorId: Number(authorId),
      text,
      visibility,
      createdAt: new Date().toISOString(),
    };
    db.comments.unshift(newComment);
    logAudit('Comments', newComment.id, 'CREATE', Number(authorId) || 1, 'Added comment');
    saveDb();
    return newComment;
  });
}

export async function getDevSettings(): Promise<DevSettings> {
  return simulateApi(() => getDb().devSettings);
}

export async function updateDevSettings(settings: Partial<DevSettings>): Promise<DevSettings> {
  return simulateApi(() => {
    const db = getDb();
    db.devSettings = { ...db.devSettings, ...settings };
    saveDb();
    return db.devSettings;
  });
}

export async function resetDemoData(): Promise<void> {
  return simulateApi(() => {
    resetDb();
  });
}

// ============================================================================
// TEMPLATES MANAGEMENT
// ============================================================================

export async function createTemplate(
  templateData: Omit<Template, 'id' | 'version'>,
  userId: number
): Promise<Template> {
  return simulateApi(() => {
    const db = getDb();
    const newTemplate: Template = {
      id: Date.now(),
      version: 1,
      ...templateData,
    };
    db.templates.push(newTemplate);
    logAudit('Templates', newTemplate.id, 'CREATE', userId, `Created template "${newTemplate.name}"`);
    saveDb();
    return newTemplate;
  });
}

export async function updateTemplate(
  id: number,
  templateData: Partial<Template>,
  userId: number
): Promise<Template> {
  return simulateApi(() => {
    const db = getDb();
    const idx = db.templates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Template not found');

    db.templates[idx] = { ...db.templates[idx], ...templateData };
    logAudit('Templates', id, 'UPDATE', userId, `Updated template "${db.templates[idx].name}"`);
    saveDb();
    return db.templates[idx];
  });
}

export async function createTemplateVersion(id: number, userId: number): Promise<Template> {
  return simulateApi(() => {
    const db = getDb();
    const existing = db.templates.find((t) => t.id === id);
    if (!existing) throw new Error('Template not found');

    const newVersion: Template = {
      ...existing,
      id: Date.now(),
      version: existing.version + 1,
      name: `${existing.name.replace(/\sv\d+$/, '')} v${existing.version + 1}`,
      status: 'ACTIVE',
    };

    // Deactivate previous version
    existing.status = 'INACTIVE';

    db.templates.push(newVersion);
    logAudit('Templates', newVersion.id, 'CREATE', userId, `Created new version v${newVersion.version} of "${existing.name}"`);
    saveDb();
    return newVersion;
  });
}

// ============================================================================
// WORKFLOWS MANAGEMENT
// ============================================================================

export async function getWorkflows(): Promise<Workflow[]> {
  return simulateApi(() => getDb().workflows);
}

export async function updateWorkflow(
  id: number,
  workflowData: Partial<Workflow>,
  userId: number
): Promise<Workflow> {
  return simulateApi(() => {
    const db = getDb();
    const idx = db.workflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('Workflow not found');

    db.workflows[idx] = { ...db.workflows[idx], ...workflowData };
    logAudit('Workflows', id, 'UPDATE', userId, `Updated workflow "${db.workflows[idx].name}"`);
    saveDb();
    return db.workflows[idx];
  });
}

// ============================================================================
// MASTER DATA MANAGEMENT
// ============================================================================

export async function getMeasurementTypes(): Promise<MeasurementType[]> {
  return simulateApi(() => getDb().measurementTypes);
}

export async function createDepartment(
  name: string,
  description: string | undefined,
  userId: number
): Promise<Department> {
  return simulateApi(() => {
    const db = getDb();
    if (db.departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Department "${name}" already exists.`);
    }

    const newDept: Department = {
      id: Date.now(),
      name,
      description,
    };
    db.departments.push(newDept);
    logAudit('Departments', newDept.id, 'CREATE', userId, `Created department "${name}"`);
    saveDb();
    return newDept;
  });
}

export async function deleteDepartment(id: number, userId: number): Promise<void> {
  return simulateApi(() => {
    const db = getDb();
    // Check if in use
    const inUse = db.objectives.some((o) => o.departmentId === id) || db.users.some((u) => u.departmentId === id);
    if (inUse) {
      throw new Error('Department is in use and cannot be deleted.');
    }

    db.departments = db.departments.filter((d) => d.id !== id);
    logAudit('Departments', id, 'DELETE', userId, `Deleted department #${id}`);
    saveDb();
  });
}

export async function createMeasurementType(
  name: MeasurementType['name'],
  unitSymbol: string | undefined,
  userId: number
): Promise<MeasurementType> {
  return simulateApi(() => {
    const db = getDb();
    if (db.measurementTypes.some((m) => m.name === name)) {
      throw new Error(`Measurement type "${name}" already exists.`);
    }

    const newType: MeasurementType = {
      id: Date.now(),
      name,
      unitSymbol,
    };
    db.measurementTypes.push(newType);
    logAudit('MeasurementTypes', newType.id, 'CREATE', userId, `Created measurement type "${name}"`);
    saveDb();
    return newType;
  });
}

export async function deleteMeasurementType(id: number, userId: number): Promise<void> {
  return simulateApi(() => {
    const db = getDb();
    const inUse = db.keyResults.some((k) => k.measurementTypeId === id);
    if (inUse) {
      throw new Error('Measurement type is assigned to Key Results and cannot be deleted.');
    }

    db.measurementTypes = db.measurementTypes.filter((m) => m.id !== id);
    logAudit('MeasurementTypes', id, 'DELETE', userId, `Deleted measurement type #${id}`);
    saveDb();
  });
}

export async function createEvaluationCriteria(
  name: string,
  description: string,
  weightage: number,
  userId: number
): Promise<EvaluationCriteria> {
  return simulateApi(() => {
    const db = getDb();
    if (db.criteria.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Criteria "${name}" already exists.`);
    }

    const newCrit: EvaluationCriteria = {
      id: Date.now(),
      name,
      description,
      weightage,
    };
    db.criteria.push(newCrit);
    logAudit('EvaluationCriteria', newCrit.id, 'CREATE', userId, `Created criteria "${name}"`);
    saveDb();
    return newCrit;
  });
}

export async function deleteEvaluationCriteria(id: number, userId: number): Promise<void> {
  return simulateApi(() => {
    const db = getDb();
    db.criteria = db.criteria.filter((c) => c.id !== id);
    logAudit('EvaluationCriteria', id, 'DELETE', userId, `Deleted evaluation criteria #${id}`);
    saveDb();
  });
}

