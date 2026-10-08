import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { CheckIn } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToastStore } from '../../components/ui/Toast';

export const CheckInsPage: React.FC = () => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const {
    checkIns,
    objectives: storeObjectives,
    keyResults: storeKRs,
    createCheckIn: storeCreateCheckIn,
    markCheckInReviewed: storeMarkReviewed,
  } = useOkrStore();
  const { showToast } = useToastStore();
  const role = currentUser?.role || 'EMPLOYEE';

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Check-in Form
  const [objId, setObjId] = useState<number>(0);
  const [krId, setKrId] = useState<number | undefined>(undefined);
  const [freqInterval, setFreqInterval] = useState<number>(2);
  const [freqUnit, setFreqUnit] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const db = getDb();
  const myObjectives = storeObjectives.filter(
    (o) => o.cycleId === selectedCycleId && (role === 'EMPLOYEE' ? o.ownerId === currentUser?.id : true)
  );

  const handleCreateCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objId) {
      showToast({ type: 'error', message: 'Please select an objective.' });
      return;
    }

    try {
      await storeCreateCheckIn(
        {
          objectiveId: objId,
          keyResultId: krId,
          employeeId: currentUser?.id || 1,
          frequencyInterval: freqInterval,
          frequencyUnit: freqUnit,
          progressValue: Number(progressVal),
          remarks,
        },
        currentUser?.id || 1
      );
      showToast({ type: 'success', message: 'Check-in submitted successfully' });
      setIsNewModalOpen(false);
      setRemarks('');
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleMarkReviewed = async (checkInId: number) => {
    try {
      await storeMarkReviewed(checkInId, currentUser?.id || 2, 'Reviewed by manager');
      showToast({ type: 'success', message: 'Marked as reviewed' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const availableKRs = db.keyResults.filter((k) => k.objectiveId === objId);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Periodic Check-ins</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Maintain regular rhythm of updates, track ongoing value changes, and manager reviews.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            if (myObjectives.length > 0) setObjId(myObjectives[0].id);
            setIsNewModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Check-in
        </Button>
      </div>

      {/* Check-ins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {checkIns.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No check-ins recorded"
            description="Submit periodic check-ins to keep team members and managers updated on progress."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Objective</th>
                  <th className="py-3 px-3">Scope</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checkIns.map((ci) => {
                  const emp = db.users.find((u) => u.id === ci.employeeId);
                  const obj = db.objectives.find((o) => o.id === ci.objectiveId);
                  const kr = ci.keyResultId ? db.keyResults.find((k) => k.id === ci.keyResultId) : null;

                  return (
                    <tr key={ci.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{emp?.name}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {obj?.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {kr ? kr.name : 'Objective Level'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(ci.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        Every {ci.frequencyInterval} {ci.frequencyUnit}s
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            ci.status === 'REVIEWED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ci.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {role === 'MANAGER' && ci.status === 'SUBMITTED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMarkReviewed(ci.id)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Check-in Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit New Check-in"
        description="Record your rhythm update against assigned objectives"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCheckIn}>
              Submit Check-in
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCheckIn} className="space-y-4">
          <Select
            label="Select Objective"
            value={objId}
            onChange={(e) => setObjId(Number(e.target.value))}
            options={myObjectives.map((o) => ({ value: o.id, label: o.title }))}
          />

          {availableKRs.length > 0 && (
            <Select
              label="Associated Key Result (Optional)"
              value={krId || ''}
              onChange={(e) => setKrId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Objective-level Check-in</option>
              {availableKRs.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} (Current: {k.current})
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Frequency Interval"
              type="number"
              min={1}
              value={freqInterval}
              onChange={(e) => setFreqInterval(Number(e.target.value))}
            />
            <Select
              label="Frequency Unit"
              value={freqUnit}
              onChange={(e) => setFreqUnit(e.target.value as any)}
              options={[
                { value: 'DAY', label: 'Days' },
                { value: 'WEEK', label: 'Weeks' },
                { value: 'MONTH', label: 'Months' },
              ]}
            />
          </div>

          <Input
            label="Progress Value"
            type="number"
            value={progressVal}
            onChange={(e) => setProgressVal(Number(e.target.value))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#374151]">Remarks / Key Learnings</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Highlights, blockers, or help needed from leadership..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
