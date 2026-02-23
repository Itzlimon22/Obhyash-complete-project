'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
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

// ── Pure helpers moved outside — not recreated on every render ────────────────

function getIcon(type: NotificationType) {
  switch (type) {
    case 'success':
    case 'level_up':
    case 'achievement':
      return <CheckCircle size={16} className="text-emerald-500" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-amber-500" />;
    case 'error':
      return <X size={16} className="text-red-500" />;
    case 'exam_result':
      return <CheckCircle size={16} className="text-blue-500" />;
    case 'announcement':
      return <Info size={16} className="text-purple-500" />;
    case 'system':
    case 'info':
    default:
      return <Info size={16} className="text-emerald-500" />;
  }
}

// Fix #5 — all 9 NotificationType values now have a background
function getIconBg(type: NotificationType): string {
  switch (type) {
    case 'success':
    case 'level_up':
    case 'achievement':
    case 'info':
    case 'system':
      return 'bg-emerald-100 dark:bg-emerald-900/20';
    case 'warning':
      return 'bg-amber-100 dark:bg-amber-900/20';
    case 'error':
      return 'bg-red-100 dark:bg-red-900/20';
    case 'exam_result':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'announcement':
      return 'bg-purple-100 dark:bg-purple-900/20';
    default:
      return 'bg-neutral-100 dark:bg-neutral-800';
  }
}

// Fix #8 — pure function, no component dependency
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fix #1 — useCallback with correct deps; no stale closure over activeTab
  const loadNotifications = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const count = await getUnreadNotificationCount();
        if (signal?.aborted) return;
        setUnreadCount(count);

        const data = await getNotifications(20, activeTab === 'unread');
        if (signal?.aborted) return; // Fix #6 — discard stale response
        setNotifications(data);
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        console.error('Failed to load notifications', error);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [activeTab],
  );

  // Fix #9 — single effect handles both initial load + polling
  // Fix #2 — loadNotifications properly listed in deps
  // Fix #6 — AbortController cancels in-flight request on cleanup
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    loadNotifications(controller.signal);
    const interval = setInterval(
      () => loadNotifications(controller.signal),
      30000,
    );
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [isOpen, loadNotifications]);

  // Fix #12 — Escape key closes dropdown; both listeners cleaned up together
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fix #4 — optimistic update with rollback on failure
  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read', error);
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  // Fix #4 — snapshot + rollback on failure
  const handleMarkAllAsRead = async () => {
    const snapshot = notifications;
    const snapshotCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all as read', error);
      setNotifications(snapshot);
      setUnreadCount(snapshotCount);
    }
  };

  // Fix #3 — notifications list updated on click
  // Fix #4 — try/catch with rollback
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read', error);
        // Rollback
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: false } : n,
          ),
        );
        setUnreadCount((prev) => prev + 1);
      }
    }
    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Fix #10 — aria-label + aria-expanded + aria-haspopup */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative p-2 text-gray-500 hover:text-paper-900 dark:text-gray-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-paper-50 dark:border-obsidian-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-obsidian-900 rounded-xl shadow-2xl border border-gray-100 dark:border-obsidian-800 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        >
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
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
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
              // Fix #11 — <ul>/<li> wrapper; main action and mark-as-read are
              // sibling <button>s — no invalid nested <button> in <button>
              <ul className="divide-y divide-gray-100 dark:divide-obsidian-800">
                {notifications.map((notification) => (
                  <li key={notification.id} className="relative group">
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'w-full text-left p-4 pr-8 hover:bg-gray-50 dark:hover:bg-obsidian-800 transition-colors',
                        !notification.is_read
                          ? 'bg-brand-50/30 dark:bg-brand-900/5'
                          : '',
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Fix #5 — getIconBg covers all types */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            getIconBg(notification.type),
                          )}
                        >
                          {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm font-medium truncate',
                                notification.is_read
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-900 dark:text-white',
                              )}
                            >
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                              {formatTime(
                                notification.created_at ??
                                  new Date().toISOString(),
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Sibling button — valid HTML, no nesting issue */}
                    {!notification.is_read && (
                      <button
                        onClick={(e) =>
                          handleMarkAsRead(e, notification.id)
                        }
                        aria-label="Mark as read"
                        className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-obsidian-700"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-obsidian-800 bg-gray-50/50 dark:bg-obsidian-900/50 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setIsOpen(false)}
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