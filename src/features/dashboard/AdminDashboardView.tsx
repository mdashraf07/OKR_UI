import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpRight,
  Filter,
  Users,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { KRStatusChip, ObjectiveStatusPill, ObjectiveHealthChip, ApprovalChip } from '../../components/ui/Chips';
import { calculateExpectedProgress } from '../../lib/calculations';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminDashboardView: React.FC = () => {
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

  // Department filter
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  // Expanded rows for the hierarchy tree
  const [expandedObjectives, setExpandedObjectives] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    50: true,
    51: true,
    60: true,
    70: true,
  });

  const toggleObjective = (id: number) => {
    setExpandedObjectives((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter objectives for the current cycle
  const cycleObjectives = storeObjectives.filter((o) => o.cycleId === selectedCycleId);
  const filteredObjectives = cycleObjectives.filter((o) => {
    if (selectedDeptId === 'ALL') return true;
    return o.departmentId?.toString() === selectedDeptId;
  });

  // Calculate high-level stats
  const activeObjs = cycleObjectives.filter((o) => o.status === 'Active');
  const avgCompanyProgress =
    activeObjs.length > 0
      ? Math.round(
          activeObjs.reduce((sum, o) => sum + (o.progress || 0), 0) / activeObjs.length
        )
      : 0;

  const allKRs = storeKRs.filter((k) =>
    cycleObjectives.some((o) => o.id === k.objectiveId)
  );

  const onTrackCount = allKRs.filter((k) => k.status === 'On Track').length;
  const atRiskCount = allKRs.filter((k) => k.status === 'At Risk').length;
  const inTroubleCount = allKRs.filter((k) => k.status === 'In Trouble').length;

  // 1. Company Growth Trajectory Data (Target vs Actual Growth % across months)
  const growthTrajectoryData = [
    { month: 'Jul', targetRevenue: 60, actualRevenue: 58, targetGrowth: 15, actualGrowth: 14 },
    { month: 'Aug', targetRevenue: 68, actualRevenue: 67, targetGrowth: 22, actualGrowth: 21 },
    { month: 'Sep', targetRevenue: 75, actualRevenue: 76, targetGrowth: 30, actualGrowth: 32 },
    { month: 'Oct (Current)', targetRevenue: 85, actualRevenue: 84, targetGrowth: 40, actualGrowth: 42 },
    { month: 'Nov (Projected)', targetRevenue: 92, actualRevenue: 94, targetGrowth: 48, actualGrowth: 50 },
    { month: 'Dec (Target)', targetRevenue: 100, actualRevenue: 102, targetGrowth: 60, actualGrowth: 62 },
  ];

  // 2. Department Progress Comparison
  const departmentProgressData = db.departments.map((dept) => {
    const deptObjs = cycleObjectives.filter((o) => o.departmentId === dept.id && o.status === 'Active');
    const avg =
      deptObjs.length > 0
        ? Math.round(deptObjs.reduce((s, o) => s + (o.progress || 0), 0) / deptObjs.length)
        : 35 + ((dept.id * 7) % 30);
    return {
      department: dept.name,
      progress: avg,
      target: cycleExpectedPace,
    };
  });

  // 3. Check-in Discipline Analytics
  const disciplineData = [
    { name: 'On-time (84%)', value: 84, color: '#10b981' },
    { name: 'Late (10%)', value: 10, color: '#f59e0b' },
    { name: 'Missed (4%)', value: 4, color: '#ef4444' },
    { name: 'Paused (2%)', value: 2, color: '#94a3b8' },
  ];

  const deptDisciplineData = [
    { dept: 'Sales', onTime: 92, late: 6, missed: 2 },
    { dept: 'Engineering', onTime: 88, late: 8, missed: 4 },
    { dept: 'Cust. Service', onTime: 85, late: 10, missed: 5 },
    { dept: 'Marketing', onTime: 90, late: 7, missed: 3 },
    { dept: 'HR & People', onTime: 95, late: 4, missed: 1 },
    { dept: 'Operations', onTime: 82, late: 12, missed: 6 },
  ];

  // Group objectives into Organization -> Department -> Team / Individual
  const orgObjectives = filteredObjectives.filter((o) => o.level === 'Organization');
  const standaloneDeptObjectives = filteredObjectives.filter(
    (o) => o.level === 'Department' && !o.parentObjectiveId
  );

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Enterprise Executive Oversight
            </span>
            <span className="text-xs text-slate-400">· {currentCycle.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
            Company OKR Cycle & Growth Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Full organizational hierarchy cascading, revenue velocity, and discipline tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/cycles')}
            leftIcon={<Calendar className="w-4 h-4 text-purple-700" />}
          >
            Manage Cycles
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/okrs/new')}
            leftIcon={<Target className="w-4 h-4" />}
          >
            + Create Strategic OKR
          </Button>
        </div>
      </div>

      {/* 2. Executive Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cycle Progress */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Company OKR Average</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Pacing Gap: +{Math.max(0, avgCompanyProgress - cycleExpectedPace)}%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{avgCompanyProgress}%</div>
          <ProgressBar
            progress={avgCompanyProgress}
            expectedProgress={cycleExpectedPace}
            showLabels
          />
        </div>

        {/* Card 2: Strategic Alignment */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Strategic Cascading Index</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">96.4%</div>
          <div className="text-[11px] text-slate-500">
            Objectives linked to company pillars: <strong>{cycleObjectives.length} / {cycleObjectives.length}</strong>
          </div>
        </div>

        {/* Card 3: Check-in Discipline */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">On-Time Check-in Discipline</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">84%</div>
          <div className="text-[11px] text-slate-500">
            Across 10 team departments · <strong>92 weekly check-ins</strong>
          </div>
        </div>

        {/* Card 4: Key Result Health */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Active Key Results</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{allKRs.length} Total</div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-600 font-semibold">{onTrackCount} On Track</span>
            <span className="text-amber-600 font-semibold">{atRiskCount} At Risk</span>
            <span className="text-red-600 font-semibold">{inTroubleCount} Behind</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ENTIRE COMPANY OKR CYCLE HIERARCHY (Cycle -> Objectives -> KRs) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0e7490] text-white">
                {currentCycle.name}
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Company OKR Cycle Hierarchy Tree
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cascading enterprise hierarchy: Strategic Objectives cascading down to Departmental & Key Result metrics.
            </p>
          </div>

          {/* Department Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Department:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-semibold outline-none focus:border-teal-500"
            >
              <option value="ALL">All Departments ({db.departments.length})</option>
              {db.departments.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tree Container */}
        <div className="space-y-4">
          {orgObjectives.map((orgObj) => {
            const isOrgExpanded = !!expandedObjectives[orgObj.id];
            const orgKRs = storeKRs.filter((k) => k.objectiveId === orgObj.id);
            const deptChildren = cycleObjectives.filter((o) => o.parentObjectiveId === orgObj.id);

            return (
              <div
                key={orgObj.id}
                className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 p-4.5 space-y-3"
              >
                {/* 1. Organization Objective Header */}
                <div
                  onClick={() => toggleObjective(orgObj.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-800 transition-colors"
                    >
                      {isOrgExpanded ? (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-700 text-white tracking-wide uppercase">
                          Company Pillar
                        </span>
                        <ObjectiveStatusPill status={orgObj.status} />
                        {orgObj.status === 'Active' && <ObjectiveHealthChip health={orgObj.health} />}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {orgObj.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-44 flex-shrink-0">
                      <ObjectiveProgressDisplay
                        status={orgObj.status}
                        progress={orgObj.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                        compact
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/okrs/${orgObj.id}`);
                      }}
                      className="text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      View Goal
                    </Button>
                  </div>
                </div>

                {/* Expanded Pillar Content: KRs & Department Sub-Goals */}
                {isOrgExpanded && (
                  <div className="pl-6 border-l-2 border-emerald-300 space-y-3 pt-2">
                    {/* Direct Org KRs */}
                    {orgKRs.length > 0 && (
                      <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-2">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                          Company Key Results ({orgKRs.length})
                        </span>
                        <div className="space-y-1.5">
                          {orgKRs.map((kr) => (
                            <div
                              key={kr.id}
                              className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-emerald-700">└</span>
                                <span className="font-semibold text-slate-800">{kr.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <KRStatusChip status={kr.status} />
                                <span className="font-mono font-bold text-slate-700">
                                  {kr.achievementPercent}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Department Cascaded Objectives under this Pillar */}
                    <div className="space-y-3">
                      {deptChildren.map((deptObj) => {
                        const isDeptExpanded = !!expandedObjectives[deptObj.id];
                        const deptKRs = storeKRs.filter((k) => k.objectiveId === deptObj.id);
                        const teamChildren = cycleObjectives.filter(
                          (o) => o.parentObjectiveId === deptObj.id
                        );
                        const dept = db.departments.find((d) => d.id === deptObj.departmentId);

                        return (
                          <div
                            key={deptObj.id}
                            className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/30 space-y-2.5"
                          >
                            <div
                              onClick={() => toggleObjective(deptObj.id)}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  className="p-0.5 rounded text-sky-800 hover:bg-sky-100"
                                >
                                  {isDeptExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="px-2 py-0.5 rounded bg-[#0e7490] text-white text-[10px] font-bold">
                                      {dept?.name || 'Department'}
                                    </span>
                                    <ObjectiveStatusPill status={deptObj.status} />
                                    {deptObj.status === 'Active' && <ObjectiveHealthChip health={deptObj.health} />}
                                  </div>
                                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-800">
                                    {deptObj.title}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="w-36 flex-shrink-0">
                                  <ObjectiveProgressDisplay
                                    status={deptObj.status}
                                    progress={deptObj.progress || 0}
                                    expectedProgress={cycleExpectedPace}
                                    showLabels
                                    compact
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/okrs/${deptObj.id}`);
                                  }}
                                  className="text-[11px] text-sky-800"
                                >
                                  Open
                                </Button>
                              </div>
                            </div>

                            {/* Department KRs and Individual Goals */}
                            {isDeptExpanded && (
                              <div className="pl-6 border-l-2 border-sky-300 space-y-2 pt-1">
                                {deptKRs.map((kr) => {
                                  const owner = db.users.find((u) => u.id === kr.ownerId);
                                  return (
                                    <div
                                      key={kr.id}
                                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-sky-600">└</span>
                                        <span className="font-medium text-slate-800">{kr.name}</span>
                                        <span className="text-[10px] text-slate-400">
                                          ({owner?.name})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <KRStatusChip status={kr.status} isDraft={deptObj.status === 'Draft'} />
                                        <span className="font-mono text-slate-700 text-[11px]">
                                          {deptObj.status === 'Draft' ? (
                                            `Target: ${kr.baseline} → ${kr.target}`
                                          ) : (
                                            <strong className="font-bold">{kr.achievementPercent}%</strong>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Individual / Team Child Goals */}
                                {teamChildren.map((teamObj) => {
                                  const teamOwner = db.users.find((u) => u.id === teamObj.ownerId);
                                  return (
                                    <div
                                      key={teamObj.id}
                                      onClick={() => navigate(`/okrs/${teamObj.id}`)}
                                      className="p-2.5 rounded-lg bg-white border border-purple-200 hover:border-purple-400 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                                          {teamObj.level}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                          {teamObj.title}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          — {teamOwner?.name}
                                        </span>
                                      </div>
                                      <div className="w-28 flex-shrink-0">
                                        <ProgressBar progress={teamObj.progress || 0} showLabels />
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPANY GROWTH & REVENUE TRAJECTORY GRAPHS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Revenue & Growth Trajectory Trendline */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Company Growth & Revenue Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Quarterly Target vs Actual Achievement velocity over monthly milestones
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Q4 Ahead of Target (+2%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualGrowth"
                  name="Actual Company Growth %"
                  stroke="#0e7490"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="targetGrowth"
                  name="Planned Target %"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Department Progress Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Department Performance Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Pacing progress across Sales, Engineering, Customer Service, and Marketing
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">Cycle Pace: {cycleExpectedPace}%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="progress" name="Achieved Progress %" fill="#0e7490" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="Expected Pace %" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EMPLOYEES & MANAGERS CHECK-IN DISCIPLINE ANALYTICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Check-in Discipline Donut & Metrics (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Check-in Discipline Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Overall adherence to weekly OKR updates across teams
              </p>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disciplineData}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {disciplineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
            {disciplineData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Department-wise Discipline Comparison (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Manager & Team Check-in Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Discipline metrics and review turnaround rate across departments
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Avg Turnaround: 18h
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">On-time %</th>
                  <th className="py-2.5 px-3 text-center">Late %</th>
                  <th className="py-2.5 px-3 text-center">Missed %</th>
                  <th className="py-2.5 px-3 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptDisciplineData.map((row) => (
                  <tr key={row.dept} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-800">{row.dept}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {row.onTime}%
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-amber-600">
                      {row.late}%
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-red-500">
                      {row.missed}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        High
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
