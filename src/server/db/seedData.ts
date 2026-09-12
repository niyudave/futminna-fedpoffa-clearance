/**
 * Seed Data Definitions for FUTMINNA-FEDPOFFA E-Clearance System
 * Contains normative baseline institutional master records.
 * Note: Non-real synthetic test accounts used for research demonstration.
 */

import bcrypt from 'bcryptjs';

export const INITIAL_ROLES = [
  {
    name: 'STUDENT',
    displayName: 'Graduating Student',
    description: 'Final-year student seeking graduation and certificate clearance across all academic and service units.',
    isSystem: true,
  },
  {
    name: 'HOD',
    displayName: 'Head of Department (Department Officer)',
    description: 'Academic departmental head responsible for Stage 1 Departmental Clearance & project verification.',
    isSystem: true,
  },
  {
    name: 'DEAN',
    displayName: 'Dean of Faculty / School (Faculty Administrator)',
    description: 'Faculty executive responsible for Stage 2 School-level clearance endorsement.',
    isSystem: true,
  },
  {
    name: 'LIBRARIAN',
    displayName: 'University / Poly Librarian (Library Officer)',
    description: 'Library division clearance officer verifying book returns and overdue settlements for Stage 3.',
    isSystem: true,
  },
  {
    name: 'BURSAR',
    displayName: 'Bursary & Finance Officer',
    description: 'Financial clearance officer verifying full payment of school fees, graduation dues, and receipts for Stage 4.',
    isSystem: true,
  },
  {
    name: 'STUDENT_AFFAIRS',
    displayName: 'Student Affairs & Hostel Officer',
    description: 'Hostel and student discipline clearance officer for Stage 5.',
    isSystem: true,
  },
  {
    name: 'ICT_DIRECTOR',
    displayName: 'ICT & E-Portal Administrator (ICT Officer)',
    description: 'Portal and e-clearance identity verification officer for Stage 6.',
    isSystem: true,
  },
  {
    name: 'REGISTRY',
    displayName: 'Academic Registry & Examinations Officer',
    description: 'Final clearance authority generating official cryptographically signed Clearance Certificate in Stage 7.',
    isSystem: true,
  },
  {
    name: 'SUPER_ADMIN',
    displayName: 'Institutional System Administrator (Super Admin)',
    description: 'Full administrative control over user accounts, workflow configuration, and immutable security audit logs.',
    isSystem: true,
  },
];

export const INITIAL_PERMISSIONS = [
  // Clearance permissions
  { code: 'CLEARANCE_REQUEST_CREATE', name: 'Submit Clearance Request', module: 'CLEARANCE', description: 'Initiate new institutional clearance process' },
  { code: 'CLEARANCE_REQUEST_VIEW_SELF', name: 'View Own Clearance', module: 'CLEARANCE', description: 'Track progress and status of personal clearance' },
  { code: 'CLEARANCE_REQUEST_VIEW_ALL', name: 'View All Clearances', module: 'CLEARANCE', description: 'Access institutional clearance queue' },
  { code: 'CLEARANCE_STAGE_APPROVE', name: 'Endorse Stage Approval', module: 'CLEARANCE', description: 'Digitally approve student clearance stage' },
  { code: 'CLEARANCE_STAGE_REJECT', name: 'Reject Clearance Stage', module: 'CLEARANCE', description: 'Flag remarks and reject student stage with required corrections' },
  { code: 'CLEARANCE_STAGE_WAIVE', name: 'Waive Clearance Stage', module: 'CLEARANCE', description: 'Authorized waiver for non-applicable requirements' },
  
  // Certificate permissions
  { code: 'CERTIFICATE_GENERATE', name: 'Generate Clearance Certificate', module: 'CERTIFICATE', description: 'Issue official tamper-evident QR certificate' },
  { code: 'CERTIFICATE_VERIFY', name: 'Verify Certificate Authenticity', module: 'CERTIFICATE', description: 'Public and registry verification of digital certificate' },
  { code: 'CERTIFICATE_REVOKE', name: 'Revoke Clearance Certificate', module: 'CERTIFICATE', description: 'Revoke invalid or disputed clearance certificates' },
  
  // Reporting & Audit
  { code: 'AUDIT_LOG_VIEW', name: 'View Security Audit Trail', module: 'AUDIT', description: 'Inspect cryptographically linked action ledger' },
  { code: 'AUDIT_LOG_EXPORT', name: 'Export Audit Logs', module: 'AUDIT', description: 'Download compliance audit logs for external accreditation' },
  
  // User & Academic Setup
  { code: 'USER_MANAGE', name: 'Manage Institutional Users', module: 'USER', description: 'Create and assign staff officer roles' },
  { code: 'WORKFLOW_CONFIGURE', name: 'Configure Clearance Sequence', module: 'SYSTEM', description: 'Update workflow stages and required document rules' },
  { code: 'SYSTEM_SETTINGS_EDIT', name: 'Edit System Settings', module: 'SYSTEM', description: 'Modify institution-wide parameters' },
];

export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  STUDENT: [
    'CLEARANCE_REQUEST_CREATE',
    'CLEARANCE_REQUEST_VIEW_SELF',
    'CERTIFICATE_VERIFY',
  ],
  HOD: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_VERIFY',
  ],
  DEAN: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_VERIFY',
  ],
  LIBRARIAN: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_VERIFY',
  ],
  BURSAR: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CLEARANCE_STAGE_WAIVE',
    'CERTIFICATE_VERIFY',
  ],
  STUDENT_AFFAIRS: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_VERIFY',
  ],
  ICT_DIRECTOR: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_VERIFY',
  ],
  REGISTRY: [
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CERTIFICATE_GENERATE',
    'CERTIFICATE_REVOKE',
    'CERTIFICATE_VERIFY',
    'AUDIT_LOG_VIEW',
  ],
  SUPER_ADMIN: [
    'CLEARANCE_REQUEST_CREATE',
    'CLEARANCE_REQUEST_VIEW_SELF',
    'CLEARANCE_REQUEST_VIEW_ALL',
    'CLEARANCE_STAGE_APPROVE',
    'CLEARANCE_STAGE_REJECT',
    'CLEARANCE_STAGE_WAIVE',
    'CERTIFICATE_GENERATE',
    'CERTIFICATE_VERIFY',
    'CERTIFICATE_REVOKE',
    'AUDIT_LOG_VIEW',
    'AUDIT_LOG_EXPORT',
    'USER_MANAGE',
    'WORKFLOW_CONFIGURE',
    'SYSTEM_SETTINGS_EDIT',
  ],
};

export const INITIAL_FACULTIES = [
  {
    code: 'FAST',
    name: 'School of Applied Sciences & Technology (FUTMINNA Affiliation)',
    description: 'Science and computer technology degree programmes under FUTMINNA academic moderation.',
  },
  {
    code: 'FBMS',
    name: 'School of Business & Management Studies',
    description: 'Financial, accounting, and business administration divisions.',
  },
  {
    code: 'FE',
    name: 'School of Engineering Technology',
    description: 'Electrical, civil, and mechanical engineering technologies.',
  },
  {
    code: 'FICS',
    name: 'School of Information & Communication Technology',
    description: 'Software development, telecommunications, and digital library studies.',
  },
];

export const INITIAL_DEPARTMENTS = [
  {
    facultyCode: 'FAST',
    code: 'CSC',
    name: 'Department of Computer Science (B.Tech / HND Affiliated)',
    description: 'Degree and Higher Diploma computing programmes with specialized research projects.',
  },
  {
    facultyCode: 'FAST',
    code: 'SLT',
    name: 'Department of Science Laboratory Technology',
    description: 'Biochemistry, microbiology, and physics instrumentation options.',
  },
  {
    facultyCode: 'FE',
    code: 'EEE',
    name: 'Department of Electrical & Electronic Engineering',
    description: 'Power systems, electronics, and telecommunications.',
  },
  {
    facultyCode: 'FBMS',
    code: 'ACC',
    name: 'Department of Accountancy & Financial Studies',
    description: 'Professional accounting and audit tracking programs.',
  },
  {
    facultyCode: 'FICS',
    code: 'LIS',
    name: 'Department of Library & Information Science',
    description: 'Information repositories and archive management.',
  },
];

export const INITIAL_WORKFLOW = {
  name: 'Standard FUTMINNA-FEDPOFFA Degree & Diploma Clearance Sequence',
  academicSession: '2024/2025',
  programmeType: 'AFFILIATE_DEGREE',
  isActive: true,
  description: 'Mandatory 7-stage sequential clearance verification across academic departments, service centres, bursary, and academic registry.',
  stages: [
    {
      stageNumber: 1,
      stageCode: 'DEPT',
      name: 'Departmental Clearance',
      description: 'Departmental project submission, laboratory equipment return, and HOD academic clearance sign-off.',
      requiredRoleName: 'HOD',
      requiresDocumentUpload: true,
      requiredDocumentNames: JSON.stringify(['Final Project CD / Hardcover Copy Proof', 'Departmental Association Dues Receipt']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 2,
      stageCode: 'FACULTY',
      name: 'Faculty Office Clearance',
      description: 'Faculty / School Dean verification of academic standing, transcript ledger, and faculty dues settlement.',
      requiredRoleName: 'DEAN',
      requiresDocumentUpload: true,
      requiredDocumentNames: JSON.stringify(['Faculty Dues Payment Remita Receipt']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 3,
      stageCode: 'LIBRARY',
      name: 'University & Polytechnic Library Clearance',
      description: 'Verification of borrowed textbook returns, inter-library loan balance, and electronic library registration cards.',
      requiredRoleName: 'LIBRARIAN',
      requiresDocumentUpload: false,
      requiredDocumentNames: JSON.stringify(['Library Borrower Card / ID Proof']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 4,
      stageCode: 'BURSARY',
      name: 'Bursary Department Clearance',
      description: 'Comprehensive financial reconciliation: verification of full tuition fees, acceptance receipts, and graduation levies.',
      requiredRoleName: 'BURSAR',
      requiresDocumentUpload: true,
      requiredDocumentNames: JSON.stringify(['All Sessions School Fees Remita Receipts', 'Graduation & Convocation Fee Teller']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 5,
      stageCode: 'HOSTEL_STUDENT_AFFAIRS',
      name: 'Hostel & Student Affairs Clearance',
      description: 'Hall of residence room key surrender, damage inspection assessment, and student discipline check.',
      requiredRoleName: 'STUDENT_AFFAIRS',
      requiresDocumentUpload: false,
      requiredDocumentNames: JSON.stringify(['Hostel Accommodation Slip / Off-Campus Undertaking']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 6,
      stageCode: 'ICT_PORTAL',
      name: 'ICT & E-Portal Clearance',
      description: 'Bio-data verification, portal profile lock, FUTMINNA affiliation matriculation number synchronization.',
      requiredRoleName: 'ICT_DIRECTOR',
      requiresDocumentUpload: false,
      requiredDocumentNames: JSON.stringify(['E-Portal Biodata Printout']),
      isSequential: true,
      isFinalStage: false,
    },
    {
      stageNumber: 7,
      stageCode: 'REGISTRY',
      name: 'Academic Registry Final Clearance',
      description: 'Final institutional audit by Registrar / Academic Secretary. Issues official tamper-evident QR Certificate upon approval.',
      requiredRoleName: 'REGISTRY',
      requiresDocumentUpload: false,
      requiredDocumentNames: JSON.stringify(['Consolidated Stage 1-6 Endorsement Sheet']),
      isSequential: true,
      isFinalStage: true,
    },
  ],
};

export const INITIAL_SYSTEM_SETTINGS = [
  {
    key: 'INSTITUTION_NAME_PRIMARY',
    value: 'Federal University of Technology, Minna (FUTMINNA)',
    category: 'AFFILIATION',
    description: 'Degree-awarding affiliated university.',
  },
  {
    key: 'INSTITUTION_NAME_AFFILIATE',
    value: 'Federal Polytechnic Offa (FEDPOFFA), Kwara State',
    category: 'AFFILIATION',
    description: 'Host study centre and polytechnic partner.',
  },
  {
    key: 'CURRENT_ACADEMIC_SESSION',
    value: '2024/2025',
    category: 'GENERAL',
    description: 'Active academic session for clearance processing.',
  },
  {
    key: 'ENABLE_STRICT_SEQUENTIAL_ENFORCEMENT',
    value: 'true',
    category: 'WORKFLOW',
    description: 'When true, students cannot be cleared for stage N+1 until stage N is APPROVED.',
  },
  {
    key: 'CERTIFICATE_QR_BASE_URL',
    value: 'https://ais-pre-gi7e7x565qdx4tjal7bb6e-253684413747.europe-west2.run.app/verify',
    category: 'SECURITY',
    description: 'Public URL path encoded into verification QR codes for instant offline/online authenticity validation.',
  },
  {
    key: 'AUDIT_LOG_IMMUTABLE_HASHING',
    value: 'SHA-256',
    category: 'SECURITY',
    description: 'Cryptographic algorithm used to link sequential audit log checksums.',
  },
];

// Standard demonstration password for all synthetic seed accounts (Never stored plaintext)
// Real bcrypt hash with 10 salt rounds:
export const DEFAULT_DEMO_PASSWORD = 'Password@2026!';
export const DEFAULT_BCRYPT_HASH = bcrypt.hashSync(DEFAULT_DEMO_PASSWORD, bcrypt.genSaltSync(10));

export interface DemoAccountDefinition {
  email: string;
  role: string;
  roleTitle: string;
  firstName: string;
  lastName: string;
  matricNumber?: string;
  departmentCode?: string;
  facultyCode?: string;
  description: string;
}

export const CANONICAL_DEMO_USERS: DemoAccountDefinition[] = [
  {
    email: 'student.test@futminna-fedpoffa.edu.ng',
    role: 'STUDENT',
    roleTitle: 'Graduating Student',
    firstName: 'Ibrahim',
    lastName: 'Adeyemi',
    matricNumber: '2020/1/89420CS',
    departmentCode: 'CSC',
    facultyCode: 'FAST',
    description: 'Final-year Computer Science B.Tech affiliate student undergoing 7-stage clearance.',
  },
  {
    email: 'hod.csc@fedpoffa.edu.ng',
    role: 'HOD',
    roleTitle: 'Department Officer (HOD Computer Science)',
    firstName: 'Dr. Abubakar',
    lastName: 'Suleiman',
    departmentCode: 'CSC',
    facultyCode: 'FAST',
    description: 'Stage 1 reviewer verifying departmental project submissions and lab accounts.',
  },
  {
    email: 'dean.fast@fedpoffa.edu.ng',
    role: 'DEAN',
    roleTitle: 'Faculty Administrator (Dean Applied Sciences)',
    firstName: 'Prof. Comfort',
    lastName: 'Ogunleye',
    facultyCode: 'FAST',
    description: 'Stage 2 reviewer endorsing faculty-level academic standing and faculty dues.',
  },
  {
    email: 'library.officer@fedpoffa.edu.ng',
    role: 'LIBRARIAN',
    roleTitle: 'Library Officer (Polytechnic & University Library)',
    firstName: 'Mr. Solomon',
    lastName: 'Eze',
    description: 'Stage 3 reviewer checking Koha library ledger and borrowed textbook returns.',
  },
  {
    email: 'bursar.clearance@fedpoffa.edu.ng',
    role: 'BURSAR',
    roleTitle: 'Bursary Officer (Bursary & Student Accounts)',
    firstName: 'Mr. Emmanuel',
    lastName: 'Kareem',
    description: 'Stage 4 reviewer verifying school fees, acceptance fees, and Remita receipts.',
  },
  {
    email: 'studentaffairs@fedpoffa.edu.ng',
    role: 'STUDENT_AFFAIRS',
    roleTitle: 'Hostel Officer (Hostel & Student Affairs)',
    firstName: 'Hajia Zainab',
    lastName: 'Mohammed',
    description: 'Stage 5 reviewer checking hall of residence key returns and discipline records.',
  },
  {
    email: 'ict.director@fedpoffa.edu.ng',
    role: 'ICT_DIRECTOR',
    roleTitle: 'ICT Officer (ICT & E-Portal Centre)',
    firstName: 'Engr. Daniel',
    lastName: 'Olatunji',
    description: 'Stage 6 reviewer performing portal profile lock and biodata synchronization.',
  },
  {
    email: 'registry.clearance@futminna.edu.ng',
    role: 'REGISTRY',
    roleTitle: 'Registry Officer (Academic Registry & Exams)',
    firstName: 'Mrs. Fatima',
    lastName: 'Bello',
    description: 'Stage 7 reviewer with certificate generation and revocation authority.',
  },
  {
    email: 'admin.super@futminna-fedpoffa.edu.ng',
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Administrator (Institutional Admin)',
    firstName: 'System',
    lastName: 'Administrator',
    description: 'Full administrative access: user management, role assignments, workflow & audit logs.',
  },
];
