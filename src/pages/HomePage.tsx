import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Users,
  FileCheck2,
  Lock,
  Workflow,
  Sparkles,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  Stamp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { Logo } from '@/src/components/common/Logo';
import { BRAND, DEFAULT_WORKFLOW_STAGES } from '@/src/lib/constants';
import { checkSystemHealth } from '@/src/services/api';
import { SystemHealthResponse } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';

export const HomePage: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const { isAuthenticated, user, roles, switchDemoAccount } = useAuth();

  useEffect(() => {
    checkSystemHealth()
      .then((data) => {
        setHealthData(data);
      })
      .catch((err) => {
        console.warn('Backend initial health ping:', err);
      })
      .finally(() => {
        setIsHealthLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Institutional Hero Banner */}
      <section className="bg-[#F6F1E4] border border-[#EDE4CD] rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        {/* Inset decorative border 8px in from edges */}
        <div
          className="absolute inset-2 border border-[#A9782F]/25 rounded-[14px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Decorative circular seal badge (desktop only, hidden below sm) */}
        <div
          className="hidden sm:flex absolute right-8 top-10 lg:top-12 lg:right-12 items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className="w-24 h-24 lg:w-28 lg:h-28 drop-shadow-xs"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer concentric circle */}
            <circle cx="50" cy="50" r="46" stroke="#A9782F" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Inner concentric circle */}
            <circle cx="50" cy="50" r="41" stroke="#A9782F" strokeWidth="1.5" />
            {/* Center filled circle */}
            <circle cx="50" cy="50" r="34" fill="#2E0854" />
            {/* White checkmark path */}
            <path
              d="M38 50.5L46 58.5L62 42.5"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status="ACTIVE" size="sm" />
            <span className="text-xs font-semibold text-[#2F6B4A] uppercase tracking-wider bg-[#E7F1EA] border border-[#C7E0CE] px-3 py-1 rounded-full">
              Phase 3 Complete: Auth & RBAC Active
            </span>
          </div>

          <div className="py-2">
            <Logo size="lg" showSubtitle={true} />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1E0538] font-['Fraunces'] tracking-tight leading-tight">
            Web-Based Student Clearance Management System
          </h1>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Case Study: <strong className="text-[#1E0538]">Federal University of Technology, Minna (FUTMINNA)</strong>, in affiliation with <strong className="text-[#1E0538]">Federal Polytechnic Offa (FEDPOFFA)</strong> Campus.
            A centralized digital workflow replacing manual paper clearance with asynchronous multi-department approvals, tamper-resistant audit trails, and automated certificate generation.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/login">
              <Button
                variant="primary"
                size="md"
                leftIcon={<KeyRound className="h-4 w-4" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Auth & 9 Roles Switcher
              </Button>
            </Link>

            <Link to="/clearance-dashboard">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<FileCheck2 className="h-4 w-4" />}
              >
                Clearance Portal Workspace
              </Button>
            </Link>

            <Link to="/rbac-security">
              <Button
                variant="outline"
                size="md"
                leftIcon={<ShieldAlert className="h-4 w-4 text-[#6D28D9]" />}
              >
                RBAC Security Penetration Test
              </Button>
            </Link>

            <Link to="/database">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Database className="h-4 w-4 text-slate-600" />}
              >
                Database Schema (Prisma 7.9.1)
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Role Persona Switch Bar as Segmented Control */}
        <div className="mt-8 pt-6 border-t border-[#EDE4CD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <span className="font-semibold text-[#1E0538]">Quick Test Identity:</span>
            {/* Single pill-shaped segmented control container */}
            <div className="inline-flex p-1 bg-[#EDE4CD]/60 border border-[#A9782F]/20 rounded-full shadow-2xs">
              <button
                onClick={() => switchDemoAccount('student.test@futminna-fedpoffa.edu.ng')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  roles.includes('STUDENT')
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => switchDemoAccount('hod.csc@fedpoffa.edu.ng')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  roles.includes('HOD')
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                HOD
              </button>
              <button
                onClick={() => switchDemoAccount('dean.fast@fedpoffa.edu.ng')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  roles.includes('DEAN')
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                Dean
              </button>
              <button
                onClick={() => switchDemoAccount('bursar.clearance@fedpoffa.edu.ng')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  roles.includes('BURSAR')
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                Bursar
              </button>
              <button
                onClick={() => switchDemoAccount('admin.security@futminna-fedpoffa.edu.ng')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                  roles.includes('SUPER_ADMIN')
                    ? 'bg-[#2E0854] text-white shadow-xs'
                    : 'text-[#2E0854] hover:bg-white/60'
                }`}
              >
                Super Admin
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-700">
            <span>Security: <strong className="text-[#1E0538]">Bcrypt Salted Hashes</strong></span>
            <span>Sessions: <strong className="text-[#1E0538]">Stateless JWT Bearer</strong></span>
          </div>
        </div>
      </section>

      {/* 9 Institutional Roles Matrix Highlight */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Role-Based Access Control Architecture (All 9 Roles)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Backend middleware enforces cryptographic authorization across academic departments and administrative units.
            </p>
          </div>
          <Link to="/login" className="text-xs font-bold text-emerald-700 hover:underline">
            View All 9 Personas →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Student Role</h3>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">STUDENT</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              View own profile, initiate 7-stage clearance, submit project receipts and lab dues, view notifications, and download authenticated certificate upon completion.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Stage Officers (7 Checkpoints)</h3>
                <span className="text-[10px] font-mono text-blue-700 font-semibold">HOD, DEAN, BURSAR, etc.</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              View department queue, review project thesis, audit TSA Remita dues, sign endorsements with SHA-256 digital stamps, or issue structured rejection notices.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Super Administrator</h3>
                <span className="text-[10px] font-mono text-purple-700 font-semibold">SUPER_ADMIN</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              User identity management, role-permission assignments, system parameter switches, and tamper-resistant SHA-256 Merkle audit trail inspection.
            </p>
          </div>
        </div>
      </section>

      {/* 7-Stage Clearance Workflow Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Workflow className="h-5 w-5 text-emerald-600" />
              Default Multi-Departmental Clearance Sequence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sequentially executed clearance pipeline as specified in academic source documents (Chapter 1 & 2).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_WORKFLOW_STAGES.map((stage) => (
            <Card key={stage.stageCode} className="flex flex-col justify-between" hoverEffect={true}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {stage.sequenceOrder}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                    Stage {stage.sequenceOrder}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  {stage.stageName}
                </CardTitle>
                <span className="text-[11px] font-medium text-emerald-700">
                  Role: {stage.responsibleRole.replace('_', ' ')}
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {stage.description}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Final Certificate Milestone Card */}
          <Card className="flex flex-col justify-between border-emerald-200 bg-emerald-50/50" hoverEffect={true}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  ✓
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-sm">
                  Completion
                </span>
              </div>
              <CardTitle className="text-sm font-bold text-emerald-900">
                Digital Clearance Certificate
              </CardTitle>
              <span className="text-[11px] font-medium text-emerald-700">
                Automatic Issuance
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Cryptographically signed clearance certificate with embedded SHA-256 verification hash and anti-counterfeit verification QR token.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
