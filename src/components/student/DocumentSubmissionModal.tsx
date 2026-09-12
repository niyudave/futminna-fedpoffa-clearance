import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Paperclip,
  HelpCircle,
} from 'lucide-react';

interface DocumentSubmissionModalProps {
  stage: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stageNumber: number, documents: any[]) => Promise<void>;
  isSubmitting: boolean;
  isResubmission?: boolean;
}

export const DocumentSubmissionModal: React.FC<DocumentSubmissionModalProps> = ({
  stage,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isResubmission = false,
}) => {
  const [docName, setDocName] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  if (!isOpen || !stage) return null;

  let requiredDocList: string[] = [];
  try {
    if (stage.stageDefinition?.requiredDocumentNames) {
      requiredDocList = JSON.parse(stage.stageDefinition.requiredDocumentNames);
    }
  } catch (e) {
    requiredDocList = ['Required Stage Verification Proof / Receipt'];
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDocTitle = docName.trim() || selectedFileName || `${stage.stageDefinition?.name || 'Clearance'}_Proof.pdf`;

    const docPayload = [
      {
        name: finalDocTitle,
        referenceNumber: refNumber.trim() || undefined,
        studentNote: studentNote.trim() || undefined,
        uploadedAt: new Date().toISOString(),
        verified: false,
      },
    ];

    await onSubmit(stage.stageNumber, docPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            isResubmission
              ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900'
              : 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              {isResubmission ? (
                <RotateCcw className="w-5 h-5 text-rose-300" />
              ) : (
                <Upload className="w-5 h-5 text-purple-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isResubmission ? 'Resubmit Corrective Proof' : 'Upload Stage Proofs'}
              </h3>
              <p className="text-xs text-purple-200">
                Stage {stage.stageNumber}: {stage.stageDefinition?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
          {/* Rejection Alert Banner if Resubmitting */}
          {isResubmission && stage.remarks && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block uppercase tracking-wider text-[10px]">
                    Officer's Rejection Remarks:
                  </span>
                  <p className="mt-0.5 font-medium">{stage.remarks}</p>
                </div>
              </div>
            </div>
          )}

          {/* Required Documents Checklist */}
          {requiredDocList.length > 0 && (
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs">
              <span className="font-bold text-purple-950 block mb-1">
                Institutional Document Checklist:
              </span>
              <ul className="space-y-1 text-purple-900">
                {requiredDocList.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <FileCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Drag & Drop File Upload Container */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select or Drop Verification File
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                dragActive
                  ? 'border-purple-600 bg-purple-50'
                  : selectedFileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-purple-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                {selectedFileName ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedFileName}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Ready to upload • Click to choose another file
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-800">
                      Click to browse or drag and drop document
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports PDF, PNG, JPG, or DOC (Max 10MB)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Document Title / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title / Label
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder={requiredDocList[0] || 'e.g. Remita RRR Receipt / Hardcover Project Copy'}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Reference / Invoice Code (e.g. Remita RRR) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Reference / RRR Number (Optional)
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. RRR-2948-1092-4820"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Student Explanation / Corrective Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isResubmission
                ? 'Corrective Explanation for Clearance Officer'
                : 'Additional Comments / Remarks (Optional)'}
            </label>
            <textarea
              rows={2}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder={
                isResubmission
                  ? 'Explain what changes were made (e.g. attached supervisor signed sheet, cleared overdue library fine)...'
                  : 'Any additional notes for the reviewing officer...'
              }
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                isResubmission
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-purple-700 hover:bg-purple-800'
              }`}
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : isResubmission ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resubmit to Officer</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
