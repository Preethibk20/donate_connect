import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, markNotificationRead } from '../api/notificationApi';
import { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck, Inbox } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    setIsOpen(false);

    if (user?.role === 'NGO') {
      navigate('/ngo-dashboard');
    } else if (user?.role === 'DONOR') {
      navigate('/donations');
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const unreadList = notifications.filter((n) => !n.read);
      await Promise.all(unreadList.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-colors border flex items-center justify-center bg-white hover:bg-[#F4F2FA] text-[#111827] border-[#E5E7EB] shadow-sm"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 border rounded-2xl shadow-xl z-50 overflow-hidden space-y-1 bg-white border-[#E5E7EB]">
          {/* Dropdown Header */}
          <div className="p-4 border-b flex items-center justify-between bg-[#F9FAFB] border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7567E8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#7567E8]/10 text-[#7567E8] text-[10px] font-bold border border-[#7567E8]/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-semibold text-[#7567E8] hover:text-[#7567E8]/80 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="w-8 h-8 text-[#6B7280] mx-auto" />
                <p className="text-xs text-[#4B5563]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                    notification.read
                      ? 'bg-white hover:bg-[#F4F2FA]'
                      : 'bg-[#7567E8]/5 hover:bg-[#7567E8]/10 border-l-2 border-[#7567E8]'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#7567E8]" style={{ opacity: notification.read ? 0 : 1 }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      notification.read ? 'text-[#4B5563]' : 'text-[#111827] font-extrabold'
                    }`}>
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-[#6B7280] block mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
