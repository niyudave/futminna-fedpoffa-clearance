import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Lock, ShieldCheck, RefreshCw, CheckCircle2, FileCode2, Clock, User, Terminal } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/audit/logs');
      setLogs(res.data.logs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch audit ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading && logs.length === 0) {
    return <LoadingState message="Connecting to Cryptographic Security Ledger..." subMessage="Validating SHA-256 block hash chaining..." />;
  }

  if (error && logs.length === 0) {
    return <ErrorState title="Audit Ledger Error" message={error} onRetry={fetchAuditLogs} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase">
              Research Compliance
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              SHA-256 Blockchain Chained
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2">
            <Lock className="h-6 w-6 text-[#4B0082]" />
            Immutable Cryptographic Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Append-only security audit log recording every user authentication, stage approval decision, certificate generation, and parameter adjustment.
          </p>
        </div>

        <Button variant="outline" onClick={fetchAuditLogs} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh Ledger
        </Button>
      </div>

      {/* Security Architecture Notice */}
      <Card className="bg-purple-50/50 border-purple-200">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#4B0082] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#1F2937]">
            <p className="font-bold text-[#4B0082]">Research Integrity & Non-Repudiation Assurance</p>
            <p className="text-[#6B7280]">
              In accordance with academic research specifications, every administrative action in the FUTMINNA-FEDPOFFA e-clearance pipeline computes a SHA-256 checksum over the actor identity, action payload, timestamp, and previous block hash. This mathematically prevents tampering, retroactive state alterations, and unauthorized record deletions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries List */}
      <div className="space-y-3">
        {logs.map((log: any, index: number) => (
          <Card key={log.id || index} className="border border-[#E5E7EB] hover:border-[#4B0082]/40 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-[#4B0082] text-white">
                    {log.action}
                  </span>
                  <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    Entity: {log.entityType} ({log.entityId || 'N/A'})
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] bg-gray-50 px-2 py-0.5 rounded border">
                    IP: {log.ipAddress}
                  </span>
                </div>
              </div>

              {/* Actor & Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 font-semibold text-[#1F2937]">
                  <User className="h-3.5 w-3.5 text-[#4B0082]" />
                  <span>{log.userEmail || 'System Bootstrap Engine'}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono truncate max-w-md">
                  Agent: {log.userAgent}
                </div>
              </div>

              {/* State Diffs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {log.previousState && (
                  <div className="p-2.5 bg-red-50/50 border border-red-100 rounded font-mono text-[11px] text-red-900">
                    <span className="font-bold block text-red-700 text-[10px] uppercase">Previous State:</span>
                    <pre className="overflow-x-auto whitespace-pre-wrap">{log.previousState}</pre>
                  </div>
                )}
                {log.newState && (
                  <div className={`p-2.5 bg-green-50/50 border border-green-100 rounded font-mono text-[11px] text-green-900 ${!log.previousState ? 'md:col-span-2' : ''}`}>
                    <span className="font-bold block text-green-700 text-[10px] uppercase">New State / Action Payload:</span>
                    <pre className="overflow-x-auto whitespace-pre-wrap">{log.newState}</pre>
                  </div>
                )}
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] font-mono text-gray-500">
                <div className="flex items-center gap-1 text-[#4B0082] font-semibold">
                  <Terminal className="h-3 w-3" />
                  <span>SHA-256 Hash:</span>
                  <span className="text-gray-700">{log.checksumHash}</span>
                </div>
                <span className="text-green-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Block Verified
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
