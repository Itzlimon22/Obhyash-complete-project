"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { supabase } from "@/services/core";
import { cn } from "@/lib/utils";

export interface DailyStreakCardProps {
  userStreak?: number;
  userId?: string;
}

const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const DailyStreakCard: React.FC<DailyStreakCardProps> = ({
  userStreak = 0,
  userId,
}) => {
  const [streakCount, setStreakCount] = useState<number>(userStreak);
  const [last30DaysActivity, setLast30DaysActivity] = useState<number[]>(
    new Array(30).fill(0)
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (userStreak > 0) {
      setStreakCount(userStreak);
    }
  }, [userStreak]);

  const fetchStreakData = useCallback(async () => {
    try {
      let uid = userId;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id;
      }
      if (!uid) return;

      // 1. Fetch user profile streak
      const { data: userProfile } = await supabase
        .from("users")
        .select("streak, streak_count, last_streak_date")
        .eq("id", uid)
        .maybeSingle();

      const calculatedStreak =
        userProfile?.streak_count ?? userProfile?.streak ?? userStreak;
      setStreakCount(calculatedStreak);

      // 2. Fetch exam activity (past 30 days) using Dhaka timezone (UTC+6)
      const nowUtc = Date.now();
      const thirtyDaysAgoUtc = new Date(nowUtc - 31 * 86400 * 1000).toISOString();

      const [examRes, liveExamRes] = await Promise.all([
        supabase
          .from("exam_results")
          .select("created_at")
          .eq("user_id", uid)
          .gte("created_at", thirtyDaysAgoUtc),
        supabase
          .from("live_exam_attempts")
          .select("created_at")
          .eq("user_id", uid)
          .gte("created_at", thirtyDaysAgoUtc),
      ]);

      const activity = new Array(30).fill(0);
      const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

      const getDhakaDayNumber = (d: Date) => {
        const dhakaTime = new Date(d.getTime() + DHAKA_OFFSET_MS);
        return Math.floor(dhakaTime.getTime() / 86400000);
      };

      const todayDhakaDay = getDhakaDayNumber(new Date());

      const processDate = (isoStr: string) => {
        const examDate = new Date(isoStr);
        const examDhakaDay = getDhakaDayNumber(examDate);
        const diffDays = todayDhakaDay - examDhakaDay;
        if (diffDays >= 0 && diffDays < 30) {
          activity[29 - diffDays] += 1;
        }
      };

      if (examRes.data) {
        examRes.data.forEach((row: any) => row.created_at && processDate(row.created_at));
      }
      if (liveExamRes.data) {
        liveExamRes.data.forEach((row: any) => row.created_at && processDate(row.created_at));
      }

      setLast30DaysActivity(activity);
    } catch (e) {
      console.warn("[DailyStreakCard] fetch error:", e);
    }
  }, [userId, userStreak]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Realtime subscription to update streak immediately when exams are taken
  useEffect(() => {
    let channel: any = null;
    let uid = userId;

    const setupSubscription = async () => {
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id;
      }
      if (!uid) return;

      try {
        channel = supabase
          .channel(`streak_realtime_${uid}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "exam_results",
              filter: `user_id=eq.${uid}`,
            },
            () => fetchStreakData()
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "live_exam_attempts",
              filter: `user_id=eq.${uid}`,
            },
            () => fetchStreakData()
          )
          .subscribe();
      } catch (err) {
        console.warn("[DailyStreakCard] Realtime subscription error:", err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchStreakData]);

  const formatBoxDate = (index: number) => {
    const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
    const nowDhaka = new Date(Date.now() + DHAKA_OFFSET_MS);
    const targetDate = new Date(nowDhaka.getTime() - (29 - index) * 86400 * 1000);

    const day = BanglaNameHelper.toBanglaNumeral(targetDate.getUTCDate());
    const month = BANGLA_MONTHS[targetDate.getUTCMonth()];

    if (index === 29) {
      return `আজ (${day} ${month})`;
    } else if (index === 28) {
      return `গতকাল (${day} ${month})`;
    }
    return `${day} ${month}`;
  };

  return (
    <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
      {/* ── Header: Calendar Icon (Viridian Forest) + Title + Flame Badge (Royal Mulberry) ── */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E6F0EC] dark:bg-[#12544F]/20 flex items-center justify-center text-[#12544F] dark:text-[#34D399]">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm sm:text-[15px] font-semibold text-[#18181B] dark:text-white leading-tight">
            গত ৩০ দিনের অ্যাক্টিভিটি
          </h3>
        </div>

        {/* Streak Badge (Royal Mulberry #601D49) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#601D49]/15 dark:bg-[#601D49]/25 border border-[#601D49]/30 text-[#601D49] dark:text-[#F472B6] text-xs font-bold shrink-0">
          <span className="text-xs">🔥</span>
          <span>{BanglaNameHelper.toBanglaNumeral(streakCount)} দিন</span>
        </div>
      </div>

      {/* ── Heatmap Grid (10 Columns x 3 Rows) ── */}
      <div className="relative">
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {last30DaysActivity.map((count, idx) => {
            const isToday = idx === 29;

            // Viridian Forest shades for active activity
            let boxColorClass = "bg-[#F1F5F9] dark:bg-[#27272A]";
            if (count === 1) {
              boxColorClass = "bg-[#12544F]/35 dark:bg-[#12544F]/45";
            } else if (count === 2) {
              boxColorClass = "bg-[#12544F]/65 dark:bg-[#12544F]/75";
            } else if (count >= 3) {
              boxColorClass = "bg-[#12544F] dark:bg-[#12544F]";
            }

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "relative aspect-square rounded-[6px] transition-all cursor-pointer",
                  boxColorClass,
                  isToday ? "ring-1.5 ring-[#12544F] ring-offset-1 dark:ring-offset-[#18181B]" : "",
                  "hover:scale-115 hover:z-10"
                )}
              >
                {/* Tooltip on Hover */}
                {hoveredIndex === idx && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-neutral-900/95 dark:bg-neutral-800 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100">
                    <div>{formatBoxDate(idx)}</div>
                    <div className="text-neutral-300 font-normal">
                      {count > 0
                        ? `${BanglaNameHelper.toBanglaNumeral(count)} টি পরীক্ষা সম্পন্ন`
                        : "কোনো পরীক্ষা দেওয়া হয়নি"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyStreakCard;
