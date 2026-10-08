import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[#374151] flex items-center gap-1">
            {label}
            {required && <span className="text-[#ef4444] font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#94a3b8] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-10 rounded-lg border bg-white text-[#1e293b] text-sm placeholder-[#94a3b8] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] focus:border-[#2d8fd8] disabled:bg-[#f8fafc] disabled:text-[#94a3b8] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : 'pl-3.5'
            } ${rightIcon ? 'pr-9' : 'pr-3.5'} ${
              error
                ? 'border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]'
                : 'border-[#cbd5e1] hover:border-[#94a3b8]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#94a3b8] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs text-[#ef4444] font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[#64748b]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
