import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Kanban, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { KeyResult, Objective } from '../../types';
import {
  ObjectiveStatusPill,
  ObjectiveHealthChip,
  KRStatusChip,
  ApprovalChip,
} from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { Button } from '../../components/ui/Button';
import { calculateExpectedProgress } from '../../lib/calculations';
import { UpdateProgressDrawer } from '../progress/UpdateProgressDrawer';

export const OkrStatusBoardPage: React.FC = () => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { objectives: storeObjectives, keyResults: storeKRs, refresh: refreshStore } = useOkrStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'krs' | 'objectives'>('krs');
  const [selectedKRForUpdate, setSelectedKRForUpdate] = useState<KeyResult | null>(null);

  const db = getDb();
  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];
  const asOfDate = db.devSettings.demoDate;
  const cycleExpectedPace = calculateExpectedProgress(
    currentCycle.startDate,
    currentCycle.endDate,
    asOfDate
  );

  // Filtered objectives for this cycle and user
  const objectives = storeObjectives.filter((o) => {
    if (o.cycleId !== selectedCycleId) return false;
    if (currentUser?.role === 'EMPLOYEE') return o.ownerId === currentUser.id;
    return true;
  });

  const allKRs = storeKRs.filter((kr) =>
    objectives.some((o) => o.id === kr.objectiveId)
  );

  // Key Results Status Columns (Priority focus for exceptions)
  const krColumns = [
    {
      id: 'kr-introuble',
      title: 'In Trouble',
      items: allKRs.filter((k) => k.status === 'In Trouble'),
      color: 'border-red-300 bg-red-50/30',
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'kr-atrisk',
      title: 'At Risk / Delayed',
      items: allKRs.filter((k) => k.status === 'At Risk' || k.isDelayed),
      color: 'border-amber-300 bg-amber-50/30',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'kr-ontrack',
      title: 'On Track',
      items: allKRs.filter((k) => k.status === 'On Track' && !k.isDelayed),
      color: 'border-emerald-300 bg-emerald-50/30',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'kr-completed',
      title: 'Completed',
      items: allKRs.filter((k) => k.status === 'Completed'),
      color: 'border-blue-300 bg-blue-50/30',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  // Objectives Columns
  const objColumns = [
    {
      id: 'active-introuble',
      title: 'In Trouble',
      items: objectives.filter((o) => o.status === 'Active' && o.health === 'In Trouble'),
      color: 'border-red-300 bg-red-50/30',
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'active-atrisk',
      title: 'At Risk',
      items: objectives.filter((o) => o.status === 'Active' && o.health === 'At Risk'),
      color: 'border-amber-300 bg-amber-50/30',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'active-ontrack',
      title: 'On Track',
      items: objectives.filter((o) => o.status === 'Active' && o.health === 'On Track'),
      color: 'border-emerald-300 bg-emerald-50/30',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'completed',
      title: 'Completed',
      items: objectives.filter((o) => o.status === 'Completed'),
      color: 'border-blue-300 bg-blue-50/30',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'draft',
      title: 'Draft',
      items: objectives.filter((o) => o.status === 'Draft'),
      color: 'border-slate-300 bg-slate-50/50',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

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
          <h1 className="text-2xl font-bold text-[#1e293b]">Progress & Risk Board</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Focused exception view to quickly identify and mitigate key results that are at risk or behind expected pace.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setMode('krs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'krs'
                ? 'bg-white shadow text-[#2d8fd8]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Key Results Pacing ({allKRs.length})
          </button>
          <button
            onClick={() => setMode('objectives')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'objectives'
                ? 'bg-white shadow text-[#2d8fd8]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Objectives Health ({objectives.length})
          </button>
        </div>
      </div>

      {/* KEY RESULTS MODE (DEFAULT EXCEPTION VIEW) */}
      {mode === 'krs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {krColumns.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-4 flex flex-col gap-3 min-h-[400px] shadow-sm`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="font-bold text-xs text-slate-800">{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {col.items.map((kr) => {
                  const parent = db.objectives.find((o) => o.id === kr.objectiveId);
                  const owner = db.users.find((u) => u.id === kr.ownerId);

                  return (
                    <div
                      key={kr.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm hover:border-[#2d8fd8] transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          onClick={() => navigate(`/okrs/${kr.objectiveId}`)}
                          className="text-slate-400 truncate max-w-[130px] hover:underline cursor-pointer"
                        >
                          {parent?.title}
                        </span>
                        <KRStatusChip
                          status={kr.status}
                          isDelayed={kr.isDelayed}
                          isOverridden={kr.statusOverridden}
                        />
                      </div>

                      <h4
                        onClick={() => navigate(`/okrs/${kr.objectiveId}/kr/${kr.id}`)}
                        className="font-bold text-xs text-slate-900 hover:text-[#2d8fd8] cursor-pointer"
                      >
                        {kr.name}
                      </h4>

                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{owner?.name}</span>
                        <span className="font-mono">
                          {kr.current} / {kr.target}
                        </span>
                      </div>

                      <ProgressBar
                        progress={kr.achievementPercent}
                        expectedProgress={kr.expectedPercent}
                        showLabels
                      />

                      <div className="pt-2 border-t border-slate-100 flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedKRForUpdate(kr)}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/okrs/${kr.objectiveId}/kr/${kr.id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {col.items.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400">
                    No key results in this category
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OBJECTIVES MODE */}
      {mode === 'objectives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {objColumns.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-4 flex flex-col gap-3 min-h-[400px] shadow-sm`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="font-bold text-xs text-slate-800">{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {col.items.map((obj) => {
                  const owner = db.users.find((u) => u.id === obj.ownerId);
                  const krsCount = db.keyResults.filter((k) => k.objectiveId === obj.id).length;

                  return (
                    <div
                      key={obj.id}
                      onClick={() => navigate(`/okrs/${obj.id}`)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm hover:border-[#2d8fd8] cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">[{obj.level}]</span>
                        <ApprovalChip state={obj.approvalState} />
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 hover:text-[#2d8fd8] line-clamp-2">
                        {obj.title}
                      </h4>

                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{owner?.name}</span>
                        <span>{krsCount} KRs</span>
                      </div>

                      <ObjectiveProgressDisplay
                        status={obj.status}
                        progress={obj.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                        compact
                      />
                    </div>
                  );
                })}

                {col.items.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400">
                    No objectives in this category
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline KR Progress Update Drawer */}
      {selectedKRForUpdate && (
        <UpdateProgressDrawer
          isOpen={Boolean(selectedKRForUpdate)}
          onClose={() => setSelectedKRForUpdate(null)}
          keyResult={selectedKRForUpdate}
          onSuccess={() => {
            refreshStore();
            setSelectedKRForUpdate(null);
          }}
        />
      )}
    </div>
  );
};
