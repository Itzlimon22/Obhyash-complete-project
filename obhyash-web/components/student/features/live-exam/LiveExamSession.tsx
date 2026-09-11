import React, { useEffect, useState } from "react";
import { AppState, LiveExam } from "@/lib/types";
import { useLiveExamEngine } from "@/hooks/use-live-exam-engine";
import ExamRunner from "@/components/student/features/exam/ExamRunner";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import InitialLoader from "@/components/student/ui/InitialLoader";
import { ExamInstructionsView } from "@/components/student/features/exam/ExamInstructionsView";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import {
  Trophy,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import AppLayout from "@/components/student/ui/layout/AppLayout";

interface LiveExamSessionProps {
  exam: LiveExam;
  onExit: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onViewLeaderboard?: () => void;
  onViewSolutions?: () => void;
  commonLayoutProps?: any;
}

export const LiveExamSession: React.FC<LiveExamSessionProps> = ({
  exam,
  onExit,
  toggleTheme,
  isDarkMode,
  onViewLeaderboard,
  onViewSolutions,
  commonLayoutProps,
}) => {
  const { user } = useAuth();
  const engine = useLiveExamEngine();
  const [navWarning, setNavWarning] = useState({
    isOpen: false,
    targetTab: null as string | null,
    action: "tab" as "tab" | "logout",
  });

  useEffect(() => {
    if (user?.id) {
      engine.startExam(exam, user.id);
    }
  }, [exam, user?.id]);

  // Handle auto-submit on timeout
  useEffect(() => {
    if (engine.appState === AppState.TIMEOUT) {
      if (user?.id) {
        toast.warning("সময় শেষ! উত্তরপত্র জমা দেওয়া হচ্ছে...");
        engine.submitExam(user.id, false);
      }
    }
  }, [engine.appState, user?.id]);

  if (engine.appState === AppState.IDLE || engine.appState === AppState.LOADING) {
    return <InitialLoader />;
  }

  if (engine.appState === AppState.ERROR) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title="ত্রুটি"
        onBack={onExit}
      >
        <div className="flex flex-col items-center justify-center py-20 text-red-500 font-['HindSiliguri']">
          <p className="text-xl font-semibold">পরীক্ষা লোড করতে সমস্যা হয়েছে</p>
          <p className="text-sm mt-1">{engine.errorDetails}</p>
          <button
            onClick={onExit}
            className="mt-4 px-6 py-2.5 bg-[#12544F] text-white rounded-xl font-bold cursor-pointer"
          >
            ফিরে যান
          </button>
        </div>
      </AppLayout>
    );
  }

  if (engine.appState === AppState.INSTRUCTIONS) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title="পরীক্ষার নির্দেশিকা"
        onBack={onExit}
      >
        <ExamInstructionsView
          config={{
            subject: exam.category,
            subjectLabel: exam.title,
            examType: "Live Exam",
            chapters: "All",
            topics: "All",
            difficulty: "Mixed",
            questionCount: exam.total_questions || 0,
            durationMinutes: exam.duration_minutes || 0,
            negativeMarking: exam.negative_marking || 0,
          }}
          onStart={async () => {
            engine.beginTimer();
            return true;
          }}
          onBack={onExit}
          showHeader={false}
        />
      </AppLayout>
    );
  }

  // Post-Live Exam Completed Screen (Rich Summary Card matching Flutter)
  if (engine.appState === AppState.COMPLETED) {
    const totalQuestions = engine.questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let rawScore = 0;
    const negativeRate = exam.negative_marking || 0.25;

    engine.questions.forEach((q) => {
      const ua = engine.userAnswers[q.id];
      const points = q.points ?? 1;
      if (ua !== undefined) {
        const isCorrect =
          ua === q.correctAnswerIndex ||
          (q.correctAnswerIndices && q.correctAnswerIndices.includes(ua));
        if (isCorrect) {
          rawScore += points;
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        skippedCount++;
      }
    });

    const penalty = wrongCount * negativeRate;
    const finalScore = Math.max(0, rawScore - penalty);
    const accuracy =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const totalMarks = engine.questions.reduce(
      (acc, q) => acc + (q.points || 1),
      0
    );

    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title={`${exam.title} - ফলাফল`}
        onBack={onExit}
      >
        <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 font-['HindSiliguri'] pb-24">
          <div className="w-full bg-white dark:bg-[#18181B] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#27272A] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Trophy Icon */}
            <div className="w-20 h-20 rounded-full bg-[#E6F0EC] dark:bg-[#12544F]/20 text-[#12544F] dark:text-[#34D399] mx-auto flex items-center justify-center shadow-md">
              <Trophy size={36} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12544F] dark:text-[#34D399] bg-[#12544F]/10 dark:bg-[#12544F]/25 px-3 py-1 rounded-full">
                লাইভ পরীক্ষা সম্পন্ন
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-2">
                উত্তরপত্র সফলভাবে জমা হয়েছে!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {exam.title}
              </p>
            </div>

            {/* Score Spotlight Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12544F] via-[#0D3E3A] to-[#092328] text-white shadow-lg space-y-2">
              <span className="text-xs text-emerald-200/90 font-bold uppercase tracking-wider">
                প্রাপ্ত নম্বর
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {BanglaNameHelper.toBanglaNumeral(Number(finalScore.toFixed(2)))}
                </span>
                <span className="text-base font-bold text-emerald-200/80">
                  / {BanglaNameHelper.toBanglaNumeral(totalMarks)}
                </span>
              </div>
              {penalty > 0 && (
                <p className="text-xs text-red-200 font-semibold">
                  নেগেটিভ মার্কিং কর্তন: -{BanglaNameHelper.toBanglaNumeral(Number(penalty.toFixed(2)))}
                </p>
              )}
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  সঠিক
                </span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {BanglaNameHelper.toBanglaNumeral(correctCount)}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center">
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">
                  ভুল
                </span>
                <p className="text-xl font-black text-red-700 dark:text-red-300 mt-0.5">
                  {BanglaNameHelper.toBanglaNumeral(wrongCount)}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-[#222226] border border-neutral-200 dark:border-[#2C2C30] text-center">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                  স্কিপড
                </span>
                <p className="text-xl font-black text-neutral-700 dark:text-neutral-300 mt-0.5">
                  {BanglaNameHelper.toBanglaNumeral(skippedCount)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {onViewLeaderboard && (
                <button
                  type="button"
                  onClick={onViewLeaderboard}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#601D49] hover:bg-[#4D173B] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Trophy size={16} />
                  <span>মেধা তালিকা দেখুন</span>
                </button>
              )}

              {onViewSolutions && (
                <button
                  type="button"
                  onClick={onViewSolutions}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#12544F] hover:bg-[#0D3E3A] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <BookOpen size={16} />
                  <span>সমাধান ও ব্যাখ্যা দেখুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExit}
                className="w-full py-3 px-6 rounded-2xl bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>লাইভ এক্সাম তালিকায় ফিরে যান</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <ExamRunner
      appState={engine.appState}
      examDetails={engine.examDetails || null}
      questions={engine.questions}
      userAnswers={engine.userAnswers}
      setUserAnswers={engine.setUserAnswers}
      flaggedQuestions={engine.flaggedQuestions}
      setFlaggedQuestions={engine.setFlaggedQuestions}
      timeLeft={engine.timeLeft}
      isEvaluating={engine.isEvaluating}
      onSubmit={(manual) => {
        if (user?.id) engine.submitExam(user.id, manual);
      }}
      onExit={() =>
        setNavWarning({ isOpen: true, targetTab: null, action: "tab" })
      }
      onTimeoutReattempt={() => {}}
      onTimeoutCancel={onExit}
      setAppState={engine.setAppState}
      navWarning={navWarning}
      setNavWarning={setNavWarning}
      confirmNavigation={onExit}
      currentUser={user as any}
      handleTabChange={() => {}}
      handleLogoutClick={() => {}}
      toggleTheme={toggleTheme}
      isDarkMode={isDarkMode}
      bookmarkedIds={new Set()}
      onToggleBookmark={() => {}}
    />
  );
};

export default LiveExamSession;
