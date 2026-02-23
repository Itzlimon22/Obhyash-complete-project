import React from 'react';
import { ExamDetails } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { Clock, BookOpen, AlertCircle, Target } from 'lucide-react';

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
  const subjectName =
    details.subjectLabel || getSubjectDisplayName(details.subject);

  return (
    <div className="
      bg-white dark:bg-neutral-900
      rounded-xl mb-4
      border border-neutral-200/80 dark:border-neutral-800
      shadow-sm
      overflow-hidden
    ">

      {/* ── Subject Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="
          w-9 h-9 rounded-lg shrink-0
          bg-emerald-500
          flex items-center justify-center
        ">
          <BookOpen size={17} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">
            বিষয়
          </p>
          <p className="text-sm font-bold text-neutral-900 dark:text-white truncate leading-tight">
            {subjectName}
          </p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3 p-3">

        {/* Time */}
        <div className="
          flex flex-col gap-1.5 rounded-xl p-3
          bg-sky-50 dark:bg-sky-950/40
          border border-sky-100 dark:border-sky-900/50
        ">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center shrink-0">
            <Clock size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-500 mb-0.5">
              সময়
            </p>
            <p className="text-xl font-black leading-none text-sky-700 dark:text-sky-300">
              {details.durationMinutes || 0}
            </p>
            <p className="text-[10px] font-semibold text-sky-400 dark:text-sky-500 mt-0.5">
              মিনিট
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="
          flex flex-col gap-1.5 rounded-xl p-3
          bg-emerald-50 dark:bg-emerald-950/40
          border border-emerald-100 dark:border-emerald-900/50
        ">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <Target size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-0.5">
              প্রশ্ন
            </p>
            <p className="text-xl font-black leading-none text-emerald-700 dark:text-emerald-300">
              {totalQuestions}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 dark:text-emerald-500 mt-0.5">
              টি
            </p>
          </div>
        </div>

        {/* Negative Marking */}
        <div className={`
          flex flex-col gap-1.5 rounded-xl p-3 border
          ${negativeMarking > 0
            ? 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50'
            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-700/50'
          }
        `}>
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center shrink-0
            ${negativeMarking > 0
              ? 'bg-red-500'
              : 'bg-neutral-300 dark:bg-neutral-700'}
          `}>
            <AlertCircle size={14} className="text-white" />
          </div>
          <div>
            <p className={`
              text-[9px] font-bold uppercase tracking-widest mb-0.5
              ${negativeMarking > 0
                ? 'text-red-500 dark:text-red-500'
                : 'text-neutral-400 dark:text-neutral-500'}
            `}>
              নেগেটিভ
            </p>
            {negativeMarking > 0 ? (
              <>
                <p className="text-xl font-black leading-none text-red-700 dark:text-red-300">
                  -{negativeMarking}
                </p>
                <p className="text-[10px] font-semibold text-red-400 dark:text-red-500 mt-0.5">
                  / ভুল
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-black leading-none text-neutral-500 dark:text-neutral-400">
                  নেই
                </p>
                <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-0.5">
                  প্রযোজ্য নয়
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamDetailsCard;