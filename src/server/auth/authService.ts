import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prismaRepo } from '../db/prismaRepository';
import { dbStore } from '../db/client';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required on server side for signing and verifying authentication tokens.');
  }
  return secret;
}

const TOKEN_EXPIRY = '24h';

export interface UserJWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  studentId?: string | null;
  matricNumber?: string | null;
  departmentId?: string | null;
  facultyId?: string | null;
}

export interface PasswordResetRecord {
  id?: string;
  token?: string;
  tokenHash: string;
  userId: string;
  email?: string;
  expiresAt: Date;
  usedAt?: Date | null;
  isUsed?: boolean;
  createdAt: Date;
}

export class AuthService {
  /**
   * Generates SHA-256 hash for secure token storage in database
   */
  static hashResetToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Hashes password using bcrypt with 10 rounds
   */
  static async hashPassword(plaintext: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Synchronous hash for seed bootstrapping
   */
  static hashPasswordSync(plaintext: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plaintext, salt);
  }

  /**
   * Verifies plaintext against stored bcrypt hash (constant-time comparison)
   */
  static async comparePassword(plaintext: string, hash: string): Promise<boolean> {
    if (!plaintext || !hash) return false;
    // Support standard bcrypt hashes
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch {
      return false;
    }
  }

  /**
   * Generates signed JWT for authenticated user
   */
  static generateToken(payload: UserJWTPayload): string {
    return jwt.sign(payload, getJwtSecret(), {
      expiresIn: TOKEN_EXPIRY,
      algorithm: 'HS256',
      issuer: 'FUTMINNA-FEDPOFFA-ECLEARANCE',
      subject: payload.userId,
    });
  }

  /**
   * Verifies and decodes JWT
   */
  static verifyToken(token: string): UserJWTPayload | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret(), {
        issuer: 'FUTMINNA-FEDPOFFA-ECLEARANCE',
      }) as UserJWTPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Creates a cryptographically random, one-time password reset token persisted in the database table
   */
  static async generatePasswordResetToken(userId: string, _email?: string): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour validity

    await prismaRepo.createPasswordResetToken({
      userId,
      tokenHash,
      expiresAt,
    });

    return { token: rawToken, expiresAt };
  }

  /**
   * Verifies a reset token against the persistent database table
   */
  static async getResetTokenRecord(token: string): Promise<PasswordResetRecord | null> {
    if (!token) return null;
    const tokenHash = this.hashResetToken(token);

    let record = await prismaRepo.findPasswordResetToken(tokenHash);
    if (!record) {
      record = await prismaRepo.findPasswordResetToken(token);
    }

    if (!record) return null;
    if (record.usedAt) return null;
    if (new Date() > new Date(record.expiresAt)) return null;

    return {
      id: record.id,
      tokenHash: record.tokenHash,
      userId: record.userId,
      expiresAt: new Date(record.expiresAt),
      usedAt: record.usedAt ? new Date(record.usedAt) : null,
      isUsed: !!record.usedAt,
      createdAt: new Date(record.createdAt),
    };
  }

  /**
   * Invalidates / consumes a reset token in the database table
   */
  static async consumeResetToken(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = this.hashResetToken(token);

    let result = await prismaRepo.markPasswordResetTokenUsed(tokenHash);
    if (!result) {
      result = await prismaRepo.markPasswordResetTokenUsed(token);
    }
    return !!result;
  }
}

