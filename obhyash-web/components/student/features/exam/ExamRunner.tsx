'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Download,
  Moon,
  Sun,
  AlertTriangle,
  Bookmark,
  Check,
  X,
  Flag,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AppState,
  ExamDetails,
  Question,
  UserAnswers,
  UserProfile,
} from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ExamGridModal from '@/components/student/ui/exam/ExamGridModal';
import ReportModal from '@/components/student/ui/common/ReportModal';
import { downloadQuestionPaper } from '@/services/download-service';
import { cn } from '@/lib/utils';

interface ExamRunnerProps {
  appState: AppState;
  examDetails: ExamDetails | null;
  questions: Question[];
  userAnswers: UserAnswers;
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  flaggedQuestions: Set<number | string>;
  setFlaggedQuestions: React.Dispatch<
    React.SetStateAction<Set<number | string>>
  >;
  timeLeft: number;
  isEvaluating?: boolean;
  onSubmit: (manual?: boolean) => void;
  onExit: () => void;
  onTimeoutReattempt?: () => void;
  onTimeoutCancel?: () => void;
  setAppState: (state: AppState) => void;
  currentUser?: UserProfile | null;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  navWarning?: any;
  setNavWarning?: any;
  confirmNavigation?: any;
  handleTabChange?: any;
  handleLogoutClick?: any;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  appState,
  examDetails,
  questions,
  userAnswers,
  setUserAnswers,
  flaggedQuestions,
  setFlaggedQuestions,
  timeLeft,
  isEvaluating = false,
  onSubmit,
  onExit,
  currentUser,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  toggleTheme,
  isDarkMode = false,
}) => {
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showCheatingWarning, setShowCheatingWarning] =
    useState<boolean>(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<
    string | number | null
  >(null);

  const backgroundWarningsRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  // Anti-cheat visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        appState === AppState.ACTIVE &&
        !isSubmittingRef.current
      ) {
        backgroundWarningsRef.current += 1;
        if (backgroundWarningsRef.current === 1) {
          setShowCheatingWarning(true);
        } else if (backgroundWarningsRef.current >= 2) {
          toast.error(
            'নিয়ম ভঙ্গের কারণে পরীক্ষাটি স্বয়ংক্রিয়ভাবে সাবমিট করা হয়েছে!',
          );
          isSubmittingRef.current = true;
          onSubmit(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [appState, onSubmit]);

  // Handle Browser Back Button (PopState)
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const remainingCount = totalQuestions - answeredCount;

  // Format timer into mm:ss
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimerCritical = timeLeft <= 60;
  const isTimerWarning = timeLeft <= 300 && !isTimerCritical;

  const handleOptionSelect = (qId: string | number, optionIndex: number) => {
    if (userAnswers[qId] !== undefined) return; // Locked after one selected
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const handleToggleFlag = (qId: string | number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleScrollToQuestion = (index: number) => {
    const q = questions[index];
    if (q) {
      const elem = document.getElementById(`question-${q.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    isSubmittingRef.current = true;
    onSubmit(true);
  };

  const handleDownloadPdf = () => {
    if (examDetails) {
      toast.info('প্রশ্নপত্র PDF তৈরি হচ্ছে...');
      downloadQuestionPaper(examDetails, questions);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri',sans-serif] flex flex-col select-none">
      {/* ── 1. Top Sticky Exam Header (Matching Flutter Exactly) ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#000000] border-b border-[#E2E8F0] dark:border-[#27272A] shadow-xs">
        <div className="max-w-3xl mx-auto px-3.5 sm:px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: Answered / Total Pill (Clickable Question Palette) */}
          <button
            type="button"
            onClick={() => setShowGridModal(true)}
            title="উত্তর দেওয়া প্রশ্ন / মোট প্রশ্নের সংখ্যা (প্যালেট দেখতে ক্লিক করো)"
            className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] text-[#475569] dark:text-[#D4D4D4] font-black text-sm sm:text-base flex items-center gap-1 hover:bg-[#E2E8F0]/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>{answeredCount}</span>
            <span>/</span>
            <span>{totalQuestions}</span>
          </button>

          {/* Middle: Timer Capsule */}
          <div
            title="অবশিষ্ট সময়। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।"
            className={cn(
              'px-3.5 py-1.5 rounded-lg font-black text-sm sm:text-base font-mono flex items-center gap-1.5 border transition-all duration-300',
              isTimerCritical
                ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse shadow-md shadow-red-500/20'
                : isTimerWarning
                  ? 'bg-[#FFFBEB] dark:bg-[#451A03] border-[#FDE68A] dark:border-[#B45309] text-[#B45309] dark:text-[#FCD34D]'
                  : 'bg-[#F1F5F9] dark:bg-[#1C1C1E] border-[#E2E8F0] dark:border-[#27272A] text-[#27272A] dark:text-[#F5F5F5]',
            )}
          >
            <Clock
              size={15}
              className={cn(
                isTimerCritical
                  ? 'text-white'
                  : isTimerWarning
                    ? 'text-[#B45309] dark:text-[#FCD34D]'
                    : 'text-[#475569] dark:text-[#D4D4D4]',
              )}
            />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Right: Download PDF & Theme Toggle Buttons */}
          <div className="flex items-center gap-2">
            {/* Offline PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              title="অফলাইন প্রশ্নপত্র PDF ডাউনলোড করো"
              className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-center text-[#475569] dark:text-[#D4D4D4] hover:bg-[#E2E8F0] dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Download size={16} />
            </button>

            {/* Theme Toggle Button */}
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                title={isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
                className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-center text-[#475569] dark:text-[#D4D4D4] hover:bg-[#E2E8F0] dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-[#004633] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── 2. Main Question Flow Feed ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3.5 sm:px-4 pt-4 sm:pt-6 pb-28">
        <div className="flex flex-col gap-4">
          {questions.map((question, idx) => {
            const isAnswered = userAnswers[question.id] !== undefined;
            const isFlagged = flaggedQuestions.has(question.id);
            const isBookmarked = bookmarkedIds.has(question.id.toString());

            return (
              <QuestionCard
                key={question.id}
                question={question}
                serialNumber={idx + 1}
                selectedOptionIndex={userAnswers[question.id]}
                isFlagged={isFlagged}
                isBookmarked={isBookmarked}
                onSelectOption={(optIdx) =>
                  handleOptionSelect(question.id, optIdx)
                }
                onToggleFlag={() => handleToggleFlag(question.id)}
                onToggleBookmark={
                  onToggleBookmark
                    ? () => onToggleBookmark(question.id)
                    : undefined
                }
                onReport={() => setReportingQuestionId(question.id)}
              />
            );
          })}
        </div>
      </main>

      {/* ── 3. Bottom Sticky Submit Footer (Matching Flutter Exactly) ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#27272A] p-3 sm:p-4 flex justify-center shadow-lg">
        <div className="max-w-3xl w-full flex justify-center">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isEvaluating}
            className="w-full sm:w-auto px-14 py-3.5 rounded-[12px] bg-[#004633] hover:bg-[#003828] active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-md shadow-[#004633]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEvaluating ? 'মূল্যায়ন হচ্ছে...' : 'জমা দাও'}
          </button>
        </div>
      </footer>

      {/* ── 4. Modals & Dialogs ── */}

      {/* Question Navigation Grid Modal */}
      <ExamGridModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        totalQuestions={totalQuestions}
        userAnswers={userAnswers}
        flaggedQuestions={flaggedQuestions}
        questionIds={questions.map((q) => q.id)}
        onSelectQuestion={handleScrollToQuestion}
      />

      {/* Submit Confirmation Dialog (Flutter Style: 'খাতা জমা দিবে?') */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowSubmitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[24px] p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-4">
              খাতা জমা দিবে?
            </h3>

            {/* Stats Snapshot Row */}
            <div className="p-3.5 rounded-[14px] bg-[#F4F4F5] dark:bg-[#27272A]/50 border border-[#E4E4E7] dark:border-[#3F3F46]/40 flex items-center justify-around mb-6">
              <div>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block mb-0.5">
                  উত্তর দেওয়া
                </span>
                <span className="text-base sm:text-lg font-bold text-[#10B981]">
                  {BanglaNameHelper.toBanglaNumeral(answeredCount)}/
                  {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
                </span>
              </div>

              <div className="w-[1px] h-8 bg-[#E4E4E7] dark:bg-[#3F3F46]" />

              <div>
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block mb-0.5">
                  বাকি আছে
                </span>
                <span
                  className={cn(
                    'text-base sm:text-lg font-bold',
                    remainingCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]',
                  )}
                >
                  {BanglaNameHelper.toBanglaNumeral(remainingCount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-xl bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#4B5563] dark:text-[#D4D4D8] font-bold text-sm hover:bg-neutral-200/70 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                না, পরীক্ষা দিবো
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                className="py-3 px-4 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-sm shadow-md shadow-[#004633]/25 transition active:scale-95 cursor-pointer"
              >
                হ্যাঁ, জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit / Navigation Warning Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowExitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[24px] p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <div className="w-14 h-14 rounded-full bg-[#EA580C]/15 border border-[#EA580C]/30 flex items-center justify-center mx-auto mb-3.5 text-[#F97316]">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              সতর্কতা
            </h3>

            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-6 leading-relaxed">
              পরীক্ষা চলাকালীন অবস্থায় বের হওয়া যাবে না। বের হতে চাইলে পরীক্ষাটি
              জমা দিন। আপনি কি পরীক্ষা জমা দিয়ে বের হতে চান?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="py-3 px-4 rounded-xl bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#4B5563] dark:text-[#D4D4D8] font-bold text-sm hover:bg-neutral-200/70 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                চালিয়ে যাও
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  confirmSubmit();
                }}
                className="py-3 px-4 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-sm shadow-md shadow-[#004633]/25 transition cursor-pointer"
              >
                জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheating / Window Blur Warning Modal */}
      {showCheatingWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[24px] p-6 shadow-2xl border border-red-500/30 z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <div className="w-14 h-14 rounded-full bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center mx-auto mb-3.5 text-[#EF4444]">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-black text-[#DC2626] dark:text-[#F87171] mb-2">
              সতর্কতা!
            </h3>

            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-6 leading-relaxed">
              তুমি পরীক্ষা চলাকালীন অন্য ট্যাব বা উইন্ডোতে গিয়েছিলে। এটি
              নিয়ম-বহির্ভূত কাজ। এরপর পুনরায় বের হলে পরীক্ষাটি স্বয়ংক্রিয়ভাবে
              বাতিল ও সাবমিট হয়ে যাবে।
            </p>

            <button
              type="button"
              onClick={() => setShowCheatingWarning(false)}
              className="w-full py-3 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm shadow-md shadow-red-600/25 transition cursor-pointer"
            >
              আমি বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}

      {/* Question Reporting Modal */}
      {reportingQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingQuestionId(null)}
          onSubmit={(data) => {
            setReportingQuestionId(null);
            toast.success('রিপোর্ট গ্রহণ করা হয়েছে। ধন্যবাদ!');
          }}
          questionId={reportingQuestionId}
        />
      )}
    </div>
  );
};

export default ExamRunner;
