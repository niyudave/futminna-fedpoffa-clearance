import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'System Operation Failed',
  message = 'An unexpected error occurred while communicating with the clearance server.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/5 min-h-[200px]',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] mb-3.5">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold text-[#1F2937] tracking-tight">{title}</h4>
      <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
