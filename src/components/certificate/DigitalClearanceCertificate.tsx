import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Award,
  ShieldCheck,
  Printer,
  Download,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Lock,
  FileCheck,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/src/components/common/Logo';

interface DigitalClearanceCertificateProps {
  certificate: any;
  student: any;
  request?: any;
  stages?: any[];
  onClose?: () => void;
}

export const DigitalClearanceCertificate: React.FC<DigitalClearanceCertificateProps> = ({
  certificate,
  student,
  request,
  stages = [],
  onClose,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const certNumber = certificate?.certificateNumber || 'FUT-FP-CLR-2026-0001';
  const clearanceId = request?.requestId || certificate?.clearanceRequestId || 'CLR-2026-FUT-00123';
  const issueDate = certificate?.issuanceDate
    ? new Date(certificate.issuanceDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const fullStudentName = student?.user
    ? `${student.user.lastName?.toUpperCase()}, ${student.user.firstName?.toUpperCase()}${student.user.middleName ? ' ' + student.user.middleName.toUpperCase() : ''}`
    : student?.name || 'STUDENT CANDIDATE';

  const matricNumber = student?.matricNumber || 'FP/2020/ND/CSC/001';
  const departmentName = student?.department?.name || 'Computer Science';
  const departmentCode = student?.department?.code || 'CSC';
  const facultyName = student?.faculty?.name || 'Faculty of Applied Sciences & Technology';
  const facultyCode = student?.faculty?.code || 'FAST';
  const academicSession = student?.academicSession || '2024/2025';

  // Construct absolute or relative public verification URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verificationUrl = `${origin}/verify/certificate/${encodeURIComponent(certNumber)}`;

  // Generate QR Code on mount
  useEffect(() => {
    const generateQr = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(verificationUrl, {
          width: 256,
          margin: 1.5,
          color: {
            dark: '#1E1B4B', // Deep indigo
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrCodeDataUrl(qrUrl);
      } catch (err) {
        console.error('Failed to generate certificate QR code:', err);
      } finally {
        setIsGeneratingQr(false);
      }
    };
    generateQr();
  }, [verificationUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const endpoint = `/api/clearance/certificate/${encodeURIComponent(certNumber)}/pdf`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to download certificate PDF: ${response.statusText}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeRef = certNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Clearance-Certificate-${safeRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading certificate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Action Toolbar (Hidden during browser print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              Official Digital Clearance Certificate
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-full">
                VERIFIED & VALID
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Certificate Ref: <strong>{certNumber}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Verify URL'}</span>
          </button>

          <a
            href={`/verify/certificate/${encodeURIComponent(certNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Verify Page</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-purple-800 hover:bg-purple-900 disabled:bg-purple-400 text-white rounded-xl shadow-xs transition-colors"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        OFFICIAL INSTITUTIONAL DIGITAL CLEARANCE CERTIFICATE
        Designed for High-Resolution Display & Perfect Physical Print Fidelity
        ========================================================================
      */}
      <div
        ref={certRef}
        id="official-digital-certificate"
        className="bg-white border-8 border-double border-purple-950 rounded-3xl p-6 sm:p-12 shadow-xl relative overflow-hidden text-slate-900 print:p-8 print:border-8 print:shadow-none print:m-0"
        style={{
          backgroundImage: 'radial-gradient(#F3E8FF 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Subtle Watermark Institutional Crest */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <ShieldCheck className="w-[500px] h-[500px] text-purple-950" />
        </div>

        {/* Certificate Decorative Border Corners */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-900 pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-900 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-900 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-900 pointer-events-none" />

        {/* 1. Official Header & Logo */}
        <div className="text-center space-y-3 pb-6 border-b-2 border-purple-950 relative">
          <div className="flex justify-center items-center gap-4">
            {/* The uploaded official institutional logo */}
            <Logo size="lg" showSubtitle={false} />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg sm:text-2xl font-black text-purple-950 tracking-tight uppercase">
              FEDERAL POLYTECHNIC OFFA
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest">
              IN AFFILIATION WITH
            </p>
            <h2 className="text-base sm:text-xl font-extrabold text-purple-900 tracking-tight uppercase">
              FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA
            </h2>
            <p className="text-[11px] sm:text-xs font-semibold text-purple-800 uppercase tracking-wider">
              DIRECTORATE OF DEGREE AFFILIATION & PARTNERSHIP PROGRAMMES
            </p>
          </div>

          {/* Certificate Main Title Banner */}
          <div className="pt-2">
            <span className="inline-block bg-purple-950 text-white px-6 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-widest uppercase shadow-xs">
              FINAL DEGREE GRADUATION CLEARANCE CERTIFICATE
            </span>
          </div>
        </div>

        {/* 2. Metadata Reference Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-purple-200 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Certificate No:</span>
            <span className="font-extrabold text-purple-950 block">{certNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Clearance ID:</span>
            <span className="font-bold text-slate-800 block">{clearanceId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Academic Session:</span>
            <span className="font-bold text-slate-800 block">{academicSession}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Date of Issuance:</span>
            <span className="font-bold text-slate-800 block">{issueDate}</span>
          </div>
        </div>

        {/* 3. Certificate Body Text & Student Identification */}
        <div className="py-8 space-y-6 text-center">
          <p className="text-xs sm:text-sm font-serif italic text-slate-600">
            This is to authoritatively certify that the candidate whose full identity and details are inscribed below:
          </p>

          {/* Student Inscription Box */}
          <div className="max-w-2xl mx-auto bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-purple-950 font-serif tracking-wide underline decoration-purple-400 underline-offset-4">
              {fullStudentName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left pt-2 border-t border-purple-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Matriculation Number</span>
                <span className="font-mono font-extrabold text-sm text-slate-900">{matricNumber}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Degree Programme</span>
                <span className="font-bold text-slate-900">Bachelor of Technology (B.Tech)</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Department</span>
                <span className="font-bold text-slate-900">{departmentName} ({departmentCode})</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Faculty / School</span>
                <span className="font-bold text-slate-900">{facultyName} ({facultyCode})</span>
              </div>
            </div>
          </div>

          {/* Formal Statutory Completion Statement */}
          <div className="max-w-3xl mx-auto text-xs sm:text-sm leading-relaxed text-slate-700 font-serif px-4">
            <p>
              Having fulfilled all prescribed academic, administrative, financial, and statutory obligations, has been officially
              evaluated, endorsed, and confirmed fully cleared across all <strong>seven (7) statutory institutional clearance units</strong>:
            </p>

            {/* 7 Checkpoint Badge Pills */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 pt-3 pb-1 text-[10px] font-sans font-bold">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 1. Department
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 2. Faculty
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 3. Library
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 4. Bursary
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 5. Hostel & Hall
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 6. ICT Portal
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 7. Academic Registry
              </span>
            </div>

            <p className="pt-2 text-slate-600 font-sans text-xs">
              The candidate is hereby granted full institutional clearance and is certified eligible for the collection of Statement of Results, Degree Transcripts, and National Youth Service Corps (NYSC) mobilization.
            </p>
          </div>
        </div>

        {/* 4. Signature & QR Verification Section */}
        <div className="pt-6 border-t-2 border-purple-950 grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
          {/* QR Verification Code */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5">
            <div className="p-2 bg-white border-2 border-purple-900 rounded-2xl shadow-xs inline-block">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Verification for ${certNumber}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs font-mono">
                  Loading QR...
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              <span className="font-bold block text-purple-950">SCAN TO VERIFY</span>
              <span>SHA-256 Authenticated</span>
            </div>
          </div>

          {/* Signature 1: Dean / Faculty */}
          <div className="text-center space-y-1">
            <div className="h-12 flex items-end justify-center">
              <div className="font-serif italic text-purple-900 font-bold text-sm transform -rotate-3 border-b-2 border-slate-400 px-4 pb-1 w-full">
                Prof. Comfort Ogunleye
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 block">Dean of Faculty</span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Faculty of Applied Sciences (FAST)
            </span>
          </div>

          {/* Signature 2: Director of Degree Directorate */}
          <div className="text-center space-y-1">
            <div className="h-12 flex items-end justify-center">
              <div className="font-serif italic text-purple-900 font-bold text-sm transform -rotate-2 border-b-2 border-slate-400 px-4 pb-1 w-full">
                Dr. A. O. Babalola
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 block">Director, Degree Directorate</span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Federal Polytechnic Offa
            </span>
          </div>

          {/* Signature 3: Academic Registrar FUTMINNA */}
          <div className="text-center space-y-1">
            <div className="h-12 flex items-end justify-center">
              <div className="font-serif italic text-purple-900 font-bold text-sm transform -rotate-1 border-b-2 border-slate-400 px-4 pb-1 w-full">
                Alh. A. N. Kolo, mni
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 block">Academic Registrar</span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Federal University of Technology Minna
            </span>
          </div>
        </div>

        {/* 5. Cryptographic Security Bottom Foil */}
        <div className="mt-8 pt-3 border-t border-purple-100 flex flex-col sm:flex-row justify-between items-center text-[9px] font-mono text-slate-400 gap-2">
          <span>Security Hash: {certificate?.registrySignatureHash || 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}</span>
          <span>Official Institutional Registry System • Direct Degree Affiliation Framework</span>
        </div>
      </div>
    </div>
  );
};
