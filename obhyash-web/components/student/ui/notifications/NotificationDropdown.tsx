'use client';

import React from 'react';
import { Notification } from '@/lib/types';
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

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
  isLoading = false,
  onClose,
}) => {
  // Dropdown ONLY shows unread notifications — read ones are in the full page
  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const unreadCount = unreadNotifications.length;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[100] flex flex-col bg-white dark:bg-neutral-900 md:bg-transparent md:dark:bg-transparent',
          'md:fixed md:inset-0 md:z-[100] md:flex md:justify-end',
        )}
      >
        <div
          className={cn(
            'flex flex-col h-full w-full bg-white dark:bg-neutral-900 animate-in slide-in-from-bottom duration-300',
            // Desktop: Sidebar style (Drawer)
            'md:w-[400px] md:h-full md:border-l md:border-neutral-200 md:dark:border-neutral-800 md:shadow-2xl md:animate-in md:slide-in-from-right duration-300',
          )}
        >
          {/* STICKY HEADER */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100/50 dark:border-neutral-800/50 shrink-0">
            <div className="px-4 py-3 md:px-5 md:py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <h3 className="font-bold text-neutral-800 dark:text-white text-base">
                  নোটিফিকেশন
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] md:text-xs font-bold">
                    {unreadCount} অপঠিত
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                {unreadCount > 0 && (
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
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* LIST AREA — Only unread */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
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
            ) : unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 mb-6 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                </div>
                <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  সবকিছু পরিষ্কার!
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-[240px]">
                  আপনার কোনো নতুন নোটিফিকেশন নেই।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100/50 dark:divide-neutral-800/50 pb-20 md:pb-0">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => onNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}
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
