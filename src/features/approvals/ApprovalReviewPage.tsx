import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Send,
  GitCommit,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { getApprovalStepById, approveStep, returnStep, rejectStep } from '../../api';
import { getDb } from '../../api/mockDb';
import { ApprovalStep, Objective, KeyResult, User } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToastStore } from '../../components/ui/Toast';
import { ObjectiveStatusPill, ApprovalChip } from '../../components/ui/Chips';
import { ItemNotFound } from '../../components/common/ItemNotFound';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { reassignApprover } from '../../api';

export const ApprovalReviewPage: React.FC = () => {
  const { id: routeId, stepId: routeStepId } = useParams<{ id?: string; stepId?: string }>();
  const id = String(routeId || routeStepId || '');
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [data, setData] = useState<{
    step: ApprovalStep;
    objective: Objective;
    keyResults: KeyResult[];
    priorSteps: ApprovalStep[];
    employee: User;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'RETURN' | 'REJECT' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Reassign Modal State
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [newApproverId, setNewApproverId] = useState<number>(2);
  const [reassignReason, setReassignReason] = useState('');

  const db = getDb();

  const loadData = () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getApprovalStepById(id)
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
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading review details...</div>;
  }

  if (notFound || !data) {
    return (
      <ItemNotFound
        title="Approval Step Not Found"
        message={`Approval step #${id || 'unknown'} was not found or has already been completed.`}
        backTo="/approvals"
        backLabel="Back to Approvals"
      />
    );
  }

  const { step, objective, keyResults, priorSteps, employee } = data;
  const isHR = currentUser?.role === 'HR_ADMIN';

  // Manager prior step decision (if HR stage 2 review)
  const priorManagerStep = priorSteps.find((s) => s.stage === 1 && s.status === 'APPROVED');

  const handleActionConfirm = async () => {
    if (!actionType) return;
    setIsProcessing(true);

    try {
      if (actionType === 'APPROVE') {
        const res = await approveStep(id, currentUser?.id || 1, comments);
        if (step.stage === 1) {
          setSuccessBanner('Approved. Sent to HR/Admin for final approval.');
        } else {
          setSuccessBanner('Approved. Objective is now Active.');
        }
        showToast({ type: 'success', message: 'Objective submission approved' });
      } else if (actionType === 'RETURN') {
        if (!comments.trim()) {
          showToast({ type: 'error', message: 'Please explain why.' });
          setIsProcessing(false);
          return;
        }
        await returnStep(id, currentUser?.id || 1, comments);
        setSuccessBanner('Returned for changes to employee.');
        showToast({ type: 'info', message: 'Objective returned to employee' });
      } else if (actionType === 'REJECT') {
        if (!comments.trim()) {
          showToast({ type: 'error', message: 'Please explain why.' });
          setIsProcessing(false);
          return;
        }
        await rejectStep(id, currentUser?.id || 1, comments);
        setSuccessBanner('Objective rejected.');
        showToast({ type: 'warning', message: 'Objective rejected' });
      }

      setIsProcessing(false);
      setIsConfirmOpen(false);
      loadData();
    } catch (err: any) {
      setIsProcessing(false);
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back Link */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/approvals" className="hover:text-[#2d8fd8] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Approvals Inbox
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate('/approvals')}>
            Return to Inbox
          </Button>
        </div>
      )}

      {/* Manager Endorsement Banner for Level 2 HR */}
      {step.stage === 2 && priorManagerStep && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#2d8fd8] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Level 1 Manager Endorsement Recorded:</div>
            <p className="mt-0.5 text-slate-700 italic">
              "{priorManagerStep.comments || 'Endorsed by sales management.'}"
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 columns): Full Objective & KRs table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {objective.level} Level
              </span>
              <div className="flex gap-2">
                <ObjectiveStatusPill status={objective.status} />
                <ApprovalChip state={objective.approvalState} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#1e293b]">{objective.title}</h1>
            {objective.description && (
              <p className="text-xs text-slate-600 leading-relaxed">{objective.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Employee</span>
                <span className="font-bold text-slate-800">{employee.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Weightage</span>
                <span className="font-bold text-slate-800">{objective.weightage}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Stage</span>
                <span className="font-bold text-[#2d8fd8]">
                  Stage {step.stage}: {step.stageName}
                </span>
              </div>
            </div>
          </div>

          {/* Key Results Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#1e293b]">Submitted Key Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                    <th className="py-3 px-3">Metric Name</th>
                    <th className="py-3 px-3">Direction</th>
                    <th className="py-3 px-3">Baseline</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3 text-center">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keyResults.map((kr) => (
                    <tr key={kr.id}>
                      <td className="py-3 px-3 font-semibold text-slate-800">{kr.name}</td>
                      <td className="py-3 px-3 text-slate-600">{kr.direction}</td>
                      <td className="py-3 px-3 font-mono">{kr.baseline}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#2d8fd8]">{kr.target}</td>
                      <td className="py-3 px-3 text-center font-bold">{kr.weightage}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t">
                    <td colSpan={4} className="py-2.5 px-3 text-right">
                      Total Weightage:
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-700">
                      {keyResults.reduce((s, k) => s + k.weightage, 0)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right (1 column): Decision Panel & History */}
        <div className="space-y-6">
          {/* Decision Panel */}
          {step.status === 'PENDING' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#1e293b]">Make Decision</h3>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Review Comments / Notes</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide feedback or justification..."
                  rows={4}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActionType('APPROVE');
                    setIsConfirmOpen(true);
                  }}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve Objective
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionType('RETURN');
                    setIsConfirmOpen(true);
                  }}
                  leftIcon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                >
                  Return for Changes
                </Button>

                <Button
                  variant="danger"
                  onClick={() => {
                    setActionType('REJECT');
                    setIsConfirmOpen(true);
                  }}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject Objective
                </Button>

                {(isHR || currentUser?.id === step.approverId) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setNewApproverId(step.approverId);
                      setIsReassignOpen(true);
                    }}
                  >
                    Reassign Approver
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Earlier Decision Rounds */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1e293b]">Earlier Review Rounds</h3>
            <div className="space-y-2.5">
              {priorSteps.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">
                      Round {p.submissionNo} · Stage {p.stage}
                    </span>
                    <span className="font-bold text-emerald-700">{p.status}</span>
                  </div>
                  {p.comments && <p className="text-slate-600 italic">"{p.comments}"</p>}
                </div>
              ))}
              {priorSteps.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">Initial submission round.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleActionConfirm}
        title={
          actionType === 'APPROVE'
            ? 'Approve this objective?'
            : actionType === 'RETURN'
            ? 'Return objective for employee revision?'
            : 'Reject this objective submission?'
        }
        message={
          actionType === 'APPROVE'
            ? step.stage === 1
              ? 'This objective will be approved for Level 1 and forwarded to HR/Admin for final sign-off.'
              : 'This objective will be activated and become live for the cycle.'
            : 'The employee will be notified with your written comments.'
        }
        confirmLabel={
          actionType === 'APPROVE'
            ? 'Confirm Approval'
            : actionType === 'RETURN'
            ? 'Return for Changes'
            : 'Reject Submission'
        }
        isDestructive={actionType === 'REJECT'}
        isLoading={isProcessing}
      />

      {/* Reassign Approver Modal */}
      {isReassignOpen && (
        <Modal
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          title="Reassign Approver"
          description="Designate a different manager or administrator to decide on this submission."
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReassignOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!reassignReason.trim()) {
                    showToast({ type: 'error', message: 'Please explain why.' });
                    return;
                  }
                  try {
                    await reassignApprover(
                      step.id,
                      newApproverId,
                      reassignReason,
                      currentUser?.id || 3
                    );
                    showToast({ type: 'success', message: 'Approver reassigned successfully' });
                    setIsReassignOpen(false);
                    setReassignReason('');
                    loadData();
                  } catch (err: any) {
                    showToast({ type: 'error', message: err.message });
                  }
                }}
              >
                Confirm Reassignment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Select
              label="Select New Approver"
              value={newApproverId}
              onChange={(e) => setNewApproverId(Number(e.target.value))}
              options={db.users
                .filter((u) => u.role !== 'EMPLOYEE')
                .map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            />

            <Input
              label="Reason for Reassignment (Mandatory)"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Primary manager is on annual leave..."
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
