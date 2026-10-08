import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      options,
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-[#374151] flex items-center gap-1">
            {label}
            {required && <span className="text-[#ef4444] font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`w-full h-10 rounded-lg border bg-white text-[#1e293b] text-sm pl-3.5 pr-10 appearance-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] focus:border-[#2d8fd8] disabled:bg-[#f8fafc] disabled:text-[#94a3b8] disabled:cursor-not-allowed ${
              error
                ? 'border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]'
                : 'border-[#cbd5e1] hover:border-[#94a3b8]'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 text-[#94a3b8] pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
