import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading system data...',
  subMessage,
  className,
  size = 'md',
}) => {
  const spinnerSizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center min-h-[180px]',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-[#4B0082] mb-3',
          spinnerSizes[size]
        )}
      />
      <p className="text-sm font-semibold text-[#1F2937]">{message}</p>
      {subMessage && (
        <p className="text-xs text-[#6B7280] mt-1 max-w-sm">{subMessage}</p>
      )}
    </div>
  );
};
