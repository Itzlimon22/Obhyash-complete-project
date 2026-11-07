'use client';

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { ArrowLeft, Flame, Crown, Award, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import StreakDialog from '../common/StreakDialog';
import { UserProfile, Notification } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { isUserPro } from '@/lib/subscription-utils';
import { getUnreadNotificationCount } from '@/services/database';
import NotificationBell from '../notifications/NotificationBell';
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
  centerTitle?: boolean;
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
  centerTitle = false,
  onRefresh,
}) => {
  const isSubPage = SUB_PAGES_WITHOUT_BOTTOM_NAV.has(activeTab);
  const shouldShowBottomNav = !simpleHeader && !hideBottomNav && !isSubPage;

  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modal State
  const [isStreakDialogOpen, setIsStreakDialogOpen] = useState(false);

  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count on mount & Subscribe to Realtime
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
      }
    };

    fetchUnreadCount();

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

  const isDashboard = activeTab === 'dashboard';
  const isSetupRoot = activeTab === 'setup' && !onBack;
  const isQuestionBankRoot = (activeTab === 'question_bank' || activeTab === 'question-bank') && !onBack && headerTabs !== undefined;
  const isPractice = activeTab === 'practice';
  const isHistory = activeTab === 'history';
  const isLeaderboard = activeTab === 'leaderboard';
  const isLiveExamTab = activeTab === 'live_exam' || activeTab === 'live-exam';
  const isLeftAligned = isPractice || isHistory;

  const showBackButton = !isDashboard && !isSetupRoot && !isQuestionBankRoot && Boolean(
    onBack ||
    (activeTab !== 'profile' && activeTab !== 'setup' && activeTab !== 'question_bank' && activeTab !== 'question-bank')
  );

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && ((window.history.state?.idx ?? 0) > 0 || window.history.length > 1)) {
      window.history.back();
    } else {
      onTabChange('dashboard');
    }
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
            <div className="w-full max-w-7xl mx-auto h-full flex items-center justify-between px-3.5 sm:px-6 md:px-8 relative">
              {isDashboard ? (
                /* ── 1. DASHBOARD HEADER (Matching Flutter main_layout.dart lines 660-854) ── */
                <>
                  {/* Left: Mobile Drawer Trigger + Full Logo (Hidden on desktop when sidebar is open) */}
                  <div className="flex items-center gap-2.5">
                    {/* Mobile Hamburger Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-1.5 -ml-1 text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      aria-label="মেনু খুলুন"
                    >
                      <Menu size={22} className="stroke-[2.2]" />
                    </button>

                    {/* Logo (Visible on mobile, or on desktop only when sidebar is collapsed) */}
                    <div
                      className={`flex items-center cursor-pointer ${isCollapsed ? 'flex' : 'lg:hidden'}`}
                      onClick={() => onTabChange('dashboard')}
                    >
                      <img
                        src={isDarkMode ? "/obhyash_full_logo_dark.svg" : "/obhyash_full_logo.svg"}
                        alt="Obhyash"
                        className="h-[26px] w-auto max-w-[140px] object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = isDarkMode ? "/obhyash_full_logo_dark.png" : "/obhyash_full_logo.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Streak + Notification + 1px Divider + User Avatar */}
                  <div className="flex items-center">
                    {/* Streak Badge */}
                    <button
                      type="button"
                      onClick={() => setIsStreakDialogOpen(true)}
                      className="flex items-center gap-1.5 text-[#EF4444] transition-transform active:scale-95 cursor-pointer select-none"
                      title="দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো"
                    >
                      <Flame size={23} className="fill-[#EF4444] shrink-0" />
                      <span className="text-[18.5px] font-bold font-sans tabular-nums leading-none text-[#DC2626] dark:text-[#EF4444]">
                        {BanglaNameHelper.toBanglaNumeral(user?.streakCount || 0)}
                      </span>
                    </button>

                    <div className="w-3" />

                    {/* Notification Bell */}
                    <NotificationBell
                      unreadCount={unreadCount}
                      onClick={() => onTabChange('notifications')}
                      isOpen={false}
                    />

                    {/* 1px Vertical Divider (Matching Flutter lines 820-827) */}
                    <div className="w-[1px] h-6 bg-[#E5E5E5] dark:bg-[#27272A] mx-2.5 shrink-0" />

                    {/* Profile Avatar */}
                    <button
                      type="button"
                      onClick={() => onTabChange('settings')}
                      className="relative flex items-center justify-center rounded-full cursor-pointer shrink-0 transition-transform active:scale-95"
                      title="প্রোফাইল ও সেটিংস"
                    >
                      <UserAvatar
                        user={user}
                        size="sm"
                        showBorder
                      />
                    </button>
                  </div>
                </>
              ) : (
                /* ── 2. NON-DASHBOARD HEADERS (Matching Flutter 1:1) ── */
                <>
                  {/* Left: Back Button & Optional Left-aligned Title */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                    {showBackButton && (
                      <button
                        type="button"
                        onClick={handleBackNavigation}
                        className="p-1 -ml-1 text-neutral-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                        aria-label="Back"
                        title="ফিরে যাও"
                      >
                        <ArrowLeft size={22} className="stroke-[2.2]" />
                      </button>
                    )}

                    {isLeftAligned && !hideTitle && (
                      <h1 className="font-sans font-bold text-[19px] leading-none text-neutral-900 dark:text-white tracking-[-0.2px] truncate">
                        {title}
                      </h1>
                    )}
                  </div>

                  {/* Center: Underline Tabs, Pill Segment, or Centered Title */}
                  {headerSegment ? (
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none">
                      <div className="h-9 p-[3px] rounded-xl bg-[#F3F4F6] dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center select-none shrink-0 pointer-events-auto">
                        {headerSegment.tabs.map((tab) => {
                          const isActive = headerSegment.activeTabId === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => headerSegment.onTabSelect(tab.id)}
                              className={cn(
                                "h-[30px] px-3 sm:px-4 rounded-[9px] text-[13px] font-sans transition-all flex items-center justify-center cursor-pointer",
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
                    </div>
                  ) : headerTabs ? (
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center justify-center gap-6 min-w-0 overflow-x-auto no-scrollbar py-0.5 pointer-events-auto">
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
                                className={`text-[15.5px] tracking-[-0.2px] font-sans transition-colors ${
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
                    </div>
                  ) : (!isLeftAligned && !hideTitle && title) ? (
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none px-14 sm:px-16">
                      <h1 className="font-sans font-bold text-[18px] sm:text-[19px] leading-none text-neutral-900 dark:text-white tracking-[-0.2px] truncate pointer-events-auto text-center max-w-[70%]">
                        {title}
                      </h1>
                    </div>
                  ) : null}

                  {/* Right Section */}
                  <div className="flex items-center shrink-0 z-10">
                    {headerRight ? (
                      headerRight
                    ) : isLeaderboard ? (
                      /* Flutter Leaderboard: Pulsing Legends League Shortcut */
                      <button
                        type="button"
                        onClick={() => onTabChange('legends-league')}
                        className="flex items-center gap-1.5 py-1 px-2 text-[#EF4444] hover:opacity-80 transition-all cursor-pointer active:scale-95 animate-pulse"
                        title="লেজেন্ডস লিগ দেখুন"
                      >
                        <Crown size={16} className="shrink-0 text-[#EF4444]" />
                        <span className="font-sans font-black text-[15px] tracking-[-0.2px]">
                          লেজেন্ডস লীগ
                        </span>
                      </button>
                    ) : isLiveExamTab ? (
                      /* Flutter Live Exam: My Results Shortcut */
                      <button
                        type="button"
                        onClick={() => onTabChange('live_exam_history')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-[#F1F5F9] dark:bg-[#1E2230] border border-[#CBD5E1] dark:border-[#33374A] text-neutral-800 dark:text-white font-sans text-xs transition-all hover:opacity-85 cursor-pointer active:scale-95"
                        title="আমার লাইভ পরীক্ষার ফলাফল"
                      >
                        <Award size={15} className="shrink-0" />
                        <span>আমার ফলাফল</span>
                      </button>
                    ) : (
                      <div className="w-[30px]" />
                    )}
                  </div>
                </>
              )}
            </div>
          </header>
        )}

        {/* ── Content Body (Adjusts padding dynamically when bottom nav is hidden) ── */}
        <main
          ref={mainScrollRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full ${
            noPadding
              ? shouldShowBottomNav
                ? 'pb-20 lg:pb-0'
                : 'pb-0'
              : shouldShowBottomNav
                ? 'py-3 sm:py-6 md:py-8 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-12'
                : 'py-3 sm:py-6 md:py-8 pb-8 lg:pb-12'
          } relative scroll-smooth`}
        >
          <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 md:px-8 lg:px-14 xl:px-16 2xl:px-20 flex flex-col min-w-0 max-w-full overflow-x-hidden">
            {children}
          </div>
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
