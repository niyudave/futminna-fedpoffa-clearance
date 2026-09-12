import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRightCircle, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ClearanceStatus, StageStatus } from '@/src/types';

export interface StatusBadgeProps {
  status: ClearanceStatus | StageStatus | 'ACTIVE' | 'INACTIVE' | 'INFO';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// Small circular seal glyph for approved/completed status
const ApprovedSealIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="7" className="fill-[#2F6B4A] dark:fill-[#2F6B4A]" />
    <path
      d="M5 8.2L7.1 10.3L11 6.2"
      stroke="white"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'ACTIVE':
        return {
          label: status === 'ACTIVE' ? 'Active' : status === 'COMPLETED' ? 'Clearance Completed' : 'Approved',
          icon: status === 'ACTIVE' ? CheckCircle2 : ApprovedSealIcon,
          bgColor: 'bg-[#E7F1EA]',
          textColor: 'text-[#2F6B4A]',
          borderColor: 'border-[#C7E0CE]',
        };
      case 'PENDING':
      case 'SUBMITTED':
      case 'IN_PROGRESS':
        return {
          label: status === 'SUBMITTED' ? 'Submitted' : status === 'IN_PROGRESS' ? 'In Progress' : 'Pending Review',
          icon: Clock,
          bgColor: 'bg-[#FBF1DF]',
          textColor: 'text-[#B8842B]',
          borderColor: 'border-[#EFD9AB]',
        };
      case 'REJECTED':
      case 'INACTIVE':
        return {
          label: status === 'INACTIVE' ? 'Inactive' : 'Rejected / Attention Needed',
          icon: XCircle,
          bgColor: 'bg-[#FBEBE8]',
          textColor: 'text-[#9B3A30]',
          borderColor: 'border-[#EFC7BF]',
        };
      case 'NOT_STARTED':
      case 'DRAFT':
        return {
          label: status === 'DRAFT' ? 'Draft' : 'Awaiting Turn',
          icon: ArrowRightCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-300',
        };
      case 'INFO':
      default:
        return {
          label: 'Information',
          icon: Info,
          bgColor: 'bg-[#2563EB]/10',
          textColor: 'text-[#2563EB]',
          borderColor: 'border-[#2563EB]/30',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md border tracking-wide whitespace-nowrap select-none',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
