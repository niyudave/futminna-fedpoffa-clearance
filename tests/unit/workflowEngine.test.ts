import { describe, it, expect, beforeEach } from 'vitest';
import { workflowEngine } from '../../src/server/workflow/workflowEngine';
import { dbStore } from '../../src/server/db/client';

describe('WorkflowEngine Unit Tests', () => {
  const studentUser = {
    id: 'usr_student_1',
    email: 'student.test@futminna-fedpoffa.edu.ng',
    firstName: 'Ibrahim',
    lastName: 'Adeyemi',
  };

  const hodOfficer = {
    id: 'usr_hod_2',
    email: 'hod.csc@fedpoffa.edu.ng',
    roles: ['HOD'],
    firstName: 'Dr. Abubakar',
    lastName: 'Suleiman',
  };

  const deanOfficer = {
    id: 'usr_dean_3',
    email: 'dean.fast@fedpoffa.edu.ng',
    roles: ['DEAN'],
    firstName: 'Prof. Comfort',
    lastName: 'Ogunleye',
  };

  const officersByStage = [
    { stageNumber: 1, role: 'HOD', officer: hodOfficer },
    { stageNumber: 2, role: 'DEAN', officer: deanOfficer },
    {
      stageNumber: 3,
      role: 'LIBRARIAN',
      officer: {
        id: 'usr_librarian_4',
        email: 'library.officer@fedpoffa.edu.ng',
        roles: ['LIBRARIAN'],
        firstName: 'Mr. Solomon',
        lastName: 'Eze',
      },
    },
    {
      stageNumber: 4,
      role: 'BURSAR',
      officer: {
        id: 'usr_bursar_5',
        email: 'bursar.clearance@fedpoffa.edu.ng',
        roles: ['BURSAR'],
        firstName: 'Mr. Emmanuel',
        lastName: 'Kareem',
      },
    },
    {
      stageNumber: 5,
      role: 'STUDENT_AFFAIRS',
      officer: {
        id: 'usr_student_affairs_6',
        email: 'studentaffairs@fedpoffa.edu.ng',
        roles: ['STUDENT_AFFAIRS'],
        firstName: 'Hajia Zainab',
        lastName: 'Mohammed',
      },
    },
    {
      stageNumber: 6,
      role: 'ICT_DIRECTOR',
      officer: {
        id: 'usr_ict_director_7',
        email: 'ict.director@fedpoffa.edu.ng',
        roles: ['ICT_DIRECTOR'],
        firstName: 'Engr. Daniel',
        lastName: 'Olatunji',
      },
    },
    {
      stageNumber: 7,
      role: 'REGISTRY',
      officer: {
        id: 'usr_registry_8',
        email: 'registry.clearance@futminna.edu.ng',
        roles: ['REGISTRY'],
        firstName: 'Mrs. Fatima',
        lastName: 'Bello',
      },
    },
  ];

  beforeEach(() => {
    dbStore.initRelations();
  });

  describe('submitClearance', () => {
    it('creates Stage 1 in PENDING and Stages 2-7 in NOT_STARTED', async () => {
      const result = await workflowEngine.submitClearance('std_001', studentUser);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const { clearanceRequest, stagesCount } = result.data;
      expect(stagesCount).toBe(7);
      expect(clearanceRequest.status).toBe('IN_PROGRESS');
      expect(clearanceRequest.currentStageNumber).toBe(1);

      // Verify individual stage statuses
      const stages = dbStore.clearanceStageProgresses
        .filter((sp) => sp.clearanceRequestId === clearanceRequest.id)
        .sort((a, b) => a.stageNumber - b.stageNumber);

      expect(stages.length).toBe(7);
      expect(stages[0].stageNumber).toBe(1);
      expect(stages[0].status).toBe('PENDING');

      for (let i = 1; i < 7; i++) {
        expect(stages[i].stageNumber).toBe(i + 1);
        expect(stages[i].status).toBe('NOT_STARTED');
      }
    });

    it('rejects submission if student is not found', async () => {
      const result = await workflowEngine.submitClearance('std_non_existent', {
        id: 'usr_unknown',
        email: 'ghost@nowhere.edu',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('STUDENT_NOT_FOUND');
    });

    it('rejects submission if student is not marked clearance-eligible', async () => {
      const targetStudent = dbStore.students.find((s) => s.id === 'std_001');
      if (targetStudent) targetStudent.isClearanceEligible = false;

      const result = await workflowEngine.submitClearance('std_001', studentUser);
      expect(result.success).toBe(false);
      expect(result.code).toBe('NOT_ELIGIBLE');
    });
  });

  describe('approveStage', () => {
    it('approving Stage N activates Stage N+1 sequentially', async () => {
      // 1. Submit clearance
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      // 2. Approve Stage 1 by HOD
      const approveRes = await workflowEngine.approveStage(
        {
          clearanceRequestId: reqId,
          stageNumber: 1,
          remarks: 'Approved departmental project & laboratory clearance.',
        },
        hodOfficer
      );

      expect(approveRes.success).toBe(true);
      expect(approveRes.data.requestStatus).toBe('IN_PROGRESS');
      expect(approveRes.data.currentStageNumber).toBe(2);

      // Verify Stage 1 is now APPROVED
      const stage1 = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === reqId && sp.stageNumber === 1
      );
      expect(stage1?.status).toBe('APPROVED');
      expect(stage1?.assignedOfficerId).toBe(hodOfficer.id);

      // Verify Stage 2 is now activated to PENDING
      const stage2 = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === reqId && sp.stageNumber === 2
      );
      expect(stage2?.status).toBe('PENDING');

      // Verify Stage 3 is still NOT_STARTED
      const stage3 = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === reqId && sp.stageNumber === 3
      );
      expect(stage3?.status).toBe('NOT_STARTED');
    });

    it('prevents out-of-sequence approval (approving NOT_STARTED stage)', async () => {
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      // Attempt to approve Stage 2 while Stage 1 is still PENDING
      const outOfSeqRes = await workflowEngine.approveStage(
        {
          clearanceRequestId: reqId,
          stageNumber: 2,
          remarks: 'Premature approval attempt',
        },
        deanOfficer
      );

      expect(outOfSeqRes.success).toBe(false);
      expect(outOfSeqRes.code).toBe('STAGE_NOT_ACTIVE');
    });

    it('rejects approval when officer role does not match stage requirement', async () => {
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      // Dean attempting to approve Stage 1 (which requires HOD)
      const wrongRoleRes = await workflowEngine.approveStage(
        {
          clearanceRequestId: reqId,
          stageNumber: 1,
          remarks: 'Dean attempting HOD approval',
        },
        deanOfficer
      );

      expect(wrongRoleRes.success).toBe(false);
      expect(wrongRoleRes.code).toBe('ROLE_UNAUTHORIZED');
    });
  });

  describe('rejectStage', () => {
    it('rejecting a stage does not advance it and sets request to REJECTED', async () => {
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      const rejectReason = 'Missing supervisor hard-copy signoff on research documentation.';
      const rejectRes = await workflowEngine.rejectStage(
        {
          clearanceRequestId: reqId,
          stageNumber: 1,
          reason: rejectReason,
        },
        hodOfficer
      );

      expect(rejectRes.success).toBe(true);

      // Verify Stage 1 is REJECTED
      const stage1 = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === reqId && sp.stageNumber === 1
      );
      expect(stage1?.status).toBe('REJECTED');
      expect(stage1?.remarks).toBe(rejectReason);

      // Verify request is REJECTED and stays on stage 1
      const request = dbStore.clearanceRequests.find((r) => r.id === reqId);
      expect(request?.status).toBe('REJECTED');
      expect(request?.currentStageNumber).toBe(1);
      expect(request?.rejectionReason).toBe(rejectReason);

      // Verify Stage 2 was NOT advanced (remains NOT_STARTED)
      const stage2 = dbStore.clearanceStageProgresses.find(
        (sp) => sp.clearanceRequestId === reqId && sp.stageNumber === 2
      );
      expect(stage2?.status).toBe('NOT_STARTED');
    });

    it('rejects rejection attempt if reason is missing or too short', async () => {
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      const noReasonRes = await workflowEngine.rejectStage(
        {
          clearanceRequestId: reqId,
          stageNumber: 1,
          reason: 'bad', // < 5 chars
        },
        hodOfficer
      );

      expect(noReasonRes.success).toBe(false);
      expect(noReasonRes.code).toBe('MISSING_REASON');
    });
  });

  describe('Full 7-Stage Pipeline & Certificate Generation', () => {
    it('approving all 7 stages in order marks request COMPLETED and issues certificate', async () => {
      // 1. Initiate clearance
      const submitRes = await workflowEngine.submitClearance('std_001', studentUser);
      const reqId = submitRes.data.clearanceRequest.id;

      // 2. Approve all 7 stages sequentially
      for (const { stageNumber, role, officer } of officersByStage) {
        const approveRes = await workflowEngine.approveStage(
          {
            clearanceRequestId: reqId,
            stageNumber,
            remarks: `Stage ${stageNumber} approved by ${role}.`,
          },
          officer
        );

        expect(approveRes.success).toBe(true);

        if (stageNumber < 7) {
          expect(approveRes.data.isCompleted).toBe(false);
          expect(approveRes.data.requestStatus).toBe('IN_PROGRESS');
          expect(approveRes.data.currentStageNumber).toBe(stageNumber + 1);
        } else {
          // Stage 7 (Final Stage)
          expect(approveRes.data.isCompleted).toBe(true);
          expect(approveRes.data.requestStatus).toBe('COMPLETED');
          expect(approveRes.data.certificate).toBeDefined();
          expect(approveRes.data.certificate.certificateNumber).toMatch(/^FUT-FP-CLR-2026-\d{4}$/);
          expect(approveRes.data.certificate.qrCodeToken).toContain('QR_FUTMINNA_FEDPOFFA_');
          expect(approveRes.data.certificate.status).toBe('VALID');
        }
      }

      // 3. Assert database state
      const finalRequest = dbStore.clearanceRequests.find((r) => r.id === reqId);
      expect(finalRequest?.status).toBe('COMPLETED');
      expect(finalRequest?.completionDate).not.toBeNull();

      const allStages = dbStore.clearanceStageProgresses.filter((sp) => sp.clearanceRequestId === reqId);
      expect(allStages.length).toBe(7);
      allStages.forEach((sp) => {
        expect(sp.status).toBe('APPROVED');
      });

      const cert = dbStore.certificates.find((c) => c.clearanceRequestId === reqId);
      expect(cert).toBeDefined();
      expect(cert?.studentId).toBe('std_001');
    });
  });
});
