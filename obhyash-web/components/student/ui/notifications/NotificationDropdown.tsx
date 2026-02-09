'use client';

import React, { useState, useMemo } from 'react';
import { Notification, NotificationType } from '@/lib/types';
import NotificationItem from './NotificationItem';
import { CheckCheck, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  isLoading?: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'unread' | 'results' | 'system';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'সব' },
  { id: 'unread', label: 'অপঠিত' },
  { id: 'results', label: 'রেজাল্ট' },
  { id: 'system', label: 'সিস্টেম' },
];

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
  isLoading = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const hasUnread = notifications.some((n) => !n.is_read);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.is_read);
      case 'results':
        return notifications.filter((n) =>
          ['exam_result', 'achievement', 'level_up'].includes(n.type),
        );
      case 'system':
        return notifications.filter((n) =>
          ['announcement', 'system', 'warning', 'error', 'info'].includes(
            n.type,
          ),
        );
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Get count for each tab
  const getTabCount = (tab: FilterTab) => {
    switch (tab) {
      case 'all':
        return notifications.length;
      case 'unread':
        return notifications.filter((n) => !n.is_read).length;
      case 'results':
        return notifications.filter((n) =>
          ['exam_result', 'achievement', 'level_up'].includes(n.type),
        ).length;
      case 'system':
        return notifications.filter((n) =>
          ['announcement', 'system', 'warning', 'error', 'info'].includes(
            n.type,
          ),
        ).length;
      default:
        return 0;
    }
  };

  return (
    <>
      <div
        className={cn(
          // Mobile: Bottom sheet style with fixed full height overlay
          'fixed inset-0 z-[100] flex flex-col bg-white dark:bg-neutral-900 md:bg-transparent md:dark:bg-transparent',
          // Desktop: Positional cleanup
          'md:absolute md:inset-auto md:right-0 md:top-12 md:z-[100]',
        )}
      >
        {/* Container with animations */}
        <div
          className={cn(
            // Mobile: Full height bottom drawer
            'flex flex-col h-full w-full bg-white dark:bg-neutral-900 animate-in slide-in-from-bottom duration-300 md:animate-in md:fade-in md:slide-in-from-top-2',
            // Desktop: Boxed dropdown
            'md:w-96 md:h-auto md:max-h-[600px] md:rounded-2xl md:shadow-2xl md:border md:border-neutral-200/50 md:dark:border-neutral-700/50 md:bg-white/95 md:dark:bg-neutral-900/95 md:backdrop-blur-xl md:overflow-hidden',
          )}
        >
          {/* STICKY HEADER PART */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100/50 dark:border-neutral-800/50 shrink-0">
            {/* Header Title Bar */}
            <div className="px-4 py-3 md:px-5 md:py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <h3 className="font-bold text-neutral-800 dark:text-white text-base md:text-base">
                  নোটিফিকেশন
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] md:text-xs font-bold">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                {hasUnread && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="group flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] md:text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-medium transition-all"
                  >
                    <CheckCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">সব পড়ুন</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 -mr-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs (Part of Sticky Header) */}
            <div className="px-3 pb-2 md:px-4 shrink-0">
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {FILTER_TABS.map((tab) => {
                  const count = getTabCount(tab.id);
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 outline-none tap-highlight-transparent',
                        isActive
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                      )}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span
                          className={cn(
                            'px-1 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold',
                            isActive
                              ? 'bg-white/20 dark:bg-neutral-900/20'
                              : 'bg-neutral-100 dark:bg-neutral-800',
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LIST AREA */}
          <div className="flex-1 overflow-y-auto custom-scrollbar md:max-h-[400px]">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 mb-6 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center relative group">
                  <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                </div>
                <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {activeTab === 'all'
                    ? 'সবকিছু পরিষ্কার!'
                    : 'কোনো নোটিফিকেশন নেই'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-[240px]">
                  {activeTab === 'unread'
                    ? 'আপনার সব নোটিফিকেশন পড়া হয়ে গেছে।'
                    : 'আপনার কোনো নতুন নোটিফিকেশন নেই।'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100/50 dark:divide-neutral-800/50 pb-20 md:pb-0">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => onNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FOOTER AREA - Sticky on Mobile */}
          {notifications.length > 0 && !isLoading && (
            <div className="sticky bottom-0 mt-auto p-4 md:p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shrink-0">
              <button
                onClick={onViewAll}
                className="w-full py-3.5 md:py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                সব নোটিফিকেশন দেখুন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop (Desktop Only) */}
      <div
        className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px] hidden md:block"
        onClick={onClose}
      />
    </>
  );
};

export default NotificationDropdown;
