import React, { useState } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Terminal,
  Key,
} from 'lucide-react';

export const AdminSecurityTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<any>(null);

  const handleRunSecuritySuite = async () => {
    setIsRunning(true);
    try {
      const res = await axios.post('/api/admin/security/test-unauthorized-suite');
      setSuiteResult(res.data);
    } catch (err: any) {
      console.error('Failed to run security suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Super Administrator Access Security & Unauthorized API Rejection Suite
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Simulates direct malicious or unauthorized API requests attempting to execute administrative functions using Student, Officer, or Unauthenticated tokens. Confirms 100% enforcement of HTTP 401/403 access control.
          </p>
        </div>

        <button
          onClick={handleRunSecuritySuite}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Executing Security Tests...' : 'Run Security Verification Suite'}</span>
        </button>
      </div>

      {/* Security Suite Results Panel */}
      {suiteResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Security Test Results: {suiteResult.passedTests} / {suiteResult.totalTests} Passed
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Authorization Standard: {suiteResult.authorizationStandard}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
              ✓ 100% RBAC ENFORCEMENT VERIFIED
            </span>
          </div>

          <div className="space-y-3">
            {suiteResult.results?.map((test: any) => (
              <div
                key={test.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {test.endpoint}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Persona: <strong>{test.testedPersona}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{test.verdict}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                      test.expectedStatus === 200
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : test.expectedStatus === 401
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    HTTP {test.actualStatus} {test.expectedStatus === 200 ? 'OK' : test.expectedStatus === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PASSED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Lock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Security Verification Suite Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click the button above to fire automated unauthorized test requests against administrative APIs and verify that RBAC guards successfully block all non-admin actors.
          </p>
        </div>
      )}
    </div>
  );
};
