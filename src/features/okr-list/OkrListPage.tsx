import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Table as TableIcon,
  LayoutGrid,
  Network,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  ArrowRight,
  Shield,
  Layers,
  Building2,
  Calendar,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Tag,
  Target,
  GripVertical,
  Send,
  Trash2,
  Archive,
  Link as LinkIcon,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { KeyResult, Objective, Department, Cycle } from '../../types';
import {
  ObjectiveStatusPill,
  ObjectiveHealthChip,
  KRStatusChip,
  ApprovalChip,
} from '../../components/ui/Chips';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToastStore } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { calculateExpectedProgress, formatValueWithUnit } from '../../lib/calculations';
import { CreateObjectiveDrawer } from '../objective/CreateObjectiveDrawer';
import { AddKpiDrawer } from '../key-result/AddKpiDrawer';
import { CheckInDrawer } from '../check-ins/CheckInDrawer';
import { KeyResultDetailDrawer } from '../key-result/KeyResultDetailDrawer';
import { ObjectiveDetailDrawer } from '../objective/ObjectiveDetailDrawer';

export const OkrListPage: React.FC = () => {
  const { currentUser, selectedCycleId, setSelectedCycleId } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToastStore();

  const {
    objectives: allStoreObjectives,
    keyResults: allStoreKRs,
    refresh: refreshStore,
    cancelObjective: storeCancelObjective,
    submitObjective: storeSubmitObjective,
  } = useOkrStore();

  const db = getDb();

  // Active Department Selection (S1 Department Selector)
  const deptParam = searchParams.get('departmentId');
  const initialDeptId = deptParam ? Number(deptParam) : currentUser?.departmentId || 10; // yoga or corporate
  const [selectedDeptId, setSelectedDeptId] = useState<number>(initialDeptId);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  // Active Cycle Selection
  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'hierarchy'>('table');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({
    4: true,
    5: true,
    11: true,
  });

  // Filters
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');

  // Scope Filter: all, my, or department
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my' | 'department'>('all');

  // Interactive Drawers (Never navigate away)
  const isCreateParam = searchParams.get('create') === 'true' || searchParams.get('new') === 'true';
  const [isCreateObjectiveDrawerOpen, setIsCreateObjectiveDrawerOpen] = useState(isCreateParam);
  const [targetObjectiveForKR, setTargetObjectiveForKR] = useState<Objective | null>(null);
  const [selectedKRForCheckIn, setSelectedKRForCheckIn] = useState<KeyResult | null>(null);
  const [selectedKRForDetail, setSelectedKRForDetail] = useState<KeyResult | null>(null);
  const [selectedObjForDetail, setSelectedObjForDetail] = useState<Objective | null>(null);

  // Dialogs
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState<number | null>(null);

  const asOfDate = db.devSettings.demoDate;
  const cycleExpectedPace = calculateExpectedProgress(
    currentCycle.startDate,
    currentCycle.endDate,
    asOfDate
  );

  const currentDepartment =
    db.departments.find((d) => d.id === selectedDeptId) || db.departments[0];

  // Filtered objectives for this department/cycle/scope
  const departmentObjectives = allStoreObjectives.filter((o) => {
    if (o.cycleId !== currentCycle.id) return false;
    if (scopeFilter === 'my') {
      return (
        o.ownerId === currentUser?.id ||
        allStoreKRs.some((k) => k.objectiveId === o.id && k.ownerId === currentUser?.id)
      );
    }
    if (scopeFilter === 'all') {
      return true;
    }
    // If specific department is chosen
    if (selectedDeptId) {
      if (o.departmentId && o.departmentId === selectedDeptId) return true;
      const owner = db.users.find((u) => u.id === o.ownerId);
      if (owner?.departmentId === selectedDeptId) return true;
      return false;
    }
    return true;
  });

  // Calculate department overall progress
  const deptProgressValues = departmentObjectives
    .filter((o) => o.progress !== undefined)
    .map((o) => o.progress || 0);
  const deptAverageProgress =
    deptProgressValues.length > 0
      ? Math.round(deptProgressValues.reduce((a, b) => a + b, 0) / deptProgressValues.length)
      : 0;

  // Filtered list
  const filtered = departmentObjectives.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = o.title.toLowerCase().includes(q);
      const matchDesc = o.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (levelFilter !== 'ALL' && o.level !== levelFilter) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (approvalFilter !== 'ALL' && o.approvalState !== approvalFilter) return false;
    return true;
  });

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCyclePrev = () => {
    const currentIndex = db.cycles.findIndex((c) => c.id === currentCycle.id);
    if (currentIndex > 0) {
      setSelectedCycleId(db.cycles[currentIndex - 1].id);
    }
  };

  const handleCycleNext = () => {
    const currentIndex = db.cycles.findIndex((c) => c.id === currentCycle.id);
    if (currentIndex < db.cycles.length - 1) {
      setSelectedCycleId(db.cycles[currentIndex + 1].id);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;
    try {
      await storeCancelObjective(cancelTargetId, 'Cancelled from list view', currentUser?.id || 1);
      showToast({ type: 'success', message: 'Objective archived/cancelled' });
      setCancelTargetId(null);
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to cancel' });
    }
  };

  const handleSubmitForApproval = async (objId: number) => {
    const krs = allStoreKRs.filter((k) => k.objectiveId === objId);
    if (krs.length === 0) {
      showToast({
        type: 'warning',
        message: 'Add at least one Key Result before submitting for approval.',
      });
      return;
    }
    try {
      await storeSubmitObjective(objId, currentUser?.id || 1);
      showToast({ type: 'success', message: 'Objective submitted for manager approval.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to submit' });
    }
  };

  const filteredDepts = db.departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-20">
      {/* S1. TITLE BLOCK */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-[#2d8fd8]/10 text-[#2d8fd8] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-xl font-bold text-[#1e293b]">
              {currentDepartment.name} OKRs
            </h1>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <button
              type="button"
              onClick={() =>
                showToast({
                  type: 'info',
                  message: 'Champions help drive departmental OKR alignment and check-in discipline.',
                })
              }
              className="text-xs text-[#2d8fd8] hover:underline font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Add Champions
            </button>
          </div>
        </div>

        {/* Primary Action Button: Open Create Objective Drawer */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateObjectiveDrawerOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-semibold"
          >
            + Create Objective
          </Button>
        </div>
      </div>

      {/* S1. TOOLBAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Department Selector, Period Arrows, Period Label, Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium flex items-center gap-2 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-[#2d8fd8]" />
              <span>{currentDepartment.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Searchable Org Tree Dropdown */}
            {isDeptDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deptSearchQuery}
                    onChange={(e) => setDeptSearchQuery(e.target.value)}
                    placeholder="Search Department..."
                    className="w-full h-8 pl-8 pr-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d8fd8]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {filteredDepts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(d.id);
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        selectedDeptId === d.id
                          ? 'bg-blue-50 text-[#2d8fd8] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{d.name}</span>
                      </span>
                      {selectedDeptId === d.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2d8fd8]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Period Selector Controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-9 overflow-hidden">
            <button
              type="button"
              onClick={handleCyclePrev}
              className="px-2 h-full hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
              className="px-3 h-full font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentCycle.name.slice(0, 7)}, +1 more</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={handleCycleNext}
              className="px-2 h-full hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cycle Dropdown */}
          {isCycleDropdownOpen && (
            <div className="absolute left-64 top-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 w-60 space-y-1">
              {db.cycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCycleId(c.id);
                    setIsCycleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    c.id === currentCycle.id
                      ? 'bg-blue-50 text-[#2d8fd8] font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{c.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterBarVisible(!isFilterBarVisible)}
            className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 transition-colors ${
              isFilterBarVisible
                ? 'border-[#2d8fd8] bg-blue-50/50 text-[#2d8fd8] font-semibold'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Scope Selector: All OKRs | MY OKRs | By Department */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All OKRs
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('my')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scopeFilter === 'my'
                  ? 'bg-white text-[#2d8fd8] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              MY OKRs
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('department')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scopeFilter === 'department'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              By Department
            </button>
          </div>
        </div>

        {/* Right: Download, Segmented Progress, View Switcher */}
        <div className="flex items-center gap-3">
          {/* Download Icon */}
          <button
            type="button"
            onClick={() =>
              showToast({
                type: 'info',
                message: 'Exporting departmental OKRs to CSV/PDF...',
              })
            }
            className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
            title="Download OKR Report"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Department Overall Progress */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 font-medium">Unit Progress:</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${deptAverageProgress}%` }}
              />
            </div>
            <span className="font-bold text-slate-800 font-mono text-[11px]">
              {deptAverageProgress}%
            </span>
          </div>

          {/* View Switcher: List / Cards / Hierarchy */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white shadow text-[#2d8fd8]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white shadow text-[#2d8fd8]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`p-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'hierarchy'
                  ? 'bg-white shadow text-[#2d8fd8]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Hierarchy</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER EXPANSION BAR */}
      {isFilterBarVisible && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search objectives..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d8fd8]"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="Organization">Organization</option>
            <option value="Department">Department</option>
            <option value="Team">Team</option>
            <option value="Individual">Individual</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Approvals</option>
            <option value="NotSubmitted">Not Submitted</option>
            <option value="PendingManager">Pending Manager</option>
            <option value="PendingHR">Pending HR/Admin</option>
            <option value="Approved">Approved</option>
            <option value="Returned">Returned</option>
            <option value="Rejected">Rejected</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setLevelFilter('ALL');
              setStatusFilter('ALL');
              setApprovalFilter('ALL');
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* S1. TREE TABLE VIEW */}
      {filtered.length === 0 ? (
        <EmptyState
          title={`No objectives for ${currentDepartment.name} in ${currentCycle.name}`}
          description="Create your first objective for this department or start from a strategic goal template."
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateObjectiveDrawerOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Objective
            </Button>
          }
        />
      ) : (
        <>
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {scopeFilter === 'my' && (
                <div className="px-5 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border-b border-blue-100/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d8fd8] animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800">
                      MY OKRs View: Showing personal objectives and key results aligned directly to you ({currentUser?.name}) across the organization hierarchy.
                    </span>
                  </div>
                  <span className="text-[11px] text-[#2d8fd8] font-bold px-2 py-0.5 rounded-full bg-white border border-blue-200 shadow-xs">
                    {filtered.length} Objectives Active
                  </span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b border-slate-200/80 select-none">
                      <th className="py-4 px-3 w-12 text-center"></th>
                      <th className="py-4 px-4 w-36 font-bold text-slate-600">Perspective</th>
                      <th className="py-4 px-5 min-w-[340px] font-bold text-slate-700">Name & Hierarchy</th>
                      <th className="py-4 px-4 w-28 font-bold text-slate-600">Period</th>
                      <th className="py-4 px-4 w-44 font-bold text-slate-600">Owner(s)</th>
                      <th className="py-4 px-4 w-28 font-bold text-slate-600">Type</th>
                      <th className="py-4 px-4 w-48 font-bold text-slate-600">Lifecycle & Health</th>
                      <th className="py-4 px-4 w-36 font-bold text-slate-600">Approval</th>
                      <th className="py-4 px-5 w-48 font-bold text-slate-600">Progress</th>
                      <th className="py-4 px-4 text-right w-36 font-bold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((obj) => {
                      const isExpanded = !!expandedRows[obj.id];
                      const krs = allStoreKRs.filter((k) => k.objectiveId === obj.id);
                      const owner = db.users.find((u) => u.id === obj.ownerId);

                      return (
                        <React.Fragment key={obj.id}>
                          {/* Parent Objective Row */}
                          <tr
                            onClick={() => toggleRow(obj.id)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            {/* Drag Handle & Caret */}
                            <td className="py-4 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(obj.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-700" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Perspective */}
                            <td className="py-4 px-4 text-slate-600">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-medium">
                                {obj.perspective || 'Strategic'}
                              </span>
                            </td>

                            {/* Objective Name + Row Hover Actions */}
                            <td className="py-4 px-5">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-[#2d8fd8]">
                                    <Target className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedObjForDetail(obj);
                                      }}
                                      className="font-bold text-slate-900 group-hover:text-[#2d8fd8] hover:underline block truncate text-sm"
                                    >
                                      {obj.title}
                                    </span>
                                    {obj.description && (
                                      <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                                        {obj.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Row Hover Button Group */}
                                <div
                                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white/90 backdrop-blur-xs px-1.5 py-1 rounded-lg shadow-xs border border-slate-200/60"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* + Add KPI / Child */}
                                  <button
                                    type="button"
                                    onClick={() => setTargetObjectiveForKR(obj)}
                                    title="Add KPI (Key Result)"
                                    className="p-1 rounded hover:bg-blue-50 text-[#2d8fd8]"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedObjForDetail(obj)}
                                    title="Edit Objective"
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {/* Alignment */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      showToast({
                                        type: 'info',
                                        message: `Alignment view for "${obj.title}"`,
                                      })
                                    }
                                    title="Alignments"
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500"
                                  >
                                    <LinkIcon className="w-4 h-4" />
                                  </button>
                                  {/* Menu */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMenuRowId(
                                        activeMenuRowId === obj.id ? null : obj.id
                                      )
                                    }
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Period */}
                            <td className="py-4 px-4 text-slate-600 font-mono text-xs">
                              {currentCycle.name.slice(0, 7)}
                            </td>

                            {/* Owner */}
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-medium text-xs max-w-[150px] truncate">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {owner?.name || currentDepartment.name}
                              </span>
                            </td>

                            {/* Type */}
                            <td className="py-4 px-4 text-slate-600">
                              <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                                {obj.level}
                              </span>
                            </td>

                            {/* Lifecycle & Health */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <ObjectiveStatusPill status={obj.status} />
                                {obj.status === 'Active' && <ObjectiveHealthChip health={obj.health} />}
                              </div>
                            </td>

                            {/* Approval */}
                            <td className="py-4 px-4">
                              <ApprovalChip state={obj.approvalState} />
                            </td>

                            {/* Progress */}
                            <td className="py-4 px-5">
                              <div className="w-full">
                                <ObjectiveProgressDisplay
                                  status={obj.status}
                                  progress={obj.progress || 0}
                                  expectedProgress={cycleExpectedPace}
                                  showLabels
                                />
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td
                              className="py-4 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTargetObjectiveForKR(obj)}
                                  className="px-2.5 py-1 text-xs rounded-lg font-semibold text-[#2d8fd8] bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                  + KPI
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedObjForDetail(obj)}
                                  className="px-2.5 py-1 text-xs rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  Open
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Row Menu Popover */}
                          {activeMenuRowId === obj.id && (
                            <tr className="bg-slate-50">
                              <td colSpan={10} className="p-3 px-6">
                                <div className="flex items-center gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                  <button
                                    onClick={() => {
                                      setSelectedObjForDetail(obj);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-medium"
                                  >
                                    Open Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTargetObjectiveForKR(obj);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="px-3 py-1.5 hover:bg-blue-50 rounded-lg text-[#2d8fd8] font-bold"
                                  >
                                    + Add Key Result
                                  </button>
                                  {obj.approvalState === 'NotSubmitted' && (
                                    <button
                                      onClick={() => {
                                        handleSubmitForApproval(obj.id);
                                        setActiveMenuRowId(null);
                                      }}
                                      className="px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-emerald-700 font-bold"
                                    >
                                      Submit for Approval
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setCancelTargetId(obj.id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="px-3 py-1.5 hover:bg-red-50 rounded-lg text-red-600 font-medium ml-auto"
                                  >
                                    Cancel Objective
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* INLINE EXPANDED KEY RESULTS (Indented) */}
                          {isExpanded && (
                            <>
                              {krs.length === 0 ? (
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                  <td colSpan={10} className="py-4 px-8 pl-16 text-slate-500">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs">
                                        No Key Results under this objective yet. Objectives can be created individually.
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setTargetObjectiveForKR(obj)}
                                        className="text-xs text-[#2d8fd8] hover:underline font-bold px-3 py-1 rounded-lg bg-blue-50"
                                      >
                                        + Add Key Result
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                krs.map((kr) => {
                                  const krOwner = db.users.find((u) => u.id === kr.ownerId);

                                  return (
                                    <tr
                                      key={kr.id}
                                      className="bg-slate-50/60 hover:bg-blue-50/30 transition-colors border-b border-slate-100/70"
                                    >
                                      {/* Indent connector */}
                                      <td className="py-3.5 px-3 text-right">
                                        <span className="text-slate-400 font-mono text-sm">└</span>
                                      </td>

                                      {/* Perspective placeholder */}
                                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                                        —
                                      </td>

                                      {/* KR Name */}
                                      <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-2.5 pl-3">
                                          <div className="w-5 h-5 rounded-md bg-blue-100/60 flex items-center justify-center flex-shrink-0 text-[#2d8fd8]">
                                            <Tag className="w-3.5 h-3.5" />
                                          </div>
                                          <span
                                            onClick={() => setSelectedKRForDetail(kr)}
                                            className="font-medium text-slate-800 hover:text-[#2d8fd8] hover:underline cursor-pointer truncate max-w-lg text-xs"
                                          >
                                            {kr.name}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Period */}
                                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                                        {currentCycle.name.slice(0, 7)}
                                      </td>

                                      {/* Owner */}
                                      <td className="py-3.5 px-4 text-slate-600">
                                        <span className="inline-block truncate max-w-[140px] text-xs font-medium">
                                          {krOwner?.name || 'Owner'}
                                        </span>
                                      </td>

                                      {/* Type: Direction Arrow + KPI Name */}
                                      <td className="py-3.5 px-4 font-semibold text-slate-700 font-mono text-xs">
                                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                                          {kr.direction === 'INCREASE' ? '↑' : '↓'} {kr.kpiName || 'Accuracy'}
                                        </span>
                                      </td>

                                      {/* Lifecycle & Health */}
                                      <td className="py-3.5 px-4">
                                        <KRStatusChip
                                          status={kr.status}
                                          isDraft={obj.status === 'Draft'}
                                          isDelayed={kr.isDelayed}
                                          isOverridden={kr.statusOverridden}
                                        />
                                      </td>

                                      {/* Approval State inherited */}
                                      <td className="py-3.5 px-4 text-slate-400">
                                        <span className="text-xs italic">Inherited</span>
                                      </td>

                                      {/* Progress Bar & Actual */}
                                      <td className="py-3.5 px-5">
                                        {obj.status === 'Draft' ? (
                                          <div className="space-y-0.5 select-none">
                                            <div className="text-xs text-slate-700 font-mono">
                                              Baseline: <strong>{kr.baseline}</strong> · Target: <strong>{kr.target}</strong>
                                            </div>
                                            <div className="text-[11px] text-slate-500 italic">
                                              Progress available after activation
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-1">
                                            <ProgressBar
                                              progress={kr.achievementPercent}
                                              expectedProgress={kr.expectedPercent}
                                              showLabels
                                            />
                                            <div className="text-[11px] text-slate-500 font-mono">
                                              ({kr.baseline} → {kr.target}) · Act: {kr.current}
                                            </div>
                                          </div>
                                        )}
                                      </td>

                                      {/* Actions: Check-in / Details */}
                                      <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {obj.status === 'Draft' ? (
                                            <button
                                              type="button"
                                              disabled
                                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
                                              title="Check-ins are disabled for Draft objectives until activated"
                                            >
                                              Draft (Inactive)
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => setSelectedKRForCheckIn(kr)}
                                              className="px-2.5 py-1 rounded-lg bg-[#2d8fd8] text-white font-bold text-xs hover:bg-blue-600 shadow-xs transition-colors"
                                            >
                                              Check-in
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => setSelectedKRForDetail(kr)}
                                            className="px-2.5 py-1 rounded-lg hover:bg-slate-200 text-slate-600 font-medium text-xs transition-colors"
                                          >
                                            Details
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  Showing <strong className="text-slate-800">{filtered.length}</strong> objectives
                  for {currentDepartment.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Expected Pace Today: {cycleExpectedPace}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* S1. CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((obj) => {
                const krs = allStoreKRs.filter((k) => k.objectiveId === obj.id);

                return (
                  <div
                    key={obj.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#2d8fd8] transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <ObjectiveStatusPill status={obj.status} />
                        {obj.status === 'Active' && <ObjectiveHealthChip health={obj.health} />}
                      </div>

                      <h3
                        onClick={() => setSelectedObjForDetail(obj)}
                        className="font-bold text-slate-900 text-sm hover:text-[#2d8fd8] cursor-pointer line-clamp-2"
                      >
                        {obj.title}
                      </h3>

                      <ObjectiveProgressDisplay
                        status={obj.status}
                        progress={obj.progress || 0}
                        expectedProgress={cycleExpectedPace}
                        showLabels
                        compact
                      />

                      <div className="text-xs text-slate-500 font-mono">
                        {krs.length} Key Results associated
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setTargetObjectiveForKR(obj)}
                        className="text-[#2d8fd8] font-semibold hover:underline"
                      >
                        + Add KPI
                      </button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedObjForDetail(obj)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* S1. HIERARCHY CASCADE VIEW */}
          {viewMode === 'hierarchy' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-base font-bold text-[#1e293b]">Goal Alignment & KR Cascade</h2>
                <p className="text-xs text-[#64748b]">
                  Complete hierarchy linking objectives from top-level strategy to individual key results.
                </p>
              </div>

              <div className="space-y-4">
                {filtered.map((obj) => {
                  const krs = allStoreKRs.filter((k) => k.objectiveId === obj.id);

                  return (
                    <div
                      key={obj.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#2d8fd8]" />
                          <span
                            onClick={() => setSelectedObjForDetail(obj)}
                            className="font-bold text-slate-900 hover:text-[#2d8fd8] cursor-pointer"
                          >
                            {obj.title}
                          </span>
                        </div>
                        <ProgressBar progress={obj.progress || 0} className="w-36" showLabels />
                      </div>

                      <div className="pl-6 border-l-2 border-[#2d8fd8]/30 space-y-2">
                        {krs.map((kr) => (
                          <div
                            key={kr.id}
                            className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <span
                              onClick={() => setSelectedKRForDetail(kr)}
                              className="font-medium text-slate-800 hover:text-[#2d8fd8] cursor-pointer"
                            >
                              {kr.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] text-slate-500">
                                {kr.current}/{kr.target}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedKRForCheckIn(kr)}
                              >
                                Check-in
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          INTERACTIVE SLIDING DRAWERS (NEVER NAVIGATE AWAY FROM THE OKR LIST PAGE)
         ========================================================================= */}

      {/* S2. Create Objective Drawer (40% width, slides from right) */}
      <CreateObjectiveDrawer
        isOpen={isCreateObjectiveDrawerOpen}
        onClose={() => {
          setIsCreateObjectiveDrawerOpen(false);
          // clear query param if present
          if (searchParams.get('create')) {
            searchParams.delete('create');
            setSearchParams(searchParams);
          }
        }}
        departmentId={selectedDeptId}
        onCreated={(newId) => {
          refreshStore();
          // auto expand newly created objective
          setExpandedRows((prev) => ({ ...prev, [newId]: true }));
        }}
      />

      {/* S3. Add KPI (Key Result) Drawer */}
      <AddKpiDrawer
        isOpen={Boolean(targetObjectiveForKR)}
        onClose={() => setTargetObjectiveForKR(null)}
        objective={targetObjectiveForKR}
        onCreated={(newKRId) => {
          refreshStore();
          if (targetObjectiveForKR) {
            setExpandedRows((prev) => ({ ...prev, [targetObjectiveForKR.id]: true }));
          }
        }}
      />

      {/* S6. Check-in Drawer (75% width, slides from right) */}
      <CheckInDrawer
        isOpen={Boolean(selectedKRForCheckIn)}
        onClose={() => setSelectedKRForCheckIn(null)}
        keyResult={selectedKRForCheckIn}
        onSuccess={() => {
          refreshStore();
        }}
      />

      {/* S5. Key Result Detail Drawer (55% width) */}
      <KeyResultDetailDrawer
        isOpen={Boolean(selectedKRForDetail)}
        onClose={() => setSelectedKRForDetail(null)}
        keyResult={selectedKRForDetail}
      />

      {/* S2/S8. Objective Detail Drawer */}
      <ObjectiveDetailDrawer
        isOpen={Boolean(selectedObjForDetail)}
        onClose={() => setSelectedObjForDetail(null)}
        objective={selectedObjForDetail}
        onAddKpiRequested={() => {
          setTargetObjectiveForKR(selectedObjForDetail);
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelTargetId !== null}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel and Archive Objective?"
        message="This will archive the objective. Objectives can be created and managed separately."
        confirmLabel="Cancel Objective"
        isDestructive
      />
    </div>
  );
};
