import React, { useState } from 'react';
import { Star, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { PerformanceEvaluation, User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../components/ui/Toast';

export const ReviewsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { evaluations: storeEvaluations, submitEvaluation: storeSubmitEval } = useOkrStore();
  const { showToast } = useToastStore();

  const role = currentUser?.role || 'EMPLOYEE';
  const db = getDb();
  const criteria = db.criteria;

  const [activeEval, setActiveEval] = useState<PerformanceEvaluation | null>(null);
  const [responses, setResponses] = useState<
    Record<number, { text: string; score: number; rating: number }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter evaluations relevant to current user:
  // - Employee: sees their own evaluations (Self, Manager, Final)
  // - Manager: sees direct reports' evaluations + their own self eval
  // - HR_ADMIN: sees all evaluations
  const evaluations = storeEvaluations.filter((ev) => {
    if (role === 'HR_ADMIN') return true;
    if (role === 'MANAGER') {
      const isDirectReport = db.users.some(
        (u) => u.id === ev.employeeId && u.managerId === currentUser?.id
      );
      return ev.employeeId === currentUser?.id || ev.evaluatorId === currentUser?.id || isDirectReport;
    }
    // Employee only sees their own
    return ev.employeeId === currentUser?.id;
  });

  /**
   * STRICT ROLE PERMISSION VALIDATION (Section 18)
   */
  const canUserEditEvaluation = (ev: PerformanceEvaluation, user: User | null): boolean => {
    if (!user) return false;
    if (ev.status === 'SUBMITTED') return false; // Already finalized

    if (ev.evalType === 'SELF') {
      // ONLY the subject employee can edit Self Evaluation
      return user.id === ev.employeeId;
    }

    if (ev.evalType === 'MANAGER') {
      // Employee CANNOT edit Manager Evaluation
      if (user.role === 'EMPLOYEE') return false;
      // Manager CANNOT evaluate themselves
      if (user.id === ev.employeeId) return false;
      // Manager or HR_Admin evaluating direct report
      return user.role === 'MANAGER' || user.role === 'HR_ADMIN';
    }

    if (ev.evalType === 'FINAL') {
      // ONLY HR_Admin can complete Final Evaluation
      return user.role === 'HR_ADMIN';
    }

    return false;
  };

  const openEvaluation = (evaluation: PerformanceEvaluation) => {
    setActiveEval(evaluation);
    const respMap: Record<number, { text: string; score: number; rating: number }> = {};
    evaluation.responses.forEach((r) => {
      respMap[r.criteriaId] = {
        text: r.responseText,
        score: r.score,
        rating: r.rating,
      };
    });
    setResponses(respMap);
  };

  const handleSubmitEvaluation = async () => {
    if (!activeEval || !currentUser) return;

    if (!canUserEditEvaluation(activeEval, currentUser)) {
      showToast({
        type: 'error',
        message: 'Permission denied: You cannot submit this evaluation type.',
      });
      return;
    }

    const formattedResponses = criteria.map((c) => ({
      criteriaId: c.id,
      criteriaName: c.name,
      responseText: responses[c.id]?.text || 'No response recorded',
      score: responses[c.id]?.score || 80,
      rating: responses[c.id]?.rating || 4,
    }));

    setIsSubmitting(true);
    try {
      await storeSubmitEval(
        {
          ...activeEval,
          responses: formattedResponses,
        },
        currentUser.id,
        role
      );
      showToast({ type: 'success', message: 'Evaluation submitted successfully' });
      setActiveEval(null);
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to submit evaluation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Performance Reviews & Evaluations</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Formal governance review cycle (Self, Manager, and Final evaluations) with role-based access.
          </p>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                <th className="py-3 px-4">Evaluation Stage</th>
                <th className="py-3 px-3">Subject Employee</th>
                <th className="py-3 px-3">Designated Evaluator</th>
                <th className="py-3 px-3">Overall Score</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluations.map((ev) => {
                const emp = db.users.find((u) => u.id === ev.employeeId);
                const evaluator = db.users.find((u) => u.id === ev.evaluatorId);
                const editable = canUserEditEvaluation(ev, currentUser);

                let statusBadgeText: string = ev.status;
                let badgeColor = 'bg-slate-100 text-slate-700';

                if (ev.status === 'SUBMITTED') {
                  statusBadgeText = 'Submitted';
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                } else if (editable) {
                  statusBadgeText = 'Draft (Your Input Required)';
                  badgeColor = 'bg-amber-100 text-amber-800';
                } else {
                  if (ev.evalType === 'MANAGER') {
                    statusBadgeText = 'Manager In-Progress (Read-Only)';
                    badgeColor = 'bg-sky-100 text-sky-800';
                  } else if (ev.evalType === 'FINAL') {
                    statusBadgeText = 'HR Evaluation Pending (Read-Only)';
                    badgeColor = 'bg-purple-100 text-purple-800';
                  } else {
                    statusBadgeText = 'Draft';
                    badgeColor = 'bg-slate-100 text-slate-700';
                  }
                }

                return (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        {!editable && ev.status !== 'SUBMITTED' && (
                          <Lock className="w-3 h-3 text-slate-400" />
                        )}
                        <span>
                          {ev.evalType === 'SELF'
                            ? 'Self Evaluation'
                            : ev.evalType === 'MANAGER'
                            ? 'Manager Evaluation'
                            : 'Final HR Evaluation'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{emp?.name}</td>
                    <td className="py-3 px-3 text-slate-600">{evaluator?.name}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {ev.overallScore ? `${ev.overallScore} / 100` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      {ev.overallRating ? (
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{ev.overallRating}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badgeColor}`}>
                        {statusBadgeText}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={editable ? 'primary' : 'secondary'}
                        onClick={() => openEvaluation(ev)}
                      >
                        {editable ? 'Complete Form' : 'View Status'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal Form with Permission Enforcement */}
      {activeEval && (
        <Modal
          isOpen={Boolean(activeEval)}
          onClose={() => setActiveEval(null)}
          title={`Performance Evaluation (${
            activeEval.evalType === 'SELF'
              ? 'Self Evaluation'
              : activeEval.evalType === 'MANAGER'
              ? 'Manager Evaluation'
              : 'Final Evaluation'
          })`}
          description={
            canUserEditEvaluation(activeEval, currentUser)
              ? 'Complete assessment against core competencies'
              : 'Read-only view of evaluation status'
          }
          maxWidth="xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="secondary" onClick={() => setActiveEval(null)}>
                Close
              </Button>
              {canUserEditEvaluation(activeEval, currentUser) && (
                <Button variant="primary" onClick={handleSubmitEvaluation} isLoading={isSubmitting}>
                  Submit Evaluation
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* Read-only banner if user is not authorized to edit this form */}
            {!canUserEditEvaluation(activeEval, currentUser) && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>
                  {activeEval.status === 'SUBMITTED'
                    ? 'This evaluation has been finalized and submitted.'
                    : `Read-only view: You do not have permission to edit this ${activeEval.evalType.toLowerCase()} evaluation.`}
                </span>
              </div>
            )}

            {criteria.map((c) => {
              const currentResp = responses[c.id] || { text: '', score: 80, rating: 4 };
              const isReadOnly = !canUserEditEvaluation(activeEval, currentUser);

              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Weight: {c.weightage}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Detailed Response</label>
                    <textarea
                      disabled={isReadOnly}
                      value={currentResp.text}
                      onChange={(e) =>
                        setResponses({
                          ...responses,
                          [c.id]: { ...currentResp, text: e.target.value },
                        })
                      }
                      rows={2}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Score (0-100)</span>
                        <span className="font-bold text-slate-900">{currentResp.score}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={isReadOnly}
                        value={currentResp.score}
                        onChange={(e) =>
                          setResponses({
                            ...responses,
                            [c.id]: { ...currentResp, score: Number(e.target.value) },
                          })
                        }
                        className="w-full disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Rating (Stars)</span>
                        <span className="font-bold text-amber-600">{currentResp.rating} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        disabled={isReadOnly}
                        value={currentResp.rating}
                        onChange={(e) =>
                          setResponses({
                            ...responses,
                            [c.id]: { ...currentResp, rating: Number(e.target.value) },
                          })
                        }
                        className="w-full disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};
