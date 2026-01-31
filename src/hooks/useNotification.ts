'use client';

import { useState, useCallback } from 'react';

export interface Notification {
    id: string;
    title: string;
    message?: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

export function useNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback(
        (notification: Omit<Notification, 'id'>) => {
            const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newNotification: Notification = {
                ...notification,
                id,
                duration: notification.duration || 5000,
            };

            setNotifications((prev) => [...prev, newNotification]);

            // Auto-dismiss after duration
            if (newNotification.duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, newNotification.duration);
            }

            return id;
        },
        []
    );

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        showNotification,
        removeNotification,
        clearAll,
    };
}
