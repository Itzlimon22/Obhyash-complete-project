'use client';

import React, { useMemo } from 'react';

interface DailyGoalCardProps {
  completedToday: number;
  goal?: number; // default 3
  onStartExam: () => void;
}

const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  completedToday,
  goal = 3,
  onStartExam,
}) => {
  const pct = useMemo(
    () => Math.min(100, Math.round((completedToday / goal) * 100)),
    [completedToday, goal],
  );
  const done = completedToday >= goal;

  // SVG ring
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-colors ${
        done
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
      }`}
    >
      {/* Ring */}
      <div className="flex-shrink-0 relative w-12 h-12">
        <svg
          viewBox="0 0 52 52"
          className="w-12 h-12 -rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            strokeWidth="5"
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
          {/* Progress */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke={done ? '#059669' : '#10b981'}
            strokeDasharray={`${dash} ${circ - dash}`}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <span className="text-base">✅</span>
          ) : (
            <span className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-300 leading-none">
              {completedToday}/{goal}
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
          আজকের লক্ষ্য
        </p>
        <p
          className={`text-sm font-extrabold leading-tight ${
            done
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {done
            ? 'আজকের লক্ষ্য পূরণ হয়েছে! 🎉'
            : `আরো ${goal - completedToday}টি প্র্যাকটিস বাকি`}
        </p>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
          {completedToday} / {goal} সেশন সম্পন্ন
        </p>
      </div>

      {/* CTA */}
      {!done && (
        <button
          onClick={onStartExam}
          className="flex-shrink-0 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          শুরু করো
        </button>
      )}
    </div>
  );
};

export default DailyGoalCard;

// ─── Utility: read/write daily completions from localStorage ─────────────────

export function getDailyCompletions(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(`obhyash_daily_goal_${userId}_${today}`);
  return raw ? parseInt(raw, 10) : 0;
}

export function incrementDailyCompletions(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `obhyash_daily_goal_${userId}_${today}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return next;
}
