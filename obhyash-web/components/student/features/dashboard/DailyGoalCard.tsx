'use client';

import React, { useMemo } from 'react';

interface DailyGoalCardProps {
  completedMCQsToday: number;
  mcqGoal?: number; // default 10
  onStartExam: () => void;
}

const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  completedMCQsToday,
  mcqGoal = 10,
  onStartExam,
}) => {
  const completed = Math.min(completedMCQsToday, mcqGoal);
  const pct = useMemo(
    () => Math.min(100, Math.round((completed / mcqGoal) * 100)),
    [completed, mcqGoal],
  );
  const done = completedMCQsToday >= mcqGoal;

  // SVG ring
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  // Milestone dots at 25%, 50%, 75%, 100%
  const milestones = [0.25, 0.5, 0.75, 1].map((f) => Math.round(f * mcqGoal));

  return (
    <div
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all ${
        done
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
      }`}
    >
      {/* Progress Ring */}
      <div className="flex-shrink-0 relative w-14 h-14">
        <svg
          viewBox="0 0 56 56"
          className="w-14 h-14 -rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth="5"
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
          {/* Progress */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke={done ? '#059669' : '#10b981'}
            strokeDasharray={`${dash} ${circ - dash}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <span className="text-xl">🔥</span>
          ) : (
            <span className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-200 leading-none tabular-nums">
              {completed}/{mcqGoal}
            </span>
          )}
        </div>
      </div>

      {/* Text + Progress Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            আজকের লক্ষ্য
          </p>
          <span
            className={`text-[10px] font-bold tabular-nums ${
              done
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {pct}%
          </span>
        </div>
        <p
          className={`text-sm font-extrabold leading-tight mb-2 ${
            done
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {done ? 'আজকের লক্ষ্য পূরণ! 🎉' : `${mcqGoal}টি MCQ সম্পন্ন করো`}
        </p>

        {/* Segmented bar */}
        <div className="relative h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              done
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
          {/* Milestone tick marks */}
          {milestones.slice(0, -1).map((m) => (
            <div
              key={m}
              className="absolute top-0 bottom-0 w-px bg-white/60 dark:bg-neutral-900/60"
              style={{ left: `${(m / mcqGoal) * 100}%` }}
            />
          ))}
        </div>

        {/* Milestone dots */}
        <div className="flex justify-between mt-1.5">
          {milestones.map((m) => {
            const reached = completed >= m;
            return (
              <div key={m} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    reached
                      ? 'bg-emerald-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
                <span
                  className={`text-[9px] font-bold tabular-nums ${
                    reached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                >
                  {m}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      {!done && (
        <button
          onClick={onStartExam}
          className="flex-shrink-0 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          শুরু করো
        </button>
      )}
    </div>
  );
};

export default DailyGoalCard;

// ─── Session tracking (legacy – kept for backward compat) ────────────────────
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

// ─── MCQ tracking ────────────────────────────────────────────────────────────
export function getDailyMCQs(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(`obhyash_daily_mcqs_${userId}_${today}`);
  return raw ? parseInt(raw, 10) : 0;
}

export function addDailyMCQs(userId: string, count: number): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `obhyash_daily_mcqs_${userId}_${today}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + count;
  localStorage.setItem(key, String(next));
  return next;
}
