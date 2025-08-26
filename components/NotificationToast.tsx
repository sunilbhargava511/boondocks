'use client';

import React, { useState, useEffect } from 'react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration !== 0) { // duration 0 means persistent
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  const getToastStyles = (type: ToastNotification['type']) => {
    const baseStyles = "mb-3 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-900`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-900`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-900`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-900`;
    }
  };

  const getIcon = (type: ToastNotification['type']) => {
    const iconClass = "h-5 w-5 mr-3 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={`${iconClass} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      {notifications.map(notification => (
        <div key={notification.id} className={getToastStyles(notification.type)}>
          <div className="flex items-start">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium">{notification.title}</h4>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="ml-3 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook for using notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
};

export default NotificationToast;