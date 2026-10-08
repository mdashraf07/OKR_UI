import React from 'react';
import { ProgressBar } from './ProgressBar';
import { ObjectiveLifecycleStatus } from '../../types';

export interface ObjectiveProgressDisplayProps {
  status: ObjectiveLifecycleStatus;
  progress?: number;
  expectedProgress?: number;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export const ObjectiveProgressDisplay: React.FC<ObjectiveProgressDisplayProps> = ({
  status,
  progress = 0,
  expectedProgress,
  showLabels = false,
  compact = false,
  className = '',
}) => {
  if (status === 'Draft') {
    if (compact) {
      return (
        <div className={`space-y-0.5 select-none ${className}`}>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Draft — Not Started
          </span>
          <span className="block text-[10px] text-slate-400">
            Progress available after activation
          </span>
        </div>
      );
    }

    return (
      <div className={`space-y-1 select-none ${className}`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          <span>Draft — Not Started</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Progress will be available after the objective is activated.
        </p>
      </div>
    );
  }

  return (
    <ProgressBar
      progress={progress}
      expectedProgress={expectedProgress}
      showLabels={showLabels}
      className={className}
    />
  );
};
