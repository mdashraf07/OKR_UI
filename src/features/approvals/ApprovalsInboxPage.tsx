import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle2, AlertCircle, Clock, UserCheck, Check } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { getApprovalSteps, reassignApprover } from '../../api';
import { getDb } from '../../api/mockDb';
import { ApprovalStep } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToastStore } from '../../components/ui/Toast';

export const ApprovalsInboxPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const role = currentUser?.role || 'EMPLOYEE';

  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Reassign Modal
  const [reassignStep, setReassignStep] = useState<ApprovalStep | null>(null);
  const [newApproverId, setNewApproverId] = useState<number>(2);
  const [reassignReason, setReassignReason] = useState('');

  const db = getDb();

  const loadSteps = () => {
    setIsLoading(true);
    getApprovalSteps().then((data) => {
      setSteps(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadSteps();
  }, [currentUser]);

  // Filter based on tab and role
  const pendingSteps = steps.filter((s) => {
    if (s.status !== 'PENDING') return false;
    if (role === 'HR_ADMIN') return true; // HR can see all
    return s.approverId === currentUser?.id;
  });

  const decidedSteps = steps.filter((s) => s.status !== 'PENDING');

  const handleReassign = async () => {
    if (!reassignStep) return;
    if (!reassignReason.trim()) {
      showToast({ type: 'error', message: 'Please explain why.' });
      return;
    }

    try {
      await reassignApprover(
        reassignStep.id,
        newApproverId,
        reassignReason,
        currentUser?.id || 3
      );
      showToast({ type: 'success', message: 'Approver reassigned successfully' });
      setReassignStep(null);
      setReassignReason('');
      loadSteps();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Approvals Inbox</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Review submitted objectives, evaluate key result criteria, and enforce governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {pendingSteps.length} Pending Actions
          </span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        variant="pill"
        tabs={[
          { id: 'pending', label: 'Pending Reviews', badge: pendingSteps.length },
          { id: 'decided', label: 'Decided History', badge: decidedSteps.length },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {activeTab === 'pending' && pendingSteps.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Nothing is waiting for your approval"
            description="All employee OKR submissions have been reviewed and approved."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Objective Title</th>
                  <th className="py-3 px-3">Level</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Round</th>
                  <th className="py-3 px-3">Waiting</th>
                  <th className="py-3 px-3">KR Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'pending' ? pendingSteps : decidedSteps).map((step) => {
                  const obj = db.objectives.find((o) => o.id === step.objectiveId);
                  const employee = db.users.find((u) => u.id === step.employeeId);
                  const krs = db.keyResults.filter((k) => k.objectiveId === step.objectiveId);
                  const krWeightSum = krs.reduce((sum, k) => sum + k.weightage, 0);

                  const createdDate = new Date(step.createdAt);
                  const asOfDate = new Date(db.devSettings.demoDate);
                  const daysWaiting = Math.max(
                    0,
                    Math.round((asOfDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                  );
                  const isOverdue = daysWaiting >= 3;

                  return (
                    <tr key={step.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{employee?.name}</div>
                        <div className="text-[11px] text-slate-400">{employee?.title}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {obj?.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {obj?.level}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">Stage {step.stage}</span>
                        <span className="text-[10px] text-slate-400 block">{step.stageName}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-600">Round {step.submissionNo}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isOverdue
                              ? 'bg-red-100 text-red-700 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {daysWaiting} days {isOverdue && '⚠️'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {krWeightSum}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {role === 'HR_ADMIN' && step.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReassignStep(step);
                                setNewApproverId(step.approverId);
                              }}
                            >
                              Reassign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => navigate(`/approvals/${step.id}`)}
                          >
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reassign Approver Modal */}
      {reassignStep && (
        <Modal
          isOpen={Boolean(reassignStep)}
          onClose={() => setReassignStep(null)}
          title="Reassign Approver"
          description="Designate a different manager or administrator to decide on this submission."
          footer={
            <>
              <Button variant="secondary" onClick={() => setReassignStep(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleReassign}>
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
