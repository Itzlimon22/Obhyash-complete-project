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
  // New props for History/Review mode
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
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
}: QuestionCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;

  return (
    <div
      id={`question-${question.id}`}
      className={`
        bg-white dark:bg-neutral-900 rounded-xl mb-6 scroll-mt-32 transition-all duration-300
        border-l-4 shadow-sm hover:shadow-md
        ${
          isFlagged
            ? 'border-l-amber-400 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800'
            : isAnswered
              ? 'border-l-emerald-500 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800'
              : 'border-l-neutral-200 dark:border-l-neutral-700 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800'
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
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
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

          {/* Report Button */}
          <button
            onClick={onReport}
            className="p-2 rounded-full transition-colors text-neutral-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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

          {/* Bookmark Button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            animate={{
              scale: isFlagged ? 1.1 : 1,
              color: isFlagged ? '#f59e0b' : '#d4d4d4', // amber-500 : neutral-300
            }}
            onClick={onToggleFlag}
            className={`p-2 rounded-full transition-colors ${
              isFlagged
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400'
            }`}
            title={isFlagged ? 'Remove Bookmark' : 'Bookmark'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFlagged ? 'currentColor' : 'none'}
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
        </div>
      </div>

      <div className="px-5 pb-6">
        {/* Question Text */}
        <h3 className="text-neutral-900 dark:text-neutral-100 font-serif-exam text-lg md:text-xl leading-relaxed mb-6">
          <LatexText text={question.question} />
        </h3>

        {/* Options Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-3 relative ${readOnly || isOmrMode ? 'pointer-events-none' : ''}`}
        >
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === question.correctAnswerIndex;
            const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

            // Logic for Feedback Color
            let borderClass = 'border-transparent';
            let bgClass =
              'bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800';
            let iconText = banglaIndex;
            let iconBorder = 'border-neutral-300 dark:border-neutral-600';

            if (showFeedback) {
              if (isCorrect) {
                bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
                borderClass = 'border-emerald-500 dark:border-emerald-500';
                iconBorder = 'border-emerald-600 bg-emerald-600 text-white';
                iconText = '✓';
              } else if (isSelected) {
                bgClass = 'bg-red-50 dark:bg-red-900/20';
                borderClass = 'border-red-500 dark:border-red-500';
                iconBorder = 'border-red-600 bg-red-600 text-white';
                iconText = '✕';
              } else {
                // Non-selected wrong options fade out slightly
                bgClass = 'bg-neutral-50 dark:bg-neutral-800/40 opacity-70';
              }
            } else if (showAnswer && isCorrect) {
              // Show correct answer in Review/Practice mode without user selection
              bgClass = 'bg-emerald-50 dark:bg-emerald-900/10';
              borderClass = 'border-emerald-400 dark:border-emerald-500/50';
              iconBorder = 'border-emerald-500 text-emerald-600';
              iconText = '✓';
            } else if (isSelected) {
              bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
              borderClass =
                'border-emerald-500 dark:border-emerald-500 shadow-sm';
              iconBorder = 'border-emerald-600 bg-emerald-600 text-white';
              iconText = '✓';
            }

            return (
              <label
                key={idx}
                className={`
                  group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full
                  ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${bgClass} ${borderClass}
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
                  className={`
                  mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                  ${iconBorder}
                  ${!isSelected && !showFeedback ? 'group-hover:border-neutral-400' : ''}
                `}
                >
                  <span className="text-xs font-bold">{iconText}</span>
                </div>

                {/* Option Text */}
                <div
                  className={`text-base font-medium leading-relaxed select-none ${isSelected || (showFeedback && isCorrect) ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'}`}
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
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path
                    fillRule="evenodd"
                    d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                ব্যাখ্যা (Explanation)
              </h4>
              <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif-exam">
                <LatexText text={question.explanation} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
