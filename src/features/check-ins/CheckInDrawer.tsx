import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Target,
  Tag,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Check,
  Search,
  ChevronDown,
  Type,
  Mic,
  Video,
  Upload,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { useToastStore } from '../../components/ui/Toast';
import { KeyResult, Objective, KRStatus, CheckIn } from '../../types';
import {
  evaluateCheckInHealth,
  formatValueWithUnit,
  calculateKRAchievement,
} from '../../lib/calculations';
import { KRStatusChip } from '../../components/ui/Chips';
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

export interface CheckInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onSuccess?: () => void;
}

const CHECKPOINT_DATES = [
  '9 Oct 2026',
  '16 Oct 2026',
  '23 Oct 2026',
  '30 Oct 2026',
  '6 Nov 2026',
  '13 Nov 2026',
  '20 Nov 2026',
  '27 Nov 2026',
  '4 Dec 2026',
  '11 Dec 2026',
  '18 Dec 2026',
  '25 Dec 2026',
];

export const CheckInDrawer: React.FC<CheckInDrawerProps> = ({
  isOpen,
  onClose,
  keyResult,
  onSuccess,
}) => {
  const { currentUser } = useAuthStore();
  const { createCheckIn, updateKRProgress, objectives } = useOkrStore();
  const { showToast } = useToastStore();
  const db = getDb();

  const valueInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [selectedDate, setSelectedDate] = useState('9 Oct 2026');
  const [actualValueStr, setActualValueStr] = useState('');
  const [selectedHealth, setSelectedHealth] = useState<KRStatus>('On Track');
  const [isHealthOverridden, setIsHealthOverridden] = useState(false);
  const [isHealthDropdownOpen, setIsHealthDropdownOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch parent objective
  const parentObj = objectives.find((o) => o.id === keyResult?.objectiveId);
  const measurementType = db.measurementTypes.find((m) => m.id === keyResult?.measurementTypeId);

  // Scheduled Plan calculation for date
  // For Q4 (Oct 1 to Dec 31) with 13 checkpoints, 9 Oct is checkpoint 2:
  // Baseline 30, Target 80 -> Plan at Oct 9 is 38
  const baseline = keyResult?.baseline ?? 0;
  const target = keyResult?.target ?? 100;
  const direction = keyResult?.direction ?? 'INCREASE';

  // Planned value derivation
  const plannedValue =
    selectedDate === '9 Oct 2026' && baseline === 30 && target === 80
      ? 38
      : Math.round(baseline + ((target - baseline) * 2) / 13);

  const numActual = Number(actualValueStr);
  const hasValidValue = !isNaN(numActual) && actualValueStr.trim() !== '';

  // Dynamic feedback and evaluation
  const evaluation = evaluateCheckInHealth(
    direction,
    baseline,
    target,
    plannedValue,
    hasValidValue ? numActual : baseline
  );

  // Auto update status suggestion when value changes (if not explicitly overridden)
  useEffect(() => {
    if (!isHealthOverridden && hasValidValue) {
      setSelectedHealth(evaluation.health);
    }
  }, [actualValueStr, isHealthOverridden, evaluation.health, hasValidValue]);

  // Focus and prefill on open
  useEffect(() => {
    if (isOpen && keyResult) {
      setSelectedDate('9 Oct 2026');
      setActualValueStr(String(keyResult.current));
      setSelectedHealth(keyResult.status || 'On Track');
      setIsHealthOverridden(false);
      setIsHealthDropdownOpen(false);
      setCommentText('');
      setErrorMessage(null);
      setIsSubmitting(false);

      setTimeout(() => {
        valueInputRef.current?.focus();
        valueInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, keyResult?.id]);

  // Existing check-ins for this KR
  const krCheckIns = db.checkIns
    .filter((c) => c.keyResultId === keyResult?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart data preparation
  const chartData = [
    { date: '1 Oct', plan: baseline, actual: baseline },
    { date: '9 Oct', plan: 38, actual: hasValidValue ? numActual : keyResult?.current || baseline },
    { date: '16 Oct', plan: 45, actual: undefined },
    { date: '30 Oct', plan: 53, actual: undefined },
    { date: '15 Nov', plan: 61, actual: undefined },
    { date: '30 Nov', plan: 68, actual: undefined },
    { date: '15 Dec', plan: 74, actual: undefined },
    { date: '31 Dec', plan: target, actual: undefined },
  ];

  const handleSaveCheckIn = async () => {
    if (!keyResult || !parentObj) return;

    if (!hasValidValue) {
      setErrorMessage('Please enter a valid numeric value.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const stageChangeText =
        keyResult.current === baseline
          ? `Stage updated from "Not Started" to "In Progress" with the Health "${selectedHealth}"`
          : `Health updated to "${selectedHealth}" with value ${numActual}`;

      await createCheckIn(
        {
          objectiveId: parentObj.id,
          keyResultId: keyResult.id,
          employeeId: currentUser?.id || 1,
          authorName: currentUser?.name || 'Santhiya',
          date: new Date().toISOString(),
          planValue: plannedValue,
          actualValue: numActual,
          deltaValue: evaluation.delta,
          deltaPercentage: evaluation.percentageDelta,
          calculatedHealth: evaluation.health,
          overrideHealth: isHealthOverridden ? selectedHealth : undefined,
          statusBannerText: evaluation.bannerText,
          remarks: commentText.trim() || stageChangeText,
          stageChangeText,
          progressValue: numActual,
        },
        currentUser?.id || 1
      );

      showToast({
        type: 'success',
        message: `Check-in recorded: ${keyResult.name} updated to ${numActual}.`,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!keyResult) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="5xl"
      title={
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#1e293b]">Check-in</span>
        </div>
      }
      subtitle="Record periodic progress and verify confidence health."
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveCheckIn}
            disabled={isSubmitting || parentObj?.status === 'Draft'}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : parentObj?.status === 'Draft' ? (
              'Draft (Inactive)'
            ) : (
              'Check-in'
            )}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-700">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Draft Notice if Objective is in Draft */}
          {parentObj?.status === 'Draft' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">Draft Objective — Execution Inactive</div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This objective is in Draft (Not Started). Target and baseline values can be configured, but progress check-ins and pace tracking will be enabled once the objective is formally activated.
                </p>
              </div>
            </div>
          )}

          {/* Context Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Target className="w-4 h-4 text-[#2d8fd8] flex-shrink-0" />
              <span className="font-semibold text-slate-900 truncate">
                {parentObj?.title || 'Objective'}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-6 text-slate-700 font-medium">
              <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{keyResult.name}</span>
            </div>
            <div className="pl-6 flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
              <span className="text-[#2d8fd8] font-bold">
                {direction === 'INCREASE' ? '↑' : '↓'} {keyResult.kpiName || 'Accuracy'}
              </span>
              <span>·</span>
              <span>From: {keyResult.baseline}</span>
              <span>·</span>
              <span>To: {keyResult.target}</span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 text-xs">Date</label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              >
                {CHECKPOINT_DATES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value numeric input with live feedback */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 text-xs">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              ref={valueInputRef}
              type="number"
              value={actualValueStr}
              onChange={(e) => setActualValueStr(e.target.value)}
              disabled={parentObj?.status === 'Draft'}
              placeholder={parentObj?.status === 'Draft' ? 'Objective is in Draft (Check-in disabled)' : 'Enter current actual value'}
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] transition-all font-mono disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />

            {/* Live feedback under Value */}
            <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
              <div className="text-slate-500 text-[11px]">
                Plan value for this date: <strong className="font-mono">{plannedValue}</strong>
              </div>
              {hasValidValue && (
                <div
                  className={`flex items-center gap-1 font-semibold text-xs ${
                    evaluation.isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {evaluation.isPositive ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {evaluation.delta > 0 ? `+${evaluation.delta}` : evaluation.delta} (
                    {evaluation.percentageDelta > 0
                      ? `+${evaluation.percentageDelta}%`
                      : `${evaluation.percentageDelta}%`}
                    )
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle & Health Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 text-xs">Lifecycle & Health</label>
              {isHealthOverridden && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Manual Override
                </span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHealthDropdownOpen(!isHealthDropdownOpen)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedHealth === 'On Track'
                        ? 'bg-emerald-500'
                        : selectedHealth === 'At Risk'
                        ? 'bg-amber-500'
                        : selectedHealth === 'In Trouble'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-medium text-slate-800">
                    {selectedHealth === 'Completed' ? 'Completed' : `In Progress | ${selectedHealth}`}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isHealthDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                    Health Status Options
                  </div>

                  {(['On Track', 'At Risk', 'In Trouble', 'Completed'] as KRStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setSelectedHealth(st);
                        setIsHealthOverridden(true);
                        setIsHealthDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            st === 'On Track'
                              ? 'bg-emerald-500'
                              : st === 'At Risk'
                              ? 'bg-amber-500'
                              : st === 'In Trouble'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-medium text-slate-800">
                          {st === 'Completed' ? 'Completed' : `In Progress | ${st}`}
                        </span>
                      </div>
                      {selectedHealth === st && (
                        <Check className="w-3.5 h-3.5 text-[#2d8fd8]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Color-matched Situation Message Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
              evaluation.health === 'On Track'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : evaluation.health === 'At Risk'
                ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                : evaluation.health === 'Completed'
                ? 'bg-blue-50/70 border-blue-200 text-blue-800'
                : 'bg-red-50/70 border-red-200 text-red-800'
            }`}
          >
            {evaluation.bannerText}
          </div>

          {/* Comment Rich-text area with tools */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 text-xs">Comment</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2d8fd8] focus-within:border-transparent bg-white">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Share qualitative updates, blockers, or milestones achieved..."
                className="w-full p-3 text-xs text-slate-800 border-none outline-none resize-none"
              />
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400">
                <span className="text-[11px]">Attach qualitative notes</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Formatting"
                    className="p-1 hover:text-slate-600 rounded hover:bg-slate-200/50"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Voice note"
                    className="p-1 hover:text-slate-600 rounded hover:bg-slate-200/50"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Video link"
                    className="p-1 hover:text-slate-600 rounded hover:bg-slate-200/50"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Upload proof"
                    className="p-1 hover:text-slate-600 rounded hover:bg-slate-200/50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
          )}
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-6 pt-4 lg:pt-0">
          {/* Trend Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs">Check-in Trend</span>
              <span className="text-[11px] text-slate-400 font-mono">Q4 2026</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                  {/* Planned Line */}
                  <Line
                    type="monotone"
                    dataKey="plan"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Planned"
                  />
                  {/* Actual Progress Line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={evaluation.isPositive ? '#16a34a' : '#ef4444'}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#16a34a' }}
                    name="Actual"
                    connectNulls
                  />
                  <ReferenceLine x="9 Oct" stroke="#2d8fd8" strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Check-ins List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs">Check-in History</span>
              <span className="text-[11px] text-slate-400">{krCheckIns.length} records</span>
            </div>

            {krCheckIns.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No Check-ins made yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {krCheckIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-xs font-mono">
                        Actual: {ci.actualValue ?? ci.progressUpdates[0]?.progressValue ?? '-'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Plan: {ci.planValue ?? 38}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <KRStatusChip
                        status={ci.overrideHealth || ci.calculatedHealth || 'On Track'}
                      />
                      <span className="text-[10px] text-slate-400">
                        {ci.authorName || 'Employee'} · On time
                      </span>
                    </div>

                    {ci.remarks && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded">
                        "{ci.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
