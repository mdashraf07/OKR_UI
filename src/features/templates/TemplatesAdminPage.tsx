import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  CheckCircle2,
  XCircle,
  Tag,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  createTemplateVersion,
  getDepartments,
} from '../../api';
import { Template, Department } from '../../types';
import { useAuthStore } from '../auth/authStore';

export const TemplatesAdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'assignments'>('content');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetDept, setNewTargetDept] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, dList] = await Promise.all([getTemplates(), getDepartments()]);
      setTemplates(tList);
      setDepartments(dList);
      if (tList.length > 0 && !selectedTemplate) {
        setSelectedTemplate(tList[0]);
      } else if (selectedTemplate) {
        const found = tList.find((t) => t.id === selectedTemplate.id);
        setSelectedTemplate(found || tList[0] || null);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (tpl: Template) => {
    if (!user) return;
    try {
      const newStatus = tpl.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateTemplate(tpl.id, { status: newStatus }, user.id);
      showToast('success', `Template marked as ${newStatus}`);
      loadData();
    } catch {
      showToast('error', 'Failed to update template status.');
    }
  };

  const handleCreateVersion = async (tpl: Template) => {
    if (!user) return;
    try {
      const newVer = await createTemplateVersion(tpl.id, user.id);
      showToast('success', `Created new version v${newVer.version} of ${newVer.name}`);
      await loadData();
      setSelectedTemplate(newVer);
    } catch {
      showToast('error', 'Failed to create new template version.');
    }
  };

  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    setCreating(true);
    try {
      const created = await createTemplate(
        {
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          status: 'ACTIVE',
          objectives: [
            {
              title: 'Default Objective Target',
              description: 'Primary strategic focal point',
              level: 'Individual',
              displayOrder: 1,
              keyResults: [
                {
                  name: 'Key milestone delivery 1',
                  measurementTypeId: 1,
                  direction: 'INCREASE',
                  baseline: 0,
                  target: 10,
                  weightage: 50,
                },
                {
                  name: 'Performance metrics achievement',
                  measurementTypeId: 3,
                  direction: 'INCREASE',
                  baseline: 0,
                  target: 100,
                  weightage: 50,
                },
              ],
            },
          ],
          assignments: newTargetDept
            ? [{ type: 'DEPARTMENT', targetId: Number(newTargetDept) }]
            : [{ type: 'LEVEL', targetId: 'Individual' }],
        },
        user.id
      );

      showToast('success', `Created template "${created.name}"`);
      setCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
      setNewTargetDept('');
      await loadData();
      setSelectedTemplate(created);
    } catch {
      showToast('error', 'Failed to create template.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            OKR Goal Templates
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Standardize goal setting across teams and departments with pre-structured objectives and key results.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Template
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="No templates found"
          description="Create your first organization or departmental OKR template."
          action={{
            label: 'Create Template',
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates Master List */}
          <div className="lg:col-span-4 bg-surface rounded-xl border border-border shadow-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Available Templates ({templates.length})
              </span>
              <span className="text-xs text-text-muted">v1.0 & v2.0</span>
            </div>

            <div className="divide-y divide-border overflow-y-auto max-h-[620px]">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-soft/40 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span>{tpl.name}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          tpl.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {tpl.status}
                      </span>
                    </div>

                    {tpl.description && (
                      <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-[11px] text-text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        v{tpl.version}
                      </span>
                      <span>•</span>
                      <span>{tpl.objectives.length} Objectives</span>
                      <span>•</span>
                      <span>
                        {tpl.assignments.map((a) => a.type).join(', ') || 'All'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Detail & Preview Panel */}
          {selectedTemplate && (
            <div className="lg:col-span-8 bg-surface rounded-xl border border-border shadow-card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text-primary">
                      {selectedTemplate.name}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      v{selectedTemplate.version}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {selectedTemplate.description || 'Pre-configured objective blueprint.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCreateVersion(selectedTemplate)}
                  >
                    New Version
                  </Button>
                  <Button
                    variant={selectedTemplate.status === 'ACTIVE' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(selectedTemplate)}
                  >
                    {selectedTemplate.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-white px-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'content'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Blueprint Objectives ({selectedTemplate.objectives.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('assignments')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'assignments'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Assignments & Scope ({selectedTemplate.assignments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('versions')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'versions'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Version Control
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto max-h-[520px]">
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    {selectedTemplate.objectives.map((obj, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {obj.displayOrder || oIdx + 1}
                            </span>
                            <span className="font-semibold text-sm text-text-primary">
                              {obj.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-border text-text-secondary">
                            Level: {obj.level}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary pl-7">{obj.description}</p>

                        <div className="pl-7 space-y-2 pt-2 border-t border-border/60">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                            Key Results ({obj.keyResults.length}):
                          </span>
                          {obj.keyResults.map((kr, kIdx) => (
                            <div
                              key={kIdx}
                              className="bg-white p-3 rounded-lg border border-border flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-medium text-text-primary">{kr.name}</span>
                                <div className="text-[11px] text-text-muted flex items-center gap-2">
                                  <span>Direction: {kr.direction}</span>
                                  <span>•</span>
                                  <span>
                                    Baseline: {kr.baseline} → Target: {kr.target}
                                  </span>
                                </div>
                              </div>
                              <span className="font-semibold text-primary bg-primary-soft/30 px-2 py-1 rounded text-xs">
                                {kr.weightage}% wt
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <div className="space-y-4">
                    <p className="text-xs text-text-secondary">
                      This template is automatically recommended to employees whose profiles match the following assignments:
                    </p>
                    <div className="space-y-2">
                      {selectedTemplate.assignments.map((assign, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-slate-50/50 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {assign.type === 'DEPARTMENT' && (
                              <Building2 className="w-4 h-4 text-primary" />
                            )}
                            {assign.type === 'ROLE' && <Users className="w-4 h-4 text-emerald-600" />}
                            {assign.type === 'LEVEL' && <Tag className="w-4 h-4 text-blue-600" />}
                            <div>
                              <span className="font-semibold text-text-primary block">
                                Assigned to {assign.type}
                              </span>
                              <span className="text-text-secondary">
                                Target ID / Code: {assign.targetId}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Active Scope
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-text-primary block">
                          Current Live Version: v{selectedTemplate.version}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Created and published in OKR system. Previous versions are archived.
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Copy className="w-3.5 h-3.5" />}
                        onClick={() => handleCreateVersion(selectedTemplate)}
                      >
                        Fork into v{selectedTemplate.version + 1}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create OKR Goal Template"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNewTemplate} className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g. Sales Executive Quarterly OKR Template"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-20"
              placeholder="Explain the purpose and expected audience for this template..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <Select
            label="Assign to Department (Optional)"
            value={newTargetDept}
            onChange={(e) => setNewTargetDept(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'All Departments / General' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              New templates start as version 1.0 with sample starter KRs that can be customized anytime.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
