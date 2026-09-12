import { getPrismaClient, checkDatabaseConnectivity, dbStore, recordFallbackTriggered } from '../db/client';
import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

/**
 * PrismaRepository: Central Data Access Layer executing direct Prisma queries
 * against the MySQL database with robust, deterministic fallback to dbStore
 * if the live database connection is not reachable.
 */
class PrismaRepository {
  private get prisma(): PrismaClient | null {
    return getPrismaClient();
  }

  private async getLiveClient(): Promise<PrismaClient | null> {
    const prisma = getPrismaClient();
    if (!prisma) {
      recordFallbackTriggered('getLiveClient: no prisma client instance configured');
      return null;
    }
    const isConnected = await checkDatabaseConnectivity();
    if (!isConnected) {
      recordFallbackTriggered('getLiveClient: database host is unreachable');
      return null;
    }
    return prisma;
  }

  private onFallback(operation: string): void {
    recordFallbackTriggered(operation);
  }

  // =========================================================================
  // 1. AUTHENTICATION & USERS
  // =========================================================================

  async findUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const client = await this.getLiveClient();
    if (client) {
      try {
        const user = await client.user.findFirst({
          where: { email: { equals: normalized } },
          include: {
            userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
            studentProfile: { include: { faculty: true, department: true } },
            department: true,
            faculty: true,
          },
        });
        if (user) return user;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.findUserByEmail] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.findUserByEmail(normalized);
  }

  async findUserByMatricNumber(matricNumber: string) {
    const matric = matricNumber.trim().toUpperCase();
    const client = await this.getLiveClient();
    if (client) {
      try {
        const student = await client.student.findFirst({
          where: { matricNumber: { equals: matric } },
          include: {
            user: {
              include: {
                userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
                studentProfile: { include: { faculty: true, department: true } },
                department: true,
                faculty: true,
              },
            },
          },
        });
        if (student?.user) return student.user;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.findUserByMatricNumber] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.findUserByMatricNumber(matric);
  }

  async findUserById(userId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const user = await client.user.findUnique({
          where: { id: userId },
          include: {
            userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
            studentProfile: { include: { faculty: true, department: true } },
            department: true,
            faculty: true,
          },
        });
        if (user) return user;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.findUserById] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.findUserById(userId);
  }

  async getUserRolesAndPermissions(userId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const user = await client.user.findUnique({
          where: { id: userId },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            studentProfile: true,
          },
        });

        if (user) {
          const roles = user.userRoles.map((ur) => ur.role.name);
          const permSet = new Set<string>();
          user.userRoles.forEach((ur) => {
            ur.role.rolePermissions.forEach((rp) => {
              if (rp.permission?.code) permSet.add(rp.permission.code);
            });
          });
          return {
            roles,
            permissions: Array.from(permSet),
            student: user.studentProfile || null,
          };
        }
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getUserRolesAndPermissions] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.getUserRolesAndPermissions(userId);
  }

  async updateUserPassword(userId: string, newPasswordHash: string, actorIp = '127.0.0.1') {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash, updatedAt: new Date() },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.updateUserPassword] Live DB query notice:', (err as any)?.message || err);
      }
    }

    // Update in-memory store as well to keep in sync
    dbStore.updateUserPassword(userId, newPasswordHash, actorIp);
    return true;
  }

  async createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const record = await client.passwordResetToken.create({
          data: {
            userId: data.userId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
          },
        });
        dbStore.createPasswordResetToken(data);
        return record;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.createPasswordResetToken] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.createPasswordResetToken(data);
  }

  async findPasswordResetToken(tokenHash: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const record = await client.passwordResetToken.findUnique({
          where: { tokenHash },
          include: { user: true },
        });
        if (record) return record;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.findPasswordResetToken] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.findPasswordResetTokenByHash(tokenHash);
  }

  async markPasswordResetTokenUsed(tokenHash: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.passwordResetToken.update({
          where: { tokenHash },
          data: { usedAt: new Date(), updatedAt: new Date() },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.markPasswordResetTokenUsed] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.markPasswordResetTokenUsed(tokenHash);
  }

  // =========================================================================
  // 2. AUDIT LOGGING & SECURITY LEDGER
  // =========================================================================

  async createAuditLogEntry(data: {
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
    // Calculate checksum
    const prevLog = dbStore.auditLogs[dbStore.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.checksumHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const rawPayload = `${data.userEmail}:${data.action}:${data.entityType}:${data.entityId}:${data.newState || ''}:${prevHash}`;
    const checksumHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const logEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: data.userId || null,
      userEmail: data.userEmail,
      action: data.action as any,
      entityType: data.entityType,
      entityId: data.entityId,
      previousState: data.previousState || null,
      newState: data.newState || null,
      ipAddress: data.ipAddress || '127.0.0.1',
      userAgent: data.userAgent || 'Web Client',
      checksumHash,
      createdAt: new Date(),
    };

    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.auditLog.create({
          data: {
            id: logEntry.id,
            userId: logEntry.userId,
            userEmail: logEntry.userEmail,
            action: logEntry.action,
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
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.createAuditLogEntry] Live DB write notice:', (err as any)?.message || err);
      }
    }

    dbStore.auditLogs.push(logEntry);
    return logEntry;
  }

  async getAuditLogs(limit = 50) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const logs = await client.auditLog.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        });
        if (logs && logs.length > 0) return logs;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAuditLogs] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.auditLogs.slice(-limit).reverse();
  }

  // =========================================================================
  // 3. CLEARANCE & WORKFLOW QUERIES
  // =========================================================================

  async getClearanceRequestByStudentId(studentId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const req = await client.clearanceRequest.findFirst({
          where: { studentId },
          include: {
            student: { include: { user: true, faculty: true, department: true } },
            stageProgresses: {
              include: {
                stage: true,
                assignedOfficer: true,
                approvalDecisions: { include: { officer: true } },
              },
              orderBy: { stageNumber: 'asc' },
            },
            documents: {
              orderBy: { uploadedAt: 'desc' },
            },
            certificate: true,
            workflow: true,
          },
        });
        if (req) return req;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getClearanceRequestByStudentId] Live DB query notice:', (err as any)?.message || err);
      }
    }
    const r = dbStore.clearanceRequests.find((r) => r.studentId === studentId);
    if (r) {
      const docs = dbStore.documents.filter((d) => d.clearanceRequestId === r.id);
      return { ...r, documents: docs };
    }
    return null;
  }

  async getClearanceRequestById(requestId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const req = await client.clearanceRequest.findUnique({
          where: { id: requestId },
          include: {
            student: { include: { user: true, faculty: true, department: true } },
            stageProgresses: {
              include: {
                stage: true,
                assignedOfficer: true,
                approvalDecisions: { include: { officer: true } },
              },
              orderBy: { stageNumber: 'asc' },
            },
            documents: {
              orderBy: { uploadedAt: 'desc' },
            },
            certificate: true,
            workflow: true,
          },
        });
        if (req) return req;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getClearanceRequestById] Live DB query notice:', (err as any)?.message || err);
      }
    }
    const r = dbStore.clearanceRequests.find((r) => r.id === requestId);
    if (r) {
      const docs = dbStore.documents.filter((d) => d.clearanceRequestId === r.id);
      return { ...r, documents: docs };
    }
    return null;
  }

  async getAllClearanceRequests() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const requests = await client.clearanceRequest.findMany({
          include: {
            student: { include: { user: true, faculty: true, department: true } },
            stageProgresses: {
              include: {
                stage: true,
                assignedOfficer: true,
                approvalDecisions: { include: { officer: true } },
              },
              orderBy: { stageNumber: 'asc' },
            },
            documents: {
              orderBy: { uploadedAt: 'desc' },
            },
            certificate: true,
            workflow: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (requests && requests.length > 0) return requests;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllClearanceRequests] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.clearanceRequests.map((r) => ({
      ...r,
      documents: dbStore.documents.filter((d) => d.clearanceRequestId === r.id),
    }));
  }

  // =========================================================================
  // 3B. CLEARANCE DOCUMENTS
  // =========================================================================

  async createDocument(data: {
    clearanceRequestId: string;
    stageNumber: number;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSizeBytes?: number;
    status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }) {
    const docStatus = data.status || 'PENDING';
    const fileSizeBytes = data.fileSizeBytes ?? 1024 * 1024 * 2;
    const id = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    const client = await this.getLiveClient();
    if (client) {
      try {
        const doc = await client.document.create({
          data: {
            id,
            clearanceRequestId: data.clearanceRequestId,
            stageNumber: data.stageNumber,
            fileName: data.fileName,
            filePath: data.filePath,
            fileType: data.fileType,
            fileSizeBytes,
            status: docStatus,
          },
        });
        if (doc) {
          // Keep the in-memory cache (dbStore) in sync so the rest of the app,
          // which reads dbStore.documents synchronously, sees this write too.
          dbStore.documents.unshift(doc as any);
          return doc;
        }
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.createDocument] Live DB write notice:', (err as any)?.message || err);
      }
    }

    const newDoc = {
      id,
      clearanceRequestId: data.clearanceRequestId,
      stageNumber: data.stageNumber,
      fileName: data.fileName,
      filePath: data.filePath,
      fileType: data.fileType,
      fileSizeBytes,
      uploadedAt: now,
      status: docStatus,
      createdAt: now,
      updatedAt: now,
    };
    dbStore.documents.unshift(newDoc);
    return newDoc;
  }

  async getDocumentsByRequestId(clearanceRequestId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const docs = await client.document.findMany({
          where: { clearanceRequestId },
          orderBy: [{ stageNumber: 'asc' }, { uploadedAt: 'desc' }],
        });
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getDocumentsByRequestId] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.documents
      .filter((d) => d.clearanceRequestId === clearanceRequestId)
      .sort((a, b) => a.stageNumber - b.stageNumber || new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async getDocumentsByStage(clearanceRequestId: string, stageNumber: number) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const docs = await client.document.findMany({
          where: { clearanceRequestId, stageNumber },
          orderBy: { uploadedAt: 'desc' },
        });
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getDocumentsByStage] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.documents
      .filter((d) => d.clearanceRequestId === clearanceRequestId && d.stageNumber === stageNumber)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async updateDocumentStatus(documentId: string, status: 'PENDING' | 'VERIFIED' | 'REJECTED') {
    const now = new Date();
    const client = await this.getLiveClient();
    if (client) {
      try {
        const updated = await client.document.update({
          where: { id: documentId },
          data: { status, updatedAt: now },
        });
        if (updated) {
          const cached = dbStore.documents.find((d) => d.id === documentId);
          if (cached) {
            cached.status = status;
            cached.updatedAt = now;
          }
          return updated;
        }
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.updateDocumentStatus] Live DB write notice:', (err as any)?.message || err);
      }
    }
    const doc = dbStore.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.status = status;
      doc.updatedAt = now;
      return doc;
    }
    return null;
  }

  async deletePendingDocumentsForStage(clearanceRequestId: string, stageNumber: number) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.document.deleteMany({
          where: { clearanceRequestId, stageNumber, status: 'PENDING' },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.deletePendingDocumentsForStage] Live DB write notice:', (err as any)?.message || err);
      }
    }
    dbStore.documents = dbStore.documents.filter(
      (d) => !(d.clearanceRequestId === clearanceRequestId && d.stageNumber === stageNumber && d.status === 'PENDING')
    );
  }

  async deleteDocument(documentId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.document.delete({
          where: { id: documentId },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.deleteDocument] Live DB write notice:', (err as any)?.message || err);
      }
    }
    const idx = dbStore.documents.findIndex((d) => d.id === documentId);
    if (idx !== -1) {
      dbStore.documents.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getCertificateByNumber(certificateNumber: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const cert = await client.clearanceCertificate.findUnique({
          where: { certificateNumber },
          include: {
            student: { include: { user: true, faculty: true, department: true } },
            clearanceRequest: {
              include: {
                stageProgresses: {
                  include: { stage: true, approvalDecisions: true },
                  orderBy: { stageNumber: 'asc' },
                },
              },
            },
            verifiedByRegistry: true,
          },
        });
        if (cert) return cert;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getCertificateByNumber] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.certificates.find((c) => c.certificateNumber === certificateNumber);
  }

  async getCertificateByQrToken(qrCodeToken: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const cert = await client.clearanceCertificate.findUnique({
          where: { qrCodeToken },
          include: {
            student: { include: { user: true, faculty: true, department: true } },
            clearanceRequest: {
              include: {
                stageProgresses: {
                  include: { stage: true, approvalDecisions: true },
                  orderBy: { stageNumber: 'asc' },
                },
              },
            },
            verifiedByRegistry: true,
          },
        });
        if (cert) return cert;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getCertificateByQrToken] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.certificates.find((c) => c.qrCodeToken === qrCodeToken);
  }

  // =========================================================================
  // 4. NOTIFICATIONS
  // =========================================================================

  async getUserNotifications(userId: string, filter = 'ALL', page = 1, limit = 20) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const whereClause: any = { userId };
        if (filter === 'UNREAD') whereClause.isRead = false;
        else if (filter === 'CLEARANCE_STATUS') whereClause.type = 'CLEARANCE_STATUS';
        else if (filter === 'ACTION_REQUIRED') whereClause.type = 'APPROVAL_REQUIRED';
        else if (filter === 'SYSTEM') whereClause.type = 'SYSTEM_ALERT';

        const [notifications, totalCount, unreadCount] = await Promise.all([
          client.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          client.notification.count({ where: whereClause }),
          client.notification.count({ where: { userId, isRead: false } }),
        ]);

        if (notifications && notifications.length > 0) {
          return {
            notifications,
            totalCount,
            unreadCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1,
          };
        }
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getUserNotifications] Live DB query notice:', (err as any)?.message || err);
      }
    }

    let userNotifications = dbStore.notifications.filter((n) => n.userId === userId);
    if (filter === 'UNREAD') userNotifications = userNotifications.filter((n) => !n.isRead);
    else if (filter === 'CLEARANCE_STATUS') userNotifications = userNotifications.filter((n) => n.type === 'CLEARANCE_STATUS');
    else if (filter === 'ACTION_REQUIRED') userNotifications = userNotifications.filter((n) => n.type === 'ACTION_REQUIRED');
    else if (filter === 'SYSTEM') userNotifications = userNotifications.filter((n) => n.type === 'SYSTEM');

    const totalCount = userNotifications.length;
    const unreadCount = dbStore.notifications.filter((n) => n.userId === userId && !n.isRead).length;
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);

    return {
      notifications: paginatedNotifications,
      totalCount,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.notification.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true, readAt: new Date() },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.markNotificationAsRead] Live DB write notice:', (err as any)?.message || err);
      }
    }
    const notif = dbStore.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      notif.readAt = new Date();
      return notif;
    }
    return null;
  }

  async markAllNotificationsAsRead(userId: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        await client.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.markAllNotificationsAsRead] Live DB write notice:', (err as any)?.message || err);
      }
    }
    let count = 0;
    dbStore.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        count++;
      }
    });
    return count;
  }

  // =========================================================================
  // 5. MASTER DATA: FACULTIES, DEPARTMENTS, ROLES, PERMISSIONS, SETTINGS
  // =========================================================================

  async getAllFaculties() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const faculties = await client.faculty.findMany({
          include: { departments: true },
          orderBy: { code: 'asc' },
        });
        if (faculties && faculties.length > 0) return faculties;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllFaculties] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.faculties;
  }

  async getAllDepartments() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const depts = await client.department.findMany({
          include: { faculty: true },
          orderBy: { code: 'asc' },
        });
        if (depts && depts.length > 0) return depts;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllDepartments] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.departments;
  }

  async getAllRoles() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const roles = await client.role.findMany({
          include: { rolePermissions: { include: { permission: true } } },
          orderBy: { name: 'asc' },
        });
        if (roles && roles.length > 0) return roles;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllRoles] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.roles;
  }

  async getAllPermissions() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const perms = await client.permission.findMany({
          orderBy: { code: 'asc' },
        });
        if (perms && perms.length > 0) return perms;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllPermissions] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.permissions;
  }

  async getAllSystemSettings() {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const settings = await client.systemSetting.findMany({
          orderBy: { key: 'asc' },
        });
        if (settings && settings.length > 0) return settings;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.getAllSystemSettings] Live DB query notice:', (err as any)?.message || err);
      }
    }
    return dbStore.systemSettings;
  }

  async updateSystemSetting(key: string, value: string) {
    const client = await this.getLiveClient();
    if (client) {
      try {
        const updated = await client.systemSetting.update({
          where: { key },
          data: { value, updatedAt: new Date() },
        });
        if (updated) return updated;
      } catch (err) {
        this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.updateSystemSetting] Live DB write notice:', (err as any)?.message || err);
      }
    }
    const setting = dbStore.systemSettings.find((s) => s.key === key);
    if (setting) {
      setting.value = value;
      setting.updatedAt = new Date();
      return setting;
    }
    return null;
  }

  // =========================================================================
  // 5B. CLEARANCE WORKFLOW — LIVE-DATABASE MIRROR WRITES
  // =========================================================================
  // Context: the workflow engine (src/server/workflow/workflowEngine.ts) owns
  // and mutates the in-memory `dbStore` collections directly — that logic is
  // deliberately left untouched here. Each method below's only job is to
  // mirror that same write into the live MySQL/MariaDB database when one is
  // configured and reachable, so persisted clearance records are genuine
  // rather than existing only in server memory. Every method is best-effort:
  // a live-database write failure is logged and swallowed rather than
  // thrown, so a transient DB hiccup never breaks a clearance action the
  // student or officer is actively performing against the in-memory cache.

  async mirrorUpsertClearanceRequest(request: {
    id: string;
    requestId: string;
    studentId: string;
    workflowId: string;
    status: string;
    currentStageNumber: number;
    submissionDate: Date;
    completionDate: Date | null;
    rejectionReason: string | null;
    overallRemarks: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.clearanceRequest.upsert({
        where: { id: request.id },
        create: {
          id: request.id,
          requestId: request.requestId,
          studentId: request.studentId,
          workflowId: request.workflowId,
          status: request.status as any,
          currentStageNumber: request.currentStageNumber,
          submissionDate: request.submissionDate,
          completionDate: request.completionDate,
          rejectionReason: request.rejectionReason,
          overallRemarks: request.overallRemarks,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        },
        update: {
          status: request.status as any,
          currentStageNumber: request.currentStageNumber,
          submissionDate: request.submissionDate,
          completionDate: request.completionDate,
          rejectionReason: request.rejectionReason,
          overallRemarks: request.overallRemarks,
          updatedAt: request.updatedAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorUpsertClearanceRequest] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorDeleteStageProgressesForRequest(clearanceRequestId: string) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.clearanceStageProgress.deleteMany({ where: { clearanceRequestId } });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorDeleteStageProgressesForRequest] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorUpsertStageProgress(sp: {
    id: string;
    clearanceRequestId: string;
    stageId: string;
    stageNumber: number;
    status: string;
    assignedOfficerId: string | null;
    submittedDocuments: string | null;
    remarks: string | null;
    initiatedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.clearanceStageProgress.upsert({
        where: { id: sp.id },
        create: {
          id: sp.id,
          clearanceRequestId: sp.clearanceRequestId,
          stageId: sp.stageId,
          stageNumber: sp.stageNumber,
          status: sp.status as any,
          assignedOfficerId: sp.assignedOfficerId,
          submittedDocuments: sp.submittedDocuments,
          remarks: sp.remarks,
          initiatedAt: sp.initiatedAt,
          completedAt: sp.completedAt,
          createdAt: sp.createdAt,
          updatedAt: sp.updatedAt,
        },
        update: {
          status: sp.status as any,
          assignedOfficerId: sp.assignedOfficerId,
          submittedDocuments: sp.submittedDocuments,
          remarks: sp.remarks,
          initiatedAt: sp.initiatedAt,
          completedAt: sp.completedAt,
          updatedAt: sp.updatedAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorUpsertStageProgress] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorCreateApprovalDecision(decision: {
    id: string;
    stageProgressId: string;
    officerId: string;
    decision: string;
    remarks: string | null;
    signatureHash: string | null;
    digitalStamp: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.approvalDecision.create({
        data: {
          id: decision.id,
          stageProgressId: decision.stageProgressId,
          officerId: decision.officerId,
          decision: decision.decision as any,
          remarks: decision.remarks,
          signatureHash: decision.signatureHash,
          digitalStamp: decision.digitalStamp,
          ipAddress: decision.ipAddress,
          userAgent: decision.userAgent,
          createdAt: decision.createdAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorCreateApprovalDecision] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorMarkStageDocumentsStatus(clearanceRequestId: string, stageNumber: number, status: 'VERIFIED' | 'REJECTED') {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.document.updateMany({
        where: { clearanceRequestId, stageNumber },
        data: { status, updatedAt: new Date() },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorMarkStageDocumentsStatus] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorCreateDocument(doc: {
    id: string;
    clearanceRequestId: string;
    stageNumber: number;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSizeBytes: number;
    uploadedAt: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.document.create({
        data: {
          id: doc.id,
          clearanceRequestId: doc.clearanceRequestId,
          stageNumber: doc.stageNumber,
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileType: doc.fileType,
          fileSizeBytes: doc.fileSizeBytes,
          uploadedAt: doc.uploadedAt,
          status: doc.status as any,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorCreateDocument] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorReplaceDocumentsForStage(
    clearanceRequestId: string,
    stageNumber: number,
    docs: Array<{
      id: string; fileName: string; filePath: string; fileType: string; fileSizeBytes: number;
      uploadedAt: Date; status: string; createdAt: Date; updatedAt: Date;
    }>
  ) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.document.deleteMany({ where: { clearanceRequestId, stageNumber, status: 'PENDING' } });
      if (docs.length > 0) {
        await client.document.createMany({
          data: docs.map((d) => ({
            id: d.id,
            clearanceRequestId,
            stageNumber,
            fileName: d.fileName,
            filePath: d.filePath,
            fileType: d.fileType,
            fileSizeBytes: d.fileSizeBytes,
            uploadedAt: d.uploadedAt,
            status: d.status as any,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          })),
        });
      }
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorReplaceDocumentsForStage] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorCreateCertificate(cert: {
    id: string;
    certificateNumber: string;
    clearanceRequestId: string;
    studentId: string;
    qrCodeToken: string;
    issuanceDate: Date;
    verifiedByRegistryId: string | null;
    registrySignatureHash: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.clearanceCertificate.upsert({
        where: { id: cert.id },
        create: {
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          clearanceRequestId: cert.clearanceRequestId,
          studentId: cert.studentId,
          qrCodeToken: cert.qrCodeToken,
          issuanceDate: cert.issuanceDate,
          verifiedByRegistryId: cert.verifiedByRegistryId,
          registrySignatureHash: cert.registrySignatureHash,
          status: cert.status as any,
          createdAt: cert.createdAt,
          updatedAt: cert.updatedAt,
        },
        update: {
          status: cert.status as any,
          updatedAt: cert.updatedAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorCreateCertificate] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorCreateNotification(n: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    readAt: Date | null;
    linkUrl: string | null;
    createdAt: Date;
  }) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.notification.create({
        data: {
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type as any,
          isRead: n.isRead,
          readAt: n.readAt,
          linkUrl: n.linkUrl,
          createdAt: n.createdAt,
        },
      });
    } catch (err) {
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorCreateNotification] Live DB write notice:', (err as any)?.message || err);
    }
  }

  async mirrorDeleteNotification(notificationId: string) {
    const client = await this.getLiveClient();
    if (!client) return;
    try {
      await client.notification.delete({ where: { id: notificationId } });
    } catch (err) {
      // Not found or already deleted is fine to ignore; anything else, just log.
      this.onFallback('[PrismaRepository query error]'); console.warn('[PrismaRepository.mirrorDeleteNotification] Live DB write notice:', (err as any)?.message || err);
    }
  }

  // =========================================================================
  // 6. HEALTH & STATUS CHECK
  // =========================================================================

  async checkDatabaseConnection(): Promise<{ isConnected: boolean; error?: string; latencyMs?: number }> {
    const startTime = Date.now();
    try {
      const isReachable = await checkDatabaseConnectivity(true);
      if (!isReachable) {
        return { isConnected: false, error: 'Database server host is not reachable', latencyMs: Date.now() - startTime };
      }
      const client = getPrismaClient();
      if (!client) {
        return { isConnected: false, error: 'Prisma Client driver adapter not configured', latencyMs: Date.now() - startTime };
      }
      await client.$queryRaw`SELECT 1`;
      return { isConnected: true, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      return { isConnected: false, error: err?.message || 'Database ping query failed', latencyMs: Date.now() - startTime };
    }
  }
}

export const prismaRepo = new PrismaRepository();
