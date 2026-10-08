import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';
import { getWorkflows, updateWorkflow } from '../../api';
import { Workflow, WorkflowStage } from '../../types';
import { useAuthStore } from '../auth/authStore';

export const WorkflowsAdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getWorkflows();
      setWorkflows(list);
    } catch {
      showToast('error', 'Failed to load approval workflows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (wf: Workflow) => {
    if (!user) return;
    try {
      const newStatus = wf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateWorkflow(wf.id, { status: newStatus }, user.id);
      showToast('success', `Workflow status updated to ${newStatus}`);
      loadData();
    } catch {
      showToast('error', 'Failed to update workflow.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            OKR Approval Workflows
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure multi-tier approval chains and validation rules governing objective activation.
          </p>
        </div>
      </div>

      {/* Policy Notice per specification 11.14 */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold block text-sm">Policy Enactment Notice</span>
          <p>
            Changes apply to new submissions only. Active and pending approval requests will continue under their original workflow configuration.
          </p>
          <p className="text-blue-800">
            Constraint: Two stages cannot share the same approval level. Level 1 must precede Level 2.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-surface rounded-xl border border-border shadow-card overflow-hidden"
            >
              <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-text-primary">{wf.name}</h2>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          wf.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      Sequential 2-tier verification standard
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={wf.status === 'ACTIVE' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(wf)}
                  >
                    {wf.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>

              {/* Stages List */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Configured Approval Pipeline ({wf.stages.length} Stages)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wf.stages.map((stage: WorkflowStage) => (
                    <div
                      key={stage.stage}
                      className="p-5 rounded-xl border border-border bg-slate-50/50 flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shadow-sm">
                            L{stage.level}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-text-primary block">
                              {stage.stageName}
                            </span>
                            <span className="text-xs text-text-secondary">
                              Approver Role: <strong className="text-text-primary">{stage.approverRole}</strong>
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-border text-text-muted">
                          Stage #{stage.stage}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-border/60 text-xs text-text-secondary flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            {stage.stage === 1
                              ? 'Direct Manager Evaluation & Endorsement'
                              : 'HR / Executive Council Governance Final Sign-off'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visual Pipeline Flow */}
                <div className="mt-4 p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <span className="px-2.5 py-1 rounded bg-white border border-slate-300">
                      Draft Submission
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                    <span className="px-2.5 py-1 rounded bg-white border border-slate-300">
                      Level 1: Manager Review
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                    <span className="px-2.5 py-1 rounded bg-white border border-slate-300">
                      Level 2: HR/Admin Review
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                    <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold">
                      Active Goal
                    </span>
                  </div>
                  <span className="text-xs text-text-muted italic">
                    Return or Reject cycles automatically restart at Level 1 upon resubmission.
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
