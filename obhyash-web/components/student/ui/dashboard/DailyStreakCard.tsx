"use client";

import React, { useState, useEffect } from "react";
import { Flame, Info, Check, Calendar } from "lucide-react";
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

  useEffect(() => {
    setStreakCount(userStreak);
  }, [userStreak]);

  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        let uid = userId;
        if (!uid) {
          const { data } = await supabase.auth.getUser();
          uid = data?.user?.id;
        }
        if (!uid) return;

        // Fetch user profile streak
        const { data: userProfile } = await supabase
          .from("users")
          .select("streak_count, last_streak_date")
          .eq("id", uid)
          .maybeSingle();

        if (userProfile?.streak_count !== undefined) {
          setStreakCount(userProfile.streak_count);
        }

        // Fetch exam results from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: examData } = await supabase
          .from("exam_results")
          .select("created_at")
          .eq("user_id", uid)
          .gte("created_at", thirtyDaysAgo.toISOString());

        const activity = new Array(30).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (examData) {
          examData.forEach((row: any) => {
            const examDate = new Date(row.created_at);
            examDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor(
              (today.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays >= 0 && diffDays < 30) {
              activity[29 - diffDays] += 1;
            }
          });
        }

        setLast30DaysActivity(activity);
      } catch (e) {
        console.warn("[DailyStreakCard] fetch error:", e);
      }
    };

    fetchStreakData();
  }, [userId]);

  const formatBoxDate = (index: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (29 - index));
    const day = BanglaNameHelper.toBanglaNumeral(targetDate.getDate());
    const month = BANGLA_MONTHS[targetDate.getMonth()];

    if (index === 29) {
      return `আজ (${day} ${month})`;
    } else if (index === 28) {
      return `গতকাল (${day} ${month})`;
    }
    return `${day} ${month}`;
  };

  const isStreakActive = streakCount > 0;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
      {/* ── Top Header Row ── */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-[#2C1810] border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-orange-500 shrink-0">
            <Flame size={22} className="fill-orange-500 animate-pulse" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
              {BanglaNameHelper.toBanglaNumeral(streakCount)} দিনের স্ট্রিক! 🔥
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              প্রতিদিন অন্তত ১টি পরীক্ষা দিয়ে স্ট্রিক ধরে রাখো
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-[#2C1810] border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 text-xs font-black shrink-0">
          {isStreakActive ? "সক্রিয় স্ট্রিক" : "নতুন শুরু"}
        </div>
      </div>

      {/* ── 30-Day Activity Heatmap Grid (Matching Flutter) ── */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-bold mb-2">
          <span>বিগত ৩০ দিনের অ্যাক্টিভিটি</span>
          <span>{last30DaysActivity[29] > 0 ? "আজ পরীক্ষা সম্পন্ন ✓" : "আজ এখনও বাকি"}</span>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 sm:gap-2">
          {last30DaysActivity.map((count, idx) => {
            const hasActivity = count > 0;
            const isToday = idx === 29;

            return (
              <div
                key={idx}
                title={`${formatBoxDate(idx)}: ${BanglaNameHelper.toBanglaNumeral(count)}টি পরীক্ষা`}
                className={cn(
                  "aspect-square rounded-md transition-all relative group flex items-center justify-center text-[9px] font-bold cursor-pointer",
                  hasActivity
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "bg-neutral-100 dark:bg-[#27272A] border border-neutral-200 dark:border-[#38383D] text-neutral-400",
                  isToday && "ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-[#18181B]"
                )}
              >
                {hasActivity ? "✓" : ""}

                {/* Floating Tooltip on Hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="px-2 py-1 bg-neutral-900 text-white text-[10px] rounded shadow-md whitespace-nowrap font-bold">
                    {formatBoxDate(idx)}: {BanglaNameHelper.toBanglaNumeral(count)}টি পরীক্ষা
                  </div>
                  <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyStreakCard;
