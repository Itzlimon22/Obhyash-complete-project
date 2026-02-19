'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/types';

export type FlashcardGrade = 'got_it' | 'struggling';

export interface FlashcardResult {
  question: Question;
  grade: FlashcardGrade;
  selectedIndex: number | null;
}

interface FlashcardModeProps {
  questions: Question[];
  onComplete: (results: FlashcardResult[]) => void;
  onExit: () => void;
}

type CardPhase = 'selecting' | 'revealed';

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  questions,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<CardPhase>('selecting');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [direction, setDirection] = useState(1);

  const current = questions[currentIndex];
  const total = questions.length;
  const progress = (currentIndex / total) * 100;
  const correctIndex = current.correctAnswerIndex ?? 0;
  const isCorrect = selectedIdx === correctIndex;

  const handleSelect = useCallback(
    (idx: number) => {
      if (phase === 'revealed') return;
      setSelectedIdx(idx);
      setPhase('revealed');
    },
    [phase],
  );

  const handleNext = useCallback(() => {
    const grade: FlashcardGrade =
      selectedIdx === correctIndex ? 'got_it' : 'struggling';
    const newResults = [
      ...results,
      { question: current, grade, selectedIndex: selectedIdx },
    ];

    if (currentIndex + 1 >= total) {
      onComplete(newResults);
      return;
    }

    setDirection(1);
    setResults(newResults);
    setCurrentIndex((i) => i + 1);
    setPhase('selecting');
    setSelectedIdx(null);
  }, [
    selectedIdx,
    correctIndex,
    results,
    current,
    currentIndex,
    total,
    onComplete,
  ]);

  const getOptionStyle = (idx: number): string => {
    const base =
      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer select-none ';

    if (phase === 'selecting') {
      return (
        base +
        'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:shadow-sm active:scale-[0.98]'
      );
    }

    // revealed phase
    if (idx === correctIndex) {
      return (
        base +
        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200'
      );
    }
    if (idx === selectedIdx && idx !== correctIndex) {
      return (
        base +
        'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300'
      );
    }
    return (
      base +
      'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600 opacity-60'
    );
  };

  const getBadgeStyle = (idx: number): string => {
    const base =
      'text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ';
    if (phase === 'revealed') {
      if (idx === correctIndex) return base + 'bg-emerald-600 text-white';
      if (idx === selectedIdx) return base + 'bg-red-500 text-white';
      return base + 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400';
    }
    return (
      base +
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          বাতিল
        </button>

        {/* Progress counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">
            {currentIndex + 1} / {total}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            📇 ফ্ল্যাশকার্ড
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 50 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Subject tag */}
              {current.subject && (
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-4">
                  {current.subject}
                </span>
              )}

              {/* Question */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-4 shadow-sm">
                <p className="text-base font-semibold text-neutral-900 dark:text-white leading-relaxed">
                  {current.question}
                </p>
              </div>

              {/* Phase hint */}
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-3 ml-1">
                {phase === 'selecting'
                  ? 'একটি উত্তর বাছুন'
                  : isCorrect
                    ? '✓ সঠিক উত্তর!'
                    : '✗ ভুল হয়েছে — সঠিক উত্তরটি দেখুন'}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {current.options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={phase === 'selecting' ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(idx)}
                    className={getOptionStyle(idx)}
                    disabled={phase === 'revealed'}
                  >
                    <span className={getBadgeStyle(idx)}>
                      {phase === 'revealed' && idx === correctIndex ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : phase === 'revealed' &&
                        idx === selectedIdx &&
                        !isCorrect ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      ) : (
                        BANGLA_INDICES[idx]
                      )}
                    </span>
                    <span className="text-sm text-left leading-snug">
                      {opt}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {phase === 'revealed' && current.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl"
                  >
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                      ব্যাখ্যা
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                      {current.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next button */}
              <AnimatePresence>
                {phase === 'revealed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <button
                      onClick={handleNext}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md active:scale-[0.98] transition-all ${
                        isCorrect
                          ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-900/20'
                          : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                      }`}
                    >
                      {currentIndex + 1 >= total
                        ? 'ফলাফল দেখুন'
                        : isCorrect
                          ? '✓ পরবর্তী প্রশ্ন →'
                          : '→ পরবর্তী প্রশ্ন'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FlashcardMode;
