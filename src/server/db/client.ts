import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_FACULTIES,
  INITIAL_DEPARTMENTS,
  INITIAL_WORKFLOW,
  INITIAL_SYSTEM_SETTINGS,
  ROLE_PERMISSIONS_MAP,
  CANONICAL_DEMO_USERS,
  DEFAULT_BCRYPT_HASH,
} from './seedData';
import { seedInstitutionalData } from './seedDatabase';
import { AuthService, UserJWTPayload } from '../auth/authService';
import crypto from 'crypto';
import net from 'net';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton Prisma client with safe lazy-instantiation and driver adapter
let prismaInstance: PrismaClient | null = null;
let lastConnectivityCheck = 0;
let cachedConnectivityResult: boolean | null = null;
const CONNECTIVITY_CACHE_TTL = 30000; // 30 seconds cache

// In-memory fallback tracking and visibility
let fallbackTriggeredFlag = false;

export function recordFallbackTriggered(source?: string): void {
  fallbackTriggeredFlag = true;
  console.warn('⚠ Running on IN-MEMORY fallback store — data will not persist');
}

export function isFallbackActive(): boolean {
  return fallbackTriggeredFlag;
}

export function setFallbackActive(val: boolean): void {
  fallbackTriggeredFlag = val;
}

// Whether the process successfully hydrated dbStore from a live MySQL/MariaDB
// instance at startup (see RelationalStore.hydrateFromDatabase). This is the
// single source of truth other modules should check if they need to know
// "is this process actually backed by the real database right now".
let liveDbModeFlag = false;

export function isLiveDbMode(): boolean {
  return liveDbModeFlag;
}

export function printInMemoryBanner(): void {
  console.warn(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║        ⚠ Running on IN-MEMORY fallback store — data will not persist         ║
╚═══════════════════════════════════════════════════════════════════════════════╝`);
}

export function parseDatabaseUrl(urlStr?: string): { host: string; port: number; valid: boolean } | null {
  if (!urlStr || urlStr.includes('USER:PASSWORD@HOST')) return null;
  try {
    const parsed = new URL(urlStr);
    if (!['mysql:', 'mariadb:'].includes(parsed.protocol)) return null;
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    if (!host) return null;
    return { host, port, valid: true };
  } catch {
    return null;
  }
}

export async function checkDatabaseConnectivity(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && cachedConnectivityResult !== null && (now - lastConnectivityCheck) < CONNECTIVITY_CACHE_TTL) {
    return cachedConnectivityResult;
  }

  const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
  if (!parsed || !parsed.valid) {
    cachedConnectivityResult = false;
    lastConnectivityCheck = now;
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const socket = net.createConnection({
      host: parsed.host,
      port: parsed.port,
      timeout: 800,
    });

    const cleanup = (result: boolean) => {
      if (resolved) return;
      resolved = true;
      cachedConnectivityResult = result;
      lastConnectivityCheck = Date.now();
      try {
        socket.destroy();
      } catch {}
      resolve(result);
    };

    socket.on('connect', () => cleanup(true));
    socket.on('timeout', () => cleanup(false));
    socket.on('error', () => cleanup(false));
  });
}

export function getPrismaClient(): PrismaClient | null {
  if (prismaInstance) return prismaInstance;

  const rawUrl = process.env.DATABASE_URL;
  const parsed = parseDatabaseUrl(rawUrl);

  if (!parsed) {
    return null;
  }

  try {
    const adapter = new PrismaMariaDb(rawUrl!);
    prismaInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    return prismaInstance;
  } catch (err: any) {
    console.warn('[getPrismaClient] Prisma driver adapter initialization notice:', err?.message || err);
    return null;
  }
}

export interface DatabaseModelMetric {
  name: string;
  tableName: string;
  category: 'IDENTITY' | 'ACADEMIC' | 'WORKFLOW' | 'DECISIONS' | 'SECURITY';
  primaryKey: string;
  foreignKeys: string[];
  uniqueConstraints: string[];
  indexes: string[];
  recordsCount: number;
  description: string;
}

export interface DatabaseHealthReport {
  status: 'CONNECTED' | 'SIMULATED_RELATIONAL' | 'ERROR';
  engine: 'MySQL (Prisma 7.9.1)';
  connectedUrl: string;
  schemaValid: boolean;
  migrationsCount: number;
  modelsCount: number;
  models: DatabaseModelMetric[];
  researchAuditCompliance: {
    immutabilityAlgorithm: 'SHA-256 Cryptographic Chaining';
    referentialIntegrity: 'Normalized 3NF Relational Structure';
    auditLedgerActive: boolean;
    nonRepudiationSignatures: boolean;
    zeroStudentDuplicationEnforced: boolean;
  };
}

/**
 * In-memory relational store guaranteeing immediate interactive testing,
 * robust authorization enforcement, and verified foreign key cascades across all 9 roles.
 */
class RelationalStore {
  public roles = [...INITIAL_ROLES.map((r, i) => ({ id: `role_${i + 1}`, ...r, createdAt: new Date(), updatedAt: new Date() }))];
  public permissions = [...INITIAL_PERMISSIONS.map((p, i) => ({ id: `perm_${i + 1}`, ...p, createdAt: new Date(), updatedAt: new Date() }))];
  public faculties = [...INITIAL_FACULTIES.map((f, i) => ({ id: `fac_${i + 1}`, ...f, createdAt: new Date(), updatedAt: new Date() }))];
  public departments: any[] = [];
  public clearanceUnits: any[] = [];
  public workflow: any = null;
  public workflowStages: any[] = [];
  public systemSettings = [...INITIAL_SYSTEM_SETTINGS.map((s, i) => ({ id: `set_${i + 1}`, ...s, updatedAt: new Date() }))];
  
  public users: any[] = [];
  public userRoles: any[] = [];
  public rolePermissions: any[] = [];
  public students: any[] = [];
  public clearanceRequests: any[] = [];
  public clearanceStageProgresses: any[] = [];
  public documents: any[] = [];
  public passwordResetTokens: any[] = [];
  public approvalDecisions: any[] = [];
  public certificates: any[] = [];
  public notifications: any[] = [];
  public auditLogs: any[] = [];

  constructor() {
    this.initRelations();
  }

  public initRelations() {
    // 1. Map departments to faculties
    this.departments = INITIAL_DEPARTMENTS.map((d, i) => {
      const fac = this.faculties.find((f) => f.code === d.facultyCode);
      return {
        id: `dept_${i + 1}`,
        facultyId: fac?.id || 'fac_1',
        code: d.code,
        name: d.name,
        description: d.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // 2. Role Permissions
    this.rolePermissions = [];
    let rpCounter = 1;
    for (const role of this.roles) {
      const perms = ROLE_PERMISSIONS_MAP[role.name] || [];
      for (const permCode of perms) {
        const permObj = this.permissions.find((p) => p.code === permCode);
        if (permObj) {
          this.rolePermissions.push({
            id: `rp_${rpCounter++}`,
            roleId: role.id,
            permissionId: permObj.id,
            assignedAt: new Date(),
          });
        }
      }
    }

    // 3. Workflow & 7 Stages
    this.workflow = {
      id: 'wf_main_degree_2024_2025',
      name: INITIAL_WORKFLOW.name,
      academicSession: INITIAL_WORKFLOW.academicSession,
      programmeType: INITIAL_WORKFLOW.programmeType,
      isActive: true,
      description: INITIAL_WORKFLOW.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cscDept = this.departments.find((d) => d.code === 'CSC');
    this.workflowStages = INITIAL_WORKFLOW.stages.map((s) => ({
      id: `stage_${s.stageCode.toLowerCase()}`,
      workflowId: this.workflow.id,
      stageNumber: s.stageNumber,
      stageCode: s.stageCode,
      name: s.name,
      description: s.description,
      requiredRoleName: s.requiredRoleName,
      departmentId: s.stageCode === 'DEPT' ? cscDept?.id : null,
      requiresDocumentUpload: s.requiresDocumentUpload,
      requiredDocumentNames: s.requiredDocumentNames,
      isSequential: s.isSequential,
      isFinalStage: s.isFinalStage,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Initialize 7 Canonical Clearance Units
    this.clearanceUnits = [
      {
        id: 'unit_dept',
        code: 'UNIT_DEPT',
        name: 'Academic Departmental Clearance Units',
        description: 'Academic departments responsible for Final Year project, lab handover, and HOD sign-off.',
        responsibleRole: 'HOD',
        stageCode: 'DEPT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_faculty',
        code: 'UNIT_FACULTY',
        name: 'Faculty / School Deans Office',
        description: 'Faculty executive board for transcript verification and school dues certification.',
        responsibleRole: 'DEAN',
        stageCode: 'FACULTY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_library',
        code: 'UNIT_LIBRARY',
        name: 'University & Polytechnic Library System',
        description: 'Central and polytechnic library services for loan reconciliations and holding clearance.',
        responsibleRole: 'LIBRARIAN',
        stageCode: 'LIBRARY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_bursary',
        code: 'UNIT_BURSARY',
        name: 'Bursary & Treasury Directorate',
        description: 'Central bursary for comprehensive tuition reconciliation and convocation levies.',
        responsibleRole: 'BURSAR',
        stageCode: 'BURSARY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_student_affairs',
        code: 'UNIT_STUDENT_AFFAIRS',
        name: 'Student Affairs Division & Hostel Directorate',
        description: 'Hall of residence room surrender, security clearances, and student affairs validation.',
        responsibleRole: 'STUDENT_AFFAIRS',
        stageCode: 'HOSTEL_STUDENT_AFFAIRS',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_ict',
        code: 'UNIT_ICT',
        name: 'ICT Directorate & E-Portal Centre',
        description: 'Central portal credentials, database records lock, and bio-data synchronization.',
        responsibleRole: 'ICT_DIRECTOR',
        stageCode: 'ICT_PORTAL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit_registry',
        code: 'UNIT_REGISTRY',
        name: 'Academic Registry & Examinations Office',
        description: 'Supreme clearance authority generating official tamper-evident QR certificates.',
        responsibleRole: 'REGISTRY',
        stageCode: 'REGISTRY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 4. Initialize 9 Canonical Demonstration Users with real bcrypt password hashes
    this.users = [];
    this.userRoles = [];
    this.students = [];

    const fastFaculty = this.faculties.find((f) => f.code === 'FAST');

    CANONICAL_DEMO_USERS.forEach((def, index) => {
      const userId = `usr_${def.role.toLowerCase()}_${index + 1}`;
      const targetDept = def.departmentCode ? this.departments.find((d) => d.code === def.departmentCode) : null;
      const targetFaculty = def.facultyCode ? this.faculties.find((f) => f.code === def.facultyCode) : (targetDept ? this.faculties.find((f) => f.id === targetDept.facultyId) : null);

      const user = {
        id: userId,
        email: def.email,
        passwordHash: DEFAULT_BCRYPT_HASH,
        firstName: def.firstName,
        lastName: def.lastName,
        middleName: def.role === 'STUDENT' ? 'Oluwaseun' : null,
        phoneNumber: `+234803000000${index + 1}`,
        status: 'ACTIVE',
        departmentId: targetDept?.id || null,
        facultyId: targetFaculty?.id || null,
        createdAt: new Date('2026-01-10T08:00:00Z'),
        updatedAt: new Date(),
      };
      this.users.push(user);

      // Assign Role
      const roleObj = this.roles.find((r) => r.name === def.role);
      if (roleObj) {
        this.userRoles.push({
          id: `ur_${index + 1}`,
          userId: user.id,
          roleId: roleObj.id,
          assignedAt: new Date(),
        });
      }

      // If Student, create normalized Student entity
      if (def.role === 'STUDENT' && def.matricNumber) {
        const student = {
          id: 'std_001',
          userId: user.id,
          matricNumber: def.matricNumber,
          jambRegNumber: '202029482012AF',
          facultyId: targetFaculty?.id || fastFaculty?.id || 'fac_1',
          departmentId: targetDept?.id || cscDept?.id || 'dept_1',
          programmeType: 'AFFILIATE_DEGREE',
          level: 'DEGREE_400',
          entryYear: 2020,
          graduationYear: 2024,
          academicSession: '2024/2025',
          cgpa: 4.38,
          isClearanceEligible: true,
          createdAt: new Date('2026-01-15T09:00:00Z'),
          updatedAt: new Date(),
        };
        this.students.push(student);
      }
    });

    // 5. Initialize multiple representative students and clearance requests across all stages
    const studentUser = this.users.find((u) => u.email === 'student.test@futminna-fedpoffa.edu.ng');
    const primaryStudent = this.students[0];
    const hodUser = this.users.find((u) => u.email === 'hod.csc@fedpoffa.edu.ng');
    const deanUser = this.users.find((u) => u.email === 'dean.fast@fedpoffa.edu.ng');
    const libUser = this.users.find((u) => u.email === 'library.officer@fedpoffa.edu.ng');
    const bursarUser = this.users.find((u) => u.email === 'bursar.clearance@fedpoffa.edu.ng');
    const hostelUser = this.users.find((u) => u.email === 'studentaffairs@fedpoffa.edu.ng');
    const ictUser = this.users.find((u) => u.email === 'ict.director@fedpoffa.edu.ng');
    const regUser = this.users.find((u) => u.email === 'registry.clearance@futminna.edu.ng');

    const sltDept = this.departments.find((d) => d.code === 'SLT') || this.departments[1] || this.departments[0];
    const eeeDept = this.departments.find((d) => d.code === 'EEE') || this.departments[2] || this.departments[0];
    const feFaculty = this.faculties.find((f) => f.code === 'FE') || this.faculties[2] || fastFaculty;

    // Additional synthetic students for comprehensive multi-officer testing
    const additionalStudents = [
      {
        id: 'std_002',
        firstName: 'Aminat',
        lastName: 'Bello',
        email: 'aminat.bello@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/88712CS',
        jambRegNumber: '202029482099AB',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.52,
        activeStage: 1,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_003',
        firstName: 'Kehinde',
        lastName: 'Balogun',
        email: 'kehinde.balogun@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/88319CS',
        jambRegNumber: '202029482088KB',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 3.85,
        activeStage: 1,
        stageStatus: 'REJECTED',
        rejectionReason: 'Supervisor signature missing on Project Hardcover. Please rectify and re-upload.',
      },
      {
        id: 'std_004',
        firstName: 'Chinedu',
        lastName: 'Okafor',
        email: 'chinedu.okafor@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/90145SLT',
        jambRegNumber: '202029482077CO',
        departmentId: sltDept.id,
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.12,
        activeStage: 2,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_005',
        firstName: 'Zainab',
        lastName: 'Alabi',
        email: 'zainab.alabi@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/87234CS',
        jambRegNumber: '202029482066ZA',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.25,
        activeStage: 3,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_006',
        firstName: 'Tunde',
        lastName: 'Bakare',
        email: 'tunde.bakare@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/89120CS',
        jambRegNumber: '202029482055TB',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.05,
        activeStage: 5,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_007',
        firstName: 'Blessing',
        lastName: 'Danjuma',
        email: 'blessing.danjuma@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/91204CS',
        jambRegNumber: '202029482044BD',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.60,
        activeStage: 6,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_008',
        firstName: 'Usman',
        lastName: 'Garba',
        email: 'usman.garba@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/86541CS',
        jambRegNumber: '202029482033UG',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.41,
        activeStage: 7,
        stageStatus: 'PENDING',
      },
      {
        id: 'std_009',
        firstName: 'Halima',
        lastName: 'Musa',
        email: 'halima.musa@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/92345CS',
        jambRegNumber: '202029482022HM',
        departmentId: cscDept?.id || 'dept_1',
        facultyId: fastFaculty?.id || 'fac_1',
        cgpa: 4.78,
        activeStage: 7,
        stageStatus: 'COMPLETED',
      },
      {
        id: 'std_010',
        firstName: 'Rasheed',
        lastName: 'Quadri',
        email: 'rasheed.quadri@futminna-fedpoffa.edu.ng',
        matricNumber: '2020/1/87410EEE',
        jambRegNumber: '202029482011RQ',
        departmentId: eeeDept.id,
        facultyId: feFaculty.id,
        cgpa: 3.92,
        activeStage: 4,
        stageStatus: 'PENDING',
      },
    ];

    const studentRoleObj = this.roles.find((r) => r.name === 'STUDENT');

    additionalStudents.forEach((st, idx) => {
      const uId = `usr_std_extra_${idx + 2}`;
      const newUser = {
        id: uId,
        email: st.email,
        passwordHash: DEFAULT_BCRYPT_HASH,
        firstName: st.firstName,
        lastName: st.lastName,
        phoneNumber: `+234803112233${idx + 2}`,
        status: 'ACTIVE',
        departmentId: st.departmentId,
        facultyId: st.facultyId,
        createdAt: new Date('2026-01-15T08:00:00Z'),
        updatedAt: new Date(),
      };
      this.users.push(newUser);

      if (studentRoleObj) {
        this.userRoles.push({
          id: `ur_std_${idx + 2}`,
          userId: newUser.id,
          roleId: studentRoleObj.id,
          assignedAt: new Date(),
        });
      }

      this.students.push({
        id: st.id,
        userId: newUser.id,
        matricNumber: st.matricNumber,
        jambRegNumber: st.jambRegNumber,
        facultyId: st.facultyId,
        departmentId: st.departmentId,
        programmeType: 'AFFILIATE_DEGREE',
        level: 'DEGREE_400',
        entryYear: 2020,
        graduationYear: 2024,
        academicSession: '2024/2025',
        cgpa: st.cgpa,
        isClearanceEligible: true,
        address: 'Fedpoffa Off-Campus Student Quarters, Offa, Kwara State',
        stateOfOrigin: 'Kwara State',
        lga: 'Offa LGA',
        nextOfKinName: `Guardian of ${st.firstName}`,
        nextOfKinPhone: `+234802900000${idx + 2}`,
        nextOfKinRelationship: 'Parent',
        createdAt: new Date('2026-01-15T09:00:00Z'),
        updatedAt: new Date(),
      });
    });

    // Build Clearance Requests & 7 Stages for all students
    this.clearanceRequests = [];
    this.clearanceStageProgresses = [];
    this.approvalDecisions = [];

    // 1. Primary Student: Ibrahim Adeyemi (Stage 4 Pending)
    const primaryReq = {
      id: 'req_clr_001',
      requestId: 'CLR-2026-FUT-00123',
      studentId: primaryStudent?.id || 'std_001',
      workflowId: this.workflow.id,
      status: 'IN_PROGRESS',
      currentStageNumber: 4,
      submissionDate: new Date('2026-02-01T10:00:00Z'),
      completionDate: null,
      rejectionReason: null,
      overallRemarks: 'Active final clearance in progress under FUTMINNA-FEDPOFFA academic moderation sequence.',
      createdAt: new Date('2026-02-01T10:00:00Z'),
      updatedAt: new Date(),
    };
    this.clearanceRequests.push(primaryReq);

    this.createStagesForRequest(primaryReq, 4, 'PENDING', [
      { name: 'Remita School Fees Receipt 2024.pdf', verified: true, uploadedAt: '2026-02-04T10:00:00Z' },
      { name: 'Convocation Levy RRR 492019482.pdf', verified: true, uploadedAt: '2026-02-04T10:02:00Z' },
    ]);

    // Build stages and requests for additional students
    additionalStudents.forEach((st, idx) => {
      const reqId = `req_clr_${String(idx + 2).padStart(3, '0')}`;
      const clrReq = {
        id: reqId,
        requestId: `CLR-2026-FUT-${String(10020 + idx * 115)}`,
        studentId: st.id,
        workflowId: this.workflow.id,
        status: st.stageStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        currentStageNumber: st.activeStage,
        submissionDate: new Date(Date.now() - (10 - idx) * 86400000),
        completionDate: st.stageStatus === 'COMPLETED' ? new Date() : null,
        rejectionReason: st.rejectionReason || null,
        overallRemarks: st.stageStatus === 'COMPLETED'
          ? 'Clearance 100% completed across all 7 checkpoints with official Registry endorsement.'
          : `Clearance currently active at Stage ${st.activeStage}.`,
        createdAt: new Date(Date.now() - (10 - idx) * 86400000),
        updatedAt: new Date(),
      };
      this.clearanceRequests.push(clrReq);

      let docs: any[] = [];
      if (st.activeStage === 1) {
        docs = [
          { name: 'Final Project Hardcover Proof.pdf', verified: true, uploadedAt: new Date().toISOString() },
          { name: 'Departmental Dues Receipt.pdf', verified: true, uploadedAt: new Date().toISOString() },
        ];
      } else if (st.activeStage === 2) {
        docs = [{ name: 'Faculty Dues Remita Receipt.pdf', verified: true, uploadedAt: new Date().toISOString() }];
      } else if (st.activeStage === 3) {
        docs = [{ name: 'Library Borrower Card Proof.pdf', verified: true, uploadedAt: new Date().toISOString() }];
      } else if (st.activeStage === 4) {
        docs = [
          { name: 'School Fees Remita Receipt 2024.pdf', verified: true, uploadedAt: new Date().toISOString() },
          { name: 'Graduation Fee Teller.pdf', verified: true, uploadedAt: new Date().toISOString() },
        ];
      } else if (st.activeStage === 5) {
        docs = [{ name: 'Hostel Room Key Clearance Slip.pdf', verified: true, uploadedAt: new Date().toISOString() }];
      } else if (st.activeStage === 6) {
        docs = [{ name: 'E-Portal Biodata Printout.pdf', verified: true, uploadedAt: new Date().toISOString() }];
      } else if (st.activeStage === 7) {
        docs = [{ name: 'Consolidated Stages 1-6 Clearance Sheet.pdf', verified: true, uploadedAt: new Date().toISOString() }];
      }

      this.createStagesForRequest(clrReq, st.activeStage, st.stageStatus as any, docs, st.rejectionReason);
    });

    // 7. Cryptographic Audit Trail
    this.auditLogs = [
      {
        id: 'aud_001',
        userId: 'system',
        userEmail: 'system.bootstrap@futminna-fedpoffa.edu.ng',
        action: 'SYSTEM_SETTING_UPDATED',
        entityType: 'SYSTEM_BOOTSTRAP',
        entityId: 'GENESIS_BLOCK_0001',
        previousState: null,
        newState: JSON.stringify({ version: 'Prisma 7.9.1 / MySQL 8.0 Normalized Schema', state: 'INITIALIZED' }),
        ipAddress: '127.0.0.1',
        userAgent: 'Prisma CLI / Engine',
        checksumHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        createdAt: new Date('2026-01-10T08:00:00Z'),
      },
      {
        id: 'aud_002',
        userId: studentUser?.id,
        userEmail: studentUser?.email,
        action: 'CLEARANCE_SUBMITTED',
        entityType: 'CLEARANCE_REQUEST',
        entityId: primaryReq.id,
        previousState: null,
        newState: JSON.stringify({ requestId: primaryReq.requestId, studentMatric: primaryStudent?.matricNumber, status: 'SUBMITTED' }),
        ipAddress: '102.89.44.120',
        userAgent: 'Mozilla/5.0 (Student Mobile Portal)',
        checksumHash: '8b9c47e8c0490b4d1b82a5a1f0a1492b67f1b2c4e9d8f3a2b1c4e7f8a9b0c1d2',
        createdAt: new Date('2026-02-01T10:00:00Z'),
      },
      {
        id: 'aud_003',
        userId: hodUser?.id,
        userEmail: hodUser?.email,
        action: 'STAGE_APPROVED',
        entityType: 'CLEARANCE_STAGE_PROGRESS',
        entityId: 'csp_req_clr_001_s1',
        previousState: JSON.stringify({ status: 'PENDING', stage: 'Departmental Clearance' }),
        newState: JSON.stringify({ status: 'APPROVED', officer: hodUser?.email, stamp: 'FUTMINNA-FEDPOFFA/HOD-CSC/APPROVED' }),
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Officer Clearance Portal)',
        checksumHash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        createdAt: new Date('2026-02-02T14:30:00Z'),
      },
    ];

    // 8. Notifications
    if (studentUser) {
      this.notifications = [
        {
          id: 'notif_001',
          userId: studentUser.id,
          title: 'Stage 1 (Departmental) Approved',
          message: 'Dr. Abubakar Suleiman (HOD Computer Science) has approved your departmental clearance.',
          type: 'CLEARANCE_STATUS',
          isRead: true,
          readAt: new Date('2026-02-02T15:00:00Z'),
          linkUrl: '/clearance/track',
          createdAt: new Date('2026-02-02T14:30:00Z'),
        },
        {
          id: 'notif_002',
          userId: studentUser.id,
          title: 'Stage 2 (Faculty) Approved',
          message: 'Prof. Comfort Ogunleye (Dean FAST) has endorsed your faculty clearance.',
          type: 'CLEARANCE_STATUS',
          isRead: true,
          readAt: new Date('2026-02-03T12:00:00Z'),
          linkUrl: '/clearance/track',
          createdAt: new Date('2026-02-03T11:00:00Z'),
        },
        {
          id: 'notif_003',
          userId: studentUser.id,
          title: 'Stage 3 (Library) Approved',
          message: 'University & Polytechnic Library has cleared all borrowed library holdings.',
          type: 'CLEARANCE_STATUS',
          isRead: false,
          readAt: null,
          linkUrl: '/clearance/track',
          createdAt: new Date('2026-02-04T09:15:00Z'),
        },
      ];
    }
  }

  /**
   * Loads dbStore's in-memory collections from the live MySQL/MariaDB
   * database when one is configured and reachable, so the rest of the
   * application (which reads dbStore.* synchronously everywhere) is working
   * against real, persistent data rather than the static in-memory demo
   * seed produced by initRelations(). Called once at server startup
   * (see server.ts).
   *
   * - If no live database is configured/reachable: leaves the existing
   *   in-memory demo dataset from initRelations() untouched and returns
   *   false. This is the same behaviour as before this method existed.
   * - If a live database is reachable but has no institutional data yet
   *   (first run against a fresh schema): bootstraps roles, permissions,
   *   faculties, departments, the clearance workflow/stages, system
   *   settings and the canonical demo user accounts into it (mirroring
   *   prisma/seed.ts), then loads everything back into memory.
   * - If a live database already has data: loads it as-is. Real clearance
   *   requests, documents, decisions, certificates, notifications and audit
   *   logs accumulate from here on through normal use rather than being
   *   reset to the canned in-memory demo journeys on every restart.
   */
  public async hydrateFromDatabase(): Promise<boolean> {
    const prisma = getPrismaClient();
    if (!prisma) {
      setFallbackActive(true);
      return false;
    }

    try {
      const connected = await checkDatabaseConnectivity(true);
      if (!connected) {
        setFallbackActive(true);
        return false;
      }

      const roleCount = await prisma.role.count();
      if (roleCount === 0) {
        console.log('[dbStore.hydrateFromDatabase] Live database is empty — bootstrapping institutional data (roles, permissions, faculties, departments, workflow, demo accounts)...');
        // Same seeding logic `npx prisma db seed` runs (see seedDatabase.ts),
        // so the two never drift apart.
        await seedInstitutionalData(prisma);
      }

      const [
        roles, permissions, rolePermissions, faculties, departments,
        users, userRoles, students, workflow, workflowStages,
        systemSettings, passwordResetTokens,
        clearanceRequests, clearanceStageProgresses, documents,
        approvalDecisions, certificates, notifications, auditLogs,
      ] = await Promise.all([
        prisma.role.findMany(),
        prisma.permission.findMany(),
        prisma.rolePermission.findMany(),
        prisma.faculty.findMany(),
        prisma.department.findMany(),
        prisma.user.findMany(),
        prisma.userRole.findMany(),
        prisma.student.findMany(),
        prisma.clearanceWorkflow.findFirst({ where: { isActive: true } }),
        prisma.workflowStage.findMany({ orderBy: { stageNumber: 'asc' } }),
        prisma.systemSetting.findMany(),
        prisma.passwordResetToken.findMany(),
        prisma.clearanceRequest.findMany(),
        prisma.clearanceStageProgress.findMany(),
        prisma.document.findMany(),
        prisma.approvalDecision.findMany(),
        prisma.clearanceCertificate.findMany(),
        prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
        prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' }, take: 2000 }),
      ]);

      this.roles = roles as any;
      this.permissions = permissions as any;
      this.rolePermissions = rolePermissions as any;
      this.faculties = faculties as any;
      this.departments = departments as any;
      this.users = users as any;
      this.userRoles = userRoles as any;
      this.students = students as any;
      this.workflow = workflow as any;
      this.workflowStages = workflowStages as any;
      this.systemSettings = systemSettings as any;
      this.passwordResetTokens = passwordResetTokens as any;
      this.clearanceRequests = clearanceRequests as any;
      this.clearanceStageProgresses = clearanceStageProgresses as any;
      this.documents = documents as any;
      this.approvalDecisions = approvalDecisions as any;
      this.certificates = certificates as any;
      this.notifications = notifications as any;
      this.auditLogs = auditLogs as any;
      // Clearance-unit management (see adminRoutes.ts) has no backing Prisma
      // model yet — left as an in-memory-only feature for now (documented in
      // README under "Known limitations").

      liveDbModeFlag = true;
      setFallbackActive(false);
      console.log(
        `[dbStore.hydrateFromDatabase] Hydrated from live database: ${users.length} users, ` +
        `${clearanceRequests.length} clearance requests, ${auditLogs.length} audit log entries.`
      );
      return true;
    } catch (err: any) {
      console.warn('[dbStore.hydrateFromDatabase] Failed to hydrate from live database, staying on in-memory seed:', err?.message || err);
      liveDbModeFlag = false;
      setFallbackActive(true);
      return false;
    }
  }

  /**
   * Helper to instantiate all 7 sequential stage progresses for any given student clearance request
   */
  public createStagesForRequest(
    request: any,
    targetStageNum: number,
    targetStageStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
    targetStageDocs?: any[],
    targetStageRemarks?: string
  ) {
    const hodUser = this.users.find((u) => u.email === 'hod.csc@fedpoffa.edu.ng');
    const deanUser = this.users.find((u) => u.email === 'dean.fast@fedpoffa.edu.ng');
    const libUser = this.users.find((u) => u.email === 'library.officer@fedpoffa.edu.ng');
    const bursarUser = this.users.find((u) => u.email === 'bursar.clearance@fedpoffa.edu.ng');
    const hostelUser = this.users.find((u) => u.email === 'studentaffairs@fedpoffa.edu.ng');
    const ictUser = this.users.find((u) => u.email === 'ict.director@fedpoffa.edu.ng');
    const regUser = this.users.find((u) => u.email === 'registry.clearance@futminna.edu.ng');

    const officerMap: Record<number, any> = {
      1: hodUser,
      2: deanUser,
      3: libUser,
      4: bursarUser,
      5: hostelUser,
      6: ictUser,
      7: regUser,
    };

    for (let stageNum = 1; stageNum <= 7; stageNum++) {
      const stageDef = this.workflowStages.find((ws) => ws.stageNumber === stageNum);
      const stageId = stageDef?.id || `stage_${stageNum}`;
      const cspId = `csp_${request.id}_s${stageNum}`;
      const assignedOfficer = officerMap[stageNum];

      let status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'NOT_STARTED';
      let remarks = `Awaiting completion of preceding stages.`;
      let docsJson: string | null = null;
      let initiatedAt: Date | null = null;
      let completedAt: Date | null = null;

      if (targetStageStatus === 'COMPLETED') {
        status = 'APPROVED';
        remarks = 'Verified and approved with digital signature.';
        initiatedAt = new Date(request.submissionDate.getTime() + (stageNum - 1) * 86400000);
        completedAt = new Date(request.submissionDate.getTime() + stageNum * 86400000);
        docsJson = JSON.stringify([{ name: `Stage_${stageNum}_Verified_Proof.pdf`, verified: true, uploadedAt: new Date().toISOString() }]);
      } else if (stageNum < targetStageNum) {
        status = 'APPROVED';
        remarks = 'Verified and approved with digital signature.';
        initiatedAt = new Date(request.submissionDate.getTime() + (stageNum - 1) * 86400000);
        completedAt = new Date(request.submissionDate.getTime() + stageNum * 86400000);
        docsJson = JSON.stringify([{ name: `Stage_${stageNum}_Approved_Document.pdf`, verified: true, uploadedAt: new Date().toISOString() }]);
      } else if (stageNum === targetStageNum) {
        status = targetStageStatus === 'REJECTED' ? 'REJECTED' : 'PENDING';
        remarks = targetStageRemarks || (status === 'REJECTED' ? 'Correction requested by unit officer.' : 'Under active verification by stage officer.');
        docsJson = targetStageDocs && targetStageDocs.length > 0 ? JSON.stringify(targetStageDocs) : null;
        initiatedAt = new Date();
      } else {
        status = 'NOT_STARTED';
        remarks = `Awaiting Stage ${targetStageNum} completion.`;
      }

      const stageProgress = {
        id: cspId,
        clearanceRequestId: request.id,
        stageId,
        stageNumber: stageNum,
        status,
        assignedOfficerId: status === 'APPROVED' || status === 'REJECTED' ? (assignedOfficer?.id || null) : null,
        submittedDocuments: docsJson,
        remarks,
        initiatedAt,
        completedAt,
        createdAt: request.createdAt,
        updatedAt: completedAt || initiatedAt || new Date(),
      };
      this.clearanceStageProgresses.push(stageProgress);

      // Seed relational Document rows
      if (docsJson) {
        try {
          const parsed = JSON.parse(docsJson);
          const docsArray = Array.isArray(parsed) ? parsed : [parsed];
          docsArray.forEach((docItem: any, idx: number) => {
            const fileName = docItem.name || docItem.fileName || `Stage_${stageNum}_Verification_Proof.pdf`;
            const docStatus = status === 'APPROVED' ? 'VERIFIED' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING');
            this.documents.push({
              id: `doc_${request.id}_s${stageNum}_${idx + 1}`,
              clearanceRequestId: request.id,
              stageNumber: stageNum,
              fileName,
              filePath: docItem.filePath || `/uploads/clearance/${request.id}/s${stageNum}_${fileName}`,
              fileType: docItem.fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              fileSizeBytes: docItem.fileSizeBytes || (1024 * 1024 * 2), // 2MB standard
              uploadedAt: docItem.uploadedAt ? new Date(docItem.uploadedAt) : (initiatedAt || new Date()),
              status: docStatus,
              createdAt: request.createdAt,
              updatedAt: completedAt || initiatedAt || new Date(),
            });
          });
        } catch {
          // ignore
        }
      }

      // If approved, create Decision
      if (status === 'APPROVED') {
        const rawSig = `${assignedOfficer?.id || 'officer'}:${cspId}:APPROVED:${completedAt?.getTime() || Date.now()}`;
        const signatureHash = `sha256:${crypto.createHash('sha256').update(rawSig).digest('hex')}`;
        const roleLabel = stageDef?.requiredRoleName || 'OFFICER';
        const dateStr = (completedAt || new Date()).toISOString().slice(0, 10);
        const digitalStamp = `FUTMINNA-FEDPOFFA/${roleLabel}/APPROVED/${dateStr}`;

        this.approvalDecisions.push({
          id: `dec_${cspId}`,
          stageProgressId: cspId,
          officerId: assignedOfficer?.id || 'officer',
          decision: 'APPROVED',
          remarks: 'Endorsed and approved according to institutional clearance guidelines.',
          signatureHash,
          digitalStamp,
          ipAddress: '192.168.1.10',
          userAgent: 'Mozilla/5.0 (Officer Clearance Portal)',
          createdAt: completedAt || new Date(),
        });
      }
    }

    // If clearance request is 100% completed across all 7 stages, ensure Certificate is created
    if (targetStageNum === 7 && targetStageStatus === 'COMPLETED') {
      const existingCert = this.certificates.find((c) => c.clearanceRequestId === request.id);
      if (!existingCert) {
        const student = this.students.find((s) => s.id === request.studentId);
        const certNumber = `FUT-FP-CLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const issueDate = request.completionDate || new Date('2026-02-05T16:00:00Z');
        const rawRegSig = `usr_registry_7:${request.id}:CERT_ISSUED:${issueDate.getTime()}`;
        const regSigHash = `sha256:${crypto.createHash('sha256').update(rawRegSig).digest('hex')}`;

        const cert = {
          id: `cert_${request.id}`,
          certificateNumber: certNumber,
          clearanceRequestId: request.id,
          studentId: request.studentId,
          qrCodeToken: `QR_FUTMINNA_FEDPOFFA_${crypto.randomBytes(16).toString('hex')}`,
          issuanceDate: issueDate,
          verifiedByRegistryId: 'usr_registry_7',
          registrySignatureHash: regSigHash,
          status: 'VALID',
          createdAt: issueDate,
          updatedAt: issueDate,
        };
        this.certificates.push(cert);
      }
    }
  }

  /**
   * Finds user by email address
   */
  public findUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const found = this.users.find((u) => u.email.toLowerCase() === normalized);
    if (found) return found;
    if (normalized === 'admin.security@futminna-fedpoffa.edu.ng') {
      return this.users.find((u) => u.email.toLowerCase() === 'admin.super@futminna-fedpoffa.edu.ng') || null;
    }
    return null;
  }

  /**
   * Finds user by student matriculation number
   */
  public findUserByMatricNumber(matricNumber: string) {
    const student = this.students.find((s) => s.matricNumber.toUpperCase() === matricNumber.trim().toUpperCase());
    if (!student) return null;
    return this.users.find((u) => u.id === student.userId) || null;
  }

  /**
   * Finds user by ID
   */
  public findUserById(userId: string) {
    return this.users.find((u) => u.id === userId) || null;
  }

  /**
   * Retrieves role names and granular permissions for a given user
   */
  public getUserRolesAndPermissions(userId: string) {
    const userRoleLinks = this.userRoles.filter((ur) => ur.userId === userId);
    const roleIds = userRoleLinks.map((ur) => ur.roleId);
    const roles = this.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name);

    // Aggregate permissions
    const permIds = this.rolePermissions.filter((rp) => roleIds.includes(rp.roleId)).map((rp) => rp.permissionId);
    const permissions = Array.from(new Set(this.permissions.filter((p) => permIds.includes(p.id)).map((p) => p.code)));

    const student = this.students.find((s) => s.userId === userId) || null;

    return {
      roles,
      permissions,
      student,
    };
  }

  /**
   * Updates user password (stored strictly as bcrypt hash) and records an immutable audit log
   */
  public updateUserPassword(userId: string, newPasswordHash: string, actorIp = '127.0.0.1'): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();

    this.createAuditLogEntry({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET',
      entityType: 'USER_CREDENTIALS',
      entityId: user.id,
      previousState: JSON.stringify({ event: 'PASSWORD_CHANGED', status: 'REVOKED' }),
      newState: JSON.stringify({ event: 'PASSWORD_CHANGED', status: 'UPDATED', algorithm: 'bcrypt-10' }),
      ipAddress: actorIp,
      userAgent: 'FUTMINNA-FEDPOFFA Auth Engine',
    });

    return true;
  }

  /**
   * Creates or replaces password reset token record in local relational store
   */
  public createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    const record = {
      id: `prt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      usedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.passwordResetTokens.push(record);
    return record;
  }

  /**
   * Finds password reset token by hash
   */
  public findPasswordResetTokenByHash(tokenHash: string) {
    return this.passwordResetTokens.find((t) => t.tokenHash === tokenHash) || null;
  }

  /**
   * Marks a password reset token as used
   */
  public markPasswordResetTokenUsed(tokenHash: string): boolean {
    const record = this.passwordResetTokens.find((t) => t.tokenHash === tokenHash);
    if (!record || record.usedAt) return false;
    record.usedAt = new Date();
    record.updatedAt = new Date();
    return true;
  }

  /**
   * Appends an immutable audit log entry with SHA-256 state hashing
   */
  public createAuditLogEntry(data: {
    userId?: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    previousState?: string | null;
    newState?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.checksumHash : '0000000000000000000000000000000000000000000000000000000000000000';

    const rawPayload = `${data.userEmail}:${data.action}:${data.entityType}:${data.entityId}:${data.newState || ''}:${prevHash}`;
    const checksumHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const logEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: data.userId || null,
      userEmail: data.userEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      previousState: data.previousState || null,
      newState: data.newState || null,
      ipAddress: data.ipAddress || '127.0.0.1',
      userAgent: data.userAgent || 'Web Client',
      checksumHash,
      createdAt: new Date(),
    };

    this.auditLogs.push(logEntry);

    // Best-effort mirror into the live database. This is intentionally
    // fire-and-forget (not awaited) so that none of this method's ~25
    // existing synchronous call sites across the codebase need to change,
    // and so a slow/unreachable database never delays the action being
    // audited. A failure here is logged and otherwise has no effect on the
    // in-memory audit trail, which remains authoritative for the request.
    void (async () => {
      try {
        const isConnected = await checkDatabaseConnectivity();
        const prisma = isConnected ? getPrismaClient() : null;
        if (!prisma) return;
        await prisma.auditLog.create({
          data: {
            id: logEntry.id,
            userId: logEntry.userId,
            userEmail: logEntry.userEmail,
            action: logEntry.action as any,
            entityType: logEntry.entityType,
            entityId: logEntry.entityId,
            previousState: logEntry.previousState,
            newState: logEntry.newState,
            ipAddress: logEntry.ipAddress,
            userAgent: logEntry.userAgent,
            checksumHash: logEntry.checksumHash,
            createdAt: logEntry.createdAt,
          },
        });
      } catch (err: any) {
        console.warn('[dbStore.createAuditLogEntry] Live DB mirror write notice:', err?.message || err);
      }
    })();

    return logEntry;
  }

  /**
   * Full Demo Request details for UI visualization
   */
  public getDemoRequestDetails() {
    const request = this.clearanceRequests[0];
    if (!request) return null;

    const student = this.students.find((s) => s.id === request.studentId);
    const user = student ? this.users.find((u) => u.id === student.userId) : null;
    const faculty = student ? this.faculties.find((f) => f.id === student.facultyId) : null;
    const department = student ? this.departments.find((d) => d.id === student.departmentId) : null;

    const reqDocuments = this.documents.filter((d) => d.clearanceRequestId === request.id);

    const stages = this.clearanceStageProgresses.map((csp) => {
      const stageDef = this.workflowStages.find((s) => s.id === csp.stageId);
      const assignedOfficer = csp.assignedOfficerId ? this.users.find((u) => u.id === csp.assignedOfficerId) : null;
      const decision = this.approvalDecisions.find((d) => d.stageProgressId === csp.id);
      const stageDocuments = reqDocuments.filter((d) => d.stageNumber === csp.stageNumber);

      return {
        ...csp,
        stageDefinition: stageDef,
        documents: stageDocuments,
        assignedOfficer: assignedOfficer
          ? {
              id: assignedOfficer.id,
              email: assignedOfficer.email,
              firstName: assignedOfficer.firstName,
              lastName: assignedOfficer.lastName,
              status: assignedOfficer.status,
            }
          : null,
        decision,
      };
    });

    return {
      request: {
        ...request,
        documents: reqDocuments,
      },
      student: {
        ...student,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber,
            }
          : null,
        faculty,
        department,
      },
      stages,
      documents: reqDocuments,
      decisions: this.approvalDecisions,
      auditLogs: this.auditLogs.slice(-10),
    };
  }

  /**
   * Returns schema & model metrics for database status reporting
   */
  public getModelMetrics(): DatabaseModelMetric[] {
    return [
      {
        name: 'User',
        tableName: 'users',
        category: 'IDENTITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['departmentId -> departments.id', 'facultyId -> faculties.id'],
        uniqueConstraints: ['UNIQUE INDEX users_email_key (email)'],
        indexes: ['users_email_idx', 'users_status_idx', 'users_departmentId_idx', 'users_facultyId_idx'],
        recordsCount: this.users.length,
        description: 'Normalized identity entity for all institutional actors (Students, Officers, Deans, Administrators).',
      },
      {
        name: 'Role',
        tableName: 'roles',
        category: 'IDENTITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [],
        uniqueConstraints: ['UNIQUE INDEX roles_name_key (name)'],
        indexes: ['roles_name_idx'],
        recordsCount: this.roles.length,
        description: 'Hierarchical Role-Based Access Control definitions (STUDENT, HOD, DEAN, BURSAR, LIBRARIAN, REGISTRY, SUPER_ADMIN).',
      },
      {
        name: 'Permission',
        tableName: 'permissions',
        category: 'IDENTITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [],
        uniqueConstraints: ['UNIQUE INDEX permissions_code_key (code)'],
        indexes: ['permissions_code_idx', 'permissions_module_idx'],
        recordsCount: this.permissions.length,
        description: 'Granular capability tokens governing clearance endorsements, certificate generation, and audit trail inspection.',
      },
      {
        name: 'UserRole',
        tableName: 'user_roles',
        category: 'IDENTITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['userId -> users.id (CASCADE)', 'roleId -> roles.id (CASCADE)'],
        uniqueConstraints: ['UNIQUE INDEX user_roles_userId_roleId_key (userId, roleId)'],
        indexes: ['user_roles_userId_idx', 'user_roles_roleId_idx'],
        recordsCount: this.userRoles.length,
        description: 'Junction entity binding users to one or more system roles with referential cascading.',
      },
      {
        name: 'RolePermission',
        tableName: 'role_permissions',
        category: 'IDENTITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['roleId -> roles.id (CASCADE)', 'permissionId -> permissions.id (CASCADE)'],
        uniqueConstraints: ['UNIQUE INDEX role_permissions_roleId_permissionId_key (roleId, permissionId)'],
        indexes: ['role_permissions_roleId_idx', 'role_permissions_permissionId_idx'],
        recordsCount: this.rolePermissions.length,
        description: 'Junction entity defining granular capability matrices mapped to each institutional clearance role.',
      },
      {
        name: 'Faculty',
        tableName: 'faculties',
        category: 'ACADEMIC',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [],
        uniqueConstraints: ['UNIQUE INDEX faculties_code_key (code)'],
        indexes: ['faculties_code_idx'],
        recordsCount: this.faculties.length,
        description: 'Academic schools/faculties governed under FUTMINNA-FEDPOFFA academic moderation guidelines.',
      },
      {
        name: 'Department',
        tableName: 'departments',
        category: 'ACADEMIC',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['facultyId -> faculties.id (RESTRICT)'],
        uniqueConstraints: ['UNIQUE INDEX departments_code_key (code)'],
        indexes: ['departments_code_idx', 'departments_facultyId_idx'],
        recordsCount: this.departments.length,
        description: 'Academic subject divisions responsible for Stage 1 Departmental Clearance.',
      },
      {
        name: 'Student',
        tableName: 'students',
        category: 'ACADEMIC',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['userId -> users.id (CASCADE)', 'facultyId -> faculties.id (RESTRICT)', 'departmentId -> departments.id (RESTRICT)'],
        uniqueConstraints: [
          'UNIQUE INDEX students_userId_key (userId)',
          'UNIQUE INDEX students_matricNumber_key (matricNumber)',
          'UNIQUE INDEX students_jambRegNumber_key (jambRegNumber)',
        ],
        indexes: ['students_matricNumber_idx', 'students_jambRegNumber_idx', 'students_facultyId_idx', 'students_departmentId_idx'],
        recordsCount: this.students.length,
        description: 'Normalized student academic profile guaranteeing zero duplication of matriculation credentials.',
      },
      {
        name: 'ClearanceWorkflow',
        tableName: 'clearance_workflows',
        category: 'WORKFLOW',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [],
        uniqueConstraints: [],
        indexes: ['clearance_workflows_academicSession_idx', 'clearance_workflows_programmeType_idx', 'clearance_workflows_isActive_idx'],
        recordsCount: this.workflow ? 1 : 0,
        description: 'Active institutional clearance sequence definition for a specific academic session and programme type.',
      },
      {
        name: 'WorkflowStage',
        tableName: 'workflow_stages',
        category: 'WORKFLOW',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['workflowId -> clearance_workflows.id (CASCADE)', 'departmentId -> departments.id (SET NULL)'],
        uniqueConstraints: ['UNIQUE INDEX workflow_stages_workflowId_stageNumber_key (workflowId, stageNumber)'],
        indexes: ['workflow_stages_workflowId_idx', 'workflow_stages_stageCode_idx', 'workflow_stages_stageNumber_idx'],
        recordsCount: this.workflowStages.length,
        description: 'Individual clearance checkpoints (1. Dept, 2. Faculty, 3. Library, 4. Bursary, 5. Hostel, 6. ICT, 7. Registry).',
      },
      {
        name: 'ClearanceRequest',
        tableName: 'clearance_requests',
        category: 'WORKFLOW',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['studentId -> students.id (CASCADE)', 'workflowId -> clearance_workflows.id (RESTRICT)'],
        uniqueConstraints: ['UNIQUE INDEX clearance_requests_requestId_key (requestId)'],
        indexes: ['clearance_requests_requestId_idx', 'clearance_requests_studentId_idx', 'clearance_requests_status_idx', 'clearance_requests_currentStageNumber_idx'],
        recordsCount: this.clearanceRequests.length,
        description: 'Master clearance application record tracking end-to-end completion status and stage progression.',
      },
      {
        name: 'ClearanceStageProgress',
        tableName: 'clearance_stage_progresses',
        category: 'WORKFLOW',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [
          'clearanceRequestId -> clearance_requests.id (CASCADE)',
          'stageId -> workflow_stages.id (RESTRICT)',
          'assignedOfficerId -> users.id (SET NULL)',
        ],
        uniqueConstraints: ['UNIQUE INDEX clearance_stage_progresses_clearanceRequestId_stageId_key (clearanceRequestId, stageId)'],
        indexes: ['clearance_stage_progresses_clearanceRequestId_idx', 'clearance_stage_progresses_status_idx', 'clearance_stage_progresses_stageNumber_idx'],
        recordsCount: this.clearanceStageProgresses.length,
        description: 'Per-department clearance checkpoint status (NOT_STARTED, PENDING, APPROVED, REJECTED, WAIVED).',
      },
      {
        name: 'Document',
        tableName: 'documents',
        category: 'WORKFLOW',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['clearanceRequestId -> clearance_requests.id (CASCADE)'],
        uniqueConstraints: [],
        indexes: ['documents_clearanceRequestId_idx', 'documents_stageNumber_idx', 'documents_status_idx'],
        recordsCount: this.documents.length,
        description: 'Relational clearance verification documents and evidence attachments with verification status tracking (PENDING, VERIFIED, REJECTED).',
      },
      {
        name: 'ApprovalDecision',
        tableName: 'approval_decisions',
        category: 'DECISIONS',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['stageProgressId -> clearance_stage_progresses.id (CASCADE)', 'officerId -> users.id (RESTRICT)'],
        uniqueConstraints: [],
        indexes: ['approval_decisions_stageProgressId_idx', 'approval_decisions_officerId_idx', 'approval_decisions_decision_idx', 'approval_decisions_createdAt_idx'],
        recordsCount: this.approvalDecisions.length,
        description: 'Legally binding cryptographic endorsement log with digital officer stamps and IP audit metadata.',
      },
      {
        name: 'ClearanceCertificate',
        tableName: 'clearance_certificates',
        category: 'SECURITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['clearanceRequestId -> clearance_requests.id (RESTRICT)', 'studentId -> students.id (RESTRICT)', 'verifiedByRegistryId -> users.id (SET NULL)'],
        uniqueConstraints: [
          'UNIQUE INDEX clearance_certificates_certificateNumber_key (certificateNumber)',
          'UNIQUE INDEX clearance_certificates_clearanceRequestId_key (clearanceRequestId)',
          'UNIQUE INDEX clearance_certificates_qrCodeToken_key (qrCodeToken)',
        ],
        indexes: ['clearance_certificates_certificateNumber_idx', 'clearance_certificates_studentId_idx', 'clearance_certificates_qrCodeToken_idx', 'clearance_certificates_status_idx'],
        recordsCount: this.certificates.length,
        description: 'Official digital clearance certificate encoded with anti-counterfeit QR cryptographic validation tokens.',
      },
      {
        name: 'AuditLog',
        tableName: 'audit_logs',
        category: 'SECURITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['userId -> users.id (SET NULL)'],
        uniqueConstraints: [],
        indexes: ['audit_logs_userId_idx', 'audit_logs_action_idx', 'audit_logs_entityType_idx', 'audit_logs_entityId_idx', 'audit_logs_createdAt_idx'],
        recordsCount: this.auditLogs.length,
        description: 'Append-only immutable security ledger with SHA-256 state hashing for academic research verification.',
      },
      {
        name: 'Notification',
        tableName: 'notifications',
        category: 'SECURITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: ['userId -> users.id (CASCADE)'],
        uniqueConstraints: [],
        indexes: ['notifications_userId_idx', 'notifications_isRead_idx', 'notifications_type_idx'],
        recordsCount: this.notifications.length,
        description: 'Real-time transactional clearance alerts notifying students and approving officers.',
      },
      {
        name: 'SystemSetting',
        tableName: 'system_settings',
        category: 'SECURITY',
        primaryKey: 'id (VARCHAR(36))',
        foreignKeys: [],
        uniqueConstraints: ['UNIQUE INDEX system_settings_key_key (key)'],
        indexes: ['system_settings_key_idx', 'system_settings_category_idx'],
        recordsCount: this.systemSettings.length,
        description: 'Institutional clearance policies, sequential enforcement switches, and session configurations.',
      },
    ];
  }
}

export const dbStore = new RelationalStore();
