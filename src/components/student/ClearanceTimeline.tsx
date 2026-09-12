import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  FileCheck2,
  Stamp,
  ShieldCheck,
  Calendar,
  FileText,
  User,
  ExternalLink,
  Info,
  RotateCcw,
} from 'lucide-react';

interface ClearanceTimelineProps {
  stages: any[];
  currentStageNumber: number;
  onOpenUpload: (stage: any) => void;
  onOpenResubmit: (stage: any) => void;
}

// Small circular seal glyph for approved/completed status matching StatusBadge
const ApprovedSealIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="7" fill="#2F6B4A" />
    <path
      d="M5 8.2L7.1 10.3L11 6.2"
      stroke="white"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClearanceTimeline: React.FC<ClearanceTimelineProps> = ({
  stages,
  currentStageNumber,
  onOpenUpload,
  onOpenResubmit,
}) => {
  const [expandedStageId, setExpandedStageId] = useState<string | null>(
    stages.find((s) => s.stageNumber === currentStageNumber)?.id || stages[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedStageId(expandedStageId === id ? null : id);
  };

  // Helper to determine stage visual style
  const getStageStyle = (stage: any) => {
    const isCurrent = stage.stageNumber === currentStageNumber && stage.status !== 'APPROVED';

    if (stage.status === 'APPROVED') {
      return {
        bg: 'bg-[#2F6B4A]',
        lightBg: 'bg-[#E7F1EA]',
        border: 'border-[#C7E0CE]',
        text: 'text-[#2F6B4A]',
        badgeBg: 'bg-[#E7F1EA] text-[#2F6B4A] border-[#C7E0CE]',
        icon: <ApprovedSealIcon className="w-5 h-5" />,
        statusLabel: 'Approved & Signed',
        statusColor: 'emerald',
      };
    }

    if (stage.status === 'REJECTED') {
      return {
        bg: 'bg-[#9B3A30]',
        lightBg: 'bg-[#FBEBE8]',
        border: 'border-[#EFC7BF]',
        text: 'text-[#9B3A30]',
        badgeBg: 'bg-[#FBEBE8] text-[#9B3A30] border-[#EFC7BF]',
        icon: <XCircle className="w-5 h-5 text-white" />,
        statusLabel: 'Action Required (Rejected)',
        statusColor: 'rose',
      };
    }

    if (stage.status === 'PENDING') {
      return {
        bg: 'bg-[#B8842B]',
        lightBg: 'bg-[#FBF1DF]',
        border: 'border-[#EFD9AB]',
        text: 'text-[#B8842B]',
        badgeBg: 'bg-[#FBF1DF] text-[#B8842B] border-[#EFD9AB]',
        icon: <Clock className="w-5 h-5 text-white" />,
        statusLabel: 'Pending Officer Review',
        statusColor: 'amber',
      };
    }

    if (isCurrent) {
      return {
        bg: 'bg-[#2E0854]',
        lightBg: 'bg-[#F3EAF8]',
        border: 'border-purple-300',
        text: 'text-[#2E0854]',
        badgeBg: 'bg-[#F3EAF8] text-[#2E0854] border-purple-300',
        icon: <Sparkles className="w-5 h-5 text-white" />,
        statusLabel: 'Current Active Stage',
        statusColor: 'purple',
      };
    }

    // Default: Locked / Not Started
    return {
      bg: 'bg-slate-300',
      lightBg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-500',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Lock className="w-4 h-4 text-slate-600" />,
      statusLabel: 'Awaiting Preceding Stages',
      statusColor: 'slate',
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-6 shadow-2xs">
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-[#E5E7EB] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#F3EAF8] text-[#2E0854]">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
              Sequential 7-Stage Clearance Workflow
            </h2>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Official graduation clearance pipeline audited under FUTMINNA-FEDPOFFA academic moderation guidelines.
          </p>
        </div>

        {/* Legend bar with explicit text labels & colors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E7F1EA] border border-[#C7E0CE] rounded-lg text-[#2F6B4A] font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2F6B4A]" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FBF1DF] border border-[#EFD9AB] rounded-lg text-[#B8842B] font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-[#B8842B]" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FBEBE8] border border-[#EFC7BF] rounded-lg text-[#9B3A30] font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9B3A30]" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3EAF8] border border-purple-200 rounded-lg text-[#2E0854] font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2E0854]" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[#6B7280] font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Locked</span>
          </div>
        </div>
      </div>

      {/* Interactive 7-Step Horizontal Stepper (Desktop & Tablet) */}
      <div className="hidden md:block py-6 overflow-x-auto">
        <div className="min-w-[680px] flex items-center justify-between relative px-4">
          {/* Connecting Line */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />

          {stages.map((stage, idx) => {
            const style = getStageStyle(stage);
            const isExpanded = expandedStageId === stage.id;
            const isCurrent = stage.stageNumber === currentStageNumber && stage.status !== 'APPROVED';

            return (
              <button
                key={stage.id}
                onClick={() => setExpandedStageId(stage.id)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all ${
                  isExpanded ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                {/* Circle Badge */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
                    style.bg
                  } ${
                    isCurrent ? 'ring-4 ring-purple-200 ring-offset-2' : ''
                  } ${isExpanded ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                >
                  {style.icon}
                </div>

                {/* Stage Label */}
                <div className="mt-2 text-center max-w-[90px]">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                    Stage {stage.stageNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {stage.stageDefinition?.name?.replace(' Clearance', '') || `Stage ${stage.stageNumber}`}
                  </span>
                  <span
                    className={`text-[9px] font-semibold block uppercase tracking-tighter mt-0.5 ${
                      stage.status === 'APPROVED'
                        ? 'text-[#2F6B4A]'
                        : stage.status === 'REJECTED'
                        ? 'text-[#9B3A30] font-bold'
                        : stage.status === 'PENDING'
                        ? 'text-[#B8842B]'
                        : isCurrent
                        ? 'text-[#2E0854] font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.status === 'APPROVED'
                      ? 'Approved'
                      : stage.status === 'REJECTED'
                      ? 'Action Req.'
                      : stage.status === 'PENDING'
                      ? 'Pending'
                      : isCurrent
                      ? 'Active'
                      : 'Locked'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7-Stage Detailed Card List */}
      <div className="mt-4 space-y-3">
        {stages.map((stage) => {
          const style = getStageStyle(stage);
          const isExpanded = expandedStageId === stage.id;
          const isCurrent = stage.stageNumber === currentStageNumber && stage.status !== 'APPROVED';
          const decision = stage.decision;
          const assignedOfficer = stage.assignedOfficer;

          let stageDocs: any[] = [];
          if (stage.documents && Array.isArray(stage.documents) && stage.documents.length > 0) {
            stageDocs = stage.documents;
          } else if (stage.submittedDocuments) {
            try {
              stageDocs = typeof stage.submittedDocuments === 'string' ? JSON.parse(stage.submittedDocuments) : stage.submittedDocuments;
            } catch (e) {
              stageDocs = [];
            }
          }

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isCurrent
                  ? 'border-purple-300 ring-2 ring-purple-100 shadow-sm bg-purple-50/30'
                  : stage.status === 'REJECTED'
                  ? 'border-rose-300 ring-2 ring-rose-100 shadow-sm bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              {/* Card Summary Header */}
              <div
                onClick={() => toggleExpand(stage.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${style.bg}`}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Stage {stage.stageNumber} of 7
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.badgeBg}`}
                      >
                        {style.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                      {stage.stageDefinition?.name || `Stage ${stage.stageNumber} Clearance`}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Authority: <strong className="text-slate-700">{stage.stageDefinition?.requiredRoleName}</strong></span>
                      {stage.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            Cleared {new Date(stage.completedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {stage.status === 'REJECTED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenResubmit(stage);
                      }}
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#9B3A30] hover:bg-[#822c23] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resubmit</span>
                    </button>
                  )}

                  {stage.status === 'NOT_STARTED' && isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUpload(stage);
                      }}
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#2E0854] hover:bg-[#1E0538] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Proof</span>
                    </button>
                  )}

                  <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Stage Inspection Panel */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  {/* Stage Scope Description */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-700 block">Checkpoint Mandate & Scope:</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      {stage.stageDefinition?.description}
                    </p>
                  </div>

                  {/* Officer Remarks / Rejection Notes */}
                  {stage.remarks && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs ${
                        stage.status === 'REJECTED'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : stage.status === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {stage.status === 'REJECTED' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        ) : stage.status === 'APPROVED' ? (
                          <Stamp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold block uppercase tracking-wider text-[10px]">
                            {stage.status === 'REJECTED'
                              ? 'Officer Rejection Remarks & Corrective Directive'
                              : 'Officer Endorsement Remarks'}
                          </span>
                          <p className="mt-1 font-medium leading-relaxed">{stage.remarks}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cryptographic Digital Signature & Timestamp Record */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Reviewing Officer & Digital Stamp */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assigned Clearance Officer
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {assignedOfficer
                              ? `${assignedOfficer.firstName} ${assignedOfficer.lastName}`
                              : `Office of the ${stage.stageDefinition?.requiredRoleName}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Role: {stage.stageDefinition?.requiredRoleName}
                          </span>
                        </div>
                      </div>

                      {decision?.digitalStamp && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            Digital Stamp
                          </span>
                          <code className="text-[10px] font-mono text-purple-900 bg-purple-50 px-1 py-0.5 rounded block mt-0.5 truncate">
                            {decision.digitalStamp}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Cryptographic Hash & Timestamps */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Audit Ledger Verification
                      </span>
                      <div className="space-y-1.5 mt-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-600">
                          <span>Initiated At:</span>
                          <span className="font-mono text-slate-900 font-medium">
                            {stage.initiatedAt
                              ? new Date(stage.initiatedAt).toLocaleString()
                              : 'Not yet started'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Endorsed At:</span>
                          <span className="font-mono text-slate-900 font-medium">
                            {stage.completedAt
                              ? new Date(stage.completedAt).toLocaleString()
                              : 'Awaiting signature'}
                          </span>
                        </div>
                      </div>

                      {decision?.signatureHash && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            SHA-256 Signature Hash
                          </span>
                          <code className="text-[9px] font-mono text-slate-600 bg-slate-50 px-1 py-0.5 rounded block mt-0.5 truncate" title={decision.signatureHash}>
                            {decision.signatureHash}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submitted Documents Section */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2E0854]" />
                        Stage Submissions & Document Proofs ({stageDocs.length})
                      </span>
                      {stage.status === 'REJECTED' ? (
                        <button
                          onClick={() => onOpenResubmit(stage)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#9B3A30] hover:text-[#822c23] bg-[#FBEBE8] px-2.5 py-1 rounded-lg border border-[#EFC7BF] cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resubmit Proofs</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenUpload(stage)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#2E0854] hover:text-[#1E0538] bg-[#F3EAF8] px-2.5 py-1 rounded-lg border border-purple-200 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload / Add File</span>
                        </button>
                      )}
                    </div>

                    {stageDocs.length > 0 ? (
                      <div className="divide-y divide-slate-100 mt-2">
                        {stageDocs.map((doc: any, docIdx: number) => {
                          const docName = doc.fileName || doc.name || `Document ${docIdx + 1}`;
                          const docStatus = doc.status || (doc.verified ? 'VERIFIED' : 'PENDING');
                          const isVerified = docStatus === 'VERIFIED';
                          const isRejected = docStatus === 'REJECTED';

                          return (
                            <div
                              key={doc.id || docIdx}
                              className="py-2 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCheck2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-medium text-slate-800 block truncate">
                                    {docName}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>
                                      Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recently'}
                                    </span>
                                    {doc.fileSizeBytes && (
                                      <span>• {(doc.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isRejected
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Review'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs py-3 text-center">
                        No documents submitted yet for this stage.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
