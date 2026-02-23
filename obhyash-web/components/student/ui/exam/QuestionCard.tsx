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
  onToggleFlag: () => void; // (kept for compatibility; UI button removed)
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
  const [isExpanded, setIsExpanded] = useState(false);

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
        bg-white dark:bg-neutral-900
        rounded-xl mb-4 scroll-mt-24
        border border-neutral-200/80 dark:border-neutral-800
        shadow-sm hover:shadow-md transition-all duration-200
        px-3 py-3 md:px-5 md:py-4
        ${isFlagged ? 'ring-2 ring-orange-300/50' : isAnswered ? 'ring-1 ring-emerald-400/30' : ''}
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      {/* ── Header: (Q no + question start) LEFT · actions RIGHT ── */}
      <div className="flex items-start justify-between gap-3">
        {/* Number + question (forced same line via flex) */}
        <div className="flex items-start gap-2 min-w-0">
          {serialNumber !== undefined && (
            <span className="shrink-0 mt-[2px] text-sm md:text-base font-bold text-neutral-500 dark:text-neutral-400">
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}

          <div className="min-w-0 font-serif-exam text-base md:text-lg text-neutral-900 dark:text-neutral-100 leading-[1.7]">
            <LatexText text={question.question} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {/* Bookmark (deep green fill when active) */}
          <motion.button
            whileTap={{ scale: 0.86 }}
            whileHover={{ scale: 1.06 }}
            onClick={onToggleBookmark}
            disabled={!onToggleBookmark}
            title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
            className={`
              rounded-lg p-1.5 transition-colors
              ${!onToggleBookmark ? 'opacity-30 cursor-default' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
              ${isBookmarked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}
            `}
            style={{ border: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="w-[18px] h-[18px] md:w-5 md:h-5"
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
            title="Report Issue"
            className="
              rounded-lg p-1.5 transition-colors
              text-neutral-400 hover:text-red-500 hover:bg-neutral-100
              dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-neutral-800
            "
            style={{ border: 'none', background: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-[18px] h-[18px] md:w-5 md:h-5"
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

      {/* ── Institutes + Years ── */}
      {tags.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="
                inline-flex items-center
                text-[11px] md:text-xs font-semibold
                px-2 py-0.5 rounded-md
                bg-emerald-50 text-emerald-700 border border-emerald-100/80
                dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30
              "
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Options ── */}
      <div
        className={`
          mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5
          ${readOnly || isOmrMode ? 'pointer-events-none' : ''}
        `}
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === question.correctAnswerIndex;
          const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

          let iconText = banglaIndex;

          // Circle styles
          let iconClass =
            'border-2 border-neutral-300 text-neutral-500 ' +
            'dark:border-neutral-600 dark:text-neutral-400';

          // Text styles
          let textClass = 'text-neutral-800 dark:text-neutral-200';

          // Container styles (Chorcha-ish: subtle, clean)
          let containerClass =
            'bg-white border border-neutral-200/80 ' +
            'hover:bg-neutral-50 hover:border-neutral-300/80 ' +
            'dark:bg-neutral-900/40 dark:border-neutral-700/60 ' +
            'dark:hover:bg-neutral-800/60 dark:hover:border-neutral-600/60';

          if (showFeedback) {
            if (isCorrect) {
              iconClass = 'bg-emerald-500 text-white border-none';
              iconText = '✓';
              textClass = 'text-emerald-900 dark:text-emerald-100 font-semibold';
              containerClass =
                'bg-emerald-50 border border-emerald-200 ' +
                'dark:bg-emerald-900/20 dark:border-emerald-700/50';
            } else if (isSelected) {
              iconClass = 'bg-red-500 text-white border-none';
              iconText = '✕';
              textClass = 'text-red-900 dark:text-red-100 font-semibold';
              containerClass =
                'bg-red-50 border border-red-200 ' +
                'dark:bg-red-900/20 dark:border-red-700/50';
            } else {
              containerClass =
                'bg-white border border-neutral-200/80 opacity-55 ' +
                'dark:bg-neutral-900/30 dark:border-neutral-700/40';
            }
          } else if (showAnswer && isCorrect) {
            iconClass = 'bg-emerald-500 text-white border-none';
            iconText = '✓';
            textClass = 'text-emerald-900 dark:text-emerald-100 font-semibold';
            containerClass =
              'bg-emerald-50 border border-emerald-200 ' +
              'dark:bg-emerald-900/20 dark:border-emerald-700/50';
          } else if (isSelected) {
            iconClass = 'bg-emerald-500 text-white border-none';
            iconText = '✓';
            textClass = 'text-emerald-900 dark:text-emerald-100 font-semibold';
            containerClass =
              'bg-emerald-50 border border-emerald-200 ' +
              'dark:bg-emerald-900/20 dark:border-emerald-700/50';
          }

          return (
            <label
              key={idx}
              className={`
                group relative flex items-center gap-3
                px-3 py-2.5 rounded-xl
                transition-all duration-200 h-full
                ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${containerClass}
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

              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center
                  transition-all duration-200 shrink-0
                  ${iconClass}
                `}
              >
                <span className="text-xs font-bold leading-none">{iconText}</span>
              </div>

              <div className={`text-base font-medium leading-[1.6] select-none ${textClass}`}>
                <LatexText text={option} />
              </div>
            </label>
          );
        })}
      </div>

      {/* ── Explanation (review/feedback only) ── */}
      {showFeedback && question.explanation && (
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full flex items-center justify-between
              px-4 py-2.5 rounded-xl shadow-sm
              bg-emerald-800 dark:bg-emerald-900 text-white
              hover:bg-emerald-700 dark:hover:bg-emerald-800
              transition-all active:scale-[0.99]
            "
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
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
            className={`
              grid transition-all duration-300 ease-in-out
              ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}
            `}
          >
            <div className="overflow-hidden">
              <div
                className="
                  p-4 md:p-5 relative rounded-r-xl shadow-sm
                  bg-[#F8FAF9] dark:bg-emerald-950/20
                  border-l-4 border-emerald-800 dark:border-emerald-600
                "
              >
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
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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