import React, { useEffect, useState } from "react";
import { AppState, LiveExam } from "@/lib/types";
import { useLiveExamEngine } from "@/hooks/use-live-exam-engine";
import ExamRunner from "@/components/student/features/exam/ExamRunner";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import InitialLoader from "@/components/student/ui/InitialLoader";
import ResultView from "@/components/student/ui/ResultView";
import { ExamInstructionsView } from "@/components/student/features/exam/ExamInstructionsView";

interface LiveExamSessionProps {
  exam: LiveExam;
  onExit: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const LiveExamSession: React.FC<LiveExamSessionProps> = ({
  exam,
  onExit,
  toggleTheme,
  isDarkMode,
}) => {
  const { user } = useAuth();
  const engine = useLiveExamEngine();
  const [navWarning, setNavWarning] = useState({ isOpen: false, targetTab: null as string | null, action: "tab" as "tab" | "logout" });

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
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p className="text-xl font-semibold">Error loading exam</p>
        <p>{engine.errorDetails}</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  if (engine.appState === AppState.INSTRUCTIONS) {
    return (
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
      />
    );
  }

  if (engine.appState === AppState.COMPLETED) {
    // Show ResultView but we need to fetch the attempt details from server or pass mock result
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 dark:bg-green-950 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-6 shadow-xl shadow-green-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">পরীক্ষা সম্পন্ন হয়েছে!</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">তোমার উত্তরপত্র সফলভাবে জমা দেওয়া হয়েছে।</p>
          <button onClick={onExit} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
            ফিরে যান
          </button>
        </div>
      </div>
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
      graceTimeLeft={engine.graceTimeLeft}
      isEvaluating={engine.isEvaluating}
      onSubmit={(manual) => {
        if (user?.id) engine.submitExam(user.id, manual);
      }}
      onExit={() => setNavWarning({ isOpen: true, targetTab: null, action: "tab" })}
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
