import React, { useEffect, useState } from 'react';
import { getMyNotifications, markNotificationRead } from '../api/notificationApi';
import { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      const unreadList = notifications.filter((n) => !n.read);
      if (unreadList.length === 0) return;
      
      await Promise.all(unreadList.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showSuccess('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read:', err);
      showError('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#7567E8]" />
            Your Notifications
          </h1>
          <p className="text-[#6B7280] mt-1 text-sm">Stay updated on your donation statuses and alerts</p>
        </div>
        
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#7567E8] text-sm font-semibold rounded-xl hover:bg-[#F9FAFB] transition-colors shadow-sm"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#6B7280]">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">No notifications yet</h3>
            <p className="text-[#6B7280] mt-1">You're all caught up! When there are updates, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-5 transition-colors flex items-start gap-4 ${
                  notification.read ? 'bg-white' : 'bg-[#7567E8]/5'
                }`}
              >
                <div className={`mt-1 shrink-0 ${notification.read ? 'text-[#9CA3AF]' : 'text-[#7567E8]'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'text-[#4B5563]' : 'text-[#111827] font-semibold'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-[#6B7280] font-medium">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <button 
                        onClick={() => handleMarkRead(notification.id)}
                        className="text-xs text-[#7567E8] font-bold hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7567E8] shrink-0 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
