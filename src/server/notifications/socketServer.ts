import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { dbStore } from '../db/client';
import { AuthService, UserJWTPayload } from '../auth/authService';

export interface RealTimeNotificationPayload {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'CLEARANCE_STATUS' | 'ACTION_REQUIRED' | 'SYSTEM' | 'SECURITY';
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date | string;
  unreadCount?: number;
}

class SocketServerManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  public init(httpServer: HttpServer) {
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: clientOrigin,
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Verify JWT token on socket handshake
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication error: Missing or invalid token in handshake auth'));
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      socket.data.user = payload;
      next();
    });

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as UserJWTPayload;
      if (!user || !user.userId) {
        socket.disconnect(true);
        return;
      }

      const userId = user.userId;
      const roles = user.roles || [];

      // Register user connection using verified identity from JWT
      socket.join(`user:${userId}`);
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Join verified role rooms
      if (Array.isArray(roles)) {
        roles.forEach((role) => {
          if (role && typeof role === 'string') {
            socket.join(`role:${role}`);
          }
        });
      }

      // Handle custom join rooms
      socket.on('join:room', (room: string) => {
        if (typeof room === 'string' && room.trim()) {
          // Prevent clients from joining another user's private notification room
          if (room.startsWith('user:') && room !== `user:${userId}`) {
            return;
          }
          // Prevent clients from joining unassigned role rooms
          if (room.startsWith('role:') && (!Array.isArray(roles) || !roles.includes(room.slice(5)))) {
            return;
          }
          socket.join(room);
        }
      });

      socket.on('leave:room', (room: string) => {
        if (typeof room === 'string' && room.trim()) {
          socket.leave(room);
        }
      });

      socket.on('disconnect', () => {
        if (this.connectedUsers.has(userId)) {
          const sockets = this.connectedUsers.get(userId)!;
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });
    });

    console.log('[SocketServer] Socket.io real-time engine initialized with JWT authentication.');
  }

  /**
   * Dispatches real-time notification to a specific user
   */
  public notifyUser(userId: string, notification: any) {
    if (!this.io) return;

    const unreadCount = dbStore.notifications.filter((n) => n.userId === userId && !n.isRead).length;

    const payload: RealTimeNotificationPayload = {
      ...notification,
      unreadCount,
    };

    this.io.to(`user:${userId}`).emit('notification:new', payload);
    this.io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
  }

  /**
   * Dispatches real-time notification to all officers in a specific role
   */
  public notifyRole(roleName: string, notification: any) {
    if (!this.io) return;

    this.io.to(`role:${roleName}`).emit('notification:role_broadcast', notification);
    this.io.to(`role:SUPER_ADMIN`).emit('notification:admin_feed', notification);
  }

  /**
   * Broadcasts clearance stage updates to all listeners of that clearance request
   */
  public broadcastClearanceUpdate(clearanceRequestId: string, trackingData: any) {
    if (!this.io) return;

    this.io.to(`clearance:${clearanceRequestId}`).emit('clearance:stage_updated', trackingData);
    this.io.emit('clearance:global_activity', {
      requestId: clearanceRequestId,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Dispatches system-wide broadcast (e.g. maintenance, security alerts)
   */
  public broadcastSystemAlert(alert: { title: string; message: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' }) {
    if (!this.io) return;

    this.io.emit('system:alert', {
      ...alert,
      timestamp: new Date().toISOString(),
    });
  }

  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export const socketServer = new SocketServerManager();
