import React from 'react';

export interface ProgressRingProps {
  progress: number;          // 0 to 100
  expectedProgress?: number;  // 0 to 100
  size?: number;             // diameter in px, default 120
  strokeWidth?: number;      // default 10
  color?: string;            // default '#2d8fd8'
  label?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  expectedProgress,
  size = 120,
  strokeWidth = 10,
  color = '#2d8fd8',
  label = 'Progress',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const progressOffset = circumference - (clampedProgress / 100) * circumference;

  let ringColor = color;
  if (expectedProgress !== undefined) {
    const gap = clampedProgress - expectedProgress;
    if (clampedProgress >= 100) ringColor = '#16a34a';
    else if (gap >= -10) ringColor = '#16a34a';
    else if (gap >= -25) ringColor = '#f59e0b';
    else ringColor = '#ef4444';
  }

  // Expected progress angle in radians
  const expectedAngle =
    expectedProgress !== undefined
      ? ((expectedProgress / 100) * 360 - 90) * (Math.PI / 180)
      : undefined;

  const expectedMarkerX =
    expectedAngle !== undefined ? size / 2 + radius * Math.cos(expectedAngle) : 0;
  const expectedMarkerY =
    expectedAngle !== undefined ? size / 2 + radius * Math.sin(expectedAngle) : 0;

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Actual Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />

        {/* Expected Pace Marker Dot */}
        {expectedProgress !== undefined && (
          <circle
            cx={expectedMarkerX}
            cy={expectedMarkerY}
            r={strokeWidth / 1.6}
            fill="#334155"
            stroke="#ffffff"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Center percentage readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-[#1e293b] tracking-tight">
          {clampedProgress}%
        </span>
        {label && <span className="text-[11px] font-medium text-[#64748b]">{label}</span>}
      </div>
    </div>
  );
};
