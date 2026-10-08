# API Contract (Mock Service Layer)

All API methods in `src/api` return Promises with simulated latency (300ms to 800ms) and persist state to `localStorage`.

---

### Objectives
- `getObjectives(params: { cycleId?: number; ownerId?: number; departmentId?: number; status?: string; health?: string }): Promise<Objective[]>`
- `getObjectiveById(id: number): Promise<{ objective: Objective; keyResults: KeyResult[]; alignments: { parent?: Objective; children: Objective[] }; approvals: ApprovalStep[]; history: ProgressUpdate[] }>`
- `createObjective(payload: CreateObjectiveDTO): Promise<Objective>`
- `updateObjective(id: number, payload: Partial<CreateObjectiveDTO>): Promise<Objective>`
- `submitObjective(id: number, userId: number): Promise<{ objective: Objective; approvalStep: ApprovalStep }>`
- `cancelObjective(id: number, reason: string): Promise<Objective>`
- `markObjectiveCompleted(id: number): Promise<Objective>`

### Key Results
- `getKeyResultById(id: number): Promise<KeyResult>`
- `createKeyResult(payload: CreateKeyResultDTO): Promise<KeyResult>`
- `updateKeyResult(id: number, payload: Partial<CreateKeyResultDTO>): Promise<KeyResult>`
- `deleteKeyResult(id: number): Promise<{ success: boolean }>`
- `addProgressUpdate(krId: number, payload: { value: number; updateDate: string; remarks?: string; recordedBy: number }): Promise<{ keyResult: KeyResult; update: ProgressUpdate }>`
- `overrideKrStatus(krId: number, payload: { status: KRStatus; reason: string; userId: number }): Promise<KeyResult>`
- `resetKrStatus(krId: number): Promise<KeyResult>`

### Approvals
- `getApprovalSteps(params: { approverId?: number; role?: string; status?: string }): Promise<ApprovalStep[]>`
- `getApprovalStepById(stepId: number): Promise<{ step: ApprovalStep; objective: Objective; keyResults: KeyResult[]; priorSteps: ApprovalStep[] }>`
- `approveStep(stepId: number, approverId: number, comments?: string): Promise<{ step: ApprovalStep; nextStep?: ApprovalStep; objective: Objective }>`
- `returnStep(stepId: number, approverId: number, comments: string): Promise<{ step: ApprovalStep; objective: Objective }>`
- `rejectStep(stepId: number, approverId: number, comments: string): Promise<{ step: ApprovalStep; objective: Objective }>`
- `reassignApprover(stepId: number, newApproverId: number, reason: string, adminId: number): Promise<ApprovalStep>`

### Check-ins
- `getCheckIns(params: { employeeId?: number; cycleId?: number }): Promise<CheckIn[]>`
- `createCheckIn(payload: CreateCheckInDTO): Promise<CheckIn>`
- `markCheckInReviewed(checkInId: number, managerId: number): Promise<CheckIn>`

### Scores
- `getScores(cycleId: number): Promise<Score[]>`
- `recalculateScores(cycleId: number): Promise<Score[]>`
- `recordFinalScore(cycleId: number, ownerId: number, score: number, recordedBy: number): Promise<Score>`

### Reviews & Evaluations
- `getPerformanceCycles(): Promise<PerformanceReviewCycle[]>`
- `getEvaluations(cycleId: number, userId?: number): Promise<PerformanceEvaluation[]>`
- `saveEvaluationDraft(payload: Partial<PerformanceEvaluation>): Promise<PerformanceEvaluation>`
- `submitEvaluation(payload: PerformanceEvaluation): Promise<PerformanceEvaluation>`

### Master Data & Config
- `getCycles(): Promise<Cycle[]>`
- `createCycle(cycle: Omit<Cycle, 'id'>): Promise<Cycle>`
- `updateCycle(id: number, cycle: Partial<Cycle>): Promise<Cycle>`
- `getTemplates(): Promise<Template[]>`
- `getWorkflows(): Promise<Workflow[]>`
- `getMasterData(): Promise<MasterData>`
- `getAuditLog(): Promise<AuditEntry[]>`
- `getNotifications(userId: number): Promise<Notification[]>`
- `markNotificationRead(id: number): Promise<void>`
- `markAllNotificationsRead(userId: number): Promise<void>`
- `resetDemoData(): Promise<void>`
