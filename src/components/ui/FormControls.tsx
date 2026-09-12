import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#1F2937] uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#6B7280] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1F2937] placeholder:text-[#6B7280]/60 transition-colors focus:border-[#4B0082] focus:outline-hidden focus:ring-2 focus:ring-[#4B0082]/15 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error &&
                'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-[#6B7280] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-[#DC2626] flex items-center gap-1">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-xs text-[#6B7280]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[#1F2937] uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1F2937] transition-colors focus:border-[#4B0082] focus:outline-hidden focus:ring-2 focus:ring-[#4B0082]/15 disabled:bg-gray-50 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
            className
          )}
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

        {error && <p className="text-xs font-medium text-[#DC2626]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={areaId}
            className="text-xs font-semibold text-[#1F2937] uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <textarea
          id={areaId}
          ref={ref}
          rows={4}
          className={cn(
            'w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1F2937] placeholder:text-[#6B7280]/60 transition-colors focus:border-[#4B0082] focus:outline-hidden focus:ring-2 focus:ring-[#4B0082]/15 disabled:bg-gray-50 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
            className
          )}
          {...props}
        />

        {error && <p className="text-xs font-medium text-[#DC2626]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
