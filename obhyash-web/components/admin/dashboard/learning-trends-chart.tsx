'use client';

import React from 'react';
import { TrendingUp, BookOpen, Clock, Activity, Sparkles } from 'lucide-react';

interface LearningTrendsProps {
  hourlyActivity: number[];
  topSubjects: Array<{ name: string; count: number }>;
  topChapters: Array<{ name: string; count: number }>;
  todayTotal: number;
}

export function LearningTrendsChart({
  hourlyActivity = [],
  topSubjects = [],
  topChapters = [],
  todayTotal = 0,
}: LearningTrendsProps) {
  const maxHourly = Math.max(1, ...hourlyActivity);
  const maxSubject = Math.max(1, ...(topSubjects.map((s) => s.count) || [1]));
  const maxChapter = Math.max(1, ...(topChapters.map((c) => c.count) || [1]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left Card: 24-Hour Real-Time Exam Activity ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  ২৪ ঘণ্টার শিক্ষার্থী এক্সাম অ্যাক্টিভিটি (Activity Pulse)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  আজকের সারা দিনের ঘণ্টাওয়ারী পরীক্ষা দেওয়ার হার
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
              {todayTotal} Exams Today
            </span>
          </div>
        </div>

        {/* 24-Hour Bar Chart */}
        <div className="pt-4">
          <div className="h-32 flex items-end gap-1 sm:gap-1.5 pt-4 pb-1 border-b border-neutral-200 dark:border-zinc-800">
            {hourlyActivity.map((count, hour) => {
              const heightPercent = Math.max(
                4,
                Math.round((count / maxHourly) * 100),
              );
              const isCurrentHour = new Date().getHours() === hour;

              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden group-hover:flex px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono z-20 whitespace-nowrap shadow-lg">
                    {hour}:00 - {count} exams
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentHour
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                        : count > 0
                          ? 'bg-blue-500/80 hover:bg-blue-500'
                          : 'bg-neutral-200 dark:bg-zinc-800/60'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-zinc-500 pt-2 font-mono">
            <span>12 AM (রাত ১২টা)</span>
            <span>6 AM</span>
            <span>12 PM (দুপুর ১২টা)</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>
      </div>

      {/* ── Right Card: Top Practiced Subjects & Chapters ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                সর্বাধিক পঠিত বিষয় ও অধ্যায় (Top Learning Pulse)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-zinc-400">
                আজ শিক্ষার্থীরা কোন অধ্যায়ের প্রশ্ন বেশি অনুশীলন করছে
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {topSubjects.length > 0 ? (
            topSubjects.map((sub, idx) => {
              const percent = Math.round((sub.count / maxSubject) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-800 dark:text-zinc-200 truncate pr-2">
                      {idx + 1}. {sub.name}
                    </span>
                    <span className="text-neutral-500 dark:text-zinc-400 font-mono text-[11px] shrink-0">
                      {sub.count} submissions
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400 dark:text-zinc-500">
              আজ এখনো কোনো বিষয়ভিত্তিক পরীক্ষা সম্পন্ন হয়নি।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
