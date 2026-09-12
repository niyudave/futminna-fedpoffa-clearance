import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/src/context/AuthContext';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Stamp,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  Calendar,
  Building,
  Check,
  Lock,
} from 'lucide-react';
import { OfficerReviewModal } from './OfficerReviewModal';
import { Logo } from '@/src/components/common/Logo';
import { StatusBadge } from '@/src/components/ui/StatusBadge';

export const OfficerDashboardView: React.FC = () => {
  const { user, roles, switchDemoAccount } = useAuth();

  // Queue Data & Filters
  const [queueStages, setQueueStages] = useState<any[]>([]);
  const [assignedStages, setAssignedStages] = useState<number[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    notStarted: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStageToReview, setSelectedStageToReview] = useState<any>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Security Test Suite
  const [securityTestResults, setSecurityTestResults] = useState<any[]>([]);
  const [isRunningSecurityTest, setIsRunningSecurityTest] = useState(false);
  const [securitySummary, setSecuritySummary] = useState('');

  // Load Queue Data
  const fetchQueue = async (page = 1) => {
    setIsRefreshing(true);
    setFeedbackError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        search: searchQuery,
        status: statusFilter,
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(`/api/clearance/officer/queue?${params.toString()}`);
      setQueueStages(res.data.stages || []);
      setAssignedStages(res.data.assignedStageNumbers || []);
      if (res.data.stats) setStats(res.data.stats);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err: any) {
      setFeedbackError(err.response?.data?.error || 'Failed to load officer queue.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue(1);
  }, [statusFilter, roles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchQueue(1), 50);
  };

  // Run automated multi-role RBAC security test
  const handleRunSecuritySuite = async () => {
    setIsRunningSecurityTest(true);
    setSecurityTestResults([]);
    setSecuritySummary('');
    try {
      const res = await axios.post('/api/clearance/officer/test-role-suite');
      setSecurityTestResults(res.data.results || []);
      setSecuritySummary(res.data.summary || 'Security validation completed.');
    } catch (err: any) {
      setFeedbackError(err.response?.data?.error || 'Security test execution failed.');
    } finally {
      setIsRunningSecurityTest(false);
    }
  };

  // Unit Title Mapping
  const getRoleDeskTitle = () => {
    if (roles.includes('SUPER_ADMIN')) return 'Central Institutional Clearance Command (All Stages)';
    if (roles.includes('HOD')) return 'Departmental Academic Board Clearance Desk (Stage 1)';
    if (roles.includes('DEAN')) return 'Faculty Academic Board Clearance Desk (Stage 2)';
    if (roles.includes('LIBRARIAN')) return 'University Library Clearance Desk (Stage 3)';
    if (roles.includes('BURSAR')) return 'Bursary Treasury Audit Desk (Stage 4)';
    if (roles.includes('STUDENT_AFFAIRS')) return 'Hostel & Student Affairs Clearance Desk (Stage 5)';
    if (roles.includes('ICT_DIRECTOR')) return 'ICT Portal & Bio-Data Directorate (Stage 6)';
    if (roles.includes('REGISTRY')) return 'Academic Registry & Certificate Issuance (Stage 7)';
    return 'Officer Clearance Desk';
  };

  return (
    <div className="space-y-6">
      
      {/* Officer Desk Header & Switcher */}
      <div className="bg-gradient-to-r from-[#380061] via-[#4B0082] to-[#6A1B9A] text-white rounded-2xl p-6 shadow-xl border border-purple-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-purple-800/60 gap-3">
          <Logo size="md" inverted={true} showSubtitle={false} />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F3EAF8]/20 text-[#F3EAF8] rounded-full border border-white/20 tracking-wide">
              OFFICER REVIEW DESK
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white rounded-full border border-white/15">
              Assigned Stages: [{assignedStages.join(', ') || 'N/A'}]
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
              <Shield className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {getRoleDeskTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5">
                Authenticated Officer: <span className="font-semibold text-white">{user ? `${user.firstName} ${user.lastName}` : user?.email}</span> ({user?.email})
              </p>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
            <span className="text-xs font-medium text-purple-200 pl-1">Switch Officer:</span>
            <button
              onClick={() => switchDemoAccount('hod')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                roles.includes('HOD') ? 'bg-white text-[#2E0854] shadow' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              1. HOD (Dept)
            </button>
            <button
              onClick={() => switchDemoAccount('dean')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                roles.includes('DEAN') ? 'bg-white text-[#2E0854] shadow' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              2. Dean (Faculty)
            </button>
            <button
              onClick={() => switchDemoAccount('bursar')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                roles.includes('BURSAR') ? 'bg-white text-[#2E0854] shadow' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              4. Bursar
            </button>
            <button
              onClick={() => switchDemoAccount('admin')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                roles.includes('SUPER_ADMIN') ? 'bg-white text-[#2E0854] shadow' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
            <span className="font-semibold">{feedbackSuccess}</span>
          </div>
          <button onClick={() => setFeedbackSuccess('')} className="text-xs text-emerald-700 underline cursor-pointer">Dismiss</button>
        </div>
      )}
      {feedbackError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-[#DC2626] text-sm flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
            <span className="font-semibold">{feedbackError}</span>
          </div>
          <button onClick={() => setFeedbackError('')} className="text-xs text-rose-700 underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="p-5 bg-white border border-amber-200 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1F2937]">{stats.pending}</div>
          <p className="text-xs text-amber-800/80 mt-1">Awaiting your unit's sign-off</p>
        </div>

        {/* Processed / Total Card */}
        <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total in Unit</span>
            <div className="w-8 h-8 rounded-lg bg-[#F3EAF8] text-[#4B0082] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1F2937]">{stats.total}</div>
          <p className="text-xs text-[#6B7280] mt-1">Matched clearance requests</p>
        </div>

        {/* Approved Card */}
        <div className="p-5 bg-white border border-emerald-200 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved & Stamped</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1F2937]">{stats.approved}</div>
          <p className="text-xs text-emerald-800/80 mt-1">Signed with SHA-256 seal</p>
        </div>

        {/* Rejected Card */}
        <div className="p-5 bg-white border border-rose-200 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Discrepancy / Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1F2937]">{stats.rejected}</div>
          <p className="text-xs text-rose-800/80 mt-1">Returned for correction</p>
        </div>
      </div>

      {/* Queue Controls: Search, Filter, Date, Refresh */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div className="inline-flex p-1 bg-[#EDE4CD]/60 border border-[#A9782F]/20 rounded-full shadow-2xs flex-wrap gap-0.5">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING', label: `Pending Review (${stats.pending})` },
              { id: 'APPROVED', label: `Approved (${stats.approved})` },
              { id: 'REJECTED', label: `Rejected (${stats.rejected})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchQueue(pagination.page)}
              disabled={isRefreshing}
              className="p-2 text-[#6B7280] hover:text-[#2E0854] hover:bg-[#F3EAF8] rounded-lg border border-[#E5E7EB] transition-colors flex items-center space-x-1.5 text-xs font-medium cursor-pointer"
              title="Refresh clearance queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search & Date Filter Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, matric number, request ID..."
              className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#2E0854] focus:border-[#2E0854] outline-hidden text-[#1F2937]"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 border border-[#E5E7EB] rounded-lg text-xs focus:ring-2 focus:ring-[#2E0854] outline-hidden text-[#1F2937]"
              title="From date"
            />
            <span className="text-xs text-[#6B7280]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 border border-[#E5E7EB] rounded-lg text-xs focus:ring-2 focus:ring-[#2E0854] outline-hidden text-[#1F2937]"
              title="To date"
            />
          </div>

          <div className="sm:col-span-2 flex space-x-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#2E0854] hover:bg-[#1E0538] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Filter
            </button>
            {(searchQuery || startDate || endDate || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-[#F7F7F9] hover:bg-slate-200 text-[#6B7280] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Clearance Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assigned Clearance Queue</h3>
            <p className="text-xs text-slate-500">Showing {queueStages.length} of {pagination.totalRecords} requests</p>
          </div>
          <span className="text-xs font-semibold text-[#2F6B4A] bg-[#E7F1EA] px-2.5 py-1 rounded-full border border-[#C7E0CE]">
            Unit RBAC Protected
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
            <p className="text-sm font-semibold">Loading authorized clearance queue...</p>
          </div>
        ) : queueStages.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">Clearance Queue Clear</p>
            <p className="text-xs text-slate-500 mt-1">No requests currently match your selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-[#FAFAFB] text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-[#E4D9BE]">
                <tr>
                  <th className="py-3.5 px-4">Student & Matric</th>
                  <th className="py-3.5 px-4">Department / Faculty</th>
                  <th className="py-3.5 px-4">Stage Checkpoint</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Evidence & Proofs</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4D9BE]">
                {queueStages.map((stage) => {
                  const student = stage.student;
                  const user = student?.user;
                  const dept = student?.department;
                  const faculty = student?.faculty;
                  const request = stage.clearanceRequest;

                  let docs: any[] = [];
                  if (stage.documents && Array.isArray(stage.documents) && stage.documents.length > 0) {
                    docs = stage.documents;
                  } else if (stage.submittedDocuments) {
                    try {
                      docs = typeof stage.submittedDocuments === 'string' ? JSON.parse(stage.submittedDocuments) : stage.submittedDocuments;
                    } catch {
                      docs = [];
                    }
                  }

                  return (
                    <tr key={stage.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {user ? `${user.firstName} ${user.lastName}` : 'Graduating Student'}
                            </p>
                            <p className="font-mono text-xs text-emerald-700 font-semibold mt-0.5">
                              {student?.matricNumber || '2020/1/89420CS'}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {request?.requestId || stage.clearanceRequestId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-900">{dept?.name || 'Computer Science'}</p>
                        <p className="text-xs text-slate-500">{faculty?.name || 'FAST'}</p>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3EAF8] text-[#2E0854] border border-purple-200 select-none whitespace-nowrap">
                          <span className="w-4 h-4 rounded-full bg-[#2E0854] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {stage.stageNumber}
                          </span>
                          <span>{stage.stageDefinition?.name || `Stage ${stage.stageNumber}`}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={stage.status} size="sm" className="rounded-full" />
                      </td>

                      <td className="py-4 px-4">
                        {docs.length > 0 ? (
                          <div className="flex items-center space-x-1 text-xs text-emerald-800 font-medium">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{docs.length} Document(s)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Standard Records</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(stage.updatedAt || stage.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedStageToReview(stage)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#2E0854] hover:bg-[#1E0538] rounded-lg shadow-2xs transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Stamp className="w-3.5 h-3.5" />
                          <span>Review & Decide</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Page <span className="font-bold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-800">{pagination.totalPages}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchQueue(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => fetchQueue(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Verification & RBAC Boundary Suite */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                Phase 5 Automated RBAC Boundary & Security Verification Suite
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Validates that each of the 7 clearance units can only process their designated stage, blocking cross-unit tampering.
            </p>
          </div>
          <button
            onClick={handleRunSecuritySuite}
            disabled={isRunningSecurityTest}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center space-x-2 self-start"
          >
            {isRunningSecurityTest ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Validating All 7 Roles...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Run RBAC Security Audit</span>
              </>
            )}
          </button>
        </div>

        {securitySummary && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{securitySummary}</span>
          </div>
        )}

        {securityTestResults.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Officer Role</th>
                  <th className="py-2.5 px-3">Unit Desk</th>
                  <th className="py-2.5 px-3">Designated Stage</th>
                  <th className="py-2.5 px-3">Assigned Stage Access</th>
                  <th className="py-2.5 px-3">Cross-Unit Tampering Blocked</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {securityTestResults.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.role}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.name}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">Stage {r.assignedStage}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                      {r.canAccessAssignedStage ? 'AUTHORIZED (200 OK)' : 'DENIED'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                      {r.crossRoleAccessBlocked ? 'STRICTLY FORBIDDEN (403)' : 'LEAK DETECTED'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedStageToReview && (
        <OfficerReviewModal
          stage={selectedStageToReview}
          onClose={() => setSelectedStageToReview(null)}
          onSuccess={(msg) => {
            setFeedbackSuccess(msg);
            fetchQueue(pagination.page);
          }}
          onError={(err) => setFeedbackError(err)}
        />
      )}

    </div>
  );
};
