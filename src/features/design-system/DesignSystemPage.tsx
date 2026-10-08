import React, { useState } from 'react';
import {
  ObjectiveStatusPill,
  ObjectiveHealthChip,
  KRStatusChip,
  ApprovalChip,
} from '../../components/ui/Chips';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToastStore } from '../../components/ui/Toast';

export const DesignSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tokens');
  const [buttonLoading, setButtonLoading] = useState(false);
  const { showToast } = useToastStore();

  const colorTokens = [
    { name: '--color-header-from', hex: '#1a7260', sample: '#1a7260', usage: 'Header gradient start' },
    { name: '--color-header-mid', hex: '#237a6b', sample: '#237a6b', usage: 'Header gradient middle' },
    { name: '--color-header-to', hex: '#298979', sample: '#298979', usage: 'Header gradient end' },
    { name: '--color-sidebar-bg', hex: '#1b675a', sample: '#1b675a', usage: 'Sidebar rail background' },
    { name: '--color-sidebar-active', hex: '#1d7161', sample: '#1d7161', usage: 'Active sidebar icon pill' },
    { name: '--color-bg-app', hex: '#e7ecf2', sample: '#e7ecf2', usage: 'Application background' },
    { name: '--color-surface', hex: '#ffffff', sample: '#ffffff', usage: 'Card surfaces & modals' },
    { name: '--color-primary', hex: '#2d8fd8', sample: '#2d8fd8', usage: 'Primary buttons & active pills' },
    { name: '--color-stat-teal', hex: '#26a69a', sample: '#26a69a', usage: 'Teal KPI card / Avatar' },
    { name: '--color-stat-blue', hex: '#1e88e5', sample: '#1e88e5', usage: 'Blue KPI card' },
    { name: '--color-stat-purple', hex: '#7832df', sample: '#7832df', usage: 'Purple KPI card' },
    { name: '--color-stat-coral', hex: '#e17684', sample: '#e17684', usage: 'Coral/Penalty KPI card' },
    { name: '--color-success', hex: '#16a34a', sample: '#16a34a', usage: 'On Track / Approved' },
    { name: '--color-warning', hex: '#f59e0b', sample: '#f59e0b', usage: 'At Risk / Returned' },
    { name: '--color-danger', hex: '#ef4444', sample: '#ef4444', usage: 'In Trouble / Rejected / Delayed' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-[#0369a1]">
              Phase 0 & 1 Living Reference
            </span>
            <span className="text-xs text-slate-400">Captured from HRMS Video</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">HRMS Design System & Tokens</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Exact measured color hexes, typography scales, spacing tokens, and components in all states.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({ type: 'success', message: 'Design system tokens loaded' })}
          >
            Trigger Toast
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setButtonLoading(true);
              setTimeout(() => setButtonLoading(false), 1500);
            }}
            isLoading={buttonLoading}
          >
            Test Loading
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        variant="pill"
        tabs={[
          { id: 'tokens', label: 'Color & Spacing Tokens' },
          { id: 'chips', label: 'Status & Health Chips' },
          { id: 'components', label: 'UI Components' },
          { id: 'gauges', label: 'Progress Gauges' },
        ]}
      />

      {/* TAB 1: TOKENS */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          {/* Colors */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-[#1e293b] mb-4">Sampled Color Palette (Tokens)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {colorTokens.map((token) => (
                <div
                  key={token.name}
                  className="p-3 rounded-xl border border-slate-100 flex items-center gap-3 bg-slate-50/50"
                >
                  <div
                    className="w-10 h-10 rounded-lg shadow-sm border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: token.sample }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1e293b] truncate font-mono">
                      {token.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{token.hex}</div>
                    <div className="text-[10px] text-slate-400 truncate">{token.usage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Scale */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-[#1e293b] mb-4">Typography Hierarchy (Inter)</h2>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b pb-3">
                <span className="text-2xl font-bold text-[#1e293b]">Page Title (24px / Bold 700)</span>
                <span className="text-xs font-mono text-slate-400">Good Evening, Mohammed Ashraf</span>
              </div>
              <div className="flex items-baseline justify-between border-b pb-3">
                <span className="text-lg font-semibold text-[#1e293b]">Section Title (18px / Semi-bold 600)</span>
                <span className="text-xs font-mono text-slate-400">Attendance Information / OKR Dashboard</span>
              </div>
              <div className="flex items-baseline justify-between border-b pb-3">
                <span className="text-base font-semibold text-[#1e293b]">Card Title (16px / Semi-bold 600)</span>
                <span className="text-xs font-mono text-slate-400">Actions / Highlights / Objectives</span>
              </div>
              <div className="flex items-baseline justify-between border-b pb-3">
                <span className="text-sm font-normal text-[#1e293b]">Body Text (14px / Regular 400)</span>
                <span className="text-xs font-mono text-slate-400">Standard descriptive copy and data</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-[#64748b]">Table & Caption (12-13px / Medium 500)</span>
                <span className="text-xs font-mono text-slate-400">Column headers, pills, badges</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHIPS & STATUSES */}
      {activeTab === 'chips' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#1e293b]">Distinct Status Concepts (Section 4.1)</h2>
              <p className="text-xs text-[#64748b] mt-1">
                Objective Lifecycle (filled pill) vs Health (gauge chip) vs KR Status (dot chip) vs Approval State (stepper chip).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Objective Lifecycle Status */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  1. Objective Lifecycle Status (Filled Pill)
                </div>
                <div className="flex flex-wrap gap-2">
                  <ObjectiveStatusPill status="Draft" />
                  <ObjectiveStatusPill status="Active" />
                  <ObjectiveStatusPill status="Completed" />
                  <ObjectiveStatusPill status="Archived" />
                </div>
              </div>

              {/* Objective Health */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. Objective Health (Outlined Chip + Gauge)
                </div>
                <div className="flex flex-wrap gap-2">
                  <ObjectiveHealthChip health="On Track" />
                  <ObjectiveHealthChip health="At Risk" />
                  <ObjectiveHealthChip health="In Trouble" />
                </div>
              </div>

              {/* Key Result Status */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Key Result Status (Outlined + Coloured Dot)
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <KRStatusChip status="On Track" />
                  <KRStatusChip status="At Risk" />
                  <KRStatusChip status="In Trouble" />
                  <KRStatusChip status="Completed" />
                  <KRStatusChip status="At Risk" isDelayed />
                  <KRStatusChip status="On Track" isOverridden onResetOverride={() => {}} />
                </div>
              </div>

              {/* Approval State */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  4. Approval State (Stepper Chip)
                </div>
                <div className="flex flex-wrap gap-2">
                  <ApprovalChip state="NotSubmitted" />
                  <ApprovalChip state="PendingManager" />
                  <ApprovalChip state="PendingHR" />
                  <ApprovalChip state="Returned" />
                  <ApprovalChip state="Rejected" />
                  <ApprovalChip state="Approved" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UI COMPONENTS */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-[#1e293b]">Buttons & Forms</h2>

            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <Input label="Objective Title" placeholder="Enter objective title" required />
              <Input
                label="Target Amount"
                placeholder="5,00,000"
                error="For INCREASE the target must be higher than baseline."
              />
              <Select
                label="Level"
                options={[
                  { value: 'Individual', label: 'Individual' },
                  { value: 'Team', label: 'Team' },
                  { value: 'Department', label: 'Department' },
                  { value: 'Organization', label: 'Organization' },
                ]}
              />
            </div>
          </div>

          <EmptyState
            title="Empty State Showcase"
            description="Sample empty illustration from Frame 14 of the video."
            action={<Button size="sm">Create First Objective</Button>}
          />
        </div>
      )}

      {/* TAB 4: GAUGES */}
      {activeTab === 'gauges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Progress Ring with Expected Pace Marker</h3>
            <div className="flex gap-8 items-center">
              <ProgressRing progress={34.4} expectedProgress={43.96} size={130} strokeWidth={11} />
              <ProgressRing progress={85} expectedProgress={70} size={130} strokeWidth={11} />
              <ProgressRing progress={100} expectedProgress={90} size={130} strokeWidth={11} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1e293b]">Progress Bars with Pace Markers</h3>
            <div>
              <span className="text-xs text-slate-500 mb-1 block">At Risk (33.3% vs 43.9% pace)</span>
              <ProgressBar progress={33.33} expectedProgress={43.96} showLabels />
            </div>
            <div>
              <span className="text-xs text-slate-500 mb-1 block">On Track (36% vs 43.9% pace)</span>
              <ProgressBar progress={36.0} expectedProgress={43.96} showLabels />
            </div>
            <div>
              <span className="text-xs text-slate-500 mb-1 block">Completed (100%)</span>
              <ProgressBar progress={100} expectedProgress={43.96} showLabels />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
