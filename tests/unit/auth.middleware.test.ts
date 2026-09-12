import { describe, it, expect, vi } from 'vitest';
import { Response, NextFunction } from 'express';
import {
  authenticateToken,
  requireRole,
  requirePermission,
  AuthenticatedRequest,
} from '../../src/server/auth/middleware';
import { AuthService, UserJWTPayload } from '../../src/server/auth/authService';

function createMockResponse() {
  const res: Partial<Response> = {};
  res.statusCode = 200;
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((data: any) => {
    (res as any).body = data;
    return res;
  });
  return res as Response & { statusCode: number; body: any };
}

describe('Auth Middleware Unit Tests', () => {
  const sampleUser: UserJWTPayload = {
    userId: 'usr_student_1',
    email: 'student.test@futminna-fedpoffa.edu.ng',
    firstName: 'Ibrahim',
    lastName: 'Adeyemi',
    roles: ['STUDENT'],
    permissions: ['CLEARANCE_REQUEST_CREATE', 'CLEARANCE_REQUEST_VIEW_SELF'],
    studentId: 'std_001',
    matricNumber: '2020/1/89420CS',
    departmentId: 'dept_1',
    facultyId: 'fac_1',
  };

  const validToken = AuthService.generateToken(sampleUser);

  describe('authenticateToken', () => {
    it('returns 401 AUTH_REQUIRED when Authorization header is missing', () => {
      const req = { headers: {} } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual({
        error: 'Unauthorized: Missing or malformed Authorization header.',
        code: 'AUTH_REQUIRED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 AUTH_REQUIRED when Authorization header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic 12345' } } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 TOKEN_INVALID when token is corrupted or invalid', () => {
      const req = { headers: { authorization: 'Bearer invalid.token.value' } } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual({
        error: 'Unauthorized: Invalid or expired access token.',
        code: 'TOKEN_INVALID',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('successfully authenticates valid token, populates req.user, and calls next()', () => {
      const req = { headers: { authorization: `Bearer ${validToken}` } } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(sampleUser.userId);
      expect(req.user?.email).toBe(sampleUser.email);
      expect(req.user?.roles).toContain('STUDENT');
    });
  });

  describe('requireRole', () => {
    it('returns 401 AUTH_REQUIRED when req.user is missing', () => {
      const req = {} as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requireRole(['HOD']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 FORBIDDEN_ROLE when user lacks the required role', () => {
      const req = { user: sampleUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requireRole(['HOD', 'DEAN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
      expect(res.body.requiredRoles).toEqual(['HOD', 'DEAN']);
      expect(res.body.userRoles).toEqual(['STUDENT']);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when user has one of the allowed roles', () => {
      const req = { user: sampleUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requireRole(['STUDENT', 'BURSAR']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() when user has SUPER_ADMIN role even if not explicitly listed', () => {
      const adminUser: UserJWTPayload = {
        userId: 'usr_admin_1',
        email: 'admin.super@futminna-fedpoffa.edu.ng',
        firstName: 'System',
        lastName: 'Admin',
        roles: ['SUPER_ADMIN'],
        permissions: ['USER_MANAGE'],
      };

      const req = { user: adminUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requireRole(['HOD']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('returns 401 AUTH_REQUIRED when req.user is missing', () => {
      const req = {} as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requirePermission('CLEARANCE_REQUEST_CREATE');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 FORBIDDEN_PERMISSION when user lacks the required permission', () => {
      const req = { user: sampleUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requirePermission('AUDIT_LOG_VIEW');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body.code).toBe('FORBIDDEN_PERMISSION');
      expect(res.body.requiredPermission).toBe('AUDIT_LOG_VIEW');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when user possesses the required permission', () => {
      const req = { user: sampleUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requirePermission('CLEARANCE_REQUEST_CREATE');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() for SUPER_ADMIN via role override even if permission list lacks the code', () => {
      const adminUser: UserJWTPayload = {
        userId: 'usr_admin_1',
        email: 'admin.super@futminna-fedpoffa.edu.ng',
        firstName: 'System',
        lastName: 'Admin',
        roles: ['SUPER_ADMIN'],
        permissions: [],
      };

      const req = { user: adminUser } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      const middleware = requirePermission('AUDIT_LOG_EXPORT');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
