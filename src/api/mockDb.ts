import {
  User,
  Department,
  Cycle,
  MeasurementType,
  Objective,
  KeyResult,
  Measurement,
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
  PerformanceReviewCycle,
  PerformanceEvaluation,
  EvaluationCriteria,
  NotificationPreference,
  KRStatus,
  MeetingItem,
  FeedMoment,
  TaskItem,
} from '../types';

import {
  INITIAL_DEMO_DATE,
  SEED_USERS,
  SEED_DEPARTMENTS,
  SEED_CYCLES,
  SEED_MEASUREMENT_TYPES,
  SEED_WORKFLOWS,
  SEED_OBJECTIVES,
  SEED_KEY_RESULTS,
  SEED_MEASUREMENTS,
  SEED_APPROVAL_STEPS,
  SEED_CHECKINS,
  SEED_COMMENTS,
  SEED_ATTACHMENTS,
  SEED_SCORES,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOG,
  SEED_TEMPLATES,
  SEED_REVIEW_CYCLES,
  SEED_CRITERIA,
  SEED_EVALUATIONS,
  SEED_PREFERENCES,
  SEED_MEETINGS,
  SEED_FEEDS,
  SEED_TASKS,
  SEED_DISCIPLINE,
  CheckInDisciplineRecord,
} from './seedData';

import {
  calculateKRAchievement,
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculateKRStatus,
  calculateObjectiveHealth,
  isKRDelayed,
} from '../lib/calculations';

const STORAGE_KEY = 'okr_system_db_v2';

export interface DevSettings {
  simulatedLatency: number; // in ms
  simulateError: boolean;
  simulateEmpty: boolean;
  demoDate: string;
  bypassRoleRestrictions: boolean;
}

export interface DatabaseState {
  users: User[];
  departments: Department[];
  cycles: Cycle[];
  measurementTypes: MeasurementType[];
  workflows: Workflow[];
  objectives: Objective[];
  keyResults: KeyResult[];
  measurements: Measurement[];
  approvalSteps: ApprovalStep[];
  checkIns: CheckIn[];
  comments: Comment[];
  attachments: Attachment[];
  scores: Score[];
  notifications: Notification[];
  auditLog: AuditEntry[];
  templates: Template[];
  reviewCycles: PerformanceReviewCycle[];
  criteria: EvaluationCriteria[];
  evaluations: PerformanceEvaluation[];
  preferences: NotificationPreference[];
  meetings: MeetingItem[];
  feeds: FeedMoment[];
  tasks: TaskItem[];
  discipline: CheckInDisciplineRecord[];
  devSettings: DevSettings;
}

const DEFAULT_DEV_SETTINGS: DevSettings = {
  simulatedLatency: 400,
  simulateError: false,
  simulateEmpty: false,
  demoDate: INITIAL_DEMO_DATE,
  bypassRoleRestrictions: false,
};

function getInitialState(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.objectives)) {
        if (!parsed.scores || parsed.scores.length === 0) {
          parsed.scores = SEED_SCORES;
        }
        if (!parsed.meetings) parsed.meetings = SEED_MEETINGS;
        if (!parsed.feeds) parsed.feeds = SEED_FEEDS;
        if (!parsed.tasks) parsed.tasks = SEED_TASKS;
        if (!parsed.discipline) parsed.discipline = SEED_DISCIPLINE;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }

  return {
    users: SEED_USERS,
    departments: SEED_DEPARTMENTS,
    cycles: SEED_CYCLES,
    measurementTypes: SEED_MEASUREMENT_TYPES,
    workflows: SEED_WORKFLOWS,
    objectives: SEED_OBJECTIVES,
    keyResults: SEED_KEY_RESULTS,
    measurements: SEED_MEASUREMENTS,
    approvalSteps: SEED_APPROVAL_STEPS,
    checkIns: SEED_CHECKINS,
    comments: SEED_COMMENTS,
    attachments: SEED_ATTACHMENTS,
    scores: SEED_SCORES,
    notifications: SEED_NOTIFICATIONS,
    auditLog: SEED_AUDIT_LOG,
    templates: SEED_TEMPLATES,
    reviewCycles: SEED_REVIEW_CYCLES,
    criteria: SEED_CRITERIA,
    evaluations: SEED_EVALUATIONS,
    preferences: SEED_PREFERENCES,
    meetings: SEED_MEETINGS,
    feeds: SEED_FEEDS,
    tasks: SEED_TASKS,
    discipline: SEED_DISCIPLINE,
    devSettings: DEFAULT_DEV_SETTINGS,
  };
}

let dbState: DatabaseState = getInitialState();

export function saveDb(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getDb(): DatabaseState {
  return dbState;
}

export function resetDb(): void {
  localStorage.removeItem(STORAGE_KEY);
  dbState = {
    users: SEED_USERS,
    departments: SEED_DEPARTMENTS,
    cycles: SEED_CYCLES,
    measurementTypes: SEED_MEASUREMENT_TYPES,
    workflows: SEED_WORKFLOWS,
    objectives: SEED_OBJECTIVES,
    keyResults: SEED_KEY_RESULTS,
    measurements: SEED_MEASUREMENTS,
    approvalSteps: SEED_APPROVAL_STEPS,
    checkIns: SEED_CHECKINS,
    comments: SEED_COMMENTS,
    attachments: SEED_ATTACHMENTS,
    scores: SEED_SCORES,
    notifications: SEED_NOTIFICATIONS,
    auditLog: SEED_AUDIT_LOG,
    templates: SEED_TEMPLATES,
    reviewCycles: SEED_REVIEW_CYCLES,
    criteria: SEED_CRITERIA,
    evaluations: SEED_EVALUATIONS,
    preferences: SEED_PREFERENCES,
    meetings: SEED_MEETINGS,
    feeds: SEED_FEEDS,
    tasks: SEED_TASKS,
    discipline: SEED_DISCIPLINE,
    devSettings: DEFAULT_DEV_SETTINGS,
  };
  saveDb();
}

/**
 * Recalculate KR and Objective computed metrics based on the current demoDate
 */
export function enrichData(state: DatabaseState) {
  const asOfDate = state.devSettings.demoDate;
  const objectiveMap = new Map(state.objectives.map((o) => [o.id, o]));

  // Enrich each Key Result
  const enrichedKRs = state.keyResults.map((kr) => {
    const parentObj = objectiveMap.get(kr.objectiveId);
    const isDraft = parentObj?.status === 'Draft';

    if (isDraft) {
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
    const exp = calculateExpectedProgress(kr.startDate, kr.targetDate, asOfDate);
    const delayed = isKRDelayed(kr.targetDate, ach, asOfDate);

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

  // Enrich each Objective
  const enrichedObjectives = state.objectives.map((obj) => {
    const isDraft = obj.status === 'Draft';
    if (isDraft) {
      return {
        ...obj,
        progress: 0,
        health: undefined, // No pace or health calculated for draft
        canCheckIn: false,
      };
    }

    const krs = enrichedKRs.filter((k) => k.objectiveId === obj.id);
    const progress = calculateObjectiveProgress(krs);
    const expected = calculateExpectedProgress(obj.startDate, obj.endDate, asOfDate);
    const health = obj.status === 'Active' ? calculateObjectiveHealth(progress, expected) : undefined;

    return {
      ...obj,
      progress,
      health,
      canCheckIn: obj.status === 'Active',
    };
  });

  state.keyResults = enrichedKRs;
  state.objectives = enrichedObjectives;

  return {
    ...state,
    keyResults: enrichedKRs,
    objectives: enrichedObjectives,
  };
}

export function logAudit(
  table: string,
  recordId: number,
  action: AuditEntry['action'],
  actionBy: number,
  remarks?: string,
  details?: AuditEntry['details']
) {
  const entry: AuditEntry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    table,
    recordId,
    action,
    actionBy,
    actionAt: new Date().toISOString(),
    remarks,
    details,
  };
  dbState.auditLog.unshift(entry);
  saveDb();
}

export function createNotification(
  employeeId: number,
  type: string,
  title: string,
  message: string,
  objectType: string,
  objectId: number
) {
  const notif: Notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    employeeId,
    type,
    title,
    message,
    objectType,
    objectId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  dbState.notifications.unshift(notif);
  saveDb();
}
