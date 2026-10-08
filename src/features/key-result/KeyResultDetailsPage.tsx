import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  TrendingUp,
  RotateCcw,
  Plus,
  Clock,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { getKeyResultById, resetKRStatus } from '../../api';
import { getDb } from '../../api/mockDb';
import { KeyResult, Objective, Measurement, Comment, AuditEntry } from '../../types';
import { KRStatusChip } from '../../components/ui/Chips';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { UpdateProgressDrawer } from '../progress/UpdateProgressDrawer';
import { useToastStore } from '../../components/ui/Toast';
import { formatValueWithUnit, calculateKRAchievement } from '../../lib/calculations';
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

import { ItemNotFound } from '../../components/common/ItemNotFound';

export const KeyResultDetailsPage: React.FC = () => {
  const { objectiveId, krId } = useParams<{ objectiveId: string; krId: string }>();
  const id = String(krId || '');
  const objId = String(objectiveId || '');

  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [data, setData] = useState<{
    keyResult: KeyResult;
    objective: Objective;
    measurements: Measurement[];
    forecast: any;
    comments: Comment[];
    activity: AuditEntry[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('measurements');
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);

  const db = getDb();

  const loadData = () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getKeyResultById(id)
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
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
        Loading key result metrics...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <ItemNotFound
        title="Key Result Not Found"
        message={`Key Result #${id || 'unknown'} was not found or has been removed.`}
        backTo={objId ? `/okrs/${objId}` : '/okrs'}
        backLabel={objId ? 'Back to Objective' : 'Back to OKRs'}
      />
    );
  }

  const { keyResult, objective, measurements, forecast, comments, activity } = data;
  const owner = db.users.find((u) => u.id === keyResult.ownerId);
  const type = db.measurementTypes.find((m) => m.id === keyResult.measurementTypeId);
  const gap = Math.round((keyResult.achievementPercent - (keyResult.expectedPercent || 0)) * 100) / 100;

  const handleResetOverride = async () => {
    try {
      await resetKRStatus(keyResult.id, currentUser?.id || 1);
      showToast({ type: 'success', message: 'Status reset to automatic calculation' });
      loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Prepare chart points
  const chartPoints = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: m.value,
    }));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to={`/okrs/${objId}`} className="hover:text-[#2d8fd8] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Objective
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-semibold">{objective.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <KRStatusChip
                status={keyResult.status}
                isDelayed={keyResult.isDelayed}
                isOverridden={keyResult.statusOverridden}
                onResetOverride={handleResetOverride}
              />
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                {keyResult.direction}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                Weightage: {keyResult.weightage}%
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#1e293b]">{keyResult.name}</h1>
            {keyResult.description && (
              <p className="text-xs text-slate-500 max-w-2xl">{keyResult.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start">
            <Button
              variant="primary"
              onClick={() => setIsUpdateDrawerOpen(true)}
              leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
            >
              Update Progress
            </Button>
          </div>
        </div>

        {/* Summary Strip (Section 11.6) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Baseline</span>
            <span className="font-bold text-slate-800 font-mono">
              {formatValueWithUnit(keyResult.baseline, type?.name || 'Number', type?.unitSymbol)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Current Value</span>
            <span className="font-bold text-[#2d8fd8] font-mono text-sm">
              {formatValueWithUnit(keyResult.current, type?.name || 'Number', type?.unitSymbol)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Target Value</span>
            <span className="font-bold text-slate-800 font-mono">
              {formatValueWithUnit(keyResult.target, type?.name || 'Number', type?.unitSymbol)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Expected Pace</span>
            <span className="font-semibold text-slate-700">{keyResult.expectedPercent}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pace Gap</span>
            <span
              className={`font-bold ${
                gap >= -10 ? 'text-emerald-600' : gap >= -25 ? 'text-amber-600' : 'text-red-600'
              }`}
            >
              {gap >= 0 ? `+${gap}%` : `${gap}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Chart & Intelligent Forecast Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">Measurement Trend & Linear Forecast</h2>
            <p className="text-xs text-slate-500">Historical data points with algorithmic end-of-cycle trajectory projection</p>
          </div>

          {forecast && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="font-semibold">{forecast.message}</span>
            </div>
          )}
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={keyResult.target} stroke="#ef4444" strokeDasharray="3 3" label="Target" />
              <Line
                type="monotone"
                dataKey="value"
                name="Measurement Value"
                stroke="#2d8fd8"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs for Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          variant="underline"
          tabs={[
            { id: 'measurements', label: 'Progress / Measurement History', badge: measurements.length },
            { id: 'activity', label: 'Status & Audit Activity', badge: activity.length },
          ]}
        />

        {activeTab === 'measurements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Previous Value</th>
                  <th className="py-3 px-3">New Value</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Updated By</th>
                  <th className="py-3 px-3">Remarks / Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.map((m, index) => {
                  const recorder = db.users.find((u) => u.id === m.recordedBy);
                  const isRecordedOnBehalf = m.recordedBy !== keyResult.ownerId;
                  
                  // Compute previous value if not explicitly recorded
                  const nextMeasurement = measurements[index + 1];
                  const prevVal =
                    m.previousValue !== undefined
                      ? m.previousValue
                      : nextMeasurement !== undefined
                      ? nextMeasurement.value
                      : keyResult.baseline;

                  const progVal =
                    m.progress !== undefined
                      ? m.progress
                      : Math.round(
                          calculateKRAchievement(
                            keyResult.direction,
                            keyResult.baseline,
                            keyResult.target,
                            m.value
                          ) * 100
                        ) / 100;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(m.measuredAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {formatValueWithUnit(prevVal, type?.name || 'Number', type?.unitSymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 font-mono">
                        {formatValueWithUnit(m.value, type?.name || 'Number', type?.unitSymbol)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 bg-sky-50 text-[#0369a1] px-2 py-0.5 rounded-full">
                          {progVal}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {recorder?.name || 'User'}
                        {isRecordedOnBehalf && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            Recorded on behalf
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{m.comment || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{entry.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(entry.actionAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="text-slate-600">{entry.remarks}</div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">No status overrides recorded.</div>
            )}
          </div>
        )}
      </div>

      {/* Update Progress Drawer */}
      <UpdateProgressDrawer
        isOpen={isUpdateDrawerOpen}
        onClose={() => setIsUpdateDrawerOpen(false)}
        keyResult={keyResult}
        onSuccess={loadData}
      />
    </div>
  );
};
