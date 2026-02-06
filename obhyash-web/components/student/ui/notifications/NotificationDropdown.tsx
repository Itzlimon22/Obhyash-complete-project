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

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
  isLoading = false,
}) => {
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="absolute right-0 top-12 w-80 md:w-96 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right ring-1 ring-neutral-900/5">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100/50 dark:border-neutral-800/50 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-neutral-800 dark:text-white text-base">
            নোটিফিকেশন
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {notifications.filter((n) => !n.is_read).length}
          </span>
        </div>

        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="group flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
            title="সবগুলো পঠিত হিসেবে চিহ্নিত করুন"
          >
            <CheckCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>সব পড়ুন</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar scroll-smooth">
        {isLoading ? (
          <div className="px-5 py-16 text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-neutral-100 dark:border-neutral-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 animate-pulse">
              নোটিফিকেশন লোড হচ্ছে...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-rose-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full"></div>
              <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                🔔
              </span>
            </div>
            <p className="text-base font-bold text-neutral-700 dark:text-neutral-200">
              সবকিছু পরিষ্কার!
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-[200px]">
              আপনার কোনো নতুন নোটিফিকেশন নেই। একটু পর আবার চেক করুন।
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
        <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <button
            onClick={onViewAll}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 hover:text-rose-600 dark:hover:text-rose-400 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>সব নোটিফিকেশন দেখুন</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
