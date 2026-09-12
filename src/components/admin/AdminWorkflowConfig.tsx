import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileCheck,
  Upload,
  Settings,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Sliders,
  X,
  Lock,
} from 'lucide-react';

interface StageItem {
  id: string;
  stageNumber: number;
  stageCode: string;
  name: string;
  description: string;
  requiredRoleName: string;
  assignedUnitName?: string;
  departmentId?: string | null;
  requiresDocumentUpload: boolean;
  requiredDocumentNames: string;
  isSequential: boolean;
  isFinalStage: boolean;
  isActive: boolean;
}

const OFFICER_ROLES = [
  'HOD',
  'DEAN',
  'LIBRARIAN',
  'BURSAR',
  'STUDENT_AFFAIRS',
  'ICT_DIRECTOR',
  'REGISTRY',
];

export const AdminWorkflowConfig: React.FC = () => {
  const [stages, setStages] = useState<StageItem[]>([]);
  const [workflow, setWorkflow] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Stage Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<StageItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    requiredRoleName: 'HOD',
    requiresDocumentUpload: false,
    requiredDocumentNames: '',
    isSequential: true,
    isActive: true,
  });

  // Create Stage Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    stageCode: '',
    name: '',
    description: '',
    requiredRoleName: 'HOD',
    requiresDocumentUpload: false,
    requiredDocumentNames: '',
    isSequential: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const loadWorkflowData = async () => {
    setIsLoading(true);
    try {
      const [res, valRes] = await Promise.all([
        axios.get('/api/admin/workflow-config'),
        axios.post('/api/admin/workflow-config/validate', {}),
      ]);

      setStages(res.data.stages || []);
      setWorkflow(res.data.workflow || null);
      setValidationReport(valRes.data || null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to load workflow configuration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflowData();
  }, []);

  // Move Stage Up or Down
  const handleMoveStage = async (currentIndex: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const newStages = [...stages];
    const temp = newStages[currentIndex];
    newStages[currentIndex] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    // Check invalid workflow client-side: cannot move Registry before any intermediate stages
    const registryStage = newStages.find((s) => s.isFinalStage || s.requiredRoleName === 'REGISTRY');
    if (registryStage && newStages[newStages.length - 1].id !== registryStage.id) {
      setFeedback({
        type: 'error',
        message: 'Invalid Workflow Order: The Academic Registry Final Clearance stage must always remain the final terminal stage in the sequence.',
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      const stageOrder = newStages.map((s) => s.id);
      const res = await axios.put('/api/admin/workflow-config/stages/reorder', { stageOrder });
      setFeedback({ type: 'success', message: res.data.message });
      loadWorkflowData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to reorder stages.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Stage Active Status
  const handleToggleActive = async (stage: StageItem) => {
    if (stage.isActive && (stage.isFinalStage || stage.requiredRoleName === 'REGISTRY')) {
      setFeedback({
        type: 'error',
        message: 'Invalid Workflow Action: Cannot deactivate the Academic Registry Final Clearance checkpoint.',
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await axios.put(`/api/admin/workflow-config/stage/${stage.id}`, {
        isActive: !stage.isActive,
      });
      setFeedback({ type: 'success', message: `Stage '${stage.name}' active status updated.` });
      loadWorkflowData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to toggle stage status.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Edit Stage
  const handleOpenEdit = (stage: StageItem) => {
    setSelectedStage(stage);
    setEditFormData({
      name: stage.name,
      description: stage.description,
      requiredRoleName: stage.requiredRoleName,
      requiresDocumentUpload: stage.requiresDocumentUpload,
      requiredDocumentNames: stage.requiredDocumentNames || '[]',
      isSequential: stage.isSequential,
      isActive: stage.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Stage
  const handleSaveEditStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await axios.put(`/api/admin/workflow-config/stage/${selectedStage.id}`, editFormData);
      setFeedback({ type: 'success', message: `Stage '${editFormData.name}' updated successfully.` });
      setIsEditModalOpen(false);
      loadWorkflowData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update stage.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Create Stage Modal
  const handleOpenCreate = () => {
    setCreateFormData({
      stageCode: `CHECKPOINT_${stages.length + 1}`,
      name: '',
      description: '',
      requiredRoleName: 'HOD',
      requiresDocumentUpload: false,
      requiredDocumentNames: '',
      isSequential: true,
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Stage
  const handleSaveCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedback(null);
    try {
      await axios.post('/api/admin/workflow-config/stage', createFormData);
      setFeedback({ type: 'success', message: `Stage '${createFormData.name}' created successfully.` });
      setIsCreateModalOpen(false);
      loadWorkflowData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to add clearance stage.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Stage
  const handleDeleteStage = async (stage: StageItem) => {
    if (stage.isFinalStage || stage.requiredRoleName === 'REGISTRY') {
      setFeedback({
        type: 'error',
        message: 'Cannot delete the Academic Registry Final Clearance stage. Institutional certificate issuance requires Registry final sign-off.',
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete clearance stage '${stage.name}'?`)) {
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await axios.delete(`/api/admin/workflow-config/stage/${stage.id}`);
      setFeedback({ type: 'success', message: res.data.message });
      loadWorkflowData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete clearance stage.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workflow Config Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Clearance Workflow Configuration & Sequence Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
              {workflow ? workflow.academicSession : '2024/2025'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure active clearance checkpoints, reorder execution sequence, assign autonomous clearance units, and enforce strict institutional validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadWorkflowData}
            title="Reload Workflow Schema"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Stage</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Institutional Workflow Validator Checklist Card */}
      {validationReport && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Institutional Workflow Integrity Guard</h3>
                <p className="text-[11px] text-slate-400">
                  Real-time validation engine preventing configuration of broken or non-compliant workflows.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                validationReport.isValid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {validationReport.isValid ? '✓ WORKFLOW VALID' : '⚠ INVALID WORKFLOW DETECTED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {validationReport.checks?.map((chk: any) => (
              <div
                key={chk.id}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                  chk.passed
                    ? 'bg-slate-800/80 border-slate-700/80 text-slate-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold">{chk.name}</span>
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">{chk.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sequential Stages Interactive List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Clearance Progression Pipeline ({stages.length} Stages)</h3>
            <p className="text-xs text-slate-500">
              Students progress sequentially from Stage 1 through Stage 7 upon individual officer endorsement.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {stages.filter((s) => s.isActive !== false).length} Active Checkpoints
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const isFirst = index === 0;
            const isLast = index === stages.length - 1;
            const isRegistry = stage.isFinalStage || stage.requiredRoleName === 'REGISTRY';

            return (
              <div
                key={stage.id}
                className={`border rounded-2xl p-4.5 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  stage.isActive !== false
                    ? isRegistry
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Left: Stage number & info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl font-bold font-mono flex items-center justify-center text-sm shrink-0 border ${
                      stage.isActive !== false
                        ? isRegistry
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {stage.stageNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{stage.name}</h4>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {stage.stageCode}
                      </span>
                      {isRegistry && (
                        <span className="flex items-center gap-1 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Lock className="w-3 h-3" />
                          MANDATORY REGISTRY FINAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 flex-wrap">
                      <span>
                        Role: <strong className="text-slate-800 font-mono">{stage.requiredRoleName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Unit: <strong>{stage.assignedUnitName || `${stage.requiredRoleName} Clearance Desk`}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Upload Required: <strong className="text-slate-800">{stage.requiresDocumentUpload ? 'Yes' : 'No'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Sequence Reordering & Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Reordering Up/Down Buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => handleMoveStage(index, 'UP')}
                      disabled={isFirst || isProcessing || isRegistry}
                      title="Move Stage Up"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveStage(index, 'DOWN')}
                      disabled={isLast || isProcessing || isRegistry || index === stages.length - 2}
                      title="Move Stage Down"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active / Inactive Toggle */}
                  <button
                    onClick={() => handleToggleActive(stage)}
                    disabled={isProcessing || isRegistry}
                    title={stage.isActive !== false ? 'Deactivate Stage' : 'Activate Stage'}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                      stage.isActive !== false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {stage.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(stage)}
                    title="Configure Stage Attributes"
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button (disabled for registry) */}
                  {!isRegistry && (
                    <button
                      onClick={() => handleDeleteStage(stage)}
                      title="Delete Stage"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          EDIT STAGE MODAL
         ========================================================================= */}
      {isEditModalOpen && selectedStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configure Stage {selectedStage.stageNumber}</h3>
                <p className="text-xs text-slate-500">{selectedStage.stageCode}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stage Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Clearance Officer Role *</label>
                <select
                  value={editFormData.requiredRoleName}
                  onChange={(e) => setEditFormData({ ...editFormData, requiredRoleName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                >
                  {OFFICER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.requiresDocumentUpload}
                    onChange={(e) => setEditFormData({ ...editFormData, requiresDocumentUpload: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Requires Student Document Upload
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Stage Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE STAGE MODAL
         ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Clearance Checkpoint</h3>
                <p className="text-xs text-slate-500">
                  New stages are inserted before the final Academic Registry terminal stage.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreateStage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stage Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={createFormData.stageCode}
                  onChange={(e) => setCreateFormData({ ...createFormData, stageCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  placeholder="e.g. ALUMNI_AFFAIRS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stage Name *</label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Alumni Association Clearance"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Verification of alumni dues and convocation yearbook subscription."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Officer Role *</label>
                <select
                  value={createFormData.requiredRoleName}
                  onChange={(e) => setCreateFormData({ ...createFormData, requiredRoleName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                >
                  {OFFICER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Insert Stage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
