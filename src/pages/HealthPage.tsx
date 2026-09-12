import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, Terminal, Clock, ShieldCheck, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { checkSystemHealth } from '@/src/services/api';
import { SystemHealthResponse } from '@/src/types';
import { BRAND } from '@/src/lib/constants';

export const HealthPage: React.FC = () => {
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const result = await checkSystemHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setData(result);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || 'Failed to reach /api/health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <Server className="h-6 w-6 text-[#4B0082]" />
            Backend System Health & API Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Validating full-stack Express API connectivity, database engine layer, and workflow registry.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={runHealthCheck}
          isLoading={loading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Re-Check API Health
        </Button>
      </div>

      {loading && !data && (
        <Card>
          <CardContent>
            <LoadingState
              message="Connecting to Express REST Backend..."
              subMessage="Executing GET /api/health"
            />
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <ErrorState
          title="Backend API Connection Failed"
          message={error}
          onRetry={runHealthCheck}
        />
      )}

      {data && (
        <div className="space-y-6">
          {/* In-Memory Warning Banner when running on fallback */}
          {(data.storageBackend === 'IN_MEMORY_FALLBACK' || data.database.storageBackend === 'IN_MEMORY_FALLBACK') && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  ⚠ Running on IN-MEMORY fallback store — data will not persist
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Development fallback mode is active. Operations are currently being served from the in-memory store. Changes will be reset upon server restart.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#16A34A]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase">API Status</span>
                  <div className="text-base font-bold text-[#16A34A] flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" /> Operational
                  </div>
                </div>
                <StatusBadge status="ACTIVE" size="sm" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#4B0082]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase">Roundtrip Latency</span>
                  <div className="text-base font-bold text-[#1F2937] flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-4 w-4 text-[#4B0082]" /> {latency} ms
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">Fast</span>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${data.storageBackend === 'IN_MEMORY_FALLBACK' ? 'border-l-amber-500' : 'border-l-[#2563EB]'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase">Storage Backend</span>
                  <div className="text-base font-bold text-[#1F2937] flex items-center gap-1.5 mt-0.5">
                    <Database className={`h-4 w-4 ${data.storageBackend === 'IN_MEMORY_FALLBACK' ? 'text-amber-600' : 'text-[#2563EB]'}`} />
                    {data.storageBackend || 'MYSQL'}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                  data.storageBackend === 'IN_MEMORY_FALLBACK'
                    ? 'text-amber-800 bg-amber-100'
                    : 'text-blue-600 bg-blue-50'
                }`}>
                  {data.storageBackend === 'IN_MEMORY_FALLBACK' ? 'Fallback' : 'Persistent'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Response Payload Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#4B0082]" />
                  GET /api/health Response Payload
                </CardTitle>
                <CardDescription>
                  Verified response from Node.js / Express backend service at {lastChecked || 'just now'}
                </CardDescription>
              </div>
              <StatusBadge status="APPROVED" size="sm" />
            </CardHeader>
            <CardContent>
              <pre className="bg-[#1F2937] text-purple-200 p-4 rounded-lg text-xs font-mono overflow-x-auto shadow-inner">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Configured Workflow Stage Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Active Clearance Workflow Sequences ({data.workflow.defaultStagesCount} Stages)
              </CardTitle>
              <CardDescription>
                Verified stages recognized by the backend workflow engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.workflow.configuredSequence.map((stage, idx) => (
                  <div
                    key={stage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#1F2937]"
                  >
                    <span className="h-4 w-4 rounded-full bg-[#4B0082] text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{stage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
