import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
  Edit2,
  Calendar,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  User as UserIcon,
  Building2,
  Sparkles,
  Sliders,
  Loader2,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { useToastStore } from '../../components/ui/Toast';
import {
  Objective,
  KeyResult,
  KRDirection,
  PriorityType,
  VisibilityType,
  CheckInFrequency,
  MeasurementTypeName,
} from '../../types';

export interface AddKpiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objective: Objective | null;
  onCreated?: (krId: number) => void;
}

interface SeedKpiOption {
  name: string;
  unit: MeasurementTypeName;
  badge: string;
  defaultBaseline: number;
  defaultTarget: number;
}

const SEED_KPIS: SeedKpiOption[] = [
  { name: 'Accuracy', unit: 'Percentage', badge: '%', defaultBaseline: 30, defaultTarget: 80 },
  { name: '# of OKRs', unit: 'Number', badge: '123', defaultBaseline: 0, defaultTarget: 10 },
  { name: 'Absenteeism Rate', unit: 'Percentage', badge: '%', defaultBaseline: 12, defaultTarget: 4 },
  { name: 'Accounts Receivable Turnover', unit: 'Currency', badge: '₹', defaultBaseline: 50000, defaultTarget: 250000 },
  { name: 'Activated New Business Value', unit: 'Currency', badge: '₹', defaultBaseline: 0, defaultTarget: 1000000 },
];

interface DistributeRow {
  id: string;
  assigneeId: number;
  assigneeName: string;
  weight: number;
  from: number;
  to: number;
}

export const AddKpiDrawer: React.FC<AddKpiDrawerProps> = ({
  isOpen,
  onClose,
  objective,
  onCreated,
}) => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { createKeyResult } = useOkrStore();
  const { showToast } = useToastStore();
  const db = getDb();

  const currentCycle = db.cycles.find((c) => c.id === (objective?.cycleId || selectedCycleId)) || db.cycles[1];
  const objOwner = db.users.find((u) => u.id === objective?.ownerId) || currentUser;
  const dept = db.departments.find((d) => d.id === objective?.departmentId) || db.departments[0];

  // Form State
  const [name, setName] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState('');

  // KPI Search & Selection
  const [kpiSearch, setKpiSearch] = useState('');
  const [selectedKpi, setSelectedKpi] = useState<SeedKpiOption | null>(null);
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);

  // Type & Targets
  const [direction, setDirection] = useState<KRDirection>('INCREASE');
  const [fromValue, setFromValue] = useState<string>('30');
  const [toValue, setToValue] = useState<string>('80');

  // Ownership & Progress Tracking
  const [isOwnershipSectionOpen, setIsOwnershipSectionOpen] = useState(true);
  const [ownerId, setOwnerId] = useState<number>(objective?.ownerId || currentUser?.id || 1);
  const [periodName, setPeriodName] = useState(currentCycle.name);
  const [priority, setPriority] = useState<PriorityType>('High');
  const [frequencyType, setFrequencyType] = useState<'Standard' | 'Advanced'>('Standard');
  const [checkInFrequency, setCheckInFrequency] = useState<CheckInFrequency>('Every Friday');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Distribute Section
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [isDistributeChecked, setIsDistributeChecked] = useState(false);
  const [distributeRows, setDistributeRows] = useState<DistributeRow[]>([]);

  // Advanced Planning Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [checkpointPlans, setCheckpointPlans] = useState<Array<{ date: string; value: number }>>([]);

  // Errors & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened with objective
  useEffect(() => {
    if (isOpen && objective) {
      setName('');
      setShowDescription(false);
      setDescription('');
      setSelectedKpi(SEED_KPIS[0]); // Default Accuracy (%)
      setDirection('INCREASE');
      setFromValue('30');
      setToValue('80');
      setIsOwnershipSectionOpen(true);
      setOwnerId(objective.ownerId || currentUser?.id || 1);
      setPeriodName(currentCycle.name);
      setPriority('High');
      setFrequencyType('Standard');
      setCheckInFrequency('Every Friday');
      setTags(objective.tags ? [...objective.tags] : []);
      setIsDistributeChecked(false);
      setIsDistributeOpen(false);
      setDistributeRows([]);
      setErrors({});
      setIsSubmitting(false);

      // Generate 13 checkpoints for current cycle
      generateCheckpoints(30, 80);
    }
  }, [isOpen, objective?.id]);

  const generateCheckpoints = (fromVal: number, toVal: number) => {
    const dates = [
      'Oct 02, 2026',
      'Oct 09, 2026',
      'Oct 16, 2026',
      'Oct 23, 2026',
      'Oct 30, 2026',
      'Nov 06, 2026',
      'Nov 13, 2026',
      'Nov 20, 2026',
      'Nov 27, 2026',
      'Dec 04, 2026',
      'Dec 11, 2026',
      'Dec 18, 2026',
      'Dec 25, 2026',
    ];
    const n = dates.length;
    const plans = dates.map((date, idx) => {
      const k = idx + 1;
      const val = fromVal + ((toVal - fromVal) * k) / n;
      return { date, value: Math.round(val) };
    });
    setCheckpointPlans(plans);
  };

  const handleSelectKpi = (kpi: SeedKpiOption) => {
    setSelectedKpi(kpi);
    setFromValue(String(kpi.defaultBaseline));
    setToValue(String(kpi.defaultTarget));
    generateCheckpoints(kpi.defaultBaseline, kpi.defaultTarget);
    if (!name.trim()) {
      setName(`Achieve target for ${kpi.name}`);
    }
    setIsKpiDropdownOpen(false);
  };

  const handleFromChange = (val: string) => {
    setFromValue(val);
    const nFrom = Number(val);
    const nTo = Number(toValue);
    if (!isNaN(nFrom) && !isNaN(nTo)) {
      generateCheckpoints(nFrom, nTo);
    }
  };

  const handleToChange = (val: string) => {
    setToValue(val);
    const nFrom = Number(fromValue);
    const nTo = Number(val);
    if (!isNaN(nFrom) && !isNaN(nTo)) {
      generateCheckpoints(nFrom, nTo);
    }
  };

  const handleAddDistributeRow = () => {
    const availableUsers = db.users.filter((u) => u.active);
    const targetUser = availableUsers[distributeRows.length % availableUsers.length];
    const newRow: DistributeRow = {
      id: String(Date.now() + Math.random()),
      assigneeId: targetUser.id,
      assigneeName: targetUser.name,
      weight: 50,
      from: Number(fromValue) || 0,
      to: Number(toValue) || 100,
    };
    setDistributeRows([...distributeRows, newRow]);
  };

  const handleRemoveDistributeRow = (id: string) => {
    setDistributeRows(distributeRows.filter((r) => r.id !== id));
  };

  const validate = () => {
    const err: Record<string, string> = {};

    if (!objective) {
      err.objective = 'No parent objective selected';
      return false;
    }

    // Role check: A KR cannot be added to an Objective whose Approval is Pending or Rejected, or whose lifecycle is Completed or Archived
    if (objective.approvalState === 'PendingManager' || objective.approvalState === 'PendingHR') {
      err.approval = 'Cannot add Key Results to an objective pending approval.';
    }
    if (objective.approvalState === 'Rejected') {
      err.approval = 'Cannot add Key Results to a rejected objective.';
    }
    if (objective.status === 'Completed' || objective.status === 'Archived') {
      err.status = 'Cannot add Key Results to a completed or archived objective.';
    }

    if (!name.trim()) {
      err.name = 'Key Result name is required';
    }

    const nFrom = Number(fromValue);
    const nTo = Number(toValue);

    if (isNaN(nFrom) || isNaN(nTo)) {
      err.targets = 'From and To must be valid numbers';
    } else if (nFrom === nTo) {
      err.targets = 'From and To values must differ';
    }

    if (selectedKpi?.unit === 'Percentage') {
      if (nFrom < 0 || nFrom > 100 || nTo < 0 || nTo > 100) {
        err.targets = 'Percentage KPI values must be between 0 and 100';
      }
    }

    if (isDistributeChecked) {
      if (distributeRows.length === 0) {
        err.distribute = 'Add at least one distribution assignee row or untick Distribute.';
      } else {
        const totalWeight = distributeRows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
        if (totalWeight !== 100) {
          err.distribute = `Distribute weights must total exactly 100% (currently ${totalWeight}%).`;
        }
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !objective) return;

    setIsSubmitting(true);
    try {
      const measurementTypeObj = db.measurementTypes.find(
        (m) => m.name === (selectedKpi?.unit || 'Number')
      ) || db.measurementTypes[0];

      const baseline = Number(fromValue);
      const target = Number(toValue);

      // Create Key Result
      const newKR = await createKeyResult(
        {
          objectiveId: objective.id,
          ownerId,
          name: name.trim(),
          description: description.trim() || undefined,
          measurementTypeId: measurementTypeObj.id,
          direction,
          baseline,
          target,
          current: baseline,
          weightage: 50,
          startDate: objective.startDate,
          targetDate: objective.endDate,
          kpiName: selectedKpi?.name || 'Custom KPI',
          checkInFrequency,
          frequencyType,
          visibility: objective.visibility || 'Public',
          priority,
          tags: tags.length > 0 ? tags : undefined,
        },
        currentUser?.id || 1
      );

      // If distributed, create sub-key results
      if (isDistributeChecked && distributeRows.length > 0) {
        for (let i = 0; i < distributeRows.length; i++) {
          const row = distributeRows[i];
          await createKeyResult(
            {
              objectiveId: objective.id,
              ownerId: row.assigneeId,
              name: `${name.trim()} (${row.assigneeName})`,
              measurementTypeId: measurementTypeObj.id,
              direction,
              baseline: row.from,
              target: row.to,
              current: row.from,
              weightage: row.weight,
              startDate: objective.startDate,
              targetDate: objective.endDate,
              kpiName: selectedKpi?.name,
              checkInFrequency,
            },
            currentUser?.id || 1
          );
        }
      }

      showToast({
        type: 'success',
        message: `Key Result "${newKR.name}" added successfully.`,
      });

      onCreated?.(newKR.id);
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to add Key Result',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objective) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="2xl"
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#1e293b]">Add KPI</span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 bg-slate-100/80 px-2.5 py-1 rounded-lg">
            <Target className="w-3.5 h-3.5 text-[#2d8fd8] flex-shrink-0" />
            <span className="font-semibold text-slate-800 truncate max-w-xs">
              {objective.title}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">{periodName}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Create Key Result'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs text-slate-700">
          {errors.approval && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              {errors.approval}
            </div>
          )}
          {errors.status && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
              {errors.status}
            </div>
          )}

          {/* 1. Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-slate-700 text-xs">
                  Name <span className="text-red-500">*</span>
                </label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              {!showDescription ? (
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="text-[#2d8fd8] hover:underline text-[11px] font-medium"
                >
                  + Add Description
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDescription('');
                    setShowDescription(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Hide Description
                </button>
              )}
            </div>

            <textarea
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              maxLength={255}
              rows={2}
              placeholder="e.g. Increase percentage from 30 to 80"
              className={`w-full p-2.5 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] transition-all resize-none ${
                errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
              }`}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              {errors.name ? (
                <span className="text-red-500 font-medium">{errors.name}</span>
              ) : (
                <span />
              )}
              <span>{name.length}/255</span>
            </div>

            {showDescription && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Additional details about this metric..."
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              />
            )}
          </div>

          {/* 2. KPI Searchable Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 text-xs">
                KPI <span className="text-red-500">*</span>
              </label>
              {selectedKpi && (
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {selectedKpi.unit}
                </span>
              )}
            </div>

            {selectedKpi ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#2d8fd8]/10 text-[#2d8fd8] font-bold text-xs flex items-center justify-center">
                    {selectedKpi.badge}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">{selectedKpi.name}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({selectedKpi.unit})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKpi(null);
                    setIsKpiDropdownOpen(true);
                  }}
                  className="text-slate-400 hover:text-[#2d8fd8] p-1 rounded hover:bg-slate-200/50"
                  title="Change KPI"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={kpiSearch}
                    onChange={(e) => {
                      setKpiSearch(e.target.value);
                      setIsKpiDropdownOpen(true);
                    }}
                    onFocus={() => setIsKpiDropdownOpen(true)}
                    placeholder="Search KPI..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                  />
                </div>

                {isKpiDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                      {dept.name} KPIs
                    </div>
                    {SEED_KPIS.filter((k) =>
                      k.name.toLowerCase().includes(kpiSearch.toLowerCase())
                    ).map((k) => (
                      <button
                        key={k.name}
                        type="button"
                        onClick={() => handleSelectKpi(k)}
                        className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {k.badge}
                          </span>
                          <span className="font-medium text-slate-800">{k.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{k.unit}</span>
                      </button>
                    ))}
                    {kpiSearch.trim() && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectKpi({
                            name: kpiSearch.trim(),
                            unit: 'Number',
                            badge: '123',
                            defaultBaseline: 0,
                            defaultTarget: 100,
                          })
                        }
                        className="w-full text-left px-2 py-2 rounded-lg bg-blue-50 text-[#2d8fd8] font-medium flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Use custom KPI "{kpiSearch.trim()}"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Type, From & To */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">Type</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as KRDirection)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              >
                <option value="INCREASE">Increase (↑)</option>
                <option value="DECREASE">Decrease (↓)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">
                From <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs">
                To <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              />
            </div>
          </div>

          {errors.targets && (
            <p className="text-[11px] text-red-500 font-medium">{errors.targets}</p>
          )}

          {/* Advanced Planning link */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2d8fd8] hover:underline"
            >
              <span>Advanced Planning</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-[#2d8fd8] font-bold">
                NEW
              </span>
            </button>
            <span className="text-[11px] text-slate-400">
              13 weekly checkpoints scheduled
            </span>
          </div>

          {/* 4. Section Ownership and Progress Tracking */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            <button
              type="button"
              onClick={() => setIsOwnershipSectionOpen(!isOwnershipSectionOpen)}
              className="w-full px-4 py-3 bg-white flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200/80 text-xs hover:bg-slate-50 transition-colors"
            >
              <span>Ownership and Progress Tracking</span>
              {isOwnershipSectionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isOwnershipSectionOpen && (
              <div className="p-4 space-y-4 bg-white">
                {/* Owner */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 text-xs">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        showToast({ type: 'info', message: 'Owner preset saved.' })
                      }
                      className="text-[#2d8fd8] hover:underline text-[11px]"
                    >
                      Save as group
                    </button>
                  </div>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                  >
                    {db.users
                      .filter((u) => u.active)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.title}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Period & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">Period</label>
                    <input
                      disabled
                      value={periodName}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Frequency Type & Check-in Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">Frequency Type</label>
                    <select
                      value={frequencyType}
                      onChange={(e) =>
                        setFrequencyType(e.target.value as 'Standard' | 'Advanced')
                      }
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">
                      Check in Frequency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={checkInFrequency}
                      onChange={(e) => setCheckInFrequency(e.target.value as CheckInFrequency)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                    >
                      <option value="Every Friday">Every Friday (Default)</option>
                      <option value="Every Monday">Every Monday</option>
                      <option value="Every Tuesday">Every Tuesday</option>
                      <option value="Every Wednesday">Every Wednesday</option>
                      <option value="Every Thursday">Every Thursday</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Section Distribute (Collapsed by default) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            <div className="p-4 bg-white flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDistributeChecked}
                  onChange={(e) => {
                    setIsDistributeChecked(e.target.checked);
                    if (e.target.checked && distributeRows.length === 0) {
                      handleAddDistributeRow();
                    }
                  }}
                  className="rounded border-slate-300 text-[#2d8fd8] focus:ring-[#2d8fd8] w-4 h-4"
                />
                <span className="font-semibold text-slate-800 text-xs">
                  Distribute this target as sub-key results to departments/employees
                </span>
              </label>
            </div>

            {isDistributeChecked && (
              <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Sub-key results table</span>
                  <button
                    type="button"
                    onClick={handleAddDistributeRow}
                    className="text-[#2d8fd8] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Assignee
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Assignee</th>
                        <th className="p-2 w-20">Weight %</th>
                        <th className="p-2 w-20">From</th>
                        <th className="p-2 w-20">To</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {distributeRows.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="p-2">
                            <select
                              value={r.assigneeId}
                              onChange={(e) => {
                                const uid = Number(e.target.value);
                                const u = db.users.find((usr) => usr.id === uid);
                                const updated = [...distributeRows];
                                updated[idx].assigneeId = uid;
                                updated[idx].assigneeName = u?.name || 'Assignee';
                                setDistributeRows(updated);
                              }}
                              className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                            >
                              {db.users.map((usr) => (
                                <option key={usr.id} value={usr.id}>
                                  {usr.name} ({usr.title})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={r.weight}
                              onChange={(e) => {
                                const updated = [...distributeRows];
                                updated[idx].weight = Number(e.target.value);
                                setDistributeRows(updated);
                              }}
                              className="w-full h-8 px-2 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={r.from}
                              onChange={(e) => {
                                const updated = [...distributeRows];
                                updated[idx].from = Number(e.target.value);
                                setDistributeRows(updated);
                              }}
                              className="w-full h-8 px-2 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={r.to}
                              onChange={(e) => {
                                const updated = [...distributeRows];
                                updated[idx].to = Number(e.target.value);
                                setDistributeRows(updated);
                              }}
                              className="w-full h-8 px-2 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDistributeRow(r.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>
                    Total weight:{' '}
                    <strong
                      className={
                        distributeRows.reduce((sum, r) => sum + r.weight, 0) === 100
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }
                    >
                      {distributeRows.reduce((sum, r) => sum + r.weight, 0)}/100%
                    </strong>
                  </span>
                  {errors.distribute && (
                    <span className="text-red-500 font-medium">{errors.distribute}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Advanced Planning Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Advanced Checkpoint Planning"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Review or override the linear milestone target for each scheduled Friday checkpoint.
          </p>
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 border-b">
                <tr>
                  <th className="p-2.5 text-left">Checkpoint Date</th>
                  <th className="p-2.5 text-right w-32">Planned Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checkpointPlans.map((cp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-800">{cp.date}</td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        value={cp.value}
                        onChange={(e) => {
                          const updated = [...checkpointPlans];
                          updated[idx].value = Number(e.target.value);
                          setCheckpointPlans(updated);
                        }}
                        className="w-24 h-7 px-2 text-right rounded border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-[#2d8fd8]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                showToast({ type: 'success', message: 'Checkpoint milestones saved.' });
                setIsPlanModalOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
