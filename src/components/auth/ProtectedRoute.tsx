import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft, Home, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, roles, permissions, isAuthenticated, isLoading, hasRole, hasPermission, switchDemoAccount } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Verifying institutional credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-3 bg-rose-50 rounded-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">403 Forbidden — Authorization Required</h2>
            <p className="text-xs text-rose-600 font-medium">Backend & Frontend RBAC Enforcement Active</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Your current active identity (<span className="font-semibold text-slate-900">{roles.join(', ') || 'No Role'}</span>) does not have the required institutional clearance privilege to access this module.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Target Resource:</span>
            <span className="font-mono text-slate-800">{location.pathname}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Required Role(s):</span>
            <span className="font-mono text-emerald-700 font-semibold">{allowedRoles.join(' OR ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Your Current Roles:</span>
            <span className="font-mono text-rose-600 font-semibold">{roles.join(', ') || 'NONE'}</span>
          </div>
        </div>

        {/* Navigation escape actions */}
        <div className="flex items-center gap-3 mb-6 pt-2 border-t border-slate-100">
          <Link
            to="/clearance-dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#4B0082] text-white rounded-lg hover:bg-[#3B0068] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Clearance Portal
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Quick Switch to Authorized Role for Demonstration:</p>
          <div className="flex flex-wrap gap-2">
            {allowedRoles.includes('STUDENT') && (
              <button
                onClick={() => switchDemoAccount('student.test@futminna-fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Switch to Student
              </button>
            )}
            {allowedRoles.includes('HOD') && (
              <button
                onClick={() => switchDemoAccount('hod.csc@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Switch to HOD (Computer Science)
              </button>
            )}
            {allowedRoles.includes('DEAN') && (
              <button
                onClick={() => switchDemoAccount('dean.fast@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Switch to Dean (FAST)
              </button>
            )}
            {allowedRoles.includes('LIBRARIAN') && (
              <button
                onClick={() => switchDemoAccount('library.officer@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Switch to University Librarian
              </button>
            )}
            {allowedRoles.includes('BURSAR') && (
              <button
                onClick={() => switchDemoAccount('bursar.clearance@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Switch to Bursar
              </button>
            )}
            {allowedRoles.includes('STUDENT_AFFAIRS') && (
              <button
                onClick={() => switchDemoAccount('studentaffairs@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                Switch to Student Affairs Officer
              </button>
            )}
            {allowedRoles.includes('ICT_DIRECTOR') && (
              <button
                onClick={() => switchDemoAccount('ict.director@fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                Switch to ICT Director
              </button>
            )}
            {allowedRoles.includes('REGISTRY') && (
              <button
                onClick={() => switchDemoAccount('registry.clearance@futminna.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              >
                Switch to Academic Registry
              </button>
            )}
            {allowedRoles.includes('SUPER_ADMIN') && (
              <button
                onClick={() => switchDemoAccount('admin.security@futminna-fedpoffa.edu.ng')}
                className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Switch to Super Administrator
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check granular permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-amber-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 text-amber-600 mb-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Permission Denied</h2>
            <p className="text-xs text-amber-600 font-medium">Granular Capability Missing</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Your account does not possess the specific permission token <code className="px-2 py-0.5 bg-slate-100 rounded text-rose-600 font-mono text-xs">{requiredPermission}</code>.
        </p>
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <Link
            to="/clearance-dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#4B0082] text-white rounded-lg hover:bg-[#3B0068] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Clearance Portal
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
