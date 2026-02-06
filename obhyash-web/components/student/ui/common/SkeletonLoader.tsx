import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-fade-in">
      {/* Header Skeleton (Exam Info) */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2 w-1/2">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
      </div>

      {/* Question Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-neutral-200 dark:border-neutral-800 mb-8 overflow-hidden"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="flex items-center p-3 rounded-xl border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse mr-4"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
