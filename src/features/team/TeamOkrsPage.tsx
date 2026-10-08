import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { KRStatusChip, ObjectiveStatusPill, ObjectiveHealthChip } from '../../components/ui/Chips';
import { calculateExpectedProgress, formatValueWithUnit } from '../../lib/calculations';

export const TeamOkrsPage: React.FC = () => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { objectives: storeObjectives, keyResults: storeKRs } = useOkrStore();
  const navigate = useNavigate();

  const db = getDb();
  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];
  const asOfDate = db.devSettings.demoDate;
  const cycleExpectedPace = calculateExpectedProgress(
    currentCycle.startDate,
    currentCycle.endDate,
    asOfDate
  );

  // Direct reports of manager
  const directReports = db.users.filter((u) => u.managerId === currentUser?.id);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(
    directReports.length > 0 ? directReports[0].id : null
  );

  const selectedReport = db.users.find((u) => u.id === selectedReportId);
  const reportObjectives = storeObjectives.filter(
    (o) => o.ownerId === selectedReportId && o.cycleId === selectedCycleId
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentCycle.name}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Pace Target: {cycleExpectedPace}%</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Team OKRs & Performance</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Real-time oversight of direct reports, progress synchronization, and goal pacing.
          </p>
        </div>
      </div>

      {/* Direct Reports Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {directReports.map((member) => {
          const objs = storeObjectives.filter(
            (o) => o.ownerId === member.id && o.cycleId === selectedCycleId
          );
          const memberKRs = storeKRs.filter((k) => objs.some((o) => o.id === k.objectiveId));
          const atRiskCount = memberKRs.filter(
            (k) => k.status === 'At Risk' || k.status === 'In Trouble'
          ).length;

          const activeObjs = objs.filter((o) => o.status === 'Active');
          const avgProg =
            activeObjs.length > 0
              ? Math.round(
                  activeObjs.reduce((s, o) => s + (o.progress || 0), 0) / activeObjs.length
                )
              : 0;

          const isSelected = member.id === selectedReportId;

          return (
            <div
              key={member.id}
              onClick={() => setSelectedReportId(member.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#2d8fd8] bg-sky-50/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {member.avatar || 'US'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{member.name}</h3>
                  <p className="text-[11px] text-slate-500">{member.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  progress={avgProg}
                  expectedProgress={cycleExpectedPace}
                  showLabels
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>{objs.length} Objectives</span>
                  {atRiskCount > 0 && (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {atRiskCount} At Risk
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member's Objectives & Key Results */}
      {selectedReport && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">
                {selectedReport.name}'s Objectives ({reportObjectives.length})
              </h2>
              <p className="text-xs text-slate-500">
                Synchronized oversight view reflecting employee's latest progress and measurements
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {reportObjectives.map((obj) => {
              const objKRs = storeKRs.filter((k) => k.objectiveId === obj.id);

              return (
                <div
                  key={obj.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {obj.level}
                        </span>
                        <ObjectiveStatusPill status={obj.status} />
                        {obj.status === 'Active' && <ObjectiveHealthChip health={obj.health} />}
                      </div>
                      <h3
                        onClick={() => navigate(`/okrs/${obj.id}`)}
                        className="font-bold text-sm text-slate-900 hover:text-[#2d8fd8] cursor-pointer"
                      >
                        {obj.title}
                      </h3>
                      {obj.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{obj.description}</p>
                      )}
                    </div>

                    <div className="w-48 flex-shrink-0">
                      <ObjectiveProgressDisplay
                        status={obj.status}
                        progress={obj.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                      />
                    </div>
                  </div>

                  {/* Associated Key Results under this objective */}
                  <div className="pl-4 border-l-2 border-[#2d8fd8]/40 space-y-2 mt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Key Results ({objKRs.length})
                    </div>

                    {objKRs.map((kr) => {
                      const type = db.measurementTypes.find((m) => m.id === kr.measurementTypeId);
                      return (
                        <div
                          key={kr.id}
                          className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => navigate(`/okrs/${obj.id}/kr/${kr.id}`)}
                                className="font-semibold text-slate-800 hover:text-[#2d8fd8] cursor-pointer"
                              >
                                {kr.name}
                              </span>
                              <KRStatusChip
                                status={kr.status}
                                isDraft={obj.status === 'Draft'}
                                isDelayed={kr.isDelayed}
                                isOverridden={kr.statusOverridden}
                              />
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {obj.status === 'Draft' ? (
                                <>
                                  Baseline: <strong className="text-slate-800">{kr.baseline}</strong> · Target:{' '}
                                  <strong className="text-slate-800">{kr.target}</strong> · Weight: {kr.weightage}%
                                </>
                              ) : (
                                <>
                                  Current:{' '}
                                  <strong className="text-slate-800">
                                    {formatValueWithUnit(
                                      kr.current,
                                      type?.name || 'Number',
                                      type?.unitSymbol
                                    )}
                                  </strong>{' '}
                                  /{' '}
                                  {formatValueWithUnit(
                                    kr.target,
                                    type?.name || 'Number',
                                    type?.unitSymbol
                                  )}{' '}
                                  · Weight: {kr.weightage}%
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {obj.status === 'Draft' ? (
                              <div className="text-right text-[11px] text-slate-400 italic">
                                Progress available after activation
                              </div>
                            ) : (
                              <ProgressBar
                                progress={kr.achievementPercent}
                                expectedProgress={kr.expectedPercent}
                                showLabels
                                className="w-32"
                              />
                            )}
                            <button
                              onClick={() => navigate(`/okrs/${obj.id}/kr/${kr.id}`)}
                              className="text-slate-400 hover:text-[#2d8fd8]"
                              title="View KR Details"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {reportObjectives.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No objectives created by this employee for this cycle.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
