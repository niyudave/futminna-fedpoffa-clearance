import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Power,
  Key,
  GraduationCap,
  Building,
  Mail,
  Phone,
  Lock,
  ChevronDown,
  X,
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phoneNumber?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles: string[];
  permissionsCount: number;
  student?: {
    id: string;
    matricNumber: string;
    jambRegNumber: string;
    cgpa: number;
    level: string;
    academicSession: string;
    programmeType: string;
    isClearanceEligible: boolean;
  } | null;
  departmentId?: string | null;
  department?: { id: string; code: string; name: string } | null;
  facultyId?: string | null;
  faculty?: { id: string; code: string; name: string } | null;
  createdAt: string;
}

const ALL_ROLES = [
  'STUDENT',
  'HOD',
  'DEAN',
  'LIBRARIAN',
  'BURSAR',
  'STUDENT_AFFAIRS',
  'ICT_DIRECTOR',
  'REGISTRY',
  'SUPER_ADMIN',
];

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    phoneNumber: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    facultyId: '',
    departmentId: '',
    roles: ['STUDENT'],
    // Student specific
    isStudent: true,
    matricNumber: '',
    jambRegNumber: '',
    cgpa: '4.00',
    level: 'DEGREE_400',
    academicSession: '2024/2025',
    programmeType: 'AFFILIATE_DEGREE',
    isClearanceEligible: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, facRes, deptRes] = await Promise.all([
        axios.get('/api/admin/users', {
          params: {
            search: searchQuery || undefined,
            role: roleFilter || undefined,
            status: statusFilter || undefined,
            departmentId: deptFilter || undefined,
            facultyId: facultyFilter || undefined,
          },
        }),
        axios.get('/api/admin/faculties'),
        axios.get('/api/admin/departments'),
      ]);

      setUsers(usersRes.data.users || []);
      setFaculties(facRes.data.faculties || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to fetch user directory.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter, deptFilter, facultyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setDeptFilter('');
    setFacultyFilter('');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      password: '',
      phoneNumber: '',
      status: 'ACTIVE',
      facultyId: faculties[0]?.id || '',
      departmentId: departments[0]?.id || '',
      roles: ['STUDENT'],
      isStudent: true,
      matricNumber: `2024/1/${Math.floor(10000 + Math.random() * 90000)}`,
      jambRegNumber: `2024${Math.floor(10000000 + Math.random() * 90000000)}AF`,
      cgpa: '4.20',
      level: 'DEGREE_400',
      academicSession: '2024/2025',
      programmeType: 'AFFILIATE_DEGREE',
      isClearanceEligible: true,
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: UserRecord) => {
    setSelectedUser(u);
    const hasStudentRole = u.roles.includes('STUDENT');
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      middleName: u.middleName || '',
      email: u.email,
      password: '', // blank unless resetting
      phoneNumber: u.phoneNumber || '',
      status: u.status,
      facultyId: u.facultyId || '',
      departmentId: u.departmentId || '',
      roles: u.roles,
      isStudent: hasStudentRole,
      matricNumber: u.student?.matricNumber || '',
      jambRegNumber: u.student?.jambRegNumber || '',
      cgpa: u.student?.cgpa ? String(u.student.cgpa) : '4.00',
      level: u.student?.level || 'DEGREE_400',
      academicSession: u.student?.academicSession || '2024/2025',
      programmeType: u.student?.programmeType || 'AFFILIATE_DEGREE',
      isClearanceEligible: u.student?.isClearanceEligible !== false,
    });
    setIsEditModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        facultyId: formData.facultyId || undefined,
        departmentId: formData.departmentId || undefined,
        roles: formData.roles,
      };

      if (formData.roles.includes('STUDENT')) {
        payload.studentData = {
          matricNumber: formData.matricNumber,
          jambRegNumber: formData.jambRegNumber,
          cgpa: formData.cgpa,
          level: formData.level,
          academicSession: formData.academicSession,
          programmeType: formData.programmeType,
          isClearanceEligible: formData.isClearanceEligible,
        };
      }

      const res = await axios.post('/api/admin/users', payload);
      setFeedback({ type: 'success', message: res.data.message });
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to create user.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        facultyId: formData.facultyId || undefined,
        departmentId: formData.departmentId || undefined,
        roles: formData.roles,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.roles.includes('STUDENT')) {
        payload.studentData = {
          matricNumber: formData.matricNumber,
          jambRegNumber: formData.jambRegNumber,
          cgpa: formData.cgpa,
          level: formData.level,
          academicSession: formData.academicSession,
          isClearanceEligible: formData.isClearanceEligible,
        };
      }

      const res = await axios.put(`/api/admin/users/${selectedUser.id}`, payload);
      setFeedback({ type: 'success', message: res.data.message });
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update user profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle User Status (Active / Inactive / Suspended)
  const handleToggleStatus = async (user: UserRecord, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      const res = await axios.patch(`/api/admin/users/${user.id}/status`, { status: newStatus });
      setFeedback({ type: 'success', message: res.data.message });
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to change account status.',
      });
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserRecord) => {
    if (!window.confirm(`Are you sure you want to delete user account '${user.email}'? This action is logged permanently.`)) {
      return;
    }

    try {
      const res = await axios.delete(`/api/admin/users/${user.id}`);
      setFeedback({ type: 'success', message: res.data.message });
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete user.',
      });
    }
  };

  // Toggle role in form multi-select
  const handleToggleRole = (role: string) => {
    if (formData.roles.includes(role)) {
      if (formData.roles.length === 1) return; // keep at least 1 role
      setFormData({
        ...formData,
        roles: formData.roles.filter((r) => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        roles: [...formData.roles, role],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Institutional User Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, provision, modify, deactivate, and assign security roles across all 9 institutional tiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Directory"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
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
          <button onClick={() => setFeedback(null)} className="hover:underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, matric number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Roles (9)</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>

            {/* Faculty Filter */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Search
            </button>
            {(searchQuery || roleFilter || statusFilter || deptFilter || facultyFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              User Accounts Directory
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              {users.length} matching
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Strict RBAC Synchronized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Roles & Permissions</th>
                <th className="py-3 px-4">Academic Affiliation</th>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {u.firstName} {u.middleName ? `${u.middleName} ` : ''}{u.lastName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            {u.email}
                          </span>
                          {u.phoneNumber && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {u.phoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                              r === 'SUPER_ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : r === 'REGISTRY'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : r === 'STUDENT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {u.permissionsCount} permissions active
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {u.department ? u.department.name : u.faculty ? u.faculty.name : 'Institutional General'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {u.faculty ? `Faculty of ${u.faculty.name}` : 'Administrative Directorate'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.student ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-700 block text-[11px]">
                            {u.student.matricNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            CGPA: <strong>{u.student.cgpa}</strong> • {u.student.level}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Non-Student Account</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'INACTIVE'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : u.status === 'INACTIVE'
                              ? 'bg-slate-400'
                              : 'bg-rose-500'
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title="Edit User Profile & Roles"
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleStatus(u, u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                          }
                          title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete Account"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          CREATE USER MODAL
         ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Create Institutional User Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provisions user credentials, institutional affiliation, and assigned clearance roles.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Oluwaseun"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Balogun"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. David"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="officer@futminna-fedpoffa.edu.ng"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Secure password (hashed with bcrypt)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="+234 803 000 0000"
                  />
                </div>
              </div>

              {/* Affiliation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Faculty Affiliation
                  </label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">None / Directorate</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Affiliation
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">None / System-Wide</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roles Assignment Multi-select */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Assign Security Roles (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const isSelected = formData.roles.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleToggleRole(r)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student Profile Section if role contains STUDENT */}
              {formData.roles.includes('STUDENT') && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3 pt-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Student Academic Profile Attributes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Matriculation Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.matricNumber}
                        onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                        placeholder="2024/1/12345"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        JAMB Reg Number
                      </label>
                      <input
                        type="text"
                        value={formData.jambRegNumber}
                        onChange={(e) => setFormData({ ...formData, jambRegNumber: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                        placeholder="202410294820AF"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Cumulative GPA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max="5.0"
                        min="0.0"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT USER MODAL
         ========================================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-emerald-600" />
                  Edit User Profile & Role Assignments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update personal data, affiliation, password reset, or security permissions for {selectedUser.email}.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Leave blank to keep existing password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Roles Assignment */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Assigned Roles (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const isSelected = formData.roles.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleToggleRole(r)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{r}
                      </button>
                    );
                  })}
                </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
