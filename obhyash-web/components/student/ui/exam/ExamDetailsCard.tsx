import React from 'react';
import { ExamDetails } from '@/lib/types';

interface ExamDetailsCardProps {
  details: ExamDetails;
  totalQuestions: number;
  negativeMarking?: number;
}

const ExamDetailsCard: React.FC<ExamDetailsCardProps> = ({
  details,
  totalQuestions,
  negativeMarking = 0.25,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 md:p-6 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Column 1: Exam Basic Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
              বিষয় (Subject)
            </h3>
            <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
              {details.subjectLabel || details.subject}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
              পরীক্ষার ধরন (Exam Type)
            </h3>
            <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
              {details.examType || 'সাধারণ পরীক্ষা'}
            </p>
          </div>
        </div>

        {/* Column 2: Stats & Marking */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              মোট প্রশ্ন
            </span>
            <span className="text-base font-bold text-neutral-800 dark:text-white">
              {totalQuestions} টি
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              মোট নম্বর
            </span>
            <span className="text-base font-bold text-neutral-800 dark:text-white">
              {details.totalMarks || totalQuestions}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-medium text-red-500 dark:text-red-400">
              নেগেটিভ মার্কিং
            </span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
              -{negativeMarking} প্রতি ভুলে
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailsCard;
