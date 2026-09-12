import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from '@/src/components/common/Logo';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
        setStep('RESET');
      } else {
        setSuccessMessage(res.data.message);
        setStep('SUCCESS');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch password reset token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await axios.post('/api/auth/reset-password', {
        token: resetToken,
        newPassword,
      });

      setSuccessMessage(res.data.message);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Logo size="xs" showSubtitle={false} />
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-800">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm">Password Recovery</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'REQUEST' && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your verified institutional email. A cryptographic reset token will be generated and signed with SHA-256 state tracking.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student.test@futminna-fedpoffa.edu.ng"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Generate Reset Token
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700">Demo Quick Fill:</span>
                <p className="cursor-pointer text-emerald-700 hover:underline" onClick={() => setEmail('student.test@futminna-fedpoffa.edu.ng')}>
                  student.test@futminna-fedpoffa.edu.ng
                </p>
                <p className="cursor-pointer text-blue-700 hover:underline" onClick={() => setEmail('hod.csc@fedpoffa.edu.ng')}>
                  hod.csc@fedpoffa.edu.ng
                </p>
              </div>
            </form>
          )}

          {step === 'RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Reset token verified for <strong className="font-mono">{email}</strong>. Enter new password:</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Generated Cryptographic Reset Token</label>
                <input
                  type="text"
                  value={resetToken}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Bcrypt Salted Hash)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Save New Password & Log In
                </button>
              </div>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Password Reset Complete</h4>
                <p className="text-xs text-slate-600 mt-1">{successMessage}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Proceed to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
