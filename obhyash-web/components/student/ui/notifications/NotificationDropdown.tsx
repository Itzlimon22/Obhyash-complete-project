import React from 'react';
import { Notification } from '@/lib/types';
import NotificationItem from './NotificationItem';
import { CheckCheck } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  isLoading?: boolean;
}

import React, { useEffect, useState } from 'react';
import { Notification } from '@/lib/types';
import NotificationItem from './NotificationItem';
import { CheckCheck, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useMediaQuery } from '@/hooks/use-media-query';

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  isLoading?: boolean;
  onClose: () => void; // Added onClose prop
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
  isLoading = false,
  onClose,
}) => {
  // Use a media query hook to detect mobile (optional, or just use CSS classes)
  // For now, using CSS classes (md:...) is safer if hook isn't available,
  // but to be "fully responsive" and "app-like", a hook helps conditionally render logic.
  // We'll stick to CSS for simplicity and robustness.

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <>
      {/* 
        Mobile Overlay: Fixed inset-0 
        Desktop: Absolute positioned dropdown
      */}
      <div
        className={cn(
          // Base: Fixed full screen on mobile
          'fixed inset-0 z-[100] flex flex-col bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 md:animate-in md:fade-in md:slide-in-from-top-2',
          // Desktop: Absolute dropdown, auto width/height
          'md:absolute md:inset-auto md:right-0 md:top-12 md:w-96 md:h-auto md:max-h-[600px] md:rounded-2xl md:shadow-2xl md:shadow-neutral-200/50 md:dark:shadow-black/50 md:border md:border-neutral-200/50 md:dark:border-neutral-700/50 md:bg-white/90 md:dark:bg-neutral-900/90',
        )}
      >
        {/* Mobile Header (Hidden on Desktop usually, but we keep a header for both) */}
        <div className="px-5 py-4 border-b border-neutral-100/50 dark:border-neutral-800/50 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-neutral-800 dark:text-white text-lg md:text-base">
              নোটিফিকেশন
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {notifications.filter((n) => !n.is_read).length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={onMarkAllAsRead}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-medium transition-all"
                title="সবগুলো পঠিত হিসেবে চিহ্নিত করুন"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">সব পড়ুন</span>
              </button>
            )}

            {/* Close Button - Visible on Mobile & Desktop */}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List - Flex 1 to fill space on mobile */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth p-0 md:max-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-sm text-neutral-500 animate-pulse">
                লোড হচ্ছে...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="w-20 h-20 mb-6 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center relative group">
                <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 group-hover:text-rose-500/50 transition-colors duration-500" />
                <div className="absolute inset-0 bg-rose-500/5 rounded-3xl scale-0 group-hover:scale-100 transition-transform duration-500" />
              </div>
              <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                সবকিছু পরিষ্কার!
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-[240px]">
                আপনার কোনো নতুন নোটিফিকেশন নেই। কোনো আপডেট আসলে এখানে দেখতে
                পাবেন।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100/50 dark:divide-neutral-800/50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => onNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && !isLoading && (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shrink-0">
            <button
              onClick={onViewAll}
              className="w-full py-3 md:py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:shadow-lg hover:scale-[0.98] transition-all duration-200"
            >
              সব নোটিফিকেশন দেখুন
            </button>
          </div>
        )}
      </div>

      {/* Mobile Backdrop - closes when clicked outside (on desktop, handled by parent ref, on mobile this div handles it) */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
    </>
  );
};

export default NotificationDropdown;

export default NotificationDropdown;
