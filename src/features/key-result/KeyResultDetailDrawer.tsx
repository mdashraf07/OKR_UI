import React, { useState } from 'react';
import {
  X,
  Target,
  Tag,
  Building2,
  Calendar,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Share2,
  Maximize2,
  MoreHorizontal,
  Smile,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  Link as LinkIcon,
  FileText,
  Paperclip,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { KRStatusChip } from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { KeyResult, Objective, CheckIn } from '../../types';
import { getDb } from '../../api/mockDb';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { useToastStore } from '../../components/ui/Toast';
import { CheckInDrawer } from '../check-ins/CheckInDrawer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export interface KeyResultDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onCheckInRequested?: () => void;
}

export const KeyResultDetailDrawer: React.FC<KeyResultDetailDrawerProps> = ({
  isOpen,
  onClose,
  keyResult,
  onCheckInRequested,
}) => {
  const { currentUser } = useAuthStore();
  const { objectives } = useOkrStore();
  const { showToast } = useToastStore();
  const db = getDb();

  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'documents'>('tasks');
  const [isMetaCollapsed, setIsMetaCollapsed] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  if (!keyResult) return null;

  const parentObj = objectives.find((o) => o.id === keyResult.objectiveId);
  const dept = db.departments.find((d) => d.id === parentObj?.departmentId) || db.departments[0];
  const owner = db.users.find((u) => u.id === keyResult.ownerId) || currentUser;
  const cycle = db.cycles.find((c) => c.id === parentObj?.cycleId) || db.cycles[1];

  const checkIns = db.checkIns
    .filter((c) => c.keyResultId === keyResult.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart series
  const baseline = keyResult.baseline;
  const target = keyResult.target;
  const chartData = [
    { date: '1 Oct', plan: baseline, actual: baseline },
    { date: '9 Oct', plan: 38, actual: keyResult.current },
    { date: '15 Nov', plan: 58, actual: undefined },
    { date: '31 Dec', plan: target, actual: undefined },
  ];

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="4xl"
        title={
          <div className="flex items-center justify-between w-full pr-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate max-w-lg">
              <Building2 className="w-3.5 h-3.5 text-[#2d8fd8] flex-shrink-0" />
              <span className="text-slate-700">{dept.name}</span>
              <span className="text-slate-300">|</span>
              <Target className="w-3.5 h-3.5 text-[#2d8fd8] flex-shrink-0" />
              <span className="truncate text-slate-800">{parentObj?.title || 'Objective'}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                1/1
              </span>
              <button
                type="button"
                onClick={() =>
                  showToast({ type: 'info', message: 'Key result deep link copied to clipboard.' })
                }
                className="p-1 hover:text-slate-700 rounded"
                title="Copy Link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      >
        <div className="flex gap-4">
          {/* Main Content Area */}
          <div className="flex-1 space-y-5 text-xs text-slate-700">
            {/* Title & Progress Headline */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Tag className="w-4 h-4 text-[#2d8fd8] mt-0.5 flex-shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{keyResult.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {keyResult.description || 'Continuous KPI milestone tracking'}
                    </p>
                  </div>
                </div>

                {/* Progress block */}
                <div className="text-right sm:min-w-[160px]">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {keyResult.achievementPercent}%
                    </span>
                    <KRStatusChip status={keyResult.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    ({keyResult.baseline} → {keyResult.target}) · Actual: {keyResult.current}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <ProgressBar progress={keyResult.achievementPercent} />

              {/* Meta chip row */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    <UserIcon className="w-3 h-3 text-[#1a7260]" />
                    {owner?.name || 'Owner'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {cycle.name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#2d8fd8] font-semibold">
                    ↑ {keyResult.kpiName || 'Accuracy'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {keyResult.checkInFrequency || 'Every Friday'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMetaCollapsed(!isMetaCollapsed)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {isMetaCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Check-in Trend Card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2d8fd8]" />
                  <span className="font-semibold text-slate-900 text-xs">Check-in Trend</span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCheckInOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  + Check-in
                </Button>
              </div>

              {/* Recharts trend */}
              <div className="h-44 w-full bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={[baseline, target]} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="plan"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      name="Plan"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#16a34a' }}
                      name="Actual"
                      connectNulls
                    />
                    <ReferenceLine x="9 Oct" stroke="#2d8fd8" strokeDasharray="2 2" label="Today" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Check-in History Feed */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">Check-in History</span>
                <span className="text-[11px] text-slate-400">{checkIns.length} recorded</span>
              </div>

              {checkIns.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No check-ins recorded yet. Click "+ Check-in" above to make the first update.
                </div>
              ) : (
                <div className="space-y-3">
                  {checkIns.map((ci) => (
                    <div
                      key={ci.id}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                            {new Date(ci.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-slate-700 font-mono">
                            Plan: <strong>{ci.planValue ?? 38}</strong> · Actual:{' '}
                            <strong className="text-emerald-700">{ci.actualValue ?? ci.progressUpdates[0]?.progressValue}</strong>
                          </span>
                        </div>
                        <KRStatusChip
                          status={ci.overrideHealth || ci.calculatedHealth || 'On Track'}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#1a7260] text-white flex items-center justify-center font-bold text-[10px]">
                            {ci.authorName ? ci.authorName[0] : 'S'}
                          </span>
                          <span className="font-medium text-slate-700">
                            {ci.authorName || 'Santhiya'}
                          </span>
                          <span>·</span>
                          <span className="text-emerald-600 font-semibold">On time</span>
                          <span>·</span>
                          <span>8 Oct 2026 11:36 AM</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="hover:text-slate-700 flex items-center gap-1"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="hover:text-slate-700 flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* System message */}
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-sans">
                        {ci.stageChangeText || ci.remarks || 'Stage updated to In Progress with Health On Track'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card: Tabs Tasks / Notes / Documents */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'tasks'
                      ? 'border-[#2d8fd8] text-[#2d8fd8]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'notes'
                      ? 'border-[#2d8fd8] text-[#2d8fd8]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'documents'
                      ? 'border-[#2d8fd8] text-[#2d8fd8]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Documents
                </button>
              </div>

              {activeTab === 'tasks' && (
                <div className="py-6 text-center text-slate-400 space-y-2">
                  <p className="text-xs">No tasks linked to this key result.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      showToast({ type: 'info', message: 'Task integration modal opened.' })
                    }
                  >
                    + Tasks
                  </Button>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No notes recorded yet.
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No documents attached.
                </div>
              )}
            </div>
          </div>

          {/* Right Icon Rail */}
          <div className="w-10 bg-slate-50 border border-slate-200/80 rounded-xl p-1 flex flex-col items-center gap-2 flex-shrink-0 text-slate-400">
            <button
              type="button"
              className="p-2 rounded-lg bg-[#2d8fd8] text-white shadow-sm"
              title="Check-ins (Active)"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200 hover:text-slate-700"
              title="Target Breakdown"
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200 hover:text-slate-700"
              title="Hierarchy"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200 hover:text-slate-700"
              title="Alignments"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200 hover:text-slate-700"
              title="Notes"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200 hover:text-slate-700"
              title="Attachments"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Drawer>

      {/* S6 Check-in Drawer from KR detail */}
      <CheckInDrawer
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        keyResult={keyResult}
        onSuccess={() => {
          showToast({ type: 'success', message: 'Check-in saved successfully.' });
        }}
      />
    </>
  );
};
