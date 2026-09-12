import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/src/context/NotificationContext';

interface NotificationBellProps {
  variant?: 'light' | 'dark' | 'glass';
  showLabel?: boolean;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  variant = 'light',
  showLabel = false,
  className = '',
}) => {
  const { unreadCount, openNotificationCentre, isSocketConnected } = useNotifications();

  let buttonStyles = 'relative p-2 rounded-xl transition-all flex items-center gap-2 ';
  if (variant === 'light') {
    buttonStyles += 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200';
  } else if (variant === 'dark') {
    buttonStyles += 'bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-700';
  } else {
    buttonStyles += 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs';
  }

  return (
    <button
      id="notification-bell-btn"
      onClick={openNotificationCentre}
      className={`${buttonStyles} ${className}`}
      title={
        isSocketConnected
          ? `Notification Centre (${unreadCount} unread) - Live connected`
          : `Notification Centre (${unreadCount} unread) - Reconnecting`
      }
      aria-label="Open Notifications"
    >
      <div className="relative">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold">
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </span>
      )}

      {/* Real-Time Socket Connection Dot */}
      <span
        title={isSocketConnected ? 'WebSocket Live: Connected' : 'WebSocket: Connecting...'}
        className={`w-1.5 h-1.5 rounded-full ${
          isSocketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
        }`}
      />
    </button>
  );
};
