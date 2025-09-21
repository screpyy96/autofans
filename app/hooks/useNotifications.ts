import { useCallback } from 'react';
import { useNotifications as useNotificationsStore } from '~/stores/useAppStore';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationsStore();

  // Handle notification click - memoized to prevent unnecessary re-renders
  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.actionUrl) {
      console.log('Navigate to:', notification.actionUrl);
      // In production, you would use React Router navigation
      // navigate(notification.actionUrl);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    handleNotificationClick,
  };
};
