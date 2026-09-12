import React from 'react';
import {
  GraduationCap,
  Building,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { Logo } from '@/src/components/common/Logo';

interface StudentHeaderProps {
  student: any;
  request: any;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onInitiateClearance: () => void;
  isInitiating: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  student,
  request,
  unreadNotifsCount,
  onOpenNotifications,
  onInitiateClearance,
  isInitiating,
}) => {
  const isInitiated = request && request.status !== 'DRAFT';
  const isCompleted = request?.status === 'COMPLETED';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
      {/* Top Banner with Official Logo */}
      <div className="bg-gradient-to-r from-[#380061] via-[#4B0082] to-[#6A1B9A] px-4 sm:px-6 py-4 sm:py-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs border border-white/20">
            <Logo size="md" inverted={true} showSubtitle={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#F3EAF8]/20 text-[#F3EAF8] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                Official Degree Affiliation
              </span>
              <span className="hidden sm:inline-block text-xs text-purple-100/90">
                • 2024/2025 Graduating Session
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
              Federal University of Technology Minna & FedPoly Offa
            </h1>
            <p className="text-xs text-purple-200">
              Student E-Clearance & Graduation Verification System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Notification Button */}
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Open Notification Centre"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-[#DC2626] rounded-full animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Quick Status / Initiate CTA */}
          {!isInitiated ? (
            <button
              onClick={onInitiateClearance}
              disabled={isInitiating}
              className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isInitiating ? 'Initiating...' : 'Initiate E-Clearance'}</span>
            </button>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A]/20 border border-[#16A34A]/40 rounded-xl text-emerald-200 text-xs font-bold">
              <Award className="w-4 h-4 text-emerald-300" />
              <span>Clearance Fully Certified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 border border-white/25 rounded-xl text-[#F3EAF8] text-xs font-bold">
              <Clock className="w-4 h-4 text-purple-200 animate-spin" />
              <span>Stage {request?.currentStageNumber || 1} Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Student Details Row */}
      <div className="px-4 sm:px-6 py-4 bg-[#F7F7F9] border-t border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Student Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3EAF8] text-[#4B0082] flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200">
            {student?.user?.firstName?.[0] || 'S'}
            {student?.user?.lastName?.[0] || 'T'}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Graduating Student
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#1F2937] truncate block">
              {student?.user?.firstName} {student?.user?.lastName}
            </span>
            <span className="text-[11px] text-[#6B7280] block truncate">
              {student?.user?.email}
            </span>
          </div>
        </div>

        {/* Matriculation & JAMB */}
        <div className="flex items-start gap-2.5">
          <GraduationCap className="w-5 h-5 text-[#4B0082] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Matriculation Number
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-[#4B0082] block">
              {student?.matricNumber || '2020/1/89420CS'}
            </span>
            <span className="text-[11px] text-[#6B7280] block">
              JAMB: {student?.jambRegNumber || '202029482012AF'}
            </span>
          </div>
        </div>

        {/* Department & Programme */}
        <div className="flex items-start gap-2.5">
          <BookOpen className="w-5 h-5 text-[#6A1B9A] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Department & Level
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#1F2937] block truncate">
              {student?.department?.name || 'Computer Science'}
            </span>
            <span className="text-[11px] text-[#6B7280] block">
              B.Tech Affiliated • 400 Level
            </span>
          </div>
        </div>

        {/* Faculty */}
        <div className="flex items-start gap-2.5">
          <Building className="w-5 h-5 text-[#16A34A] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Faculty / School
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#1F2937] block truncate">
              {student?.faculty?.name || 'Applied Sciences & Tech'}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
              Eligible for Clearance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
