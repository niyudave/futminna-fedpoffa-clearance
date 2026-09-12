import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileText,
  Upload,
  Bell,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface StudentOverviewStatsProps {
  request: any;
  stages: any[];
  notifications: any[];
  onSelectStage: (stage: any) => void;
  onOpenUpload: (stage: any) => void;
  onOpenNotifications: () => void;
  onInitiateClearance: () => void;
}

export const StudentOverviewStats: React.FC<StudentOverviewStatsProps> = ({
  request,
  stages,
  notifications,
  onSelectStage,
  onOpenUpload,
  onOpenNotifications,
  onInitiateClearance,
}) => {
  const isInitiated = request && request.status !== 'DRAFT';
  const approvedStagesCount = stages.filter((s) => s.status === 'APPROVED').length;
  const rejectedStages = stages.filter((s) => s.status === 'REJECTED');
  const currentStageNumber = request?.currentStageNumber || 1;
  const currentStage = stages.find((s) => s.stageNumber === currentStageNumber) || stages[0];

  const percentage = Math.round((approvedStagesCount / 7) * 100);

  // Derive pending actions
  const pendingActions: Array<{
    id: string;
    type: 'ACTION_REQUIRED' | 'SUBMISSION_PENDING' | 'UNDER_REVIEW' | 'INITIATE';
    title: string;
    description: string;
    stage?: any;
  }> = [];

  if (!isInitiated) {
    pendingActions.push({
      id: 'initiate_clearance',
      type: 'INITIATE',
      title: 'Initiate Final E-Clearance Workflow',
      description: 'Activate your 7-stage clearance with Department, Faculty, Library, Bursary, Hostel, ICT, and Registry.',
    });
  } else {
    // Check if any rejected stage needs resubmission
    rejectedStages.forEach((rej) => {
      pendingActions.push({
        id: `rej_${rej.id}`,
        type: 'ACTION_REQUIRED',
        title: `Resubmit Stage ${rej.stageNumber} (${rej.stageDefinition?.name || 'Clearance'})`,
        description: rej.remarks || 'Officer requested corrective documents or clarifications.',
        stage: rej,
      });
    });

    // Check if current stage needs documents uploaded
    if (currentStage && currentStage.status === 'NOT_STARTED') {
      pendingActions.push({
        id: `upload_${currentStage.id}`,
        type: 'SUBMISSION_PENDING',
        title: `Upload Proof for Stage ${currentStage.stageNumber} (${currentStage.stageDefinition?.name})`,
        description: 'Submit the required departmental or institutional receipts to proceed.',
        stage: currentStage,
      });
    } else if (currentStage && currentStage.status === 'PENDING') {
      pendingActions.push({
        id: `review_${currentStage.id}`,
        type: 'UNDER_REVIEW',
        title: `Stage ${currentStage.stageNumber} Pending Review`,
        description: `Currently being reviewed by ${currentStage.stageDefinition?.requiredRoleName || 'Clearance Officer'}.`,
        stage: currentStage,
      });
    }
  }

  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* 1. Clearance Percentage & Progress Card */}
      <div className="md:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Clearance Progression
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#F3EAF8] text-[#2E0854] border border-purple-200">
              <Sparkles className="w-3 h-3 text-[#6D28D9]" />
              {approvedStagesCount} of 7 Completed
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {/* Circular Percentage Dial */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#2E0854] transition-all duration-1000 ease-out"
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-[#1F2937] leading-none">
                  {percentage}%
                </span>
                <span className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-tighter">
                  Done
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1F2937]">
                {percentage === 100
                  ? 'All Checkpoints Cleared'
                  : isInitiated
                  ? `Stage ${currentStageNumber} of 7 in Progress`
                  : 'Clearance Not Yet Started'}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
                {percentage === 100
                  ? 'Digital certificate with cryptographic signature issued.'
                  : isInitiated
                  ? 'Sequential verification across academic departments and service units.'
                  : 'Click below to initiate your graduation clearance.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
          <div className="w-full bg-[#FAF7FC] h-2 rounded-full overflow-hidden border border-purple-100">
            <div
              className="bg-[#2E0854] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-semibold mt-1.5">
            <span>Stage 1 (Dept)</span>
            <span>Stage 4 (Bursary)</span>
            <span>Stage 7 (Registry)</span>
          </div>
        </div>
      </div>

      {/* 2. Current Stage Highlight Card */}
      <div className="md:col-span-4 bg-[#FBF4E7] rounded-2xl border border-[#EFD9AB] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E0854] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E0854] animate-ping" />
              Active Checkpoint
            </span>
            <span className="text-xs font-mono font-bold text-[#2E0854] bg-[#F3EAF8] px-2 py-0.5 rounded-md border border-purple-200">
              Stage {currentStage?.stageNumber || 1}
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-base font-bold text-[#1F2937]">
              {currentStage?.stageDefinition?.name || 'Departmental Clearance'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
              {currentStage?.stageDefinition?.description ||
                'Project submission, laboratory return, and HOD approval.'}
            </p>

            <div className="mt-3 p-2.5 bg-white rounded-xl border border-[#E5E7EB] text-xs">
              <div className="flex justify-between items-center text-[#1F2937]">
                <span className="font-medium text-[#6B7280]">Approving Authority:</span>
                <span className="font-bold text-[#2E0854]">
                  {currentStage?.stageDefinition?.requiredRoleName || 'HOD'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#1F2937] mt-1">
                <span className="font-medium text-[#6B7280]">Current Status:</span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    currentStage?.status === 'APPROVED'
                      ? 'text-[#2F6B4A]'
                      : currentStage?.status === 'REJECTED'
                      ? 'text-[#9B3A30]'
                      : currentStage?.status === 'PENDING'
                      ? 'text-[#B8842B]'
                      : 'text-[#2E0854]'
                  }`}
                >
                  {currentStage?.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-[#2F6B4A]" />}
                  {currentStage?.status === 'REJECTED' && <AlertTriangle className="w-3 h-3 text-[#9B3A30]" />}
                  {currentStage?.status === 'PENDING' && <Clock className="w-3 h-3 text-[#B8842B]" />}
                  {currentStage?.status || 'PENDING REVIEW'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2">
          {currentStage?.status === 'REJECTED' ? (
            <button
              onClick={() => onOpenUpload(currentStage)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#9B3A30] hover:bg-[#822c23] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Resubmit Corrective Proof</span>
            </button>
          ) : currentStage?.status === 'NOT_STARTED' ? (
            <button
              onClick={() => onOpenUpload(currentStage)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#2E0854] hover:bg-[#1E0538] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Stage Requirements</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectStage(currentStage)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#F7F7F9] text-[#2E0854] border border-[#E5E7EB] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2E0854]" />
              <span>View Checkpoint Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] ml-auto" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Pending Actions & Notifications Preview */}
      <div className="md:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              Pending Actions ({pendingActions.length})
            </span>
            <button
              onClick={onOpenNotifications}
              className="text-[11px] font-bold text-[#2E0854] hover:text-[#1E0538] flex items-center gap-0.5 cursor-pointer"
            >
              <span>Notifications</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {pendingActions.length > 0 ? (
              pendingActions.map((action) => (
                <div
                  key={action.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    action.type === 'ACTION_REQUIRED'
                      ? 'bg-rose-50/80 border-rose-200 text-[#9B3A30]'
                      : action.type === 'INITIATE'
                      ? 'bg-[#F3EAF8] border-purple-200 text-[#2E0854]'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{action.title}</span>
                      <p className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    {action.type === 'INITIATE' ? (
                      <button
                        onClick={onInitiateClearance}
                        className="shrink-0 px-2.5 py-1 bg-[#2E0854] text-white rounded-lg text-[10px] font-bold hover:bg-[#1E0538] cursor-pointer"
                      >
                        Start
                      </button>
                    ) : action.stage ? (
                      <button
                        onClick={() => onOpenUpload(action.stage)}
                        className="shrink-0 px-2.5 py-1 bg-[#1F2937] text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Action
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#E7F1EA] border border-[#C7E0CE] rounded-xl text-center">
                <CheckCircle2 className="w-5 h-5 text-[#2F6B4A] mx-auto" />
                <span className="text-xs font-bold text-[#2F6B4A] block mt-1">
                  All Current Actions Completed
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Awaiting reviewing officers for pending endorsements.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick notification snippet */}
        {recentNotifications.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <div className="flex items-center gap-1.5 truncate">
              <Bell className="w-3.5 h-3.5 text-[#2E0854] shrink-0" />
              <span className="truncate text-[11px]">
                {recentNotifications[0].title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#6B7280] shrink-0">
              {new Date(recentNotifications[0].createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
