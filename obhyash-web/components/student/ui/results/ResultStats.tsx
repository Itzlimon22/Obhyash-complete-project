import React from 'react';

interface ResultStatsProps {
  percentage: number;
  finalScore: number;
  totalPoints: number;
  timeTaken: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  negativeMarking: number;
  negativeMarksDeduction: number;
}

const ResultStats: React.FC<ResultStatsProps> = ({
  percentage,
  finalScore,
  totalPoints,
  timeTaken,
  totalQuestions,
  correctCount,
  wrongCount,
  skippedCount,
  negativeMarking,
  negativeMarksDeduction,
}) => {
  // Helper to format time seconds into mm:ss format
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      {/* Stats Grid - 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
        {/* Accuracy */}
        <div className="bg-white dark:bg-neutral-900 p-3 md:p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={283}
                strokeDashoffset={283 - (283 * percentage) / 100}
                className={`transition-all duration-1000 ease-out ${percentage >= 70 ? 'text-emerald-500' : percentage >= 40 ? 'text-red-500' : 'text-red-500'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm md:text-2xl font-bold text-neutral-800 dark:text-white">
                {percentage}%
              </span>
            </div>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-xs md:text-base">
            সঠিকতা
          </div>
        </div>

        {/* Points */}
        <div className="bg-white dark:bg-neutral-900 p-3 md:p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 text-red-600 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 md:w-7 md:h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002"
              />
            </svg>
          </div>
          <div className="text-xl md:text-3xl font-bold text-neutral-800 dark:text-white mb-0.5">
            {finalScore.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            / {totalPoints}
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-xs md:text-base mt-1">
            প্রাপ্ত নম্বর
          </div>
        </div>

        {/* Time */}
        <div className="bg-white dark:bg-neutral-900 p-3 md:p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors col-span-2 md:col-span-1">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 md:w-7 md:h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white mb-1 text-center">
            {formatDuration(timeTaken)}
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-xs md:text-base">
            সময় লেগেছে
          </div>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <div className="mb-8 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
          <h3 className="text-sm md:text-lg font-bold text-neutral-800 dark:text-white">
            ফলাফল বিস্তারিত
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800 text-xs md:text-sm">
          {/* Left Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                মোট প্রশ্ন
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {totalQuestions}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                উত্তর দেওয়া হয়েছে
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {correctCount + wrongCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                উত্তর দেওয়া হয়নি
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {skippedCount}
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                সঠিক উত্তর
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-red-600 dark:text-red-400">
                ভুল উত্তর
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {wrongCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 bg-red-50/50 dark:bg-red-900/10">
              <span className="font-medium text-red-700 dark:text-red-300">
                নেগেটিভ মার্কিং ({negativeMarking}x)
              </span>
              <span className="font-bold text-red-700 dark:text-red-300">
                -{negativeMarksDeduction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Score Footer */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-sm md:text-base text-neutral-900 dark:text-white">
            মোট প্রাপ্ত নম্বর
          </span>
          <span className="font-bold text-sm md:text-base text-emerald-600 dark:text-emerald-400">
            {finalScore.toFixed(2)} / {totalPoints}
          </span>
        </div>
      </div>
    </>
  );
};

export default ResultStats;
