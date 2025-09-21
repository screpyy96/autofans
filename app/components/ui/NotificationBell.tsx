import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import type { Notification, NotificationType } from '~/types';

export interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'price_drop':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    case 'new_listing':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'saved_search_alert':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'appointment_reminder':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'system':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
        </svg>
      );
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return 'text-blue-400 bg-blue-900/20 border border-blue-500/30';
    case 'price_drop':
      return 'text-green-400 bg-green-900/20 border border-green-500/30';
    case 'new_listing':
      return 'text-purple-400 bg-purple-900/20 border border-purple-500/30';
    case 'saved_search_alert':
      return 'text-orange-400 bg-orange-900/20 border border-orange-500/30';
    case 'appointment_reminder':
      return 'text-indigo-400 bg-indigo-900/20 border border-indigo-500/30';
    case 'system':
      return 'text-accent-gold bg-accent-gold/20 border border-accent-gold/30';
    default:
      return 'text-accent-gold bg-accent-gold/20 border border-accent-gold/30';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'acum';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}z`;
  }
};

export const NotificationBell = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className
}: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick(notification);
    setIsOpen(false);
  };

  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 text-gray-300 hover:text-accent-gold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800 rounded-2xl',
          isOpen && 'text-accent-gold'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19H6.5A2.5 2.5 0 014 16.5v-7A2.5 2.5 0 016.5 7h11A2.5 2.5 0 0120 9.5v2" />
        </svg>
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-accent-gold text-secondary-900 text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium shadow-glow"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-glass backdrop-blur-xl rounded-2xl shadow-modal border border-premium z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-premium">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Notificări
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-accent-gold hover:text-accent-gold/80 font-medium transition-colors"
                  >
                    Marchează toate ca citite
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-12 h-12 text-accent-gold/50 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19H6.5A2.5 2.5 0 014 16.5v-7A2.5 2.5 0 016.5 7h11A2.5 2.5 0 0120 9.5v2" />
                  </svg>
                  <p className="text-gray-400 text-sm">Nu ai notificări noi</p>
                </div>
              ) : (
                <div className="divide-y divide-premium">
                  {recentNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'px-4 py-3 hover:bg-accent-gold/10 cursor-pointer transition-colors',
                        !notification.isRead && 'bg-accent-gold/20'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          getNotificationColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={cn(
                                'text-sm font-medium text-white',
                                !notification.isRead && 'font-semibold'
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(new Date(notification.createdAt))}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-accent-gold rounded-full mt-1 ml-auto shadow-glow"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-premium bg-secondary-800/20">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      // Navigate to all notifications page
                      setIsOpen(false);
                    }}
                    className="text-sm text-accent-gold hover:text-accent-gold/80 font-medium transition-colors"
                  >
                    Vezi toate notificările
                  </button>
                  <button
                    onClick={() => {
                      onClearAll();
                      setIsOpen(false);
                    }}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Șterge toate
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};