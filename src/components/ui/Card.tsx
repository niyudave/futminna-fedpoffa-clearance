import React, { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E4E1EC] shadow-xs overflow-hidden transition-all duration-150',
        hoverEffect && 'hover:border-[#6D28D9] hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 border-b border-[#E5E7EB] flex flex-col gap-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-[#1F2937] tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn('text-sm text-[#6B7280] leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 border-t border-[#E5E7EB] bg-[#FAF7FC]/60 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
