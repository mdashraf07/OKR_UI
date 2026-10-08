import React from 'react';
import { Activity, GitCommit, AlertTriangle, RotateCcw } from 'lucide-react';
import { ObjectiveLifecycleStatus, ObjectiveHealth, ApprovalState, KRStatus } from '../../types';

// ============================================================================
// 1. OBJECTIVE LIFECYCLE STATUS (Filled Rounded Pill)
// ============================================================================

export interface ObjectiveStatusPillProps {
  status: ObjectiveLifecycleStatus;
  className?: string;
}

export const ObjectiveStatusPill: React.FC<ObjectiveStatusPillProps> = ({ status, className = '' }) => {
  const styles: Record<ObjectiveLifecycleStatus, { bg: string; text: string; label: string; tooltip: string }> = {
    Draft: {
      bg: 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold',
      text: 'text-slate-700',
      label: 'Draft — Not Started',
      tooltip: 'Draft objective — not yet activated for execution',
    },
    Active: {
      bg: 'bg-emerald-600 text-white shadow-sm',
      text: 'text-white',
      label: 'Active',
      tooltip: 'In progress',
    },
    Completed: {
      bg: 'bg-blue-600 text-white shadow-sm',
      text: 'text-white',
      label: 'Completed',
      tooltip: 'Finished cycle objectives',
    },
    Archived: {
      bg: 'bg-slate-700 text-slate-100',
      text: 'text-slate-100',
      label: 'Archived',
      tooltip: 'Cancelled or archived',
    },
  };

  const current = styles[status] || styles.Draft;

  return (
    <span
      title={current.tooltip}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold select-none ${current.bg} ${className}`}
    >
      {current.label}
    </span>
  );
};

// ============================================================================
// 2. OBJECTIVE HEALTH (Outlined Chip with Gauge/Activity Icon + "Health" Prefix)
// ============================================================================

export interface ObjectiveHealthChipProps {
  health?: ObjectiveHealth;
  className?: string;
}

export const ObjectiveHealthChip: React.FC<ObjectiveHealthChipProps> = ({ health, className = '' }) => {
  if (!health) return null;

  const styles: Record<ObjectiveHealth, { border: string; text: string; bg: string }> = {
    'On Track': {
      border: 'border-emerald-500',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/70',
    },
    'At Risk': {
      border: 'border-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50/70',
    },
    'In Trouble': {
      border: 'border-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50/70',
    },
  };

  const current = styles[health] || styles['On Track'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium select-none ${current.border} ${current.text} ${current.bg} ${className}`}
    >
      <Activity className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Health: {health}</span>
    </span>
  );
};

// ============================================================================
// 3. KEY RESULT STATUS (Outlined Chip with Coloured Dot - No Prefix)
// ============================================================================

export interface KRStatusChipProps {
  status: KRStatus;
  isDraft?: boolean;
  isDelayed?: boolean;
  isOverridden?: boolean;
  onResetOverride?: () => void;
  className?: string;
}

export const KRStatusChip: React.FC<KRStatusChipProps> = ({
  status,
  isDraft,
  isDelayed,
  isOverridden,
  onResetOverride,
  className = '',
}) => {
  if (isDraft) {
    return (
      <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium border-slate-300 text-slate-600 bg-slate-100">
          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          <span>Draft — Not Started</span>
        </span>
      </div>
    );
  }
  const styles: Record<KRStatus, { border: string; text: string; dot: string; bg: string }> = {
    'On Track': {
      border: 'border-emerald-300',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/50',
    },
    'At Risk': {
      border: 'border-amber-300',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/50',
    },
    'In Trouble': {
      border: 'border-red-300',
      text: 'text-red-700',
      dot: 'bg-red-500',
      bg: 'bg-red-50/50',
    },
    Completed: {
      border: 'border-blue-300',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      bg: 'bg-blue-50/50',
    },
  };

  const current = styles[status] || styles['On Track'];

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium ${current.border} ${current.text} ${current.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dot} flex-shrink-0`} />
        <span>{status}</span>
      </span>

      {isDelayed && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold">
          <AlertTriangle className="w-3 h-3" />
          Delayed
        </span>
      )}

      {isOverridden && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold">
          Overridden
          {onResetOverride && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetOverride();
              }}
              title="Reset to automatic pace status"
              className="hover:text-purple-900 ml-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// 4. APPROVAL STATE CHIP (Stepper Icon)
// ============================================================================

export interface ApprovalChipProps {
  state: ApprovalState;
  className?: string;
}

export const ApprovalChip: React.FC<ApprovalChipProps> = ({ state, className = '' }) => {
  const configs: Record<ApprovalState, { border: string; text: string; bg: string; label: string }> = {
    NotSubmitted: {
      border: 'border-slate-300',
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      label: 'Not submitted',
    },
    PendingManager: {
      border: 'border-amber-400',
      text: 'text-amber-800',
      bg: 'bg-amber-50',
      label: 'Pending Manager',
    },
    PendingHR: {
      border: 'border-blue-400',
      text: 'text-blue-800',
      bg: 'bg-blue-50',
      label: 'Pending HR/Admin',
    },
    Returned: {
      border: 'border-orange-400',
      text: 'text-orange-800',
      bg: 'bg-orange-50',
      label: 'Returned for changes',
    },
    Rejected: {
      border: 'border-rose-400',
      text: 'text-rose-800',
      bg: 'bg-rose-50',
      label: 'Rejected',
    },
    Approved: {
      border: 'border-emerald-400',
      text: 'text-emerald-800',
      bg: 'bg-emerald-50',
      label: 'Approved',
    },
  };

  const current = configs[state] || configs.NotSubmitted;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium select-none ${current.border} ${current.text} ${current.bg} ${className}`}
    >
      <GitCommit className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};
