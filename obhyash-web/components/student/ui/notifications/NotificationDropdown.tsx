'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Notification } from '@/lib/types';
import NotificationItem from './NotificationItem';
import { CheckCheck, Bell, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ── Desktop dropdown (rendered inline — works fine inside relative parent) ── */
  const desktopDropdown = (
    <AnimatePresence>
      <motion.div
        key="desktop-dropdown"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transitionEnd: { transform: 'none' },
        }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.18 }}
        className="hidden md:flex md:flex-col absolute top-12 right-0 w-[400px] max-h-[85vh] rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#2C2C2E] shadow-2xl z-[99] origin-top-right overflow-hidden backdrop-blur-none"
      >
        <DropdownHeader
          unreadCount={unreadCount}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMarkAllAsRead={onMarkAllAsRead}
          onClose={onClose}
        />
        <NotificationList
          isLoading={isLoading}
          displayedNotifications={displayedNotifications}
          activeTab={activeTab}
          onNotificationClick={onNotificationClick}
        />
        <DropdownFooter onViewAll={onViewAll} />
      </motion.div>
    </AnimatePresence>
  );

  /* ── Mobile bottom sheet (using Radix Dialog matching Flutter NotificationCenterModal) ───── */
  const mobileSheet = (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="z-[99] md:hidden" />
        <DialogContent
          showCloseButton={false}
          className="md:hidden z-[100] p-0 max-h-[85vh] flex flex-col gap-0 border-b-0 rounded-t-[28px] overflow-hidden bg-white dark:bg-[#000000]"
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[#12544F] rounded-t-[28px] pointer-events-none" />

          {/* Drag handle (Flutter 1:1) */}
          <div className="mx-auto mt-3 mb-1.5 h-1.5 w-11 rounded-full bg-neutral-300 dark:bg-[#3F3F46] flex-shrink-0" />

          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-2 pb-0 border-b border-neutral-100 dark:border-[#2C2C2E] font-['Anek_Bangla',sans-serif]">
            <div className="flex justify-between items-center mb-2.5">
              <DialogTitle className="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#12544F]/10 text-[#12544F] dark:text-[#34D399]">
                  <Bell className="w-4 h-4" />
                </div>
                <span>নোটিফিকেশন</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold leading-none min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 text-neutral-400 hover:text-[#12544F] hover:bg-[#E6F0EC] dark:hover:bg-[#12544F]/20 rounded-lg transition-colors cursor-pointer"
                    aria-label="সব পঠিত"
                    title="সব পড়া হয়েছে"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="বন্ধ করো"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs (Flutter 1:1) */}
            <div className="flex gap-5 font-['Anek_Bangla',sans-serif]">
              {(['unread', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'pb-2.5 text-[13.5px] font-bold relative transition-colors cursor-pointer select-none',
                    activeTab === tab
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-400 dark:text-neutral-500',
                  )}
                >
                  {tab === 'unread' ? 'অপঠিত' : 'সবগুলো'}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="mobileNotifTab"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#12544F] dark:bg-[#34D399] rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <NotificationList
            isLoading={isLoading}
            displayedNotifications={displayedNotifications}
            activeTab={activeTab}
            onNotificationClick={onNotificationClick}
          />

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#000000] font-['Anek_Bangla',sans-serif]">
            <button
              onClick={onViewAll}
              className="w-full py-3 rounded-2xl bg-[#12544F] hover:bg-[#0D3E3A] active:scale-[0.98] text-white text-sm font-bold transition-all duration-150 shadow-xs cursor-pointer select-none"
            >
              সব নোটিফিকেশন দেখো
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );

  return (
    <>
      {isMobile && mobileSheet}
      {desktopDropdown}
    </>
  );
};

/* ─────────────────────── Shared sub-components ─────────────────────── */

function DropdownHeader({
  unreadCount,
  activeTab,
  setActiveTab,
  onMarkAllAsRead,
  onClose,
}: {
  unreadCount: number;
  activeTab: 'all' | 'unread';
  setActiveTab: (tab: 'all' | 'unread') => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-shrink-0 px-5 pt-4 pb-0 border-b border-neutral-100 dark:border-neutral-800 font-['Anek_Bangla',sans-serif]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#12544F]/10 text-[#12544F] dark:text-[#34D399]">
            <Bell className="w-4 h-4" />
          </div>
          <span>নোটিফিকেশন</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold leading-none min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 text-neutral-400 hover:text-[#12544F] hover:bg-[#E6F0EC] dark:hover:bg-[#12544F]/20 rounded-lg transition-colors cursor-pointer"
              title="সব পঠিত হিসেবে চিহ্নিত করো"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label="বন্ধ করো"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6 font-['Anek_Bangla',sans-serif]">
        {(['unread', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-2.5 text-sm font-bold relative transition-colors cursor-pointer select-none',
              activeTab === tab
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            {tab === 'unread' ? 'অপঠিত' : 'সবগুলো'}
            {activeTab === tab && (
              <motion.div
                layoutId="desktopNotifTab"
                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#12544F] dark:bg-[#34D399] rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationList({
  isLoading,
  displayedNotifications,
  activeTab,
  onNotificationClick,
}: {
  isLoading: boolean;
  displayedNotifications: Notification[];
  activeTab: 'all' | 'unread';
  onNotificationClick: (n: Notification) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {isLoading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse px-1">
              <div className="w-10.5 h-10.5 bg-neutral-100 dark:bg-neutral-800 rounded-[13px] shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center font-['Anek_Bangla',sans-serif]">
          <div className="w-12 h-12 mb-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {activeTab === 'unread' ? (
              <Bell className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            ) : (
              <Inbox className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            )}
          </div>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {activeTab === 'unread'
              ? 'সবকিছু পরিষ্কার!'
              : 'কোনো নোটিফিকেশন নেই'}
          </p>
          <p className="text-[11.5px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-['HindSiliguri',sans-serif]">
            {activeTab === 'unread'
              ? 'তোমার কোনো নতুন নোটিফিকেশন নেই।'
              : 'তোমার ইনবক্স ফাঁকা।'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
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
  );
}

function DropdownFooter({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="flex-shrink-0 p-3 border-t border-neutral-100 dark:border-neutral-800 font-['Anek_Bangla',sans-serif]">
      <button
        onClick={onViewAll}
        className="w-full py-2.5 rounded-xl bg-[#12544F] hover:bg-[#0D3E3A] text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer select-none"
      >
        সব নোটিফিকেশন দেখো
      </button>
    </div>
  );
}

export default NotificationDropdown;
