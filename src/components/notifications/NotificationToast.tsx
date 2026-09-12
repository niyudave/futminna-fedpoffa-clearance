import React, { useEffect } from 'react';
import { Bell, X, AlertTriangle, FileCheck2, Info, ChevronRight } from 'lucide-react';
import { useNotifications, NotificationItem } from '@/src/context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationToast: React.FC = () => {
  const { lastIncomingNotification, dismissToast, openNotificationCentre } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastIncomingNotification) return;

    // Auto-dismiss after 6.5 seconds
    const timer = setTimeout(() => {
      dismissToast();
    }, 6500);

    return () => clearTimeout(timer);
  }, [lastIncomingNotification, dismissToast]);

  if (!lastIncomingNotification) return null;

  const handleClick = () => {
    if (lastIncomingNotification.linkUrl) {
      navigate(lastIncomingNotification.linkUrl);
    } else {
      openNotificationCentre();
    }
    dismissToast();
  };

  const isActionRequired = lastIncomingNotification.type === 'ACTION_REQUIRED';

  return (
    <aside
      id="live-notification-toast"
      aria-label="New notification banner"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div
        className={`h-1 w-full ${
          isActionRequired
            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
        }`}
      />
      <div className="p-4 flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isActionRequired
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isActionRequired ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <FileCheck2 className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
              Real-time Alert
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Just now</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
            {lastIncomingNotification.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {lastIncomingNotification.message}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800">
            <span>View details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
