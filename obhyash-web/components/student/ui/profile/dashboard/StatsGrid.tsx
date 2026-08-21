'use client';

import React from 'react';
import { useCountUp } from '@/hooks/use-count-up';

interface StatsGridProps {
  examsTaken: number;
  avgScore: number;
  xp: number;
  streak: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({
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
    { title: 'মোট পরীক্ষা', value: animatedExams.toString() },
    { title: 'গড় স্কোর', value: `${animatedScore}%` },
    { title: 'মোট XP', value: animatedXp.toString() },
    { title: 'স্ট্রিক', value: `${animatedStreak} দিন` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
      {stats.map((item, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#18181b] p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-[#27272a] shadow-sm flex flex-col items-center justify-center text-center transition-all duration-150 active:scale-95 hover:border-neutral-300 dark:hover:border-[#3f3f46] cursor-pointer"
        >
          <span className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-1 truncate w-full">
            {item.title}
          </span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
