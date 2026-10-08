import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      icon,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isBusy = isLoading || loading;
    const prefixIcon = leftIcon || icon;

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
    };

    const variantClasses = {
      primary: 'bg-[#2d8fd8] hover:bg-[#1e88e5] active:bg-[#1565c0] text-white shadow-sm hover:shadow',
      secondary: 'bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] hover:border-[#94a3b8]',
      outline: 'bg-transparent hover:bg-[#f1f5f9] text-[#2d8fd8] border border-[#2d8fd8]',
      ghost: 'bg-transparent hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#1e293b]',
      danger: 'bg-[#ef4444] hover:bg-[#dc2626] active:bg-[#b91c1c] text-white shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isBusy}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#2d8fd8] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          prefixIcon && <span className="flex-shrink-0">{prefixIcon}</span>
        )}
        <span>{children}</span>
        {!isBusy && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
