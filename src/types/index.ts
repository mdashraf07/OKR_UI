export type Role = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  title: string;
  departmentId: number;
  managerId?: number;
  active: boolean;
  avatar?: string;
  employeeCode?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Cycle {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  ownerId: number;
}

export type ObjectiveLevel = 'Organization' | 'Department' | 'Team' | 'Individual';
export type ObjectiveLifecycleStatus = 'Draft' | 'Active' | 'Completed' | 'Archived';
export type ApprovalState = 'NotSubmitted' | 'PendingManager' | 'PendingHR' | 'Returned' | 'Rejected' | 'Approved';
export type ObjectiveHealth = 'On Track' | 'At Risk' | 'In Trouble';
export type PerspectiveType = 'Customer' | 'Financial' | 'Internal Business Processes' | 'Learning & Growth';
export type VisibilityType = 'Public' | 'Department' | 'Private';
export type PriorityType = 'High' | 'Medium' | 'Low';

export interface Objective {
  id: number;
  cycleId: number;
  ownerId: number;
  level: ObjectiveLevel;
  departmentId?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  weightage: number; // 0 to 100
  status: ObjectiveLifecycleStatus;
  archiveReason?: 'Cancelled' | 'Archived';
  approvalState: ApprovalState;
  submissionNo: number;
  parentObjectiveId?: number;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt?: string;
  // Computed / aggregated fields
  progress?: number;
  health?: ObjectiveHealth;
  // Profit.co OKR enhancements
  perspective?: PerspectiveType;
  visibility?: VisibilityType;
  priority?: PriorityType;
  tags?: string[];
  alignedObjectiveIds?: number[];
  canCheckIn?: boolean;
}

export type MeasurementTypeName = 'Number' | 'Currency' | 'Percentage';

export interface MeasurementType {
  id: number;
  name: MeasurementTypeName;
  unitSymbol?: string;
}

export type KRDirection = 'INCREASE' | 'DECREASE';
export type KRStatus = 'On Track' | 'At Risk' | 'In Trouble' | 'Completed';
export type CheckInFrequency =
  | 'Every Day'
  | 'Every Monday'
  | 'Every Tuesday'
  | 'Every Wednesday'
  | 'Every Thursday'
  | 'Every Friday'
  | 'Every Saturday'
  | 'Every Sunday'
  | 'Bi-weekly'
  | 'Monthly';

export interface KeyResult {
  id: number;
  objectiveId: number;
  ownerId: number;
  name: string;
  description?: string;
  measurementTypeId: number;
  direction: KRDirection;
  baseline: number;
  target: number;
  current: number;
  achievementPercent: number; // 0 to 100, calculated
  weightage: number;          // 0 to 100
  startDate: string;          // inside the objective dates
  targetDate: string;         // inside the objective dates
  status: KRStatus;
  statusOverridden: boolean;
  overrideReason?: string;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt?: string;
  // Computed
  isDelayed?: boolean;
  expectedPercent?: number;
  // Profit.co OKR enhancements
  kpiName?: string;
  checkInFrequency?: CheckInFrequency;
  frequencyType?: string;
  visibility?: VisibilityType;
  priority?: PriorityType;
  tags?: string[];
  alignedObjectiveId?: number;
  alignedObjectiveName?: string;
  alignedDepartmentName?: string;
  contributorIds?: number[];
  allowTeamCheckIn?: boolean;
  checkInApprovalRequired?: boolean;
  canCheckIn?: boolean;
}

export interface Measurement {
  id: number;
  keyResultId: number;
  value: number;
  previousValue?: number;
  progress?: number;
  measuredAt: string;
  recordedBy: number;
  comment?: string;
}

export interface ApprovalStep {
  id: number;
  objectiveId: number;
  cycleId: number;
  employeeId: number;
  stage: 1 | 2;
  stageName: string;
  approverId: number;
  submissionNo: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  comments?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface ProgressUpdate {
  id: number;
  progressValue: number;
  progressPercentage: number;
  updateDate: string;
  remarks?: string;
  submittedBy: number;
}

export interface CheckIn {
  id: number;
  objectiveId: number;
  keyResultId?: number;
  employeeId: number;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED';
  frequencyInterval: number;
  frequencyUnit: 'DAY' | 'WEEK' | 'MONTH';
  progressUpdates: ProgressUpdate[];
  reviewedBy?: number;
  reviewedAt?: string;
  reviewRemarks?: string;
  // Profit.co OKR check-in enhancements
  planValue?: number;
  actualValue?: number;
  deltaValue?: number;
  deltaPercentage?: number;
  calculatedHealth?: KRStatus;
  overrideHealth?: KRStatus;
  overrideReason?: string;
  statusBannerText?: string;
  remarks?: string;
  attachmentType?: 'text' | 'voice' | 'video' | 'file';
  authorName?: string;
  stageChangeText?: string;
}

export interface Comment {
  id: number;
  objectType: 'OBJECTIVE' | 'KEY_RESULT' | 'CHECK_IN' | 'PERFORMANCE_REVIEW';
  objectId: number;
  authorId: number;
  text: string;
  visibility: 'PUBLIC' | 'CONFIDENTIAL';
  createdAt: string;
}

export interface Attachment {
  id: number;
  objectType: 'OBJECTIVE' | 'KEY_RESULT' | 'CHECK_IN' | 'PERFORMANCE_REVIEW';
  objectId: number;
  uploadedBy: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Score {
  id: number;
  cycleId: number;
  objectiveId?: number;
  ownerId: number;
  rawAchievementPercent: number;
  calculatedScore: number;
  scoreType: 'CALCULATED' | 'FINAL';
  createdAt: string;
  recordedBy?: number;
}

export interface Notification {
  id: number;
  employeeId: number;
  type: string;
  title: string;
  message: string;
  objectType: string;
  objectId: number;
  read: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  table: string;
  recordId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RETURN' | 'OVERRIDE';
  actionBy: number;
  actionAt: string;
  remarks?: string;
  details?: { column: string; oldValue?: unknown; newValue?: unknown }[];
}

export interface TemplateKR {
  name: string;
  measurementTypeId: number;
  direction: KRDirection;
  baseline: number;
  target: number;
  weightage: number;
}

export interface TemplateObjective {
  title: string;
  description: string;
  level: ObjectiveLevel;
  displayOrder: number;
  keyResults: TemplateKR[];
}

export interface TemplateAssignment {
  type: 'DEPARTMENT' | 'ROLE' | 'LEVEL';
  targetId: number | string;
}

export interface Template {
  id: number;
  name: string;
  version: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  objectives: TemplateObjective[];
  assignments: TemplateAssignment[];
}

export interface WorkflowStage {
  stage: 1 | 2;
  stageName: string;
  level: number;
  approverRole: Role;
}

export interface Workflow {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  stages: WorkflowStage[];
}

export interface PerformanceReviewCycle {
  id: number;
  name: string;
  cycleId: number;
  status: 'Draft' | 'Active' | 'Completed';
  startDate: string;
  endDate: string;
}

export interface EvaluationCriteria {
  id: number;
  name: string;
  description: string;
  weightage: number;
}

export interface EvaluationResponse {
  criteriaId: number;
  criteriaName: string;
  responseText: string;
  score: number;  // 0 to 100
  rating: number; // 0 to 5
}

export interface PerformanceEvaluation {
  id: number;
  reviewCycleId: number;
  employeeId: number;
  evaluatorId: number;
  evalType: 'SELF' | 'MANAGER' | 'FINAL';
  status: 'DRAFT' | 'SUBMITTED';
  responses: EvaluationResponse[];
  overallScore?: number;
  overallRating?: number;
  submittedAt?: string;
  comments?: string;
}

export interface NotificationPreference {
  employeeId: number;
  notificationType: string;
  label: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface MeetingItem {
  id: number;
  title: string;
  type: '1-on-1' | 'Team Sync' | 'OKR Review' | 'Quarterly Planning';
  date: string;
  time: string;
  durationMinutes: number;
  organizerId: number;
  attendeeIds: number[];
  meetingLink?: string;
  notes?: string;
}

export interface FeedMoment {
  id: number;
  authorId: number;
  type: 'Announcement' | 'Recognition' | 'Milestone';
  title: string;
  content: string;
  badge?: string;
  targetUserId?: number;
  likes: number;
  likedByCurrentUser?: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface TaskItem {
  id: number;
  title: string;
  assignedToId: number;
  status: 'Open' | 'In Progress' | 'Completed';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  linkedObjectiveId?: number;
}
