"use client";

import React, { useState, useEffect } from "react";
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

  return (
    <div className="p-4 sm:p-4.5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#2C2C2E] shadow-sm font-['HindSiliguri']">
      {/* ── 1. Header Row (Matching Flutter DailyStreakCard) ── */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#059669]" />
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white leading-tight">
            গত ৩০ দিনের অ্যাক্টিভিটি
          </h3>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EF4444]/12 border border-[#EF4444]/20 text-[#EF4444] text-xs font-black shrink-0">
          <span>🔥</span>
          <span>{BanglaNameHelper.toBanglaNumeral(streakCount)} দিন</span>
        </div>
      </div>

      {/* ── 2. Compact Heatmap Grid (10 Columns x 3 Rows) ── */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 w-fit">
          {last30DaysActivity.map((count, idx) => {
            const isToday = idx === 29;

            let boxColorClass = "bg-[#F1F5F9] dark:bg-[#2C2C2E]";
            if (count === 1) {
              boxColorClass = "bg-[#EF4444]/35 dark:bg-[#EF4444]/40";
            } else if (count === 2) {
              boxColorClass = "bg-[#EF4444]/70 dark:bg-[#EF4444]/75";
            } else if (count >= 3) {
              boxColorClass = "bg-[#EF4444]";
            }

            const tooltipText =
              count > 0
                ? `${formatBoxDate(idx)}: ${BanglaNameHelper.toBanglaNumeral(count)}টি পরীক্ষা দেওয়া হয়েছে`
                : `${formatBoxDate(idx)}: কোনো পরীক্ষা দেওয়া হয়নি`;

            return (
              <div
                key={idx}
                className="relative group flex items-center justify-center"
              >
                <div
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 md:w-6.5 md:h-6.5 rounded-[5px] transition-all duration-150 cursor-pointer hover:scale-115 shadow-2xs",
                    boxColorClass,
                    isToday && "ring-1.5 ring-[#EF4444] ring-offset-1 dark:ring-offset-[#1C1C1E]"
                  )}
                />

                {/* Floating Tooltip on Hover */}
                <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="px-2.5 py-1 bg-[#18181B] text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap font-bold border border-neutral-700">
                    {tooltipText}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#18181B] rotate-45 -mt-1 border-r border-b border-neutral-700" />
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
