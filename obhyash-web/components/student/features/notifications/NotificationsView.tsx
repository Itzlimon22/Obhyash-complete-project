'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Trash2, BellRing, X } from 'lucide-react';
import { Notification } from '@/lib/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/services/database';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  getNotificationStyle,
  groupNotificationsByDate,
  getRandomEmptyState,
} from './notification-utils';

const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [emptyState, setEmptyState] = useState(getRandomEmptyState());
  const limit = 20;

  const fetchNotifs = async (pageNumber: number = 1, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const offset = (pageNumber - 1) * limit;
      const { data, hasMore: more } = await getNotifications(limit, offset);

      if (isLoadMore) {
        setNotifications((prev) => [...prev, ...data]);
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
  };

  useEffect(() => {
    fetchNotifs(1);
  }, []);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifs(page + 1, true);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('সব বার্তা Read হিসেবে চিহ্নিত করা হয়েছে!');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
    toast.success('Delete করা হয়েছে 🗑️');
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 px-2 py-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-end justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3 tracking-tight">
              নোটিফিকেশন <span className="text-2xl animate-bounce">🔔</span>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
              সব আপডেট এবং অ্যাক্টিভিটি।
            </p>
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-sm font-bold text-neutral-600 dark:text-neutral-300 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              সব পড়ো
            </motion.button>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {isLoading ? (
            // Loading Skeletons
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            // Notification List
            <>
              <AnimatePresence mode="popLayout">
                {groupedNotifications.map((group) => (
                  <motion.div
                    key={group.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 pl-2">
                      {group.label}
                    </h3>

                    {group.items.map((notif) => {
                      const style = getNotificationStyle(notif.type);
                      const Icon = style.icon;

                      return (
                        <motion.div
                          layout
                          key={notif.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: -100 }}
                          onClick={() =>
                            !notif.is_read &&
                            handleMarkRead(notif.id, {} as any)
                          }
                          className={`relative group p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden
                            ${
                              notif.is_read
                                ? 'bg-neutral-50/50 dark:bg-neutral-900/20 border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none translate-x-1'
                            }
                          `}
                        >
                          {/* Unread Indicator Dot */}
                          {!notif.is_read && (
                            <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}

                          <div className="flex gap-5">
                            {/* Icon Box */}
                            <div
                              className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${style.bg} ${style.color}`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex justify-between items-start gap-4 mb-1">
                                <h4
                                  className={`text-base font-bold truncate pr-6 ${notif.is_read ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}
                                >
                                  {notif.title}
                                </h4>
                              </div>

                              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3 line-clamp-2">
                                {notif.message}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                                  {formatDistanceToNow(
                                    new Date(notif.created_at),
                                    { addSuffix: true, locale: bn },
                                  )}
                                </span>

                                {/* Action Buttons (Visible on Hover/Focus) */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                  <button
                                    onClick={(e) => handleDelete(notif.id, e)}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 rounded-xl transition-colors"
                                    title="মুছে ফেল"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-6 pb-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        লোড হচ্ছে...
                      </span>
                    ) : (
                      'আরও দেখুন'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center px-4"
            >
              <div className="w-32 h-32 bg-gradient-to-tr from-emerald-100 to-red-50 dark:from-neutral-800 dark:to-neutral-900 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100 dark:shadow-none animate-float">
                <span className="text-6xl filter drop-shadow-lg">
                  {emptyState.icon}
                </span>
              </div>
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white mb-2">
                {emptyState.message}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium max-w-sm mx-auto">
                {emptyState.subtext}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
