import React from 'react';

const ResultSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-8 animate-fade-in pb-20">
      {/* Result Header Skeleton */}
      <div className="text-center mb-8 mt-8 flex flex-col items-center">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-64 mb-4 animate-pulse"></div>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-96 max-w-full animate-pulse"></div>

        <div className="flex gap-3 mt-6">
          <div className="h-10 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
          <div className="h-10 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center h-48 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-50 dark:via-neutral-800/50 to-transparent -tranneutral-x-full animate-[shimmer_1.5s_infinite]"></div>
            <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-4 animate-pulse"></div>
            <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Summary Table Skeleton */}
      <div className="mb-12 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="h-14 bg-neutral-100 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-6">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review List Skeleton */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-4 animate-pulse"></div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-50 dark:via-neutral-800/50 to-transparent -tranneutral-x-full animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex justify-between mb-6">
              <div className="flex gap-4 items-center">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded mb-4 animate-pulse"></div>
              <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-6 animate-pulse"></div>
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-12 w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultSkeleton;
