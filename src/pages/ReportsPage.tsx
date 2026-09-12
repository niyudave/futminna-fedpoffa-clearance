import React from 'react';
import { AdminReports } from '@/src/components/admin/AdminReports';
import { useAuth } from '@/src/context/AuthContext';
import { BarChart3, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const { user, roles } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/clearance-dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Institutional Reporting & Clearance Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live intelligence dashboard and printable institutional performance reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg">
            Role: {roles[0] || 'AUTHORIZED_OFFICER'}
          </span>
        </div>
      </div>

      {/* Main Reporting Component */}
      <AdminReports />
    </div>
  );
};
