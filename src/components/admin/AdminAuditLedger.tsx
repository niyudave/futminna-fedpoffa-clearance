import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Lock,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileCode,
  Calendar,
  User,
  Shield,
  Activity,
  X,
  CheckCircle2,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  ipAddress?: string;
  userAgent?: string;
  previousHash?: string;
  currentHash?: string;
  createdAt: string;
}

export const AdminAuditLedger: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Selected Log State Inspector Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/admin/audit-logs', {
        params: {
          search: searchQuery || undefined,
          action: actionFilter || undefined,
          entityType: entityFilter || undefined,
          limit: 100,
        },
      });

      setLogs(res.data.logs || []);
      setTotalEntries(res.data.totalEntries || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAuditLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Institutional Cryptographic Audit Ledger
            </h2>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SHA-256 Merkle Chained
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, immutable transaction trail recording user, role, action, resource, timestamp, and digital fingerprints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
            {totalEntries} Total Ledger Records
          </span>
          <button
            onClick={loadAuditLogs}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, email, or entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-80">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Actions</option>
              <option value="CLEARANCE_STAGE_APPROVED">STAGE_APPROVED</option>
              <option value="CLEARANCE_STAGE_REJECTED">STAGE_REJECTED</option>
              <option value="CLEARANCE_SUBMITTED">CLEARANCE_SUBMITTED</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
              <option value="WORKFLOW_STAGE_UPDATED">WORKFLOW_UPDATED</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Entities</option>
              <option value="CLEARANCE_STAGE">CLEARANCE_STAGE</option>
              <option value="CLEARANCE_REQUEST">CLEARANCE_REQUEST</option>
              <option value="USER">USER</option>
              <option value="WORKFLOW_STAGE">WORKFLOW_STAGE</option>
              <option value="USER_CREDENTIALS">CREDENTIALS</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Email</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP / Host</th>
                <th className="py-3 px-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No ledger entries match criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isApproval = log.action.includes('APPROVED');
                  const isRejection = log.action.includes('REJECTED');
                  const isUserAction = log.action.includes('USER');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block font-sans">
                          {log.userEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ID: {log.userId || 'SYSTEM_DAEMON'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isApproval
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isRejection
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isUserAction
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          {log.entityType}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {log.entityId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="Inspect JSON Payload"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View State</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON State Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 text-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  Ledger Transaction Record: {selectedLog.action}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {selectedLog.id} • {new Date(selectedLog.createdAt).toISOString()}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Previous State (JSON)
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-rose-300 border border-slate-800 overflow-x-auto max-h-48">
                  {selectedLog.previousState ? JSON.stringify(JSON.parse(selectedLog.previousState), null, 2) : 'null (Initial State)'}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  New State (JSON)
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-300 border border-slate-800 overflow-x-auto max-h-48">
                  {selectedLog.newState ? JSON.stringify(JSON.parse(selectedLog.newState), null, 2) : 'null (Deleted Entity)'}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="font-mono text-slate-400 text-[10px]">
                IP: {selectedLog.ipAddress || '127.0.0.1'} • Agent: {selectedLog.userAgent || 'Web Console'}
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
