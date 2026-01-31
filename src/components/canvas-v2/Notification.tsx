'use client';

import React, { useEffect } from 'react';
import { Notification as NotificationType } from '@/hooks/useNotification';

interface NotificationProps {
    notification: NotificationType;
    onClose: () => void;
}

export default function Notification({ notification, onClose }: NotificationProps) {
    useEffect(() => {
        if (notification.duration && notification.duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, notification.duration);

            return () => clearTimeout(timer);
        }
    }, [notification.duration, onClose]);

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getStyles = () => {
        switch (notification.type) {
            case 'success':
                return 'bg-emerald-50 border-emerald-200 text-emerald-800';
            case 'error':
                return 'bg-rose-50 border-rose-200 text-rose-800';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-800';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div
            className={`
                ${getStyles()}
                border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
                flex items-start gap-3 animate-in slide-in-from-right-full
            `}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{notification.title}</div>
                {notification.message && (
                    <div className="text-sm mt-1 opacity-90">{notification.message}</div>
                )}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close notification"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

interface NotificationContainerProps {
    notifications: NotificationType[];
    onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <Notification notification={notification} onClose={() => onRemove(notification.id)} />
                </div>
            ))}
        </div>
    );
}
