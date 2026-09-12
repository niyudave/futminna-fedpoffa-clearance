import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  FileCheck2,
  User,
  Bell,
  Sparkles,
  RefreshCw,
  Award,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { StudentHeader } from './StudentHeader';
import { StudentOverviewStats } from './StudentOverviewStats';
import { ClearanceTimeline } from './ClearanceTimeline';
import { DocumentSubmissionModal } from './DocumentSubmissionModal';
import { StudentProfileSection } from './StudentProfileSection';
import { StudentScenarioSwitcher } from './StudentScenarioSwitcher';
import { DigitalClearanceCertificate } from '@/src/components/certificate/DigitalClearanceCertificate';
import { useNotifications } from '@/src/context/NotificationContext';

interface StudentClearanceViewProps {
  initialData?: any;
  onRefreshParent?: () => void;
}

export const StudentClearanceView: React.FC<StudentClearanceViewProps> = ({
  initialData,
  onRefreshParent,
}) => {
  const { unreadCount, openNotificationCentre } = useNotifications();
  const [data, setData] = useState<any>(initialData || null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'PROFILE' | 'CERTIFICATE'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStageForModal, setSelectedStageForModal] = useState<any>(null);
  const [isResubmissionMode, setIsResubmissionMode] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);

  const fetchStudentData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get('/api/clearance/my-clearance');
      setData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load student clearance profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchStudentData();
    } else {
      setData(initialData);
    }
  }, [initialData]);

  // Initiate Clearance Handler
  const handleInitiateClearance = async () => {
    setIsInitiating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/clearance/initiate');
      setSuccessMsg('7-Stage clearance workflow successfully initiated!');
      await fetchStudentData();
      if (onRefreshParent) onRefreshParent();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to initiate clearance.');
    } finally {
      setIsInitiating(false);
    }
  };

  // Document Submit / Resubmit Handler
  const handleDocumentSubmit = async (stageNumber: number, documents: any[]) => {
    setIsSubmittingDoc(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/clearance/submit-stage-documents', {
        stageNumber,
        documents,
      });

      setSuccessMsg(
        isResubmissionMode
          ? `Corrective proof for Stage ${stageNumber} resubmitted successfully for officer review.`
          : `Proof for Stage ${stageNumber} submitted successfully.`
      );
      await fetchStudentData();
      if (onRefreshParent) onRefreshParent();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit documents.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Mark single notification read
  const handleMarkNotifRead = async (id: string) => {
    try {
      await axios.post(`/api/clearance/student/notifications/${id}/read`);
      await fetchStudentData();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      await axios.post('/api/clearance/student/notifications/read-all');
      await fetchStudentData();
    } catch (err) {
      console.error(err);
    }
  };

  const openUploadModal = (stage: any) => {
    setSelectedStageForModal(stage);
    setIsResubmissionMode(false);
    setIsUploadModalOpen(true);
  };

  const openResubmitModal = (stage: any) => {
    setSelectedStageForModal(stage);
    setIsResubmissionMode(true);
    setIsUploadModalOpen(true);
  };

  const unreadNotifsCount = data?.notifications?.filter((n: any) => !n.isRead)?.length || 0;

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800">
          Loading Official Student Clearance Profile...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Verifying credentials with FUTMINNA-FEDPOFFA Registry
        </p>
      </div>
    );
  }

  const student = data?.student;
  const request = data?.request;
  const stages = data?.stages || [];
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-rose-700 hover:text-rose-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Official Institutional Header with Logo & Student Summary */}
      <StudentHeader
        student={student}
        request={request}
        unreadNotifsCount={unreadCount}
        onOpenNotifications={openNotificationCentre}
        onInitiateClearance={handleInitiateClearance}
        isInitiating={isInitiating}
      />

      {/* 2. Navigation Tabs for Student Module */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'TIMELINE'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>7-Stage Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('CERTIFICATE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'CERTIFICATE'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Digital Certificate</span>
            {request?.status === 'COMPLETED' && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-mono font-black rounded-full">
                READY
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNotificationCentre}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <Bell className="w-3.5 h-3.5 text-purple-600" />
            <span>Notifications ({unreadCount})</span>
          </button>

          <button
            onClick={fetchStudentData}
            title="Refresh clearance status"
            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Main Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Certificate Ready Banner if 100% Completed */}
          {request?.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-base sm:text-lg font-black text-emerald-950">
                      🎉 Clearance 100% Completed & Approved!
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold rounded-full">
                      CERTIFIED
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    All seven (7) institutional clearance checkpoints have been verified by their respective officers. Your official graduation certificate is ready for download and physical print.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('CERTIFICATE')}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>View / Print Certificate</span>
              </button>
            </div>
          )}

          {/* Key Metrics: Percentage, Active Stage, Pending Actions */}
          <StudentOverviewStats
            request={request}
            stages={stages}
            notifications={notifications}
            onSelectStage={(stg) => {
              setActiveTab('TIMELINE');
            }}
            onOpenUpload={openUploadModal}
            onOpenNotifications={openNotificationCentre}
            onInitiateClearance={handleInitiateClearance}
          />

          {/* Embedded 7-Stage Workflow Visual Timeline */}
          <ClearanceTimeline
            stages={stages}
            currentStageNumber={request?.currentStageNumber || 1}
            onOpenUpload={openUploadModal}
            onOpenResubmit={openResubmitModal}
          />
        </div>
      )}

      {activeTab === 'TIMELINE' && (
        <ClearanceTimeline
          stages={stages}
          currentStageNumber={request?.currentStageNumber || 1}
          onOpenUpload={openUploadModal}
          onOpenResubmit={openResubmitModal}
        />
      )}

      {activeTab === 'PROFILE' && (
        <StudentProfileSection
          student={student}
          onProfileUpdated={fetchStudentData}
        />
      )}

      {activeTab === 'CERTIFICATE' && (
        <div className="space-y-6">
          {request?.status === 'COMPLETED' || data?.certificate ? (
            <DigitalClearanceCertificate
              certificate={data.certificate}
              student={student}
              request={request}
              stages={stages}
            />
          ) : (
            <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Digital Certificate Unavailable (Clearance in Progress)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  According to statutory direct degree regulations, an institutional clearance certificate is only generated when <strong>every required stage (all 7 units)</strong> has received official approval.
                </p>
              </div>

              {/* Checklist progress preview */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2 font-mono">
                <div className="text-[11px] font-sans font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
                  Current Checkpoint Status:
                </div>
                {stages.map((stg: any) => (
                  <div key={stg.stageNumber} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-700">Stage {stg.stageNumber}: {stg.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {stg.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('TIMELINE')}
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Go to 7-Stage Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. State Testing & Defense Demo Toolbar */}
      <StudentScenarioSwitcher onScenarioApplied={fetchStudentData} />

      {/* 5. Document Upload & Resubmit Modal */}
      <DocumentSubmissionModal
        stage={selectedStageForModal}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleDocumentSubmit}
        isSubmitting={isSubmittingDoc}
        isResubmission={isResubmissionMode}
      />
    </div>
  );
};
