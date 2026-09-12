import React from 'react';
import { ShieldCheck, School, Building2, BookOpen } from 'lucide-react';
import { BRAND } from '@/src/lib/constants';
import { Logo } from '@/src/components/common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--surface-card)] border-t border-[var(--border-default)] mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo and institutional attribution */}
          <div className="flex flex-col gap-3">
            <Logo size="sm" showSubtitle={true} />
            <p className="text-xs text-[#6B7280] leading-relaxed mt-2 max-w-sm">
              Final-Year Computer Science Project: Web-Based Student Clearance Management System.
              Digitizing multi-departmental administrative approval workflows with real-time status tracking and RBAC security.
            </p>
          </div>

          {/* Academic Case Study Specifications */}
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
              Institutional Case Study
            </h5>
            <ul className="text-xs text-[#6B7280] space-y-1.5 mt-1">
              <li className="flex items-center gap-2">
                <School className="h-3.5 w-3.5 text-[var(--ink-primary)]" />
                <span>Federal University of Technology, Minna (FUTMINNA)</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#6A1B9A] dark:text-[#C4A7EC]" />
                <span>Federal Polytechnic Offa Campus (FEDPOFFA Affiliation)</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4ADE80]" />
                <span>Theoretical Framework: TAM, DeLone & McLean, BPR</span>
              </li>
            </ul>
          </div>

          {/* Technical Architecture & Compliance */}
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
              Architecture & Security
            </h5>
            <p className="text-xs text-[#6B7280] leading-relaxed mt-1">
              Engineered with React 18, TypeScript, Express REST API, Prisma ORM, and MySQL Relational Storage.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-[var(--ink-text)] bg-[var(--ink-light)] border border-[var(--ink-border)] px-3 py-1 rounded-md w-fit">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--ink-primary)]" />
              <span>Institutional RBAC Enforced</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-default)] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <p>© {new Date().getFullYear()} Federal Polytechnic Offa / FUTMINNA Degree Directorate. All rights reserved.</p>
          <p className="text-[11px]">System Status: <span className="font-semibold text-[#16A34A]">Operational</span></p>
        </div>
      </div>
    </footer>
  );
};
