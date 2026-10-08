import React from 'react';

export interface ProgressBarProps {
  progress: number;           // 0 to 100
  expectedProgress?: number;   // 0 to 100 (time pace marker)
  height?: number;             // height in px, default 8
  showLabels?: boolean;
  color?: string;              // default '#2d8fd8'
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  expectedProgress,
  height = 8,
  showLabels = false,
  color = '#2d8fd8',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const clampedExpected =
    expectedProgress !== undefined ? Math.min(100, Math.max(0, expectedProgress)) : undefined;

  // Determine bar fill color based on gap if expected is provided
  let barColor = color;
  if (clampedExpected !== undefined) {
    const gap = clampedProgress - clampedExpected;
    if (clampedProgress >= 100) barColor = '#16a34a'; // green
    else if (gap >= -10) barColor = '#16a34a'; // green
    else if (gap >= -25) barColor = '#f59e0b'; // amber
    else barColor = '#ef4444'; // red
  }

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs text-[#64748b]">
          <span className="font-semibold text-[#1e293b]">{clampedProgress}%</span>
          {clampedExpected !== undefined && (
            <span title="Expected pace as of today">Pace: {clampedExpected}%</span>
          )}
        </div>
      )}
      <div
        className="w-full bg-slate-100 rounded-full relative overflow-visible border border-slate-200/60"
        style={{ height: `${height}px` }}
      >
        {/* Actual Progress Fill */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: barColor,
          }}
        />

        {/* Expected Progress Marker (Vertical Tick) */}
        {clampedExpected !== undefined && (
          <div
            title={`Expected pace today: ${clampedExpected}%`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 bg-slate-700 rounded-full shadow-sm z-10 pointer-events-auto"
            style={{
              left: `${clampedExpected}%`,
              height: `${height + 6}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};
