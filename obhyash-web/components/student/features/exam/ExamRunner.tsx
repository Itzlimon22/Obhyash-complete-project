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

  /** Whether the exam is currently being submitted/evaluated */
  isEvaluating?: boolean;
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

  isEvaluating,
  onSubmit,
  onExit,
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
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    questionId: number | string | null;
  }>({ isOpen: false, questionId: null });
  // (bookmark fetching has been moved to the useBookmarks hook in StudentRoot)

  // ... (Handlers) ...
  const handleSubmitRequest = () => {
    const unanswered = questions.length - Object.keys(userAnswers).length;

    // Direct submit if all answered
    if (unanswered === 0) {
      handleConfirmSubmit();
    } else {
      // Show confirmation modal for incomplete exams
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
      isEvaluating={isEvaluating}
      onSubmit={handleSubmitRequest}
      title=""
      customHeader={
        <ExamHeader
          details={examDetails}
          timeLeft={timeLeft}
          graceTimeLeft={graceTimeLeft}
          appState={appState}
          onDownloadQuestionPaper={() => downloadQuestionPaper(examDetails, questions)}
          onDownloadOMR={() => downloadOMRSheet(examDetails, questions.length)}
          onExit={onExit}
          totalQuestions={questions.length}
          answeredCount={Object.keys(userAnswers).length}
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

          <div className="space-y-8">
            {Object.entries(
              questions.reduce((acc, q, idx) => {
                const subject = q.subject || "General";
                if (!acc[subject]) acc[subject] = [];
                acc[subject].push({ q, idx });
                return acc;
              }, {} as Record<string, { q: Question; idx: number }[]>)
            ).map(([subject, subjectQuestions]) => (
              <div key={subject} className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-wider">{subject}</h3>
                </div>
                <div className="space-y-6">
                  {subjectQuestions.map(({ q, idx }) => {
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
                        hideMetadata={true}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer for Submit - HIDDEN ON MOBILE (moved to bottom nav) */}
        <div className="sticky bottom-0 left-0 right-0 hidden sm:block z-40">
          <div className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.08)]">
            <div className="max-w-4xl mx-auto px-6 pt-3 pb-0 flex items-center justify-end gap-4">
                <button
                  onClick={handleSubmitRequest}
                  disabled={isEvaluating}
                  title="পরীক্ষা শেষ করো"
                  className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all active:scale-[0.97] group"
                >
                  {isEvaluating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
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
                  )}
                  পরীক্ষা শেষ করো
                </button>
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
          isEvaluating={isEvaluating}
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
