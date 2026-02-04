import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  Edit3,
  RefreshCw,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Notification } from '../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
    onNotificationClick(notification);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'edit':
        return <Edit3 className="w-4 h-4" />;
      case 'status_change':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDark 
            ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border z-50 overflow-hidden ${
          isDark 
            ? 'bg-slate-800 border-slate-600' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Bildirimler
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 ${
                isDark ? 'text-concrete-500' : 'text-gray-400'
              }`}>
                <Bell className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Henüz bildirim yok</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                    notification.isRead
                      ? isDark ? 'bg-transparent hover:bg-slate-700/50' : 'bg-transparent hover:bg-gray-50'
                      : isDark ? 'bg-blue-600/10 hover:bg-blue-600/20' : 'bg-blue-50 hover:bg-blue-100'
                  } ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100'}`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    notification.type === 'comment'
                      ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                      : notification.type === 'edit'
                        ? isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                        : isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {notification.senderName}
                    </p>
                    <p className={`text-sm line-clamp-2 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className={`px-4 py-2 text-center border-t ${
              isDark ? 'border-slate-700 bg-slate-850' : 'border-gray-200 bg-gray-50'
            }`}>
              <span className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                +{notifications.length - 10} daha fazla bildirim
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
