import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Clock,
  CheckCheck,
  Trash2,
  Search,
  ExternalLink,
  Wifi,
  Mail,
  Send,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '@/src/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Logo } from '@/src/components/common/Logo';

export const NotificationCentreModal: React.FC = () => {
  const {
    isModalOpen,
    closeNotificationCentre,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    sendTestNotification,
    isSocketConnected,
    isLoading,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ACTION_REQUIRED' | 'STATUS' | 'EMAIL_LOGS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Email failure / audit logs state
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Test dispatch state
  const [testTitle, setTestTitle] = useState('Clearance Stage Discrepancy Flagged');
  const [testMessage, setTestMessage] = useState('Please verify and resubmit your Bursary receipt #REC-88412.');
  const [testType, setTestType] = useState('ACTION_REQUIRED');
  const [testEmail, setTestEmail] = useState(true);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (isModalOpen && activeTab === 'EMAIL_LOGS') {
      fetchDeliveryLogs();
    }
  }, [isModalOpen, activeTab]);

  const fetchDeliveryLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await axios.get('/api/notifications/delivery-failures');
      setDeliveryLogs(res.data.logs || []);
    } catch {
      setDeliveryLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!isModalOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    // Tab filter
    if (activeTab === 'UNREAD' && notif.isRead) return false;
    if (activeTab === 'ACTION_REQUIRED' && notif.type !== 'ACTION_REQUIRED') return false;
    if (activeTab === 'STATUS' && notif.type !== 'CLEARANCE_STATUS') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return notif.title.toLowerCase().includes(q) || notif.message.toLowerCase().includes(q);
    }
    return true;
  });

  const handleMarkAll = async () => {
    setIsProcessing(true);
    await markAllAsRead();
    setIsProcessing(false);
  };

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.linkUrl) {
      closeNotificationCentre();
      navigate(notif.linkUrl);
    }
  };

  const handleDispatchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchStatus('Dispatching...');
    try {
      const res = await sendTestNotification({
        title: testTitle,
        message: testMessage,
        type: testType,
        sendEmail: testEmail,
      });
      setDispatchStatus(`Dispatched successfully! Socket: ${res.socketBroadcast ? 'OK' : 'Skipped'}, Email: ${res.emailSent ? 'Sent' : 'Mock/Offline'}`);
      setTimeout(() => setDispatchStatus(null), 4000);
    } catch (err: any) {
      setDispatchStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div
      id="notification-centre-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size="xs" inverted={true} showSubtitle={false} />
            <div className="hidden sm:block h-6 w-px bg-white/20" />
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
              <Bell className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold leading-tight">Notification Centre</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSocketConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSocketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`}
                  />
                  {isSocketConnected ? 'Live' : 'Connecting'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                {unreadCount > 0
                  ? `${unreadCount} unread clearance notification${unreadCount > 1 ? 's' : ''}`
                  : 'All notifications are caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAll}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}
            <button
              onClick={refreshNotifications}
              disabled={isLoading}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh Notifications"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-notifications-btn"
              onClick={closeNotificationCentre}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'UNREAD'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'UNREAD' ? 'bg-white text-emerald-900' : 'bg-rose-500 text-white'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ACTION_REQUIRED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                activeTab === 'ACTION_REQUIRED'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Action Required
            </button>
            <button
              onClick={() => setActiveTab('STATUS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                activeTab === 'STATUS'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Clearance Status
            </button>
            <button
              onClick={() => setActiveTab('EMAIL_LOGS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'EMAIL_LOGS'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-200/70'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Diagnostics</span>
            </button>
          </div>

          {activeTab !== 'EMAIL_LOGS' && (
            <div className="relative w-full sm:w-48 my-1 sm:my-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3 divide-y divide-slate-100">
          {activeTab === 'EMAIL_LOGS' ? (
            /* Email Logs & Diagnostics Tab */
            <div className="space-y-6">
              {/* Dispatch Simulator */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Event-Driven Dispatch Tester
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Simulate an event-driven clearance notification with real-time Socket.io broadcast and institutional email dispatch.
                </p>

                <form onSubmit={handleDispatchTest} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Message Content
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                        <input
                          type="radio"
                          name="notifType"
                          value="ACTION_REQUIRED"
                          checked={testType === 'ACTION_REQUIRED'}
                          onChange={() => setTestType('ACTION_REQUIRED')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        Action Required
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                        <input
                          type="radio"
                          name="notifType"
                          value="CLEARANCE_STATUS"
                          checked={testType === 'CLEARANCE_STATUS'}
                          onChange={() => setTestType('CLEARANCE_STATUS')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Clearance Status
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Trigger Event Dispatch</span>
                    </button>
                  </div>

                  {dispatchStatus && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 animate-in fade-in">
                      {dispatchStatus}
                    </div>
                  )}
                </form>
              </div>

              {/* Delivery History & Audit Logs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      SMTP Delivery Logs ({deliveryLogs.length})
                    </h4>
                  </div>
                  <button
                    onClick={fetchDeliveryLogs}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {deliveryLogs.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {deliveryLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                                log.status === 'SENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.status}
                            </span>
                            <span className="font-bold text-slate-800 truncate">{log.subject}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            To: {log.to} • Template: {log.templateType}
                          </p>
                          {log.error && (
                            <p className="text-[10px] text-rose-600 font-mono mt-1">{log.error}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs">No email delivery failures or warnings recorded.</p>
                  </div>
                )}
              </div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const isActionRequired = notif.type === 'ACTION_REQUIRED';
              return (
                <div
                  key={notif.id}
                  className={`pt-3 first:pt-0 pb-3 flex items-start gap-3 transition-colors ${
                    !notif.isRead ? 'bg-emerald-50/40 -mx-2 px-3 rounded-2xl' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isActionRequired ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : notif.type === 'CLEARANCE_STATUS' ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          onClick={() => handleItemClick(notif)}
                          className="text-xs font-bold text-slate-900 hover:text-emerald-800 cursor-pointer transition-colors"
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p
                      onClick={() => handleItemClick(notif)}
                      className="text-xs text-slate-600 mt-1 leading-relaxed cursor-pointer"
                    >
                      {notif.message}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                        {notif.linkUrl && (
                          <button
                            onClick={() => handleItemClick(notif)}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                          >
                            <span>Open destination</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No notifications found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery
                  ? `No alerts matching "${searchQuery}"`
                  : 'You do not have any notifications in this section.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>FUTMINNA-FEDPOFFA Institutional Alert Gateway</span>
          </div>
          <button
            onClick={closeNotificationCentre}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
