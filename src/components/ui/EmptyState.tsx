import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message = 'There are currently no items or requests in this clearance queue.',
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#E5E7EB] bg-white min-h-[220px]',
        className
      )}
    >
      <div className="h-14 w-14 rounded-full bg-[#F3EAF8] flex items-center justify-center text-[#4B0082] mb-3.5 shadow-2xs">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h4 className="text-base font-semibold text-[#1F2937] tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 max-w-sm leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="primary"
            onClick={onAction}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
