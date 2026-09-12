import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app';
import { DEFAULT_DEMO_PASSWORD } from '../../src/server/db/seedData';
import { dbStore } from '../../src/server/db/client';

describe('Clearance Routes Integration Tests', () => {
  const app = createApp();

  const studentEmail = 'student.test@futminna-fedpoffa.edu.ng';
  const hodEmail = 'hod.csc@fedpoffa.edu.ng';
  const deanEmail = 'dean.fast@fedpoffa.edu.ng';
  const librarianEmail = 'library.officer@fedpoffa.edu.ng';
  const bursarEmail = 'bursar.clearance@fedpoffa.edu.ng';
  const studentAffairsEmail = 'studentaffairs@fedpoffa.edu.ng';
  const ictEmail = 'ict.director@fedpoffa.edu.ng';
  const registryEmail = 'registry.clearance@futminna.edu.ng';

  let studentToken: string;
  let hodToken: string;
  let deanToken: string;
  let librarianToken: string;
  let bursarToken: string;
  let studentAffairsToken: string;
  let ictToken: string;
  let registryToken: string;

  async function login(email: string): Promise<string> {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: DEFAULT_DEMO_PASSWORD });
    return res.body.token;
  }

  function resetStudentClearance(): void {
    dbStore.clearanceRequests = dbStore.clearanceRequests.filter((r) => r.studentId !== 'std_001');
    dbStore.clearanceStageProgresses = dbStore.clearanceStageProgresses.filter(
      (sp) => !sp.id.includes('std_001') && !sp.id.includes('req_clr_001')
    );
    dbStore.certificates = dbStore.certificates.filter((c) => c.studentId !== 'std_001');
  }

  beforeEach(async () => {
    studentToken = await login(studentEmail);
    hodToken = await login(hodEmail);
    deanToken = await login(deanEmail);
    librarianToken = await login(librarianEmail);
    bursarToken = await login(bursarEmail);
    studentAffairsToken = await login(studentAffairsEmail);
    ictToken = await login(ictEmail);
    registryToken = await login(registryEmail);
  });

  it('authenticates all clearance actors with correct tokens', () => {
    expect(studentToken).toBeDefined();
    expect(hodToken).toBeDefined();
    expect(deanToken).toBeDefined();
    expect(librarianToken).toBeDefined();
    expect(bursarToken).toBeDefined();
    expect(studentAffairsToken).toBeDefined();
    expect(ictToken).toBeDefined();
    expect(registryToken).toBeDefined();
  });

  describe('Student Submission Flow', () => {
    it('successfully initiates a fresh clearance request for eligible student', async () => {
      resetStudentClearance();

      const res = await request(app)
        .post('/api/clearance/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('CLEARANCE_INITIATED');
      expect(res.body.clearanceRequest).toBeDefined();
      expect(res.body.clearanceRequest.currentStageNumber).toBe(1);

      // Verify stage 1 is PENDING and other stages are NOT_STARTED
      const stages = dbStore.clearanceStageProgresses.filter(
        (sp) => sp.clearanceRequestId === res.body.clearanceRequest.id
      );
      expect(stages).toHaveLength(7);
      const stage1 = stages.find((s) => s.stageNumber === 1);
      expect(stage1?.status).toBe('PENDING');
      const stage2 = stages.find((s) => s.stageNumber === 2);
      expect(stage2?.status).toBe('NOT_STARTED');
    });

    it('prevents duplicate clearance requests when one is already active', async () => {
      resetStudentClearance();

      // First submission
      await request(app)
        .post('/api/clearance/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      // Duplicate submission
      const duplicateRes = await request(app)
        .post('/api/clearance/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.code).toBe('CLEARANCE_ALREADY_EXISTS');
    });

    it('retrieves active clearance request and stages via /api/clearance/my-request', async () => {
      resetStudentClearance();

      await request(app)
        .post('/api/clearance/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      const res = await request(app)
        .get('/api/clearance/my-request')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.request).toBeDefined();
      expect(res.body.request.currentStageNumber).toBe(1);
      expect(res.body.stages).toHaveLength(7);
    });
  });

  describe('Full End-to-End Clearance Pipeline & Certificate Issuance', () => {
    it('executes the full happy path: submission -> 7 stage approvals -> certificate JSON & PDF generation', async () => {
      resetStudentClearance();

      // 1. Student submits clearance
      const submitRes = await request(app)
        .post('/api/clearance/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(submitRes.status).toBe(201);
      const clearanceReqId = submitRes.body.clearanceRequest.id;

      // 2. Role restriction test: HOD cannot approve Stage 2 (requires DEAN)
      const invalidEndorseRes = await request(app)
        .post('/api/clearance/officer/endorse')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          stageNumber: 2,
          clearanceRequestId: clearanceReqId,
          remarks: 'HOD illegally attempting to sign Stage 2',
        });
      expect(invalidEndorseRes.status).toBe(403);

      // 3. Sequential approvals for stages 1 to 7
      const stageSequence = [
        { stageNumber: 1, token: hodToken, remark: 'Final year project hardcover and lab returned' },
        { stageNumber: 2, token: deanToken, remark: 'Faculty academic standing confirmed by Dean' },
        { stageNumber: 3, token: librarianToken, remark: 'Library books returned and ledger verified' },
        { stageNumber: 4, token: bursarToken, remark: 'Bursary school fees reconciled via Remita' },
        { stageNumber: 5, token: studentAffairsToken, remark: 'Hostel room cleared and keys handed over' },
        { stageNumber: 6, token: ictToken, remark: 'Student institutional portal account audit completed' },
        { stageNumber: 7, token: registryToken, remark: 'Final statutory clearance signoff by Academic Registry' },
      ];

      for (const step of stageSequence) {
        const endorseRes = await request(app)
          .post('/api/clearance/officer/endorse')
          .set('Authorization', `Bearer ${step.token}`)
          .send({
            stageNumber: step.stageNumber,
            clearanceRequestId: clearanceReqId,
            remarks: step.remark,
          });

        expect(endorseRes.status).toBe(200);
        expect(endorseRes.body.success).toBe(true);
        expect(endorseRes.body.stageProgress.status).toBe('APPROVED');

        if (step.stageNumber === 7) {
          expect(endorseRes.body.isCompleted).toBe(true);
          expect(endorseRes.body.certificate).toBeDefined();
          expect(endorseRes.body.certificate.certificateNumber).toMatch(/^FUT-FP-CLR-/);
        }
      }

      // 4. Retrieve generated certificate
      const generatedCert = dbStore.certificates.find((c) => c.clearanceRequestId === clearanceReqId);
      expect(generatedCert).toBeDefined();
      const certNumber = generatedCert!.certificateNumber;

      // 5. Verify certificate JSON endpoint
      const jsonRes = await request(app).get(`/api/clearance/certificate/${certNumber}`);
      expect(jsonRes.status).toBe(200);
      expect(jsonRes.body.isValid).toBe(true);
      expect(jsonRes.body.verificationStatus).toBe('OFFICIALLY_VERIFIED');
      expect(jsonRes.body.certificate.certificateNumber).toBe(certNumber);
      expect(jsonRes.body.student.fullName).toBe('ADEYEMI, IBRAHIM OLUWASEUN');
      expect(jsonRes.body.stages).toHaveLength(7);
      expect(jsonRes.body.stages.every((s: any) => s.status === 'APPROVED')).toBe(true);

      // 6. Test server-side PDF generation endpoint
      const pdfRes = await request(app)
        .get(`/api/clearance/certificate/${certNumber}/pdf`)
        .responseType('blob');

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.header['content-type']).toBe('application/pdf');
      expect(pdfRes.header['content-disposition']).toContain('attachment; filename=');
      expect(pdfRes.header['content-disposition']).toContain('.pdf');

      const pdfBuffer = Buffer.from(pdfRes.body);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Valid PDF magic header
      expect(pdfBuffer.slice(0, 5).toString('ascii')).toBe('%PDF-');

      // 7. Nonexistent certificate returns 404
      const notFoundRes = await request(app).get('/api/clearance/certificate/NON-EXISTENT-REF-9999/pdf');
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.code).toBe('CERTIFICATE_NOT_FOUND');
    });
  });
});
