import React, { useState } from 'react';
import {
  X,
  Target,
  Building2,
  Calendar,
  User as UserIcon,
  Tag,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import {
  ObjectiveStatusPill,
  ObjectiveHealthChip,
  KRStatusChip,
  ApprovalChip,
} from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { Objective, KeyResult } from '../../types';
import { getDb } from '../../api/mockDb';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { useToastStore } from '../../components/ui/Toast';
import { AddKpiDrawer } from '../key-result/AddKpiDrawer';
import { CheckInDrawer } from '../check-ins/CheckInDrawer';
import { KeyResultDetailDrawer } from '../key-result/KeyResultDetailDrawer';

export interface ObjectiveDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  objective: Objective | null;
  onAddKpiRequested?: () => void;
}

export const ObjectiveDetailDrawer: React.FC<ObjectiveDetailDrawerProps> = ({
  isOpen,
  onClose,
  objective,
  onAddKpiRequested,
}) => {
  const { currentUser } = useAuthStore();
  const { keyResults, submitObjective, objectives } = useOkrStore();
  const { showToast } = useToastStore();
  const db = getDb();

  const [isAddKpiOpen, setIsAddKpiOpen] = useState(false);
  const [selectedKRForCheckIn, setSelectedKRForCheckIn] = useState<KeyResult | null>(null);
  const [selectedKRForDetail, setSelectedKRForDetail] = useState<KeyResult | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  if (!objective) return null;

  const currentObj = objectives.find((o) => o.id === objective.id) || objective;
  const dept = db.departments.find((d) => d.id === currentObj.departmentId) || db.departments[0];
  const owner = db.users.find((u) => u.id === currentObj.ownerId) || currentUser;
  const cycle = db.cycles.find((c) => c.id === currentObj.cycleId) || db.cycles[1];
  const objKRs = keyResults.filter((k) => k.objectiveId === currentObj.id);

  const handleSubmitForApproval = async () => {
    if (objKRs.length === 0) {
      showToast({
        type: 'warning',
        message: 'Add at least one Key Result before submitting for approval.',
      });
      return;
    }

    setIsSubmittingApproval(true);
    try {
      await submitObjective(currentObj.id, currentUser?.id || 1);
      showToast({
        type: 'success',
        message: `Objective "${currentObj.title}" submitted for Level 1 Manager approval.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Submission failed' });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="4xl"
        title={
          <div className="flex items-center gap-2 truncate max-w-xl">
            <Target className="w-4 h-4 text-[#2d8fd8] flex-shrink-0" />
            <span className="text-base font-bold text-[#1e293b] truncate">
              {currentObj.title}
            </span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{dept.name}</span>
            <span className="text-slate-300">·</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{cycle.name}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ObjectiveStatusPill status={currentObj.status} />
              <ApprovalChip state={currentObj.approvalState} />
            </div>

            <div className="flex items-center gap-2">
              {currentObj.status === 'Draft' && currentObj.approvalState === 'NotSubmitted' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSubmitForApproval}
                  disabled={isSubmittingApproval}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {isSubmittingApproval ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-xs text-slate-700">
          {/* Header Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {currentObj.level} Objective
                  </span>
                  {currentObj.perspective && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                      {currentObj.perspective}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{currentObj.title}</h3>
                {currentObj.description && (
                  <p className="text-xs text-slate-500 mt-1">{currentObj.description}</p>
                )}
              </div>

              {currentObj.status === 'Draft' ? (
                <div className="text-right sm:min-w-[140px]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    Draft — Not Started
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Execution inactive</span>
                </div>
              ) : (
                <div className="text-right sm:min-w-[140px]">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-2xl font-bold text-slate-900 font-mono">
                      {currentObj.progress || 0}%
                    </span>
                    <ObjectiveHealthChip health={currentObj.health} />
                  </div>
                  <span className="text-[11px] text-slate-400">Rolled-up KR progress</span>
                </div>
              )}
            </div>

            <ObjectiveProgressDisplay
              status={currentObj.status}
              progress={currentObj.progress || 0}
              showLabels
            />

            {/* Meta details */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <UserIcon className="w-3.5 h-3.5 text-[#1a7260]" />
                  Owner: <strong>{owner?.name || 'Department'}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Weightage: {currentObj.weightage}%</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Visibility: {currentObj.visibility || 'Public'}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Priority: {currentObj.priority || 'High'}</span>
              </div>
            </div>
          </div>

          {/* Key Results Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Key Results ({objKRs.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Target metrics rolling up to this strategic objective.
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (onAddKpiRequested) {
                    onAddKpiRequested();
                  } else {
                    setIsAddKpiOpen(true);
                  }
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add KPI
              </Button>
            </div>

            {objKRs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                <p>No key results added yet.</p>
                <p className="text-[11px] text-slate-400">
                  You can create key results separately at any time without blocking objective setup.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAddKpiOpen(true)}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Key Result
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {objKRs.map((kr) => (
                  <div
                    key={kr.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#2d8fd8] flex-shrink-0" />
                        <span
                          onClick={() => setSelectedKRForDetail(kr)}
                          className="font-semibold text-slate-900 hover:text-[#2d8fd8] hover:underline cursor-pointer"
                        >
                          {kr.name}
                        </span>
                        <KRStatusChip status={kr.status} isDraft={currentObj.status === 'Draft'} />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {currentObj.status === 'Draft' ? (
                          <>Baseline: <strong>{kr.baseline}</strong> · Target: <strong>{kr.target}</strong> ({kr.kpiName || 'KPI'})</>
                        ) : (
                          <>Target: {kr.baseline} → {kr.target} · Actual: <strong>{kr.current}</strong> ({kr.kpiName || 'Accuracy'})</>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        {currentObj.status === 'Draft' ? (
                          <span className="text-[11px] text-slate-400 italic block text-right">
                            Progress available after activation
                          </span>
                        ) : (
                          <ProgressBar progress={kr.achievementPercent} />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {currentObj.status === 'Draft' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled
                            className="opacity-50 cursor-not-allowed"
                          >
                            Draft (Inactive)
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedKRForCheckIn(kr)}
                          >
                            Check-in
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedKRForDetail(kr)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* S3 Add KPI Drawer */}
      <AddKpiDrawer
        isOpen={isAddKpiOpen}
        onClose={() => setIsAddKpiOpen(false)}
        objective={currentObj}
        onCreated={() => {
          useOkrStore.getState().refresh();
        }}
      />

      {/* S6 Check-in Drawer */}
      <CheckInDrawer
        isOpen={Boolean(selectedKRForCheckIn)}
        onClose={() => setSelectedKRForCheckIn(null)}
        keyResult={selectedKRForCheckIn}
      />

      {/* S5 Key Result Detail Drawer */}
      <KeyResultDetailDrawer
        isOpen={Boolean(selectedKRForDetail)}
        onClose={() => setSelectedKRForDetail(null)}
        keyResult={selectedKRForDetail}
      />
    </>
  );
};
