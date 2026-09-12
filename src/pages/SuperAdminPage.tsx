import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/src/context/AuthContext';
import {
  Shield,
  Users,
  Building2,
  Layers,
  Lock,
  BarChart3,
  ShieldAlert,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AdminKPICards } from '@/src/components/admin/AdminKPICards';
import { AdminUserManagement } from '@/src/components/admin/AdminUserManagement';
import { AdminOrgManagement } from '@/src/components/admin/AdminOrgManagement';
import { AdminWorkflowConfig } from '@/src/components/admin/AdminWorkflowConfig';
import { AdminAuditLedger } from '@/src/components/admin/AdminAuditLedger';
import { AdminReports } from '@/src/components/admin/AdminReports';
import { AdminSecurityTest } from '@/src/components/admin/AdminSecurityTest';
import { Logo } from '@/src/components/common/Logo';

export const SuperAdminPage: React.FC = () => {
  const { user, roles, switchDemoAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'org' | 'workflow' | 'audit' | 'reports' | 'security'>('dashboard');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/dashboard-stats');
      setDashboardData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load administrative analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: Shield },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'org', label: 'Organization (Faculties/Depts)', icon: Building2 },
    { id: 'workflow', label: 'Workflow Engine', icon: Layers },
    { id: 'audit', label: 'Audit Ledger', icon: Lock },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security & Access Test', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Super Admin Identity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Logo size="md" showSubtitle={false} />
          <div className="hidden sm:block h-10 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Super Administrator Master Operations
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                  SUPER_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Affiliated Operator: <strong className="text-slate-800">{user?.firstName} {user?.lastName}</strong> ({user?.email})
              </p>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardStats}
            title="Refresh All Statistics"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => switchDemoAccount('admin.security@futminna-fedpoffa.edu.ng')}
            className="px-3 py-2 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors"
          >
            Reset Super Admin Session
          </button>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex overflow-x-auto gap-2 bg-[#F7F7F9] p-1.5 rounded-2xl border border-[#E5E7EB]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#4B0082] shadow-2xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#4B0082]' : 'text-[#6B7280]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* 1. KPI Cards */}
          <AdminKPICards
            summary={dashboardData?.summary || null}
            usersByRole={dashboardData?.usersByRole}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />

          {/* 2. Workflow Analytics & Stage Bottleneck Breakdown */}
          {dashboardData?.workflowStatistics && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    Clearance Workflow Progression & Stage Pass Rates
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time performance analytics across all {dashboardData.workflowStatistics.totalActiveStages} sequential checkpoints.
                  </p>
                </div>

                {dashboardData.workflowStatistics.bottleneckStage && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Longest Queue: <strong>{dashboardData.workflowStatistics.bottleneckStage.name}</strong> ({dashboardData.workflowStatistics.bottleneckStage.pendingCount} pending)
                    </span>
                  </div>
                )}
              </div>

              {/* Stages Performance Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Responsible Unit / Role</th>
                      <th className="py-3 px-4 text-center">Pending Queue</th>
                      <th className="py-3 px-4 text-center">Approved</th>
                      <th className="py-3 px-4 text-center">Rejected</th>
                      <th className="py-3 px-4 text-center">Pass Rate</th>
                      <th className="py-3 px-4 text-right">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {dashboardData.workflowStatistics.stageBreakdown?.map((stage: any) => (
                      <tr key={stage.stageNumber} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 flex items-center justify-center text-xs">
                              {stage.stageNumber}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">{stage.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 block">{stage.stageCode}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{stage.assignedUnitName}</span>
                          <span className="font-mono text-[10px] text-slate-400 block font-bold">{stage.requiredRoleName}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-700">
                          {stage.pendingCount}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {stage.approvedCount}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700">
                          {stage.rejectedCount}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold font-mono text-[11px]">
                            {stage.passRate}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-semibold">
                          ~{stage.avgTurnaroundHours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Live Chronological Recent Activity Stream */}
          {dashboardData?.recentActivities && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Institutional Activity Stream (Latest 15 Events)</h3>
                </div>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Full Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {dashboardData.recentActivities.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">{act.userName}</span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">
                          {act.role}
                        </span>
                        <span className="text-slate-600 block mt-0.5">
                          Executed <strong className="font-mono text-slate-800">{act.action}</strong> on {act.entityType} ({act.entityId})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">{act.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && <AdminUserManagement />}

      {/* ORGANIZATIONAL MANAGEMENT TAB */}
      {activeTab === 'org' && <AdminOrgManagement />}

      {/* WORKFLOW CONFIGURATION TAB */}
      {activeTab === 'workflow' && <AdminWorkflowConfig />}

      {/* AUDIT LEDGER TAB */}
      {activeTab === 'audit' && <AdminAuditLedger />}

      {/* ADMINISTRATIVE REPORTS TAB */}
      {activeTab === 'reports' && <AdminReports />}

      {/* SECURITY & UNAUTHORIZED REJECTION TEST TAB */}
      {activeTab === 'security' && <AdminSecurityTest />}
    </div>
  );
};
