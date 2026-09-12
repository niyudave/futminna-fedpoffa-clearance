import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ACTION_REQUIRED' | 'CLEARANCE_STATUS' | 'SYSTEM' | 'SECURITY';
  isRead: boolean;
  readAt: string | null;
  linkUrl: string | null;
  createdAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  actionRequired: number;
  clearanceStatus: number;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  stats: NotificationStats;
  isLoading: boolean;
  isSocketConnected: boolean;
  isModalOpen: boolean;
  lastIncomingNotification: NotificationItem | null;
  openNotificationCentre: () => void;
  closeNotificationCentre: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestNotification: (params: { title: string; message: string; type?: string; sendEmail?: boolean }) => Promise<any>;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, roles } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    actionRequired: 0,
    clearanceStatus: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastIncomingNotification, setLastIncomingNotification] = useState<NotificationItem | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Recalculate stats helper
  const updateLocalStats = (items: NotificationItem[]) => {
    const unread = items.filter((n) => !n.isRead).length;
    const actionRequired = items.filter((n) => n.type === 'ACTION_REQUIRED').length;
    const clearanceStatus = items.filter((n) => n.type === 'CLEARANCE_STATUS').length;
    setStats({
      total: items.length,
      unread,
      read: items.length - unread,
      actionRequired,
      clearanceStatus,
    });
  };

  // Fetch notifications from server API
  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          updateLocalStats(res.data.notifications);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Connect to Socket.io real-time server
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsSocketConnected(false);
      return;
    }

    refreshNotifications();

    // Initialize Socket.io client with verified JWT auth
    const socket = io({
      path: '/socket.io',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      console.log(`[Socket.io] Connected with id: ${socket.id} for authenticated user ${user.id}`);
    });

    socket.on('connect_error', (err: Error) => {
      console.warn(`[Socket.io] Real-time connection rejected or failed: ${err.message}`);
      setIsSocketConnected(false);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Listen for incoming real-time notifications
    socket.on('notification:new', (newNotif: NotificationItem) => {
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        const updated = [newNotif, ...prev];
        updateLocalStats(updated);
        return updated;
      });

      setLastIncomingNotification(newNotif);

      // Play subtle chime sound if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch {
        // AudioContext disabled by browser gesture policy
      }
    });

    // Listen for clearance status update broadcasts
    socket.on('clearance:updated', () => {
      // Trigger a light refresh of notifications
      refreshNotifications();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [user?.id, token, roles.join(','), refreshNotifications]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      updateLocalStats(updated);
      return updated;
    });

    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('Failed to mark notification as read on server:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
      updateLocalStats(updated);
      return updated;
    });

    try {
      await axios.post('/api/notifications/mark-all-read', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('Failed to mark all as read on server:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      updateLocalStats(updated);
      return updated;
    });

    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  // Test dispatch helper
  const sendTestNotification = async (params: { title: string; message: string; type?: string; sendEmail?: boolean }) => {
    try {
      const res = await axios.post('/api/notifications/test-dispatch', params, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await refreshNotifications();
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to dispatch test notification.');
    }
  };

  const openNotificationCentre = () => setIsModalOpen(true);
  const closeNotificationCentre = () => setIsModalOpen(false);
  const dismissToast = () => setLastIncomingNotification(null);

  const unreadCount = stats.unread;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        stats,
        isLoading,
        isSocketConnected,
        isModalOpen,
        lastIncomingNotification,
        openNotificationCentre,
        closeNotificationCentre,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        sendTestNotification,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
