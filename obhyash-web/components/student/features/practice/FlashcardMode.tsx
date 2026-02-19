'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/types';

export type FlashcardGrade = 'got_it' | 'struggling';

export interface FlashcardResult {
  question: Question;
  grade: FlashcardGrade;
}

interface FlashcardModeProps {
  questions: Question[];
  onComplete: (results: FlashcardResult[]) => void;
  onExit: () => void;
}

type CardState = 'question' | 'revealed';

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  questions,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>('question');
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [direction, setDirection] = useState(1);

  const current = questions[currentIndex];
  const total = questions.length;
  const progress = (currentIndex / total) * 100;

  const handleReveal = useCallback(() => {
    setCardState('revealed');
  }, []);

  const handleGrade = useCallback(
    (grade: FlashcardGrade) => {
      const newResults = [...results, { question: current, grade }];

      if (currentIndex + 1 >= total) {
        onComplete(newResults);
        return;
      }

      setDirection(1);
      setResults(newResults);
      setCurrentIndex((i) => i + 1);
      setCardState('question');
    },
    [results, current, currentIndex, total, onComplete],
  );

  const optionCorrectIndex = current.correctAnswerIndex;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <button
          onClick={onExit}
          className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          বাতিল
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 font-medium">
            {currentIndex + 1} / {total}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-900/40 text-rose-400 border border-rose-800/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
            ফ্ল্যাশকার্ড
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <motion.div
          className="h-full bg-gradient-to-r from-rose-600 to-amber-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            {/* Question card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl mb-4">
              {/* Subject tag */}
              {current.subject && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-900/40 text-indigo-400 border border-indigo-800/40 mb-4">
                  {current.subject}
                </span>
              )}

              {/* Question text */}
              <p className="text-white text-lg font-semibold leading-relaxed mb-6 whitespace-pre-wrap">
                {current.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {current.options.map((opt, idx) => {
                  const isCorrect = idx === optionCorrectIndex;
                  const showHighlight = cardState === 'revealed';

                  return (
                    <motion.div
                      key={idx}
                      animate={
                        showHighlight && isCorrect
                          ? { scale: 1.02 }
                          : { scale: 1 }
                      }
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        showHighlight
                          ? isCorrect
                            ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                            : 'bg-neutral-800/40 border-neutral-700 text-neutral-500'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          showHighlight
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-700 text-neutral-500'
                            : 'bg-neutral-700 text-neutral-400'
                        }`}
                      >
                        {BANGLA_INDICES[idx]}
                      </span>
                      <span className="text-sm leading-snug">{opt}</span>
                      {showHighlight && isCorrect && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {cardState === 'revealed' && current.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 p-4 bg-amber-900/20 border border-amber-800/40 rounded-xl"
                  >
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                      ব্যাখ্যা
                    </p>
                    <p className="text-sm text-amber-200 leading-relaxed">
                      {current.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <AnimatePresence mode="wait">
          {cardState === 'question' ? (
            <motion.button
              key="reveal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleReveal}
              className="w-full max-w-sm px-8 py-4 bg-white text-neutral-900 rounded-xl font-bold text-base shadow-xl hover:bg-neutral-100 active:scale-95 transition-all"
            >
              উত্তর দেখুন
            </motion.button>
          ) : (
            <motion.div
              key="grade"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-4 w-full max-w-sm"
            >
              <button
                onClick={() => handleGrade('struggling')}
                className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">✗</span>
                এখনও কঠিন
              </button>
              <button
                onClick={() => handleGrade('got_it')}
                className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">✓</span>
                পারলাম
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FlashcardMode;
