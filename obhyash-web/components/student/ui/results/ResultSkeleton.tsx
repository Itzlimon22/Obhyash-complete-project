import React from 'react';

/** Reusable shimmer bar */
const Bar = ({ className }: { className: string }) => (
  <div
    className={`bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse ${className}`}
  />
);

const ResultSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 pt-4 pb-20 animate-in fade-in duration-300">
      {/* ── Header: title + subtitle + download buttons ── */}
      <div className="text-center mb-6 mt-2 flex flex-col items-center gap-3">
        <Bar className="h-8 w-48" />
        <Bar className="h-4 w-72 max-w-full" />
        <div className="flex flex-col items-center gap-2 mt-2 w-full sm:max-w-sm">
          <Bar className="h-10 w-full rounded-lg" />
          <Bar className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* ── Exam details strip ── */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 border-y sm:border border-neutral-100 dark:border-neutral-800 py-2 mb-6 -mx-2 sm:mx-0 px-4 sm:rounded-xl flex flex-wrap justify-center gap-x-6 gap-y-2">
        {[80, 64, 72].map((w, i) => (
          <Bar
            key={i}
            className={`h-4 w-${w === 80 ? '[80px]' : w === 64 ? '[64px]' : '[72px]'}`}
          />
        ))}
      </div>

      {/* ── Stats grid: 3 columns matching real layout ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 mb-8">
        {/* Accuracy — circular progress placeholder */}
        <div className="bg-white dark:bg-neutral-900 p-2.5 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <Bar className="h-4 w-14 sm:w-20" />
        </div>
        {/* Score */}
        <div className="bg-white dark:bg-neutral-900 p-2.5 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <Bar className="h-6 w-16 sm:w-24" />
          <Bar className="h-4 w-14 sm:w-20" />
        </div>
        {/* Time */}
        <div className="bg-white dark:bg-neutral-900 p-2.5 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <Bar className="h-5 w-20 sm:w-32" />
          <Bar className="h-4 w-14 sm:w-20" />
        </div>
      </div>

      {/* ── Summary table ── */}
      <div className="mb-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
          <Bar className="h-6 w-28" />
        </div>
        {/* 2-column rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800 text-sm">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-4 py-2.5"
              >
                <Bar className="h-4 w-24" />
                <Bar className="h-4 w-10" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-4 py-2.5"
              >
                <Bar className="h-4 w-24" />
                <Bar className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Review section header + filter tabs ── */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Bar className="h-7 w-40" />
          <div className="flex gap-2">
            <Bar className="h-8 w-16 rounded-full" />
            <Bar className="h-8 w-20 rounded-full" />
            <Bar className="h-8 w-16 rounded-full" />
          </div>
        </div>

        {/* 3 question card skeletons */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 space-y-4"
            >
              {/* Question number + badges */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse flex-shrink-0" />
                <div className="flex gap-2">
                  <Bar className="h-5 w-16 rounded-full" />
                  <Bar className="h-5 w-12 rounded-full" />
                </div>
              </div>
              {/* Question text */}
              <div className="space-y-2">
                <Bar className="h-4 w-full" />
                <Bar className="h-4 w-[80%]" />
              </div>
              {/* 4 option rows */}
              {['w-[82%]', 'w-[70%]', 'w-[88%]', 'w-[60%]'].map((w, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800"
                >
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                  <Bar className={`h-4 ${w}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultSkeleton;
