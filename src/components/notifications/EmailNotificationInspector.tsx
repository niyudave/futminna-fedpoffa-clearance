import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Award,
  UserCheck,
  RefreshCw,
  Server,
  PlayCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import axios from 'axios';

interface TestResult {
  id: number;
  name: string;
  category: 'IN_APP' | 'EMAIL' | 'FAILURE_HANDLING' | 'INTEGRATION';
  status: 'PASSED' | 'FAILED';
  details: string;
  timestamp: string;
}

export const EmailNotificationInspector: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('STAGE_APPROVED');
  const [sampleRecipient, setSampleRecipient] = useState('olumide.adeyemi@futminna.edu.ng');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Test Suite State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testingRunning, setTestingRunning] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [testSummary, setTestSummary] = useState<any>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);

  const templates = [
    {
      id: 'CLEARANCE_SUBMITTED',
      name: 'Clearance Request Submitted',
      recipient: 'Student',
      icon: FileText,
      color: 'text-indigo-600',
    },
    {
      id: 'STAGE_APPROVED',
      name: 'Stage Endorsed & Approved',
      recipient: 'Student',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      id: 'STAGE_REJECTED',
      name: 'Stage Correction Required',
      recipient: 'Student',
      icon: AlertTriangle,
      color: 'text-rose-600',
    },
    {
      id: 'CLEARANCE_COMPLETED',
      name: '100% Clearance Certified',
      recipient: 'Student & Registry',
      icon: Award,
      color: 'text-purple-600',
    },
    {
      id: 'OFFICER_STAGE_PENDING',
      name: 'Officer Action Required',
      recipient: 'Clearance Officer',
      icon: UserCheck,
      color: 'text-amber-600',
    },
    {
      id: 'STAGE_RESUBMITTED',
      name: 'Proof Resubmission Review',
      recipient: 'Clearance Officer',
      icon: RefreshCw,
      color: 'text-cyan-600',
    },
  ];

  const handlePreview = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setLoading(true);
    try {
      const res = await axios.post('/api/notifications/preview-email-template', {
        templateType: templateId,
        recipient: sampleRecipient,
      });
      setPreviewHtml(res.data.html);
    } catch {
      setPreviewHtml(
        `<div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
          <h2>Institutional Clearance Notification</h2>
          <p>Template: <strong>${templateId}</strong></p>
          <p>Recipient: ${sampleRecipient}</p>
        </div>`
      );
    } finally {
      setLoading(false);
    }
  };

  const checkSmtp = async () => {
    try {
      const res = await axios.get('/api/notifications/verify-smtp');
      setSmtpStatus(res.data);
    } catch (err: any) {
      setSmtpStatus({ success: false, message: err.message || 'SMTP offline' });
    }
  };

  const fetchDeliveryLogs = async () => {
    try {
      const res = await axios.get('/api/notifications/delivery-logs');
      setDeliveryLogs(res.data.logs || []);
    } catch {
      // Ignored
    }
  };

  const runTestSuite = async () => {
    setTestingRunning(true);
    try {
      const res = await axios.get('/api/notifications/run-test-suite');
      setTestResults(res.data.results || []);
      setTestSummary({
        overallStatus: res.data.overallStatus,
        totalTests: res.data.totalTests,
        passedTests: res.data.passedTests,
        failedTests: res.data.failedTests,
      });
      setSmtpStatus(res.data.smtpVerification);
      fetchDeliveryLogs();
    } catch (err: any) {
      setTestSummary({
        overallStatus: 'FAILED',
        error: err.message,
      });
    } finally {
      setTestingRunning(false);
    }
  };

  useEffect(() => {
    handlePreview('STAGE_APPROVED');
    checkSmtp();
    fetchDeliveryLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xs overflow-hidden text-white">
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Phase 7: Real-Time & Email Notification System</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Nodemailer + Socket.io
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Institutional multi-channel notification engine with secure server-side SMTP configuration, transactional HTML templates, and non-blocking failure recovery.
                </p>
              </div>
            </div>

            {/* Test Suite Trigger */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={runTestSuite}
                disabled={testingRunning}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                {testingRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>Run 10-Item Verification Suite</span>
              </button>
            </div>
          </div>
        </div>

        {/* SMTP Status Sub-bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Server SMTP Status:</span>
            {smtpStatus ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  smtpStatus.success ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {smtpStatus.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {smtpStatus.message}
              </span>
            ) : (
              <span className="text-slate-500">Checking transport...</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>TLS / STARTTLS: <strong className="text-slate-200">Port 587/465</strong></span>
            <span>Sender: <strong className="text-slate-200">clearance-portal@futminna-fedpoffa.edu.ng</strong></span>
          </div>
        </div>
      </div>

      {/* 10-Item Test Suite Results (if run) */}
      {testSummary && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  testSummary.overallStatus === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Verification Suite Results: {testSummary.passedTests}/{testSummary.totalTests} Passed
                </h4>
                <p className="text-xs text-slate-500">
                  All 10 Phase 7 verification criteria evaluated across in-app, email, and error resilience layers.
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                testSummary.overallStatus === 'SUCCESS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              Overall: {testSummary.overallStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testResults.map((test) => (
              <div
                key={test.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  test.status === 'PASSED'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {test.status === 'PASSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {test.id}. {test.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        test.status === 'PASSED'
                          ? 'bg-emerald-200/60 text-emerald-800'
                          : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{test.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Inspector & Template Renderer */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Institutional HTML Email Templates</h3>
            <p className="text-xs text-slate-500">
              Interactive renderer for transactional graduation clearance email dispatches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={sampleRecipient}
              onChange={(e) => setSampleRecipient(e.target.value)}
              placeholder="recipient@futminna.edu.ng"
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
            />
            <button
              onClick={() => handlePreview(selectedTemplate)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Available Email Templates
            </label>
            <div className="space-y-2">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handlePreview(tpl.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl bg-slate-100 ${tpl.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{tpl.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Target: {tpl.recipient}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Email Render Area */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rendered HTML Preview
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Template: {selectedTemplate}
              </span>
            </div>

            <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200 min-h-[420px] overflow-hidden flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-xs font-bold">Rendering template...</span>
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Email Preview"
                  srcDoc={previewHtml}
                  className="w-full flex-1 min-h-[460px] rounded-xl border border-slate-200 bg-white"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Mail className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">Select a template on the left to render</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
