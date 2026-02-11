import React, { useState } from 'react';
import { Notification } from '@/lib/types';
import NotificationItem from './NotificationItem';
import { CheckCheck, Bell, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

  // Filter based on active tab
  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          // Mobile: Fixed Full Screen
          'fixed inset-0 z-[100] flex flex-col bg-white dark:bg-neutral-900',
          // Desktop: Absolute Dropdown
          'md:absolute md:inset-auto md:top-12 md:right-0 md:w-[400px] md:h-auto md:max-h-[85vh] md:rounded-2xl md:bg-white md:dark:bg-neutral-900 md:shadow-2xl md:border md:border-neutral-200 md:dark:border-neutral-800 md:origin-top-right',
        )}
      >
        {/* HEADER */}
        <div className="flex flex-col border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20 md:rounded-t-2xl">
          <div className="px-4 py-3 pb-0 flex justify-between items-center">
            <h3 className="font-bold text-neutral-800 dark:text-white text-base flex items-center gap-2">
              নোটিফিকেশন
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex px-4 mt-3 gap-6">
            <button
              onClick={() => setActiveTab('unread')}
              className={cn(
                'pb-2.5 text-sm font-bold relative transition-colors',
                activeTab === 'unread'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
              )}
            >
              অপঠিত
              {activeTab === 'unread' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-rose-400 rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'pb-2.5 text-sm font-bold relative transition-colors',
                activeTab === 'all'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
              )}
            >
              সবগুলো
              {activeTab === 'all' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-rose-400 rounded-full"
                />
              )}
            </button>
          </div>
        </div>

        {/* LIST AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar md:min-h-[300px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center h-full">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
                {activeTab === 'unread' ? (
                  <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                ) : (
                  <Inbox className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                )}
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {activeTab === 'unread'
                  ? 'সবকিছু পরিষ্কার!'
                  : 'কোনো নোটিফিকেশন নেই'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[200px]">
                {activeTab === 'unread'
                  ? 'আপনার কোনো নতুন নোটিফিকেশন নেই।'
                  : 'আপনার ইনবক্স ফাঁকা।'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100/50 dark:divide-neutral-800/50">
              {displayedNotifications.map((notification) => (
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
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 md:rounded-b-2xl sticky bottom-0 z-10">
          <button
            onClick={onViewAll}
            className="w-full py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            সব নোটিফিকেশন দেখুন
          </button>
        </div>
      </motion.div>

      {/* Backdrop (Desktop Only - Optional for closing on click outside, but logic is handled by parent, so this works for mobile modal effect if needed) */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
        onClick={onClose}
      />
    </>
  );
};

export default NotificationDropdown;
