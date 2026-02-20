import React from 'react';
import { Question, UserAnswers } from '@/lib/types';
import LatexText from '@/components/student/ui/LatexText';

interface ReviewListProps {
  questions: Question[];
  userAnswers: UserAnswers;
  bookmarked: Set<number>;
  toggleBookmark: (id: number) => void;
  openReportModal: (id: number) => void;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

const ReviewList: React.FC<ReviewListProps> = ({
  questions,
  userAnswers,
  bookmarked,
  toggleBookmark,
  openReportModal,
}) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">
          উত্তরপত্র পর্যালোচনা
        </h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              সঠিক
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              ভুল
            </span>
          </div>
        </div>
      </div>

      {questions.map((q) => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.correctAnswerIndex;
        const isBookmarked = bookmarked.has(Number(q.id));
        const correctOptionLabel =
          typeof q.correctAnswerIndex === 'number' &&
          BANGLA_INDICES[q.correctAnswerIndex] !== undefined
            ? BANGLA_INDICES[q.correctAnswerIndex]
            : typeof q.correctAnswerIndex === 'number'
              ? (q.correctAnswerIndex + 1).toString()
              : '';

        return (
          <div
            key={q.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-none border border-neutral-200 dark:border-neutral-800 mb-8 overflow-hidden transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`
                      flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full font-bold text-sm text-white
                      ${isCorrect ? 'bg-emerald-500' : userAnswer === undefined ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-red-500'}
                    `}
                >
                  {isCorrect ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : userAnswer === undefined ? (
                    <span>-</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    প্রশ্ন {q.id}
                  </span>
                  <span className="text-base font-bold text-neutral-800 dark:text-neutral-200 leading-none">
                    {q.points} নম্বর
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReportModal(Number(q.id))}
                  className="p-2.5 rounded-full text-red-400 dark:text-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="রিপোর্ট করো"
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
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => toggleBookmark(Number(q.id))}
                  className={`
                        transition-all duration-200 p-2.5 rounded-full 
                        ${isBookmarked ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300'}
                      `}
                  title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
                >
                  {isBookmarked ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
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
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="px-4 py-4 md:px-6 md:py-6">
              <h3 className="text-neutral-800 dark:text-neutral-100 font-semibold text-base md:text-lg leading-relaxed mb-6">
                <LatexText text={q.question} />
              </h3>

              <div className="flex flex-col gap-3">
                {q.options.map((option, optIdx) => {
                  const isSelectedByUser = userAnswer === optIdx;
                  const isCorrectOption = q.correctAnswerIndex === optIdx;
                  const banglaIndex =
                    BANGLA_INDICES[optIdx] || (optIdx + 1).toString();

                  let cardStyle =
                    'bg-white dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-80';
                  let indexBubbleStyle =
                    'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400';
                  let textStyle = 'text-neutral-700 dark:text-neutral-300';
                  let icon = null;
                  let badge = null;

                  if (isCorrectOption) {
                    cardStyle =
                      'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 shadow-sm';
                    indexBubbleStyle =
                      'bg-emerald-600 border-emerald-600 text-white';
                    textStyle =
                      'text-emerald-900 dark:text-emerald-200 font-medium';
                    icon = (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ml-2 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5 text-white"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    );
                    badge = (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                        সঠিক
                      </span>
                    );
                  } else if (isSelectedByUser) {
                    cardStyle =
                      'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-600 shadow-sm';
                    indexBubbleStyle = 'bg-red-600 border-red-600 text-white';
                    textStyle = 'text-red-900 dark:text-red-200 font-medium';
                    icon = (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center ml-2 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5 text-white"
                        >
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      </div>
                    );
                    badge = (
                      <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                        তোমার উত্তর
                      </span>
                    );
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`
                            relative flex items-center p-3 md:p-3.5 rounded-xl border-2 transition-all
                            ${cardStyle}
                          `}
                    >
                      {/* Index Bubble */}
                      <div
                        className={`
                            flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border transition-colors mr-3 md:mr-4
                            ${indexBubbleStyle}
                          `}
                      >
                        {banglaIndex}
                      </div>

                      {/* Option Text */}
                      <span
                        className={`text-sm md:text-[16px] leading-normal flex-1 ${textStyle}`}
                      >
                        <LatexText text={option} />
                      </span>

                      {badge}
                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Redesigned Explanation Section */}
              <div className="mt-6 md:mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-lg p-4 md:p-5 border-l-4 border-indigo-500 shadow-sm">
                  <div className="mb-3">
                    <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      সঠিক উত্তর
                    </span>
                    <div className="text-indigo-700 dark:text-indigo-300 font-bold text-base md:text-lg flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-sm md:text-base">
                        {correctOptionLabel}
                      </span>
                      {typeof q.correctAnswerIndex === 'number' && (
                        <span className="text-sm md:text-base">
                          {q.options[q.correctAnswerIndex]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 md:mt-5">
                    <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      ব্যাখ্যা
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif-exam text-sm md:text-[17px]">
                      <LatexText
                        text={q.explanation || 'কোনো ব্যাখ্যা দেওয়া হয়নি।'}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
