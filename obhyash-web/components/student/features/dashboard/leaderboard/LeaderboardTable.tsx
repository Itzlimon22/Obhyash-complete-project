"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { UserProfile } from "@/lib/types";
import { LevelType, LEVELS } from "./leaderboardData";
import UserAvatar from "@/components/student/ui/common/UserAvatar";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LeaderboardPodium from "./LeaderboardPodium";
import { motion } from "framer-motion";
import { Trophy, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  users: UserProfile[];
  selectedLevel: LevelType;
  onUserClick?: (user: UserProfile) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  title?: string;
  totalCount?: number;
  timeframe?: "weekly" | "monthly" | "all_time";
  hidePodium?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  users,
  selectedLevel,
  onUserClick,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  title,
  totalCount,
  timeframe = "monthly",
  hidePodium = false,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const top3 = !hidePodium && users.length >= 3 ? users.slice(0, 3) : [];
  const remainingUsers = !hidePodium && users.length >= 3 ? users.slice(3) : users;

  const displayTitle =
    title ??
    `${LEVELS.find((l) => l.id === selectedLevel)?.label.split(" ")[0] ?? ""} র‍্যাঙ্কিং`;

  const getEffectiveXp = (user: UserProfile) => {
    if (timeframe === "all_time") return user.xp || 0;
    return (user as any).monthly_xp ?? user.xp ?? 0;
  };

  return (
    <div className="space-y-4 font-['HindSiliguri']">
      {/* Top 3 Podium */}
      {!isLoading && top3.length > 0 && (
        <LeaderboardPodium
          topUsers={top3}
          onUserClick={onUserClick}
          timeframe={timeframe}
        />
      )}

      {/* Rankings List Container */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A] overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#141417] flex justify-between items-center gap-2 flex-wrap">
          <h3 className="font-black text-sm md:text-base text-neutral-800 dark:text-neutral-200">
            {displayTitle}
          </h3>
          {(totalCount ?? users.length) > 0 && (
            <span className="text-xs text-neutral-500 font-bold bg-neutral-100 dark:bg-[#27272A] px-2.5 py-1 rounded-full">
              {BanglaNameHelper.toBanglaNumeral(users.length)} জন{hasMore ? "+" : " মোট"}
            </span>
          )}
        </div>

        {/* Table List */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50/70 dark:bg-[#141417] border-b border-neutral-200/80 dark:border-neutral-800 text-[11px] font-black uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-3 md:px-6 md:py-3.5 text-center w-12 md:w-16">
                  র‌্যাঙ্ক
                </th>
                <th className="px-3 py-3 md:px-6 md:py-3.5">শিক্ষার্থী</th>
                <th className="px-3 py-3 md:px-6 md:py-3.5 text-right whitespace-nowrap">
                  মোট XP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-4 text-center">
                      <div className="h-5 w-5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto" />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                          <div className="h-2.5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="h-4 w-14 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <Trophy size={36} className="opacity-40" />
                      <p className="text-sm font-bold">
                        এই লেভেলে এখনও কোনো শিক্ষার্থী নেই।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                remainingUsers.map((user, idx) => {
                  const isMe = user.isCurrentUser;
                  const actualRank = !hidePodium && users.length >= 3 ? idx + 4 : idx + 1;
                  const isPro = (user as any).is_pro || (user as any).is_subscribed || (user as any).plan === "pro";

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onUserClick?.(user)}
                      className={cn(
                        "transition-all cursor-pointer group",
                        isMe
                          ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-emerald-500"
                          : "hover:bg-neutral-50 dark:hover:bg-[#141417]"
                      )}
                    >
                      {/* Rank Index */}
                      <td className="px-3 py-3.5 md:px-6 text-center">
                        <span className="font-mono text-xs sm:text-sm font-black text-neutral-600 dark:text-neutral-400">
                          #{BanglaNameHelper.toBanglaNumeral(actualRank)}
                        </span>
                      </td>

                      {/* User Info */}
                      <td className="px-3 py-3.5 md:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="md" className="shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-xs sm:text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {user.name || "শিক্ষার্থী"}
                              </h4>
                              {isPro && (
                                <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 text-[9px] font-black rounded-md flex items-center gap-0.5">
                                  <span>PRO</span>
                                </span>
                              )}
                              {isMe && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-black rounded-md">
                                  তুমি
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold truncate">
                              {user.institute || "শিক্ষা প্রতিষ্ঠান"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* XP & Exams */}
                      <td className="px-3 py-3.5 md:px-6 text-right">
                        <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {BanglaNameHelper.toBanglaNumeral(getEffectiveXp(user))} XP
                        </div>
                        <div className="text-[10px] text-neutral-400 font-bold">
                          {BanglaNameHelper.toBanglaNumeral(user.examsTaken || (user as any).exams_taken || 0)}টি পরীক্ষা
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Intersection Observer Sentinel for Infinite Scroll */}
        <div ref={sentinelRef} className="py-2 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>আরও লোড হচ্ছে...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;
