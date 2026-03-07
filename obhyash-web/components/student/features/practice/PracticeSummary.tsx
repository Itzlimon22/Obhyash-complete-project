'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlashcardResult } from './FlashcardMode';
import { Question } from '@/lib/types';

interface PracticeSummaryProps {
  results: FlashcardResult[];
  mode: 'flashcard' | 'exam';
  practicedQuestions?: Question[];
  onPracticeStruggling: (questions: Question[]) => void;
  onBack: () => void;
}

export const PracticeSummary: React.FC<PracticeSummaryProps> = ({
  results,
  onPracticeStruggling,
  onBack,
}) => {
  const { gotItCount, strugglingCount, total, struggling } = useMemo(() => {
    const got = results.filter((r) => r.grade === 'got_it');
    const str = results.filter((r) => r.grade === 'struggling');
    return {
      gotItCount: got.length,
      strugglingCount: str.length,
      total: results.length,
      struggling: str.map((r) => r.question),
    };
  }, [results]);

  const percentage = total > 0 ? Math.round((gotItCount / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;

  const feedbackEmoji =
    percentage >= 80 ? '🎉' : percentage >= 50 ? '💪' : '📚';
  const feedbackText =
    percentage >= 80
      ? 'দারুণ! অনুশীলন চমৎকার হয়েছে।'
      : percentage >= 50
        ? 'ভালো প্রচেষ্টা! আরও একটু অনুশীলন করো।'
        : 'চিন্তা নেই, আবার চেষ্টা করো।';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="text-5xl mb-3">{feedbackEmoji}</div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            অনুশীলন শেষ!
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {feedbackText}
          </p>
        </motion.div>

        {/* Score ring */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-neutral-200 dark:text-neutral-800"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{
                  strokeDashoffset:
                    circumference - (circumference * percentage) / 100,
                }}
                transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient
                  id="scoreGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {percentage}%
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                পারলাম
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            {
              label: 'মোট',
              value: total,
              color: 'text-neutral-900 dark:text-white',
            },
            {
              label: 'পারলাম',
              value: gotItCount,
              color: 'text-emerald-700 dark:text-emerald-400',
            },
            {
              label: 'কঠিন',
              value: strugglingCount,
              color: 'text-red-600 dark:text-red-400',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-center shadow-sm"
            >
              <div className={`text-2xl font-bold ${color} mb-0.5`}>
                {value}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Struggling list */}
        {struggling.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 mb-6"
          >
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              যেগুলো আরও পড়া দরকার ({struggling.length})
            </p>
            <div className="space-y-2">
              {struggling.slice(0, 3).map((q, i) => (
                <p
                  key={q.id}
                  className="text-xs text-red-700 dark:text-red-300/80 line-clamp-1"
                >
                  {i + 1}. {q.question}
                </p>
              ))}
              {struggling.length > 3 && (
                <p className="text-xs text-red-500/70 dark:text-red-400/60 italic">
                  এবং আরও {struggling.length - 3}টি...
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div variants={itemVariants} className="space-y-3">
          {struggling.length > 0 && (
            <button
              onClick={() => onPracticeStruggling(struggling)}
              className="w-full px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                  clipRule="evenodd"
                />
              </svg>
              কঠিনগুলো আবার পড়ো ({struggling.length}টি)
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full px-6 py-3.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
          >
            অনুশীলনে ফিরে যাও
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PracticeSummary;
