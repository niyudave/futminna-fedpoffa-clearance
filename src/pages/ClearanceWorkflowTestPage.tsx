import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input, Select, Textarea } from '@/src/components/ui/FormControls';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  AlertCircle,
  FileText,
  Lock,
  Sparkles,
  QrCode,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import { EmailNotificationInspector } from '@/src/components/notifications/EmailNotificationInspector';

export const ClearanceWorkflowTestPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Officer action form
  const [selectedStageNum, setSelectedStageNum] = useState<number>(4);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'WAIVED'>('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [officerRole, setOfficerRole] = useState('BURSAR');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/clearance/demo-request');
      setData(res.data);
      if (res.data.request?.currentStageNumber) {
        setSelectedStageNum(res.data.request.currentStageNumber);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load clearance demo request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, []);

  const handleStageDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionSuccess(null);
    try {
      const res = await axios.post('/api/clearance/stage-decision', {
        stageNumber: selectedStageNum,
        decision,
        remarks: remarks || `Verified by ${officerRole} on official institutional clearance ledger.`,
        officerRole,
        officerEmail: `${officerRole.toLowerCase()}.clearance@fedpoffa.edu.ng`,
      });
      setActionSuccess(res.data.message);
      setRemarks('');
      await fetchRequestDetails();
    } catch (err: any) {
      alert('Error updating clearance decision: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return <LoadingState message="Loading Multi-Department Clearance Sequence..." subMessage="Fetching normalized stage progresses and student credentials..." />;
  }

  if (error && !data) {
    return <ErrorState title="Clearance Request Error" message={error} onRetry={fetchRequestDetails} />;
  }

  const { request, student, stages, decisions } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4B0082]/10 text-[#4B0082] border border-[#4B0082]/20 uppercase">
              Phase 2 Multi-Department Workflow
            </span>
            <StatusBadge status={request.status} />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight mt-1 flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-[#4B0082]" />
            Multi-Department Sequential Clearance Simulator
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Interactive testing of Stage 1 through Stage 7 clearance decisions, digital endorsement hashes, and state transitions.
          </p>
        </div>

        <Button variant="outline" onClick={fetchRequestDetails} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh Queue
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs sm:text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
          <div>
            <p className="font-semibold">{actionSuccess}</p>
            <p className="text-[11px] text-green-700">Digital signature hash and audit log entry created in immutable database.</p>
          </div>
        </div>
      )}

      {/* Student Profile Card (Normalized Data) */}
      <Card className="bg-gradient-to-r from-purple-50/50 via-white to-white border-[#E5E7EB]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#4B0082] uppercase tracking-wider">
                Normalized Student Master Record (1-to-1 with User)
              </span>
              <CardTitle className="text-xl text-[#1F2937] mt-0.5">{student.fullName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-purple-100 text-[#4B0082] px-3 py-1 rounded-lg border border-purple-200">
                {request.requestId}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block">Matriculation No.</span>
            <span className="font-mono font-bold text-gray-900">{student.matricNumber}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Programme & Affiliation</span>
            <span className="font-semibold text-[#4B0082]">{student.departmentCode} (FUTMINNA Affiliated)</span>
          </div>
          <div>
            <span className="text-gray-500 block">Current Level / Session</span>
            <span className="font-semibold text-gray-900">{student.level} ({student.academicSession})</span>
          </div>
          <div>
            <span className="text-gray-500 block">CGPA / Standing</span>
            <span className="font-bold text-[#16A34A]">{student.cgpa} (First Class)</span>
          </div>
        </CardContent>
      </Card>

      {/* 7-Stage Workflow Visual Pipeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#4B0082]" />
          7-Stage Multi-Department Clearance Sequence
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {stages.map((st: any) => {
            const isCurrent = request.currentStageNumber === st.stageNumber && request.status !== 'COMPLETED';
            const isApproved = st.status === 'APPROVED';
            const isRejected = st.status === 'REJECTED';
            const isPending = st.status === 'PENDING';

            return (
              <div
                key={st.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-green-50/40 border-green-200'
                    : isRejected
                    ? 'bg-red-50/40 border-red-200'
                    : isCurrent
                    ? 'bg-purple-50/60 border-[#4B0082] shadow-xs'
                    : 'bg-white border-[#E5E7EB] opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isApproved
                          ? 'bg-[#16A34A] text-white'
                          : isRejected
                          ? 'bg-[#DC2626] text-white'
                          : isCurrent
                          ? 'bg-[#4B0082] text-white animate-pulse'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {st.stageNumber}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#1F2937]">{st.stageDefinition?.name || st.name}</h3>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          Role: {st.stageDefinition?.requiredRoleName}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">{st.stageDefinition?.description}</p>
                      
                      {/* Officer Decision & Stamp Details */}
                      {st.remarks && (
                        <p className="text-xs text-gray-800 italic mt-1 bg-white/80 p-2 rounded border border-gray-200">
                          "{st.remarks}"
                        </p>
                      )}

                      {st.decision && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-gray-500">
                          <span className="text-[#4B0082] font-semibold flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            {st.decision.signatureHash?.slice(0, 24)}...
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
                            Stamp: {st.decision.digitalStamp}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    <StatusBadge status={st.status} />
                    {isCurrent && (
                      <span className="text-xs font-bold text-[#4B0082] bg-purple-100 px-2 py-1 rounded">
                        Active Stage
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Officer Action Panel */}
      <Card className="border border-[#4B0082]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#4B0082]" />
            Officer Digital Endorsement & Decision Sandbox
          </CardTitle>
          <CardDescription>
            Simulate Departmental Head (HOD), Faculty Dean, Librarian, Bursar, or Registry Officer approving or rejecting a clearance checkpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStageDecisionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Target Clearance Stage"
                value={String(selectedStageNum)}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  setSelectedStageNum(num);
                  const st = stages.find((s: any) => s.stageNumber === num);
                  if (st?.stageDefinition?.requiredRoleName) {
                    setOfficerRole(st.stageDefinition.requiredRoleName);
                  }
                }}
                options={stages.map((s: any) => ({
                  value: String(s.stageNumber),
                  label: `Stage ${s.stageNumber}: ${s.stageDefinition?.name || s.name}`,
                }))}
                required
              />

              <Select
                label="Acting Officer Role"
                value={officerRole}
                onChange={(e) => setOfficerRole(e.target.value)}
                options={[
                  { value: 'HOD', label: 'HOD (Stage 1)' },
                  { value: 'DEAN', label: 'Dean of Faculty (Stage 2)' },
                  { value: 'LIBRARIAN', label: 'University Librarian (Stage 3)' },
                  { value: 'BURSAR', label: 'Bursary Officer (Stage 4)' },
                  { value: 'STUDENT_AFFAIRS', label: 'Student Affairs (Stage 5)' },
                  { value: 'ICT_DIRECTOR', label: 'ICT Director (Stage 6)' },
                  { value: 'REGISTRY', label: 'Academic Registry (Stage 7 - Final)' },
                ]}
                required
              />

              <Select
                label="Decision Action"
                value={decision}
                onChange={(e) => setDecision(e.target.value as any)}
                options={[
                  { value: 'APPROVED', label: 'APPROVED (Grant Endorsement)' },
                  { value: 'REJECTED', label: 'REJECTED (Flag Discrepancy)' },
                  { value: 'WAIVED', label: 'WAIVED (Administrative Waiver)' },
                ]}
                required
              />
            </div>

            <Textarea
              label="Officer Endorsement Remarks / Discrepancy Reason"
              placeholder="e.g. All laboratory equipment returned and signed off. Cleared for graduation."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              helperText="This entry is hashed into the permanent immutable SHA-256 audit ledger."
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-[#4B0082]" />
                Signs with SHA-256 digital stamp & logs IP audit metadata
              </span>

              <Button
                type="submit"
                variant={decision === 'APPROVED' ? 'success' : decision === 'REJECTED' ? 'danger' : 'primary'}
                isLoading={submitting}
                leftIcon={decision === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              >
                Submit {decision} Endorsement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Phase 7: Real-Time Event-Driven Institutional Email Inspector */}
      <EmailNotificationInspector />
    </div>
  );
};
