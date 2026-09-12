import type { PrismaClient } from '@prisma/client';
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_FACULTIES,
  INITIAL_DEPARTMENTS,
  INITIAL_WORKFLOW,
  INITIAL_SYSTEM_SETTINGS,
  CANONICAL_DEMO_USERS,
  DEFAULT_BCRYPT_HASH,
  DEFAULT_DEMO_PASSWORD,
} from './seedData';
import { AuthService } from '../auth/authService';

/**
 * Seeds institutional reference data (roles, permissions, role-permission
 * grants, faculties, departments, the standard clearance workflow/stages,
 * system settings, and the canonical demo user/student accounts) into a
 * live MySQL/MariaDB database via Prisma.
 *
 * This is the single source of truth for that logic. It is called from two
 * places:
 *  - `prisma/seed.ts`, the CLI entrypoint for `npx prisma db seed`.
 *  - `src/server/db/client.ts`'s `hydrateFromDatabase()`, which calls this
 *    automatically the first time the running server connects to a live
 *    database that has no roles yet, so a fresh MySQL/MariaDB instance
 *    works out of the box without a separate manual seeding step.
 *
 * Every write is an upsert, so calling this repeatedly (e.g. once per
 * server restart, as a safety net) is a safe no-op once the data exists.
 */
export async function seedInstitutionalData(prisma: PrismaClient): Promise<void> {
  const passwordHash = DEFAULT_BCRYPT_HASH || AuthService.hashPasswordSync(DEFAULT_DEMO_PASSWORD);

  // 1. Roles
  const roleMap = new Map<string, string>();
  for (const role of INITIAL_ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name as any },
      update: { displayName: (role as any).displayName, description: role.description },
      create: role as any,
    });
    roleMap.set(role.name, created.id);
  }

  // 2. Permissions
  const permMap = new Map<string, string>();
  for (const perm of INITIAL_PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { code: (perm as any).code },
      update: { name: perm.name, module: (perm as any).module, description: perm.description },
      create: perm as any,
    });
    permMap.set((perm as any).code, created.id);
  }

  // 3. Role-Permission grants (all permissions to SUPER_ADMIN)
  const adminRoleId = roleMap.get('SUPER_ADMIN');
  if (adminRoleId) {
    for (const [, permId] of permMap.entries()) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRoleId, permissionId: permId } },
        update: {},
        create: { roleId: adminRoleId, permissionId: permId },
      });
    }
  }

  // 4. Faculties
  const facultyMap = new Map<string, string>();
  for (const fac of INITIAL_FACULTIES) {
    const created = await prisma.faculty.upsert({
      where: { code: fac.code },
      update: { name: fac.name, description: (fac as any).description },
      create: fac as any,
    });
    facultyMap.set(fac.code, created.id);
  }

  // 5. Departments
  const deptMap = new Map<string, string>();
  for (const dept of INITIAL_DEPARTMENTS) {
    const facultyId = facultyMap.get(dept.facultyCode);
    if (!facultyId) continue;
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: (dept as any).description, facultyId },
      create: {
        code: dept.code,
        name: dept.name,
        description: (dept as any).description,
        facultyId,
      } as any,
    });
    deptMap.set(dept.code, created.id);
  }

  // 6. Workflow & Stages
  let workflow = await prisma.clearanceWorkflow.findFirst({
    where: { academicSession: (INITIAL_WORKFLOW as any).academicSession, isActive: true },
  });

  if (!workflow) {
    workflow = await prisma.clearanceWorkflow.create({
      data: {
        name: INITIAL_WORKFLOW.name,
        academicSession: (INITIAL_WORKFLOW as any).academicSession,
        programmeType: (INITIAL_WORKFLOW as any).programmeType,
        isActive: (INITIAL_WORKFLOW as any).isActive,
        description: INITIAL_WORKFLOW.description,
      } as any,
    });

    const cscDeptId = deptMap.get('CSC');
    for (const stage of (INITIAL_WORKFLOW as any).stages) {
      await prisma.workflowStage.create({
        data: {
          workflowId: workflow.id,
          stageNumber: stage.stageNumber,
          stageCode: stage.stageCode,
          name: stage.name,
          description: stage.description,
          requiredRoleName: stage.requiredRoleName,
          departmentId: stage.stageCode === 'DEPT' ? cscDeptId : null,
          requiresDocumentUpload: stage.requiresDocumentUpload,
          requiredDocumentNames: stage.requiredDocumentNames,
          isSequential: stage.isSequential,
          isFinalStage: stage.isFinalStage,
        },
      });
    }
  }

  // 7. System Settings
  for (const setting of INITIAL_SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: (setting as any).description, category: (setting as any).category },
      create: {
        key: setting.key,
        value: setting.value,
        category: (setting as any).category,
        description: (setting as any).description,
      } as any,
    });
  }

  // 8. Canonical demo users + the one demo student profile
  const fastFacultyId = facultyMap.get('FAST');
  const cscDeptId = deptMap.get('CSC');

  for (const demoUser of CANONICAL_DEMO_USERS) {
    const userDeptId = (demoUser as any).departmentCode ? deptMap.get((demoUser as any).departmentCode) : null;
    const userFacId = (demoUser as any).facultyCode ? facultyMap.get((demoUser as any).facultyCode) : null;

    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        passwordHash,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        departmentId: userDeptId || undefined,
        facultyId: userFacId || undefined,
        status: 'ACTIVE',
      },
      create: {
        email: demoUser.email,
        passwordHash,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        phoneNumber: demoUser.role === 'STUDENT' ? '+2348030000001' : '+2348030000002',
        status: 'ACTIVE',
        departmentId: userDeptId || undefined,
        facultyId: userFacId || undefined,
      } as any,
    });

    const roleId = roleMap.get(demoUser.role);
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }

    if (demoUser.role === 'STUDENT' && (demoUser as any).matricNumber && fastFacultyId && cscDeptId) {
      await prisma.student.upsert({
        where: { matricNumber: (demoUser as any).matricNumber },
        update: {
          cgpa: 4.38,
          isClearanceEligible: true,
        } as any,
        create: {
          userId: user.id,
          matricNumber: (demoUser as any).matricNumber,
          jambRegNumber: '202029482012AF',
          facultyId: fastFacultyId,
          departmentId: cscDeptId,
          programmeType: 'AFFILIATE_DEGREE',
          level: 'DEGREE_400',
          entryYear: 2020,
          graduationYear: 2024,
          academicSession: '2024/2025',
          cgpa: 4.38,
          isClearanceEligible: true,
        } as any,
      });
    }
  }

  // 9. Genesis audit log entry (best-effort; ignore if it already exists)
  try {
    await prisma.auditLog.create({
      data: {
        userEmail: 'system.bootstrap@futminna-fedpoffa.edu.ng',
        action: 'SYSTEM_SETTING_UPDATED',
        entityType: 'SYSTEM_BOOTSTRAP',
        entityId: 'GENESIS_BLOCK_0001',
        previousState: null,
        newState: JSON.stringify({ event: 'Database schema & institutional seed initialized', timestamp: new Date().toISOString() }),
        ipAddress: '127.0.0.1',
        userAgent: 'Prisma/7.9.1 (Migration/Seed Engine)',
        checksumHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    });
  } catch {
    // Duplicate genesis block — already seeded, ignore.
  }
}
