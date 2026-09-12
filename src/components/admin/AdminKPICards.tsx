import React from 'react';
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award,
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';

interface AdminKPICardsProps {
  summary: {
    totalStudents: number;
    totalUsers: number;
    activeUsers: number;
    totalClearances: number;
    pendingClearances: number;
    completedClearances: number;
    rejectedClearances: number;
    overallCompletionRate: number;
    totalFaculties: number;
    totalDepartments: number;
    totalClearanceUnits: number;
    totalCertificatesIssued: number;
  } | null;
  usersByRole?: Record<string, number>;
  onNavigateTab?: (tab: string) => void;
}

export const AdminKPICards: React.FC<AdminKPICardsProps> = ({ summary, usersByRole, onNavigateTab }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      id: 'kpi-students',
      label: 'Total Enrolled Students',
      value: summary.totalStudents,
      subtext: `${summary.totalClearances} clearance workflows initiated`,
      icon: GraduationCap,
      color: 'emerald',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Degree 400L',
      tab: 'users',
    },
    {
      id: 'kpi-users',
      label: 'Active Institutional Users',
      value: summary.activeUsers,
      subtext: `Across ${summary.totalFaculties} Faculties & ${summary.totalDepartments} Depts`,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: `${summary.totalUsers} Total Accounts`,
      tab: 'users',
    },
    {
      id: 'kpi-pending',
      label: 'Pending Clearances',
      value: summary.pendingClearances,
      subtext: 'Awaiting Officer Endorsement',
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Active Queue',
      tab: 'workflow',
    },
    {
      id: 'kpi-completed',
      label: 'Completed Clearances',
      value: summary.completedClearances,
      subtext: `${summary.totalCertificatesIssued} Official Registry Certificates Issued`,
      icon: CheckCircle2,
      color: 'teal',
      bgColor: 'bg-teal-50 text-teal-700 border-teal-200',
      badge: `${summary.overallCompletionRate}% Pass Rate`,
      tab: 'reports',
    },
    {
      id: 'kpi-rejected',
      label: 'Flagged / Rejected Stages',
      value: summary.rejectedClearances,
      subtext: 'Requires Student Rectification',
      icon: AlertTriangle,
      color: 'rose',
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
      badge: 'Attention Needed',
      tab: 'reports',
    },
    {
      id: 'kpi-units',
      label: 'Clearance Units & Checkpoints',
      value: summary.totalClearanceUnits,
      subtext: '7 Multi-Departmental Stations',
      icon: Layers,
      color: 'purple',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'Configured',
      tab: 'org',
    },
    {
      id: 'kpi-certs',
      label: 'QR Certificates Issued',
      value: summary.totalCertificatesIssued,
      subtext: 'Tamper-Evident & Registry Sealed',
      icon: Award,
      color: 'indigo',
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badge: '100% Verified',
      tab: 'reports',
    },
    {
      id: 'kpi-completion-rate',
      label: 'System Clearance Velocity',
      value: `${summary.overallCompletionRate}%`,
      subtext: 'Overall Institutional Progress',
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: '2024/2025 Session',
      tab: 'reports',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              onClick={() => onNavigateTab && onNavigateTab(kpi.tab)}
              className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl border ${kpi.bgColor} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {kpi.badge}
                </span>
              </div>

              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight block">
                  {kpi.value}
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">
                  {kpi.label}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Breakdown Distribution Strip */}
      {usersByRole && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Institutional User Breakdown by Role
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              9 System Security Roles Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div
                key={role}
                className="bg-white border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 block truncate" title={role}>
                  {role}
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
