'use client';

import React, { useState, ReactNode, useRef, useEffect } from 'react';
import {
  User,
  CreditCard,
  Settings,
  Info,
  MessageSquare,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
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
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
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
        const notifs = await getNotifications();
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

    // Real-time Subscription
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
          (payload) => {
            console.log('🔔 New Notification:', payload.new);

            // Add new notification to state
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Play Sound (Optional - can be added later)
            // const audio = new Audio('/notification.mp3');
            // audio.play().catch(e => console.log('Audio play failed', e));

            // Show Toast
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

    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);

        // Update local state
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

    // Navigate if there's an action URL
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    // Close dropdown
    setIsNotifOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setIsNotifOpen(false);
    onTabChange('notifications'); // Navigate to notifications page if you have one
  };

  return (
    <div className="h-screen w-full bg-[#fafaf9] dark:bg-[#0c0a09] flex transition-colors overflow-hidden font-sans">
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
        {/* Header - Custom or Default */}
        {customHeader ? (
          <div className="sticky top-0 z-30 shrink-0">{customHeader}</div>
        ) : (
          <header
            className={`${simpleHeader ? 'h-14' : 'h-14 md:h-16'} bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between px-3 md:px-8 z-30 shrink-0 sticky top-0 transition-all duration-300`}
          >
            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-3">
              <h1
                className={`font-bold text-neutral-800 dark:text-white tracking-tight flex items-center gap-2 truncate ${simpleHeader ? 'text-sm' : 'text-base md:text-xl'}`}
              >
                {title}
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-5">
              {/* Streak Icon */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 bg-orange-50 dark:bg-orange-900/10 rounded-full border border-orange-100 dark:border-orange-900/20 group cursor-pointer transition-all hover:border-orange-200 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 shadow-sm"
                title="Daily Streak"
                onClick={() => {
                  // Optional: Add logic here if needed (e.g. show streak details)
                }}
              >
                <div className="relative">
                  <motion.svg
                    initial={{ scale: 1 }}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    animate={{
                      scale: [1, 1.1, 1],
                      filter: [
                        'drop-shadow(0 0 0px #f97316)',
                        'drop-shadow(0 0 4px #f97316)',
                        'drop-shadow(0 0 0px #f97316)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 md:w-5 md:h-5 text-orange-500 transition-transform"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                </div>
                <span className="text-xs md:text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {user?.streakCount || 0}
                </span>
              </motion.button>

              {/* Notification System */}
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

              {/* Profile Dropdown */}
              <div
                className="relative pl-2 border-l border-neutral-200 dark:border-neutral-800"
                ref={profileRef}
              >
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                  <UserAvatar
                    user={user}
                    size="md"
                    className="ring-2 ring-transparent group-hover:ring-rose-100 dark:group-hover:ring-rose-900"
                  />
                </button>

                {isProfileOpen && user && (
                  <div className="absolute right-0 top-12 w-72 md:w-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-black/50 z-50 overflow-hidden animate-fade-in origin-top-right">
                    {/* User Header - More Compact */}
                    <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/20">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="md" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">
                            {user.name}
                          </h4>
                          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 truncate">
                            {user.institute}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onTabChange('profile');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <User className="w-4 h-4 text-neutral-400" />
                        আমার প্রোফাইল
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onTabChange('subscription');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-neutral-400" />
                        সাবস্ক্রিপশন ও বিলিং
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onTabChange('settings');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-neutral-400" />
                        সেটিংস
                      </button>
                      |
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onTabChange('about');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <Info className="w-4 h-4 text-neutral-400" />
                        আমাদের সম্পর্কে
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onTabChange('complaint');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-neutral-400" />
                        অভিযোগ ও পরামর্শ
                      </button>
                      <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1"></div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
                          ডার্ক মোড
                        </span>
                        <button
                          onClick={toggleTheme}
                          className={`w-8 h-4.5 rounded-full relative transition-colors ${isDarkMode ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-sm ${isDarkMode ? 'translate-x-3.5' : 'translate-x-0'}`}
                          ></div>
                        </button>
                      </div>
                      <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1"></div>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        লগ আউট
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main
          className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-3 md:p-5'} pb-24 lg:pb-5 relative scroll-smooth`}
        >
          {children}
        </main>

        {!simpleHeader && (
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={onTabChange}
            onMenuClick={() => setIsSidebarOpen(true)}
            isLiveExam={isLiveExam}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;
