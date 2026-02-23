import React, { useState } from 'react';
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

  // Build tags
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
        bg-white dark:bg-[#1c1c1e]
        rounded-2xl mb-3 scroll-mt-24
        transition-all duration-200
        border
        ${isFlagged
          ? 'border-orange-300 dark:border-orange-700/60'
          : 'border-neutral-200 dark:border-neutral-700/60'
        }
        shadow-sm
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-5">

        {/* ── Question number + text inline ── */}
        <div className="
          font-serif-exam text-[15px] md:text-base
          text-neutral-900 dark:text-neutral-100
          leading-[1.75] mb-3
        ">
          {serialNumber && (
            <span className="font-bold text-neutral-500 dark:text-neutral-400 mr-1">
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}
          <LatexText text={question.question} />
        </div>

        {/* ── Meta Row: tags LEFT · bookmark + report RIGHT ── */}
        <div className="flex items-center justify-between gap-2 mb-3 min-h-[24px]">

          {/* Institute / Year tags */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {tags.length > 0 ? (
              tags.map((tag, i) => (
                <span
                  key={i}
                  className="
                    inline-flex items-center
                    text-[10px] md:text-[11px] font-bold
                    px-2 py-[3px] rounded-md
                    bg-teal-50 text-teal-700
                    dark:bg-teal-900/30 dark:text-teal-400
                    border border-teal-100 dark:border-teal-800/60
                    tracking-wide whitespace-nowrap
                  "
                >
                  {tag}
                </span>
              ))
            ) : (
              <span /> /* spacer so flex justify-between still works */
            )}
          </div>

          {/* Bookmark + Report */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Bookmark */}
            <motion.button
              whileTap={{ scale: 0.80 }}
              whileHover={{ scale: 1.15 }}
              onClick={onToggleBookmark}
              disabled={!onToggleBookmark}
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center
                transition-colors duration-150
                ${!onToggleBookmark ? 'opacity-30 cursor-default' : 'cursor-pointer'}
                ${isBookmarked
                  ? 'bg-emerald-50 dark:bg-emerald-900/30'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }
              `}
              title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className={`
                  w-4 h-4 transition-colors duration-150
                  ${isBookmarked
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400 dark:text-neutral-500'
                  }
                `}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
                />
              </svg>
            </motion.button>

            {/* Report */}
            <button
              onClick={onReport}
              className="
                w-7 h-7 rounded-lg flex items-center justify-center
                bg-neutral-100 dark:bg-neutral-800
                hover:bg-red-50 dark:hover:bg-red-900/20
                text-neutral-400 dark:text-neutral-500
                hover:text-red-500 dark:hover:text-red-400
                transition-colors duration-150
              "
              title="Report Issue"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
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

        {/* ── Options Grid ── */}
        <div
          className={`
            grid grid-cols-1 md:grid-cols-2 gap-2
            ${readOnly || isOmrMode ? 'pointer-events-none' : ''}
          `}
        >
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === question.correctAnswerIndex;
            const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

            let badgeText = banglaIndex;

            let badgeClass = `
              border-2 border-neutral-300 text-neutral-500
              dark:border-neutral-600 dark:text-neutral-400
              bg-white dark:bg-transparent
            `;

            let rowClass = `
              bg-neutral-50 border border-neutral-200
              dark:bg-neutral-800/50 dark:border-neutral-700/50
              hover:bg-neutral-100 hover:border-neutral-300
              dark:hover:bg-neutral-800 dark:hover:border-neutral-600
            `;

            let textClass = 'text-neutral-800 dark:text-neutral-200';

            if (showFeedback) {
              if (isCorrect) {
                badgeText = '✓';
                badgeClass = 'bg-emerald-500 border-emerald-500 text-white';
                rowClass = 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/50';
                textClass = 'text-emerald-800 dark:text-emerald-200 font-semibold';
              } else if (isSelected) {
                badgeText = '✕';
                badgeClass = 'bg-red-500 border-red-500 text-white';
                rowClass = 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700/50';
                textClass = 'text-red-800 dark:text-red-200 font-semibold';
              } else {
                rowClass = `
                  bg-neutral-50 border border-neutral-200 opacity-50
                  dark:bg-neutral-800/30 dark:border-neutral-700/30
                `;
              }
            } else if (showAnswer && isCorrect) {
              badgeText = '✓';
              badgeClass = 'bg-emerald-500 border-emerald-500 text-white';
              rowClass = 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/50';
              textClass = 'text-emerald-800 dark:text-emerald-200 font-semibold';
            } else if (isSelected) {
              badgeText = '✓';
              badgeClass = 'bg-emerald-500 border-emerald-500 text-white';
              rowClass = 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/50';
              textClass = 'text-emerald-800 dark:text-emerald-200 font-semibold';
            }

            return (
              <label
                key={idx}
                className={`
                  flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  transition-all duration-150
                  ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${rowClass}
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

                {/* Letter Badge */}
                <div
                  className={`
                    w-[26px] h-[26px] rounded-full shrink-0
                    flex items-center justify-center
                    transition-all duration-150
                    ${badgeClass}
                  `}
                >
                  <span className="text-[11px] font-bold leading-none">
                    {badgeText}
                  </span>
                </div>

                {/* Option Text */}
                <span
                  className={`
                    text-[14px] md:text-[15px] font-medium
                    leading-[1.55] select-none flex-1
                    ${textClass}
                  `}
                >
                  <LatexText text={option} />
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Explanation ── */}
      {showFeedback && question.explanation && (
        <div className="
          border-t border-neutral-100 dark:border-neutral-800
          px-4 pb-4 md:px-5 md:pb-5 pt-3
        ">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full flex items-center justify-between
              px-4 py-2.5 rounded-xl
              bg-emerald-600 hover:bg-emerald-700
              dark:bg-emerald-700 dark:hover:bg-emerald-600
              text-white transition-all duration-150
              active:scale-[0.99]
            "
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="text-sm font-bold tracking-wide">
                ব্যাখ্যা দেখুন
              </span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div
            className={`
              grid transition-all duration-300 ease-in-out
              ${isExpanded
                ? 'grid-rows-[1fr] opacity-100 mt-2'
                : 'grid-rows-[0fr] opacity-0'}
            `}
          >
            <div className="overflow-hidden">
              <div className="
                p-4 md:p-5 rounded-xl
                bg-neutral-50 dark:bg-neutral-800/50
                border border-neutral-200 dark:border-neutral-700/60
                border-l-4 border-l-emerald-500 dark:border-l-emerald-500
              ">
                <p className="
                  text-[14px] md:text-[15px] leading-[1.85]
                  text-neutral-700 dark:text-neutral-300
                  font-serif-exam
                ">
                  <LatexText text={question.explanation} />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}