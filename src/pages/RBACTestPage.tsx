import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/src/context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Users,
  FileCheck,
  Server,
  Code2,
} from 'lucide-react';

export const RBACTestPage: React.FC = () => {
  const { user, roles, permissions, token, switchDemoAccount } = useAuth();
  const [suiteResults, setSuiteResults] = useState<any>(null);
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [rolesMatrix, setRolesMatrix] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SUITE' | 'MATRIX' | 'MANUAL'>('SUITE');

  // Manual interactive attempt tester
  const [manualEndpoint, setManualEndpoint] = useState('/api/admin/users');
  const [manualMethod, setManualMethod] = useState<'GET' | 'POST' | 'PUT'>('GET');
  const [manualBody, setManualBody] = useState('{}');
  const [manualResponse, setManualResponse] = useState<any>(null);
  const [isTestingManual, setIsTestingManual] = useState(false);

  const runAutomatedSecuritySuite = async () => {
    setIsRunningSuite(true);
    try {
      const res = await axios.post('/api/auth/test-unauthorized');
      setSuiteResults(res.data);
    } catch (err: any) {
      setSuiteResults({
        error: err.response?.data?.error || 'Failed to run automated security suite',
      });
    } finally {
      setIsRunningSuite(false);
    }
  };

  const loadRolesMatrix = async () => {
    try {
      const res = await axios.get('/api/admin/roles-matrix');
      setRolesMatrix(res.data.roles || []);
    } catch {
      // Fallback display if not logged in as admin
      setRolesMatrix([]);
    }
  };

  useEffect(() => {
    runAutomatedSecuritySuite();
    loadRolesMatrix();
  }, []);

  const executeManualAttempt = async () => {
    setIsTestingManual(true);
    setManualResponse(null);

    const startTime = performance.now();
    try {
      let res;
      if (manualMethod === 'GET') {
        res = await axios.get(manualEndpoint);
      } else if (manualMethod === 'POST') {
        res = await axios.post(manualEndpoint, JSON.parse(manualBody || '{}'));
      } else {
        res = await axios.put(manualEndpoint, JSON.parse(manualBody || '{}'));
      }

      const elapsed = Math.round(performance.now() - startTime);
      setManualResponse({
        status: res.status,
        statusText: res.statusText,
        elapsed: `${elapsed}ms`,
        data: res.data,
        isAllowed: true,
      });
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setManualResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        elapsed: `${elapsed}ms`,
        data: err.response?.data || { error: err.message },
        isAllowed: false,
      });
    } finally {
      setIsTestingManual(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-800 mb-2">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span>Phase 3 RBAC & Unauthorized Access Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Role-Based Access Control (RBAC) Security Inspector
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Validating that unauthorized actions are strictly rejected with HTTP 401/403 at the Express API layer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAutomatedSecuritySuite}
            disabled={isRunningSuite}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isRunningSuite ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Re-run RBAC Test Suite
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('SUITE')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SUITE'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Automated Security & RBAC Suite ({suiteResults?.totalTests || 11} Scenarios)
        </button>
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MANUAL'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          Live Request Attempt Simulator
        </button>
        <button
          onClick={() => setActiveTab('MATRIX')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MATRIX'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Institutional Role-Permission Matrix
        </button>
      </div>

      {/* Tab 1: Automated Suite */}
      {activeTab === 'SUITE' && (
        <div className="space-y-6">
          {suiteResults && suiteResults.allPassed && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    All {suiteResults.totalTests} RBAC Security Tests Passed
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Express middleware successfully blocked all unauthorized, forged, and cross-stage actions.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-200/60 text-emerald-900 rounded-lg font-mono font-bold text-xs">
                PASS 100%
              </span>
            </div>
          )}

          {/* Test Cards List */}
          <div className="space-y-3">
            {suiteResults?.results?.map((t: any, idx: number) => (
              <div
                key={t.testId || idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {t.passed ? (
                      <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                        <XCircle className="w-5 h-5" />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{t.testId}</span>
                        <h4 className="text-sm font-bold text-slate-900">{t.description}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{t.scenario}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-bold font-mono rounded-md ${
                        t.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      HTTP {t.actualStatus} ({t.actualErrorCode})
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <span className="text-slate-400">Expected: </span>
                    <span className="font-mono text-slate-700 font-medium">HTTP {t.expectedStatus} [{t.expectedErrorCode}]</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Enforcement Proof: </span>
                    <span className="text-emerald-800 font-semibold">{t.auditVerification}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Manual Attempt Simulator */}
      {activeTab === 'MANUAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Attempt Target API Endpoint</h3>
              <p className="text-xs text-slate-500 mt-1">
                Make requests using your current active login session (<span className="font-semibold text-slate-800">{roles.join(', ') || 'Anonymous'}</span>).
              </p>
            </div>

            {/* Persona Switcher Quick Row */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Simulate As:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => switchDemoAccount('student.test@futminna-fedpoffa.edu.ng')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    roles.includes('STUDENT') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => switchDemoAccount('hod.csc@fedpoffa.edu.ng')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    roles.includes('HOD') ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  HOD (Dept)
                </button>
                <button
                  onClick={() => switchDemoAccount('bursar.clearance@fedpoffa.edu.ng')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    roles.includes('BURSAR') ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bursar
                </button>
                <button
                  onClick={() => switchDemoAccount('admin.security@futminna-fedpoffa.edu.ng')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    roles.includes('SUPER_ADMIN') ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>

            {/* Quick Test Pre-sets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Quick Test Scenarios:</span>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  onClick={() => {
                    setManualMethod('GET');
                    setManualEndpoint('/api/admin/users');
                    setManualBody('{}');
                  }}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 block">1. Access User Management (Requires SUPER_ADMIN)</span>
                  <span className="font-mono text-[11px] text-slate-500">GET /api/admin/users</span>
                </button>

                <button
                  onClick={() => {
                    setManualMethod('POST');
                    setManualEndpoint('/api/clearance/officer/endorse');
                    setManualBody(JSON.stringify({ stageNumber: 1, remarks: 'Test Approval' }, null, 2));
                  }}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 block">2. Approve Stage 1 Departmental Clearance (Requires HOD)</span>
                  <span className="font-mono text-[11px] text-slate-500">POST /api/clearance/officer/endorse (stageNumber: 1)</span>
                </button>

                <button
                  onClick={() => {
                    setManualMethod('POST');
                    setManualEndpoint('/api/clearance/officer/endorse');
                    setManualBody(JSON.stringify({ stageNumber: 4, remarks: 'Bursary Approval' }, null, 2));
                  }}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 block">3. Approve Stage 4 Bursary Clearance (Requires BURSAR)</span>
                  <span className="font-mono text-[11px] text-slate-500">POST /api/clearance/officer/endorse (stageNumber: 4)</span>
                </button>

                <button
                  onClick={() => {
                    setManualMethod('GET');
                    setManualEndpoint('/api/clearance/my-clearance');
                    setManualBody('{}');
                  }}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 block">4. View Student Clearance (Requires STUDENT)</span>
                  <span className="font-mono text-[11px] text-slate-500">GET /api/clearance/my-clearance</span>
                </button>
              </div>
            </div>

            {/* Custom URL and Method */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <select
                  value={manualMethod}
                  onChange={(e: any) => setManualMethod(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
                <input
                  type="text"
                  value={manualEndpoint}
                  onChange={(e) => setManualEndpoint(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  placeholder="/api/admin/users"
                />
              </div>

              {manualMethod !== 'GET' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">JSON Payload Body:</label>
                  <textarea
                    rows={3}
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
                  />
                </div>
              )}

              <button
                onClick={executeManualAttempt}
                disabled={isTestingManual}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isTestingManual ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Dispatch Request with Current JWT
              </button>
            </div>
          </div>

          {/* Right Column: Live HTTP Response */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Express Middleware Response</span>
              </div>
              {manualResponse && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    manualResponse.status === 200
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : manualResponse.status === 403
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  HTTP {manualResponse.status} ({manualResponse.elapsed})
                </span>
              )}
            </div>

            {manualResponse ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {manualResponse.status === 200 ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <Unlock className="w-4 h-4" /> AUTHORIZED (Access Granted)
                    </span>
                  ) : manualResponse.status === 403 ? (
                    <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                      <Lock className="w-4 h-4" /> 403 FORBIDDEN (RBAC Blocked by Backend Middleware)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                      <Lock className="w-4 h-4" /> 401 UNAUTHORIZED (Missing / Invalid Token)
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto max-h-96">
                  <pre className="text-slate-300 text-[11px]">
                    {JSON.stringify(manualResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Click "Dispatch Request" to test live authorization enforcement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Roles Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Canonical Roles & Permission Matrices</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hierarchical capabilities assigned to each actor under the FUTMINNA-FEDPOFFA affiliation framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesMatrix.map((r) => (
              <div key={r.roleId} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{r.displayName}</h4>
                    <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      {r.name}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {r.permissions.length} perms
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>

                <div className="space-y-1 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Assigned Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p: any) => (
                      <span
                        key={p.code}
                        className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                        title={p.name}
                      >
                        {p.code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
