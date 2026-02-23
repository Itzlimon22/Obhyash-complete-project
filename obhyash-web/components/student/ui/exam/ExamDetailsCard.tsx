import React from 'react';
import { ExamDetails } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import {
  Clock,
  BookOpen,
  AlertCircle,
  Target,
  Layers,
  BookMarked,
  ListTodo,
} from 'lucide-react';

interface ExamDetailsCardProps {
  details: ExamDetails;
  totalQuestions: number;
  negativeMarking?: number;
}

const DetailIconItem = ({
  icon: Icon,
  label,
  value,
  valueClass = 'text-neutral-800 dark:text-neutral-100',
  iconBgClass = 'bg-neutral-100 dark:bg-neutral-800',
  iconColorClass = 'text-neutral-600 dark:text-neutral-400',
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  iconBgClass?: string;
  iconColorClass?: string;
}) => (
  <div className="flex items-start gap-4">
    <div
      className={`mt-0.5 w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0`}
    >
      <Icon size={20} className={iconColorClass} />
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">
        {label}
      </h3>
      <div className={`text-base font-bold leading-tight ${valueClass}`}>
        {value}
      </div>
    </div>
  </div>
);


const ExamDetailsCard: React.FC<ExamDetailsCardProps> = ({
  details,
  totalQuestions,
  negativeMarking = 0.25,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 md:p-6 mb-6 shadow-sm relative overflow-hidden max-w-xl mx-auto">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-500 opacity-80" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        {/* Subject */}
        <div className="flex items-center gap-2 py-2">
          <BookOpen className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">বিষয়</span>
        </div>
        <div className="text-sm font-bold text-neutral-900 dark:text-white truncate py-2">
          {details.subjectLabel || getSubjectDisplayName(details.subject)}
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 py-2">
          <Clock className="text-red-600 dark:text-red-400 w-5 h-5" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">সময়</span>
        </div>
        <div className="text-sm font-bold text-neutral-900 dark:text-white py-2">
          {details.durationMinutes || 0} মিনিট
        </div>

        {/* Total Questions */}
        <div className="flex items-center gap-2 py-2">
          <Target className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">মোট প্রশ্ন</span>
        </div>
        <div className="text-sm font-bold text-neutral-900 dark:text-white py-2">
          {totalQuestions} টি
        </div>

        {/* Negative Marking */}
        <div className="flex items-center gap-2 py-2">
          <AlertCircle className="text-red-600 dark:text-red-400 w-5 h-5" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">নেগেটিভ মার্ক</span>
        </div>
        <div className="text-sm font-bold text-neutral-900 dark:text-white py-2">
          {negativeMarking > 0 ? `-${negativeMarking} প্রতি ভুলে` : 'প্রযোজ্য নয়'}
        </div>
      </div>
    </div>
  );
};

export default ExamDetailsCard;
