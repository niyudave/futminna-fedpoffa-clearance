/**
 * Core System Types & Interfaces
 * Web-Based Student Clearance Management System (FUTMINNA / FEDPOFFA)
 */

export type UserRole =
  | 'STUDENT'
  | 'DEPARTMENT_OFFICER'
  | 'FACULTY_OFFICER'
  | 'LIBRARY_OFFICER'
  | 'BURSARY_OFFICER'
  | 'HOSTEL_OFFICER'
  | 'ICT_OFFICER'
  | 'REGISTRY_OFFICER'
  | 'SUPER_ADMIN';

export type ClearanceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'COMPLETED';

export type StageStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type StageCode =
  | 'DEPARTMENT'
  | 'FACULTY'
  | 'LIBRARY'
  | 'BURSARY'
  | 'HOSTEL'
  | 'ICT'
  | 'REGISTRY';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ClearanceDocument {
  id: string;
  clearanceRequestId: string;
  stageNumber: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  status: DocumentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  departmentId?: string;
  facultyId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  matricNumber: string;
  departmentName: string;
  facultyName: string;
  programme: string;
  level: string;
  graduatingSession: string;
  phone: string;
  passportUrl?: string;
}

export interface ClearanceStageItem {
  id: string;
  stageCode: StageCode;
  stageName: string;
  sequenceOrder: number;
  status: StageStatus;
  reviewedBy?: string;
  reviewerRole?: UserRole;
  remarks?: string;
  rejectionReason?: string;
  actionDate?: string;
}

export interface ClearanceRequest {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  departmentName: string;
  facultyName: string;
  academicSession: string;
  status: ClearanceStatus;
  currentStageIndex: number;
  stages: ClearanceStageItem[];
  documents?: ClearanceDocument[];
  certificateNumber?: string;
  qrCodeHash?: string;
  submittedAt: string;
  completedAt?: string;
}

export interface SystemHealthResponse {
  status: 'ok' | 'error';
  storageBackend?: 'MYSQL' | 'IN_MEMORY_FALLBACK';
  service: string;
  institution: string;
  academicAffiliation: string;
  timestamp: string;
  environment: string;
  database: {
    storageBackend?: 'MYSQL' | 'IN_MEMORY_FALLBACK';
    engine: string;
    status?: string;
    connected?: boolean;
    latencyMs?: number | null;
    error?: string | null;
    schemaValid?: boolean;
    modelsCount?: number;
  };
  workflow: {
    defaultStagesCount: number;
    configuredSequence: string[];
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
