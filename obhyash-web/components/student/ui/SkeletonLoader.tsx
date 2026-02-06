import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-fade-in">
      {/* Header Skeleton */}
      <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 mb-8 animate-pulse"></div>

      {/* Question Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 mb-8 shadow-sm"
        >
          <div className="flex justify-between mb-4">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 animate-pulse"></div>
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-8 animate-pulse"></div>
          </div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mb-6 animate-pulse"></div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full animate-pulse border border-neutral-200 dark:border-neutral-700/50"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
