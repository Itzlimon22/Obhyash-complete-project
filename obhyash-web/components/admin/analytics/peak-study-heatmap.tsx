'use client';

import React from 'react';
import { Clock, Zap, Sun, Moon } from 'lucide-react';

interface PeakStudyHeatmapProps {
  hourlyActivity: number[];
}

export function PeakStudyHeatmap({
  hourlyActivity = [],
}: PeakStudyHeatmapProps) {
  const maxActivity = Math.max(1, ...hourlyActivity);

  // Find peak hour
  let peakHour = 0;
  let peakCount = 0;
  hourlyActivity.forEach((count, h) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = h;
    }
  });

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
              পিক স্টাডি আওয়ার্স ও পরীক্ষার ঘনত্ব (Peak Study Density)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              দিনের কোন সময়ে শিক্ষার্থীরা সবচেয়ে বেশি সক্রিয় থাকে
            </p>
          </div>
        </div>

        {peakCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900">
            <Zap size={14} className="text-amber-500 animate-pulse" />
            <span>
              পিক টাইম: {formatHour(peakHour)} ({peakCount} সাবমিশন)
            </span>
          </div>
        )}
      </div>

      {/* 24 Hour Density Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-12 xl:grid-cols-24 gap-1.5 pt-2">
        {hourlyActivity.map((count, hour) => {
          const intensity = Math.round((count / maxActivity) * 100);
          const isPeak = hour === peakHour && count > 0;

          return (
            <div
              key={hour}
              className="flex flex-col items-center gap-1 group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-8 hidden group-hover:flex px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono z-30 whitespace-nowrap shadow-lg">
                {formatHour(hour)}: {count} exams
              </div>

              <div
                className={`w-full h-12 rounded-lg border transition-all duration-200 flex items-center justify-center text-[10px] font-mono font-bold ${
                  isPeak
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105 ring-2 ring-amber-400/50'
                    : count > 0
                      ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-600'
                      : 'bg-neutral-100 dark:bg-zinc-850/60 text-neutral-400 border-neutral-200/60 dark:border-zinc-800'
                }`}
              >
                {count > 0 ? count : ''}
              </div>

              <span className="text-[9px] text-neutral-400 dark:text-zinc-500 font-mono">
                {hour}h
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 pt-2 border-t border-neutral-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-indigo-400" />
          <span>রাত (১২টা - ৬টা)</span>
        </div>
        <div className="flex items-center gap-2">
          <Sun size={14} className="text-amber-400" />
          <span>সকাল ও দুপুর (৭টা - ৪টা)</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
          <Zap size={14} className="text-amber-500" />
          <span>সন্ধ্যা ও প্রাইম স্টাডি (৫টা - ১১টা)</span>
        </div>
      </div>
    </div>
  );
}
