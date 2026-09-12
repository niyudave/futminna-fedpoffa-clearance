import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2,
  FolderTree,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Shield,
  GraduationCap,
  X,
} from 'lucide-react';

export const AdminOrgManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'faculties' | 'departments' | 'units'>('faculties');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clearanceUnits, setClearanceUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [facultyForm, setFacultyForm] = useState({ code: '', name: '', description: '' });
  const [deptForm, setDeptForm] = useState({ code: '', name: '', facultyId: '', description: '' });
  const [unitForm, setUnitForm] = useState({
    code: '',
    name: '',
    description: '',
    responsibleRole: 'HOD',
    stageCode: 'DEPT',
    isActive: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [facRes, deptRes, unitRes] = await Promise.all([
        axios.get('/api/admin/faculties'),
        axios.get('/api/admin/departments'),
        axios.get('/api/admin/clearance-units'),
      ]);

      setFaculties(facRes.data.faculties || []);
      setDepartments(deptRes.data.departments || []);
      setClearanceUnits(unitRes.data.units || []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to load organizational structures.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItem(null);
    if (activeSubTab === 'faculties') {
      setFacultyForm({ code: '', name: '', description: '' });
    } else if (activeSubTab === 'departments') {
      setDeptForm({ code: '', name: '', facultyId: faculties[0]?.id || '', description: '' });
    } else {
      setUnitForm({
        code: '',
        name: '',
        description: '',
        responsibleRole: 'HOD',
        stageCode: 'DEPT',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setSelectedItem(item);
    if (activeSubTab === 'faculties') {
      setFacultyForm({ code: item.code, name: item.name, description: item.description || '' });
    } else if (activeSubTab === 'departments') {
      setDeptForm({ code: item.code, name: item.name, facultyId: item.facultyId || '', description: item.description || '' });
    } else {
      setUnitForm({
        code: item.code,
        name: item.name,
        description: item.description || '',
        responsibleRole: item.responsibleRole || 'HOD',
        stageCode: item.stageCode || 'DEPT',
        isActive: item.isActive !== false,
      });
    }
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (activeSubTab === 'faculties') {
        if (modalMode === 'create') {
          await axios.post('/api/admin/faculties', facultyForm);
          setFeedback({ type: 'success', message: `Faculty '${facultyForm.name}' created successfully.` });
        } else {
          await axios.put(`/api/admin/faculties/${selectedItem.id}`, facultyForm);
          setFeedback({ type: 'success', message: `Faculty '${facultyForm.name}' updated successfully.` });
        }
      } else if (activeSubTab === 'departments') {
        if (modalMode === 'create') {
          await axios.post('/api/admin/departments', deptForm);
          setFeedback({ type: 'success', message: `Department '${deptForm.name}' created successfully.` });
        } else {
          await axios.put(`/api/admin/departments/${selectedItem.id}`, deptForm);
          setFeedback({ type: 'success', message: `Department '${deptForm.name}' updated successfully.` });
        }
      } else {
        if (modalMode === 'create') {
          await axios.post('/api/admin/clearance-units', unitForm);
          setFeedback({ type: 'success', message: `Clearance Unit '${unitForm.name}' created successfully.` });
        } else {
          await axios.put(`/api/admin/clearance-units/${selectedItem.id}`, unitForm);
          setFeedback({ type: 'success', message: `Clearance Unit '${unitForm.name}' updated successfully.` });
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Operation failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Entity
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'? This action validates referential constraints.`)) {
      return;
    }

    try {
      let endpoint = '';
      if (activeSubTab === 'faculties') endpoint = `/api/admin/faculties/${id}`;
      else if (activeSubTab === 'departments') endpoint = `/api/admin/departments/${id}`;
      else endpoint = `/api/admin/clearance-units/${id}`;

      const res = await axios.delete(endpoint);
      setFeedback({ type: 'success', message: res.data.message || 'Deleted successfully.' });
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete entity.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Institutional Organizational Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain Academic Faculties, Academic Departments, and Autonomous Clearance Units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('faculties')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'faculties' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculties ({faculties.length})
            </button>
            <button
              onClick={() => setActiveSubTab('departments')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departments ({departments.length})
            </button>
            <button
              onClick={() => setActiveSubTab('units')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clearance Units ({clearanceUnits.length})
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
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

      {/* =========================================================================
          SUB-TAB 1: FACULTIES
         ========================================================================= */}
      {activeSubTab === 'faculties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faculties.map((fac) => (
            <div
              key={fac.id}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {fac.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id, fac.name)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{fac.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fac.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold">
                  <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                  {fac.departmentsCount} Departments
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {fac.studentsCount} Students
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: DEPARTMENTS
         ========================================================================= */}
      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                      {dept.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dept.facultyCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                  Faculty: <strong className="text-slate-800">{dept.facultyName}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] text-slate-500">
                  HOD: <strong>{dept.hod ? dept.hod.name : 'Assigned in Registry'}</strong>
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {dept.studentsCount} Students
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: CLEARANCE UNITS
         ========================================================================= */}
      {activeSubTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clearanceUnits.map((unit) => (
            <div
              key={unit.id}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                    {unit.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(unit)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {unit.responsibleRole !== 'REGISTRY' && (
                      <button
                        onClick={() => handleDelete(unit.id, unit.name)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{unit.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{unit.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Responsible Role:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    {unit.responsibleRole}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Linked Stage:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {unit.linkedStageNumber ? `Stage ${unit.linkedStageNumber}: ${unit.linkedStageName}` : 'Independent Unit'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Officers:</span>
                  <span className="font-bold text-slate-900">{unit.assignedOfficersCount} Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          DYNAMIC CRUD MODAL
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {modalMode === 'create' ? 'Create' : 'Edit'}{' '}
                {activeSubTab === 'faculties' ? 'Faculty' : activeSubTab === 'departments' ? 'Department' : 'Clearance Unit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {activeSubTab === 'faculties' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Code *</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.code}
                      onChange={(e) => setFacultyForm({ ...facultyForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      placeholder="e.g. FAST"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Name *</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="Faculty of Applied Sciences & Technology"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={facultyForm.description}
                      onChange={(e) => setFacultyForm({ ...facultyForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {activeSubTab === 'departments' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department Code *</label>
                    <input
                      type="text"
                      required
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      placeholder="e.g. CSC"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                    <input
                      type="text"
                      required
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Faculty *</label>
                    <select
                      required
                      value={deptForm.facultyId}
                      onChange={(e) => setDeptForm({ ...deptForm, facultyId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {activeSubTab === 'units' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Code *</label>
                    <input
                      type="text"
                      required
                      value={unitForm.code}
                      onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      placeholder="e.g. UNIT_BURSARY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Name *</label>
                    <input
                      type="text"
                      required
                      value={unitForm.name}
                      onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="Bursary & Treasury Clearance"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Role *</label>
                    <select
                      value={unitForm.responsibleRole}
                      onChange={(e) => setUnitForm({ ...unitForm, responsibleRole: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    >
                      {['HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY'].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={unitForm.description}
                      onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
