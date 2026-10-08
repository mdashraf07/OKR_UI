import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSubtitle?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  textSubtitle = 'Gateway To Digital Brand',
  theme = 'light',
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', title: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', title: 'text-base', sub: 'text-[10px]' },
    lg: { img: 'w-11 h-11', title: 'text-lg', sub: 'text-[11px]' },
    xl: { img: 'w-14 h-14', title: 'text-xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Mosaic Logo Icon */}
      <div
        className={`flex-shrink-0 flex items-center justify-center rounded-xl transition-transform ${
          isDark
            ? 'bg-white/15 p-1 border border-white/25 shadow-sm'
            : 'bg-white p-0.5'
        }`}
      >
        <img
          src={isDark ? '/brandcrock-logo-transparent.png' : '/brandcrock-logo.png'}
          alt="BrandCrock Logo"
          className={`${currentSize.img} object-contain`}
          onError={(e) => {
            // fallback to original uploaded logo if needed
            (e.target as HTMLImageElement).src = '/brandcrock-logo.png';
          }}
        />
      </div>

      {/* Brand Text Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight ${currentSize.title} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              BrandCrock
            </span>
            {textSubtitle && textSubtitle.includes('India') && (
              <span className="text-[10px] font-semibold text-emerald-200 bg-white/15 px-1.5 py-0.5 rounded">
                India
              </span>
            )}
          </div>
          {textSubtitle && !textSubtitle.includes('India') && (
            <span
              className={`${currentSize.sub} font-medium tracking-wide ${
                isDark ? 'text-emerald-100/70' : 'text-slate-500'
              }`}
            >
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
