'use client';

import React from 'react';

interface SubjectStat {
  subject: string;
  examCount: number;
  accuracy: number;
  lastActivity: string;
}

interface SubjectsProgressSectionProps {
  subjectStats: SubjectStat[];
  onSubjectClick?: (subject: string) => void;
}

const SubjectsProgressSection: React.FC<SubjectsProgressSectionProps> = ({
  subjectStats,
  onSubjectClick,
}) => {
  if (subjectStats.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          বিষয়ভিত্তিক দক্ষতা
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          এখনও কোনো পরীক্ষা দেওয়া হয়নি। পরীক্ষা দিলে এখানে আপনার বিষয়ভিত্তিক
          দক্ষতা দেখা যাবে।
        </p>
      </div>
    );
  }

  // Get color based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-500';
    if (accuracy >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-100 dark:bg-emerald-900/20';
    if (accuracy >= 50) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getAccuracyTextColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5 sm:p-8">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
          বিষয়ভিত্তিক দক্ষতা
        </h3>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {subjectStats.map((stat) => (
          <div
            key={stat.subject}
            className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-bold text-neutral-900 dark:text-white text-base sm:text-lg">
                  {stat.subject}
                </span>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-neutral-200 dark:bg-neutral-700 rounded-md sm:rounded-lg">
                  {stat.examCount} পরীক্ষা
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg ${getAccuracyBgColor(stat.accuracy)} ${getAccuracyTextColor(stat.accuracy)}`}
              >
                {stat.accuracy}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${getAccuracyColor(stat.accuracy)} transition-all duration-700`}
                style={{ width: `${stat.accuracy}%` }}
              />
            </div>

            {/* Footer Button - Only for private profile */}
            {onSubjectClick && (
              <div className="flex justify-end">
                <button
                  onClick={() => onSubjectClick(stat.subject)}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  বিস্তারিত রিপোর্ট
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3 h-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectsProgressSection;
