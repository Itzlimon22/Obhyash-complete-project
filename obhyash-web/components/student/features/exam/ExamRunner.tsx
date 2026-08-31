"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  Grid,
  Send,
  AlertTriangle,
  HelpCircle,
  X,
  Check,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { AppState, ExamDetails, Question, UserAnswers, UserProfile } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import ExamGridModal from "@/components/student/ui/exam/ExamGridModal";
import ExamScopeHeader from "@/components/student/ui/exam/ExamScopeHeader";
import ReportModal from "@/components/student/ui/common/ReportModal";
import { cn } from "@/lib/utils";

interface ExamRunnerProps {
  appState: AppState;
  examDetails: ExamDetails | null;
  questions: Question[];
  userAnswers: UserAnswers;
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  flaggedQuestions: Set<number | string>;
  setFlaggedQuestions: React.Dispatch<React.SetStateAction<Set<number | string>>>;
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
  toggleTheme?: any;
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
}) => {
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showCheatingWarning, setShowCheatingWarning] = useState<boolean>(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | number | null>(null);

  const backgroundWarningsRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  // Anti-cheat visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && appState === AppState.ACTIVE && !isSubmittingRef.current) {
        backgroundWarningsRef.current += 1;
        if (backgroundWarningsRef.current === 1) {
          setShowCheatingWarning(true);
        } else if (backgroundWarningsRef.current >= 2) {
          toast.error("নিয়ম ভঙ্গের কারণে পরীক্ষাটি স্বয়ংক্রিয়ভাবে সাবমিট করা হয়েছে!");
          isSubmittingRef.current = true;
          onSubmit(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [appState, onSubmit]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const remainingCount = totalQuestions - answeredCount;

  // Format timer into mm:ss with Bengali numerals
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${BanglaNameHelper.toBanglaNumeral(
    minutes.toString().padStart(2, "0")
  )}:${BanglaNameHelper.toBanglaNumeral(seconds.toString().padStart(2, "0"))}`;

  const isTimerCritical = timeLeft <= 30;
  const isTimerWarning = timeLeft <= 120 && !isTimerCritical;

  const handleOptionSelect = (qId: string | number, optionIndex: number) => {
    setUserAnswers((prev) => {
      // If clicking already selected option, keep it or toggle
      return {
        ...prev,
        [qId]: optionIndex,
      };
    });
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
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    isSubmittingRef.current = true;
    onSubmit(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri'] pb-24">
      {/* ── 1. Floating Sticky Exam Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Exit / Back Button */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition text-xs sm:text-sm font-bold"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">বের হও</span>
          </button>

          {/* Subject & Timer Capsule */}
          <div className="flex items-center gap-2">
            {/* Live Timer */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-sm sm:text-base tracking-wider transition-all duration-300 shadow-sm",
                isTimerCritical
                  ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400 animate-pulse"
                  : isTimerWarning
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400"
              )}
            >
              <Clock size={16} className={isTimerCritical ? "animate-spin" : ""} />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Question Grid Sheet Trigger & Submit Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGridModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-xs sm:text-sm font-bold transition"
            >
              <Grid size={15} />
              <span>
                {BanglaNameHelper.toBanglaNumeral(answeredCount)}/
                {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#004633]/25 transition active:scale-95 disabled:opacity-50"
            >
              <Send size={14} />
              <span>জমা দাও</span>
            </button>
          </div>
        </div>

        {/* Answer Progress Bar Underneath Header */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#004633] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── 2. Main Question Flow Container ── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Subject & Chapters Scope Header */}
        {examDetails && (
          <ExamScopeHeader
            subjectName={BanglaNameHelper.formatSubject(examDetails.subject, examDetails.subjectLabel)}
            chapters={examDetails.chapters ? examDetails.chapters.split(", ") : []}
            topics={examDetails.topics ? examDetails.topics.split(", ") : []}
            initiallyExpanded={false}
          />
        )}

        {/* Questions List */}
        <div className="flex flex-col">
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
                onSelectOption={(optIdx) => handleOptionSelect(question.id, optIdx)}
                onToggleFlag={() => handleToggleFlag(question.id)}
                onToggleBookmark={
                  onToggleBookmark ? () => onToggleBookmark(question.id) : undefined
                }
                onReport={() => setReportingQuestionId(question.id)}
              />
            );
          })}
        </div>

        {/* Bottom Submit Banner */}
        <div className="mt-6 p-6 rounded-3xl bg-white dark:bg-[#131316] border border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center gap-3 shadow-sm">
          <h3 className="text-lg font-black text-neutral-900 dark:text-white">
            সবগুলো প্রশ্নের উত্তর দিয়েছ?
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            উত্তর দেওয়া শেষ হলে নিচের বাটনে ক্লিক করে খাতা জমা দাও।
          </p>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isEvaluating}
            className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-[#004633] hover:bg-[#003828] text-white font-black text-base shadow-lg shadow-[#004633]/30 transition active:scale-95 disabled:opacity-50"
          >
            {isEvaluating ? "মূল্যায়ন হচ্ছে..." : "পরীক্ষা সম্পন্ন ও খাতা জমা দাও"}
          </button>
        </div>
      </main>

      {/* ── 3. Modals & Dialogs ── */}

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

      {/* Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowSubmitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-4">
              খাতা জমা দিবে?
            </h3>

            {/* Stats Snapshot Row */}
            <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50 flex items-center justify-around mb-6">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-0.5">
                  উত্তর দেওয়া
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {BanglaNameHelper.toBanglaNumeral(answeredCount)}/
                  {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
                </span>
              </div>

              <div className="w-[1px] h-8 bg-neutral-200 dark:bg-neutral-700" />

              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-0.5">
                  বাকি আছে
                </span>
                <span
                  className={cn(
                    "text-lg font-black",
                    remainingCount > 0
                      ? "text-red-500 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {BanglaNameHelper.toBanglaNumeral(remainingCount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                না, পরীক্ষা দিবো
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                className="py-3 px-4 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-sm shadow-md shadow-[#004633]/25 transition active:scale-95"
              >
                হ্যাঁ, জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit / Navigation Warning Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowExitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex items-center justify-center mx-auto mb-3.5 text-orange-500">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              সতর্কতা
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              পরীক্ষা চলাকালীন অবস্থায় বের হওয়া যাবে না। বের হতে চাইলে পরীক্ষাটি জমা দিন। আপনি কি
              পরীক্ষা জমা দিয়ে বের হতে চান?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                চালিয়ে যাও
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  confirmSubmit();
                }}
                className="py-3 px-4 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-sm shadow-md shadow-[#004633]/25 transition"
              >
                জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheating / Window Blur Warning Modal */}
      {showCheatingWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#18181B] rounded-3xl p-6 shadow-2xl border border-red-500/30 z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri']">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-3.5 text-red-600">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">
              সতর্কতা!
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              তুমি পরীক্ষা চলাকালীন অন্য ট্যাব বা উইন্ডোতে গিয়েছিলে। এটি নিয়ম-বহির্ভূত। এরপর পুনরায়
              ট্যাব পরিবর্তন করলে পরীক্ষা স্বয়ংক্রিয়ভাবে বাতিল ও সাবমিট হবে।
            </p>

            <button
              type="button"
              onClick={() => setShowCheatingWarning(false)}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/25 transition"
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
            toast.success("রিপোর্ট গ্রহণ করা হয়েছে। ধন্যবাদ!");
          }}
          questionId={reportingQuestionId}
        />
      )}
    </div>
  );
};

export default ExamRunner;
