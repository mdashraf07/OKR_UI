import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Link as LinkIcon,
  Target,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  Tag,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { getDb } from '../../api/mockDb';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { calculateExpectedProgress } from '../../lib/calculations';
import { useOkrStore } from '../okr/okrStore';
import { ObjectiveStatusPill, ObjectiveHealthChip, KRStatusChip } from '../../components/ui/Chips';

export const CompanyOkrsPage: React.FC = () => {
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

  // View Tab: "company-wide" vs "my-okrs"
  const [activeTab, setActiveTab] = useState<'company-wide' | 'my-okrs'>('company-wide');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Expanded tree items
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    50: true,
    51: true,
    60: true,
    70: true,
    80: true,
  });

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Company Organization Level Goals
  const orgObjectives = storeObjectives.filter(
    (o) => o.cycleId === selectedCycleId && o.level === 'Organization'
  );

  // 2. Filtered for department selector
  const filteredOrgObjectives = orgObjectives.filter((org) => {
    if (selectedDeptFilter === 'ALL') return true;
    if (org.departmentId?.toString() === selectedDeptFilter) return true;
    const hasDeptChild = storeObjectives.some(
      (o) => o.parentObjectiveId === org.id && o.departmentId?.toString() === selectedDeptFilter
    );
    return hasDeptChild;
  });

  // 3. Employee's personal OKRs and their parent hierarchy
  const myObjectives = storeObjectives.filter(
    (o) => o.ownerId === currentUser?.id && o.cycleId === selectedCycleId
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0e7490] text-white">
              {currentCycle.name}
            </span>
            <span className="text-xs text-slate-400">· Expected Pace: {cycleExpectedPace}%</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Company-Wide Strategic OKRs & Alignment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise cascading tree spanning Sales (3 Core OKRs), Engineering, Marketing, Customer Success, and HR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main View Toggle Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('company-wide')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'company-wide'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Company Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-okrs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'my-okrs'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              MY OKRs Alignment
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/okrs/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Goal
          </Button>
        </div>
      </div>

      {/* Department Filter Pills (When in Company Wide mode) */}
      {activeTab === 'company-wide' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] pr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              selectedDeptFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Departments ({db.departments.length})
          </button>
          {db.departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptFilter(dept.id.toString())}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedDeptFilter === dept.id.toString()
                  ? 'bg-[#0e7490] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COMPANY-WIDE STRATEGIC HIERARCHY */}
      {/* ========================================================================= */}
      {activeTab === 'company-wide' && (
        <div className="space-y-6">
          {filteredOrgObjectives.map((org) => {
            const isExpanded = !!expandedNodes[org.id];
            const deptObjs = storeObjectives.filter(
              (o) =>
                o.parentObjectiveId === org.id &&
                o.cycleId === selectedCycleId &&
                (selectedDeptFilter === 'ALL' || o.departmentId?.toString() === selectedDeptFilter)
            );
            const orgKRs = storeKRs.filter((k) => k.objectiveId === org.id);

            return (
              <div
                key={org.id}
                className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-6 space-y-4"
              >
                {/* Org Header Row */}
                <div
                  onClick={() => toggleNode(org.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-black text-[10px] tracking-wide uppercase">
                          Company Pillar
                        </span>
                        <ObjectiveStatusPill status={org.status} />
                        {org.status === 'Active' && <ObjectiveHealthChip health={org.health} />}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {org.title}
                      </h2>
                      {org.description && (
                        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-48 flex-shrink-0">
                      <ObjectiveProgressDisplay
                        status={org.status}
                        progress={org.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/okrs/${org.id}`);
                      }}
                      className="text-xs text-emerald-800 font-bold"
                    >
                      Drill-down
                    </Button>
                  </div>
                </div>

                {/* Organization KRs */}
                {isExpanded && orgKRs.length > 0 && (
                  <div className="pl-6 pt-1 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                      Organization Key Results ({orgKRs.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {orgKRs.map((kr) => (
                        <div
                          key={kr.id}
                          className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs"
                        >
                          <div className="truncate max-w-xs font-semibold text-slate-800">
                            {kr.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <KRStatusChip status={kr.status} isDraft={org.status === 'Draft'} />
                            <span className="font-mono text-slate-700 text-[11px]">
                              {org.status === 'Draft' ? (
                                `Target: ${kr.baseline} → ${kr.target}`
                              ) : (
                                <strong className="font-bold">{kr.achievementPercent}%</strong>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cascaded Department Level Objectives */}
                {isExpanded && (
                  <div className="pl-6 border-l-2 border-emerald-300 space-y-4 pt-2">
                    {deptObjs.map((dept) => {
                      const isDeptExpanded = !!expandedNodes[dept.id];
                      const deptKRs = storeKRs.filter((k) => k.objectiveId === dept.id);
                      const teamObjs = storeObjectives.filter(
                        (o) => o.parentObjectiveId === dept.id && o.cycleId === selectedCycleId
                      );
                      const deptMeta = db.departments.find((d) => d.id === dept.departmentId);

                      return (
                        <div
                          key={dept.id}
                          className="border border-sky-300 rounded-xl p-4.5 bg-sky-50/20 space-y-3"
                        >
                          <div
                            onClick={() => toggleNode(dept.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                className="p-0.5 rounded text-sky-800 hover:bg-sky-100"
                              >
                                {isDeptExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="px-2 py-0.5 rounded-full bg-[#0e7490] text-white font-extrabold text-[10px]">
                                    {deptMeta?.name || 'Department'}
                                  </span>
                                  <ObjectiveStatusPill status={dept.status} />
                                  {dept.status === 'Active' && <ObjectiveHealthChip health={dept.health} />}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-800">
                                  {dept.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-40 flex-shrink-0">
                                <ObjectiveProgressDisplay
                                  status={dept.status}
                                  progress={dept.progress || 0}
                                  expectedProgress={cycleExpectedPace}
                                  showLabels
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/okrs/${dept.id}`);
                                }}
                                className="text-xs text-sky-800"
                              >
                                Details
                              </Button>
                            </div>
                          </div>

                          {/* Department KRs */}
                          {isDeptExpanded && deptKRs.length > 0 && (
                            <div className="pl-6 pt-1 space-y-1.5">
                              {deptKRs.map((kr) => {
                                const krOwner = db.users.find((u) => u.id === kr.ownerId);
                                return (
                                  <div
                                    key={kr.id}
                                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sky-600">└</span>
                                      <span className="font-medium text-slate-800">{kr.name}</span>
                                      <span className="text-[10px] text-slate-400">
                                        ({krOwner?.name})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <KRStatusChip status={kr.status} isDraft={dept.status === 'Draft'} />
                                      <span className="font-mono text-slate-700 text-[11px]">
                                        {dept.status === 'Draft' ? (
                                          `Target: ${kr.baseline} → ${kr.target}`
                                        ) : (
                                          <strong className="font-bold">{kr.achievementPercent}%</strong>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Team & Individual Child Goals under this Department Goal */}
                          {isDeptExpanded && (
                            <div className="pl-6 border-l-2 border-sky-300 space-y-2 pt-1">
                              {teamObjs.map((team) => {
                                const teamOwner = db.users.find((u) => u.id === team.ownerId);
                                return (
                                  <div
                                    key={team.id}
                                    onClick={() => navigate(`/okrs/${team.id}`)}
                                    className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                                        {team.level}
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {team.title}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        — {teamOwner?.name}
                                      </span>
                                    </div>
                                    <div className="w-32 flex-shrink-0">
                                      <ProgressBar progress={team.progress || 0} showLabels />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY OKRS & DIRECT CASCADE ALIGNMENT (Requested by user) */}
      {/* ========================================================================= */}
      {activeTab === 'my-okrs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {currentUser?.name}’s Personal Alignment Map
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                My OKRs & Cascading Company Alignment
              </h2>
              <p className="text-xs text-slate-500">
                Shows your active individual goals and how they directly roll up into Team, Department, and Company Pillars.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/okrs?create=true')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              + Create My Goal
            </Button>
          </div>

          {/* List of employee's goals with upward cascade path */}
          <div className="space-y-6">
            {myObjectives.map((myObj) => {
              const krs = storeKRs.filter((k) => k.objectiveId === myObj.id);
              const parentDeptObj = myObj.parentObjectiveId
                ? storeObjectives.find((o) => o.id === myObj.parentObjectiveId)
                : null;
              const parentOrgObj = parentDeptObj?.parentObjectiveId
                ? storeObjectives.find((o) => o.id === parentDeptObj.parentObjectiveId)
                : parentDeptObj?.level === 'Organization'
                ? parentDeptObj
                : null;
              const deptMeta = db.departments.find((d) => d.id === myObj.departmentId);

              return (
                <div
                  key={myObj.id}
                  className="p-5 rounded-2xl border-2 border-teal-200 bg-teal-50/20 space-y-4"
                >
                  {/* Upward Cascade Breadcrumb */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 pb-2 border-b border-teal-100">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Alignment Cascade:
                    </span>
                    {parentOrgObj && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Pillar: {parentOrgObj.title}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </>
                    )}
                    {parentDeptObj && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                          Dept: {parentDeptObj.title}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </>
                    )}
                    <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-[10px]">
                      My Objective
                    </span>
                  </div>

                  {/* Objective Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                          {deptMeta?.name || 'Department'}
                        </span>
                        <ObjectiveStatusPill status={myObj.status} />
                        {myObj.status === 'Active' && <ObjectiveHealthChip health={myObj.health} />}
                      </div>
                      <h3
                        onClick={() => navigate(`/okrs/${myObj.id}`)}
                        className="text-base font-bold text-slate-900 hover:text-teal-800 cursor-pointer"
                      >
                        {myObj.title}
                      </h3>
                      {myObj.description && (
                        <p className="text-xs text-slate-600 mt-0.5">{myObj.description}</p>
                      )}
                    </div>

                    <div className="w-44 flex-shrink-0">
                      <ObjectiveProgressDisplay
                        status={myObj.status}
                        progress={myObj.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                      />
                    </div>
                  </div>

                  {/* Associated Key Results under this personal objective */}
                  <div className="bg-white p-3.5 rounded-xl border border-teal-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        My Key Results ({krs.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/okrs/${myObj.id}`)}
                        className="text-teal-700 font-semibold hover:underline"
                      >
                        + Add Key Result
                      </button>
                    </div>

                    {krs.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                        No key results added yet. Click "+ Add Key Result" to define metrics.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {krs.map((kr) => (
                          <div
                            key={kr.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              <span className="font-semibold text-slate-800">{kr.name}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {myObj.status === 'Draft' ? (
                                <div className="text-right">
                                  <span className="text-[11px] text-slate-600 font-mono block">
                                    Baseline: {kr.baseline} · Target: {kr.target}
                                  </span>
                                  <span className="text-[10px] text-slate-400 italic">
                                    Progress available after activation
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    Target: {kr.baseline} → {kr.target} (Act: {kr.current})
                                  </span>
                                  <span className="font-mono font-bold text-slate-800">
                                    {kr.achievementPercent}%
                                  </span>
                                </>
                              )}
                              <KRStatusChip status={kr.status} isDraft={myObj.status === 'Draft'} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
