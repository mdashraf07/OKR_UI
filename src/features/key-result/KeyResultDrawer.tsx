import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { KeyResult, KRDirection, KRStatus } from '../../types';
import { getDb } from '../../api/mockDb';
import { calculateKRAchievement, calculateExpectedProgress, calculateKRStatus } from '../../lib/calculations';
import { KRStatusChip } from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';

export interface KeyResultFormData {
  id?: number;
  name: string;
  description?: string;
  ownerId: number;
  measurementTypeId: number;
  direction: KRDirection;
  baseline: number;
  target: number;
  current?: number;
  weightage: number;
  startDate: string;
  targetDate: string;
}

export interface KeyResultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: KeyResultFormData, andAddAnother?: boolean) => void;
  initialData?: KeyResult | null;
  objectiveDates: { startDate: string; endDate: string };
  defaultOwnerId: number;
}

export const KeyResultDrawer: React.FC<KeyResultDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  objectiveDates,
  defaultOwnerId,
}) => {
  const db = getDb();
  const asOfDate = db.devSettings.demoDate;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState(defaultOwnerId);
  const [measurementTypeId, setMeasurementTypeId] = useState(1); // 1 Number, 2 Currency, 3 Percentage
  const [direction, setDirection] = useState<KRDirection>('INCREASE');
  const [baseline, setBaseline] = useState<number>(0);
  const [target, setTarget] = useState<number>(100);
  const [weightage, setWeightage] = useState<number>(50);
  const [startDate, setStartDate] = useState(objectiveDates.startDate.slice(0, 10));
  const [targetDate, setTargetDate] = useState(objectiveDates.endDate.slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const prevIsOpen = React.useRef(false);
  const prevInitialDataId = React.useRef<number | undefined | null>(null);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpen.current = false;
      return;
    }

    const justOpened = !prevIsOpen.current;
    const initialDataChanged = initialData?.id !== prevInitialDataId.current;

    if (justOpened || initialDataChanged) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setOwnerId(initialData.ownerId || defaultOwnerId);
        setMeasurementTypeId(initialData.measurementTypeId || 1);
        setDirection(initialData.direction || 'INCREASE');
        setBaseline(initialData.baseline ?? 0);
        setTarget(initialData.target ?? 10);
        setWeightage(initialData.weightage ?? 50);
        setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : (objectiveDates?.startDate ? objectiveDates.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)));
        setTargetDate(initialData.targetDate ? initialData.targetDate.slice(0, 10) : (objectiveDates?.endDate ? objectiveDates.endDate.slice(0, 10) : new Date().toISOString().slice(0, 10)));
      } else {
        setName('');
        setDescription('');
        setOwnerId(defaultOwnerId);
        setMeasurementTypeId(1);
        setDirection('INCREASE');
        setBaseline(0);
        setTarget(10);
        setWeightage(50);
        setStartDate(objectiveDates?.startDate ? objectiveDates.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setTargetDate(objectiveDates?.endDate ? objectiveDates.endDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
      }
      setError(null);
    }

    prevIsOpen.current = isOpen;
    prevInitialDataId.current = initialData?.id;
  }, [isOpen, initialData?.id, defaultOwnerId]);

  // Live calculations for preview card (Section 11.4)
  const currentVal = initialData?.current !== undefined ? initialData.current : baseline;
  const liveAchievement = calculateKRAchievement(direction, baseline, target, currentVal);
  const liveExpectedPace = calculateExpectedProgress(startDate, targetDate, asOfDate);
  const liveStatus: KRStatus = calculateKRStatus(liveAchievement, liveExpectedPace);

  const handleValidateAndSave = (andAddAnother: boolean = false) => {
    setError(null);

    if (!name || name.trim().length === 0) {
      setError('Key Result name is required.');
      return;
    }

    if (direction === 'INCREASE' && target <= baseline) {
      setError('For INCREASE the target must be higher than the baseline. For DECREASE it must be lower.');
      return;
    }

    if (direction === 'DECREASE' && target >= baseline) {
      setError('For INCREASE the target must be higher than the baseline. For DECREASE it must be lower.');
      return;
    }

    const startMs = new Date(startDate).getTime();
    const targetMs = new Date(targetDate).getTime();
    const objStartMs = new Date(objectiveDates.startDate).getTime();
    const objEndMs = new Date(objectiveDates.endDate).getTime();

    if (startMs < objStartMs || targetMs > objEndMs) {
      setError("KR dates must be inside the objective's dates.");
      return;
    }

    if (targetMs < startMs) {
      setError('End date cannot be before the start date.');
      return;
    }

    if (weightage < 0 || weightage > 100) {
      setError('KR weightage must be between 0 and 100.');
      return;
    }

    onSave(
      {
        id: initialData?.id,
        name,
        description,
        ownerId,
        measurementTypeId,
        direction,
        baseline: Number(baseline),
        target: Number(target),
        current: currentVal,
        weightage: Number(weightage),
        startDate: new Date(startDate).toISOString(),
        targetDate: new Date(targetDate).toISOString(),
      },
      andAddAnother
    );

    if (andAddAnother) {
      setName('');
      setDescription('');
    }
  };

  const selectedType = db.measurementTypes.find((m) => m.id === measurementTypeId);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Key Result' : 'Add Key Result'}
      subtitle="Define a measurable metric and milestone target under this objective"
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {!initialData && (
              <Button
                variant="secondary"
                onClick={() => handleValidateAndSave(true)}
              >
                Save & Add Another
              </Button>
            )}
            <Button variant="primary" onClick={() => handleValidateAndSave(false)}>
              Save Key Result
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Live Preview Card on Right/Top (Section 11.4) */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
          <div className="text-xs font-bold text-[#0369a1] uppercase tracking-wider flex items-center justify-between">
            <span>Live Calculation Preview</span>
            <span className="text-[10px] font-mono lowercase">demo pace: {asOfDate.slice(0, 10)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Formula</span>
              <span className="font-semibold text-slate-800">{direction}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Achievement</span>
              <span className="font-semibold text-slate-800">{liveAchievement}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Expected Pace</span>
              <span className="font-semibold text-slate-800">{liveExpectedPace}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Calculated Status</span>
              <KRStatusChip status={liveStatus} />
            </div>
          </div>

          <ProgressBar progress={liveAchievement} expectedProgress={liveExpectedPace} showLabels />
        </div>

        {/* Name & Description */}
        <Input
          label="Key Result Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Close 3 enterprise contracts"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#374151]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Details on criteria for achievement..."
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
          />
        </div>

        {/* Owner & Measurement Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="KR Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(Number(e.target.value))}
            options={db.users.map((u) => ({ value: u.id, label: `${u.name} (${u.title})` }))}
          />

          <Select
            label="Measurement Type"
            value={measurementTypeId}
            onChange={(e) => setMeasurementTypeId(Number(e.target.value))}
            options={db.measurementTypes.map((m) => ({
              value: m.id,
              label: `${m.name} ${m.unitSymbol ? `(${m.unitSymbol})` : ''}`,
            }))}
          />
        </div>

        {/* Direction & Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as KRDirection)}
            options={[
              { value: 'INCREASE', label: 'INCREASE (Higher is better)' },
              { value: 'DECREASE', label: 'DECREASE (Lower is better)' },
            ]}
          />

          <Input
            label={`Baseline (${selectedType?.unitSymbol || ''})`}
            type="number"
            value={baseline}
            onChange={(e) => setBaseline(Number(e.target.value))}
            required
          />

          <Input
            label={`Target (${selectedType?.unitSymbol || ''})`}
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            required
          />
        </div>

        {/* Dates and Weightage */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />

          <Input
            label="Weightage (%)"
            type="number"
            min={0}
            max={100}
            value={weightage}
            onChange={(e) => setWeightage(Number(e.target.value))}
            required
          />
        </div>
      </div>
    </Drawer>
  );
};
