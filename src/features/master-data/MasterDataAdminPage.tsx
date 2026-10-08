import React, { useState, useEffect } from 'react';
import {
  Database,
  Building2,
  Shield,
  Gauge,
  Calculator,
  Bell,
  Award,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getMeasurementTypes,
  createMeasurementType,
  deleteMeasurementType,
  getEvaluationCriteria,
  createEvaluationCriteria,
  deleteEvaluationCriteria,
} from '../../api';
import { Department, MeasurementType, EvaluationCriteria } from '../../types';
import { useAuthStore } from '../auth/authStore';

export const MasterDataAdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'departments' | 'roles' | 'measurementTypes' | 'scoringMethods' | 'notificationTypes' | 'criteria'
  >('departments');

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);

  // Add Department Modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Add Criteria Modal
  const [critModalOpen, setCritModalOpen] = useState(false);
  const [critName, setCritName] = useState('');
  const [critDesc, setCritDesc] = useState('');
  const [critWeight, setCritWeight] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dList, mList, cList] = await Promise.all([
        getDepartments(),
        getMeasurementTypes(),
        getEvaluationCriteria(),
      ]);
      setDepartments(dList);
      setMeasurementTypes(mList);
      setCriteria(cList);
    } catch {
      showToast('error', 'Failed to load master configuration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !deptName.trim()) return;
    try {
      await createDepartment(deptName.trim(), deptDesc.trim() || undefined, user.id);
      showToast('success', `Department "${deptName}" created.`);
      setDeptModalOpen(false);
      setDeptName('');
      setDeptDesc('');
      loadData();
    } catch (err: unknown) {
      showToast('error', (err as Error).message || 'Failed to create department.');
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!user) return;
    try {
      await deleteDepartment(id, user.id);
      showToast('success', 'Department deleted.');
      loadData();
    } catch (err: unknown) {
      showToast('error', (err as Error).message || 'Cannot delete department.');
    }
  };

  const handleCreateCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !critName.trim()) return;
    try {
      await createEvaluationCriteria(critName.trim(), critDesc.trim(), Number(critWeight), user.id);
      showToast('success', `Criteria "${critName}" created.`);
      setCritModalOpen(false);
      setCritName('');
      setCritDesc('');
      loadData();
    } catch (err: unknown) {
      showToast('error', (err as Error).message || 'Failed to create criteria.');
    }
  };

  const handleDeleteCriteria = async (id: number) => {
    if (!user) return;
    try {
      await deleteEvaluationCriteria(id, user.id);
      showToast('success', 'Criteria removed.');
      loadData();
    } catch (err: unknown) {
      showToast('error', (err as Error).message || 'Cannot delete criteria.');
    }
  };

  const rolesList = [
    { name: 'EMPLOYEE', label: 'Employee', description: 'Sets and tracks own goals, submits check-ins, self-evaluates.' },
    { name: 'MANAGER', label: 'Manager', description: 'Level 1 approvals, team cascades, check-in reviews, manager evaluations.' },
    { name: 'HR_ADMIN', label: 'HR / Administrator', description: 'Company-wide alignment, Level 2 approvals, final scores, governance.' },
  ];

  const scoringMethods = [
    {
      name: 'Weighted Arithmetic Average',
      type: 'CALCULATED',
      formula: 'Sum(KR Achievement % × KR Weightage) / 100',
      description: 'Dynamic live objective health calculation continuously updated as KR measurements are logged.',
    },
    {
      name: 'HR Final Normalized Score',
      type: 'FINAL',
      formula: 'Official immutable governance evaluation score locked at cycle end.',
      description: 'Persistent performance review metric recorded officially by HR/Admin.',
    },
  ];

  const notificationTypes = [
    { code: 'OBJECTIVE_SUBMITTED', name: 'Objective Submission Alerts', target: 'Approvers' },
    { code: 'MANAGER_APPROVED', name: 'Manager Approval Hand-off', target: 'Employee & HR' },
    { code: 'FINAL_APPROVAL', name: 'Final HR Activation Notice', target: 'Objective Owner' },
    { code: 'RETURNED_FOR_CHANGES', name: 'Return for Modification', target: 'Objective Owner' },
    { code: 'KR_PACE_WARNING', name: 'Pace Derailment & Risk Warnings', target: 'Owner & Manager' },
    { code: 'CHECK_IN_REVIEWED', name: 'Check-in Review Notification', target: 'Employee' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Master Data & System Dictionaries
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Maintain organizational taxonomies, measurement standards, and governance configuration.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white rounded-t-xl px-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'departments'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'roles'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('measurementTypes')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'measurementTypes'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Measurement Types ({measurementTypes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scoringMethods')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'scoringMethods'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Scoring Methods
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notificationTypes')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'notificationTypes'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notification Types
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('criteria')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'criteria'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award className="w-4 h-4" />
          Evaluation Criteria ({criteria.length})
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="bg-surface rounded-b-xl border border-border shadow-card p-6">
          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Corporate Departments</h2>
                  <p className="text-xs text-text-secondary">
                    Active business departments associated with objectives and team rosters. Items in active use cannot be deleted.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setDeptModalOpen(true)}
                >
                  Add Department
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {departments.map((dept) => (
                  <div key={dept.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">{dept.name}</span>
                        <span className="text-[11px] font-mono text-text-muted">ID: #{dept.id}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {dept.description || 'Corporate functional unit'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger hover:bg-red-50 hover:border-red-200"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleDeleteDepartment(dept.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Platform System Roles</h2>
                <p className="text-xs text-text-secondary">
                  Access control boundaries enforced by route guards and UI authorization tokens.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rolesList.map((r) => (
                  <div key={r.name} className="p-5 rounded-xl border border-border bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{r.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-border text-primary font-bold">
                        {r.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{r.description}</p>
                    <div className="pt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      System Protected Role
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEASUREMENT TYPES */}
          {activeTab === 'measurementTypes' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">KR Metric Measurement Units</h2>
                <p className="text-xs text-text-secondary">
                  Standard metric units applied to Key Result target definitions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {measurementTypes.map((mt) => (
                  <div key={mt.id} className="p-5 rounded-xl border border-border bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{mt.name}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-border text-text-primary">
                        Unit: {mt.unitSymbol || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {mt.name === 'Currency'
                        ? 'Formatted with Indian Rupee (₹) and Indian numbering notation (e.g. ₹5,00,000).'
                        : mt.name === 'Percentage'
                        ? 'Rate indicator scaled from 0% to 100%.'
                        : 'Discrete quantitative numerical counter.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCORING METHODS */}
          {activeTab === 'scoringMethods' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Scoring Methodologies</h2>
                <p className="text-xs text-text-secondary">
                  Mathematical models governing goal attainment and final review outcomes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoringMethods.map((sm) => (
                  <div key={sm.name} className="p-5 rounded-xl border border-border bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{sm.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {sm.type}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-border font-mono text-xs text-text-secondary">
                      {sm.formula}
                    </div>
                    <p className="text-xs text-text-secondary">{sm.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATION TYPES */}
          {activeTab === 'notificationTypes' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">System Notification Triggers</h2>
                <p className="text-xs text-text-secondary">
                  Automated notifications raised upon workflow and milestone events.
                </p>
              </div>

              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {notificationTypes.map((nt) => (
                  <div key={nt.code} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-xs text-text-primary block">{nt.name}</span>
                      <span className="font-mono text-[11px] text-text-muted">{nt.code}</span>
                    </div>
                    <span className="text-xs text-text-secondary font-medium px-2 py-1 rounded bg-slate-100">
                      Dispatched to: {nt.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVALUATION CRITERIA */}
          {activeTab === 'criteria' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Performance Review Criteria</h2>
                  <p className="text-xs text-text-secondary">
                    Competency rubrics evaluated during Self, Manager, and Final Review cycles.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setCritModalOpen(true)}
                >
                  Add Criteria
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criteria.map((cr) => (
                  <div key={cr.id} className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{cr.name}</span>
                      <span className="text-xs font-bold text-primary bg-primary-soft/30 px-2 py-0.5 rounded">
                        Weight: {cr.weightage}%
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{cr.description}</p>
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:bg-red-50 hover:border-red-200"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeleteCriteria(cr.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Add Business Department"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Marketing & Growth"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-20"
              placeholder="Department purpose and scope..."
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Criteria Modal */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title="Add Review Competency Criteria"
      >
        <form onSubmit={handleCreateCriteria} className="space-y-4">
          <Input
            label="Criteria Title"
            placeholder="e.g. Problem Solving & Innovation"
            value={critName}
            onChange={(e) => setCritName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Rubric Description
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-20"
              placeholder="Detailed definition of excellence under this competency..."
              value={critDesc}
              onChange={(e) => setCritDesc(e.target.value)}
              required
            />
          </div>
          <Input
            type="number"
            label="Weightage (%)"
            value={critWeight}
            onChange={(e) => setCritWeight(Number(e.target.value))}
            min={1}
            max={100}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCritModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Criteria
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
