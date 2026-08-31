"use client";

import React from "react";
import { useCountUp } from "@/hooks/use-count-up";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

interface StatsGridProps {
  examsTaken: number;
  avgScore: number;
  xp: number;
  streak: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  examsTaken,
  avgScore,
  xp,
  streak,
}) => {
  const animatedExams = useCountUp(examsTaken, 1000);
  const animatedScore = useCountUp(avgScore, 1500);
  const animatedXp = useCountUp(xp, 2000);
  const animatedStreak = useCountUp(streak, 1200);

  const stats = [
    {
      title: "মোট পরীক্ষা",
      value: `${BanglaNameHelper.toBanglaNumeral(animatedExams)}টি`,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "গড় স্কোর",
      value: `${BanglaNameHelper.toBanglaNumeral(animatedScore)}%`,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "মোট XP",
      value: BanglaNameHelper.toBanglaNumeral(animatedXp),
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "স্ট্রিক",
      value: `${BanglaNameHelper.toBanglaNumeral(animatedStreak)} দিন`,
      color: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6 font-['HindSiliguri']">
      {stats.map((item, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#18181b] p-3.5 sm:p-4 rounded-2xl border border-neutral-200/90 dark:border-[#27272a] shadow-sm flex flex-col items-center justify-center text-center transition-all duration-150 hover:border-neutral-300 dark:hover:border-[#3f3f46]"
        >
          <span className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1 truncate w-full">
            {item.title}
          </span>
          <span className={`text-xl sm:text-2xl font-black ${item.color} tracking-tight tabular-nums`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
