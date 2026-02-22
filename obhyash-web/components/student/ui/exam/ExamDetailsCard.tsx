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
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 md:p-8 mb-8 shadow-sm relative overflow-hidden">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 opacity-80" />

      <div className="mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/60 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <BookOpen
            className="text-emerald-600 dark:text-emerald-400"
            size={24}
          />
        </div>
        <div>
          <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">
            বিষয় (Subject)
          </h2>
          <h3 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            {details.subjectLabel || getSubjectDisplayName(details.subject)}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-12 md:gap-y-8">
        {/* Basic Info */}
        <DetailIconItem
          icon={Layers}
          label="পরীক্ষার ধরন (Exam Type)"
          value={details.examType || 'সাধারণ পরীক্ষা'}
          iconBgClass="bg-blue-50 dark:bg-blue-900/20"
          iconColorClass="text-blue-600 dark:text-blue-400"
        />

        <DetailIconItem
          icon={Clock}
          label="সময় (Duration)"
          value={`${details.durationMinutes || 0} মিনিট`}
          iconBgClass="bg-amber-50 dark:bg-amber-900/20"
          iconColorClass="text-amber-600 dark:text-amber-400"
        />

        <DetailIconItem
          icon={Target}
          label="প্রশ্ন ও নম্বর (Questions & Marks)"
          value={
            <div className="flex flex-col">
              <span>{totalQuestions} টি প্রশ্ন</span>
              <span className="text-sm font-semibold text-neutral-500">
                মোট {details.totalMarks || totalQuestions} নম্বর
              </span>
            </div>
          }
          iconBgClass="bg-emerald-50 dark:bg-emerald-900/20"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
        />

        {/* Syllabus / Optional Content */}
        {details.chapters && (
          <div className="sm:col-span-2 lg:col-span-1">
            <DetailIconItem
              icon={BookMarked}
              label="অধ্যায় (Chapters)"
              value={
                <span className="line-clamp-2" title={details.chapters}>
                  {details.chapters}
                </span>
              }
              iconBgClass="bg-indigo-50 dark:bg-indigo-900/20"
              iconColorClass="text-indigo-600 dark:text-indigo-400"
            />
          </div>
        )}

        {details.topics && (
          <div className="sm:col-span-2 lg:col-span-2">
            <DetailIconItem
              icon={ListTodo}
              label="টপিক (Topics)"
              value={
                <span className="line-clamp-2" title={details.topics}>
                  {details.topics}
                </span>
              }
              iconBgClass="bg-purple-50 dark:bg-purple-900/20"
              iconColorClass="text-purple-600 dark:text-purple-400"
            />
          </div>
        )}

        {/* Penalty */}
        {negativeMarking > 0 && (
          <div className="sm:col-span-2 lg:col-span-3 mt-2">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-bold">
                নেগেটিভ মার্কিং (Negative Marking):
              </span>
              <span className="text-sm font-semibold">
                -{negativeMarking} প্রতি ভুলে
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailsCard;
