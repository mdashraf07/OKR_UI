import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  const style: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-200/80 ${roundedClasses[rounded]} ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3">
      <Skeleton height={46} className="w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={52} className="w-full rounded-lg" />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <Skeleton width={160} height={20} />
        <Skeleton width={70} height={24} rounded="full" />
      </div>
      <Skeleton height={14} className="w-3/4" />
      <Skeleton height={8} className="w-full rounded-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={100} height={16} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
};
