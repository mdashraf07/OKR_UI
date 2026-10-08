import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  MessageSquare,
  FileText,
  Clock,
  Layers,
  TrendingUp,
  User,
  ArrowRight,
  Shield,
  HelpCircle,
  Paperclip,
  Target,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import {
  getObjectiveById,
  submitObjective,
  cancelObjective,
  markObjectiveCompleted,
  addComment,
  createKeyResult,
} from '../../api';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import {
  Objective,
  KeyResult,
  ApprovalStep,
  Comment as CommentType,
  Attachment,
  Score,
  CheckIn,
} from '../../types';
import {
  ObjectiveStatusPill,
  ObjectiveHealthChip,
  KRStatusChip,
  ApprovalChip,
} from '../../components/ui/Chips';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToastStore } from '../../components/ui/Toast';
import { KeyResultDrawer, KeyResultFormData } from '../key-result/KeyResultDrawer';
import { UpdateProgressDrawer } from '../progress/UpdateProgressDrawer';
import { calculateExpectedProgress, formatValueWithUnit } from '../../lib/calculations';
import { ItemNotFound } from '../../components/common/ItemNotFound';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const ObjectiveDetailsPage: React.FC = () => {
  const { objectiveId } = useParams<{ objectiveId: string }>();
  const id = String(objectiveId || '');
  const { currentUser, selectedCycleId } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [data, setData] = useState<{
    objective: Objective;
    keyResults: KeyResult[];
    parentObjective?: Objective;
    childObjectives: Objective[];
    approvalSteps: ApprovalStep[];
    comments: CommentType[];
    attachments: Attachment[];
    scores: Score[];
    checkIns: CheckIn[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('key-results');

  // Modals & Drawers
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isKRDrawerOpen, setIsKRDrawerOpen] = useState(false);
  const [selectedKRForUpdate, setSelectedKRForUpdate] = useState<KeyResult | null>(null);

  // New Comment Form
  const [commentText, setCommentText] = useState('');
  const [commentVisibility, setCommentVisibility] = useState<'PUBLIC' | 'CONFIDENTIAL'>('PUBLIC');

  const db = getDb();
  const asOfDate = db.devSettings.demoDate;

  const loadData = () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getObjectiveById(id)
      .then((res) => {
        setData(res);
        setNotFound(false);
        setIsLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id, selectedCycleId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
        Loading objective data...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <ItemNotFound
        title="Objective Not Found"
        message={`The objective #${id || 'unknown'} was not found or has been removed.`}
        backTo="/okrs"
        backLabel="Back to OKRs"
      />
    );
  }

  const {
    objective,
    keyResults,
    parentObjective,
    childObjectives,
    approvalSteps,
    comments,
    attachments,
    scores,
    checkIns,
  } = data;

  const currentCycle = db.cycles.find((c) => c.id === objective.cycleId) || db.cycles[1];
  const expectedPace = calculateExpectedProgress(objective.startDate, objective.endDate, asOfDate);
  const owner = db.users.find((u) => u.id === objective.ownerId);
  const ownerManager = owner?.managerId ? db.users.find((u) => u.id === owner.managerId) : undefined;
  const isOwner = currentUser?.id === objective.ownerId;
  const canEdit =
    (isOwner || currentUser?.role === 'MANAGER' || currentUser?.role === 'HR_ADMIN') &&
    objective.status !== 'Completed' &&
    objective.status !== 'Archived';
  const allKRsCompleted = keyResults.length > 0 && keyResults.every((k) => k.status === 'Completed');

  // Check if returned
  const latestReturnedStep = approvalSteps.find(
    (s) => s.status === 'RETURNED' && s.submissionNo === objective.submissionNo
  );

  const handleSubmit = async () => {
    try {
      await submitObjective(id, currentUser?.id || 1);
      showToast({ type: 'success', message: 'Objective submitted for review' });
      setIsSubmitConfirmOpen(false);
      loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Submit failed' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelObjective(id, 'User cancelled objective', currentUser?.id || 1);
      showToast({ type: 'success', message: 'Objective marked as Cancelled/Archived' });
      setIsCancelConfirmOpen(false);
      loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Cancel failed' });
    }
  };

  const handleComplete = async () => {
    try {
      await markObjectiveCompleted(id, currentUser?.id || 1);
      showToast({ type: 'success', message: 'Objective marked as Completed!' });
      setIsCompleteConfirmOpen(false);
      loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment('OBJECTIVE', id, currentUser?.id || 1, commentText, commentVisibility);
    setCommentText('');
    showToast({ type: 'success', message: 'Comment posted' });
    loadData();
  };

  // Mock progress chart data over time
  const progressHistoryChartData = [
    { date: '1 Oct', progress: 0, expected: 0 },
    { date: '15 Oct', progress: 14, expected: 16 },
    { date: '1 Nov', progress: 28, expected: 34 },
    { date: '10 Nov', progress: objective.progress || 0, expected: expectedPace },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Returned Banner Alert (Section 11.5) */}
      {objective.approvalState === 'Returned' && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Objective Returned for Changes</div>
              <p className="text-xs text-amber-800 mt-0.5">
                Reviewer comment: "{latestReturnedStep?.comments || 'Please revise targets and resubmit.'}"
              </p>
            </div>
          </div>
          {isOwner && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/okrs/${id}/edit`)}
              leftIcon={<Edit className="w-3.5 h-3.5" />}
            >
              Edit & Resubmit
            </Button>
          )}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {objective.level} Level
              </span>
              <ObjectiveStatusPill status={objective.status} />
              {objective.status === 'Active' && <ObjectiveHealthChip health={objective.health} />}
              <ApprovalChip state={objective.approvalState} />
            </div>

            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">{objective.title}</h1>
            {objective.description && (
              <p className="text-xs text-[#64748b] max-w-2xl leading-relaxed">
                {objective.description}
              </p>
            )}
          </div>

          {/* Action Buttons based on Role & State */}
          <div className="flex items-center gap-2 flex-wrap self-start">
            {canEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/okrs/${id}/edit`)}
                leftIcon={<Edit className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            )}

            {isOwner && objective.status === 'Draft' && objective.approvalState === 'NotSubmitted' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsSubmitConfirmOpen(true)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit for Approval
              </Button>
            )}

            {allKRsCompleted && objective.status === 'Active' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCompleteConfirmOpen(true)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Mark as Completed
              </Button>
            )}

            {isOwner && objective.status === 'Draft' && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setIsCancelConfirmOpen(true)}
              >
                Cancel Objective
              </Button>
            )}
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Cycle</span>
            <span className="font-semibold text-slate-800">{currentCycle.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Timeline</span>
            <span className="font-semibold text-slate-800">
              {new Date(objective.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(objective.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Weightage</span>
            <span className="font-semibold text-slate-800">{objective.weightage}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Key Results</span>
            <span className="font-semibold text-slate-800">{keyResults.length} metrics</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Summary Cards & Right Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress Ring & Owner Card */}
        <div className="space-y-6">
          {/* Progress Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
            <h3 className="text-sm font-bold text-[#1e293b]">Objective Progress</h3>
            {objective.status === 'Draft' ? (
              <div className="py-6 px-4 flex flex-col items-center text-center space-y-3 w-full">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    Draft — Not Started
                  </span>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    Progress will be available after the objective is activated.
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 w-full flex justify-between">
                  <span>Target Metrics</span>
                  <span className="font-semibold text-slate-700">{keyResults.length} Key Results</span>
                </div>
              </div>
            ) : (
              <>
                <ProgressRing
                  progress={objective.progress || 0}
                  expectedProgress={expectedPace}
                  size={140}
                  strokeWidth={12}
                  label="Overall"
                />
                <div className="text-xs text-slate-500 w-full pt-3 border-t space-y-1.5">
                  <div className="flex justify-between">
                    <span>Calculated from:</span>
                    <span className="font-semibold text-slate-800">{keyResults.length} Key Results</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected pace today:</span>
                    <span className="font-semibold text-slate-800">{expectedPace}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pace gap:</span>
                    <span
                      className={`font-semibold ${
                        (objective.progress || 0) >= expectedPace - 10
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {Math.round(((objective.progress || 0) - expectedPace) * 100) / 100}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Owner Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1e293b]">Goal Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-[#0369a1] font-bold text-sm flex items-center justify-center">
                {owner?.avatar || 'US'}
              </div>
              <div>
                <div className="font-bold text-sm text-[#1e293b]">{owner?.name}</div>
                <div className="text-xs text-slate-500">{owner?.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{owner?.email}</div>
              </div>
            </div>

            {ownerManager && (
              <div className="pt-3 border-t text-xs text-slate-500 space-y-1">
                <div>Reports to: <span className="font-semibold text-slate-700">{ownerManager.name}</span></div>
                <div>Level 1 Approver: <span className="font-semibold text-slate-700">{ownerManager.title}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 7 Tabs Content (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            variant="underline"
            tabs={[
              { id: 'key-results', label: 'Key Results', badge: keyResults.length },
              { id: 'overview', label: 'Overview & Alignment' },
              { id: 'history', label: 'Progress History' },
              { id: 'comments', label: 'Comments & Files', badge: comments.length },
              { id: 'approvals', label: 'Approval Stepper' },
              { id: 'checkins', label: 'Check-ins', badge: checkIns.length },
              { id: 'score', label: 'Score' },
            ]}
          />

          {/* TAB 1: KEY RESULTS */}
          {activeTab === 'key-results' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">Associated Key Results</h3>
                  <p className="text-xs text-slate-500">
                    Each key result tracks its own progress and pace status independently.
                  </p>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsKRDrawerOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Key Result
                  </Button>
                )}
              </div>

              {/* Legend explaining Objective Status vs KR Status */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
                <span className="font-semibold">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <ObjectiveStatusPill status="Active" /> Objective Lifecycle
                </span>
                <span className="flex items-center gap-1.5">
                  <ObjectiveHealthChip health="On Track" /> Objective Health
                </span>
                <span className="flex items-center gap-1.5">
                  <KRStatusChip status="At Risk" /> KR Status
                </span>
              </div>

              {/* Key Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                      <th className="py-3 px-3">Key Result</th>
                      <th className="py-3 px-3">Current / Target</th>
                      <th className="py-3 px-3">KR Status</th>
                      <th className="py-3 px-3 w-40">Progress</th>
                      <th className="py-3 px-3 text-center">Weight</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {keyResults.map((kr) => {
                      const type = db.measurementTypes.find((m) => m.id === kr.measurementTypeId);
                      return (
                        <tr key={kr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <Link
                              to={`/okrs/${id}/kr/${kr.id}`}
                              className="font-semibold text-slate-800 hover:text-[#2d8fd8]"
                            >
                              {kr.name}
                            </Link>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {kr.direction} · {type?.name}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">
                            {objective.status === 'Draft' ? (
                              <span>Baseline: {kr.baseline} · Target: {formatValueWithUnit(kr.target, type?.name || 'Number', type?.unitSymbol)}</span>
                            ) : (
                              <>
                                {formatValueWithUnit(kr.current, type?.name || 'Number', type?.unitSymbol)} /{' '}
                                {formatValueWithUnit(kr.target, type?.name || 'Number', type?.unitSymbol)}
                              </>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <KRStatusChip
                              status={kr.status}
                              isDraft={objective.status === 'Draft'}
                              isDelayed={kr.isDelayed}
                              isOverridden={kr.statusOverridden}
                            />
                          </td>
                          <td className="py-3 px-3">
                            {objective.status === 'Draft' ? (
                              <span className="text-xs text-slate-400 italic">Progress available after activation</span>
                            ) : (
                              <ProgressBar
                                progress={kr.achievementPercent}
                                expectedProgress={kr.expectedPercent}
                                showLabels
                              />
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {kr.weightage}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            {objective.status === 'Draft' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled
                                className="text-slate-400 cursor-not-allowed"
                              >
                                Draft (Inactive)
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedKRForUpdate(kr)}
                              >
                                Update Progress
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW & ALIGNMENT */}
          {activeTab === 'overview' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#1e293b]">Goal Alignment Cascade</h3>
                <p className="text-xs text-slate-500">
                  How this objective links upward to company strategy and downwards to child deliverables.
                </p>
              </div>

              {/* Parent Link */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Parent Objective
                </span>
                {parentObjective ? (
                  <div
                    onClick={() => navigate(`/okrs/${parentObjective.id}`)}
                    className="p-3 bg-white rounded-lg border border-slate-200 hover:border-[#2d8fd8] cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-500">[{parentObjective.level}]</span>
                      <h4 className="font-bold text-sm text-slate-800">{parentObjective.title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">None (Top-level goal in hierarchy)</div>
                )}
              </div>

              {/* Child Objectives */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Child Objectives Aligned to this Goal ({childObjectives.length})
                </span>
                <div className="space-y-2">
                  {childObjectives.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => navigate(`/okrs/${child.id}`)}
                      className="p-3 bg-white rounded-lg border border-slate-200 hover:border-[#2d8fd8] cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-500">[{child.level}]</span>
                        <h4 className="font-bold text-xs text-slate-800">{child.title}</h4>
                      </div>
                      <ProgressBar
                        progress={child.progress || 0}
                        expectedProgress={expectedPace}
                        className="w-36"
                      />
                    </div>
                  ))}
                  {childObjectives.length === 0 && (
                    <div className="text-xs text-slate-400">No child objectives aligned yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROGRESS HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#1e293b]">Progress Velocity & Trajectory</h3>
                <p className="text-xs text-slate-500">Actual achievement vs expected timeline pace</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressHistoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      name="Actual Progress (%)"
                      stroke="#2d8fd8"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      name="Expected Pace (%)"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: COMMENTS & ATTACHMENTS */}
          {activeTab === 'comments' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#1e293b]">Collaboration Thread</h3>
                <p className="text-xs text-slate-500">Discussion, weekly feedback, and proposal files</p>
              </div>

              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share a milestone update or feedback..."
                  rows={3}
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-slate-600 font-medium">Visibility:</label>
                    <select
                      value={commentVisibility}
                      onChange={(e) =>
                        setCommentVisibility(e.target.value as 'PUBLIC' | 'CONFIDENTIAL')
                      }
                      className="text-xs border rounded p-1"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="CONFIDENTIAL">Confidential (Manager & HR Only)</option>
                    </select>
                  </div>
                  <Button size="sm" variant="primary" type="submit">
                    Post Comment
                  </Button>
                </div>
              </form>

              <div className="space-y-3 pt-4 border-t divide-y divide-slate-100">
                {comments.map((c) => {
                  const author = db.users.find((u) => u.id === c.authorId);
                  return (
                    <div key={c.id} className="pt-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{author?.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-600">{c.text}</p>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No comments yet. Start the conversation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: APPROVAL STEPPER */}
          {activeTab === 'approvals' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#1e293b]">Approval Timeline & Decisions</h3>
                <p className="text-xs text-slate-500">Formal governance audit trail</p>
              </div>

              <div className="space-y-4">
                {approvalSteps.map((step) => {
                  const approver = db.users.find((u) => u.id === step.approverId);
                  return (
                    <div key={step.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900">
                          Stage {step.stage}: {step.stageName}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            step.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'RETURNED'
                              ? 'bg-amber-100 text-amber-800'
                              : step.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Approver: {approver?.name} ({approver?.role})
                      </div>
                      {step.comments && (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-slate-700 italic">
                          "{step.comments}"
                        </div>
                      )}
                    </div>
                  );
                })}
                {approvalSteps.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Not yet submitted for approval.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CHECK-INS */}
          {activeTab === 'checkins' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1e293b]">Periodic Check-ins</h3>
                  <p className="text-xs text-slate-500">Scheduled progress reviews</p>
                </div>
                <Button size="sm" variant="primary" onClick={() => navigate('/check-ins/new')}>
                  Add Check-in
                </Button>
              </div>

              <div className="space-y-2">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">
                        Check-in on {new Date(ci.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-slate-500">Status: {ci.status}</div>
                    </div>
                    <span className="font-semibold text-slate-700">Every {ci.frequencyInterval} {ci.frequencyUnit}s</span>
                  </div>
                ))}
                {checkIns.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">No check-ins submitted yet.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SCORES */}
          {activeTab === 'score' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#1e293b]">Objective Score</h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span>Current Calculated Score:</span>
                  <span className="text-lg font-bold text-slate-900">{objective.progress || 0} / 100</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Derived directly from weighted key result achievements.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add KR Drawer */}
      <KeyResultDrawer
        isOpen={isKRDrawerOpen}
        onClose={() => setIsKRDrawerOpen(false)}
        onSave={async (newKR, andAddAnother) => {
          try {
            await createKeyResult(
              {
                objectiveId: Number(id),
                ownerId: newKR.ownerId || objective.ownerId,
                name: newKR.name.trim(),
                description: newKR.description?.trim() || undefined,
                measurementTypeId: newKR.measurementTypeId,
                direction: newKR.direction,
                baseline: newKR.baseline,
                target: newKR.target,
                weightage: newKR.weightage || 50,
                startDate: newKR.startDate,
                targetDate: newKR.targetDate,
              },
              currentUser?.id || 1
            );
            showToast({
              type: 'success',
              message: `Key Result "${newKR.name}" added successfully under Objective!`,
            });
            useOkrStore.getState().refresh();
            loadData();
            if (!andAddAnother) {
              setIsKRDrawerOpen(false);
            }
          } catch (err: any) {
            showToast({
              type: 'error',
              message: err.message || 'Failed to add Key Result',
            });
          }
        }}
        objectiveDates={{ startDate: objective.startDate, endDate: objective.endDate }}
        defaultOwnerId={objective.ownerId}
      />

      {/* Update Progress Drawer */}
      {selectedKRForUpdate && (
        <UpdateProgressDrawer
          isOpen={Boolean(selectedKRForUpdate)}
          onClose={() => setSelectedKRForUpdate(null)}
          keyResult={selectedKRForUpdate}
          onSuccess={() => {
            setSelectedKRForUpdate(null);
            loadData();
          }}
        />
      )}

      {/* Submit Confirm */}
      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Submit Objective for Approval?"
        message="After submitting you cannot edit until a decision is made. Send to your manager now?"
        confirmLabel="Submit for approval"
      />

      {/* Cancel Confirm */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Objective?"
        message="Are you sure you want to cancel this objective? It will be marked as Cancelled/Archived."
        confirmLabel="Cancel Objective"
        isDestructive
      />

      {/* Mark Completed Confirm */}
      <ConfirmDialog
        isOpen={isCompleteConfirmOpen}
        onClose={() => setIsCompleteConfirmOpen(false)}
        onConfirm={handleComplete}
        title="Mark Objective as Completed?"
        message="All key results have reached completion. Mark this objective as Completed?"
        confirmLabel="Mark as Completed"
      />
    </div>
  );
};
