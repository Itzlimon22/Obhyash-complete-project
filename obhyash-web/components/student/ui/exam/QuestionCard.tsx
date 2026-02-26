import React from 'react';
import { Question } from '@/lib/types';
import LatexText from '../common/LatexText';
import { toBengaliNumeral } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex: number | undefined;
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void;
  onReport: () => void;
  isOmrMode?: boolean;
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
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
  onReport,
  isOmrMode = false,
  showFeedback = false,
  readOnly = false,
  showAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
}: QuestionCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;

  // Build institute/year tags
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

  return (
    <div
      id={`question-${question.id}`}
      className={`
        relative mb-4 scroll-mt-24
        bg-white dark:bg-[#1a1a1a]
        border border-[#e5e5e5] dark:border-[#2a2a2a]
        rounded-lg overflow-hidden
        shadow-[0_1px_3px_rgba(0,0,0,0.07)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]
        transition-shadow duration-200
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]
        ${isFlagged ? 'ring-2 ring-orange-300/50' : ''}
      `}
    >
      {/* ── Top section ── */}
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-4">
        {/* Question text row */}
        <div className="flex items-start gap-2 mb-3">
          {/* Serial number */}
          {serialNumber !== undefined && (
            <span className="shrink-0 font-semibold text-[15px] md:text-base text-neutral-800 dark:text-neutral-200 leading-[1.7]">
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}

          {/* Question text */}
          <div className="min-w-0 text-[15px] md:text-base text-neutral-900 dark:text-neutral-100 leading-[1.75] font-serif-exam">
            <LatexText text={question.question} />
          </div>
        </div>

        {/* Tags + action buttons row */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Institute/year tags */}
          {tags.map((tag, i) => (
            <span
              key={i}
              className="
                inline-flex items-center text-[11px] font-semibold
                px-2.5 py-0.5 rounded-sm
                bg-[#e8f4f0] text-[#1a7a5a]
                dark:bg-[#0d3326] dark:text-[#4ecca3]
                tracking-wide
              "
            >
              {tag}
            </span>
          ))}

          {/* Bookmark button */}
          <motion.button
            whileTap={{ scale: 0.86 }}
            whileHover={{ scale: 1.08 }}
            onClick={onToggleBookmark}
            disabled={!onToggleBookmark}
            title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
            className={`
              rounded p-1 transition-colors
              ${!onToggleBookmark ? 'opacity-30 cursor-default' : 'cursor-pointer'}
              ${
                isBookmarked
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
              }
            `}
            style={{ border: 'none', background: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="w-[17px] h-[17px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
              />
            </svg>
          </motion.button>

          {/* Report button */}
          <button
            onClick={onReport}
            title="Report Issue"
            className="
              rounded p-1 transition-colors
              text-neutral-400 hover:text-red-500
              dark:text-neutral-500 dark:hover:text-red-400
            "
            style={{ border: 'none', background: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-[17px] h-[17px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Options grid ── */}
      <div
        className={`
          px-4 pb-4 md:px-5 md:pb-4
          grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2
          ${readOnly || isOmrMode ? 'pointer-events-none' : ''}
        `}
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === question.correctAnswerIndex;
          const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

          let iconText = banglaIndex;
          let iconBg =
            'bg-transparent border border-neutral-400 dark:border-neutral-500';
          let iconFg = 'text-neutral-500 dark:text-neutral-400';
          let boxClass =
            'bg-[#f4f4f5] dark:bg-[#252525] border border-transparent hover:bg-[#eaeaeb] dark:hover:bg-[#2e2e2e]';
          let textClass = 'text-neutral-800 dark:text-neutral-200';

          if (showFeedback) {
            if (isCorrect) {
              boxClass =
                'bg-[#ecfdf5] dark:bg-[#0d3326] border border-emerald-300 dark:border-emerald-700';
              iconBg = 'bg-emerald-500 border-emerald-500';
              iconFg = 'text-white';
              textClass = 'text-emerald-900 dark:text-emerald-100 font-medium';
              iconText = '✓';
            } else if (isSelected) {
              boxClass =
                'bg-[#fff1f2] dark:bg-[#3a0d13] border border-red-300 dark:border-red-800';
              iconBg = 'bg-red-500 border-red-500';
              iconFg = 'text-white';
              textClass = 'text-red-800 dark:text-red-200 font-medium';
              iconText = '✕';
            } else {
              boxClass =
                'bg-[#f4f4f5] dark:bg-[#252525] border border-transparent opacity-55';
            }
          } else if (showAnswer && isCorrect) {
            boxClass =
              'bg-[#ecfdf5] dark:bg-[#0d3326] border border-emerald-300 dark:border-emerald-700';
            iconBg = 'bg-emerald-500 border-emerald-500';
            iconFg = 'text-white';
            textClass = 'text-emerald-900 dark:text-emerald-100 font-medium';
            iconText = '✓';
          } else if (isSelected) {
            boxClass =
              'bg-[#f0f0f0] dark:bg-[#303030] border border-neutral-400 dark:border-neutral-500';
            iconBg =
              'bg-neutral-800 border-neutral-800 dark:bg-neutral-200 dark:border-neutral-200';
            iconFg = 'text-white dark:text-neutral-900';
            textClass = 'text-neutral-900 dark:text-white font-medium';
          }

          return (
            <label
              key={idx}
              className={`
                group relative flex items-center gap-2.5
                px-3 py-2 rounded-md
                transition-colors duration-150
                ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${boxClass}
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

              {/* Circle badge */}
              <div
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center
                  shrink-0 transition-all duration-150
                  ${iconBg}
                `}
              >
                <span
                  className={`text-[10px] font-bold leading-none ${iconFg}`}
                >
                  {iconText}
                </span>
              </div>

              {/* Option text */}
              <div
                className={`text-sm md:text-[14px] leading-[1.55] select-none font-serif-exam ${textClass}`}
              >
                <LatexText text={option} />
              </div>
            </label>
          );
        })}
      </div>

      {/* ── Explanation ── */}
      {showFeedback && question.explanation && (
        <div className="mx-4 mb-4 md:mx-5 md:mb-4 animate-fade-in">
          <div
            className="
              p-4 md:p-5 rounded-md
              bg-emerald-50 dark:bg-[#0d2a1e]
              border border-emerald-200 dark:border-emerald-800/60
            "
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.226 17.834a.75.75 0 0 0-1.06 1.06l1.591 1.59a.75.75 0 0 0 1.06-1.061l-1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.166 7.226a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591Z" />
              </svg>
              <h4 className="text-[11px] font-black tracking-wide text-emerald-700 dark:text-emerald-400 uppercase">
                ব্যাখ্যা
              </h4>
            </div>
            <div className="text-[13.5px] md:text-sm text-neutral-700 dark:text-neutral-200 leading-[1.8] font-serif-exam">
              <LatexText text={question.explanation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
