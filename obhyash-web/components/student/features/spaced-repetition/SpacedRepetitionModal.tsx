'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Award,
  Zap,
  RotateCcw,
  Gift,
  Check,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { celebration } from '@/lib/confetti';
import {
  getDueRevisionQuestions,
  submitSpacedRepetitionSession,
  SpacedRepetitionSessionResult,
} from '@/services/spaced-repetition-service';

interface SpacedRepetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete?: () => void;
}

export default function SpacedRepetitionModal({
  isOpen,
  onClose,
  onSessionComplete,
}: SpacedRepetitionModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  // Timer & Loading
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionResult, setSessionResult] = useState<SpacedRepetitionSessionResult | null>(null);

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Session
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);
    setIsFinished(false);
    setSessionResult(null);
    setCurrentIndex(0);
    setUserAnswers({});
    setQuestionTimes({});
    setTimeLeft(600);

    getDueRevisionQuestions(10).then((qs) => {
      if (!mounted) return;
      if (!qs || qs.length === 0) {
        toast.error('কোনো প্রশ্ন লোড করা যায়নি। পুনরায় চেষ্টা করুন।');
        onClose();
        return;
      }
      setQuestions(qs);
      setIsLoading(false);
      questionStartTimeRef.current = Date.now();
    });

    return () => {
      mounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, onClose]);

  // Timer Countdown
  useEffect(() => {
    if (!isOpen || isLoading || isFinished || isSubmitting) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleSubmitSession(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, isLoading, isFinished, isSubmitting]);

  // Record Time per Question when navigating
  const recordCurrentQuestionTime = () => {
    if (!questions[currentIndex]) return;
    const qId = String(questions[currentIndex].id);
    const elapsedSec = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    setQuestionTimes((prev) => ({
      ...prev,
      [qId]: (prev[qId] || 0) + elapsedSec,
    }));
    questionStartTimeRef.current = Date.now();
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!questions[currentIndex]) return;
    const qId = String(questions[currentIndex].id);
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const handleNext = () => {
    recordCurrentQuestionTime();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    recordCurrentQuestionTime();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Submit Session
  const handleSubmitSession = async () => {
    if (isSubmitting || isFinished) return;
    recordCurrentQuestionTime();
    setIsSubmitting(true);

    try {
      const answersPayload = questions.map((q) => {
        const qId = String(q.id);
        const userChoice = userAnswers[qId];
        const correctIndices =
          q.correctAnswerIndices && q.correctAnswerIndices.length > 0
            ? q.correctAnswerIndices
            : [q.correctAnswerIndex ?? 0];
        const isCorrect = userChoice !== undefined && correctIndices.includes(userChoice);

        return {
          questionId: qId,
          isCorrect,
          timeSpent: questionTimes[qId] || 25,
        };
      });

      const res = await submitSpacedRepetitionSession(answersPayload);

      if (res && res.success) {
        setSessionResult(res);
        setIsFinished(true);

        if (res.is_perfect_score) {
          celebration.perfectScore();
          toast.success('🏆 অসাধারণ! ১০/১০ পারফেক্ট স্কোর! স্পেশাল গিফট আনলক হয়েছে!');
        } else {
          toast.success(`🎉 রিভিশন সম্পন্ন! +${res.xp_earned} XP অর্জিত হয়েছে!`);
        }

        if (onSessionComplete) {
          onSessionComplete();
        }
      } else {
        toast.error('সেশন সাবমিট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Session submit error:', err);
      toast.error('নেটওয়ার্ক সমস্যার কারণে সাবমিট ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 md:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
                <span>Leitner ডেইলি মেমোরি রিভিশন</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  SM-2
                </span>
              </h3>
              <p className="text-xs text-slate-400">১০টি প্রশ্ন • স্মৃতি স্থায়ী করার বৈজ্ঞানিক পদ্ধতি</p>
            </div>
          </div>

          {!isFinished && (
            <div className="flex items-center gap-3">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  timeLeft <= 60
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-purple-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Brain className="w-10 h-10 text-purple-400 animate-bounce" />
            <p className="text-sm font-medium text-slate-300">আজকের রিভিশন প্রশ্ন প্রস্তুত হচ্ছে...</p>
          </div>
        ) : isFinished && sessionResult ? (
          /* Completion & Reward Screen */
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/25">
                {sessionResult.is_perfect_score ? (
                  <Award className="w-8 h-8 text-white animate-bounce" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {sessionResult.is_perfect_score ? '🌟 পারফেক্ট মেমোরি স্কোর!' : '🎉 আজকের রিভিশন সম্পন্ন!'}
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                আপনার উত্তরগুলো মেমোরি বক্সে প্রসেস করা হয়েছে।
              </p>
            </div>

            {/* Score & XP Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Score</span>
                <span className="text-xl font-bold text-white">
                  {sessionResult.correct_count} / {sessionResult.total_answered}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Accuracy</span>
                <span className="text-xl font-bold text-emerald-400">{sessionResult.accuracy}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-center">
                <span className="text-[11px] font-semibold text-purple-300 uppercase block">Earned XP</span>
                <span className="text-xl font-black text-purple-400">+{sessionResult.xp_earned} XP</span>
              </div>
            </div>

            {/* Perfect Score Mystery Gift Card */}
            {sessionResult.is_perfect_score && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/15 to-amber-500/10 border border-amber-500/30 flex items-center gap-3.5 shadow-lg">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                  <Gift className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    🎁 Special Perfect Score Gift
                  </span>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    Memory Champion Bonus (+100 Extra XP & Mystery Scratch Card আনলকড!)
                  </p>
                </div>
              </div>
            )}

            {/* Box 1-5 Visual Progression Update */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Leitner 5-Box মেমোরি আপডেট
                </span>
                {sessionResult.promoted_count > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    🚀 {sessionResult.promoted_count}টি প্রশ্ন পরবর্তী বক্সে উন্নীত!
                  </span>
                )}
              </div>

              {/* 5-Box Level Pills */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[
                  { level: 1, name: 'Box 1', days: '1d', count: sessionResult.stats_after.box1_count },
                  { level: 2, name: 'Box 2', days: '3d', count: sessionResult.stats_after.box2_count },
                  { level: 3, name: 'Box 3', days: '7d', count: sessionResult.stats_after.box3_count },
                  { level: 4, name: 'Box 4', days: '14d', count: sessionResult.stats_after.box4_count },
                  { level: 5, name: 'Mastered 🏆', days: '30d', count: sessionResult.stats_after.box5_count },
                ].map((b) => (
                  <div
                    key={b.level}
                    className={`p-2.5 rounded-lg border text-center ${
                      b.level === 5
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 block">{b.days}</span>
                    <span className="text-xs font-bold block truncate">{b.name}</span>
                    <span className="text-sm font-black text-white mt-1 block">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
          </div>
        ) : currentQ ? (
          /* Question Solving Flow */
          <div className="flex-1 flex flex-col justify-between p-5 md:p-6 overflow-y-auto space-y-4">
            {/* Progress Dots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-purple-300">
                  প্রশ্ন {currentIndex + 1} / {questions.length}
                </span>
                <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% সম্পন্ন</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Stimulus / Passage (if present) */}
            {currentQ.passage && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1">📖 উদ্দীপক:</span>
                <MathRenderer text={currentQ.passage} />
              </div>
            )}

            {/* Question Text */}
            <div className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed py-1">
              <MathRenderer text={currentQ.question} />
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userAnswers[String(currentQ.id)] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs md:text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/15'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {['ক', 'খ', 'গ', 'ঘ', 'ঙ'][optIdx] || optIdx + 1}
                    </span>
                    <div className="flex-1">
                      <MathRenderer text={opt} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 text-xs font-semibold hover:bg-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitSession}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
                >
                  {isSubmitting ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  রিভিশন জমা দিন
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
