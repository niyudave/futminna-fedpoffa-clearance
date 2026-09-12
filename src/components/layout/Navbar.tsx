import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Shield,
  Activity,
  FileCheck2,
  Lock,
  Sparkles,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  LogOut,
  BarChart3,
  Award,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '@/src/components/common/Logo';
import { useAuth } from '@/src/context/AuthContext';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';
import { ThemeToggle } from '@/src/components/common/ThemeToggle';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, roles, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: 'Overview', path: '/', icon: Shield },
    { label: 'Auth & 9 Roles', path: '/login', icon: KeyRound },
    { label: 'Clearance Portal', path: '/clearance-dashboard', icon: FileCheck2 },
    { label: 'Verify Certificate', path: '/verify/certificate', icon: Award },
    { label: 'Evaluation & TAM', path: '/evaluation', icon: GraduationCap },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Super Admin', path: '/admin', icon: ShieldAlert },
    { label: 'Workflow Test', path: '/workflow-simulator', icon: Sparkles },
    { label: 'RBAC Inspector', path: '/rbac-security', icon: ShieldAlert },
    { label: 'Audit Ledger', path: '/audit-trail', icon: Lock },
    { label: 'System Health', path: '/health', icon: Activity },
  ];

  const primaryNavLinks = [
    { label: 'Overview', path: '/', icon: Shield },
    { label: 'Clearance Portal', path: '/clearance-dashboard', icon: FileCheck2 },
    { label: 'Verify Certificate', path: '/verify/certificate', icon: Award },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const toolsNavLinks = [
    { label: 'Auth & 9 Roles', path: '/login', icon: KeyRound },
    { label: 'Evaluation & TAM', path: '/evaluation', icon: GraduationCap },
    { label: 'Super Admin', path: '/admin', icon: ShieldAlert },
    { label: 'Workflow Test', path: '/workflow-simulator', icon: Sparkles },
    { label: 'RBAC Inspector', path: '/rbac-security', icon: ShieldAlert },
    { label: 'Audit Ledger', path: '/audit-trail', icon: Lock },
    { label: 'System Health', path: '/health', icon: Activity },
  ];

  const isAnyToolActive = toolsNavLinks.some((link) => location.pathname === link.path);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-[#E5E7EB] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Official Institutional Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 py-1"
            aria-label="Home"
          >
            <Logo size="md" showSubtitle={true} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative group/link flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#F3EAF8] text-[#2E0854] border border-purple-200'
                      : 'text-[#6B7280] hover:text-[#2E0854] hover:bg-[#F7F7F9]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                  {/* Thin animated underline on hover in brass #A9782F */}
                  <span
                    className="absolute bottom-0.5 left-2.5 right-2.5 h-[2px] bg-[#A9782F] rounded-full scale-x-0 transition-transform duration-200 ease-out origin-center group-hover/link:scale-x-100 pointer-events-none"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}

            {/* Tools Dropdown Menu */}
            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  isAnyToolActive
                    ? 'bg-[#F3EAF8] text-[#2E0854] border border-purple-200'
                    : 'text-[#6B7280] hover:text-[#2E0854] hover:bg-[#F7F7F9]'
                }`}
                aria-haspopup="true"
              >
                <span>Tools</span>
                <ChevronDown className="h-3 w-3 text-[#6B7280] transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>

              {/* Popover Card (0.5px border, 12px radius, white bg) */}
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block group-focus-within:block z-50">
                <div className="bg-white rounded-[12px] border-[0.5px] border-[#E4E1EC] shadow-lg p-1.5 min-w-[210px] space-y-0.5">
                  {toolsNavLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#F3EAF8] text-[#2E0854] font-bold'
                            : 'text-[#4B5563] hover:text-[#2E0854] hover:bg-[#F3EAF8]/60'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 text-[#6D28D9] shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-[#E5E7EB] mx-2" />

            {/* Late-Night Administrative Dark Mode Toggle */}
            <ThemeToggle />

            {/* Notification Centre Bell */}
            <NotificationBell variant="light" />

            {/* Authenticated Persona Badge */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/clearance-dashboard"
                  className="flex items-center gap-2 px-2.5 py-1 bg-[#F3EAF8] hover:bg-[#ebd9f4] border border-purple-200 rounded-full transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#4B0082] text-white flex items-center justify-center font-bold text-[10px]">
                    {user.firstName[0]}
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-[#1F2937] block leading-tight">
                      {user.firstName}
                    </span>
                    <span className="text-[9px] font-mono text-[#4B0082] block font-semibold leading-none">
                      {roles[0] || 'USER'}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#2E0854] hover:bg-[#1E0538] text-white rounded-lg transition-colors shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>

          {/* Mobile menu button & notification trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <NotificationBell variant="light" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[#2E0854]" />
              ) : (
                <Menu className="h-6 w-6 text-[#1F2937]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E7EB] bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-[#F3EAF8] text-[#2E0854] font-semibold'
                    : 'text-[#1F2937] hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 text-[#2E0854]" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          {isAuthenticated && user && (
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between px-3 py-2">
              <span className="text-xs text-[#6B7280] font-medium">
                Active: {user.firstName} {user.lastName} ({roles.join(', ')})
              </span>
              <button
                onClick={logout}
                className="text-xs text-[#DC2626] font-bold hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
