'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCheck,
  Check,
  Trash2,
  BellOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Settings,
  Info,
} from 'lucide-react';
import { Notification } from '@/lib/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/services/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NotificationsViewProps {
  onNavigate?: (tab: string) => void;
}

type FilterType = 'all' | 'unread';

const NOTIFICATION_STYLES: Record<
  string,
  {
    icon: React.ElementType;
    bgLight: string;
    bgDark: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgLight: 'bg-[#ECFDF5]',
    bgDark: 'dark:bg-[#064E3B]/20',
    iconColor: 'text-[#059669]',
  },
  warning: {
    icon: AlertTriangle,
    bgLight: 'bg-[#FEF3C7]',
    bgDark: 'dark:bg-[#78350F]/20',
    iconColor: 'text-[#D97706]',
  },
  error: {
    icon: AlertCircle,
    bgLight: 'bg-[#FEF2F2]',
    bgDark: 'dark:bg-[#881337]/20',
    iconColor: 'text-[#DC2626]',
  },
  system: {
    icon: Settings,
    bgLight: 'bg-[#EDE9FE]',
    bgDark: 'dark:bg-[#4C1D95]/20',
    iconColor: 'text-[#8B5CF6]',
  },
  info: {
    icon: Info,
    bgLight: 'bg-[#DBEAFE]',
    bgDark: 'dark:bg-[#1E3A8A]/20',
    iconColor: 'text-[#2563EB]',
  },
};

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onNavigate,
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchNotifs = useCallback(
    async (pageNumber: number = 1, isLoadMore = false) => {
      if (isLoadMore) setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const offset = (pageNumber - 1) * limit;
        const { data, hasMore: more } = await getNotifications(limit, offset);

        if (isLoadMore) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = data.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newItems];
          });
        } else {
          setNotifications(data);
        }
        setHasMore(more);
        setPage(pageNumber);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchNotifs(1);
  }, [fetchNotifs]);

  // Realtime live subscription (1:1 with Flutter latestNotificationEventProvider)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif) {
            setNotifications((prev) => [
              newNotif,
              ...prev.filter((n) => n.id !== newNotif.id),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      toast.success('সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
    toast.success('মুছে ফেলা হয়েছে');
  };

  // Smart notification router (1:1 with Flutter NotificationRouter.handleTap)
  const handleNotificationTap = async (notif: Notification) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id);
    }

    const text = `${notif.title} ${notif.message}`.toLowerCase();

    if (text.includes('live') || text.includes('লাইভ')) {
      if (onNavigate) onNavigate('live_exam');
      else router.push('/live_exam');
    } else if (
      text.includes('report') ||
      text.includes('রিপোর্ট') ||
      text.includes('সমাধান')
    ) {
      if (onNavigate) onNavigate('reports');
      else router.push('/dashboard');
    } else if (
      text.includes('streak') ||
      text.includes('স্ট্রিক') ||
      text.includes('অনুশীলন') ||
      text.includes('practice')
    ) {
      if (onNavigate) onNavigate('practice');
      else router.push('/practice');
    } else if (
      text.includes('pro') ||
      text.includes('প্রিমিয়াম') ||
      text.includes('subscription') ||
      text.includes('সাবস্ক্রিপশন')
    ) {
      if (onNavigate) onNavigate('subscription');
      else router.push('/subscription');
    } else if (
      text.includes('leaderboard') ||
      text.includes('লিডারবোর্ড') ||
      text.includes('র‍্যাংক')
    ) {
      if (onNavigate) onNavigate('leaderboard');
      else router.push('/leaderboard');
    } else if (
      text.includes('bookmark') ||
      text.includes('বুকমার্ক')
    ) {
      if (onNavigate) onNavigate('bookmarks');
      else router.push('/bookmarks');
    }
  };

  const formatDateDistance = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'এখনই';
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘন্টা আগে`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} দিন আগে`;
    return new Date(iso).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-1 sm:px-3 py-2 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── Top Filter Tabs & Mark All Read Action (1:1 with Flutter) ── */}
      <div className="py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* All Filter Tab */}
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
              ${
                filter === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#27272A]'
              }
            `}
          >
            সব বার্তা
          </button>

          {/* Unread Filter Tab */}
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
              ${
                filter === 'unread'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#27272A]'
              }
            `}
          >
            অপঠিত
          </button>
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-[#E6F4EA] dark:bg-[#004633]/30 border border-[#004633]/30 text-[#004633] dark:text-[#4ADE80] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d8edd9] dark:hover:bg-[#004633]/50 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>সব পড়ুন</span>
          </button>
        )}
      </div>

      {/* ── Content List ── */}
      {isLoading ? (
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-[20px] bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-[#27272A] animate-pulse space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-18 h-18 rounded-full bg-neutral-100 dark:bg-[#1C1C1E] flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3.5">
            <BellOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-600 dark:text-neutral-300">
            {filter === 'unread'
              ? 'কোনো অপঠিত নোটিফিকেশন নেই'
              : 'কোনো নোটিফিকেশন নেই'}
          </h3>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notif) => {
              const style =
                NOTIFICATION_STYLES[notif.type?.toLowerCase()] ??
                NOTIFICATION_STYLES.info;
              const Icon = style.icon;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationTap(notif)}
                  className={`
                    p-4 rounded-[20px] border transition-all flex items-start gap-3.5 cursor-pointer
                    ${
                      notif.is_read
                        ? 'bg-white dark:bg-[#171717]/20 border-neutral-200/70 dark:border-[#1C1C1E] text-neutral-500 hover:border-neutral-300'
                        : 'bg-[#FAFAFA] dark:bg-[#18181B] border-neutral-300 dark:border-[#3F3F46] shadow-xs hover:border-neutral-400'
                    }
                  `}
                >
                  {/* Icon Box (42x42, rounded-[13px]) */}
                  <div
                    className={`
                      w-10.5 h-10.5 rounded-[13px] flex items-center justify-center shrink-0
                      ${style.bgLight} ${style.bgDark}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`
                          text-[15px] leading-snug truncate
                          ${
                            notif.is_read
                              ? 'font-semibold text-neutral-700 dark:text-neutral-300'
                              : 'font-bold text-neutral-950 dark:text-white'
                          }
                        `}
                      >
                        {notif.title}
                      </h4>
                      {/* Red unread dot */}
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[13.5px] text-neutral-600 dark:text-[#A1A1AA] leading-relaxed mb-2.5">
                      {notif.message}
                    </p>

                    {/* Bottom Status & Quick Action Row */}
                    <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-[#71717A]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateDistance(notif.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Single Mark Read Icon Button */}
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(notif.id, e)}
                            className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#27272A] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors cursor-pointer"
                            title="পঠিত হিসেবে চিহ্নিত করো"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#27272A] flex items-center justify-center text-[#DC2626] hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="মুছে ফেলো"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && (
            <div className="py-4 text-center">
              <button
                type="button"
                onClick={() => fetchNotifs(page + 1, true)}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-900 dark:text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-neutral-50 dark:hover:bg-[#202024] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? 'লোড হচ্ছে...' : 'আরও দেখুন'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
