/**
 * Institutional Branding and Clearance Configuration Constants
 * Case Study: Federal University of Technology, Minna (FUTMINNA)
 * In Affiliation with Federal Polytechnic Offa (FEDPOFFA)
 */

export const BRAND = {
  INSTITUTION_NAME: 'Federal University of Technology, Minna',
  AFFILIATION_NAME: 'Federal Polytechnic Offa Campus',
  SYSTEM_TITLE: 'Student Clearance Management System',
  SHORT_TITLE: 'FUTMINNA-FEDPOFFA E-CLEARANCE',
  LOGO_PATH: '/assets/logo-degree2x.png',
  
  // Official Institutional Palette
  COLORS: {
    PRIMARY: '#4B0082',        // Institutional Deep Purple
    PRIMARY_DARK: '#380061',   // Dark Accent Purple
    SECONDARY: '#6A1B9A',      // Medium Vibrant Purple
    LIGHT: '#F3EAF8',          // Soft Accent Purple
    VERY_LIGHT: '#FAF7FC',     // Very Light Purple Surface
    PAGE_BG: '#F7F7F9',        // Application Neutral Background
    SURFACE: '#FFFFFF',        // White Surface
    TEXT_PRIMARY: '#1F2937',   // Slate 800 Primary Text
    TEXT_MUTED: '#6B7280',     // Gray 500 Secondary Text
    BORDER: '#E5E7EB',         // Neutral Gray 200 Border
    
    // Standard Status Colors
    STATUS_APPROVED: '#16A34A', // Success Green
    STATUS_PENDING: '#F59E0B',  // Warning Amber
    STATUS_REJECTED: '#DC2626', // Error Red
    STATUS_CURRENT: '#4B0082',  // Active Stage Purple
    STATUS_INFO: '#2563EB',     // Information Blue
  }
} as const;

export const DEFAULT_WORKFLOW_STAGES = [
  {
    stageCode: 'DEPARTMENT',
    stageName: 'Departmental Clearance',
    responsibleRole: 'DEPARTMENT_OFFICER',
    sequenceOrder: 1,
    description: 'Verification of departmental laboratory equipment, student dues, project submission, and academic clearance.',
  },
  {
    stageCode: 'FACULTY',
    stageName: 'Faculty Office Clearance',
    responsibleRole: 'FACULTY_OFFICER',
    sequenceOrder: 2,
    description: 'Faculty-level compliance check, academic board recommendation, and faculty record validation.',
  },
  {
    stageCode: 'LIBRARY',
    stageName: 'University Library Clearance',
    responsibleRole: 'LIBRARY_OFFICER',
    sequenceOrder: 3,
    description: 'Confirmation of book returns, settlement of overdue library fines, and e-library status.',
  },
  {
    stageCode: 'BURSARY',
    stageName: 'Bursary Department Clearance',
    responsibleRole: 'BURSARY_OFFICER',
    sequenceOrder: 4,
    description: 'Verification of tuition payments, graduation fee receipts, caution deposit audits, and financial clearance.',
  },
  {
    stageCode: 'HOSTEL',
    stageName: 'Hostel & Hall Management Clearance',
    responsibleRole: 'HOSTEL_OFFICER',
    sequenceOrder: 5,
    description: 'Verification of hostel room key handovers, damages assessment, and residential hall clearance.',
  },
  {
    stageCode: 'ICT',
    stageName: 'ICT & E-Portal Clearance',
    responsibleRole: 'ICT_OFFICER',
    sequenceOrder: 6,
    description: 'Deactivation of student network credentials, institutional email clearance, and digital services verification.',
  },
  {
    stageCode: 'REGISTRY',
    stageName: 'Academic Registry Final Clearance',
    responsibleRole: 'REGISTRY_OFFICER',
    sequenceOrder: 7,
    description: 'Final institutional audit, Senate clearance confirmation, and electronic certificate generation.',
  }
] as const;

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Graduating Student',
  DEPARTMENT_OFFICER: 'Departmental Clearance Officer',
  FACULTY_OFFICER: 'Faculty Officer / Dean Representative',
  LIBRARY_OFFICER: 'Library Clearance Officer',
  BURSARY_OFFICER: 'Bursary Clearance Officer',
  HOSTEL_OFFICER: 'Hostel Affairs Officer',
  ICT_OFFICER: 'ICT Directorate Officer',
  REGISTRY_OFFICER: 'Academic Affairs Registry Officer',
  SUPER_ADMIN: 'Super Administrator',
};
