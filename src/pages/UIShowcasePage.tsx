import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input, Select, Textarea } from '@/src/components/ui/FormControls';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Logo } from '@/src/components/common/Logo';
import { BRAND, ROLE_LABELS } from '@/src/lib/constants';
import { ShieldCheck, UserCheck, CheckCircle2, Clock, XCircle, Send, Sparkles } from 'lucide-react';

export const UIShowcasePage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [testInput, setTestInput] = useState('');
  const [simulatedError, setSimulatedError] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#4B0082]" />
          Foundation Design System & UI Component Showcase
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Standardized institutional branding tokens, typography hierarchy, UI controls, and status states.
        </p>
      </div>

      {/* 1. Official Logo Component Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>1. Official Institutional Logo Component</CardTitle>
          <CardDescription>
            Target asset path: <code>{BRAND.LOGO_PATH}</code> with graceful vector fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-6 bg-white border border-[#E5E7EB] rounded-xl flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#6B7280] uppercase">Light Surface (Default)</span>
              <Logo size="lg" showSubtitle={true} />
            </div>

            <div className="p-6 bg-[#4B0082] rounded-xl flex flex-col gap-3">
              <span className="text-xs font-semibold text-purple-200 uppercase">Primary Dark Canvas</span>
              <Logo size="lg" showSubtitle={true} inverted={true} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Color Palette & Typography Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>2. Institutional Color Palette Tokens</CardTitle>
          <CardDescription>Mathematical color tokens as specified in branding specifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#4B0082] text-white">
              <p className="font-bold">#4B0082</p>
              <p className="text-[10px] opacity-80">Primary</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#380061] text-white">
              <p className="font-bold">#380061</p>
              <p className="text-[10px] opacity-80">Primary Dark</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#6A1B9A] text-white">
              <p className="font-bold">#6A1B9A</p>
              <p className="text-[10px] opacity-80">Secondary</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#F3EAF8] text-[#4B0082]">
              <p className="font-bold">#F3EAF8</p>
              <p className="text-[10px] opacity-80">Light Purple</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#16A34A] text-white">
              <p className="font-bold">#16A34A</p>
              <p className="text-[10px] opacity-80">Approved / Success</p>
            </div>
            <div className="p-3 rounded-lg border border-[#E5E7EB] bg-[#DC2626] text-white">
              <p className="font-bold">#DC2626</p>
              <p className="text-[10px] opacity-80">Rejected / Danger</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Status Badges */}
      <Card>
        <CardHeader>
          <CardTitle>3. Standardized Status Badges</CardTitle>
          <CardDescription>Dual-encoded indicators using color, icons, and explicit textual descriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="APPROVED" />
            <StatusBadge status="PENDING" />
            <StatusBadge status="REJECTED" />
            <StatusBadge status="NOT_STARTED" />
            <StatusBadge status="COMPLETED" />
            <StatusBadge status="ACTIVE" />
            <StatusBadge status="INFO" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Button Components */}
      <Card>
        <CardHeader>
          <CardTitle>4. Button Variants & Touch Targets</CardTitle>
          <CardDescription>Strict 2x horizontal padding ratio with accessible minimum touch targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="success" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Approve Stage
            </Button>
            <Button variant="danger" leftIcon={<XCircle className="h-4 w-4" />}>
              Reject Stage
            </Button>
            <Button variant="primary" isLoading={true}>
              Processing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Form Controls */}
      <Card>
        <CardHeader>
          <CardTitle>5. Form Controls & Validation States</CardTitle>
          <CardDescription>Accessible inputs with clear labels, focus states, and error feedback.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Student Matriculation Number"
            placeholder="e.g. 2019/1/74582CS"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            helperText="Enter your official FUTMINNA / FEDPOFFA matric number"
            required
          />

          <Select
            label="System Actor Simulation Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={Object.entries(ROLE_LABELS).map(([k, v]) => ({
              value: k,
              label: `${v} (${k})`,
            }))}
            required
          />

          <div className="md:col-span-2">
            <Textarea
              label="Officer Endorsement / Rejection Remarks"
              placeholder="Provide specific reasons or observations for student clearance verification..."
              helperText="Mandatory when recording stage rejection."
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Empty, Loading, and Error States */}
      <Card>
        <CardHeader>
          <CardTitle>6. Asynchronous State Feedback Components</CardTitle>
          <CardDescription>Empty, loading, and error states handling all transaction scenarios.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <EmptyState
              title="No Pending Clearance"
              message="All submitted clearance requests in your department have been reviewed."
              actionLabel="Refresh Queue"
              onAction={() => alert('Queue refreshed')}
            />
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <LoadingState
              message="Verifying Bursary Settlement..."
              subMessage="Connecting to centralized financial records..."
            />
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <ErrorState
              title="Verification Timeout"
              message="Could not reach the institutional records database. Please try again."
              onRetry={() => alert('Retry triggered')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
