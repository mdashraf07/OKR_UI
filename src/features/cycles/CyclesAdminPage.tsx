import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Archive, AlertCircle } from 'lucide-react';
import { getCycles, createCycle } from '../../api';
import { getDb, saveDb } from '../../api/mockDb';
import { Cycle } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToastStore } from '../../components/ui/Toast';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../auth/authStore';

export const CyclesAdminPage: React.FC = () => {
  const { showToast } = useToastStore();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activateConfirmCycle, setActivateConfirmCycle] = useState<Cycle | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCycles = () => {
    setIsLoading(true);
    getCycles().then((data) => {
      setCycles(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createCycle(
        {
          name,
          description,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          status: 'Draft',
          ownerId: 3,
        },
        3
      );
      showToast({ type: 'success', message: 'Cycle created successfully' });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      loadCycles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmActivate = () => {
    if (!activateConfirmCycle) return;
    const db = getDb();
    // Only one active cycle at a time
    db.cycles.forEach((c) => {
      if (c.id === activateConfirmCycle.id) c.status = 'Active';
      else if (c.status === 'Active') c.status = 'Completed';
    });
    saveDb();
    useAuthStore.getState().setSelectedCycleId(activateConfirmCycle.id);
    showToast({ type: 'success', message: `Cycle "${activateConfirmCycle.name}" is now the active cycle` });
    setActivateConfirmCycle(null);
    loadCycles();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">OKR Cycles Management</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Configure quarterly and annual goal timeframes. Only one cycle can be active at a time.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Cycle
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                <th className="py-3 px-4">Cycle Name</th>
                <th className="py-3 px-3">Start Date</th>
                <th className="py-3 px-3">End Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cycles.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{c.name}</span>
                    {c.description && <p className="text-slate-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {new Date(c.startDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {new Date(c.endDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        c.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c.status !== 'Active' && c.status !== 'Archived' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActivateConfirmCycle(c)}
                      >
                        Activate Cycle
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(activateConfirmCycle)}
        onClose={() => setActivateConfirmCycle(null)}
        onConfirm={handleConfirmActivate}
        title="Activate OKR Cycle?"
        message={`Are you sure you want to activate "${activateConfirmCycle?.name}"? Only one cycle can be active at a time. The currently active cycle will be marked as Completed.`}
        confirmLabel="Activate Cycle"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Goal Cycle"
        description="Specify unique cycle dates without overlapping existing cycles"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Save Cycle
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Input
            label="Cycle Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q2 2027 OKR Cycle"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cycle objectives and milestones..."
          />

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </form>
      </Modal>
    </div>
  );
};
