'use client';

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import StreakDialog from '../common/StreakDialog';
import { UserProfile, Notification } from '@/lib/types';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/database';
import NotificationBell from '../notifications/NotificationBell';
import NotificationDropdown from '../notifications/NotificationDropdown';
import UserAvatar from '../common/UserAvatar';
import { supabase } from '@/services/database';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  title?: string;
  noPadding?: boolean;
  simpleHeader?: boolean;
  customHeader?: ReactNode;
  user?: UserProfile;
  isLiveExam?: boolean;
  onSubmit?: () => void;
  isEvaluating?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
  toggleTheme,
  isDarkMode,
  title = 'ড্যাশবোর্ড',
  noPadding = false,
  simpleHeader = false,
  customHeader,
  user,
  isLiveExam,
  onSubmit,
  isEvaluating = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dropdown & Modal States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isStreakDialogOpen, setIsStreakDialogOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        if (window.innerWidth >= 768) {
          setIsNotifOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount & Subscribe to Realtime
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      setNotificationsLoading(true);
      try {
        const { data: notifs } = await getNotifications();
        setNotifications(notifs);

        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();

    if (user?.id) {
      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: { new: Notification }) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);

            toast.info(newNotif.title, {
              description: newNotif.message,
              duration: 5000,
              icon: '🔔',
            });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Notification Handlers
  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.id) return;

    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsNotifOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setIsNotifOpen(false);
    onTabChange('notifications');
  };

  return (
    <div className="h-screen w-full bg-[#FAFAF9] dark:bg-[#0C0A09] flex transition-colors overflow-hidden font-['HindSiliguri',sans-serif]">
      {/* ── Sidebar Component ── */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        user={user}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* ── Header Section (Matching Flutter MainLayout Header) ── */}
        {customHeader ? (
          <div className="sticky top-0 z-30 shrink-0">{customHeader}</div>
        ) : (
          <header
            className="h-[68px] bg-white/90 dark:bg-[#0C0A09]/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-[#1C1C1E] flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 z-30 shrink-0 sticky top-0 transition-all duration-300 select-none"
          >
            {/* ── Left: Back Button (Sub-routes) + Title ── */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {activeTab !== 'dashboard' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      onTabChange('dashboard');
                    }
                  }}
                  className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/90 dark:border-[#27272A] hover:bg-neutral-200/80 dark:hover:bg-[#2C2C2E] text-neutral-800 dark:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  aria-label="Back"
                  title="ফিরে যাও"
                >
                  <ArrowLeft size={18} className="stroke-[2.2]" />
                </button>
              )}

              <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-xl md:text-[21px] text-neutral-900 dark:text-white tracking-tight leading-tight truncate">
                {title}
              </h1>
            </div>

            {/* ── Right: Streak + Notification + Divider + User Avatar ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Streak Badge */}
              <button
                type="button"
                onClick={() => setIsStreakDialogOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1C1C1E] transition-all cursor-pointer group active:scale-95"
                title="দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো"
              >
                <Flame size={20} className="text-[#EF4444] fill-[#EF4444] animate-pulse shrink-0" />
                <span className="text-base sm:text-lg font-bold text-[#DC2626] font-['Anek_Bangla',sans-serif] tabular-nums">
                  {user?.streakCount || 0}
                </span>
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <NotificationBell
                  unreadCount={unreadCount}
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  isOpen={isNotifOpen}
                />

                {isNotifOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onViewAll={handleViewAllNotifications}
                    isLoading={notificationsLoading}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </div>

              {/* Divider */}
              <div className="w-[1px] h-6 bg-neutral-200 dark:bg-[#27272A] mx-0.5" />

              {/* Profile Avatar */}
              <button
                type="button"
                onClick={() => onTabChange('settings')}
                className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#059669]/40 transition-all cursor-pointer group shrink-0"
                title="প্রোফাইল ও সেটিংস"
              >
                <UserAvatar
                  user={user}
                  size="md"
                  className="w-9 h-9 ring-1 ring-neutral-200 dark:ring-[#27272A] shadow-xs"
                />
              </button>
            </div>
          </header>
        )}

        {/* ── Content Body (Uniform left & right padding across all pages) ── */}
        <main
          className={`flex-1 overflow-y-auto ${
            noPadding
              ? 'pb-24 lg:pb-0'
              : 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 pb-28 lg:pb-10'
          } relative scroll-smooth`}
        >
          <div className="w-full max-w-7xl mx-auto flex flex-col">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        {!simpleHeader && (
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={onTabChange}
            onMenuClick={() => setIsSidebarOpen(true)}
            isLiveExam={isLiveExam}
            onSubmit={onSubmit}
            isEvaluating={isEvaluating}
          />
        )}
      </div>

      {/* ── Streak Info Dialog ── */}
      {user && (
        <StreakDialog
          isOpen={isStreakDialogOpen}
          onClose={() => setIsStreakDialogOpen(false)}
          currentStreak={user.streakCount || 0}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default AppLayout;
