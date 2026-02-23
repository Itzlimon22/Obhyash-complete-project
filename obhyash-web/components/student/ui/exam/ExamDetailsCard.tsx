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
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-6 overflow-hidden max-w-xl mx-auto">

      {/* Top accent stripe */}
      <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      {/* ── Subject Header ── */}
      <div className="
        flex items-center gap-3.5 px-5 py-4
        bg-gradient-to-br from-emerald-50/70 to-transparent
        dark:from-emerald-950/25 dark:to-transparent
        border-b border-neutral-100 dark:border-neutral-800
      ">
        {/* Icon blob */}
        <div className="
          w-11 h-11 rounded-2xl shrink-0
          bg-gradient-to-br from-emerald-500 to-teal-500
          flex items-center justify-center shadow-md
        ">
          <BookOpen size={20} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="
            text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5
            text-emerald-600 dark:text-emerald-500
          ">
            বিষয়
          </p>
          <h2 className="
            text-base font-extrabold leading-tight truncate
            text-neutral-900 dark:text-white
          ">
            {subjectName}
          </h2>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-3 gap-2.5 p-4">

        {/* Time */}
        <div className="
          flex flex-col gap-2 rounded-xl p-3
          bg-sky-50 dark:bg-sky-950/30
          border border-sky-100/80 dark:border-sky-900/40
        ">
          <div className="
            w-8 h-8 rounded-lg
            bg-sky-100 dark:bg-sky-900/50
            flex items-center justify-center
          ">
            <Clock size={15} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="
              text-[9px] font-bold uppercase tracking-widest mb-0.5
              text-sky-500 dark:text-sky-500
            ">
              সময়
            </p>
            <p className="
              text-lg font-extrabold leading-none
              text-sky-700 dark:text-sky-300
            ">
              {details.durationMinutes || 0}
            </p>
            <p className="
              text-[10px] font-semibold mt-0.5
              text-sky-500/80 dark:text-sky-500/80
            ">
              মিনিট
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="
          flex flex-col gap-2 rounded-xl p-3
          bg-emerald-50 dark:bg-emerald-950/30
          border border-emerald-100/80 dark:border-emerald-900/40
        ">
          <div className="
            w-8 h-8 rounded-lg
            bg-emerald-100 dark:bg-emerald-900/50
            flex items-center justify-center
          ">
            <Target size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="
              text-[9px] font-bold uppercase tracking-widest mb-0.5
              text-emerald-600 dark:text-emerald-500
            ">
              প্রশ্ন
            </p>
            <p className="
              text-lg font-extrabold leading-none
              text-emerald-700 dark:text-emerald-300
            ">
              {totalQuestions}
            </p>
            <p className="
              text-[10px] font-semibold mt-0.5
              text-emerald-500/80 dark:text-emerald-500/80
            ">
              টি
            </p>
          </div>
        </div>

        {/* Negative Marking */}
        <div className={`
          flex flex-col gap-2 rounded-xl p-3 border
          ${negativeMarking > 0
            ? 'bg-red-50 dark:bg-red-950/30 border-red-100/80 dark:border-red-900/40'
            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-700/40'
          }
        `}>
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${negativeMarking > 0
              ? 'bg-red-100 dark:bg-red-900/50'
              : 'bg-neutral-100 dark:bg-neutral-800'}
          `}>
            <AlertCircle
              size={15}
              className={
                negativeMarking > 0
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              }
            />
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
                <p className="
                  text-lg font-extrabold leading-none
                  text-red-700 dark:text-red-300
                ">
                  -{negativeMarking}
                </p>
                <p className="
                  text-[10px] font-semibold mt-0.5
                  text-red-500/80 dark:text-red-500/80
                ">
                  / ভুল
                </p>
              </>
            ) : (
              <>
                <p className="
                  text-base font-extrabold leading-none
                  text-neutral-500 dark:text-neutral-400
                ">
                  নেই
                </p>
                <p className="
                  text-[10px] font-semibold mt-0.5
                  text-neutral-400 dark:text-neutral-500
                ">
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