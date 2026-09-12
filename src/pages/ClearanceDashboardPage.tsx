import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/src/context/AuthContext';
import {
  GraduationCap,
  Building2,
  BookOpen,
  CreditCard,
  Home,
  Laptop,
  FileCheck,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  QrCode,
  FileText,
  AlertCircle,
  RefreshCw,
  Stamp,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { StudentClearanceView } from '@/src/components/student/StudentClearanceView';
import { OfficerDashboardView } from '@/src/components/officer/OfficerDashboardView';

export const ClearanceDashboardPage: React.FC = () => {
  const { user, roles, permissions, hasRole, switchDemoAccount } = useAuth();

  const isStudent = roles.includes('STUDENT');
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isOfficer = roles.some((r) =>
    ['HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY'].includes(r)
  );

  // Student State
  const [studentClearance, setStudentClearance] = useState<any>(null);
  const [selectedStageToUpload, setSelectedStageToUpload] = useState<any>(null);
  const [uploadDocName, setUploadDocName] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Officer State
  const [officerQueue, setOfficerQueue] = useState<any[]>([]);
  const [assignedStages, setAssignedStages] = useState<number[]>([]);
  const [selectedStageToReview, setSelectedStageToReview] = useState<any>(null);
  const [endorseRemarks, setEndorseRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Admin State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminSettings, setAdminSettings] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      if (isStudent) {
        const res = await axios.get('/api/clearance/my-clearance');
        setStudentClearance(res.data);
      } else if (isOfficer) {
        const res = await axios.get('/api/clearance/officer/queue');
        setOfficerQueue(res.data.stages || []);
        setAssignedStages(res.data.assignedStageNumbers || []);
      }

      if (isSuperAdmin) {
        const [usersRes, settingsRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/system-settings'),
        ]);
        setUsersList(usersRes.data.users || []);
        setAdminSettings(settingsRes.data.settings || []);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to load clearance records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roles]);

  // Handle Student Document Upload
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageToUpload || !uploadDocName) return;

    setIsSubmittingDoc(true);
    setActionError('');
    try {
      await axios.post('/api/clearance/submit-stage-documents', {
        stageNumber: selectedStageToUpload.stageNumber,
        documents: [
          {
            name: uploadDocName,
            verified: true,
            uploadedAt: new Date().toISOString(),
          },
        ],
      });
      setActionSuccess(`Documents for Stage ${selectedStageToUpload.stageNumber} uploaded successfully.`);
      setSelectedStageToUpload(null);
      setUploadDocName('');
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Document submission failed.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Handle Officer Endorse
  const handleOfficerEndorse = async (stage: any) => {
    setIsProcessingAction(true);
    setActionError('');
    try {
      await axios.post('/api/clearance/officer/endorse', {
        stageProgressId: stage.id,
        stageNumber: stage.stageNumber,
        remarks: endorseRemarks || `Approved and digitally stamped under institutional clearance mandate.`,
      });
      setActionSuccess(`Stage ${stage.stageNumber} successfully approved with digital signature.`);
      setSelectedStageToReview(null);
      setEndorseRemarks('');
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to approve clearance stage.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Officer Reject
  const handleOfficerReject = async (stage: any) => {
    if (!rejectRemarks || rejectRemarks.trim().length < 5) {
      setActionError('Specific remarks explaining the rejection reason are required.');
      return;
    }

    setIsProcessingAction(true);
    setActionError('');
    try {
      await axios.post('/api/clearance/officer/reject', {
        stageProgressId: stage.id,
        stageNumber: stage.stageNumber,
        remarks: rejectRemarks,
      });
      setActionSuccess(`Stage ${stage.stageNumber} has been rejected with corrective instructions.`);
      setSelectedStageToReview(null);
      setRejectRemarks('');
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to reject clearance stage.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading personalized clearance workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Active Role Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            {isStudent ? <GraduationCap className="w-6 h-6" /> : isSuperAdmin ? <Shield className="w-6 h-6" /> : <Stamp className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                {isStudent
                  ? 'Student E-Clearance Portal'
                  : isSuperAdmin
                  ? 'Super Administrator Clearance Operations'
                  : 'Clearance Endorsement & Review Queue'}
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                {roles.join(', ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as <strong className="text-slate-800">{user?.firstName} {user?.lastName}</strong> ({user?.email})
            </p>
          </div>
        </div>

        {/* Quick Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Switch:</span>
          <button
            onClick={() => switchDemoAccount('student.test@futminna-fedpoffa.edu.ng')}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              roles.includes('STUDENT') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => switchDemoAccount('hod.csc@fedpoffa.edu.ng')}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              roles.includes('HOD') ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            HOD (Stage 1)
          </button>
          <button
            onClick={() => switchDemoAccount('bursar.clearance@fedpoffa.edu.ng')}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              roles.includes('BURSAR') ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Bursar (Stage 4)
          </button>
          <button
            onClick={() => switchDemoAccount('admin.security@futminna-fedpoffa.edu.ng')}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              roles.includes('SUPER_ADMIN') ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Super Admin
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: STUDENT VIEW (Phase 4 Experience)
         ========================================================================= */}
      {isStudent && (
        <StudentClearanceView
          initialData={studentClearance}
          onRefreshParent={loadData}
        />
      )}

      {/* =========================================================================
          VIEW 2: OFFICER VIEW (HOD, Dean, Bursar, Library, Hostel, ICT, Registry)
         ========================================================================= */}
      {isOfficer && !isStudent && (
        <OfficerDashboardView />
      )}

      {/* =========================================================================
          VIEW 3: SUPER ADMINISTRATOR VIEW
         ========================================================================= */}
      {isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">User Directory & Role Assignments</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 9 canonical users with assigned security roles and institutional permissions.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold">
                {usersList.length} Registered Accounts
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Assigned Role(s)</th>
                    <th className="p-3">Affiliation</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{u.email}</td>
                      <td className="p-3">
                        {u.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="inline-block font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded mr-1"
                          >
                            {r}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 text-slate-500">
                        {u.department ? u.department.name : u.faculty ? u.faculty.name : 'System-Wide'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
