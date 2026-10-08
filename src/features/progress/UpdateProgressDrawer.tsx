import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { KeyResult, KRStatus } from '../../types';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { useAuthStore } from '../auth/authStore';
import { useToastStore } from '../../components/ui/Toast';
import {
  calculateKRAchievement,
  calculateExpectedProgress,
  calculateKRStatus,
  formatValueWithUnit,
} from '../../lib/calculations';
import { KRStatusChip } from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';

export interface UpdateProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult;
  onSuccess?: () => void;
}

export const UpdateProgressDrawer: React.FC<UpdateProgressDrawerProps> = ({
  isOpen,
  onClose,
  keyResult,
  onSuccess,
}) => {
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const db = getDb();
  const asOfDate = db.devSettings.demoDate;

  const [newValue, setNewValue] = useState<number>(keyResult.current);
  const [comment, setComment] = useState('');
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(keyResult.statusOverridden || false);
  const [overrideStatus, setOverrideStatus] = useState<KRStatus>(keyResult.status);
  const [overrideReason, setOverrideReason] = useState(keyResult.overrideReason || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setNewValue(keyResult.current);
    setComment('');
    setIsOverrideEnabled(keyResult.statusOverridden || false);
    setOverrideStatus(keyResult.status);
    setOverrideReason(keyResult.overrideReason || '');
    setError(null);
  }, [keyResult, isOpen]);

  const type = db.measurementTypes.find((m) => m.id === keyResult.measurementTypeId);

  // Live Calculations (Section 11.7)
  const newAch = calculateKRAchievement(keyResult.direction, keyResult.baseline, keyResult.target, newValue);
  const expProgress = calculateExpectedProgress(keyResult.startDate, keyResult.targetDate, asOfDate);
  const calculatedStatus = calculateKRStatus(newAch, expProgress);
  const valueDelta = Math.round((newValue - keyResult.current) * 100) / 100;
  const gap = Math.round((newAch - expProgress) * 100) / 100;

  // Last 5 measurements
  const recentMeasurements = db.measurements
    .filter((m) => m.keyResultId === keyResult.id)
    .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
    .slice(0, 5);

  const handleSave = async () => {
    setError(null);

    if (isNaN(newValue)) {
      setError('Enter a valid number.');
      return;
    }

    if (isOverrideEnabled && (!overrideReason || overrideReason.trim() === '')) {
      setError('Please explain why you are overriding the calculated status.');
      return;
    }

    setIsLoading(true);
    try {
      await useOkrStore.getState().updateKRProgress(
        keyResult.id,
        newValue,
        comment,
        currentUser?.id || 1,
        isOverrideEnabled ? overrideStatus : undefined,
        isOverrideEnabled ? overrideReason : undefined
      );

      setIsLoading(false);
      showToast({ type: 'success', message: 'Progress updated successfully' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to update progress');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit / Update Progress"
      subtitle={`Metric: ${keyResult.name}`}
      width="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
            Save Progress Update
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Live Calculation Preview Card */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-3">
          <div className="text-xs font-bold text-[#0369a1] uppercase tracking-wider flex items-center justify-between">
            <span>Live Result Preview</span>
            <span className="text-[11px] font-semibold text-slate-700">
              Delta: {valueDelta >= 0 ? `+${valueDelta}` : valueDelta}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">New Achievement</span>
              <span className="text-base font-bold text-slate-800">{newAch}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Calculated Pace Status</span>
              <KRStatusChip status={calculatedStatus} />
            </div>
          </div>

          <div className="text-[11px] text-slate-600">
            {gap >= 0 ? (
              <span className="text-emerald-700 font-semibold">{gap} points ahead of expected pace.</span>
            ) : (
              <span className="text-amber-700 font-semibold">{Math.abs(gap)} points behind expected pace.</span>
            )}
          </div>

          <ProgressBar progress={newAch} expectedProgress={expProgress} showLabels />
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <Input
            label={`New Current Value (${type?.unitSymbol || type?.name || ''})`}
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(Number(e.target.value))}
            helperText={`Baseline: ${keyResult.baseline} · Target: ${keyResult.target}`}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#374151]">Remarks / Progress Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Explain actions taken to achieve this value..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
            />
          </div>
        </div>

        {/* Status Override Switch (Section 4.4 & 11.7) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Override Automatic Status</span>
              <span className="text-[11px] text-slate-500">
                Manually adjust pace status with a required rationale
              </span>
            </div>
            <input
              type="checkbox"
              checked={isOverrideEnabled}
              onChange={(e) => setIsOverrideEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#2d8fd8] cursor-pointer"
            />
          </div>

          {isOverrideEnabled && (
            <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
              <Select
                label="Manual Status"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as KRStatus)}
                options={[
                  { value: 'On Track', label: 'On Track' },
                  { value: 'At Risk', label: 'At Risk' },
                  { value: 'In Trouble', label: 'In Trouble' },
                  { value: 'Completed', label: 'Completed' },
                ]}
              />

              <Input
                label="Override Reason (Mandatory)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for overriding algorithmic pace..."
                required
              />
            </div>
          )}
        </div>

        {/* Recent Measurement History */}
        <div className="space-y-2 pt-2 border-t">
          <span className="text-xs font-bold text-slate-600 block">Recent 5 Measurements</span>
          <div className="space-y-1.5">
            {recentMeasurements.map((m) => {
              const recorder = db.users.find((u) => u.id === m.recordedBy);
              return (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{m.value}</span>
                    {m.comment && <span className="text-slate-500 ml-1">· "{m.comment}"</span>}
                  </div>
                  <span className="text-slate-400">
                    by {recorder?.name || 'User'} on{' '}
                    {new Date(m.measuredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
