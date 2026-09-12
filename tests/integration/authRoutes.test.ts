import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app';
import { DEFAULT_DEMO_PASSWORD } from '../../src/server/db/seedData';

describe('Auth Routes Integration Tests', () => {
  const app = createApp();

  describe('POST /api/auth/login', () => {
    it('returns 400 MISSING_CREDENTIALS when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student.test@futminna-fedpoffa.edu.ng' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_CREDENTIALS');
    });

    it('returns 401 INVALID_CREDENTIALS for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@futminna-fedpoffa.edu.ng',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 401 INVALID_CREDENTIALS for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student.test@futminna-fedpoffa.edu.ng',
          password: 'IncorrectPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('successfully logs in with valid student email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student.test@futminna-fedpoffa.edu.ng',
          password: DEFAULT_DEMO_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('student.test@futminna-fedpoffa.edu.ng');
      expect(res.body.roles).toContain('STUDENT');
      expect(res.body.student).toBeDefined();
      expect(res.body.student.matricNumber).toBe('2020/1/89420CS');
    });

    it('successfully logs in using student matriculation number', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          matricNumber: '2020/1/89420CS',
          password: DEFAULT_DEMO_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('student.test@futminna-fedpoffa.edu.ng');
    });

    it('successfully logs in with valid officer credentials (HOD)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'hod.csc@fedpoffa.edu.ng',
          password: DEFAULT_DEMO_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.roles).toContain('HOD');
      expect(res.body.permissions).toContain('CLEARANCE_STAGE_APPROVE');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 AUTH_REQUIRED when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });

    it('returns 401 TOKEN_INVALID when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_INVALID');
    });

    it('returns 200 and authenticated profile when valid token is provided', async () => {
      // 1. Log in to get valid token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student.test@futminna-fedpoffa.edu.ng',
          password: DEFAULT_DEMO_PASSWORD,
        });

      const token = loginRes.body.token;
      expect(token).toBeDefined();

      // 2. Fetch profile via /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user).toBeDefined();
      expect(meRes.body.user.email).toBe('student.test@futminna-fedpoffa.edu.ng');
      expect(meRes.body.roles).toContain('STUDENT');
      expect(meRes.body.permissions).toBeDefined();
      expect(meRes.body.student).toBeDefined();
      expect(meRes.body.student.matricNumber).toBe('2020/1/89420CS');
    });
  });
});
