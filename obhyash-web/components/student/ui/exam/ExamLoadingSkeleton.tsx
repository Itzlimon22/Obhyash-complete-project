'use client';

import React from 'react';

/**
 * Enhanced Skeleton shown while exam questions are being fetched.
 * Accurately mirrors the Flutter app layout and ExamRunner UI:
 * - Top header (palette pill + timer capsule + icons)
 * - Fetching status banner
 * - Question cards with circular ID, question stem, and 4 option rows
 * - Bottom submit footer
 */
interface ExamLoadingSkeletonProps {
  hideHeader?: boolean;
}

export const ExamLoadingSkeleton: React.FC<ExamLoadingSkeletonProps> = ({
  hideHeader = false,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-1.5 sm:px-4 py-2 sm:py-5 space-y-3 sm:space-y-4 pb-28 font-['HindSiliguri',sans-serif] animate-in fade-in duration-300">
      {/* ── Top Sticky Header Skeleton ── */}
      {!hideHeader && (
        <div className="rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 p-2.5 sm:p-3 flex items-center justify-between shadow-xs">
          {/* Answered / Total Pill */}
          <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />

          {/* Timer Capsule */}
          <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
      )}

      {/* ── Dynamic Fetching Banner ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#121215] border border-emerald-500/20 dark:border-emerald-500/20 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
          <div className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-tight">
            প্রশ্নপত্র প্রস্তুত হচ্ছে...
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
            সিলেবাস ও মানবণ্টন অনুযায়ী প্রশ্ন সাজানো হচ্ছে
          </p>
        </div>
      </div>

      {/* ── Question Card Skeleton 1 ── */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-5 shadow-xs space-y-3.5">
        {/* Header Row: Circle ID + info */}
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
              <div className="h-2.5 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>

        {/* Question Text */}
        <div className="space-y-2 py-1">
          <div className="h-4 w-[95%] bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
          <div className="h-4 w-[75%] bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
        </div>

        {/* 4 Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
          {['w-[65%]', 'w-[80%]', 'w-[70%]', 'w-[60%]'].map((width, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 animate-pulse" />
                <div className={`h-3.5 ${width} bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse`} />
              </div>
              <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Question Card Skeleton 2 ── */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-5 shadow-xs space-y-3.5 opacity-70">
        {/* Header Row: Circle ID + info */}
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
              <div className="h-2.5 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>

        {/* Question Text */}
        <div className="space-y-2 py-1">
          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
          <div className="h-4 w-[60%] bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
        </div>

        {/* 4 Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
          {['w-[75%]', 'w-[55%]', 'w-[85%]', 'w-[65%]'].map((width, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0 animate-pulse" />
                <div className={`h-3.5 ${width} bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse`} />
              </div>
              <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Fixed Bottom Footer Skeleton ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#27272A] px-2.5 py-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-center shadow-lg">
        <div className="max-w-3xl w-full flex justify-center">
          <div className="w-full sm:w-64 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ExamLoadingSkeleton;
