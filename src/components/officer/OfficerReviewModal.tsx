import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Shield,
  Stamp,
  User,
  AlertTriangle,
  ExternalLink,
  Building,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  Hash,
  Award,
} from 'lucide-react';

interface OfficerReviewModalProps {
  stage: any;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (err: string) => void;
}

export const OfficerReviewModal: React.FC<OfficerReviewModalProps> = ({
  stage,
  onClose,
  onSuccess,
  onError,
}) => {
  const [endorseRemarks, setEndorseRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [activeActionTab, setActiveActionTab] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState('');

  const student = stage.student;
  const user = student?.user;
  const dept = student?.department;
  const faculty = student?.faculty;
  const request = stage.clearanceRequest;

  // Parse documents
  let documents: Array<{ id?: string; name?: string; fileName?: string; verified?: boolean; status?: string; uploadedAt?: string | Date; fileSizeBytes?: number; fileType?: string }> = [];
  if (stage.documents && Array.isArray(stage.documents) && stage.documents.length > 0) {
    documents = stage.documents;
  } else if (stage.submittedDocuments) {
    try {
      documents = typeof stage.submittedDocuments === 'string'
        ? JSON.parse(stage.submittedDocuments)
        : stage.submittedDocuments;
    } catch {
      documents = [];
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    setValidationError('');
    try {
      const res = await axios.post('/api/clearance/officer/endorse', {
        stageProgressId: stage.id,
        stageNumber: stage.stageNumber,
        clearanceRequestId: stage.clearanceRequestId,
        remarks: endorseRemarks || `Approved and endorsed under ${stage.stageDefinition?.name || 'unit'} institutional guidelines.`,
      });
      onSuccess(res.data.message || `Stage ${stage.stageNumber} successfully approved.`);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to approve clearance stage.';
      setValidationError(msg);
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks || rejectRemarks.trim().length < 6) {
      setValidationError('Please provide a specific corrective reason for rejection (minimum 6 characters).');
      return;
    }

    setIsProcessing(true);
    setValidationError('');
    try {
      const res = await axios.post('/api/clearance/officer/reject', {
        stageProgressId: stage.id,
        stageNumber: stage.stageNumber,
        clearanceRequestId: stage.clearanceRequestId,
        remarks: rejectRemarks.trim(),
      });
      onSuccess(res.data.message || `Stage ${stage.stageNumber} rejected with remarks dispatched.`);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to reject clearance stage.';
      setValidationError(msg);
      onError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unit-specific guidance
  const getUnitChecklist = (stageNum: number) => {
    switch (stageNum) {
      case 1:
        return [
          'Verify project dissertation hardcover submission with supervisor signature',
          'Confirm departmental dues receipt reconciliation with departmental staff adviser',
          'Verify laboratory apparatus return and equipment sign-off',
        ];
      case 2:
        return [
          'Confirm faculty dues Remita transaction receipt status',
          'Validate academic board graduation list inclusion',
          'Verify that CGPA meets affiliate degree graduation criteria',
        ];
      case 3:
        return [
          'Confirm zero overdue library book loans on Koha catalog',
          'Verify library reader identity card surrender',
          'Ensure no pending replacement fees for damaged holdings',
        ];
      case 4:
        return [
          'Audit all academic sessions tuition payment Remita RRRs against TSA account',
          'Verify convocation package levy receipt',
          'Confirm zero outstanding departmental or penalty surcharges',
        ];
      case 5:
        return [
          'Verify Hall of Residence room key surrender',
          'Confirm no hostel property damage or unassessed disciplinary sanctions',
          'Validate Student Union Government dues clearance',
        ];
      case 6:
        return [
          'Validate bio-data identity lock on e-portal system',
          'Verify institutional email and LMS account decommission readiness',
          'Confirm digital transcript repository profile synchronization',
        ];
      case 7:
        return [
          'Audit consolidated approval chain across Stages 1 through 6',
          'Authorize generation of cryptographic Clearance Certificate and QR code',
          'Seal final graduation registry record with institutional watermark',
        ];
      default:
        return ['Perform standard institutional document audit and compliance validation'];
    }
  };

  const checklist = getUnitChecklist(stage.stageNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/30 text-emerald-200 rounded border border-emerald-400/30">
                  Stage {stage.stageNumber} Review
                </span>
                <h3 className="text-lg font-bold text-white">
                  {stage.stageDefinition?.name || 'Clearance Stage Review'}
                </h3>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Target Request: <span className="font-mono text-white">{request?.requestId || stage.clearanceRequestId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {validationError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Action Blocked</p>
                <p className="mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Student Dossier Overview */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-600" />
              <span>Graduating Student Academic Profile</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Full Name</span>
                <span className="font-bold text-slate-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Matriculation Number</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  {student?.matricNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">JAMB Registration</span>
                <span className="font-mono text-slate-700">{student?.jambRegNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-800">{dept?.name || 'Computer Science'} ({dept?.code || 'CSC'})</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Faculty</span>
                <span className="font-semibold text-slate-800">{faculty?.name || 'Applied Sciences & Tech'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Cumulative GPA</span>
                <span className="font-bold text-slate-900 bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 inline-block">
                  {student?.cgpa ? `${student.cgpa.toFixed(2)} / 5.00` : '4.38 / 5.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Submitted Documents & Evidence */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Submitted Verification Proofs & Documents ({documents.length})</span>
            </h4>

            {documents.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
                No electronic attachments were submitted for this checkpoint. Standard institutional records apply.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, idx) => {
                  const docName = doc.fileName || doc.name || `Document ${idx + 1}`;
                  const docStatus = doc.status || (doc.verified ? 'VERIFIED' : 'PENDING');
                  const isVerified = docStatus === 'VERIFIED';
                  const isRejected = docStatus === 'REJECTED';
                  const fileTypeExt = doc.fileType?.includes('pdf') || docName.endsWith('.pdf') ? 'PDF' : 'DOC';

                  return (
                    <div
                      key={doc.id || idx}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          fileTypeExt === 'PDF' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {fileTypeExt}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{docName}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <span>Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Recent submission'}</span>
                            {doc.fileSizeBytes && (
                              <span>• {(doc.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unit-Specific Compliance Checklist */}
          <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Stage {stage.stageNumber} Verification Audit Checklist</span>
            </h4>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start space-x-3 text-sm text-slate-800 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Tabs: Approve vs Reject */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveActionTab('APPROVE')}
                className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors ${
                  activeActionTab === 'APPROVE'
                    ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stamp className="w-4 h-4 text-emerald-600" />
                <span>Endorse & Digitally Sign (Approve)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveActionTab('REJECT')}
                className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors ${
                  activeActionTab === 'REJECT'
                    ? 'bg-white text-rose-800 border-b-2 border-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Flag Discrepancy & Reject Stage</span>
              </button>
            </div>

            <div className="p-5">
              {activeActionTab === 'APPROVE' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Cryptographic Seal:</strong> Endorsing will generate an immutable SHA-256 digital stamp, advance the student to Stage {stage.stageNumber < 7 ? stage.stageNumber + 1 : 'Certificate Issuance'}, and notify the student.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Officer Remarks / Endorsement Note (Optional)
                    </label>
                    <textarea
                      value={endorseRemarks}
                      onChange={(e) => setEndorseRemarks(e.target.value)}
                      placeholder="e.g., Verified against institutional database. All records reconciled and approved."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="px-5 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-md transition-all flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <span>Applying Digital Signature...</span>
                      ) : (
                        <>
                          <Stamp className="w-4 h-4" />
                          <span>Sign & Endorse Stage {stage.stageNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Mandatory Rejection Reason:</strong> You must state clear, actionable instructions for the student to rectify and resubmit their documents.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Reason for Rejection / Corrective Instructions <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      placeholder="e.g., Remita receipt RRR is invalid or belongs to another session. Please re-upload current 2024/2025 verified receipt."
                      rows={3}
                      className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="px-5 py-2 text-sm font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-md transition-all flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <span>Dispatching Notice...</span>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Reject & Send Correction Notice</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
