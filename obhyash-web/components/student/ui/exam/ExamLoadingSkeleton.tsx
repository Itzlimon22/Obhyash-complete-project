'use client';

import React from 'react';

/**
 * Skeleton shown while exam questions are being fetched.
 * Mirrors the real exam layout: top bar → question card → 4 options → nav strip.
 */
const ExamLoadingSkeleton: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-3 py-4 space-y-4 animate-in fade-in duration-300 pb-24">
      {/* ── Top bar: timer + question counter ── */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3">
        <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
        <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
        <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
      </div>

      {/* ── Question card ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
        {/* Chapter / difficulty badge row */}
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
        </div>

        {/* Question text — 3 lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
          <div className="h-4 w-[92%] bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
          <div className="h-4 w-[70%] bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
        </div>

        {/* 4 option buttons */}
        <div className="space-y-3 pt-1">
          {['w-[85%]', 'w-[78%]', 'w-[90%]', 'w-[65%]'].map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800"
            >
              {/* Option letter circle */}
              <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div
                className={`h-4 ${w} bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation strip ── */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3">
        <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
        {/* Mini question dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-md bg-neutral-200 dark:bg-neutral-700 animate-pulse"
            />
          ))}
        </div>
        <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
      </div>

      {/* ── Loading label ── */}
      <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 animate-pulse">
        প্রশ্ন লোড হচ্ছে...
      </p>
    </div>
  );
};

export default ExamLoadingSkeleton;
