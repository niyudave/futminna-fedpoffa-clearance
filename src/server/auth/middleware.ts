import { Request, Response, NextFunction } from 'express';
import { AuthService, UserJWTPayload } from './authService';

// Extend Express Request type to carry authenticated user
export interface AuthenticatedRequest extends Request {
  user?: UserJWTPayload;
}

export const STAGE_ROLE_MAPPING: Record<number, string[]> = {
  1: ['HOD', 'DEPARTMENT_OFFICER', 'SUPER_ADMIN'],
  2: ['DEAN', 'FACULTY_ADMIN', 'SUPER_ADMIN'],
  3: ['LIBRARIAN', 'LIBRARY_OFFICER', 'SUPER_ADMIN'],
  4: ['BURSAR', 'BURSARY_OFFICER', 'SUPER_ADMIN'],
  5: ['STUDENT_AFFAIRS', 'HOSTEL_OFFICER', 'SUPER_ADMIN'],
  6: ['ICT_DIRECTOR', 'ICT_OFFICER', 'SUPER_ADMIN'],
  7: ['REGISTRY', 'REGISTRY_OFFICER', 'SUPER_ADMIN'],
};

/**
 * Middleware: Verifies JWT token and attaches user to request
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired access token.',
      code: 'TOKEN_INVALID',
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware Factory: Enforces user has at least one of the specified roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
      return;
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r) || r === 'SUPER_ADMIN');
    if (!hasRole) {
      res.status(403).json({
        error: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Your roles: [${req.user.roles.join(', ')}].`,
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles,
        userRoles: req.user.roles,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware Factory: Enforces user has a specific granular permission
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
      return;
    }

    // Super Admin has all permissions
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    const hasPermission = isSuperAdmin || req.user.permissions.includes(permissionCode);

    if (!hasPermission) {
      res.status(403).json({
        error: `Forbidden: Requires permission [${permissionCode}].`,
        code: 'FORBIDDEN_PERMISSION',
        requiredPermission: permissionCode,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Validates that an officer is authorized to act on a specific clearance stage
 */
export function requireStageOfficer(getStageNumber?: (req: Request) => number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
      return;
    }

    const stageNum = getStageNumber ? getStageNumber(req) : Number(req.body.stageNumber || req.params.stageNumber);
    if (!stageNum || isNaN(stageNum)) {
      res.status(400).json({ error: 'Bad Request: Target stageNumber is required.', code: 'INVALID_STAGE' });
      return;
    }

    const allowedRoles = STAGE_ROLE_MAPPING[stageNum] || ['SUPER_ADMIN'];
    const isAuthorized = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!isAuthorized) {
      res.status(403).json({
        error: `Forbidden: You are not authorized to review or endorse Stage ${stageNum}. Required roles: [${allowedRoles.join(', ')}]. Your roles: [${req.user.roles.join(', ')}].`,
        code: 'FORBIDDEN_STAGE_OFFICER',
        stageNumber: stageNum,
        requiredRoles: allowedRoles,
        userRoles: req.user.roles,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Enforces that a student can only view/modify their own clearance records
 */
export function requireOwnClearance(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
    return;
  }

  // Staff and Admins bypass ownership check for inspection
  const isStaff = req.user.roles.some((r) => r !== 'STUDENT');
  if (isStaff) {
    return next();
  }

  // For students, check if requested resource matches their student ID / matric
  const requestedMatric = req.params.matricNumber || req.query.matricNumber || req.body.matricNumber;
  const requestedStudentId = req.params.studentId || req.query.studentId || req.body.studentId;

  if (requestedMatric && req.user.matricNumber && requestedMatric !== req.user.matricNumber) {
    res.status(403).json({
      error: 'Forbidden: You can only access your own student clearance profile.',
      code: 'FORBIDDEN_RESOURCE_OWNERSHIP',
    });
    return;
  }

  if (requestedStudentId && req.user.studentId && requestedStudentId !== req.user.studentId) {
    res.status(403).json({
      error: 'Forbidden: You can only access your own student clearance profile.',
      code: 'FORBIDDEN_RESOURCE_OWNERSHIP',
    });
    return;
  }

  next();
}
