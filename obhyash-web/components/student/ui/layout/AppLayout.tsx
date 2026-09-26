'use client';

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ArrowLeft, Flame, Crown } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import StreakDialog from '../common/StreakDialog';
import AppRefreshIndicator from '@/components/common/AppRefreshIndicator';
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
import { PARENT_ROUTE_MAP } from '@/lib/routes';
import { cn } from '@/lib/utils';

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
  headerSegment?: {
    tabs: { id: string; label: string }[];
    activeTabId: string;
    onTabSelect: (id: string) => void;
  };
  headerRight?: ReactNode;
  onRefresh?: () => Promise<void> | void;
}

const SUB_PAGES_WITHOUT_BOTTOM_NAV = new Set([
  'setup',
  'exam_setup',
  'exam-setup',
  'notifications',
  'bookmarks',
  'legends-league',
  'legends_league',
  'subscription',
  'upgrade',
  'my-subscription',
  'complaint',
  'feature-requests',
  'about',
  'privacy',
  'terms',
  'faq',
  'help',
  'info',
  'account-info',
  'account-linking',
  'delete-account',
  'personal',
  'edit-profile',
  'reports',
  'user_profile',
  'subject_report',
  'referral',
  'academic_category',
  'subject_category',
  'institute_detail',
  'exam',
]);

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
  headerSegment,
  headerRight,
  onRefresh,
}) => {
  const isSubPage = SUB_PAGES_WITHOUT_BOTTOM_NAV.has(activeTab);
  const shouldShowBottomNav = !simpleHeader && !hideBottomNav && !isSubPage;

  const mainScrollRef = useRef<HTMLElement | null>(null);
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
    <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#FAFAF9] dark:bg-[#000000] flex transition-colors overflow-hidden font-sans">
      {/* ── Sidebar Component ── */}
      <Sidebar
        activeTab={PARENT_ROUTE_MAP[activeTab] || activeTab}
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
        {/* ── Header Section (Matching Flutter 1:1) ── */}
        {customHeader ? (
          <div className="sticky top-0 z-30 shrink-0">{customHeader}</div>
        ) : (
          <header className="h-[52px] bg-white/95 dark:bg-[#000000] backdrop-blur-xl border-b border-[#F3F4F6] dark:border-[#1C1C1E] z-30 shrink-0 sticky top-0 transition-all duration-300 select-none">
            <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-between px-3.5 sm:px-6 md:px-8 lg:px-14 xl:px-16 2xl:px-20">
              {/* ── Left / Center: Back Button (when not on dashboard) + (Title OR Header Tabs) ── */}
              <div className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2 ${headerTabs ? 'justify-center' : ''}`}>
                {(onBack || (activeTab !== 'dashboard' && activeTab !== 'setup' && activeTab !== 'question_bank' && activeTab !== 'profile')) && (
                  /* Back button on sub-screens matching Flutter minimal arrow */
                  <button
                    type="button"
                    onClick={() => {
                      if (onBack) {
                        onBack();
                      } else if (typeof window !== 'undefined' && window.history.length > 1) {
                        window.history.back();
                      } else {
                        onTabChange('dashboard');
                      }
                    }}
                    className="p-1 -ml-1 text-neutral-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                    aria-label="Back"
                    title="ফিরে যাও"
                  >
                    <ArrowLeft size={22} className="stroke-[2.2]" />
                  </button>
                )}

                {headerSegment ? (
                  <div className="h-9 p-[3px] rounded-xl bg-[#F3F4F6] dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center select-none shrink-0">
                    {headerSegment.tabs.map((tab) => {
                      const isActive = headerSegment.activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => headerSegment.onTabSelect(tab.id)}
                          className={cn(
                            "h-[30px] px-3 sm:px-4 rounded-[9px] text-[13px] font-['Anek_Bangla',sans-serif] transition-all flex items-center justify-center cursor-pointer",
                            isActive
                              ? "bg-[#12544F] text-white font-semibold shadow-xs"
                              : "text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white font-normal"
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                ) : headerTabs ? (
                  <div className="flex items-center justify-center gap-6 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                    {headerTabs.tabs.map((tab) => {
                      const isActive = headerTabs.activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => headerTabs.onTabSelect(tab.id)}
                          className="group flex flex-col items-center cursor-pointer select-none shrink-0"
                        >
                          <span
                            className={`text-[15.5px] tracking-[-0.2px] font-['Anek_Bangla',sans-serif] transition-colors ${
                              isActive
                                ? "font-semibold text-[#0F172A] dark:text-white"
                                : "font-medium text-[#64748B] dark:text-[#A1A1AA] group-hover:text-[#0F172A] dark:group-hover:text-white"
                            }`}
                          >
                            {tab.label}
                          </span>
                          <span
                            className={`w-full h-[3px] rounded-full mt-[3px] transition-all ${
                              isActive
                                ? "bg-[#004633] dark:bg-[#10B981]"
                                : "bg-transparent"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : !hideTitle ? (
                  <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-[19.5px] leading-none text-neutral-900 dark:text-white tracking-[-0.2px] truncate">
                    {title}
                  </h1>
                ) : null}
              </div>

              {/* ── Right Section: Matches Flutter 1:1 ── */}
              {headerRight ? (
                <div className="flex items-center shrink-0">{headerRight}</div>
              ) : activeTab === 'dashboard' ? (
                /* Dashboard Header Right: Streak + Notification + User Avatar */
                <div className="flex items-center gap-4 shrink-0">
                  {/* Streak Badge (Red Flame + Red Bangla Numeral) */}
                  <button
                    type="button"
                    onClick={() => setIsStreakDialogOpen(true)}
                    className="flex items-center gap-1.5 text-[#EF4444] transition-transform active:scale-95 cursor-pointer select-none"
                    title="দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো"
                  >
                    <Flame size={23} className="fill-[#EF4444] shrink-0" />
                    <span className="text-[18.5px] font-bold font-['Anek_Bangla',sans-serif] tabular-nums leading-none">
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

                  {/* Profile Avatar with Flutter Pro Sweep Gradient Ring */}
                  <button
                    type="button"
                    onClick={() => onTabChange('settings')}
                    className="relative flex items-center justify-center rounded-full cursor-pointer shrink-0 transition-transform active:scale-95"
                    title="প্রোফাইল ও সেটিংস"
                  >
                    <UserAvatar
                      user={user}
                      size="md"
                    />
                  </button>
                </div>
              ) : activeTab === 'leaderboard' ? (
                /* Leaderboard Header Right: Legends League shortcut matching Flutter */
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onTabChange('legends-league')}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                    title="লেজেন্ডস লিগ দেখুন"
                  >
                    <Crown size={14} className="shrink-0" />
                    <span className="font-['Anek_Bangla',sans-serif]">লেজেন্ডস লীগ</span>
                  </button>
                </div>
              ) : null}
            </div>
          </header>
        )}

        {/* ── Content Body (Adjusts padding dynamically when bottom nav is hidden) ── */}
        <main
          ref={mainScrollRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-w-0 max-w-full ${
            noPadding
              ? shouldShowBottomNav
                ? 'pb-20 lg:pb-0'
                : 'pb-0'
              : shouldShowBottomNav
                ? 'py-3 sm:py-6 md:py-8 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-12'
                : 'py-3 sm:py-6 md:py-8 pb-8 lg:pb-12'
          } relative scroll-smooth`}
        >
          <AppRefreshIndicator
            onRefresh={onRefresh}
            scrollContainerRef={mainScrollRef}
            disabled={isLiveExam || activeTab === 'exam'}
          >
            <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 md:px-8 lg:px-14 xl:px-16 2xl:px-20 flex flex-col min-w-0 max-w-full overflow-x-hidden">
              {children}
            </div>
          </AppRefreshIndicator>
        </main>

        {/* ── Mobile Bottom Navigation (Shown only on primary tabs) ── */}
        {shouldShowBottomNav && (
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
