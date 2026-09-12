import React, { useState } from 'react';
import axios from 'axios';
import {
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface StudentScenarioSwitcherProps {
  onScenarioApplied: () => void;
}

export const StudentScenarioSwitcher: React.FC<StudentScenarioSwitcherProps> = ({
  onScenarioApplied,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('PROGRESS_BURSARY');
  const [message, setMessage] = useState<string>('');
  const [transactionTestResult, setTransactionTestResult] = useState<any>(null);
  const [isRunningTxTest, setIsRunningTxTest] = useState(false);

  const scenarios = [
    {
      id: 'PROGRESS_BURSARY',
      label: 'Standard In-Progress (Stage 4 Bursary)',
      icon: Play,
      color: 'purple',
      description: 'Stages 1-3 approved; Stage 4 Bursary pending Remita RRR verification.',
    },
    {
      id: 'REJECTED_AT_STAGE_1',
      label: 'Stage 1 Rejected (HOD Remarks & Resubmit)',
      icon: AlertTriangle,
      color: 'rose',
      description: 'Stage 1 rejected with missing supervisor signature; tests rejection view & resubmission.',
    },
    {
      id: 'FRESH_NOT_STARTED',
      label: 'Fresh Uninitiated Student',
      icon: RotateCcw,
      color: 'slate',
      description: 'Clearance in Draft status; tests 1-click clearance initiation flow.',
    },
    {
      id: 'ALL_COMPLETED',
      label: '100% Fully Cleared (All 7 Stages)',
      icon: CheckCircle2,
      color: 'emerald',
      description: 'All 7 stages approved with cryptographic signature & clearance certificate ready.',
    },
  ];

  const handleApplyScenario = async (scenarioId: string) => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/clearance/student/simulate-scenario', {
        scenario: scenarioId,
      });
      setActiveScenario(scenarioId);
      setMessage(res.data.message);
      onScenarioApplied();
      setTimeout(() => setMessage(''), 3500);
    } catch (err: any) {
      setMessage('Failed to switch test scenario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTransactionTest = async () => {
    setIsRunningTxTest(true);
    setTransactionTestResult(null);
    try {
      const res = await axios.post('/api/clearance/workflow/test-transaction');
      setTransactionTestResult(res.data);
    } catch (err: any) {
      setTransactionTestResult({
        passed: false,
        details: err.response?.data?.error || 'Transaction test failed.',
      });
    } finally {
      setIsRunningTxTest(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Student State Simulator & Defense Testing Toolbar
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-xs font-medium text-emerald-400 animate-in fade-in">
              {message}
            </span>
          )}
          <button
            onClick={handleRunTransactionTest}
            disabled={isRunningTxTest}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            {isRunningTxTest ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>Test ACID Transaction Rollback</span>
          </button>
        </div>
      </div>

      {transactionTestResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
          transactionTestResult.passed
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
        }`}>
          {transactionTestResult.passed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-white">
                {transactionTestResult.testName || 'ACID Transaction Test'}
              </strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 font-bold text-emerald-400">
                {transactionTestResult.passed ? 'STATUS: PASSED (100% ISOLATED)' : 'STATUS: FAILED'}
              </span>
            </div>
            <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
              {transactionTestResult.details}
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-400 flex flex-wrap gap-3 pt-1 border-t border-slate-700/50">
              <span>Initial Req Count: {transactionTestResult.initialRequestsCount}</span>
              <span>Final Req Count: {transactionTestResult.finalRequestsCount}</span>
              <span>Rollback Audit Logged: {transactionTestResult.rollbackAuditRecorded ? 'YES (Durably Appended)' : 'NO'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenario === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => handleApplyScenario(sc.id)}
              disabled={isLoading}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        sc.color === 'rose'
                          ? 'text-rose-400'
                          : sc.color === 'emerald'
                          ? 'text-emerald-400'
                          : sc.color === 'slate'
                          ? 'text-slate-400'
                          : 'text-purple-400'
                      }`}
                    />
                    <span className="text-white truncate">{sc.label}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
