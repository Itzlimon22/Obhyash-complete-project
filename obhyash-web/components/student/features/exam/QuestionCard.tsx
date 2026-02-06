import React from 'react';
import { Question } from '@/lib/types';
import LatexText from '@/components/student/ui/LatexText';

interface QuestionCardProps {
  question: Question;
  selectedOptionIndex: number | undefined;
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void;
  onReport: () => void;
  isOmrMode?: boolean;
  showFeedback?: boolean;
  readOnly?: boolean;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOptionIndex,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  onReport,
  isOmrMode = false,
  showFeedback = false,
  readOnly = false,
}) => {
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
              ? 'border-l-indigo-500 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800'
              : 'border-l-neutral-200 dark:border-l-neutral-700 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800'
        }
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      {/* Header / Meta */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Question {question.id}
          </span>
          {isFlagged && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              Marked
            </span>
          )}
          {showFeedback &&
            isAnswered &&
            (selectedOptionIndex === question.correctAnswerIndex ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                সঠিক
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                ভুল
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
          <button
            onClick={onToggleFlag}
            className={`p-2 rounded-full transition-colors ${isFlagged ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-neutral-300 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400'}`}
            title="Bookmark"
            disabled={readOnly}
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
          </button>
        </div>
      </div>

      <div className="px-5 pb-6">
        {/* Question Text */}
        <h3 className="text-neutral-900 dark:text-neutral-100 font-serif-exam text-lg md:text-xl leading-relaxed mb-6">
          <LatexText text={question.question} />
        </h3>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
          {/* Overlay to disable interaction in OMR mode */}
          {isOmrMode && (
            <div className="absolute inset-0 z-10 bg-white/10 dark:bg-black/10 cursor-not-allowed flex items-center justify-center backdrop-blur-[1px] rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700"></div>
          )}

          {question.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

            // Logic for styles
            let cardClass = `
                  group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full
                  ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                  ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-500 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
            `;

            let badgeIcon = isSelected ? '✓' : banglaIndex;
            let badgeClass = `
                  mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                  ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 text-transparent group-hover:border-neutral-400'
                  }
            `;
            let textClass = `text-base font-medium leading-relaxed select-none ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-neutral-700 dark:text-neutral-300'}`;

            if (showFeedback) {
              const isCorrect = idx === question.correctAnswerIndex;
              if (isCorrect) {
                cardClass = `
                      group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full cursor-default
                      bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-500 shadow-sm
                    `;
                badgeClass = `
                      mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                      border-emerald-600 bg-emerald-600 text-white
                    `;
                badgeIcon = '✓';
                textClass = `text-base font-medium leading-relaxed select-none text-emerald-900 dark:text-emerald-200`;
              } else if (isSelected) {
                // Incorrect selection
                cardClass = `
                      group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full cursor-default
                      bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500 shadow-sm
                    `;
                badgeClass = `
                      mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                      border-red-600 bg-red-600 text-white
                    `;
                badgeIcon = '✕';
                textClass = `text-base font-medium leading-relaxed select-none text-red-900 dark:text-red-200`;
              } else {
                // Other options when feedback is shown
                cardClass = `
                      group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full cursor-default opacity-50
                      bg-neutral-50 dark:bg-neutral-800/40 border-transparent
                    `;
              }
            }

            return (
              <label key={idx} className={cardClass}>
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
                <div className={badgeClass}>
                  <span className="text-xs font-bold">{badgeIcon}</span>
                </div>

                {/* Option Text */}
                <div className={textClass}>
                  <LatexText text={option} />
                </div>
              </label>
            );
          })}
        </div>

        {/* Explanation Section */}
        {showFeedback && question.explanation && (
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">
              ব্যাখ্যা
            </h4>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              <LatexText text={question.explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
