import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  ListPlus,
  Plus,
  Check,
  Building2,
  User as UserIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { useToastStore } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { PerspectiveType, VisibilityType, PriorityType, ObjectiveLevel } from '../../types';

export interface CreateObjectiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: number;
  onCreated?: (objectiveId: number) => void;
}

const PERSPECTIVES: PerspectiveType[] = [
  'Customer',
  'Financial',
  'Internal Business Processes',
  'Learning & Growth',
];

const PRESET_TAGS = ['Customer', 'Growth', 'Revenue', 'Product', 'Operations', 'Engineering', 'Strategic', 'Quality'];

export const CreateObjectiveDrawer: React.FC<CreateObjectiveDrawerProps> = ({
  isOpen,
  onClose,
  departmentId: propDepartmentId,
  onCreated,
}) => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { createObjective } = useOkrStore();
  const { showToast } = useToastStore();
  const db = getDb();

  // Selected Department
  const activeDeptId = propDepartmentId || currentUser?.departmentId || 1;
  const currentDept = db.departments.find((d) => d.id === activeDeptId) || db.departments[0];
  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];

  // Form State
  const [perspective, setPerspective] = useState<PerspectiveType | ''>('');
  const [title, setTitle] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  // Owners: list of { type: 'dept' | 'user', id: number, label: string }
  interface OwnerChip {
    type: 'dept' | 'user';
    id: number;
    label: string;
  }
  const [selectedOwners, setSelectedOwners] = useState<OwnerChip[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const [cycleId, setCycleId] = useState<number>(selectedCycleId || 2);
  const [visibility, setVisibility] = useState<VisibilityType>('Public');
  const [priority, setPriority] = useState<PriorityType>('High');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBacklogModalOpen, setIsBacklogModalOpen] = useState(false);

  // Validation & Loading
  const [errors, setErrors] = useState<{ title?: string; owners?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset / initialize state on open
  useEffect(() => {
    if (isOpen) {
      setPerspective('');
      setTitle('');
      setShowDescription(false);
      setDescription('');
      setIsSectionOpen(true);
      // Default owner chip is current department
      setSelectedOwners([
        {
          type: 'dept',
          id: currentDept.id,
          label: currentDept.name,
        },
      ]);
      setCycleId(selectedCycleId || 2);
      setVisibility('Public');
      setPriority('High');
      setTags([]);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [isOpen, activeDeptId, currentDept.id, currentDept.name, selectedCycleId]);

  // Validation check
  const validate = () => {
    const newErrors: { title?: string; owners?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Objective name is required';
    } else if (title.trim().length > 255) {
      newErrors.title = 'Objective name must be at most 255 characters';
    }
    if (selectedOwners.length === 0) {
      newErrors.owners = 'At least one owner is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTitleBlur = () => {
    setTouched((prev) => ({ ...prev, title: true }));
    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Objective name is required' }));
    } else {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleAddOwner = (owner: OwnerChip) => {
    if (!selectedOwners.some((o) => o.type === owner.type && o.id === owner.id)) {
      setSelectedOwners((prev) => [...prev, owner]);
      setErrors((prev) => ({ ...prev, owners: undefined }));
    }
    setOwnerSearchQuery('');
    setIsOwnerDropdownOpen(false);
  };

  const handleRemoveOwner = (ownerToRemove: OwnerChip) => {
    setSelectedOwners((prev) =>
      prev.filter((o) => !(o.type === ownerToRemove.type && o.id === ownerToRemove.id))
    );
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedCycleObj = db.cycles.find((c) => c.id === cycleId) || currentCycle;
      // Primary owner ID (if user selected, use user id, else fallback to current user)
      const primaryUserOwner = selectedOwners.find((o) => o.type === 'user');
      const resolvedOwnerId = primaryUserOwner ? primaryUserOwner.id : currentUser?.id || 1;

      // Determine level based on owner type
      const hasDeptOwner = selectedOwners.some((o) => o.type === 'dept');
      const level: ObjectiveLevel = hasDeptOwner ? 'Department' : 'Individual';

      const newObjective = await createObjective(
        {
          cycleId,
          ownerId: resolvedOwnerId,
          level,
          departmentId: currentDept.id,
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: selectedCycleObj.startDate,
          endDate: selectedCycleObj.endDate,
          weightage: 50,
          perspective: perspective || undefined,
          visibility,
          priority,
          tags: tags.length > 0 ? tags : undefined,
          // Explicitly creating objective separately - NO key results required!
        },
        currentUser?.id || 1
      );

      showToast({
        type: 'success',
        message: `Objective "${newObjective.title}" created successfully as Draft.`,
      });

      onCreated?.(newObjective.id);
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to create objective',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered owners search candidates
  const filteredUsers = db.users.filter(
    (u) =>
      u.active &&
      (u.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
        u.title.toLowerCase().includes(ownerSearchQuery.toLowerCase()))
  );
  const filteredDepts = db.departments.filter((d) =>
    d.name.toLowerCase().includes(ownerSearchQuery.toLowerCase())
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="2xl"
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#1e293b]">
              Create Objective: {currentDept.name}
            </span>
          </div>
        }
        subtitle="Define a high-level outcome for this department or team."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs text-slate-700">
          {/* 1. Perspective (Optional) */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 text-xs">Perspective</label>
            <select
              value={perspective}
              onChange={(e) => setPerspective(e.target.value as PerspectiveType)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] focus:border-transparent transition-all"
            >
              <option value="">Please choose</option>
              {PERSPECTIVES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Name (Required, max 255) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-slate-700 text-xs">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="group relative cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-52 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-50 pointer-events-none">
                    State clearly what you want to achieve. Objectives should be impactful, ambitious, and qualitative.
                  </div>
                </div>
              </div>

              {/* Template & Backlog links */}
              <div className="flex items-center gap-3 text-xs font-semibold text-[#2d8fd8]">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  Create From Template
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsBacklogModalOpen(true)}
                  className="hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ListPlus className="w-3 h-3" />
                  Backlog
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                onBlur={handleTitleBlur}
                maxLength={255}
                rows={3}
                placeholder="Type your objective"
                className={`w-full p-3 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] focus:border-transparent transition-all resize-none ${
                  errors.title ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                }`}
              />
              <div className="text-right text-[11px] text-slate-400 mt-1">
                {title.length}/255
              </div>
            </div>

            {errors.title && (
              <p className="text-[11px] text-red-500 font-medium">{errors.title}</p>
            )}

            {/* Description toggle */}
            {!showDescription ? (
              <button
                type="button"
                onClick={() => setShowDescription(true)}
                className="text-[#2d8fd8] hover:underline text-xs font-medium flex items-center gap-1 pt-0.5"
              >
                <Plus className="w-3 h-3" />
                Add Description
              </button>
            ) : (
              <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-600 text-xs">Description</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription('');
                      setShowDescription(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Hide
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Additional context or strategic notes..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                />
              </div>
            )}
          </div>

          {/* 3. Section Ownership and Progress Tracking (Collapsible, open by default) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            <button
              type="button"
              onClick={() => setIsSectionOpen(!isSectionOpen)}
              className="w-full px-4 py-3 bg-white flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200/80 text-xs hover:bg-slate-50 transition-colors"
            >
              <span>Ownership and Progress Tracking</span>
              {isSectionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isSectionOpen && (
              <div className="p-4 space-y-4 bg-white">
                {/* Owner Chip Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 text-xs">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        showToast({
                          type: 'info',
                          message: 'Owners saved as collaborative group preset.',
                        })
                      }
                      className="text-[#2d8fd8] hover:underline text-[11px] font-medium"
                    >
                      Save as group
                    </button>
                  </div>

                  {/* Chips container & search */}
                  <div className="p-2 border border-slate-200 rounded-lg bg-white flex flex-wrap items-center gap-1.5 min-h-[42px] focus-within:ring-2 focus-within:ring-[#2d8fd8] focus-within:border-transparent">
                    {selectedOwners.map((owner) => (
                      <span
                        key={`${owner.type}-${owner.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#e7ecf2] text-slate-800"
                      >
                        {owner.type === 'dept' ? (
                          <Building2 className="w-3 h-3 text-[#2d8fd8]" />
                        ) : (
                          <UserIcon className="w-3 h-3 text-[#1a7260]" />
                        )}
                        <span>{owner.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOwner(owner)}
                          className="hover:text-red-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    <div className="relative flex-1 min-w-[120px]">
                      <input
                        type="text"
                        value={ownerSearchQuery}
                        onChange={(e) => {
                          setOwnerSearchQuery(e.target.value);
                          setIsOwnerDropdownOpen(true);
                        }}
                        onFocus={() => setIsOwnerDropdownOpen(true)}
                        placeholder={selectedOwners.length === 0 ? 'Add owner...' : 'Add more...'}
                        className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 p-1"
                      />

                      {/* Dropdown suggestions */}
                      {isOwnerDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          <div className="p-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                              Departments
                            </div>
                            {filteredDepts.slice(0, 4).map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() =>
                                  handleAddOwner({ type: 'dept', id: d.id, label: d.name })
                                }
                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 rounded-lg flex items-center justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <Building2 className="w-3.5 h-3.5 text-[#2d8fd8]" />
                                  <span>{d.name}</span>
                                </span>
                                {selectedOwners.some((o) => o.type === 'dept' && o.id === d.id) && (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="p-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                              Team Members
                            </div>
                            {filteredUsers.slice(0, 5).map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() =>
                                  handleAddOwner({ type: 'user', id: u.id, label: u.name })
                                }
                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 rounded-lg flex items-center justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <UserIcon className="w-3.5 h-3.5 text-[#1a7260]" />
                                  <span>{u.name}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">{u.title}</span>
                              </button>
                            ))}
                          </div>

                          <div className="p-1 text-center bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setIsOwnerDropdownOpen(false)}
                              className="text-[11px] text-slate-500 hover:text-slate-800"
                            >
                              Close list
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.owners && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.owners}</p>
                  )}
                </div>

                {/* Period & Visibility */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="font-semibold text-slate-700 text-xs">
                        Period <span className="text-red-500">*</span>
                      </label>
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                    </div>
                    <select
                      value={cycleId}
                      onChange={(e) => setCycleId(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                    >
                      {db.cycles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">
                      Visibility <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as VisibilityType)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Priority & Tags */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as PriorityType)}
                        className="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            priority === 'High'
                              ? 'bg-red-500'
                              : priority === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-xs">Tags</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(tagInput);
                          }
                        }}
                        placeholder="Type tag & Enter..."
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                      />
                    </div>
                  </div>
                </div>

                {/* Selected tags chip pills */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Preset tag suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-500">
                  <span>Suggested:</span>
                  {PRESET_TAGS.filter((pt) => !tags.includes(pt))
                    .slice(0, 4)
                    .map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => handleAddTag(pt)}
                        className="text-[#2d8fd8] hover:underline"
                      >
                        +{pt}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Template Picker Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Choose Objective Template"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Select a verified HRMS OKR template to prefill objective details.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {db.templates.map((tpl) => {
              const firstObj = tpl.objectives[0];
              const titleToUse = firstObj?.title || tpl.name;
              const descToUse = firstObj?.description || tpl.description || '';
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setTitle(titleToUse);
                    setDescription(descToUse);
                    setShowDescription(Boolean(descToUse));
                    setIsTemplateModalOpen(false);
                  }}
                  className="p-3 border border-slate-200 hover:border-[#2d8fd8] rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <div className="font-semibold text-xs text-slate-900">{tpl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {descToUse}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                      v{tpl.version} · {tpl.status}
                    </span>
                    <span>{tpl.objectives.length} strategic objective(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Backlog Picker Modal */}
      <Modal
        isOpen={isBacklogModalOpen}
        onClose={() => setIsBacklogModalOpen(false)}
        title="Select From Backlog"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Pick from strategic initiatives prioritized for future cycles.
          </p>
          <div className="space-y-2">
            {[
              {
                title: 'Accelerate Mid-Market Pipeline Velocity',
                desc: 'Shorten average qualification timeline from 24 days to under 14 days.',
              },
              {
                title: 'Customer Success Onboarding SLA Modernization',
                desc: 'Achieve zero onboarding delay for high tier enterprise accounts.',
              },
              {
                title: 'Platform Infrastructure Redundancy and 99.95% Availability',
                desc: 'Deploy geo-distributed Kubernetes clusters with automated health failover.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setTitle(item.title);
                  setDescription(item.desc);
                  setShowDescription(true);
                  setIsBacklogModalOpen(false);
                }}
                className="p-3 border border-slate-200 hover:border-[#2d8fd8] rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="font-semibold text-xs text-slate-900">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};
