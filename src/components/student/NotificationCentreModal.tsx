import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Clock,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface NotificationCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const NotificationCentreModal: React.FC<NotificationCentreModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ACTION_REQUIRED' | 'STATUS'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'UNREAD') return !notif.isRead;
    if (activeFilter === 'ACTION_REQUIRED') return notif.type === 'ACTION_REQUIRED';
    if (activeFilter === 'STATUS') return notif.type === 'CLEARANCE_STATUS';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    setIsProcessing(true);
    await onMarkAllAsRead();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Bell className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Notification Centre</h3>
              <p className="text-xs text-purple-200">
                {unreadCount > 0
                  ? `${unreadCount} unread clearance notification${unreadCount > 1 ? 's' : ''}`
                  : 'All notifications up to date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={isProcessing}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-purple-700 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'UNREAD'
                ? 'bg-purple-700 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveFilter('ACTION_REQUIRED')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'ACTION_REQUIRED'
                ? 'bg-purple-700 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Action Required
          </button>
          <button
            onClick={() => setActiveFilter('STATUS')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'STATUS'
                ? 'bg-purple-700 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Clearance Status
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 divide-y divide-slate-100">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all ${
                  !notif.isRead
                    ? 'bg-purple-50/60 border border-purple-200 shadow-2xs'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {notif.type === 'ACTION_REQUIRED' ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>

                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="font-bold text-purple-700 hover:text-purple-900 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No notifications in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
