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
        bg-white dark:bg-neutral-900 rounded-xl mb-4 scroll-mt-24 transition-all duration-300
        border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md
        px-3 py-2 md:px-4 md:py-3
        ${isFlagged ? 'ring-2 ring-red-400/50' : isAnswered ? 'ring-1 ring-emerald-500/30' : ''}
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      {/* Header / Meta + Question Row */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          {serialNumber && (
            <span
              className="font-serif-exam text-base md:text-lg text-neutral-900 dark:text-neutral-100"
              style={{ lineHeight: 'inherit' }}
            >
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}
          <span
            className="font-serif-exam text-base md:text-lg text-neutral-900 dark:text-neutral-100"
            style={{ lineHeight: 'inherit' }}
          >
            <LatexText text={question.question} />
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 min-h-[24px]">
          {/* Institute/Year tags left */}
          <div className="flex items-center gap-2 flex-wrap max-w-[60%]">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          {/* Bookmark/Report right, no container */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              animate={{
                scale: isBookmarked ? 1.1 : 1,
                color: isBookmarked ? '#db2777' : '#9ca3af',
              }}
              onClick={onToggleBookmark}
              disabled={!onToggleBookmark}
              className={`transition-colors ${!onToggleBookmark ? 'opacity-30 cursor-default' : ''}`}
              title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
              style={{ padding: 0, background: 'none', border: 'none' }}
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
            <button
              onClick={onReport}
              className="transition-colors text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
              title="Report Issue"
              style={{ padding: 0, background: 'none', border: 'none' }}
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
      </div>

      {/* Options Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 relative mt-2 ${readOnly || isOmrMode ? 'pointer-events-none' : ''}`}
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
                group relative flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 h-full
                ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${bgClass}
              `}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() =>
                  !isAnswered && !isOmrMode && !readOnly && onSelectOption(idx)
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
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-800 dark:bg-emerald-900 text-white rounded-xl shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all active:scale-[0.99]"
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
                ? 'grid-rows-[1fr] opacity-100 mt-2'
                : 'grid-rows-[0fr] opacity-0 mt-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="p-4 md:p-5 bg-[#F8FAF9] dark:bg-emerald-950/20 border-l-4 border-emerald-800 dark:border-emerald-600 rounded-r-xl shadow-sm relative">
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
  );
}
