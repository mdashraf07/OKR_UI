import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, Lock, RefreshCw, Plus } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { getScores, recalculateScores, recordFinalScore } from '../../api';
import { getDb } from '../../api/mockDb';
import { Score } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { useToastStore } from '../../components/ui/Toast';

export const ScoresAdminPage: React.FC = () => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { showToast } = useToastStore();

  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false);

  // Final score form state
  const [targetUserId, setTargetUserId] = useState<number>(1);
  const [finalScoreVal, setFinalScoreVal] = useState<number>(85);

  const [filterCycleId, setFilterCycleId] = useState<number>(selectedCycleId);

  const db = getDb();
  const currentCycle = db.cycles.find((c) => c.id === filterCycleId) || db.cycles[1];

  const loadScores = () => {
    setIsLoading(true);
    getScores(filterCycleId).then((data) => {
      setScores(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    setFilterCycleId(selectedCycleId);
  }, [selectedCycleId]);

  useEffect(() => {
    loadScores();
  }, [filterCycleId]);

  const handleRecalculate = async () => {
    try {
      await recalculateScores(filterCycleId, currentUser?.id || 3);
      showToast({ type: 'success', message: 'Cycle dynamic scores recalculated successfully' });
      loadScores();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleRecordFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordFinalScore(
        filterCycleId,
        targetUserId,
        Number(finalScoreVal),
        currentUser?.id || 3
      );
      showToast({ type: 'success', message: 'FINAL official score recorded' });
      setIsFinalModalOpen(false);
      loadScores();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">OKR Scores Governance</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Calculated dynamic scores versus immutable FINAL performance scores for {currentCycle.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cycle Filter */}
          <select
            value={filterCycleId}
            onChange={(e) => setFilterCycleId(Number(e.target.value))}
            className="h-8 px-3 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none"
          >
            {db.cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.status === 'Active' ? '(Active)' : `(${c.status})`}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRecalculate}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Recalculate Scores
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsFinalModalOpen(true)}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Record Final Score
          </Button>
        </div>
      </div>

      {/* Scores Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Raw Achievement</th>
                <th className="py-3 px-3">Calculated Score</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Date Recorded</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scores.map((sc) => {
                const emp = db.users.find((u) => u.id === sc.ownerId);

                return (
                  <tr key={sc.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{emp?.name || `Employee #${sc.ownerId}`}</div>
                      <div className="text-[11px] text-slate-400">{emp?.title || emp?.role}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {sc.rawAchievementPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-base text-slate-900">
                      {sc.calculatedScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          sc.scoreType === 'FINAL'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-sky-100 text-[#0369a1]'
                        }`}
                      >
                        {sc.scoreType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(sc.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sc.scoreType === 'FINAL' ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <Lock className="w-3.5 h-3.5" /> Immutable
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Dynamic</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {scores.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No scores recorded yet for this cycle. Click "Recalculate Scores" to evaluate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Final Score Modal */}
      <Modal
        isOpen={isFinalModalOpen}
        onClose={() => setIsFinalModalOpen(false)}
        title="Record FINAL Official Score"
        description="Once recorded, a FINAL score is locked forever and cannot be altered or recalculated."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setIsFinalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordFinal}>
              Confirm Final Score
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRecordFinal} className="space-y-4">
          <Select
            label="Select Employee"
            value={targetUserId}
            onChange={(e) => setTargetUserId(Number(e.target.value))}
            options={db.users.map((u) => ({ value: u.id, label: `${u.name} (${u.title})` }))}
          />

          <Input
            label="Final Certified Score (0 - 100)"
            type="number"
            min={0}
            max={100}
            value={finalScoreVal}
            onChange={(e) => setFinalScoreVal(Number(e.target.value))}
            required
          />

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-800">
            <strong>Audit Note:</strong> Recording this score will trigger an immutable audit entry
            and notify the employee and their line manager.
          </div>
        </form>
      </Modal>
    </div>
  );
};
