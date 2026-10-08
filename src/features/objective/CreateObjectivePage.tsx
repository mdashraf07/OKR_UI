import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Check,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Lightbulb,
  Save,
  ArrowRight,
  ArrowLeft,
  FileCode2,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { ObjectiveLevel, Template, KeyResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { KeyResultDrawer, KeyResultFormData } from '../key-result/KeyResultDrawer';
import { ObjectiveStatusPill, ApprovalChip } from '../../components/ui/Chips';
import { useToastStore } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const CreateObjectivePage: React.FC = () => {
  const { objectiveId } = useParams<{ objectiveId?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(objectiveId);

  const { currentUser, selectedCycleId } = useAuthStore();
  const {
    objectives: storeObjectives,
    createObjective: storeCreateObj,
    updateObjective: storeUpdateObj,
    submitObjective: storeSubmitObj,
  } = useOkrStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const db = getDb();
  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];

  // 3-Step Flow: 1. Objective Details -> 2. Key Results -> 3. Review & Submit
  const [step, setStep] = useState<number>(1);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(
    Boolean(searchParams.get('template'))
  );

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState<number>(currentUser?.id || 1);
  const [level, setLevel] = useState<ObjectiveLevel>('Individual');
  const [departmentId, setDepartmentId] = useState<number>(currentUser?.departmentId || 1);
  const [startDate, setStartDate] = useState(currentCycle.startDate.slice(0, 10));
  const [endDate, setEndDate] = useState(currentCycle.endDate.slice(0, 10));
  const [weightage, setWeightage] = useState<number>(50);
  const [parentObjectiveId, setParentObjectiveId] = useState<number | undefined>(undefined);
  const [keyResults, setKeyResults] = useState<KeyResultFormData[]>([]);

  // Drawer & Dialog States
  const [isKRDrawerOpen, setIsKRDrawerOpen] = useState(false);
  const [editingKRIndex, setEditingKRIndex] = useState<number | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if edit mode
  useEffect(() => {
    if (objectiveId) {
      const obj = storeObjectives.find((o) => String(o.id) === String(objectiveId));
      if (obj) {
        setTitle(obj.title);
        setDescription(obj.description || '');
        setOwnerId(obj.ownerId);
        setLevel(obj.level);
        setDepartmentId(obj.departmentId || 1);
        setStartDate(obj.startDate.slice(0, 10));
        setEndDate(obj.endDate.slice(0, 10));
        setWeightage(obj.weightage);
        setParentObjectiveId(obj.parentObjectiveId);

        const krs = db.keyResults.filter((k) => k.objectiveId === obj.id);
        setKeyResults(
          krs.map((k) => ({
            id: k.id,
            name: k.name,
            description: k.description,
            ownerId: k.ownerId,
            measurementTypeId: k.measurementTypeId,
            direction: k.direction,
            baseline: k.baseline,
            target: k.target,
            current: k.current,
            weightage: k.weightage,
            startDate: k.startDate,
            targetDate: k.targetDate,
          }))
        );
      }
    }
  }, [objectiveId, storeObjectives]);

  // KR Weightage Validation
  const krWeightageTotal = keyResults.reduce((sum, kr) => sum + (Number(kr.weightage) || 0), 0);
  const isWeightageValid = krWeightageTotal === 100;

  const handleSplitEvenly = () => {
    if (keyResults.length === 0) return;
    const split = Math.floor(100 / keyResults.length);
    const remainder = 100 - split * keyResults.length;
    const updated = keyResults.map((kr, idx) => ({
      ...kr,
      weightage: idx === keyResults.length - 1 ? split + remainder : split,
    }));
    setKeyResults(updated);
    showToast({ type: 'info', message: 'Weightages split evenly across key results' });
  };

  const handlePutRemainderOnLast = () => {
    if (keyResults.length === 0) return;
    const currentSumWithoutLast = keyResults
      .slice(0, -1)
      .reduce((sum, kr) => sum + (Number(kr.weightage) || 0), 0);
    const remaining = Math.max(0, 100 - currentSumWithoutLast);
    const updated = [...keyResults];
    updated[updated.length - 1].weightage = remaining;
    setKeyResults(updated);
    showToast({ type: 'info', message: `Remainder of ${remaining}% assigned to last KR` });
  };

  // Template prefill
  const handleSelectTemplate = (template: Template) => {
    const objTemplate = template.objectives[0];
    if (objTemplate) {
      setTitle(objTemplate.title);
      setDescription(objTemplate.description);
      setLevel(objTemplate.level);
      setKeyResults(
        objTemplate.keyResults.map((kr) => ({
          name: kr.name,
          measurementTypeId: kr.measurementTypeId,
          direction: kr.direction,
          baseline: kr.baseline,
          target: kr.target,
          weightage: kr.weightage,
          ownerId,
          startDate: new Date(startDate).toISOString(),
          targetDate: new Date(endDate).toISOString(),
        }))
      );
      showToast({ type: 'success', message: `Template "${template.name}" applied` });
      setIsTemplateModalOpen(false);
    }
  };

  // Add / Edit KR from Drawer
  const handleSaveKR = (krData: KeyResultFormData, andAddAnother?: boolean) => {
    if (editingKRIndex !== null) {
      const updated = [...keyResults];
      updated[editingKRIndex] = krData;
      setKeyResults(updated);
      setEditingKRIndex(null);
    } else {
      setKeyResults([...keyResults, krData]);
    }
    if (!andAddAnother) {
      setIsKRDrawerOpen(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      showToast({ type: 'error', message: 'Objective title is required.' });
      return;
    }

    try {
      if (isEdit) {
        await storeUpdateObj(
          Number(objectiveId),
          {
            title,
            description,
            level,
            departmentId,
            weightage,
            parentObjectiveId,
          },
          currentUser?.id || 1
        );
      } else {
        await storeCreateObj(
          {
            cycleId: selectedCycleId,
            ownerId,
            level,
            departmentId,
            title: title || 'Draft Objective',
            description,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            weightage,
            parentObjectiveId,
            keyResults: keyResults.map((kr) => ({ ...kr, current: kr.current ?? 0 })),
          },
          currentUser?.id || 1
        );
      }
      showToast({ type: 'success', message: 'Objective draft saved' });
      navigate('/okrs');
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to save' });
    }
  };

  // Final Submit for Approval (Requires Key Results)
  const handleSubmitForApproval = async () => {
    if (keyResults.length === 0) {
      showToast({
        type: 'error',
        message: 'An Objective cannot be submitted without at least one Key Result.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let targetObjId = Number(objectiveId);
      if (!isEdit) {
        const created = await storeCreateObj(
          {
            cycleId: selectedCycleId,
            ownerId,
            level,
            departmentId,
            title,
            description,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            weightage,
            parentObjectiveId,
            keyResults: keyResults.map((kr) => ({ ...kr, current: kr.current ?? 0 })),
          },
          currentUser?.id || 1
        );
        targetObjId = created.id;
      }

      await storeSubmitObj(targetObjId, currentUser?.id || 1);
      setIsSubmitting(false);
      setIsSubmitConfirmOpen(false);
      showToast({ type: 'success', message: 'Submitted for Level 1 Manager Review' });
      navigate(`/okrs/${targetObjId}`);
    } catch (err: any) {
      setIsSubmitting(false);
      showToast({ type: 'error', message: err.message || 'Submission error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">
            {isEdit ? 'Edit Objective' : 'Create Objective'}
          </h1>
          <p className="text-xs text-[#64748b]">
            Cycle: {currentCycle.name} · Follows standard 2-stage HRMS approval
          </p>
        </div>
        {!isEdit && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsTemplateModalOpen(true)}
            leftIcon={<FileCode2 className="w-3.5 h-3.5" />}
          >
            Start from Template
          </Button>
        )}
      </div>

      {/* 3-Step Stepper Header: Objective -> Key Results -> Review & Submit */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        {[
          { num: 1, label: '1. Objective Details' },
          { num: 2, label: '2. Key Results' },
          { num: 3, label: '3. Review & Submit' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
            className={`flex items-center gap-2 cursor-pointer ${
              step === s.num
                ? 'text-[#2d8fd8] font-bold'
                : step > s.num
                ? 'text-emerald-600 font-medium'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? 'bg-[#2d8fd8] text-white shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className="text-xs hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: OBJECTIVE DETAILS */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Objective Details</h2>
              <p className="text-xs text-[#64748b]">
                Define clear, outcome-focused goal parameters.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Objective Title"
              placeholder="e.g., Close 3 enterprise deals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#374151]">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain the business impact and expected outcomes..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Objective Level"
                value={level}
                onChange={(e) => setLevel(e.target.value as ObjectiveLevel)}
                options={[
                  { value: 'Individual', label: 'Individual' },
                  { value: 'Team', label: 'Team' },
                  { value: 'Department', label: 'Department' },
                  { value: 'Organization', label: 'Organization' },
                ]}
              />

              <Select
                label="Department"
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                options={db.departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

            {/* Parent Objective Alignment */}
            <Select
              label="Parent Alignment Objective (Optional)"
              value={parentObjectiveId || ''}
              onChange={(e) =>
                setParentObjectiveId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">No alignment (Standalone goal)</option>
              {db.objectives
                .filter((o) => o.cycleId === selectedCycleId && o.status === 'Active')
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    [{o.level}] {o.title}
                  </option>
                ))}
            </Select>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate('/okrs')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!title.trim()}
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Configure Key Results
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: KEY RESULTS (REQUIRED) */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">Define Key Results</h2>
              <p className="text-xs text-[#64748b]">
                An Objective must have at least one measurable Key Result. Weightages must total 100%.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingKRIndex(null);
                setIsKRDrawerOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Key Result
            </Button>
          </div>

          {/* Weightage Meter Bar */}
          <div
            className={`p-4 rounded-xl border ${
              isWeightageValid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className={isWeightageValid ? 'text-emerald-800' : 'text-amber-800'}>
                Total KR Weightage: {krWeightageTotal}% / 100%
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {isWeightageValid
                  ? '✓ Balanced'
                  : krWeightageTotal > 100
                  ? `Exceeds by ${krWeightageTotal - 100}%`
                  : `Remaining: ${100 - krWeightageTotal}%`}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${isWeightageValid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, krWeightageTotal)}%` }}
              />
            </div>

            {keyResults.length > 1 && !isWeightageValid && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSplitEvenly}
                  className="text-[11px] text-[#2d8fd8] hover:underline font-semibold"
                >
                  Split Evenly
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={handlePutRemainderOnLast}
                  className="text-[11px] text-[#2d8fd8] hover:underline font-semibold"
                >
                  Assign Remainder to Last KR
                </button>
              </div>
            )}
          </div>

          {/* Key Results List */}
          <div className="space-y-3">
            {keyResults.map((kr, index) => {
              const type = db.measurementTypes.find((m) => m.id === kr.measurementTypeId);
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{kr.name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Baseline: {kr.baseline} · Target: {kr.target} {type?.unitSymbol || ''} · Direction: {kr.direction}
                    </div>
                    <div className="text-[11px] font-semibold text-[#2d8fd8] mt-1">
                      Weightage: {kr.weightage}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingKRIndex(index);
                        setIsKRDrawerOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setKeyResults(keyResults.filter((_, i) => i !== index))}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {keyResults.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                At least one Key Result is required before submission. Click "Add Key Result" above.
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Details
            </Button>
            <Button
              variant="primary"
              disabled={keyResults.length === 0 || !isWeightageValid}
              onClick={() => setStep(3)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Review & Submit
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & SUBMIT */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">Review & Submit Objective</h2>
            <p className="text-xs text-[#64748b]">
              Verify your Objective and Key Results before submitting for manager approval.
            </p>
          </div>

          {/* Objective Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {level} Level
              </span>
              <ObjectiveStatusPill status="Draft" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-600">{description}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Cycle</span>
                <span className="font-semibold text-slate-800">{currentCycle.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Objective Weightage</span>
                <span className="font-semibold text-slate-800">{weightage}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Key Results</span>
                <span className="font-semibold text-slate-800">{keyResults.length} defined</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Approval State</span>
                <ApprovalChip state="NotSubmitted" />
              </div>
            </div>
          </div>

          {/* Key Results Review List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Associated Key Results ({keyResults.length})
            </div>
            {keyResults.map((kr, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{kr.name}</span>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Baseline: {kr.baseline} → Target: {kr.target} ({kr.direction})
                  </div>
                </div>
                <span className="font-bold text-[#2d8fd8]">{kr.weightage}%</span>
              </div>
            ))}
          </div>

          {/* Approval Governance Route */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2">
            <div className="text-xs font-bold text-[#0369a1] uppercase tracking-wider">
              Governance Approval Path
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <span className="font-semibold">1. Employee Submit</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">2. Manager Review (Level 1)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">3. HR/Admin Review (Level 2)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-emerald-700 font-bold">Active</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Key Results
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSaveDraft} leftIcon={<Save className="w-4 h-4" />}>
                Save Draft
              </Button>
              <Button
                variant="primary"
                disabled={keyResults.length === 0}
                onClick={() => setIsSubmitConfirmOpen(true)}
                isLoading={isSubmitting}
              >
                Submit for Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Start from Pre-Approved Template"
        description="Choose a best-practice goal framework with pre-configured key results"
        maxWidth="lg"
      >
        <div className="space-y-3">
          {db.templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#2d8fd8] bg-slate-50/50 hover:bg-sky-50/40 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div>
                <h3 className="font-bold text-slate-900">{tpl.name}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">{tpl.description}</p>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                  {tpl.objectives[0]?.keyResults.length || 0} Key Results included
                </div>
              </div>
              <Button size="sm" variant="primary">
                Apply Template
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* KR Drawer */}
      <KeyResultDrawer
        isOpen={isKRDrawerOpen}
        onClose={() => setIsKRDrawerOpen(false)}
        onSave={handleSaveKR}
        initialData={
          editingKRIndex !== null
            ? ({
                ...keyResults[editingKRIndex],
                id: keyResults[editingKRIndex].id || 0,
                objectiveId: Number(objectiveId) || 0,
                achievementPercent: 0,
                status: 'On Track',
                statusOverridden: false,
                createdBy: currentUser?.id || 1,
                createdAt: new Date().toISOString(),
              } as KeyResult)
            : null
        }
        objectiveDates={{ startDate, endDate }}
        defaultOwnerId={ownerId}
      />

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        onConfirm={handleSubmitForApproval}
        title="Submit Objective for Approval?"
        message={`This will submit "${title}" along with its ${keyResults.length} Key Results for Level 1 Manager Review.`}
        confirmLabel="Submit for Approval"
        isLoading={isSubmitting}
      />
    </div>
  );
};
