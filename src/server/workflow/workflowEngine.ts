import crypto from 'crypto';
import { dbStore } from '../db/client';
import { prismaRepo } from '../db/prismaRepository';
import { socketServer } from '../notifications/socketServer';
import { emailService } from '../notifications/emailService';
import type { EmailOptions } from '../notifications/emailService';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  rollbackOccurred?: boolean;
}

export interface WorkflowStageConfig {
  id: string;
  workflowId: string;
  stageNumber: number;
  stageCode: string;
  name: string;
  description: string;
  requiredRoleName: string;
  departmentId?: string | null;
  requiresDocumentUpload: boolean;
  requiredDocumentNames: string[];
  isSequential: boolean;
  isFinalStage: boolean;
}

export interface RealTimeTrackingData {
  request: any;
  student: any;
  completedStages: any[];
  currentStage: any | null;
  pendingStages: any[];
  rejectedStage: any | null;
  documents?: any[];
  overallPercentage: number;
  totalStagesCount: number;
  approvedStagesCount: number;
  timeline: Array<{
    id: string;
    stageNumber?: number;
    title: string;
    description: string;
    timestamp: Date | string;
    type: 'SUBMISSION' | 'APPROVAL' | 'REJECTION' | 'RESUBMISSION' | 'CERTIFICATE' | 'SYSTEM';
    actorName?: string;
    actorRole?: string;
    statusBadge: 'COMPLETED' | 'PENDING' | 'ACTION_REQUIRED' | 'NEUTRAL';
    digitalStamp?: string;
  }>;
  certificate?: any | null;
  nextActionRequired: string;
}

/**
 * Centralized Clearance Workflow Engine
 * 
 * Provides transactional state machine transitions, dynamic multi-unit stage orchestration,
 * strict eligibility enforcement, officer approval/rejection handling, and real-time tracking.
 */
export class CentralWorkflowEngine {
  /**
   * Transaction Manager
   * Takes a full deep snapshot of all workflow-related store tables before mutation.
   * If any step fails or an exception occurs, automatically rolls back all tables.
   */
  public async runTransaction<T>(operation: () => Promise<T> | T): Promise<TransactionResult<T>> {
    // 1. Snapshot workflow-related collections
    const snapshot = {
      clearanceRequests: JSON.parse(JSON.stringify(dbStore.clearanceRequests)),
      clearanceStageProgresses: JSON.parse(JSON.stringify(dbStore.clearanceStageProgresses)),
      approvalDecisions: JSON.parse(JSON.stringify(dbStore.approvalDecisions)),
      documents: JSON.parse(JSON.stringify(dbStore.documents)),
      passwordResetTokens: JSON.parse(JSON.stringify(dbStore.passwordResetTokens)),
      notifications: JSON.parse(JSON.stringify(dbStore.notifications)),
      auditLogs: JSON.parse(JSON.stringify(dbStore.auditLogs)),
      certificates: JSON.parse(JSON.stringify(dbStore.certificates)),
      students: JSON.parse(JSON.stringify(dbStore.students)),
      workflowStages: JSON.parse(JSON.stringify(dbStore.workflowStages)),
    };

    try {
      const result = await operation();
      return {
        success: true,
        data: result,
      };
    } catch (err: any) {
      // 2. Rollback on failure
      console.error('[WorkflowEngine Transaction Error - Rolling back]:', err.message || err);

      // Restore exact snapshots
      dbStore.clearanceRequests = snapshot.clearanceRequests.map((r: any) => ({
        ...r,
        submissionDate: r.submissionDate ? new Date(r.submissionDate) : null,
        completionDate: r.completionDate ? new Date(r.completionDate) : null,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));

      dbStore.clearanceStageProgresses = snapshot.clearanceStageProgresses.map((sp: any) => ({
        ...sp,
        initiatedAt: sp.initiatedAt ? new Date(sp.initiatedAt) : null,
        completedAt: sp.completedAt ? new Date(sp.completedAt) : null,
        createdAt: new Date(sp.createdAt),
        updatedAt: new Date(sp.updatedAt),
      }));

      dbStore.approvalDecisions = snapshot.approvalDecisions.map((ad: any) => ({
        ...ad,
        createdAt: new Date(ad.createdAt),
      }));

      dbStore.documents = snapshot.documents.map((d: any) => ({
        ...d,
        uploadedAt: new Date(d.uploadedAt),
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      }));

      dbStore.passwordResetTokens = snapshot.passwordResetTokens.map((prt: any) => ({
        ...prt,
        expiresAt: new Date(prt.expiresAt),
        usedAt: prt.usedAt ? new Date(prt.usedAt) : null,
        createdAt: new Date(prt.createdAt),
        updatedAt: new Date(prt.updatedAt),
      }));

      dbStore.notifications = snapshot.notifications.map((n: any) => ({
        ...n,
        readAt: n.readAt ? new Date(n.readAt) : null,
        createdAt: new Date(n.createdAt),
      }));

      dbStore.auditLogs = snapshot.auditLogs.map((al: any) => ({
        ...al,
        createdAt: new Date(al.createdAt),
      }));

      dbStore.certificates = snapshot.certificates.map((c: any) => ({
        ...c,
        issuanceDate: new Date(c.issuanceDate),
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));

      dbStore.students = snapshot.students.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));

      dbStore.workflowStages = snapshot.workflowStages.map((ws: any) => ({
        ...ws,
        createdAt: new Date(ws.createdAt),
        updatedAt: new Date(ws.updatedAt),
      }));

      // Log transaction rollback audit
      dbStore.createAuditLogEntry({
        userId: 'system',
        userEmail: 'workflow.engine@futminna-fedpoffa.edu.ng',
        action: 'TRANSACTION_ROLLBACK',
        entityType: 'WORKFLOW_ENGINE',
        entityId: `ERR_${Date.now()}`,
        previousState: JSON.stringify({ error: err.message || 'Transaction failed' }),
        newState: JSON.stringify({ status: 'ROLLED_BACK_SAFE' }),
        ipAddress: '127.0.0.1',
        userAgent: 'WorkflowEngine / TransactionManager',
      });

      return {
        success: false,
        error: err.message || 'Workflow transaction failed and was safely rolled back.',
        code: err.code || 'TRANSACTION_FAILED',
        rollbackOccurred: true,
      };
    }
  }

  /**
   * Helper to retrieve active workflow stages ordered by stage number
   */
  public getActiveStages(): WorkflowStageConfig[] {
    const stages = dbStore.workflowStages.filter((s) => s.isActive !== false);
    return stages.sort((a, b) => a.stageNumber - b.stageNumber);
  }

  /**
   * Helper to get responsible officer(s) for a given stage
   */
  public getResponsibleOfficersForStage(stageDef: WorkflowStageConfig, studentDepartmentId?: string, studentFacultyId?: string) {
    const requiredRole = stageDef.requiredRoleName;
    return dbStore.users.filter((user) => {
      const { roles } = dbStore.getUserRolesAndPermissions(user.id);
      if (!roles.includes(requiredRole)) return false;

      // Stage 1 (Departmental): Match student department if officer has departmentId
      if (requiredRole === 'HOD' && studentDepartmentId && user.departmentId) {
        return user.departmentId === studentDepartmentId;
      }
      // Stage 2 (Faculty): Match student faculty if officer has facultyId
      if (requiredRole === 'DEAN' && studentFacultyId && user.facultyId) {
        return user.facultyId === studentFacultyId;
      }

      return true;
    });
  }

  /**
   * Safe asynchronous dispatcher for In-App, WebSocket, and Email notifications.
   * Guarantees that any delivery or network issue never invalidates an ACID clearance transaction.
   */
  public dispatchNotificationSafely(notification: any, emailPayload?: EmailOptions, roleBroadcast?: string) {
    try {
      // 1. Emit Real-Time WebSocket event to recipient user room
      socketServer.notifyUser(notification.userId, notification);

      // 2. If role broadcast requested, notify officer role room
      if (roleBroadcast) {
        socketServer.notifyRole(roleBroadcast, notification);
      }

      // 3. Dispatch Email Notification asynchronously
      if (emailPayload) {
        // Fire-and-forget promise with local catch
        emailService.sendEmail(emailPayload).catch((err) => {
          console.warn('[WorkflowEngine] Background email dispatch failed gracefully:', err?.message || err);
        });
      }
    } catch (dispatchErr) {
      console.warn('[WorkflowEngine] Real-time notification dispatch failed non-blockingly:', dispatchErr);
    }
  }

  /**
   * 1. SUBMIT / INITIATE CLEARANCE
   * Validates student eligibility, creates clearance request, instantiates stages dynamically,
   * activates Stage 1, notifies responsible officer, and records immutable audit event.
   */
  public async submitClearance(
    studentId: string,
    actorUser: { id: string; email: string; firstName?: string; lastName?: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Clearance Web API'
  ): Promise<TransactionResult<any>> {
    return this.runTransaction(async () => {
      // 1. Validate student profile & eligibility
      const student = dbStore.students.find((s) => s.id === studentId || s.userId === actorUser.id);
      if (!student) {
        const err: any = new Error('Student profile not found in academic registry.');
        err.code = 'STUDENT_NOT_FOUND';
        throw err;
      }

      if (!student.isClearanceEligible) {
        const err: any = new Error('Student is not eligible for graduation clearance. Please consult Academic Records.');
        err.code = 'NOT_ELIGIBLE';
        throw err;
      }

      // Check if student already has a completed or in-progress clearance
      const existingReq = dbStore.clearanceRequests.find((r) => r.studentId === student.id);
      if (existingReq && existingReq.status === 'COMPLETED') {
        const err: any = new Error('Clearance already completed and verified. Certificate is already active.');
        err.code = 'ALREADY_COMPLETED';
        throw err;
      }

      const activeWorkflow = dbStore.workflow || {
        id: 'wf_main_degree_2024_2025',
        name: 'FUTMINNA-FEDPOFFA Affiliate Degree Standard Clearance Workflow',
      };

      const stagesConfig = this.getActiveStages();
      if (stagesConfig.length === 0) {
        const err: any = new Error('No active workflow stages configured in the system.');
        err.code = 'NO_WORKFLOW_STAGES';
        throw err;
      }

      let clearanceRequest: any;
      if (existingReq) {
        clearanceRequest = existingReq;
        clearanceRequest.status = 'IN_PROGRESS';
        clearanceRequest.currentStageNumber = 1;
        clearanceRequest.submissionDate = new Date();
        clearanceRequest.rejectionReason = null;
        clearanceRequest.overallRemarks = 'Clearance re-initiated by student under FUTMINNA-FEDPOFFA academic moderation.';
        clearanceRequest.updatedAt = new Date();
      } else {
        clearanceRequest = {
          id: `req_clr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          requestId: `CLR-2026-FUT-${Math.floor(10000 + Math.random() * 90000)}`,
          studentId: student.id,
          workflowId: activeWorkflow.id,
          status: 'IN_PROGRESS',
          currentStageNumber: 1,
          submissionDate: new Date(),
          completionDate: null,
          rejectionReason: null,
          overallRemarks: 'Clearance initiated by student under FUTMINNA-FEDPOFFA academic moderation.',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbStore.clearanceRequests.push(clearanceRequest);
      }

      // Mirror the request into the live database (no-op if none is configured).
      await prismaRepo.mirrorUpsertClearanceRequest(clearanceRequest);

      // 2. Create / Reset Workflow Stages for this request
      // Remove any previously orphaned stage progresses for this request
      dbStore.clearanceStageProgresses = dbStore.clearanceStageProgresses.filter(
        (sp) => sp.clearanceRequestId !== clearanceRequest.id
      );
      await prismaRepo.mirrorDeleteStageProgressesForRequest(clearanceRequest.id);

      for (const [index, stageDef] of stagesConfig.entries()) {
        const stageNum = stageDef.stageNumber || index + 1;
        const isFirstStage = stageNum === 1;

        // Associate officer based on role and department/faculty
        const matchingOfficers = this.getResponsibleOfficersForStage(stageDef, student.departmentId, student.facultyId);
        const assignedOfficer = matchingOfficers[0] || null;

        const stageProgress = {
          id: `csp_${clearanceRequest.id}_s${stageNum}`,
          clearanceRequestId: clearanceRequest.id,
          stageId: stageDef.id,
          stageNumber: stageNum,
          status: isFirstStage ? 'PENDING' : 'NOT_STARTED',
          assignedOfficerId: assignedOfficer ? assignedOfficer.id : null,
          submittedDocuments: null,
          remarks: isFirstStage
            ? 'Awaiting student document submission & unit officer verification.'
            : 'Awaiting completion of preceding clearance stages.',
          initiatedAt: isFirstStage ? new Date() : null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dbStore.clearanceStageProgresses.push(stageProgress);
        await prismaRepo.mirrorUpsertStageProgress(stageProgress as any);
      }

      // 3. Notify Responsible Officer for Stage 1
      const stage1Def = stagesConfig[0];
      const stage1Officers = this.getResponsibleOfficersForStage(stage1Def, student.departmentId, student.facultyId);
      const studentUser = dbStore.users.find((u) => u.id === student.userId);

      for (const officer of stage1Officers) {
        const notif = {
          id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: officer.id,
          title: `New Clearance Request Submitted: ${student.matricNumber}`,
          message: `${studentUser?.firstName || 'Student'} ${studentUser?.lastName || ''} (${student.matricNumber}) has submitted a new graduation clearance request for Stage 1 (${stage1Def.name}).`,
          type: 'CLEARANCE_STATUS' as const,
          isRead: false,
          readAt: null,
          linkUrl: '/officer-dashboard',
          createdAt: new Date(),
        };
        dbStore.notifications.unshift(notif);
        await prismaRepo.mirrorCreateNotification(notif);
        this.dispatchNotificationSafely(
          notif,
          {
            to: officer.email,
            recipientName: `${officer.firstName} ${officer.lastName}`,
            subject: `Action Required: Stage 1 Clearance Pending (${student.matricNumber})`,
            templateType: 'OFFICER_STAGE_PENDING',
            payload: {
              studentName: `${studentUser?.firstName || ''} ${studentUser?.lastName || ''}`,
              matricNumber: student.matricNumber,
              stageNumber: 1,
              stageName: stage1Def.name,
            },
          },
          stage1Def.requiredRoleName
        );
      }

      // 4. Notify Student
      const studentNotif = {
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: student.userId,
        title: 'Clearance Workflow Initiated',
        message: 'Your official 7-stage graduation clearance has been initiated. Stage 1 (Departmental Clearance) is now active.',
        type: 'CLEARANCE_STATUS' as const,
        isRead: false,
        readAt: null,
        linkUrl: '/clearance-dashboard',
        createdAt: new Date(),
      };
      dbStore.notifications.unshift(studentNotif);
      await prismaRepo.mirrorCreateNotification(studentNotif);
      if (studentUser) {
        this.dispatchNotificationSafely(studentNotif, {
          to: studentUser.email,
          recipientName: `${studentUser.firstName} ${studentUser.lastName}`,
          subject: 'Clearance Request Initiated - FUTMINNA-FEDPOFFA',
          templateType: 'CLEARANCE_SUBMITTED',
          payload: {
            requestId: clearanceRequest.requestId,
            matricNumber: student.matricNumber,
          },
        });
      }

      // Broadcast clearance event
      socketServer.broadcastClearanceUpdate(clearanceRequest.id, {
        status: clearanceRequest.status,
        currentStageNumber: 1,
        updatedAt: new Date(),
      });

      // 5. Record Immutable Audit Log
      dbStore.createAuditLogEntry({
        userId: actorUser.id,
        userEmail: actorUser.email,
        action: 'CLEARANCE_SUBMITTED',
        entityType: 'CLEARANCE_REQUEST',
        entityId: clearanceRequest.id,
        previousState: null,
        newState: JSON.stringify({
          requestId: clearanceRequest.requestId,
          studentMatric: student.matricNumber,
          stagesCount: stagesConfig.length,
          status: 'IN_PROGRESS',
        }),
        ipAddress,
        userAgent,
      });

      return {
        clearanceRequest,
        stagesCount: stagesConfig.length,
        currentStage: stagesConfig[0],
      };
    });
  }

  /**
   * 2. APPROVE WORKFLOW STAGE
   * Validates officer role, records approval decision with cryptographic signature,
   * completes current stage, activates next stage in sequence, notifies student and next officer,
   * handles Stage 7 final completion + certificate generation, and records immutable audit event.
   */
  public async approveStage(
    params: {
      stageProgressId?: string;
      stageNumber?: number;
      clearanceRequestId?: string;
      remarks?: string;
    },
    officerUser: { id: string; email: string; roles: string[]; firstName?: string; lastName?: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Officer Portal'
  ): Promise<TransactionResult<any>> {
    return this.runTransaction(async () => {
      // 1. Locate stage progress
      let stageProgress = dbStore.clearanceStageProgresses.find((sp) => {
        if (params.stageProgressId && sp.id === params.stageProgressId) return true;
        if (
          params.stageNumber &&
          params.clearanceRequestId &&
          sp.stageNumber === Number(params.stageNumber) &&
          sp.clearanceRequestId === params.clearanceRequestId
        )
          return true;
        return false;
      });

      if (!stageProgress && params.stageProgressId) {
        stageProgress = dbStore.clearanceStageProgresses.find((sp) => sp.id === params.stageProgressId);
      }

      if (!stageProgress) {
        const err: any = new Error('Target clearance stage progress record not found.');
        err.code = 'STAGE_NOT_FOUND';
        throw err;
      }

      const stageDef = dbStore.workflowStages.find((ws) => ws.id === stageProgress!.stageId);
      const clrRequest = dbStore.clearanceRequests.find((r) => r.id === stageProgress!.clearanceRequestId);

      if (!clrRequest) {
        const err: any = new Error('Associated clearance master request not found.');
        err.code = 'REQUEST_NOT_FOUND';
        throw err;
      }

      // 2. Validate Officer RBAC / Role Authorization for this stage
      const requiredRole = stageDef?.requiredRoleName;
      const isSuperAdmin = officerUser.roles.includes('SUPER_ADMIN');
      if (requiredRole && !officerUser.roles.includes(requiredRole) && !isSuperAdmin) {
        const err: any = new Error(
          `Unauthorized: Stage ${stageProgress.stageNumber} requires ${requiredRole} role. Your role(s): ${officerUser.roles.join(', ')}.`
        );
        err.code = 'ROLE_UNAUTHORIZED';
        throw err;
      }

      // 2b. State Machine Validation: Prevent out-of-sequence or duplicate approvals
      if (stageProgress.status === 'APPROVED') {
        const err: any = new Error(`Stage ${stageProgress.stageNumber} has already been approved and digitally endorsed.`);
        err.code = 'STAGE_ALREADY_APPROVED';
        throw err;
      }

      if (stageProgress.status === 'NOT_STARTED') {
        const err: any = new Error(
          `Out-of-sequence approval rejected: Stage ${stageProgress.stageNumber} is NOT_STARTED. All preceding stages must be approved first.`
        );
        err.code = 'STAGE_NOT_ACTIVE';
        throw err;
      }

      const student = dbStore.students.find((s) => s.id === clrRequest.studentId);
      const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
      const officerDbUser = dbStore.users.find((u) => u.id === officerUser.id);

      // 2c. Department-Level Isolation Check (e.g. HOD cannot approve students from other departments)
      if (!isSuperAdmin && (officerUser.roles.includes('HOD') || officerUser.roles.includes('DEPARTMENT_OFFICER'))) {
        if (officerDbUser?.departmentId && student?.departmentId && officerDbUser.departmentId !== student.departmentId) {
          const officerDept = dbStore.departments.find((d) => d.id === officerDbUser.departmentId)?.name || officerDbUser.departmentId;
          const studentDept = dbStore.departments.find((d) => d.id === student.departmentId)?.name || student.departmentId;
          const err: any = new Error(
            `Cross-Department Clearance Violation: You are assigned to [${officerDept}] and cannot approve clearance for a student in [${studentDept}].`
          );
          err.code = 'FORBIDDEN_DEPARTMENT_MISMATCH';
          throw err;
        }
      }

      // 2d. Faculty-Level Isolation Check (e.g. Dean cannot approve students from other faculties)
      if (!isSuperAdmin && (officerUser.roles.includes('DEAN') || officerUser.roles.includes('FACULTY_ADMIN'))) {
        if (officerDbUser?.facultyId && student?.facultyId && officerDbUser.facultyId !== student.facultyId) {
          const officerFac = dbStore.faculties.find((f) => f.id === officerDbUser.facultyId)?.name || officerDbUser.facultyId;
          const studentFac = dbStore.faculties.find((f) => f.id === student.facultyId)?.name || student.facultyId;
          const err: any = new Error(
            `Cross-Faculty Clearance Violation: You are assigned to [${officerFac}] and cannot approve clearance for a student in [${studentFac}].`
          );
          err.code = 'FORBIDDEN_FACULTY_MISMATCH';
          throw err;
        }
      }

      const previousStatus = stageProgress.status;
      const stageNumber = stageProgress.stageNumber;

      // 3. Cryptographic Signature Generation
      const completedAt = new Date();
      const rawSignature = `${officerUser.id}:${stageProgress.id}:APPROVED:${completedAt.getTime()}`;
      const signatureHash = `sha256:${crypto.createHash('sha256').update(rawSignature).digest('hex')}`;
      const roleStamp = officerUser.roles[0] || 'OFFICER';
      const digitalStamp = `FUTMINNA-FEDPOFFA/${roleStamp}/APPROVED/${completedAt.toISOString().slice(0, 10)}`;

      // 4. Create Approval Decision Record
      const approvalDecision = {
        id: `dec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        stageProgressId: stageProgress.id,
        officerId: officerUser.id,
        decision: 'APPROVED' as const,
        remarks: params.remarks || `Approved and verified by ${officerUser.firstName || ''} ${officerUser.lastName || officerUser.email}.`,
        signatureHash,
        digitalStamp,
        ipAddress,
        userAgent,
        createdAt: completedAt,
      };
      dbStore.approvalDecisions.push(approvalDecision);
      await prismaRepo.mirrorCreateApprovalDecision(approvalDecision as any);

      // 5. Complete Current Stage
      stageProgress.status = 'APPROVED';
      stageProgress.assignedOfficerId = officerUser.id;
      stageProgress.completedAt = completedAt;
      stageProgress.updatedAt = completedAt;
      stageProgress.remarks = params.remarks || 'Endorsed and verified according to institutional guidelines.';
      await prismaRepo.mirrorUpsertStageProgress(stageProgress as any);

      // Mark stage documents as VERIFIED
      dbStore.documents
        .filter((d) => d.clearanceRequestId === clrRequest.id && d.stageNumber === stageNumber)
        .forEach((d) => {
          d.status = 'VERIFIED';
          d.updatedAt = completedAt;
        });
      await prismaRepo.mirrorMarkStageDocumentsStatus(clrRequest.id, stageNumber, 'VERIFIED');

      // 6. Find Next Stage in dynamic workflow sequence
      const allStages = this.getActiveStages();
      const currentIndex = allStages.findIndex((s) => s.stageNumber === stageNumber);
      const nextStageDef = currentIndex >= 0 && currentIndex < allStages.length - 1 ? allStages[currentIndex + 1] : null;

      let certificateGenerated: any = null;

      if (nextStageDef) {
        // Advance to Next Stage
        const nextStageNum = nextStageDef.stageNumber;
        clrRequest.currentStageNumber = nextStageNum;
        clrRequest.status = 'IN_PROGRESS';
        clrRequest.updatedAt = new Date();
        await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);

        const nextStageProgress = dbStore.clearanceStageProgresses.find(
          (sp) => sp.clearanceRequestId === clrRequest.id && sp.stageNumber === nextStageNum
        );

        if (nextStageProgress && nextStageProgress.status === 'NOT_STARTED') {
          nextStageProgress.status = 'PENDING';
          nextStageProgress.initiatedAt = new Date();
          nextStageProgress.updatedAt = new Date();
          nextStageProgress.remarks = `Awaiting ${nextStageDef.name} officer verification.`;
          await prismaRepo.mirrorUpsertStageProgress(nextStageProgress as any);
        }

        // Notify Next Stage Officer(s)
        const nextOfficers = this.getResponsibleOfficersForStage(nextStageDef, student?.departmentId, student?.facultyId);
        for (const officer of nextOfficers) {
          const officerNotif = {
            id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            userId: officer.id,
            title: `Stage ${nextStageNum} Clearance Pending: ${student?.matricNumber}`,
            message: `Clearance request for ${studentUser?.firstName || 'Student'} (${student?.matricNumber}) has completed Stage ${stageNumber} and is now pending your review at Stage ${nextStageNum} (${nextStageDef.name}).`,
            type: 'CLEARANCE_STATUS' as const,
            isRead: false,
            readAt: null,
            linkUrl: '/officer-dashboard',
            createdAt: new Date(),
          };
          dbStore.notifications.unshift(officerNotif);
          await prismaRepo.mirrorCreateNotification(officerNotif);
          this.dispatchNotificationSafely(
            officerNotif,
            {
              to: officer.email,
              recipientName: `${officer.firstName} ${officer.lastName}`,
              subject: `Clearance Pending Action: Stage ${nextStageNum} (${nextStageDef.name})`,
              templateType: 'OFFICER_STAGE_PENDING',
              payload: {
                studentName: `${studentUser?.firstName || ''} ${studentUser?.lastName || ''}`,
                matricNumber: student?.matricNumber,
                stageNumber: nextStageNum,
                stageName: nextStageDef.name,
              },
            },
            nextStageDef.requiredRoleName
          );
        }
      } else {
        // Final Stage Completed (Stage 7 / Registry)
        clrRequest.status = 'COMPLETED';
        clrRequest.currentStageNumber = stageNumber;
        clrRequest.completionDate = completedAt;
        clrRequest.overallRemarks = 'Clearance 100% completed across all checkpoints with official Academic Registry endorsement.';
        clrRequest.updatedAt = completedAt;
        await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);

        // Generate Clearance Certificate if not already existing
        const existingCert = dbStore.certificates.find((c) => c.clearanceRequestId === clrRequest.id);
        if (!existingCert && student) {
          certificateGenerated = {
            id: `cert_${Date.now()}`,
            certificateNumber: `FUT-FP-CLR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            clearanceRequestId: clrRequest.id,
            studentId: student.id,
            qrCodeToken: `QR_FUTMINNA_FEDPOFFA_${crypto.randomBytes(16).toString('hex')}`,
            issuanceDate: completedAt,
            verifiedByRegistryId: officerUser.id,
            registrySignatureHash: signatureHash,
            status: 'VALID',
            createdAt: completedAt,
            updatedAt: completedAt,
          };
          dbStore.certificates.push(certificateGenerated);
          await prismaRepo.mirrorCreateCertificate(certificateGenerated as any);

          // Audit trail record for Certificate Generation
          dbStore.createAuditLogEntry({
            userId: officerUser.id,
            userEmail: officerUser.email,
            action: 'CERTIFICATE_GENERATED',
            entityType: 'CLEARANCE_CERTIFICATE',
            entityId: certificateGenerated.id,
            previousState: JSON.stringify({ clearanceStatus: 'IN_PROGRESS', stagesCompleted: 6 }),
            newState: JSON.stringify({
              certificateNumber: certificateGenerated.certificateNumber,
              clearanceRequestId: clrRequest.id,
              studentId: student.id,
              matricNumber: student.matricNumber,
              qrCodeToken: certificateGenerated.qrCodeToken,
              issuanceDate: completedAt,
              status: 'VALID',
            }),
            ipAddress,
            userAgent,
          });
        } else {
          certificateGenerated = existingCert;
        }

        // Notify Administrators of clearance completion
        socketServer.notifyRole('SUPER_ADMIN', {
          id: `notif_adm_${Date.now()}`,
          title: `Clearance Completed: ${student?.matricNumber}`,
          message: `Candidate ${studentUser?.firstName || ''} ${studentUser?.lastName || ''} has achieved 100% graduation clearance endorsement. Certificate #${certificateGenerated?.certificateNumber || 'ISSUED'}.`,
          type: 'SYSTEM',
          createdAt: completedAt,
        });
      }

      // 7. Notify Student
      if (studentUser) {
        const studentNotif = {
          id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: studentUser.id,
          title: nextStageDef
            ? `Stage ${stageNumber} (${stageDef?.name || 'Clearance Stage'}) Approved`
            : `🎉 Graduation Clearance 100% Completed!`,
          message: nextStageDef
            ? `Your clearance for Stage ${stageNumber} (${stageDef?.name}) was approved by ${officerUser.email}. You may now proceed to Stage ${nextStageDef.stageNumber} (${nextStageDef.name}).`
            : `Congratulations! All 7 clearance stages are officially verified. Your institutional graduation certificate is now available for download.`,
          type: 'CLEARANCE_STATUS' as const,
          isRead: false,
          readAt: null,
          linkUrl: '/clearance-dashboard',
          createdAt: new Date(),
        };
        dbStore.notifications.unshift(studentNotif);
        await prismaRepo.mirrorCreateNotification(studentNotif);

        this.dispatchNotificationSafely(studentNotif, {
          to: studentUser.email,
          recipientName: `${studentUser.firstName} ${studentUser.lastName}`,
          subject: nextStageDef
            ? `Clearance Update: Stage ${stageNumber} Approved`
            : `Official Graduation Clearance Complete & Certificate Ready`,
          templateType: nextStageDef ? 'STAGE_APPROVED' : 'CLEARANCE_COMPLETED',
          payload: {
            stageNumber,
            stageName: stageDef?.name,
            officerName: `${officerUser.firstName || ''} ${officerUser.lastName || officerUser.email}`,
            nextStageNumber: nextStageDef?.stageNumber,
            nextStageName: nextStageDef?.name,
            certificateNumber: certificateGenerated?.certificateNumber,
          },
        });
      }

      // Broadcast clearance update
      socketServer.broadcastClearanceUpdate(clrRequest.id, {
        status: clrRequest.status,
        currentStageNumber: clrRequest.currentStageNumber,
        completedStage: stageNumber,
        isCompleted: clrRequest.status === 'COMPLETED',
        updatedAt: completedAt,
      });

      // 8. Record Immutable Audit Event
      dbStore.createAuditLogEntry({
        userId: officerUser.id,
        userEmail: officerUser.email,
        action: 'STAGE_APPROVED',
        entityType: 'CLEARANCE_STAGE_PROGRESS',
        entityId: stageProgress.id,
        previousState: JSON.stringify({ status: previousStatus, stageNumber }),
        newState: JSON.stringify({
          status: 'APPROVED',
          digitalStamp,
          signatureHash,
          nextStage: nextStageDef ? nextStageDef.stageNumber : 'COMPLETED',
          requestStatus: clrRequest.status,
        }),
        ipAddress,
        userAgent,
      });

      return {
        stageProgress,
        approvalDecision,
        requestStatus: clrRequest.status,
        currentStageNumber: clrRequest.currentStageNumber,
        isCompleted: clrRequest.status === 'COMPLETED',
        certificate: certificateGenerated,
      };
    });
  }

  /**
   * 3. REJECT WORKFLOW STAGE
   * Requires non-empty reason, records rejection decision, sets stage status = REJECTED,
   * sets clearance request status = REJECTED / ACTION_REQUIRED, preserves audit history,
   * dispatches notification to student with resubmission instructions, and records audit event.
   */
  public async rejectStage(
    params: {
      stageProgressId?: string;
      stageNumber?: number;
      clearanceRequestId?: string;
      reason: string;
    },
    officerUser: { id: string; email: string; roles: string[]; firstName?: string; lastName?: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Officer Portal'
  ): Promise<TransactionResult<any>> {
    return this.runTransaction(async () => {
      // 1. Validate mandatory reason
      if (!params.reason || params.reason.trim().length < 5) {
        const err: any = new Error('A detailed corrective rejection reason (minimum 5 characters) is strictly mandatory.');
        err.code = 'MISSING_REASON';
        throw err;
      }

      // 2. Locate stage progress
      let stageProgress = dbStore.clearanceStageProgresses.find((sp) => {
        if (params.stageProgressId && sp.id === params.stageProgressId) return true;
        if (
          params.stageNumber &&
          params.clearanceRequestId &&
          sp.stageNumber === Number(params.stageNumber) &&
          sp.clearanceRequestId === params.clearanceRequestId
        )
          return true;
        return false;
      });

      if (!stageProgress && params.stageProgressId) {
        stageProgress = dbStore.clearanceStageProgresses.find((sp) => sp.id === params.stageProgressId);
      }

      if (!stageProgress) {
        const err: any = new Error('Target clearance stage progress record not found.');
        err.code = 'STAGE_NOT_FOUND';
        throw err;
      }

      const stageDef = dbStore.workflowStages.find((ws) => ws.id === stageProgress!.stageId);
      const clrRequest = dbStore.clearanceRequests.find((r) => r.id === stageProgress!.clearanceRequestId);

      if (!clrRequest) {
        const err: any = new Error('Associated clearance master request not found.');
        err.code = 'REQUEST_NOT_FOUND';
        throw err;
      }

      // 3. Validate Officer RBAC / Role Authorization for this stage
      const requiredRole = stageDef?.requiredRoleName;
      const isSuperAdmin = officerUser.roles.includes('SUPER_ADMIN');
      if (requiredRole && !officerUser.roles.includes(requiredRole) && !isSuperAdmin) {
        const err: any = new Error(
          `Unauthorized: Stage ${stageProgress.stageNumber} requires ${requiredRole} role to reject.`
        );
        err.code = 'ROLE_UNAUTHORIZED';
        throw err;
      }

      const student = dbStore.students.find((s) => s.id === clrRequest.studentId);
      const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
      const officerDbUser = dbStore.users.find((u) => u.id === officerUser.id);

      // 3b. Department-Level Isolation Check
      if (!isSuperAdmin && (officerUser.roles.includes('HOD') || officerUser.roles.includes('DEPARTMENT_OFFICER'))) {
        if (officerDbUser?.departmentId && student?.departmentId && officerDbUser.departmentId !== student.departmentId) {
          const officerDept = dbStore.departments.find((d) => d.id === officerDbUser.departmentId)?.name || officerDbUser.departmentId;
          const studentDept = dbStore.departments.find((d) => d.id === student.departmentId)?.name || student.departmentId;
          const err: any = new Error(
            `Cross-Department Clearance Violation: You are assigned to [${officerDept}] and cannot reject clearance for a student in [${studentDept}].`
          );
          err.code = 'FORBIDDEN_DEPARTMENT_MISMATCH';
          throw err;
        }
      }

      // 3c. Faculty-Level Isolation Check
      if (!isSuperAdmin && (officerUser.roles.includes('DEAN') || officerUser.roles.includes('FACULTY_ADMIN'))) {
        if (officerDbUser?.facultyId && student?.facultyId && officerDbUser.facultyId !== student.facultyId) {
          const officerFac = dbStore.faculties.find((f) => f.id === officerDbUser.facultyId)?.name || officerDbUser.facultyId;
          const studentFac = dbStore.faculties.find((f) => f.id === student.facultyId)?.name || student.facultyId;
          const err: any = new Error(
            `Cross-Faculty Clearance Violation: You are assigned to [${officerFac}] and cannot reject clearance for a student in [${studentFac}].`
          );
          err.code = 'FORBIDDEN_FACULTY_MISMATCH';
          throw err;
        }
      }

      const previousStatus = stageProgress.status;
      const rejectedAt = new Date();

      // 4. Update Stage Progress
      stageProgress.status = 'REJECTED';
      stageProgress.assignedOfficerId = officerUser.id;
      stageProgress.remarks = params.reason.trim();
      stageProgress.updatedAt = rejectedAt;
      await prismaRepo.mirrorUpsertStageProgress(stageProgress as any);

      // Mark stage documents as REJECTED
      dbStore.documents
        .filter((d) => d.clearanceRequestId === clrRequest.id && d.stageNumber === stageProgress.stageNumber)
        .forEach((d) => {
          d.status = 'REJECTED';
          d.updatedAt = rejectedAt;
        });
      await prismaRepo.mirrorMarkStageDocumentsStatus(clrRequest.id, stageProgress.stageNumber, 'REJECTED');

      // 5. Update Request Status
      clrRequest.status = 'REJECTED';
      clrRequest.rejectionReason = params.reason.trim();
      clrRequest.currentStageNumber = stageProgress.stageNumber;
      clrRequest.updatedAt = rejectedAt;
      await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);

      // 6. Notify Student with actionable message
      if (studentUser) {
        const rejectNotif = {
          id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: studentUser.id,
          title: `Action Required: Stage ${stageProgress.stageNumber} (${stageDef?.name || 'Clearance Stage'}) Discrepancy`,
          message: `Officer ${officerUser.email} flagged a discrepancy: "${params.reason.trim()}". Please rectify and re-upload the required documentation.`,
          type: 'ACTION_REQUIRED' as const,
          isRead: false,
          readAt: null,
          linkUrl: '/clearance-dashboard',
          createdAt: rejectedAt,
        };
        dbStore.notifications.unshift(rejectNotif);
        await prismaRepo.mirrorCreateNotification(rejectNotif);

        this.dispatchNotificationSafely(rejectNotif, {
          to: studentUser.email,
          recipientName: `${studentUser.firstName} ${studentUser.lastName}`,
          subject: `Correction Required: Stage ${stageProgress.stageNumber} (${stageDef?.name}) Clearance`,
          templateType: 'STAGE_REJECTED',
          payload: {
            stageNumber: stageProgress.stageNumber,
            stageName: stageDef?.name,
            reason: params.reason.trim(),
            officerName: `${officerUser.firstName || ''} ${officerUser.lastName || officerUser.email}`,
          },
        });
      }

      // Broadcast real-time rejection event
      socketServer.broadcastClearanceUpdate(clrRequest.id, {
        status: 'REJECTED',
        rejectedStageNumber: stageProgress.stageNumber,
        rejectionReason: params.reason.trim(),
        updatedAt: rejectedAt,
      });

      // 7. Record Immutable Audit Event
      dbStore.createAuditLogEntry({
        userId: officerUser.id,
        userEmail: officerUser.email,
        action: 'STAGE_REJECTED',
        entityType: 'CLEARANCE_STAGE_PROGRESS',
        entityId: stageProgress.id,
        previousState: JSON.stringify({ status: previousStatus, stageNumber: stageProgress.stageNumber }),
        newState: JSON.stringify({
          status: 'REJECTED',
          officer: officerUser.email,
          reason: params.reason.trim(),
          requestStatus: 'REJECTED',
        }),
        ipAddress,
        userAgent,
      });

      return {
        stageProgress,
        requestStatus: clrRequest.status,
        rejectionReason: clrRequest.rejectionReason,
      };
    });
  }

  /**
   * 4. STAGE DOCUMENT RESUBMISSION
   * Allows student to upload corrected proofs for a rejected stage or active pending stage,
   * resets stage status back to PENDING, notifies responsible officer, and preserves audit log.
   */
  public async resubmitStageDocuments(
    params: {
      stageNumber: number;
      clearanceRequestId?: string;
      documents: any[];
      studentNotes?: string;
    },
    studentUser: { id: string; email: string },
    ipAddress = '127.0.0.1',
    userAgent = 'Student Portal'
  ): Promise<TransactionResult<any>> {
    return this.runTransaction(async () => {
      const student = dbStore.students.find((s) => s.userId === studentUser.id) || dbStore.students[0];
      const clrRequest = dbStore.clearanceRequests.find((r) => r.studentId === student?.id) || dbStore.clearanceRequests[0];

      if (!clrRequest) {
        const err: any = new Error('Clearance request not found.');
        err.code = 'REQUEST_NOT_FOUND';
        throw err;
      }

      const stageProgress = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === clrRequest.id && sp.stageNumber === Number(params.stageNumber)
      );

      if (!stageProgress) {
        const err: any = new Error(`Stage ${params.stageNumber} progress record not found.`);
        err.code = 'STAGE_NOT_FOUND';
        throw err;
      }

      // Resubmission rule check: Can only submit if stage is REJECTED, PENDING, or NOT_STARTED (if current stage)
      if (stageProgress.status === 'APPROVED') {
        const err: any = new Error('Cannot resubmit documents for an already approved clearance stage.');
        err.code = 'STAGE_ALREADY_APPROVED';
        throw err;
      }

      const previousStatus = stageProgress.status;
      const stageDef = dbStore.workflowStages.find((ws) => ws.id === stageProgress.stageId);

      // Update documents & status
      stageProgress.submittedDocuments = JSON.stringify(params.documents);
      stageProgress.status = 'PENDING';
      stageProgress.remarks = params.studentNotes || 'Corrected documents submitted by student for re-evaluation.';
      stageProgress.initiatedAt = new Date();
      stageProgress.updatedAt = new Date();
      await prismaRepo.mirrorUpsertStageProgress(stageProgress as any);

      // Normalize into Document rows
      if (Array.isArray(params.documents) && params.documents.length > 0) {
        // Remove any prior pending documents for this stage
        dbStore.documents = dbStore.documents.filter(
          (d) => !(d.clearanceRequestId === clrRequest.id && d.stageNumber === Number(params.stageNumber) && d.status === 'PENDING')
        );

        const newDocs: any[] = [];
        params.documents.forEach((docItem: any, idx: number) => {
          const fileName = docItem.name || docItem.fileName || `Stage_${params.stageNumber}_Proof_${idx + 1}.pdf`;
          const newDoc = {
            id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}_${idx}`,
            clearanceRequestId: clrRequest.id,
            stageNumber: Number(params.stageNumber),
            fileName,
            filePath: docItem.filePath || `/uploads/clearance/${clrRequest.id}/s${params.stageNumber}_${fileName}`,
            fileType: docItem.fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            fileSizeBytes: docItem.fileSizeBytes || (1024 * 1024 * 2),
            uploadedAt: docItem.uploadedAt ? new Date(docItem.uploadedAt) : new Date(),
            status: 'PENDING' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dbStore.documents.unshift(newDoc);
          newDocs.push(newDoc);
        });

        await prismaRepo.mirrorReplaceDocumentsForStage(clrRequest.id, Number(params.stageNumber), newDocs);
      }

      // Reset request status to IN_PROGRESS if it was REJECTED
      if (clrRequest.status === 'REJECTED') {
        clrRequest.status = 'IN_PROGRESS';
        clrRequest.rejectionReason = null;
        clrRequest.updatedAt = new Date();
        await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);
      }

      // Notify responsible unit officer(s)
      if (stageDef) {
        const officers = this.getResponsibleOfficersForStage(stageDef, student?.departmentId, student?.facultyId);
        for (const officer of officers) {
          const officerNotif = {
            id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            userId: officer.id,
            title: `Document Resubmission: Stage ${stageProgress.stageNumber} (${stageDef.name})`,
            message: `Student ${student?.matricNumber} has uploaded corrected verification documents for Stage ${stageProgress.stageNumber}.`,
            type: 'CLEARANCE_STATUS' as const,
            isRead: false,
            readAt: null,
            linkUrl: '/officer-dashboard',
            createdAt: new Date(),
          };
          dbStore.notifications.unshift(officerNotif);
          await prismaRepo.mirrorCreateNotification(officerNotif);
          this.dispatchNotificationSafely(
            officerNotif,
            {
              to: officer.email,
              recipientName: `${officer.firstName} ${officer.lastName}`,
              subject: `Resubmitted Documents for Review: Stage ${stageProgress.stageNumber} (${student?.matricNumber})`,
              templateType: 'STAGE_RESUBMITTED',
              payload: {
                studentName: `${studentUser?.email || 'Student'}`,
                matricNumber: student?.matricNumber,
                stageNumber: stageProgress.stageNumber,
                stageName: stageDef.name,
                studentNotes: params.studentNotes,
              },
            },
            stageDef.requiredRoleName
          );
        }
      }

      // Broadcast clearance update
      socketServer.broadcastClearanceUpdate(clrRequest.id, {
        status: clrRequest.status,
        currentStageNumber: stageProgress.stageNumber,
        resubmittedStage: stageProgress.stageNumber,
        updatedAt: new Date(),
      });

      // Record Audit Log
      dbStore.createAuditLogEntry({
        userId: studentUser.id,
        userEmail: studentUser.email,
        action: 'STAGE_DOCUMENTS_RESUBMITTED',
        entityType: 'CLEARANCE_STAGE_PROGRESS',
        entityId: stageProgress.id,
        previousState: JSON.stringify({ status: previousStatus }),
        newState: JSON.stringify({
          status: 'PENDING',
          documentsCount: params.documents.length,
          notes: params.studentNotes,
        }),
        ipAddress,
        userAgent,
      });

      return {
        stageProgress,
        requestStatus: clrRequest.status,
      };
    });
  }

  /**
   * 5. REAL-TIME TRACKING ENGINE
   * Assembles completed stages, current stage, pending stages, rejected stage,
   * overall percentage, chronological timeline, next action required, and certificates.
   */
  public getRealTimeTracking(identifier: string): RealTimeTrackingData | null {
    // 1. Locate Clearance Request (by requestId, studentId, or user id)
    let clrReq = dbStore.clearanceRequests.find(
      (r) => r.id === identifier || r.requestId === identifier || r.studentId === identifier
    );

    if (!clrReq) {
      const student = dbStore.students.find((s) => s.id === identifier || s.userId === identifier || s.matricNumber.toUpperCase() === identifier.toUpperCase());
      if (student) {
        clrReq = dbStore.clearanceRequests.find((r) => r.studentId === student.id);
      }
    }

    // Default to primary demo request if not matched
    if (!clrReq) {
      clrReq = dbStore.clearanceRequests[0];
    }

    if (!clrReq) return null;

    const student = dbStore.students.find((s) => s.id === clrReq!.studentId);
    const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
    const department = student ? dbStore.departments.find((d) => d.id === student.departmentId) : null;
    const faculty = student ? dbStore.faculties.find((f) => f.id === student.facultyId) : null;

    // 2. Fetch and enrich all stage progresses
    const reqDocuments = dbStore.documents.filter((d) => d.clearanceRequestId === clrReq!.id);

    const stages = dbStore.clearanceStageProgresses
      .filter((csp) => csp.clearanceRequestId === clrReq!.id)
      .sort((a, b) => a.stageNumber - b.stageNumber)
      .map((csp) => {
        const stageDef = dbStore.workflowStages.find((ws) => ws.id === csp.stageId);
        const decision = dbStore.approvalDecisions.find((ad) => ad.stageProgressId === csp.id);
        const officerUser = csp.assignedOfficerId ? dbStore.users.find((u) => u.id === csp.assignedOfficerId) : null;
        const stageDocuments = reqDocuments.filter((d) => d.stageNumber === csp.stageNumber);

        return {
          ...csp,
          stageDefinition: stageDef,
          decision,
          documents: stageDocuments,
          assignedOfficer: officerUser
            ? {
                id: officerUser.id,
                name: `${officerUser.firstName} ${officerUser.lastName}`,
                email: officerUser.email,
              }
            : null,
        };
      });

    // 3. Categorize Stages
    const completedStages = stages.filter((s) => s.status === 'APPROVED');
    const rejectedStage = stages.find((s) => s.status === 'REJECTED') || null;
    const currentStage =
      stages.find((s) => s.stageNumber === clrReq!.currentStageNumber && s.status !== 'APPROVED') ||
      stages.find((s) => s.status === 'PENDING') ||
      stages.find((s) => s.status === 'REJECTED') ||
      stages[stages.length - 1] ||
      null;
    const pendingStages = stages.filter((s) => s.status === 'NOT_STARTED' || (s.status === 'PENDING' && s.id !== currentStage?.id));

    // 4. Calculate Percentage
    const totalStagesCount = stages.length || 7;
    const approvedStagesCount = completedStages.length;
    const overallPercentage = Math.round((approvedStagesCount / totalStagesCount) * 100);

    // 5. Construct Chronological Timeline
    const timeline: Array<any> = [];

    // Add Submission Event
    timeline.push({
      id: `tl_sub_${clrReq.id}`,
      title: 'Graduation Clearance Initiated',
      description: 'Student submitted profile for 7-stage institutional moderation.',
      timestamp: clrReq.submissionDate || clrReq.createdAt,
      type: 'SUBMISSION',
      actorName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : student?.matricNumber,
      actorRole: 'STUDENT',
      statusBadge: 'COMPLETED',
    });

    // Add Stage Events
    stages.forEach((stage) => {
      if (stage.status === 'APPROVED') {
        timeline.push({
          id: `tl_app_${stage.id}`,
          stageNumber: stage.stageNumber,
          title: `Stage ${stage.stageNumber} (${stage.stageDefinition?.name || 'Unit'}) Endorsed`,
          description: stage.remarks || 'Checkpoint requirements verified and digitally signed.',
          timestamp: stage.completedAt || stage.updatedAt,
          type: 'APPROVAL',
          actorName: stage.assignedOfficer?.name || stage.decision?.digitalStamp || 'Clearance Officer',
          actorRole: stage.stageDefinition?.requiredRoleName || 'OFFICER',
          statusBadge: 'COMPLETED',
          digitalStamp: stage.decision?.digitalStamp,
        });
      } else if (stage.status === 'REJECTED') {
        timeline.push({
          id: `tl_rej_${stage.id}`,
          stageNumber: stage.stageNumber,
          title: `Stage ${stage.stageNumber} (${stage.stageDefinition?.name}) Discrepancy Flagged`,
          description: stage.remarks || 'Corrective action requested by reviewing officer.',
          timestamp: stage.updatedAt,
          type: 'REJECTION',
          actorName: stage.assignedOfficer?.name || 'Clearance Officer',
          actorRole: stage.stageDefinition?.requiredRoleName || 'OFFICER',
          statusBadge: 'ACTION_REQUIRED',
        });
      } else if (stage.status === 'PENDING') {
        timeline.push({
          id: `tl_pen_${stage.id}`,
          stageNumber: stage.stageNumber,
          title: `Stage ${stage.stageNumber} (${stage.stageDefinition?.name}) Review in Progress`,
          description: stage.remarks || 'Verification documents queued for officer review.',
          timestamp: stage.initiatedAt || stage.updatedAt,
          type: 'SYSTEM',
          actorName: stage.stageDefinition?.name || 'Unit Desk',
          actorRole: stage.stageDefinition?.requiredRoleName || 'OFFICER',
          statusBadge: 'PENDING',
        });
      }
    });

    // Add Certificate Event if completed
    const certificate = dbStore.certificates.find((c) => c.clearanceRequestId === clrReq!.id) || null;
    if (clrReq.status === 'COMPLETED' && certificate) {
      timeline.push({
        id: `tl_cert_${certificate.id}`,
        title: 'Final Clearance Certificate Issued',
        description: `Official Certificate #${certificate.certificateNumber} generated with cryptographic anti-counterfeit QR token.`,
        timestamp: certificate.issuanceDate,
        type: 'CERTIFICATE',
        actorName: 'Academic Registry',
        actorRole: 'REGISTRY',
        statusBadge: 'COMPLETED',
        digitalStamp: `CERT-NO: ${certificate.certificateNumber}`,
      });
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 6. Compute Next Action Required
    let nextActionRequired = 'Awaiting officer review.';
    if (clrReq.status === 'COMPLETED') {
      nextActionRequired = 'Clearance 100% complete. Digital certificate is ready for download.';
    } else if (rejectedStage) {
      nextActionRequired = `Action required on Stage ${rejectedStage.stageNumber} (${rejectedStage.stageDefinition?.name}): ${rejectedStage.remarks}`;
    } else if (currentStage) {
      if (currentStage.status === 'PENDING') {
        nextActionRequired = `Awaiting Stage ${currentStage.stageNumber} (${currentStage.stageDefinition?.name}) officer verification.`;
      } else {
        nextActionRequired = `Please upload verification documents for Stage ${currentStage.stageNumber} (${currentStage.stageDefinition?.name}).`;
      }
    }

    return {
      request: {
        ...clrReq,
        documents: reqDocuments,
      },
      student: {
        ...student,
        user: studentUser
          ? {
              id: studentUser.id,
              firstName: studentUser.firstName,
              lastName: studentUser.lastName,
              email: studentUser.email,
              phoneNumber: studentUser.phoneNumber,
            }
          : null,
        department,
        faculty,
      },
      completedStages,
      currentStage,
      pendingStages,
      rejectedStage,
      documents: reqDocuments,
      overallPercentage,
      totalStagesCount,
      approvedStagesCount,
      timeline,
      certificate,
      nextActionRequired,
    };
  }

  /**
   * 6. ADMINISTRATOR CONFIGURATION ENGINE
   * Dynamic stage management, re-ordering, custom rules without hard-coding department names.
   */
  public getWorkflowConfiguration() {
    return {
      workflow: dbStore.workflow,
      stages: this.getActiveStages().map((s) => {
        const dept = s.departmentId ? dbStore.departments.find((d) => d.id === s.departmentId) : null;
        return {
          ...s,
          departmentName: dept?.name || null,
          departmentCode: dept?.code || null,
        };
      }),
      systemSettings: dbStore.systemSettings,
    };
  }

  public async updateWorkflowStageConfig(
    stageId: string,
    updates: Partial<WorkflowStageConfig>,
    actorUser: { id: string; email: string },
    ipAddress = '127.0.0.1'
  ): Promise<TransactionResult<any>> {
    return this.runTransaction(async () => {
      const stage = dbStore.workflowStages.find((s) => s.id === stageId || s.stageCode === stageId);
      if (!stage) {
        const err: any = new Error(`Workflow stage '${stageId}' not found.`);
        err.code = 'STAGE_NOT_FOUND';
        throw err;
      }

      const previousState = JSON.stringify(stage);

      if (updates.name !== undefined) stage.name = updates.name;
      if (updates.description !== undefined) stage.description = updates.description;
      if (updates.requiredRoleName !== undefined) stage.requiredRoleName = updates.requiredRoleName;
      if (updates.requiresDocumentUpload !== undefined) stage.requiresDocumentUpload = updates.requiresDocumentUpload;
      if (updates.requiredDocumentNames !== undefined) stage.requiredDocumentNames = updates.requiredDocumentNames;
      if (updates.departmentId !== undefined) stage.departmentId = updates.departmentId;
      if (updates.isSequential !== undefined) stage.isSequential = updates.isSequential;
      stage.updatedAt = new Date();

      dbStore.createAuditLogEntry({
        userId: actorUser.id,
        userEmail: actorUser.email,
        action: 'WORKFLOW_STAGE_UPDATED',
        entityType: 'WORKFLOW_STAGE',
        entityId: stage.id,
        previousState,
        newState: JSON.stringify(stage),
        ipAddress,
        userAgent: 'Admin Configuration Portal',
      });

      return stage;
    });
  }

  /**
   * 7. TRANSACTION VERIFICATION TEST SUITE
   * Runs an intentional rollback test to prove ACID transaction consistency in the workflow engine.
   */
  public async testTransactionRollback(): Promise<{
    testName: string;
    passed: boolean;
    initialRequestsCount: number;
    finalRequestsCount: number;
    initialAuditCount: number;
    finalAuditCount: number;
    rollbackAuditRecorded: boolean;
    details: string;
  }> {
    const initialRequestsCount = dbStore.clearanceRequests.length;
    const initialAuditCount = dbStore.auditLogs.length;

    // Run transaction that intentionally throws an error halfway through
    const result = await this.runTransaction(async () => {
      // 1. Make a simulated partial mutation
      dbStore.clearanceRequests.push({
        id: 'req_phantom_test_fail',
        requestId: 'PHANTOM-999',
        studentId: 'std_test',
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Intentionally throw an unrecoverable failure
      throw new Error('SIMULATED_DATABASE_FAILURE: Unrecoverable referential deadlock during stage advance.');
    });

    const finalRequestsCount = dbStore.clearanceRequests.length;
    const finalAuditCount = dbStore.auditLogs.length;
    const phantomRecordExists = dbStore.clearanceRequests.some((r) => r.id === 'req_phantom_test_fail');
    const rollbackLogged = dbStore.auditLogs.some((a) => a.action === 'TRANSACTION_ROLLBACK');

    const passed = !phantomRecordExists && finalRequestsCount === initialRequestsCount && rollbackLogged;

    return {
      testName: 'Workflow Engine Transactional Rollback & Integrity Verification',
      passed,
      initialRequestsCount,
      finalRequestsCount,
      initialAuditCount,
      finalAuditCount,
      rollbackAuditRecorded: rollbackLogged,
      details: passed
        ? 'Successfully rolled back partial database mutations. Zero state corruption or phantom records.'
        : 'Transaction rollback failed to restore pristine store state.',
    };
  }
}

export const workflowEngine = new CentralWorkflowEngine();
