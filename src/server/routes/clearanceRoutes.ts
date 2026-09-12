import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/client';
import { prismaRepo } from '../db/prismaRepository';
import { workflowEngine } from '../workflow/workflowEngine';
import {
  authenticateToken,
  requireRole,
  requirePermission,
  requireStageOfficer,
  requireOwnClearance,
  AuthenticatedRequest,
  STAGE_ROLE_MAPPING,
} from '../auth/middleware';
import crypto from 'crypto';
import { generateCertificatePdf, CertificatePayload } from '../certificates/pdfGenerator';

const router = Router();

/**
 * Guard middleware that returns a 404 Not Found response whenever NODE_ENV === 'production',
 * simulating a completely non-existent endpoint to prevent running tests in live environments.
 */
const requireNonProduction = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({
      error: `Cannot ${req.method} ${req.baseUrl + req.path}`,
      code: 'ROUTE_NOT_FOUND',
    });
    return;
  }
  next();
};

/**
 * GET /api/clearance/my-clearance
 * Student views their own clearance profile, progression, and stages
 */
router.get(
  ['/my-clearance', '/my-request'],
  authenticateToken,
  requireRole(['STUDENT']),
  requireOwnClearance,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const student = req.user?.studentId
      ? dbStore.students.find((s) => s.id === req.user?.studentId)
      : dbStore.students.find((s) => s.userId === req.user?.userId);

    if (!student) {
      res.status(404).json({ error: 'Student clearance record not found for your account.', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    const trackingData = workflowEngine.getRealTimeTracking(student.id);
    const request = dbStore.clearanceRequests.find((r) => r.studentId === student.id);
    const user = dbStore.users.find((u) => u.id === student.userId);
    const department = dbStore.departments.find((d) => d.id === student.departmentId);
    const faculty = dbStore.faculties.find((f) => f.id === student.facultyId);

    const reqDocs = request ? dbStore.documents.filter((d) => d.clearanceRequestId === request.id) : [];

    const stages = request
      ? dbStore.clearanceStageProgresses
          .filter((csp) => csp.clearanceRequestId === request.id)
          .map((csp) => {
            const stageDef = dbStore.workflowStages.find((s) => s.id === csp.stageId);
            const decision = dbStore.approvalDecisions.find((d) => d.stageProgressId === csp.id);
            const assignedOfficer = csp.assignedOfficerId ? dbStore.users.find((u) => u.id === csp.assignedOfficerId) : null;
            const stageDocs = reqDocs.filter((d) => d.stageNumber === csp.stageNumber);

            return {
              ...csp,
              stageDefinition: stageDef,
              decision,
              documents: stageDocs,
              assignedOfficer: assignedOfficer
                ? {
                    id: assignedOfficer.id,
                    firstName: assignedOfficer.firstName,
                    lastName: assignedOfficer.lastName,
                    email: assignedOfficer.email,
                  }
                : null,
            };
          })
      : [];

    let certificate = dbStore.certificates.find(
      (c) => c.studentId === student.id || (request && c.clearanceRequestId === request.id)
    );

    // If request is completed but certificate not yet issued, issue it now
    if (!certificate && request && request.status === 'COMPLETED') {
      const issueDate = request.completionDate || new Date();
      const rawRegSig = `usr_registry_7:${request.id}:CERT_AUTO:${issueDate.getTime()}`;
      const regSigHash = `sha256:${crypto.createHash('sha256').update(rawRegSig).digest('hex')}`;

      certificate = {
        id: `cert_${request.id}`,
        certificateNumber: `FUT-FP-CLR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        clearanceRequestId: request.id,
        studentId: student.id,
        qrCodeToken: `QR_FUTMINNA_FEDPOFFA_${crypto.randomBytes(16).toString('hex')}`,
        issuanceDate: issueDate,
        verifiedByRegistryId: 'usr_registry_7',
        registrySignatureHash: regSigHash,
        status: 'VALID',
        createdAt: issueDate,
        updatedAt: issueDate,
      };
      dbStore.certificates.push(certificate);
      await prismaRepo.mirrorCreateCertificate(certificate as any);

      // Audit trail record
      dbStore.createAuditLogEntry({
        userId: user?.id || 'usr_registry_7',
        userEmail: user?.email || 'registry@fedpoffa.edu.ng',
        action: 'CERTIFICATE_GENERATED',
        entityType: 'CLEARANCE_CERTIFICATE',
        entityId: certificate.id,
        previousState: JSON.stringify({ clearanceStatus: 'COMPLETED' }),
        newState: JSON.stringify({
          certificateNumber: certificate.certificateNumber,
          studentId: student.id,
          matricNumber: student.matricNumber,
          status: 'VALID',
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'Student Clearance Portal',
      });
    }

    const notifications = dbStore.notifications.filter((n) => n.userId === user?.id);

    res.json({
      student: {
        ...student,
        user: user
          ? {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
            }
          : null,
        department,
        faculty,
      },
      request,
      stages,
      certificate,
      notifications,
      realTimeTracking: trackingData,
    });
  }
);

/**
 * GET /api/clearance/realtime-tracking
 * Real-time dynamic stage tracking for authenticated student or specified identifier
 */
router.get(
  '/realtime-tracking',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const studentId = req.user?.studentId || (req.query.studentId as string) || (req.query.requestId as string) || req.user?.userId;
    const tracking = workflowEngine.getRealTimeTracking(studentId || 'std_001');

    if (!tracking) {
      res.status(404).json({ error: 'Clearance tracking data not found.', code: 'TRACKING_NOT_FOUND' });
      return;
    }

    res.json(tracking);
  }
);

/**
 * GET /api/clearance/track/:identifier
 * Public/authorized real-time tracking by clearance request ID or matriculation number
 */
router.get(
  '/track/:identifier',
  (req: AuthenticatedRequest, res: Response): void => {
    const { identifier } = req.params;
    const tracking = workflowEngine.getRealTimeTracking(identifier);

    if (!tracking) {
      res.status(404).json({ error: `No clearance record found for identifier '${identifier}'.`, code: 'TRACKING_NOT_FOUND' });
      return;
    }

    res.json(tracking);
  }
);

/**
 * POST /api/clearance/initiate
 * Student initiates their 7-stage clearance workflow via the Central Workflow Engine
 */
router.post(
  ['/initiate', '/request'],
  authenticateToken,
  requireRole(['STUDENT']),
  requirePermission('CLEARANCE_REQUEST_CREATE'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const student = req.user?.studentId
      ? dbStore.students.find((s) => s.id === req.user?.studentId)
      : dbStore.students.find((s) => s.userId === req.user?.userId);

    if (!student) {
      res.status(404).json({ error: 'Student profile not found for your account.', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    // Check if an active clearance already exists
    const existingReq = dbStore.clearanceRequests.find((r) => r.studentId === student.id);
    if (existingReq && existingReq.status !== 'REJECTED' && existingReq.status !== 'CANCELLED' && req.path.endsWith('/request')) {
      const existingStages = dbStore.clearanceStageProgresses.filter((csp) => csp.clearanceRequestId === existingReq.id);
      res.status(409).json({
        error: 'An active clearance request already exists for your student account.',
        code: 'CLEARANCE_ALREADY_EXISTS',
        request: existingReq,
        stages: existingStages,
      });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Student Portal';

    const result = await workflowEngine.submitClearance(
      student.id,
      {
        id: req.user!.userId,
        email: req.user!.email,
        firstName: req.user!.roles[0],
      },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.code });
      return;
    }

    res.status(201).json({
      success: true,
      code: 'CLEARANCE_INITIATED',
      message: '7-stage clearance workflow initiated successfully.',
      ...result.data,
    });
  }
);

/**
 * GET /api/clearance/student/profile
 * Get student profile details
 */
router.get(
  '/student/profile',
  authenticateToken,
  requireRole(['STUDENT']),
  (req: AuthenticatedRequest, res: Response): void => {
    const student = req.user?.studentId
      ? dbStore.students.find((s) => s.id === req.user?.studentId)
      : dbStore.students.find((s) => s.userId === req.user?.userId);

    if (!student) {
      res.status(404).json({ error: 'Student record not found.', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    const user = dbStore.users.find((u) => u.id === student.userId);
    const department = dbStore.departments.find((d) => d.id === student.departmentId);
    const faculty = dbStore.faculties.find((f) => f.id === student.facultyId);

    res.json({
      student: {
        ...student,
        user: user
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber || '+234 803 123 4567',
              avatarUrl: user.avatarUrl,
            }
          : null,
        department,
        faculty,
        address: (student as any).address || 'Offa Campus Hostel Block B, Kwara State',
        stateOfOrigin: (student as any).stateOfOrigin || 'Kwara State',
        lga: (student as any).lga || 'Offa LGA',
        nextOfKinName: (student as any).nextOfKinName || 'Mrs. Folashade Adebayo',
        nextOfKinPhone: (student as any).nextOfKinPhone || '+234 802 987 6543',
        nextOfKinRelationship: (student as any).nextOfKinRelationship || 'Mother',
      },
    });
  }
);

/**
 * PUT /api/clearance/student/profile
 * Update editable profile details (contact, address, next of kin)
 */
router.put(
  '/student/profile',
  authenticateToken,
  requireRole(['STUDENT']),
  (req: AuthenticatedRequest, res: Response): void => {
    const student = req.user?.studentId
      ? dbStore.students.find((s) => s.id === req.user?.studentId)
      : dbStore.students.find((s) => s.userId === req.user?.userId);

    if (!student) {
      res.status(404).json({ error: 'Student record not found.', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    const user = dbStore.users.find((u) => u.id === student.userId);
    const { phoneNumber, address, stateOfOrigin, lga, nextOfKinName, nextOfKinPhone, nextOfKinRelationship } = req.body;

    if (user && phoneNumber) {
      user.phoneNumber = phoneNumber;
      user.updatedAt = new Date();
    }

    // Update extended student fields
    (student as any).address = address;
    (student as any).stateOfOrigin = stateOfOrigin;
    (student as any).lga = lga;
    (student as any).nextOfKinName = nextOfKinName;
    (student as any).nextOfKinPhone = nextOfKinPhone;
    (student as any).nextOfKinRelationship = nextOfKinRelationship;
    student.updatedAt = new Date();

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    dbStore.createAuditLogEntry({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'STUDENT',
      entityId: student.id,
      previousState: null,
      newState: JSON.stringify({ phoneNumber, address, nextOfKinName }),
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Student Portal',
    });

    res.json({
      success: true,
      message: 'Student profile details updated successfully.',
      student: {
        ...student,
        user,
      },
    });
  }
);

/**
 * GET /api/clearance/student/notifications
 * Fetch notifications for current student
 */
router.get(
  '/student/notifications',
  authenticateToken,
  requireRole(['STUDENT']),
  (req: AuthenticatedRequest, res: Response): void => {
    const userNotifications = dbStore.notifications.filter((n) => n.userId === req.user!.userId);
    res.json({
      count: userNotifications.length,
      unreadCount: userNotifications.filter((n) => !n.isRead).length,
      notifications: userNotifications,
    });
  }
);

/**
 * POST /api/clearance/student/notifications/:id/read
 * Mark notification as read
 */
router.post(
  '/student/notifications/:id/read',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const notif = await prismaRepo.markNotificationAsRead(req.params.id, req.user!.userId);
    res.json({ success: true, notification: notif });
  }
);

/**
 * POST /api/clearance/student/notifications/read-all
 * Mark all notifications as read
 */
router.post(
  '/student/notifications/read-all',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await prismaRepo.markAllNotificationsAsRead(req.user!.userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  }
);

/**
 * POST /api/clearance/student/simulate-scenario
 * Test helper for switching student clearance scenarios
 *
 * NOTE: intentionally left as an in-memory-only demo/showcase tool (not
 * mirrored to the live database). It exists purely to let the UI jump
 * between canned demo states (fresh / rejected / near-complete / completed)
 * for walkthroughs, not to model a real clearance action a student or
 * officer performs — mirroring it would pollute real audit history with
 * synthetic scenario switches.
 */
router.post(
  '/student/simulate-scenario',
  authenticateToken,
  requireRole(['STUDENT', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { scenario } = req.body;
    const student = req.user?.studentId ? dbStore.students.find((s) => s.id === req.user?.studentId) : dbStore.students[0];
    const clrRequest = dbStore.clearanceRequests.find((r) => r.studentId === student?.id) || dbStore.clearanceRequests[0];

    if (scenario === 'FRESH_NOT_STARTED') {
      clrRequest.status = 'DRAFT';
      clrRequest.currentStageNumber = 1;
      clrRequest.completionDate = null;
      dbStore.clearanceStageProgresses.forEach((csp) => {
        csp.status = 'NOT_STARTED';
        csp.assignedOfficerId = null;
        csp.remarks = 'Clearance not yet initiated by student.';
        csp.submittedDocuments = null;
      });
      // Clear documents
      dbStore.documents = dbStore.documents.filter((d) => d.clearanceRequestId !== clrRequest.id);
    } else if (scenario === 'REJECTED_AT_STAGE_1') {
      clrRequest.status = 'IN_PROGRESS';
      clrRequest.currentStageNumber = 1;
      const stage1 = dbStore.clearanceStageProgresses.find((csp) => csp.stageNumber === 1);
      if (stage1) {
        stage1.status = 'REJECTED';
        stage1.remarks = 'Final Project Hardcover copy not signed by Project Supervisor. Please rectify and re-upload scanned signature page.';
        stage1.submittedDocuments = JSON.stringify([
          { name: 'Initial_Draft_Project.pdf', verified: false, uploadedAt: '2026-02-01T10:00:00Z' },
        ]);
        // Update documents
        dbStore.documents = dbStore.documents.filter((d) => !(d.clearanceRequestId === clrRequest.id && d.stageNumber === 1));
        dbStore.documents.unshift({
          id: `doc_rej_${Date.now()}`,
          clearanceRequestId: clrRequest.id,
          stageNumber: 1,
          fileName: 'Initial_Draft_Project.pdf',
          filePath: `/uploads/clearance/${clrRequest.id}/s1_Initial_Draft_Project.pdf`,
          fileType: 'application/pdf',
          fileSizeBytes: 2450000,
          uploadedAt: new Date('2026-02-01T10:00:00Z'),
          status: 'REJECTED',
          createdAt: new Date('2026-02-01T10:00:00Z'),
          updatedAt: new Date(),
        });
      }
      for (let i = 2; i <= 7; i++) {
        const stage = dbStore.clearanceStageProgresses.find((csp) => csp.stageNumber === i);
        if (stage) {
          stage.status = 'NOT_STARTED';
          stage.remarks = 'Awaiting Stage 1 Departmental Clearance completion.';
        }
      }
      dbStore.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: req.user!.userId,
        title: 'Action Required: Stage 1 Rejected',
        message: 'Dr. Abubakar Suleiman (HOD Computer Science) flagged your project submission: Missing supervisor signature.',
        type: 'ACTION_REQUIRED',
        isRead: false,
        readAt: null,
        linkUrl: '/clearance-dashboard',
        createdAt: new Date(),
      });
    } else if (scenario === 'PROGRESS_BURSARY') {
      clrRequest.status = 'IN_PROGRESS';
      clrRequest.currentStageNumber = 4;
      dbStore.clearanceStageProgresses.forEach((csp) => {
        if (csp.stageNumber < 4) {
          csp.status = 'APPROVED';
          csp.remarks = 'Verified and approved with digital signature.';
        } else if (csp.stageNumber === 4) {
          csp.status = 'PENDING';
          csp.remarks = 'Remita RRR payment receipt submitted for bursary clearance verification.';
          csp.submittedDocuments = JSON.stringify([
            { name: 'Remita_RRR_Receipt_2948104820.pdf', verified: false, uploadedAt: '2026-02-03T11:00:00Z' },
          ]);
          dbStore.documents = dbStore.documents.filter((d) => !(d.clearanceRequestId === clrRequest.id && d.stageNumber === 4));
          dbStore.documents.unshift({
            id: `doc_bur_${Date.now()}`,
            clearanceRequestId: clrRequest.id,
            stageNumber: 4,
            fileName: 'Remita_RRR_Receipt_2948104820.pdf',
            filePath: `/uploads/clearance/${clrRequest.id}/s4_Remita_RRR_Receipt.pdf`,
            fileType: 'application/pdf',
            fileSizeBytes: 1850000,
            uploadedAt: new Date('2026-02-03T11:00:00Z'),
            status: 'PENDING',
            createdAt: new Date('2026-02-03T11:00:00Z'),
            updatedAt: new Date(),
          });
        } else {
          csp.status = 'NOT_STARTED';
          csp.remarks = 'Awaiting completion of preceding clearance stages.';
        }
      });
    } else if (scenario === 'ALL_COMPLETED') {
      clrRequest.status = 'COMPLETED';
      clrRequest.currentStageNumber = 7;
      clrRequest.completionDate = new Date();
      dbStore.clearanceStageProgresses.forEach((csp) => {
        csp.status = 'APPROVED';
        csp.remarks = 'Cleared and digitally endorsed by authorized checkpoint officer.';
      });
      dbStore.documents.filter((d) => d.clearanceRequestId === clrRequest.id).forEach((d) => {
        d.status = 'VERIFIED';
      });
    }

    res.json({
      success: true,
      message: `Scenario '${scenario}' applied successfully.`,
      request: clrRequest,
    });
  }
);

/**
 * POST /api/clearance/submit-stage-documents
 * POST /api/clearance/resubmit-stage
 * Student uploads/submits stage documents for review (or re-evaluates a rejected stage)
 */
router.post(
  '/submit-stage-documents',
  authenticateToken,
  requireRole(['STUDENT']),
  requirePermission('CLEARANCE_REQUEST_CREATE'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { stageNumber, documents, studentNotes } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Student Portal';

    const result = await workflowEngine.resubmitStageDocuments(
      {
        stageNumber: Number(stageNumber),
        documents: documents || [],
        studentNotes,
      },
      {
        id: req.user!.userId,
        email: req.user!.email,
      },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.code });
      return;
    }

    res.json({
      success: true,
      message: `Documents for Stage ${stageNumber} submitted successfully for review.`,
      ...result.data,
    });
  }
);

router.post(
  '/resubmit-stage',
  authenticateToken,
  requireRole(['STUDENT']),
  requirePermission('CLEARANCE_REQUEST_CREATE'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { stageNumber, documents, studentNotes } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Student Portal';

    const result = await workflowEngine.resubmitStageDocuments(
      {
        stageNumber: Number(stageNumber),
        documents: documents || [],
        studentNotes,
      },
      {
        id: req.user!.userId,
        email: req.user!.email,
      },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.code });
      return;
    }

    res.json({
      success: true,
      message: `Stage ${stageNumber} resubmitted successfully. Responsible officer notified.`,
      ...result.data,
    });
  }
);

/**
 * GET /api/clearance/officer/queue
 * Officer views requests for their assigned stages with search, filter, date range, and pagination
 */
router.get(
  '/officer/queue',
  authenticateToken,
  requireRole(['HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY', 'SUPER_ADMIN']),
  requirePermission('CLEARANCE_REQUEST_VIEW_ALL'),
  (req: AuthenticatedRequest, res: Response): void => {
    const userRoles = req.user?.roles || [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    // Find which stage numbers match this officer's roles
    let assignedStageNumbers: number[] = [];
    if (isSuperAdmin) {
      assignedStageNumbers = [1, 2, 3, 4, 5, 6, 7];
    } else {
      for (const [stageNumStr, roles] of Object.entries(STAGE_ROLE_MAPPING)) {
        if (roles.some((r) => userRoles.includes(r))) {
          assignedStageNumbers.push(Number(stageNumStr));
        }
      }
    }

    // Query parameters
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const statusFilter = ((req.query.status as string) || 'ALL').toUpperCase();
    const departmentFilter = (req.query.departmentId as string) || '';
    const facultyFilter = (req.query.facultyId as string) || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string, 10) || 10));

    // Get all matched stages
    const allMatchingStages = dbStore.clearanceStageProgresses
      .filter((csp) => assignedStageNumbers.includes(csp.stageNumber))
      .map((csp) => {
        const stageDef = dbStore.workflowStages.find((s) => s.id === csp.stageId);
        const clrReq = dbStore.clearanceRequests.find((r) => r.id === csp.clearanceRequestId);
        const student = clrReq ? dbStore.students.find((s) => s.id === clrReq.studentId) : null;
        const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
        const dept = student ? dbStore.departments.find((d) => d.id === student.departmentId) : null;
        const faculty = student ? dbStore.faculties.find((f) => f.id === student.facultyId) : null;
        const decision = dbStore.approvalDecisions.find((d) => d.stageProgressId === csp.id);
        const officerUser = csp.assignedOfficerId ? dbStore.users.find((u) => u.id === csp.assignedOfficerId) : null;
        const stageDocs = dbStore.documents.filter((d) => d.clearanceRequestId === csp.clearanceRequestId && d.stageNumber === csp.stageNumber);

        return {
          ...csp,
          stageDefinition: stageDef,
          clearanceRequest: clrReq,
          documents: stageDocs,
          student: student
            ? {
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
                department: dept,
                faculty: faculty,
              }
            : null,
          decision,
          assignedOfficer: officerUser
            ? {
                id: officerUser.id,
                name: `${officerUser.firstName} ${officerUser.lastName}`,
                email: officerUser.email,
              }
            : null,
        };
      });

    // Compute aggregate statistics for the officer's dashboard
    const stats = {
      total: allMatchingStages.length,
      pending: allMatchingStages.filter((s) => s.status === 'PENDING').length,
      approved: allMatchingStages.filter((s) => s.status === 'APPROVED').length,
      rejected: allMatchingStages.filter((s) => s.status === 'REJECTED').length,
      notStarted: allMatchingStages.filter((s) => s.status === 'NOT_STARTED').length,
    };

    // Filter by Status
    let filtered = allMatchingStages;
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filter by Search (student name, matric number, request ID, email)
    if (search) {
      filtered = filtered.filter((s) => {
        const studentName = `${s.student?.user?.firstName || ''} ${s.student?.user?.lastName || ''}`.toLowerCase();
        const matric = (s.student?.matricNumber || '').toLowerCase();
        const reqId = (s.clearanceRequest?.requestId || '').toLowerCase();
        const email = (s.student?.user?.email || '').toLowerCase();
        const deptName = (s.student?.department?.name || '').toLowerCase();
        return (
          studentName.includes(search) ||
          matric.includes(search) ||
          reqId.includes(search) ||
          email.includes(search) ||
          deptName.includes(search)
        );
      });
    }

    // Filter by Department
    if (departmentFilter && departmentFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.student?.departmentId === departmentFilter || s.student?.department?.code === departmentFilter);
    }

    // Filter by Faculty
    if (facultyFilter && facultyFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.student?.facultyId === facultyFilter || s.student?.faculty?.code === facultyFilter);
    }

    // Filter by Date
    if (startDate) {
      filtered = filtered.filter((s) => {
        const dateToCheck = s.updatedAt || s.createdAt;
        return new Date(dateToCheck) >= startDate;
      });
    }
    if (endDate) {
      filtered = filtered.filter((s) => {
        const dateToCheck = s.updatedAt || s.createdAt;
        return new Date(dateToCheck) <= endDate;
      });
    }

    // Sort: Pending first, then newest updated
    filtered.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    // Pagination
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedStages = filtered.slice(startIndex, startIndex + limit);

    // Recent activity logs relevant to this officer's unit
    const recentActivity = dbStore.auditLogs
      .filter((a) => a.action.startsWith('STAGE_') || a.action.startsWith('CLEARANCE_'))
      .slice(-10)
      .reverse();

    res.json({
      assignedStageNumbers,
      stats,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
      stages: paginatedStages,
      recentActivity,
    });
  }
);

/**
 * GET /api/clearance/officer/request-detail/:requestId
 * Full detailed clearance dossier for officer review
 */
router.get(
  '/officer/request-detail/:requestId',
  authenticateToken,
  requireRole(['HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { requestId } = req.params;

    const clrReq = dbStore.clearanceRequests.find(
      (r) => r.id === requestId || r.requestId === requestId
    );

    if (!clrReq) {
      res.status(404).json({ error: 'Clearance request not found.', code: 'NOT_FOUND' });
      return;
    }

    const student = dbStore.students.find((s) => s.id === clrReq.studentId);
    const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
    const department = student ? dbStore.departments.find((d) => d.id === student.departmentId) : null;
    const faculty = student ? dbStore.faculties.find((f) => f.id === student.facultyId) : null;

    const reqDocs = dbStore.documents.filter((d) => d.clearanceRequestId === clrReq.id);

    const stages = dbStore.clearanceStageProgresses
      .filter((csp) => csp.clearanceRequestId === clrReq.id)
      .sort((a, b) => a.stageNumber - b.stageNumber)
      .map((csp) => {
        const stageDef = dbStore.workflowStages.find((s) => s.id === csp.stageId);
        const decision = dbStore.approvalDecisions.find((d) => d.stageProgressId === csp.id);
        const officerUser = csp.assignedOfficerId ? dbStore.users.find((u) => u.id === csp.assignedOfficerId) : null;
        const stageDocs = reqDocs.filter((d) => d.stageNumber === csp.stageNumber);

        return {
          ...csp,
          stageDefinition: stageDef,
          decision,
          documents: stageDocs,
          officerName: officerUser ? `${officerUser.firstName} ${officerUser.lastName}` : null,
        };
      });

    res.json({
      request: {
        ...clrReq,
        documents: reqDocs,
      },
      student: student
        ? {
            ...student,
            user: studentUser
              ? {
                  firstName: studentUser.firstName,
                  lastName: studentUser.lastName,
                  email: studentUser.email,
                  phoneNumber: studentUser.phoneNumber,
                }
              : null,
            department,
            faculty,
          }
        : null,
      stages,
      documents: reqDocs,
      auditHistory: dbStore.auditLogs.filter((a) => a.entityId === clrReq.id || stages.some((s) => s.id === a.entityId)),
    });
  }
);

/**
 * POST /api/clearance/officer/endorse
 * Officer signs and endorses a clearance stage via Central Workflow Engine
 */
router.post(
  '/officer/endorse',
  authenticateToken,
  requirePermission('CLEARANCE_STAGE_APPROVE'),
  requireStageOfficer(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { stageProgressId, stageNumber, clearanceRequestId, remarks } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Officer Portal';

    const result = await workflowEngine.approveStage(
      {
        stageProgressId,
        stageNumber: stageNumber ? Number(stageNumber) : undefined,
        clearanceRequestId,
        remarks,
      },
      {
        id: req.user!.userId,
        email: req.user!.email,
        roles: req.user!.roles || [],
      },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.code });
      return;
    }

    res.json({
      success: true,
      message: `Stage successfully approved and digitally endorsed.`,
      ...result.data,
    });
  }
);

/**
 * POST /api/clearance/officer/reject
 * Officer rejects a clearance stage with mandatory reason via Central Workflow Engine
 */
router.post(
  '/officer/reject',
  authenticateToken,
  requirePermission('CLEARANCE_STAGE_REJECT'),
  requireStageOfficer(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { stageProgressId, stageNumber, clearanceRequestId, remarks } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Officer Portal';

    const result = await workflowEngine.rejectStage(
      {
        stageProgressId,
        stageNumber: stageNumber ? Number(stageNumber) : undefined,
        clearanceRequestId,
        reason: remarks,
      },
      {
        id: req.user!.userId,
        email: req.user!.email,
        roles: req.user!.roles || [],
      },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.code });
      return;
    }

    res.json({
      success: true,
      message: `Stage has been rejected with corrective instructions dispatched to student.`,
      ...result.data,
    });
  }
);

/**
 * POST /api/clearance/workflow/test-transaction
 * Executes simulated database fault to verify transactional rollback and audit durability
 *
 * SECURITY GATING:
 * 1. Environment Gating: Returns HTTP 404 in production (process.env.NODE_ENV === 'production')
 *    as if the route does not exist, preventing fault injection against live databases.
 * 2. Role Gating: In non-production environments, strictly requires a valid SUPER_ADMIN JWT
 *    (authenticateToken + requireRole(['SUPER_ADMIN'])) so only system administrators can execute rollback tests.
 * DO NOT REMOVE OR BYPASS THIS GATING.
 */
router.post(
  '/workflow/test-transaction',
  requireNonProduction,
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const testReport = await workflowEngine.testTransactionRollback();
    res.json(testReport);
  }
);

/**
 * POST /api/clearance/officer/test-role-suite
 * Multi-role automated security verification suite testing role boundaries across all 7 clearance units
 *
 * SECURITY GATING:
 * 1. Environment Gating: Returns HTTP 404 in production (process.env.NODE_ENV === 'production')
 *    as if the route does not exist, preventing role testing diagnostics in live environments.
 * 2. Role Gating: In non-production environments, strictly requires authorized clearance officers or super admins
 *    (authenticateToken + requireRole([...])) to ensure unauthenticated users cannot invoke RBAC test suites.
 * DO NOT REMOVE OR BYPASS THIS GATING.
 */
router.post(
  '/officer/test-role-suite',
  requireNonProduction,
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY']),
  (req: AuthenticatedRequest, res: Response): void => {
  const roleTestScenarios = [
    { role: 'HOD', name: 'Department Head', allowedStage: 1, disallowedStages: [2, 3, 4, 5, 6, 7] },
    { role: 'DEAN', name: 'Faculty Dean', allowedStage: 2, disallowedStages: [1, 3, 4, 5, 6, 7] },
    { role: 'LIBRARIAN', name: 'University Librarian', allowedStage: 3, disallowedStages: [1, 2, 4, 5, 6, 7] },
    { role: 'BURSAR', name: 'Bursary Officer', allowedStage: 4, disallowedStages: [1, 2, 3, 5, 6, 7] },
    { role: 'STUDENT_AFFAIRS', name: 'Student Affairs / Hostel', allowedStage: 5, disallowedStages: [1, 2, 3, 4, 6, 7] },
    { role: 'ICT_DIRECTOR', name: 'ICT Directorate', allowedStage: 6, disallowedStages: [1, 2, 3, 4, 5, 7] },
    { role: 'REGISTRY', name: 'Academic Registry', allowedStage: 7, disallowedStages: [1, 2, 3, 4, 5, 6] },
  ];

  const results = roleTestScenarios.map((scenario) => {
    const allowedRolesForStage = STAGE_ROLE_MAPPING[scenario.allowedStage] || [];
    const canAccessOwnStage = allowedRolesForStage.includes(scenario.role);

    // Verify all disallowed stages reject this role
    const disallowedPassed = scenario.disallowedStages.every((stageNum) => {
      const allowedRoles = STAGE_ROLE_MAPPING[stageNum] || [];
      return !allowedRoles.includes(scenario.role);
    });

    return {
      role: scenario.role,
      name: scenario.name,
      assignedStage: scenario.allowedStage,
      canAccessAssignedStage: canAccessOwnStage,
      crossRoleAccessBlocked: disallowedPassed,
      status: canAccessOwnStage && disallowedPassed ? 'PASS' : 'FAIL',
    };
  });

  const allPassed = results.every((r) => r.status === 'PASS');

  res.json({
    success: allPassed,
    summary: allPassed
      ? 'All 7 officer roles strictly constrained to their designated workflow stages. Zero cross-unit privilege escalation.'
      : 'RBAC boundary discrepancy detected.',
    results,
  });
});

/**
 * Assembles official certificate payload for both JSON API and PDF generation
 */
export function assembleCertificateData(certificateNumber: string): CertificatePayload | null {
  const normalizedCertNum = certificateNumber.trim().toUpperCase();

  // Search by certificate number, ID, or QR code token
  const cert = dbStore.certificates.find(
    (c) =>
      c.certificateNumber.toUpperCase() === normalizedCertNum ||
      c.id.toLowerCase() === certificateNumber.toLowerCase() ||
      c.qrCodeToken === certificateNumber
  );

  if (!cert) {
    return null;
  }

  const student = dbStore.students.find((s) => s.id === cert.studentId);
  const studentUser = student ? dbStore.users.find((u) => u.id === student.userId) : null;
  const department = student ? dbStore.departments.find((d) => d.id === student.departmentId) : null;
  const faculty = student ? dbStore.faculties.find((f) => f.id === student.facultyId) : null;
  const clrRequest = dbStore.clearanceRequests.find((r) => r.id === cert.clearanceRequestId);

  // Retrieve all 7 stage progresses to verify full compliance
  const stages = dbStore.clearanceStageProgresses
    .filter((csp) => !clrRequest || csp.clearanceRequestId === clrRequest.id)
    .sort((a, b) => a.stageNumber - b.stageNumber)
    .map((csp) => {
      const stageDef = dbStore.workflowStages.find((s) => s.id === csp.stageId);
      const decision = dbStore.approvalDecisions.find((d) => d.stageProgressId === csp.id);
      const officer = csp.assignedOfficerId ? dbStore.users.find((u) => u.id === csp.assignedOfficerId) : null;

      return {
        stageNumber: csp.stageNumber,
        stageCode: stageDef?.stageCode || `STAGE_${csp.stageNumber}`,
        name: stageDef?.name || `Checkpoint ${csp.stageNumber}`,
        requiredRole: stageDef?.requiredRoleName || 'OFFICER',
        status: csp.status,
        endorsedAt: csp.completedAt || csp.updatedAt,
        digitalStamp: decision?.digitalStamp || `FUTMINNA-FEDPOFFA/STAGE_${csp.stageNumber}/APPROVED`,
        signatureHash: decision?.signatureHash || cert.registrySignatureHash,
        endorsedBy: officer ? `${officer.firstName} ${officer.lastName}` : 'Academic Clearance Officer',
      };
    });

  // Verify that all 7 active stages are approved
  const allStagesApproved = stages.length >= 7 && stages.every((s) => s.status === 'APPROVED');
  const isRevoked = cert.status === 'REVOKED';
  const isValid = allStagesApproved && !isRevoked;

  // Format student name (e.g. ADEBAYO, OLUWASEUN)
  const formattedStudentName = studentUser
    ? `${studentUser.lastName.toUpperCase()}, ${studentUser.firstName.toUpperCase()}${studentUser.middleName ? ' ' + studentUser.middleName.toUpperCase() : ''}`
    : 'STUDENT RECORD';

  return {
    isValid,
    verificationStatus: isValid ? 'OFFICIALLY_VERIFIED' : isRevoked ? 'REVOKED' : 'INCOMPLETE',
    verifiedAt: new Date(),
    certificate: {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      clearanceId: clrRequest?.requestId || `CLR-${cert.clearanceRequestId.slice(-6).toUpperCase()}`,
      issuanceDate: cert.issuanceDate,
      academicSession: student?.academicSession || '2024/2025',
      graduationYear: student?.graduationYear || 2024,
      status: cert.status || 'VALID',
      registrySignatureHash: cert.registrySignatureHash,
      qrCodeToken: cert.qrCodeToken,
      verificationUrl: `/verify/certificate/${encodeURIComponent(cert.certificateNumber)}`,
    },
    student: {
      fullName: formattedStudentName,
      matricNumber: student?.matricNumber || 'N/A',
      programme: 'Bachelor of Technology (B.Tech) Direct Degree Affiliation Programme',
      level: 'DEGREE_400 (Graduating Finalist)',
      departmentCode: department?.code || 'CSC',
      departmentName: department?.name || 'Computer Science',
      facultyCode: faculty?.code || 'FAST',
      facultyName: faculty?.name || 'Faculty of Applied Sciences & Technology',
    },
    institution: {
      degreeAwardingUniversity: 'FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA (FUTMINNA)',
      affiliatedInstitution: 'THE FEDERAL POLYTECHNIC, OFFA (FEDPOFFA)',
      directorate: 'DIRECTORATE OF DEGREE AFFILIATION & PARTNERSHIP PROGRAMMES',
      registryUnit: 'ACADEMIC REGISTRY & CENTRAL EXAMINATIONS DIVISION',
      accreditationStandard: 'NUC & NBTE DIRECT AFFILIATION CLEARANCE FRAMEWORK',
    },
    completionStatement:
      'This is to officially certify that the candidate named herein has duly satisfied all statutory graduation clearance requirements across all seven (7) institutional units: Departmental Board, Faculty Deanery, University Library, Bursary & Accounts, Hostel & Hall Management, Directorate of ICT, and Academic Registry. The candidate is in good academic and administrative standing.',
    stages,
  };
}

/**
 * GET /api/clearance/certificate/:certificateNumber
 * Public/Authorized retrieval of an institutional digital clearance certificate
 */
router.get('/certificate/:certificateNumber', (req: Request, res: Response): void => {
  const { certificateNumber } = req.params;
  const certData = assembleCertificateData(certificateNumber);

  if (!certData) {
    res.status(404).json({
      error: `Certificate with reference '${certificateNumber}' was not found in the institutional registry.`,
      code: 'CERTIFICATE_NOT_FOUND',
      isValid: false,
    });
    return;
  }

  res.json(certData);
});

/**
 * GET /api/clearance/certificate/:certificateNumber/pdf
 * Streams officially formatted, downloadable clearance certificate PDF
 */
router.get('/certificate/:certificateNumber/pdf', async (req: Request, res: Response): Promise<void> => {
  const { certificateNumber } = req.params;
  const certData = assembleCertificateData(certificateNumber);

  if (!certData) {
    res.status(404).json({
      error: `Certificate with reference '${certificateNumber}' was not found in the institutional registry.`,
      code: 'CERTIFICATE_NOT_FOUND',
      isValid: false,
    });
    return;
  }

  try {
    const pdfBytes = await generateCertificatePdf(certData);
    const safeCertNum = certData.certificate.certificateNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Clearance-Certificate-${safeCertNum}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('Failed to generate clearance certificate PDF:', err);
    res.status(500).json({
      error: 'Failed to generate official clearance certificate PDF.',
      code: 'PDF_GENERATION_FAILED',
      details: err?.message,
    });
  }
});

/**
 * GET /api/public/verify/certificate/:certificateNumber
 * Alias for public verification endpoint
 */
router.get('/public/verify/certificate/:certificateNumber', (req: Request, res: Response): void => {
  // Delegate to certificate endpoint
  const targetUrl = `/api/clearance/certificate/${encodeURIComponent(req.params.certificateNumber)}`;
  res.redirect(307, targetUrl);
});

/**
 * POST /api/clearance/generate-certificate
 * Trigger explicit certificate generation if all 7 stages are approved
 */
router.post(
  '/generate-certificate',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const studentId = req.user?.studentId || (req.body.studentId as string);

    const student = studentId ? dbStore.students.find((s) => s.id === studentId) : null;
    if (!student) {
      res.status(404).json({ error: 'Student record not found.', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    const clrRequest = dbStore.clearanceRequests.find((r) => r.studentId === student.id);
    if (!clrRequest) {
      res.status(404).json({ error: 'Clearance request record not found.', code: 'REQUEST_NOT_FOUND' });
      return;
    }

    // Check if certificate already exists
    let existingCert = dbStore.certificates.find((c) => c.clearanceRequestId === clrRequest.id);
    if (existingCert) {
      res.json({
        success: true,
        message: 'Certificate is already generated and active.',
        certificate: existingCert,
      });
      return;
    }

    // Verify all 7 stages are approved
    const activeStages = workflowEngine.getActiveStages();
    const stageProgresses = dbStore.clearanceStageProgresses.filter(
      (sp) => sp.clearanceRequestId === clrRequest.id
    );

    const allApproved = activeStages.every((stage) => {
      const sp = stageProgresses.find((p) => p.stageNumber === stage.stageNumber);
      return sp && sp.status === 'APPROVED';
    });

    if (!allApproved) {
      res.status(400).json({
        error: 'Cannot generate digital certificate. All 7 mandatory clearance checkpoints must be approved first.',
        code: 'STAGES_INCOMPLETE',
      });
      return;
    }

    // Generate new certificate
    const completedAt = new Date();
    const certNumber = `FUT-FP-CLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const rawSig = `${req.user?.userId || 'registry'}:${clrRequest.id}:CERT_GEN:${completedAt.getTime()}`;
    const sigHash = `sha256:${crypto.createHash('sha256').update(rawSig).digest('hex')}`;

    const newCert = {
      id: `cert_${Date.now()}`,
      certificateNumber: certNumber,
      clearanceRequestId: clrRequest.id,
      studentId: student.id,
      qrCodeToken: `QR_FUTMINNA_FEDPOFFA_${crypto.randomBytes(16).toString('hex')}`,
      issuanceDate: completedAt,
      verifiedByRegistryId: req.user?.userId || 'usr_registry_7',
      registrySignatureHash: sigHash,
      status: 'VALID',
      createdAt: completedAt,
      updatedAt: completedAt,
    };
    dbStore.certificates.push(newCert);
    await prismaRepo.mirrorCreateCertificate(newCert as any);

    clrRequest.status = 'COMPLETED';
    clrRequest.completionDate = completedAt;
    clrRequest.updatedAt = completedAt;
    await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);

    // Log immutable audit entry
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    dbStore.createAuditLogEntry({
      userId: req.user?.userId || 'usr_registry_7',
      userEmail: req.user?.email || 'registry@fedpoffa.edu.ng',
      action: 'CERTIFICATE_GENERATED',
      entityType: 'CLEARANCE_CERTIFICATE',
      entityId: newCert.id,
      previousState: JSON.stringify({ clearanceStatus: 'IN_PROGRESS' }),
      newState: JSON.stringify({
        certificateNumber: newCert.certificateNumber,
        studentId: student.id,
        matricNumber: student.matricNumber,
        qrCodeToken: newCert.qrCodeToken,
        status: 'VALID',
      }),
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Clearance Portal',
    });

    res.json({
      success: true,
      message: 'Graduation Clearance Certificate generated and registered successfully.',
      certificate: newCert,
    });
  }
);

/**
 * GET /api/clearance/documents
 * Query documents across requests or by clearanceRequestId / stageNumber
 */
router.get(
  '/documents',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const { requestId, clearanceRequestId, stageNumber } = req.query;
    const reqId = (clearanceRequestId || requestId) as string;

    let docs = dbStore.documents;
    if (reqId) {
      docs = docs.filter((d) => d.clearanceRequestId === reqId);
    }
    if (stageNumber) {
      docs = docs.filter((d) => d.stageNumber === Number(stageNumber));
    }

    res.json({
      success: true,
      count: docs.length,
      documents: docs,
    });
  }
);

/**
 * GET /api/clearance/requests/:requestId/documents
 * Get all relational documents for a specific clearance request
 */
router.get(
  '/requests/:requestId/documents',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const { requestId } = req.params;
    const docs = dbStore.documents.filter((d) => d.clearanceRequestId === requestId);

    res.json({
      success: true,
      requestId,
      count: docs.length,
      documents: docs,
    });
  }
);

/**
 * POST /api/clearance/upload-document
 * POST /api/clearance/submit-document
 * Create a new Document record attached to a ClearanceRequest and stage
 */
router.post(
  ['/upload-document', '/submit-document'],
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { clearanceRequestId, stageNumber, fileName, filePath, fileType, fileSizeBytes, studentNotes } = req.body;

    if (!clearanceRequestId || !stageNumber || !fileName) {
      res.status(400).json({ error: 'clearanceRequestId, stageNumber, and fileName are required.', code: 'MISSING_FIELDS' });
      return;
    }

    const clrRequest = dbStore.clearanceRequests.find((r) => r.id === clearanceRequestId);
    if (!clrRequest) {
      res.status(404).json({ error: 'Clearance request not found.', code: 'REQUEST_NOT_FOUND' });
      return;
    }

    const stageProgress = dbStore.clearanceStageProgresses.find(
      (sp) => sp.clearanceRequestId === clearanceRequestId && sp.stageNumber === Number(stageNumber)
    );

    const newDoc = {
      id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      clearanceRequestId,
      stageNumber: Number(stageNumber),
      fileName,
      filePath: filePath || `/uploads/clearance/${clearanceRequestId}/s${stageNumber}_${fileName}`,
      fileType: fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      fileSizeBytes: fileSizeBytes || 1024 * 1024 * 2,
      uploadedAt: new Date(),
      status: 'PENDING' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.documents.unshift(newDoc);
    await prismaRepo.mirrorCreateDocument(newDoc as any);

    // Update stage progress status if it was not started or rejected
    if (stageProgress && (stageProgress.status === 'NOT_STARTED' || stageProgress.status === 'REJECTED')) {
      stageProgress.status = 'PENDING';
      stageProgress.initiatedAt = new Date();
      stageProgress.updatedAt = new Date();
      if (studentNotes) {
        stageProgress.remarks = studentNotes;
      }
      await prismaRepo.mirrorUpsertStageProgress(stageProgress as any);
    }

    if (clrRequest.status === 'REJECTED') {
      clrRequest.status = 'IN_PROGRESS';
      clrRequest.rejectionReason = null;
      clrRequest.updatedAt = new Date();
      await prismaRepo.mirrorUpsertClearanceRequest(clrRequest);
    }

    // Immutable audit trail
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    dbStore.createAuditLogEntry({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: newDoc.id,
      previousState: null,
      newState: JSON.stringify({
        fileName: newDoc.fileName,
        stageNumber: newDoc.stageNumber,
        clearanceRequestId: newDoc.clearanceRequestId,
        status: newDoc.status,
      }),
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Clearance Portal',
    });

    res.json({
      success: true,
      message: `Document '${fileName}' uploaded successfully for Stage ${stageNumber}.`,
      document: newDoc,
    });
  }
);

/**
 * PATCH /api/clearance/documents/:id/status
 * Officer updates verification status of a document
 */
router.patch(
  '/documents/:id/status',
  authenticateToken,
  requireRole(['HOD', 'DEAN', 'LIBRARIAN', 'BURSAR', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR', 'REGISTRY', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid document status. Must be PENDING, VERIFIED, or REJECTED.', code: 'INVALID_STATUS' });
      return;
    }

    const existingDoc = dbStore.documents.find((d) => d.id === id);
    if (!existingDoc) {
      res.status(404).json({ error: 'Document record not found.', code: 'DOC_NOT_FOUND' });
      return;
    }

    const prevStatus = existingDoc.status;
    const doc = await prismaRepo.updateDocumentStatus(id, status);

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    dbStore.createAuditLogEntry({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DOCUMENT_STATUS_UPDATED',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      previousState: JSON.stringify({ status: prevStatus }),
      newState: JSON.stringify({ status, officer: req.user!.email }),
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Officer Portal',
    });

    res.json({
      success: true,
      message: `Document status updated to ${status}.`,
      document: doc,
    });
  }
);

export default router;
