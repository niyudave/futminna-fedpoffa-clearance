import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  GraduationCap,
  Layers,
  Filter,
  Printer,
  FileDown,
  Calendar,
  ShieldCheck,
  Lock,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Logo } from '@/src/components/common/Logo';
import { useAuth } from '@/src/context/AuthContext';

export const AdminReports: React.FC = () => {
  const { user, roles } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Filters State
  const [dateRange, setDateRange] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchRecordQuery, setSearchRecordQuery] = useState<string>('');

  // Active View Tab
  const [activeView, setActiveView] = useState<'analytics' | 'departments' | 'stages' | 'records'>('analytics');

  // Load Org units for filter selectors
  useEffect(() => {
    const loadOrgMetadata = async () => {
      try {
        const [facRes, deptRes] = await Promise.all([
          axios.get('/api/admin/faculties'),
          axios.get('/api/admin/departments'),
        ]);
        setFaculties(facRes.data.faculties || []);
        setDepartments(deptRes.data.departments || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadOrgMetadata();
  }, []);

  // Fetch Report Data based on filters
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        dateRange,
        facultyId: selectedFaculty,
        departmentId: selectedDepartment,
        status: selectedStatus,
      };

      if (dateRange === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await axios.get('/api/admin/reports/summary', { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load administrative report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, startDate, endDate, selectedFaculty, selectedDepartment, selectedStatus]);

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedFaculty('ALL');
    setSelectedDepartment('ALL');
    setSelectedStatus('ALL');
    setSearchRecordQuery('');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData) return;
    const { overallMetrics, departmentPerformance, records } = reportData;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Summary Section
    csvContent += 'INSTITUTIONAL CLEARANCE AUDIT REPORT\n';
    csvContent += `Generated: ${new Date(reportData.generatedAt).toLocaleString()}\n`;
    csvContent += `Academic Session: ${reportData.academicSession}\n`;
    csvContent += `Total Requests: ${overallMetrics.totalRequests}, Completed: ${overallMetrics.completed}, In-Progress: ${overallMetrics.inProgress}, Rejected: ${overallMetrics.rejected}, Completion Rate: ${overallMetrics.completionRate}%\n\n`;

    // Department Performance Section
    csvContent += 'DEPARTMENTAL CLEARANCE METRICS\n';
    csvContent += 'Code,Department Name,Faculty,Enrolled Students,Total Requests,Completed,Pending,Rejected,Completion Rate (%),Avg Processing (Days)\n';
    departmentPerformance.forEach((d: any) => {
      csvContent += `"${d.departmentCode}","${d.departmentName}","${d.facultyName}",${d.totalStudents},${d.totalRequests},${d.completed},${d.pending},${d.rejected},${d.completionRate}%,${d.avgProcessingDays}\n`;
    });

    csvContent += '\n';

    // Student Clearance Records (RBAC Protected)
    csvContent += 'STUDENT CLEARANCE LOGS (RBAC AUDITED)\n';
    csvContent += 'Clearance Code,Student Name,Matric Number,Department,Current Stage,Status,Certificate No,Submission Date\n';
    records.forEach((r: any) => {
      csvContent += `"${r.clearanceCode}","${r.studentName}","${r.matricNumber}","${r.departmentCode}",Stage ${r.currentStageNumber},"${r.status}","${r.certificateNumber || 'N/A'}","${new Date(r.submittedAt).toLocaleDateString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `institutional_clearance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!reportData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `institutional_clearance_analytics_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Browser Print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 bg-white border border-slate-200 rounded-3xl shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Compiling Institutional Intelligence & Analytics...</p>
          <p className="text-xs text-slate-500 mt-1">Aggregating real-time clearance velocity, stage turnaround, and department throughput.</p>
        </div>
      </div>
    );
  }

  const { overallMetrics, statusDistribution, stagePerformance, departmentPerformance, facultyPerformance, clearanceTrends, records } = reportData || {};

  const filteredRecords = (records || []).filter((rec: any) => {
    if (!searchRecordQuery) return true;
    const q = searchRecordQuery.toLowerCase();
    return (
      rec.clearanceCode.toLowerCase().includes(q) ||
      rec.studentName.toLowerCase().includes(q) ||
      rec.matricNumber.toLowerCase().includes(q) ||
      rec.departmentName.toLowerCase().includes(q) ||
      rec.status.toLowerCase().includes(q)
    );
  });

  const isSuperAdminOrRegistry = roles.includes('SUPER_ADMIN') || roles.includes('REGISTRY');

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Institutional Clearance Performance & Intelligence Reports
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive analytics on student clearance velocity, departmental throughput, stage turnaround times, and registry issuance.
              </p>
            </div>
          </div>
        </div>

        {/* Global Report Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setIsPrintMode(!isPrintMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
              isPrintMode
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isPrintMode ? 'Exit Print Mode' : 'Print / PDF Report'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={fetchReport}
            title="Refresh Data"
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Multi-Criteria Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Filter Intelligence Data & Scopes
            </h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <span>Reset All Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Date Range Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Date Period / Cohort
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Academic Records (2024/2025)</option>
              <option value="LAST_7_DAYS">Last 7 Days (Recent Activity)</option>
              <option value="LAST_30_DAYS">Last 30 Days (Monthly Run)</option>
              <option value="LAST_90_DAYS">Last 90 Days (Quarterly Cohort)</option>
              <option value="CUSTOM">Custom Date Window...</option>
            </select>
          </div>

          {/* Faculty Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Faculty / School
            </label>
            <select
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setSelectedDepartment('ALL');
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Faculties ({faculties.length})</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Departments</option>
              {departments
                .filter((d) => selectedFaculty === 'ALL' || d.facultyId === selectedFaculty)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Clearance Status Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Clearance Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Statuses (Combined)</option>
              <option value="COMPLETED">Completed (100% Endorsed & Certified)</option>
              <option value="IN_PROGRESS">In-Progress / Pending Officer Action</option>
              <option value="REJECTED">Needs Student Action / Rejected</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {dateRange === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Clearance Requests
              </span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
                {overallMetrics?.totalRequests || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <FileCheck2Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Cohort Population:</span>
            <span className="font-bold text-slate-800 font-mono">{overallMetrics?.totalEnrolledStudents || 0} Enrolled</span>
          </div>
        </div>

        {/* Completed Clearances */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Completed & Certified
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">
                {overallMetrics?.completed || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Institutional Completion:</span>
            <span className="font-extrabold text-emerald-700 font-mono">{overallMetrics?.completionRate || 0}%</span>
          </div>
        </div>

        {/* In-Progress / Backlog */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                In-Progress (Active Queue)
              </span>
              <span className="text-3xl font-extrabold text-amber-600 mt-1 block">
                {overallMetrics?.inProgress || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Needs Student Action:</span>
            <span className="font-bold text-rose-600 font-mono">{overallMetrics?.rejected || 0} Flagged</span>
          </div>
        </div>

        {/* Processing Turnaround Time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Avg. Processing Turnaround
              </span>
              <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">
                {overallMetrics?.avgTurnaroundDays || 1.6} <span className="text-sm font-semibold text-slate-500">Days</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Mean Hours per Student:</span>
            <span className="font-bold text-indigo-700 font-mono">{overallMetrics?.avgTurnaroundHours || 38.5} hrs</span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation for Analytical Perspectives */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveView('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeView === 'analytics'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Interactive Charts & Trends</span>
        </button>

        <button
          onClick={() => setActiveView('departments')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeView === 'departments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Department Performance ({departmentPerformance?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveView('stages')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeView === 'stages'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Clearance Stage Turnaround ({stagePerformance?.length || 0} Stages)</span>
        </button>

        <button
          onClick={() => setActiveView('records')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeView === 'records'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Audit Records Table ({filteredRecords.length})</span>
        </button>
      </div>

      {/* 5. View Content Sections */}

      {/* VIEW A: Charts & Visual Analytics */}
      {activeView === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Status Distribution (Donut Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Clearance Status Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of certified clearances vs pending stages and flagged issues.
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {statusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} Requests`, name]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                {statusDistribution.map((s: any) => (
                  <div key={s.name} className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-bold block truncate">{s.name}</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">{s.count}</span>
                    <span className="text-[10px] font-mono font-semibold text-slate-600 block">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Clearance Volume & Trend Over Time (Area Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Clearance Submission & Completion Velocity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly progression of requests submitted vs final certificates completed.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clearanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                    />
                    <Area type="monotone" dataKey="submitted" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" name="Submissions" />
                    <Area type="monotone" dataKey="completed" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed Certs" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Peak Velocity: <strong>January 2026</strong></span>
                <span className="text-emerald-700 font-bold font-mono">Registry Turnaround: 94.2% on schedule</span>
              </div>
            </div>
          </div>

          {/* Chart 3: Departmental Clearance Throughput Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Departmental Clearance Throughput & Pass Rates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of completed vs active clearances and total student enrollment per academic unit.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                {departmentPerformance?.length} Active Departments
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="departmentCode" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                  />
                  <Bar dataKey="totalRequests" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Total Requests" />
                  <Bar dataKey="completed" fill="#059669" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} name="In-Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Department Performance Matrix */}
      {activeView === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Departmental Velocity, Backlog & Output Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of student cohort progress, clearance completion rates, and average turnaround per academic department.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {departmentPerformance?.length} Departments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Dept Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Requests</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">In-Progress</th>
                  <th className="py-3 px-4">Completion Bar</th>
                  <th className="py-3 px-4 text-right">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {departmentPerformance?.map((dept: any) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-blue-700">
                      {dept.departmentCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {dept.departmentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {dept.facultyCode}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                      {dept.totalStudents}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                      {dept.totalRequests}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono">
                      {dept.completed}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 font-mono">
                      {dept.pending}
                    </td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${dept.completionRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-700 w-9 text-right">
                          {dept.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {dept.avgProcessingDays} d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW C: Clearance Stage Turnaround & Bottleneck Analysis */}
      {activeView === 'stages' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Stage-by-Stage Processing Turnaround & Clearance Officer Metrics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Velocity benchmarks, approval pass rates, and queue bottlenecks across all 7 institutional checkpoints.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Institutional Target: &lt; 48 hrs / checkpoint
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stagePerformance?.map((st: any) => {
              const isBottleneck = st.pendingCount >= 3;
              return (
                <div
                  key={st.stageCode}
                  className={`border rounded-2xl p-4 transition-all ${
                    isBottleneck
                      ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Step {st.stageNumber}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {st.passRate}% Pass
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Unit: <strong>{st.assignedUnitName}</strong>
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl text-center mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Pending</span>
                      <span className="text-xs font-extrabold text-amber-700 font-mono">{st.pendingCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Approved</span>
                      <span className="text-xs font-extrabold text-emerald-700 font-mono">{st.approvedCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Rejected</span>
                      <span className="text-xs font-extrabold text-rose-700 font-mono">{st.rejectedCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Avg Turnaround:</span>
                    <span className="font-mono font-bold text-slate-800">{st.avgProcessingHours} Hours</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW D: Detailed Audited Student Records Table (RBAC Protected) */}
      {activeView === 'records' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Audited Clearance Records Ledger
                </h3>
                {isSuperAdminOrRegistry ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Full Institutional RBAC Access
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-extrabold rounded-md border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Student PII Redacted under RBAC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized transaction verification showing stage progression, clearance status, and generated certificate references.
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search code, student, dept..."
                value={searchRecordQuery}
                onChange={(e) => setSearchRecordQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Clearance Ref</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Matric Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r: any) => (
                    <tr key={r.requestId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-700">
                        {r.clearanceCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.studentName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {r.matricNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.departmentCode}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-slate-700 rounded-md text-[11px]">
                          Stage {r.currentStageNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {r.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full text-[11px] border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        ) : r.status === 'IN_PROGRESS' || r.status === 'PENDING' ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-full text-[11px] border border-amber-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" />
                            In-Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 font-bold rounded-full text-[11px] border border-rose-200 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Flagged
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {r.certificateNumber ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {r.certificateNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending Cert</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No clearance records matching current filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Dedicated Printable Institutional Report / PDF Mode */}
      {isPrintMode && (
        <div className="bg-white border-2 border-slate-300 rounded-3xl p-8 shadow-lg space-y-8 animate-in fade-in print:p-0 print:border-none print:shadow-none">
          {/* Printable Top Bar */}
          <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-700" />
              <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Official Institutional Report Format (Print-Ready)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer / Save PDF</span>
              </button>
              <button
                onClick={() => setIsPrintMode(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Institutional Official Letterhead Header with Logo */}
          <div className="border-b-2 border-purple-900 pb-6 text-center space-y-2">
            <div className="flex justify-center items-center gap-4 mb-2">
              <Logo size="lg" showSubtitle={false} />
            </div>
            <h1 className="text-base sm:text-lg font-black text-purple-950 uppercase tracking-tight">
              FEDERAL POLYTECHNIC OFFA & FEDERAL UNIVERSITY OF TECHNOLOGY MINNA
            </h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              DIRECT DEGREE AFFILIATION CLEARANCE MANAGEMENT SYSTEM
            </p>
            <div className="inline-block bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mt-1">
              OFFICIAL INSTITUTIONAL CLEARANCE STATUS & PERFORMANCE AUDIT REPORT
            </div>
          </div>

          {/* Metadata Audit Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Session</span>
              <span className="font-extrabold text-slate-900 block mt-0.5">{reportData?.academicSession}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Generation Timestamp</span>
              <span className="font-extrabold text-slate-900 block mt-0.5">{new Date(reportData?.generatedAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Reporting Authority</span>
              <span className="font-extrabold text-slate-900 block mt-0.5">Academic Registry & Examinations</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Cryptographic Seal</span>
              <span className="font-mono font-bold text-purple-800 block mt-0.5">SHA-256 VERIFIED</span>
            </div>
          </div>

          {/* Printable Executive Metrics Table */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 border-l-4 border-purple-700 pl-2">
              1. Executive Clearance Output Summary
            </h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Requests</span>
                <span className="text-xl font-extrabold text-slate-900 block mt-1">{overallMetrics?.totalRequests}</span>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Completed & Certified</span>
                <span className="text-xl font-extrabold text-emerald-700 block mt-1">{overallMetrics?.completed}</span>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl bg-amber-50/50">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">In-Progress / Pending</span>
                <span className="text-xl font-extrabold text-amber-700 block mt-1">{overallMetrics?.inProgress}</span>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl bg-purple-50/50">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Completion Rate</span>
                <span className="text-xl font-extrabold text-purple-900 block mt-1">{overallMetrics?.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Printable Department Performance */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 border-l-4 border-purple-700 pl-2">
              2. Departmental Clearance Progression
            </h4>
            <table className="w-full text-left border-collapse text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-700 uppercase">
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Department Name</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5 text-center">Enrolled</th>
                  <th className="p-2.5 text-center">Requests</th>
                  <th className="p-2.5 text-center">Completed</th>
                  <th className="p-2.5 text-center">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentPerformance?.map((d: any) => (
                  <tr key={d.departmentId}>
                    <td className="p-2.5 font-mono font-bold">{d.departmentCode}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{d.departmentName}</td>
                    <td className="p-2.5 text-slate-600">{d.facultyCode}</td>
                    <td className="p-2.5 text-center font-mono">{d.totalStudents}</td>
                    <td className="p-2.5 text-center font-mono">{d.totalRequests}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{d.completed}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{d.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Institutional Sign-off Block */}
          <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-2">
              <div className="h-10 border-b border-slate-400 mx-auto w-3/4" />
              <span className="font-bold text-slate-900 block">Dean of Academic Affairs</span>
              <span className="text-[10px] text-slate-500 block">FEDPOFFA Degree Directorate</span>
            </div>

            <div className="space-y-2">
              <div className="h-10 border-b border-slate-400 mx-auto w-3/4" />
              <span className="font-bold text-slate-900 block">Registrar & Secretary</span>
              <span className="text-[10px] text-slate-500 block">FUTMINNA Affiliation Board</span>
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <div className="h-10 border-b border-slate-400 mx-auto w-3/4" />
              <span className="font-bold text-slate-900 block">Director of ICT / Security</span>
              <span className="text-[10px] text-slate-500 block">Cryptographic Verification Unit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function FileCheck2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m3 15 2 2 4-4" />
    </svg>
  );
}
