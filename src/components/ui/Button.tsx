import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4B0082] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    const variants = {
      primary:
        'bg-[#2E0854] text-white hover:bg-[#1E0538] active:bg-[#160029] shadow-xs',
      secondary:
        'bg-[#F3EAF8] text-[#2E0854] hover:bg-[#ebd9f4] active:bg-[#e2c7f0]',
      outline:
        'border border-[#DACBE8] bg-white text-[#2E0854] hover:border-[#6D28D9] shadow-2xs',
      ghost:
        'bg-transparent text-[#211F2C] hover:bg-[#F3EAF8] hover:text-[#2E0854]',
      danger:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs',
      success:
        'bg-[#16A34A] text-white hover:bg-[#15803D] active:bg-[#166534] shadow-xs',
    };

    // 2x horizontal padding rule
    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
      md: 'text-sm px-4 py-2 gap-2 min-h-[42px]',
      lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span className="whitespace-nowrap">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
