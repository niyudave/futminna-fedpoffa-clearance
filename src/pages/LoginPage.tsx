import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { ForgotPasswordModal } from '@/src/components/auth/ForgotPasswordModal';
import { Logo } from '@/src/components/common/Logo';
import {
  ShieldCheck,
  GraduationCap,
  Building2,
  BookOpen,
  CreditCard,
  Home,
  Laptop,
  FileCheck,
  Shield,
  KeyRound,
  LogIn,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password@2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const canonicalRoles = [
    {
      roleName: 'Student',
      roleKey: 'STUDENT',
      email: 'student.test@futminna-fedpoffa.edu.ng',
      matric: '2020/1/89420CS',
      name: 'Adewale Babatunde Johnson',
      dept: 'Computer Science (Affiliate Degree)',
      icon: GraduationCap,
      color: 'emerald',
      description: 'View 7-stage clearance status, upload receipts & hardcover proof, download cryptographic certificate.',
    },
    {
      roleName: 'Department Officer',
      roleKey: 'HOD',
      email: 'hod.csc@fedpoffa.edu.ng',
      name: 'Dr. Abubakar Suleiman',
      dept: 'Department of Computer Science',
      icon: Building2,
      color: 'blue',
      description: 'Stage 1 Checkpoint: Review departmental project thesis, lab dues, endorse or reject with digital stamp.',
    },
    {
      roleName: 'Faculty Administrator',
      roleKey: 'DEAN',
      email: 'dean.fast@fedpoffa.edu.ng',
      name: 'Prof. Comfort Ogunleye',
      dept: 'Faculty of Applied Sciences & Tech (FAST)',
      icon: Building2,
      color: 'indigo',
      description: 'Stage 2 Checkpoint: Academic board moderation, faculty association receipts verification.',
    },
    {
      roleName: 'Library Officer',
      roleKey: 'LIBRARIAN',
      email: 'librarian.clearance@fedpoffa.edu.ng',
      name: 'Mrs. Funmilayo Adeleke',
      dept: 'University & Polytechnic Main Library',
      icon: BookOpen,
      color: 'amber',
      description: 'Stage 3 Checkpoint: Check returned books, overdue borrowing fines, and Koha repository status.',
    },
    {
      roleName: 'Bursary Officer',
      roleKey: 'BURSAR',
      email: 'bursar.clearance@fedpoffa.edu.ng',
      name: 'Mr. Emmanuel Okonkwo',
      dept: 'Bursary & Student Accounts Division',
      icon: CreditCard,
      color: 'teal',
      description: 'Stage 4 Checkpoint: Audit school fees, convocation levies, and Treasury Single Account (TSA) Remita RRRs.',
    },
    {
      roleName: 'Hostel Officer',
      roleKey: 'STUDENT_AFFAIRS',
      email: 'student.affairs@fedpoffa.edu.ng',
      name: 'Dr. (Mrs) Zainab Aliyu',
      dept: 'Student Affairs & Hall Administration',
      icon: Home,
      color: 'rose',
      description: 'Stage 5 Checkpoint: Hall key surrender, accommodation dues, and disciplinary clearance.',
    },
    {
      roleName: 'ICT Officer',
      roleKey: 'ICT_DIRECTOR',
      email: 'ict.director@fedpoffa.edu.ng',
      name: 'Engr. Mustapha Bello',
      dept: 'Directorate of ICT & E-Portal Services',
      icon: Laptop,
      color: 'cyan',
      description: 'Stage 6 Checkpoint: E-portal profile lock, matric biometrics validation, and email decommissioning.',
    },
    {
      roleName: 'Registry Officer',
      roleKey: 'REGISTRY',
      email: 'registry.exams@fedpoffa.edu.ng',
      name: 'Barrister Kayode Sanusi',
      dept: 'Academic Affairs & Examinations Registry',
      icon: FileCheck,
      color: 'orange',
      description: 'Stage 7 Checkpoint: Final academic registry approval and issuance of anti-counterfeit QR Certificate.',
    },
    {
      roleName: 'Super Administrator',
      roleKey: 'SUPER_ADMIN',
      email: 'admin.security@futminna-fedpoffa.edu.ng',
      name: 'Systems Security Team',
      dept: 'Joint Accreditation & System Operations',
      icon: Shield,
      color: 'purple',
      description: 'System-wide RBAC matrix management, SHA-256 audit ledger inspection, workflow configuration.',
    },
  ];

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleQuickLogin = async (accountEmail: string) => {
    setIdentifier(accountEmail);
    setPassword('Password@2026!');
    setIsLoading(true);
    setErrorMessage('');

    const res = await login(accountEmail, 'Password@2026!');
    setIsLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.error || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="flex justify-center pb-2">
          <Logo size="lg" showSubtitle={false} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F3EAF8] border border-purple-200 rounded-full text-xs font-semibold text-[#4B0082] mb-2">
          <ShieldCheck className="w-4 h-4 text-[#4B0082]" />
          <span>FUTMINNA-FEDPOFFA Institutional Identity & RBAC Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
          Secure Authentication & Role Access
        </h1>
        <p className="text-sm text-[#6B7280]">
          Enforcing strict backend permission validation, bcrypt password hashing, and JWT token sessions across all 9 clearance roles.
        </p>
      </div>

      {/* Active Session Banner */}
      {isAuthenticated && user && (
        <div className="max-w-xl mx-auto p-4 bg-[#F3EAF8] border border-purple-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4B0082] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <p className="text-xs text-[#4B0082] font-semibold">Active Institutional Session</p>
              <p className="text-sm font-bold text-[#1F2937]">
                {user.firstName} {user.lastName} ({roles.join(', ')})
              </p>
              <p className="text-xs font-mono text-[#6B7280]">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/clearance-dashboard')}
              className="px-3 py-1.5 text-xs font-semibold bg-[#4B0082] hover:bg-[#380061] text-white rounded-lg transition-colors shadow-xs"
            >
              Go to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F7F7F9] rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form + 9 Role Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Login Form */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E5E7EB] pb-4">
            <h2 className="text-lg font-bold text-[#1F2937]">Sign In with Credentials</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Supports Student Matriculation Number or Staff Email Address.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-[#DC2626] text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Email Address or Matric Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 2020/1/89420CS or hod.csc@fedpoffa.edu.ng"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B0082]/20 focus:border-[#4B0082] font-mono text-xs"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#1F2937]">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-[#4B0082] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B0082]/20 focus:border-[#4B0082] font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#4B0082] hover:bg-[#380061] text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign In to Clearance Portal
            </button>
          </form>

          {/* Security Guarantee Box */}
          <div className="bg-[#FAF7FC] border border-purple-100 rounded-xl p-4 space-y-2 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2 font-semibold text-[#1F2937]">
              <ShieldCheck className="w-4 h-4 text-[#4B0082]" />
              <span>Phase 3 Security Specifications:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#6B7280] pl-1">
              <li>Passwords hashed via <strong>Bcrypt (10 salt rounds)</strong> — zero plaintext storage.</li>
              <li>Stateless <strong>JWT session bearer tokens</strong> with embedded role claims.</li>
              <li>Every login & logout recorded to <strong>SHA-256 audit ledger</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: 1-Click Interactive Role Switcher across all 9 Roles */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <span>1-Click Test Personas (All 9 System Roles)</span>
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Click any canonical identity to test clearance progression and role permissions instantly.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-slate-100 text-[#6B7280] px-2 py-1 rounded-md">
              Default PWD: Password@2026!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canonicalRoles.map((item) => {
              const Icon = item.icon;
              const isActive = user?.email === item.email;

              return (
                <div
                  key={item.roleKey}
                  onClick={() => handleQuickLogin(item.email)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-150 relative flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#F3EAF8] border-[#6A1B9A] ring-2 ring-[#4B0082]/20 shadow-xs'
                      : 'bg-white border-[#E5E7EB] hover:border-purple-300 hover:shadow-xs'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-[#4B0082] bg-white px-1.5 py-0.5 rounded-full border border-purple-200">
                      <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Active
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#FAF7FC] text-[#4B0082] border border-purple-100">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1F2937] block">{item.roleName}</span>
                        <span className="text-[10px] font-semibold text-[#4B0082] bg-[#F3EAF8] px-1.5 py-0.5 rounded border border-purple-200 inline-block">
                          {item.roleKey}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#1F2937]">{item.name}</p>
                    <p className="text-[11px] font-mono text-[#6B7280] truncate" title={item.email}>
                      {item.email}
                    </p>
                    <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex justify-between items-center">
                    <span className="text-[10px] text-[#6B7280] font-mono">
                      {item.matric ? `Matric: ${item.matric}` : item.dept}
                    </span>
                    <span className="text-[11px] font-semibold text-[#4B0082] group-hover:underline">
                      Log In →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  );
};
