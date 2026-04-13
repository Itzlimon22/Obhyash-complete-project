import React, { useState } from "react";

import AppLayout from "@/components/student/ui/layout/AppLayout";
import ExamHeader from "@/components/student/ui/ExamHeader";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import ExamDetailsCard from "@/components/student/ui/exam/ExamDetailsCard";

import { toast } from "sonner";

// Common Modals (Moved to student/ui/common)
import ConfirmationModal from "@/components/student/ui/common/ConfirmationModal";
import TimeoutModal from "@/components/student/ui/common/TimeoutModal";
import ReportModal from "@/components/student/ui/common/ReportModal";
import NavigationWarningModal from "@/components/student/ui/common/NavigationWarningModal";

// Features / Results
import ScriptUploader from "@/components/student/ui/ScriptUploader";

// Data & Services
import {
  AppState,
  ExamDetails,
  Question,
  UserAnswers,
  UserProfile,
} from "@/lib/types";
import {
  downloadQuestionPaper,
  downloadOMRSheet,
} from "@/services/download-service";

/**
 * Props for the ExamRunner component.
 * Manages the state and interaction for an active exam session.
 */
interface ExamRunnerProps {
  /** Current state of the application (e.g., ACTIVE, TIMEOUT, COMPLETED) */
  appState: AppState;
  /** Logic and metadata for the current exam */
  examDetails: ExamDetails | null;
  /** List of questions for the exam */
  questions: Question[];
  /** Map of question IDs to user selected option indices */
  userAnswers: UserAnswers;
  /** State setter for user answers */
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  /** Set of question IDs marked for review */
  flaggedQuestions: Set<number | string>;
  /** State setter for flagged questions */
  setFlaggedQuestions: React.Dispatch<
    React.SetStateAction<Set<number | string>>
  >;
  /** Remaining time in seconds */
  timeLeft: number;
  /** Grace period time remaining in seconds (for OMR upload) */
  graceTimeLeft: number;
  /** Whether the exam is in OMR (Offline) mode */
  isOmrMode: boolean;
  /** Toggle function for OMR mode */
  setIsOmrMode: (mode: boolean) => void;
  /** The selected OMR script file and its base64 representation */
  selectedScript: { file: File; base64: string } | null;
  /** Setter for the selected OMR script */
  setSelectedScript: (script: { file: File; base64: string } | null) => void;
  /** Function to handle exam submission */
  onSubmit: (manual?: boolean) => void;
  /** Function to handle exit (unused in this component but passed down) */
  onExit: () => void;
  /** Function to reattempt exam after timeout */
  onTimeoutReattempt: () => void;
  /** Function to cancel exam after timeout */
  onTimeoutCancel: () => void;
  /** Function to update application state */
  setAppState: (state: AppState) => void;
  /** State object for navigation warning modal */
  navWarning: {
    isOpen: boolean;
    targetTab: string | null;
    action: "tab" | "logout";
  };
  /** Setter for navigation warning state */
  setNavWarning: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      targetTab: string | null;
      action: "tab" | "logout";
    }>
  >;
  /** Function to confirm navigation away from exam */
  confirmNavigation: () => void;
  /** Currently logged-in user profile */
  currentUser: UserProfile | null;
  /** Handler for tab navigation */
  handleTabChange: (tab: string) => void;
  /** Handler for logout action */
  handleLogoutClick: () => void;
  /** Handler to toggle theme */
  toggleTheme: () => void;
  /** Current theme state */
  isDarkMode: boolean;
  /** Set of bookmarked question IDs (from useBookmarks hook — separate from exam flags) */
  bookmarkedIds: Set<string>;
  /** Toggle a bookmark in the DB and update state */
  onToggleBookmark: (questionId: string | number) => void;
}

const ExamRunner: React.FC<ExamRunnerProps> = ({
  appState,
  examDetails,
  questions,
  userAnswers,
  setUserAnswers,
  flaggedQuestions,
  setFlaggedQuestions,
  timeLeft,
  graceTimeLeft,
  isOmrMode,
  setIsOmrMode,
  selectedScript,
  setSelectedScript,
  onSubmit,
  onTimeoutReattempt,
  onTimeoutCancel,
  navWarning,
  setNavWarning,
  confirmNavigation,
  currentUser,
  handleTabChange,
  handleLogoutClick,
  toggleTheme,
  isDarkMode,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    questionId: number | string | null;
  }>({ isOpen: false, questionId: null });
  // (bookmark fetching has been moved to the useBookmarks hook in StudentRoot)

  // ... (Handlers) ...
  const handleSubmitRequest = () => {
    if (isOmrMode && !selectedScript) {
      setIsUploadModalOpen(true);
      return;
    }
    const unanswered = questions.length - Object.keys(userAnswers).length;
    if (!isOmrMode && unanswered > 0) {
      setIsSubmitModalOpen(true);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handleConfirmSubmit = () => {
    onSubmit(true);
    setIsSubmitModalOpen(false);
  };

  const handleReportSubmit = (data: Record<string, unknown>) => {
    console.log("Report:", data);
    toast.success("রিপোর্ট জমা নেওয়া হয়েছে। ধন্যবাদ!");
  };

  if (!examDetails) return null;

  return (
    <AppLayout
      activeTab="setup"
      user={(currentUser as UserProfile) || undefined}
      onTabChange={handleTabChange}
      onLogout={handleLogoutClick}
      toggleTheme={toggleTheme}
      isDarkMode={isDarkMode}
      noPadding={true}
      isLiveExam={true}
      onSubmit={handleSubmitRequest}
      isOmrMode={isOmrMode}
      onUpload={() => setIsUploadModalOpen(true)}
      hasSelectedScript={!!selectedScript}
      customHeader={
        <ExamHeader
          details={examDetails}
          timeLeft={timeLeft}
          graceTimeLeft={graceTimeLeft}
          appState={appState}
          isOmrMode={isOmrMode}
          onToggleOmr={() => {
            toast.info("OMR মোড শীঘ্রই উপলব্ধ হবে।");
            setIsOmrMode(false);
          }}
          onDownloadQuestionPaper={() =>
            downloadQuestionPaper(examDetails, questions)
          }
          onDownloadOMR={() => downloadOMRSheet(examDetails, questions.length)}
          onExit={() => setIsSubmitModalOpen(true)}
          answeredCount={Object.keys(userAnswers).length}
          totalQuestions={questions.length}
        />
      }
    >
      <div className="relative min-h-full flex flex-col bg-[#f8fafc] dark:bg-black">
        {/* Exam Container (Scrollable) */}
        <div className="flex-1 px-2 py-4 md:px-8 max-w-4xl mx-auto w-full">
          {/* Header Info - REPLACED with ExamDetailsCard */}
          <ExamDetailsCard
            details={examDetails}
            totalQuestions={questions.length}
            negativeMarking={examDetails.negativeMarking || 0.25}
          />

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const questionId = q.id;
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  serialNumber={idx + 1}
                  selectedOptionIndex={userAnswers[q.id]}
                  isFlagged={flaggedQuestions.has(questionId)}
                  onSelectOption={(optIdx) =>
                    setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                  }
                  onToggleFlag={() => {
                    // Toggles the EXAM FLAG (mark for review) -- separate from bookmarks
                    setFlaggedQuestions((prev) => {
                      const next = new Set(prev);
                      if (next.has(questionId)) next.delete(questionId);
                      else next.add(questionId);
                      return next;
                    });
                  }}
                  isBookmarked={bookmarkedIds.has(String(questionId))}
                  onToggleBookmark={() => onToggleBookmark(questionId)}
                  onReport={() =>
                    setReportModalState({
                      isOpen: true,
                      questionId: q.id,
                    })
                  }
                  isOmrMode={isOmrMode}
                  hideMetadata={true}
                />
              );
            })}
          </div>
        </div>

        {/* Sticky Footer for Submit - HIDDEN ON MOBILE (moved to bottom nav) */}
        <div className="sticky bottom-0 left-0 right-0 hidden sm:block z-40">
          <div className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.08)]">
            <div className="max-w-4xl mx-auto px-6 pt-3 pb-0 flex items-center justify-between gap-4">
              {/* Left: mini answered summary */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="hidden md:flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      অগ্রগতি
                    </span>
                    <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {Object.keys(userAnswers).length}/{questions.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        Object.keys(userAnswers).length === questions.length
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${questions.length > 0 ? Math.round((Object.keys(userAnswers).length / questions.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {questions.length - Object.keys(userAnswers).length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                    <span className="text-xs font-bold">
                      {questions.length - Object.keys(userAnswers).length}টি
                      উত্তর বাকি
                    </span>
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              {isOmrMode ? (
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all active:scale-[0.97] ${
                      selectedScript
                        ? "border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                      />
                    </svg>
                    {selectedScript ? "স্ক্রিপ্ট পরিবর্তন" : "OMR ক্যাপচার"}
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={!selectedScript}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.97]"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    স্ক্রিপ্ট জমা দাও
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubmitRequest}
                  className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all active:scale-[0.97] group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  পরীক্ষা শেষ করো
                </button>
              )}
            </div>
          </div>

          {/* Grace period urgency strip */}
          {appState === AppState.GRACE_PERIOD && (
            <div className="bg-red-600 text-white py-1.5 px-6 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              সময় শেষ! গ্রেস পিরিয়ড চলছে — এখনই জমা দাও
            </div>
          )}
        </div>

        {/* Modals */}
        <ConfirmationModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirm={handleConfirmSubmit}
          unansweredCount={questions.length - Object.keys(userAnswers).length}
          isOmrMode={isOmrMode}
        />
        <ScriptUploader
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSelect={(file, base64) => {
            setSelectedScript({ file, base64 });
            setIsUploadModalOpen(false);
          }}
        />
        {/* Using direct modal rendering or portal would be better, but keeping inline for simplicity with existing architecture */}
        {appState === AppState.GRACE_PERIOD && (
          <div className="fixed bottom-20 right-4 z-50 bg-red-100 dark:bg-red-900 border border-red-300 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg animate-bounce">
            সময় শেষ! তাড়াতাড়ি জমা দাও।
          </div>
        )}

        <ReportModal
          isOpen={reportModalState.isOpen}
          onClose={() =>
            setReportModalState({ isOpen: false, questionId: null })
          }
          onSubmit={() => {}} // Internal submission used
          questionId={reportModalState.questionId}
          reporterId={currentUser?.id}
          reporterName={currentUser?.name}
        />
        <NavigationWarningModal
          isOpen={navWarning.isOpen}
          onClose={() => setNavWarning({ ...navWarning, isOpen: false })}
          onConfirm={confirmNavigation}
        />

        {/* ✅ ADDED: Timeout Modal Connection */}
        {appState === AppState.TIMEOUT && (
          <TimeoutModal
            onReattempt={onTimeoutReattempt}
            onCancel={onTimeoutCancel}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ExamRunner;
