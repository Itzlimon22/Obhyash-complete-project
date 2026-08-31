"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  Trash2,
  BellRing,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Settings,
  Info,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Notification } from "@/lib/types";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/database";
import { toast } from "sonner";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

type FilterType = "all" | "unread";

const NOTIFICATION_STYLES: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    bgLight: string;
    bgDark: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgLight: "bg-emerald-50 border-emerald-200",
    bgDark: "dark:bg-emerald-950/20 dark:border-emerald-900/40",
    textColor: "text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    bgLight: "bg-amber-50 border-amber-200",
    bgDark: "dark:bg-amber-950/20 dark:border-amber-900/40",
    textColor: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  error: {
    icon: AlertCircle,
    bgLight: "bg-rose-50 border-rose-200",
    bgDark: "dark:bg-rose-950/20 dark:border-rose-900/40",
    textColor: "text-rose-700 dark:text-rose-400",
    iconColor: "text-rose-500",
  },
  system: {
    icon: Settings,
    bgLight: "bg-purple-50 border-purple-200",
    bgDark: "dark:bg-purple-950/20 dark:border-purple-900/40",
    textColor: "text-purple-700 dark:text-purple-400",
    iconColor: "text-purple-500",
  },
  info: {
    icon: Info,
    bgLight: "bg-blue-50 border-blue-200",
    bgDark: "dark:bg-blue-950/20 dark:border-blue-900/40",
    textColor: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500",
  },
};

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchNotifs = async (pageNumber: number = 1, isLoadMore = false) => {
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
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifs(1);
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে!");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
    toast.success("বার্তা মুছে ফেলা হয়েছে 🗑️");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "এখনই";
    if (mins < 60) return `${BanglaNameHelper.toBanglaNumeral(mins)} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${BanglaNameHelper.toBanglaNumeral(hrs)} ঘণ্টা আগে`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${BanglaNameHelper.toBanglaNumeral(days)} দিন আগে`;
    return new Date(iso).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <span>নোটিফিকেশন সেন্টার</span>
            <span className="text-xl">🔔</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            পরীক্ষা, ফলাফল ও অ্যাকাউন্টের সকল বার্তা
          </p>
        </div>

        {/* Action button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-1.5 rounded-xl bg-[#004633] text-white text-xs font-black hover:bg-[#003627] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <CheckCheck size={14} />
            <span>সবগুলো পঠিত করো</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black border transition-all",
            filter === "all"
              ? "bg-[#004633] text-white border-[#004633] shadow-sm"
              : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
          )}
        >
          সব বার্তা ({BanglaNameHelper.toBanglaNumeral(notifications.length)})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black border transition-all",
            filter === "unread"
              ? "bg-[#004633] text-white border-[#004633] shadow-sm"
              : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
          )}
        >
          অপঠিত ({BanglaNameHelper.toBanglaNumeral(unreadCount)})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/80 dark:border-[#27272A] animate-pulse"
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] p-6">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center mb-3">
            <Inbox size={24} />
          </div>
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
            কোনো নোটিফিকেশন নেই
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {filter === "unread"
              ? "তোমার সব বার্তা পড়া হয়ে গেছে!"
              : "নতুন কোনো আপডেট আসলে এখানে দেখতে পাবে"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => !notif.is_read && handleMarkRead(notif.id, e)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-start gap-3.5 group cursor-pointer",
                    notif.is_read
                      ? "bg-white dark:bg-[#18181B] border-neutral-200/80 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700"
                      : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 shadow-sm"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                      style.bgLight,
                      style.bgDark
                    )}
                  >
                    <Icon className={style.iconColor} size={18} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={cn(
                          "text-xs sm:text-sm font-black truncate",
                          notif.is_read
                            ? "text-neutral-800 dark:text-neutral-200"
                            : "text-neutral-950 dark:text-white"
                        )}
                      >
                        {notif.title}
                      </h4>
                      <time className="text-[10px] text-neutral-400 font-bold shrink-0">
                        {formatRelativeTime(notif.created_at)}
                      </time>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                        title="পঠিত হিসেবে চিহ্নিত করো"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="মুছে ফেলো"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
