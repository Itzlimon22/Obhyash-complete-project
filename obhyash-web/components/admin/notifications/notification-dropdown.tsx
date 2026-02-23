'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
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

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Compute position of dropdown relative to the bell button
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  const loadNotifications = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          width: '24rem', // md:w-96
          zIndex: 9999,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        className="
          bg-white dark:bg-obsidian-900
          rounded-xl shadow-2xl
          border border-gray-100 dark:border-obsidian-800
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
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
  }, [isOpen, loadNotifications, updatePosition]);

  // Recalculate position on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setIsOpen(false);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

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

  // ── Portal panel — rendered at document.body, escapes all stacking contexts
  const panel = isOpen ? (
    <>
      {/* Backdrop Blur (only background, not dropdown) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          width: '24rem', // md:w-96
          zIndex: 9999,
        }}
        className="
          bg-white dark:bg-obsidian-900
          rounded-xl shadow-2xl
          border border-gray-100 dark:border-obsidian-800
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
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
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {tab === 'unread'
                ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`
                : 'All'}
            </button>
          ))}
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

                  {!notification.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
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
    </>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 text-gray-500 hover:text-paper-900 dark:text-gray-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-paper-50 dark:border-obsidian-950 animate-pulse" />
        )}
      </button>

      {/* ← portal renders at <body> level, outside all stacking contexts */}
      {typeof window !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
};
