import React, { useState } from 'react';
import { Question } from '@/lib/types';
import LatexText from '../common/LatexText';
import { toBengaliNumeral } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex: number | undefined;
  /** Exam review flag — marks a question for review during the exam. Local only. */
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void;
  onReport: () => void;
  isOmrMode?: boolean;
  // New props for History/Review mode
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
  /** DB-synced bookmark state — persists across sessions */
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

export default function QuestionCard({
  question,
  serialNumber,
  selectedOptionIndex,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  onReport,
  isOmrMode = false,
  showFeedback = false,
  readOnly = false,
  showAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
}: QuestionCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;
  const [isExpanded, setIsExpanded] = useState(false);

  const tags: string[] = [];
  const len = Math.max(
    question.institutes?.length || 0,
    question.years?.length || 0,
  );
  for (let i = 0; i < len; i++) {
    const inst = question.institutes?.[i] || '';
    const yr = question.years?.[i] || '';
    const combined = `${inst} ${yr}`.trim();
    if (combined) tags.push(combined);
  }
  if (tags.length === 0 && (question.institute || question.year)) {
    tags.push(`${question.institute || ''} ${question.year || ''}`.trim());
  }
  const tagsString = tags.join(', ');

  return (
    <div
      id={`question-${question.id}`}
      className={`
        bg-white dark:bg-neutral-900 rounded-2xl mb-5 scroll-mt-32 transition-all duration-300
        border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md
        ${
          isFlagged
            ? 'ring-2 ring-red-400/50'
            : isAnswered
              ? 'ring-1 ring-emerald-500/30'
              : ''
        }
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      {/* Header / Meta */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {serialNumber
              ? `প্রশ্ন ${toBengaliNumeral(serialNumber)}`
              : `Question ${question.id}`}
          </span>
          {isFlagged && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              Marked
            </span>
          )}
          {showFeedback &&
            (isAnswered ? (
              selectedOptionIndex === question.correctAnswerIndex ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  সঠিক
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  ভুল
                </span>
              )
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                উত্তর নেই
              </span>
            ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 mr-2">
            {question.points} Marks
          </span>
        </div>
      </div>

      <div className="px-5 pb-5">
        {/* Question Text */}
        <h3 className="text-neutral-900 dark:text-neutral-100 font-serif-exam text-lg md:text-xl leading-relaxed mb-4">
          <LatexText text={question.question} />
        </h3>

        {/* Extras Row (Institute/Year + Action Icons) */}
        <div className="flex items-center justify-end mb-4 relative">
          {tags.length > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 max-w-[60%] flex-wrap overflow-hidden">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[#8be8e5] dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold rounded-full whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-full px-1 py-1">
            {/* Read/Mark tag (Visual matching from uploaded image) */}
            {isFlagged && (
              <span className="px-3 py-1 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                দাগানো
              </span>
            )}

            {/* Bookmark Button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              animate={{
                scale: isBookmarked ? 1.1 : 1,
                color: isBookmarked ? '#db2777' : '#9ca3af', // Pink-red for active bookmark like the image
              }}
              onClick={onToggleBookmark}
              disabled={!onToggleBookmark}
              className={`p-1.5 rounded-full transition-colors ${
                isBookmarked
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
              } ${!onToggleBookmark ? 'opacity-30 cursor-default' : ''}`}
              title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
                />
              </svg>
            </motion.button>

            {/* Report Button */}
            <button
              onClick={onReport}
              className="p-1.5 rounded-full transition-colors text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
              title="Report Issue"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative ${readOnly || isOmrMode ? 'pointer-events-none' : ''}`}
        >
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === question.correctAnswerIndex;
            const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

            // Logic for Feedback Color
            let bgClass =
              'bg-[#f4f4f4] hover:bg-[#ebebeb] dark:bg-neutral-800 dark:hover:bg-neutral-700';
            let iconText = banglaIndex;
            let iconClass =
              'border-2 border-neutral-400 text-neutral-600 dark:border-neutral-500 dark:text-neutral-400';
            let textClass = 'text-neutral-800 dark:text-neutral-200';

            if (showFeedback) {
              if (isCorrect) {
                bgClass = 'bg-emerald-100/60 dark:bg-emerald-900/30';
                iconClass = 'bg-emerald-500 text-white border-none';
                iconText = '✓';
                textClass = 'text-emerald-900 dark:text-emerald-100 font-bold';
              } else if (isSelected) {
                bgClass = 'bg-red-100/60 dark:bg-red-900/30';
                iconClass = 'bg-red-500 text-white border-none';
                iconText = '✕';
                textClass = 'text-red-900 dark:text-red-100 font-bold';
              } else {
                // Non-selected wrong options
                bgClass = 'bg-[#f4f4f4] dark:bg-neutral-800 opacity-60';
              }
            } else if (showAnswer && isCorrect) {
              // Show correct answer in Review/Practice mode without user selection
              bgClass = 'bg-emerald-100/60 dark:bg-emerald-900/30';
              iconClass = 'bg-emerald-500 text-white border-none';
              iconText = '✓';
              textClass = 'text-emerald-900 dark:text-emerald-100 font-bold';
            } else if (isSelected) {
              bgClass =
                'bg-emerald-100/60 dark:bg-emerald-900/30 ring-1 ring-emerald-400 dark:ring-emerald-500 inset-0';
              iconClass = 'bg-emerald-500 text-white border-none';
              iconText = '✓';
              textClass = 'text-emerald-900 dark:text-emerald-100 font-bold';
            }

            return (
              <label
                key={idx}
                className={`
                  group relative flex items-center gap-3.5 px-4 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 h-full
                  ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${bgClass}
                `}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={isSelected}
                  onChange={() =>
                    !isAnswered &&
                    !isOmrMode &&
                    !readOnly &&
                    onSelectOption(idx)
                  }
                  disabled={isAnswered || isOmrMode || readOnly}
                  className="sr-only"
                />

                {/* Custom Radio Circle */}
                <div
                  className={` w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${iconClass} `}
                >
                  <span className="text-xs font-bold">{iconText}</span>
                </div>

                {/* Option Text */}
                <div
                  className={`text-base font-medium leading-[1.6] select-none ${textClass}`}
                >
                  <LatexText text={option} />
                </div>
              </label>
            );
          })}
        </div>

        {/* Explanation Section (Only for Review) */}
        {showFeedback && question.explanation && (
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-800 dark:bg-emerald-900 text-white rounded-xl shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span className="font-bold text-sm tracking-wider">
                  ব্যাখ্যা (Explanation)
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-3'
                  : 'grid-rows-[0fr] opacity-0 mt-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-5 md:p-6 bg-[#F8FAF9] dark:bg-emerald-950/20 border-l-4 border-emerald-800 dark:border-emerald-600 rounded-r-2xl shadow-sm relative">
                  {/* Decorative faint icon in background */}
                  <div className="absolute top-4 right-4 opacity-5 dark:opacity-10 pointer-events-none text-emerald-900 dark:text-emerald-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <div className="text-[15px] md:text-base text-neutral-800 dark:text-neutral-200 leading-[1.8] font-serif-exam relative z-10">
                    <LatexText text={question.explanation} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
