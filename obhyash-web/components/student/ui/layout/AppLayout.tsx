'use client';

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ArrowLeft, Flame, Menu, Crown } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import StreakDialog from '../common/StreakDialog';
import { UserProfile, Notification } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { isUserPro } from '@/lib/subscription-utils';
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
  onBack?: () => void;
  noPadding?: boolean;
  simpleHeader?: boolean;
  customHeader?: ReactNode;
  user?: UserProfile;
  isLiveExam?: boolean;
  onSubmit?: () => void;
  isEvaluating?: boolean;
  hideTitle?: boolean;
  hideBottomNav?: boolean;
  headerTabs?: {
    tabs: { id: string; label: string }[];
    activeTabId: string;
    onTabSelect: (id: string) => void;
  };
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
  toggleTheme,
  isDarkMode,
  title = 'ড্যাশবোর্ড',
  onBack,
  noPadding = false,
  simpleHeader = false,
  customHeader,
  user,
  isLiveExam,
  onSubmit,
  isEvaluating = false,
  hideTitle = false,
  hideBottomNav = false,
  headerTabs,
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
    <div className="h-screen w-full bg-[#FAFAF9] dark:bg-[#0C0A09] flex transition-colors overflow-hidden font-sans">
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
          <header className="h-[68px] bg-white/90 dark:bg-[#0C0A09]/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-[#1C1C1E] z-30 shrink-0 sticky top-0 transition-all duration-300 select-none">
            <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-14 xl:px-16 2xl:px-20">
            {/* ── Left / Center: Back / Menu Button + (Title OR Header Tabs) ── */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {activeTab === 'dashboard' ? (
                /* Mobile hamburger on Dashboard */
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/90 dark:border-[#27272A] hover:bg-neutral-200/80 dark:hover:bg-[#2C2C2E] text-neutral-800 dark:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  aria-label="Open navigation menu"
                  title="মেনু খুলুন"
                >
                  <Menu size={18} className="stroke-[2.2]" />
                </button>
              ) : (
                /* Back button on other screens */
                <button
                  type="button"
                  onClick={() => {
                    if (onBack) {
                      onBack();
                    } else if (window.history.length > 1) {
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

              {headerTabs ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  {headerTabs.tabs.map((tab) => {
                    const isActive = headerTabs.activeTabId === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => headerTabs.onTabSelect(tab.id)}
                        className={`relative py-1.5 px-2 sm:px-3 text-base sm:text-lg font-bold font-['Anek_Bangla',sans-serif] transition-all cursor-pointer select-none ${
                          isActive
                            ? "text-[#059669] dark:text-[#10B981]"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                        }`}
                      >
                        {tab.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#059669] dark:bg-[#10B981] animate-in fade-in duration-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : !hideTitle ? (
                <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-xl md:text-[21px] text-neutral-900 dark:text-white tracking-tight leading-tight truncate">
                  {title}
                </h1>
              ) : null}
            </div>

            {/* ── Right: Legends League + Streak + Notification + Divider + User Avatar ── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Legends League shortcut on Leaderboard tab (Matching Flutter 1:1) */}
              {activeTab === 'leaderboard' && (
                <button
                  type="button"
                  onClick={() => onTabChange('legends-league')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 font-extrabold text-xs animate-pulse hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                  title="লেজেন্ডস লিগ দেখুন"
                >
                  <Crown size={14} className="shrink-0" />
                  <span className="hidden sm:inline font-['Anek_Bangla',sans-serif]">লেজেন্ডস লিগ</span>
                </button>
              )}

              {/* Streak Badge */}
              <button
                type="button"
                onClick={() => setIsStreakDialogOpen(true)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1C1C1E] transition-all cursor-pointer group active:scale-95"
                title="দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো"
              >
                <Flame size={19} className="text-[#EF4444] fill-[#EF4444] animate-pulse shrink-0" />
                <span className="text-sm sm:text-base font-bold text-[#DC2626] font-['Anek_Bangla',sans-serif] tabular-nums">
                  {BanglaNameHelper.toBanglaNumeral(user?.streakCount || 0)}
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

              {/* Profile Avatar with Pro Indicator */}
              <button
                type="button"
                onClick={() => onTabChange('settings')}
                className="relative flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-emerald-500/40 transition-all cursor-pointer group shrink-0"
                title="প্রোফাইল ও সেটিংস"
              >
                <UserAvatar
                  user={user}
                  size="md"
                  className="w-9 h-9 ring-1 ring-neutral-200 dark:ring-[#27272A] shadow-xs"
                />
                {isUserPro(user) && (
                  <span className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-amber-400 text-amber-950 rounded-full shadow-xs">
                    <Crown size={8} />
                  </span>
                )}
              </button>
            </div>
            </div>
          </header>
        )}

        {/* ── Content Body (Uniform left & right padding across all pages) ── */}
        <main
          className={`flex-1 overflow-y-auto ${
            noPadding
              ? 'pb-24 lg:pb-0'
              : 'py-5 sm:py-6 md:py-8 pb-28 lg:pb-12'
          } relative scroll-smooth`}
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-14 xl:px-16 2xl:px-20 flex flex-col">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        {!simpleHeader && !hideBottomNav && (
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
