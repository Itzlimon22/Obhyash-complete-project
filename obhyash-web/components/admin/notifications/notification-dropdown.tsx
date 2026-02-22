'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification, NotificationType } from '@/lib/types';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/database';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get count first
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);

      // Get actual data
      const data = await getNotifications(20, activeTab === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload when tab changes
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [activeTab, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markNotificationAsRead(id);

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
      case 'level_up':
      case 'achievement':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'error':
        return <X size={16} className="text-red-500" />;
      case 'exam_result':
        return <CheckCircle size={16} className="text-brand-500" />;
      case 'announcement':
        return <Info size={16} className="text-emerald-500" />;
      case 'system':
      case 'info':
      default:
        return <Info size={16} className="text-emerald-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-paper-900 dark:text-gray-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-lg transition-colors group"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-paper-50 dark:border-obsidian-950 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-obsidian-900 rounded-xl shadow-2xl border border-gray-100 dark:border-obsidian-800 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-obsidian-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-obsidian-800">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                activeTab === 'all'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                activeTab === 'unread'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <Bell size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-obsidian-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-obsidian-800 cursor-pointer transition-colors relative group',
                      !notification.is_read
                        ? 'bg-brand-50/30 dark:bg-brand-900/5'
                        : '',
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          notification.type === 'success' &&
                            'bg-emerald-100 dark:bg-emerald-900/20',
                          notification.type === 'warning' &&
                            'bg-red-100 dark:bg-red-900/20',
                          notification.type === 'error' &&
                            'bg-red-100 dark:bg-red-900/20',
                          notification.type === 'info' &&
                            'bg-emerald-100 dark:bg-emerald-900/20',
                        )}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm font-medium truncate pr-4',
                              notification.is_read
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-900 dark:text-white',
                            )}
                          >
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {formatTime(
                              notification.created_at ||
                                new Date().toISOString(),
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-obsidian-700"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-obsidian-800 bg-gray-50/50 dark:bg-obsidian-900/50 text-center">
            <Link
              href="/admin/notifications"
              className="text-xs font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              View All History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
