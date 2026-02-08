import React, { useState } from 'react';

// ... imports ...
import AppLayout from '@/components/student/ui/layout/AppLayout';
import ExamHeader from '@/components/student/ui/ExamHeader';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

// Common Modals (Moved to student/ui/common)
import ConfirmationModal from '@/components/student/ui/common/ConfirmationModal';
import TimeoutModal from '@/components/student/ui/common/TimeoutModal';
import ReportModal from '@/components/student/ui/common/ReportModal';
import NavigationWarningModal from '@/components/student/ui/common/NavigationWarningModal';

// Features / Results
import ScriptUploader from '@/components/student/ui/ScriptUploader';
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal'; // Added

// Data & Services
import {
  AppState,
  ExamDetails,
  Question,
  UserAnswers,
  UserProfile,
} from '@/lib/types';
import { printQuestionPaper } from '@/services/print-service'; // Removed printOMRSheet

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
  flaggedQuestions: Set<number>;
  /** State setter for flagged questions */
  setFlaggedQuestions: React.Dispatch<React.SetStateAction<Set<number>>>;
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
    action: 'tab' | 'logout';
  };
  /** Setter for navigation warning state */
  setNavWarning: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      targetTab: string | null;
      action: 'tab' | 'logout';
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
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOmrPrintModalOpen, setIsOmrPrintModalOpen] = useState(false); // New State
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    questionId: number | null;
  }>({ isOpen: false, questionId: null });

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
    console.log('Report:', data);
    alert('রিপোর্ট জমা নেওয়া হয়েছে। ধন্যবাদ!');
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
      customHeader={
        <ExamHeader
          details={examDetails}
          timeLeft={timeLeft}
          graceTimeLeft={graceTimeLeft}
          appState={appState}
          isOmrMode={isOmrMode}
          onToggleOmr={() => setIsOmrMode(!isOmrMode)}
          onDownloadQuestionPaper={() =>
            printQuestionPaper(examDetails, questions)
          }
          onDownloadOMR={() => setIsOmrPrintModalOpen(true)} // Updated
          onExit={() => setIsSubmitModalOpen(true)}
          answeredCount={Object.keys(userAnswers).length}
          totalQuestions={questions.length}
        />
      }
    >
      <div className="relative min-h-full flex flex-col bg-[#f8fafc] dark:bg-black">
        {/* Exam Container (Scrollable) */}
        <div className="flex-1 px-4 py-6 md:px-8 max-w-4xl mx-auto w-full">
          {/* Header Info */}
          <div className="flex justify-between items-center mb-6 text-sm text-neutral-500 dark:text-neutral-400 font-medium sticky top-0 bg-[#f8fafc] dark:bg-black z-10 py-2 border-b border-neutral-200 dark:border-neutral-800">
            <span>মোট: {questions.length} টি প্রশ্ন</span>
            <span>উত্তর দেওয়া: {Object.keys(userAnswers).length}</span>
          </div>

          <div className="space-y-6">
            {questions.map((q) => {
              const questionId =
                typeof q.id === 'string' ? parseInt(q.id) : q.id;
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedOptionIndex={userAnswers[q.id]}
                  isFlagged={flaggedQuestions.has(questionId)}
                  onSelectOption={(optIdx) =>
                    setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                  }
                  onToggleFlag={() =>
                    setFlaggedQuestions((prev) => {
                      const next = new Set(prev);
                      if (next.has(questionId)) next.delete(questionId);
                      else next.add(questionId);
                      return next;
                    })
                  }
                  onReport={() =>
                    setReportModalState({
                      isOpen: true,
                      questionId:
                        typeof q.id === 'string' ? parseInt(q.id) : q.id,
                    })
                  }
                  isOmrMode={isOmrMode}
                />
              );
            })}
          </div>
        </div>

        {/* Sticky Footer for Submit */}
        <div className="sticky bottom-0 left-0 right-0 py-4 px-4 bg-white/90 dark:bg-black/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-3xl mx-auto flex justify-center">
            {isOmrMode ? (
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`flex-1 sm:flex-none px-4 py-3 rounded-xl font-bold text-sm border transition-colors flex items-center justify-center gap-2 ${selectedScript ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                  </svg>
                  {selectedScript ? 'স্ক্রিপ্ট সংযুক্ত' : 'OMR ক্যাপচার'}
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedScript}
                  className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  স্ক্রিপ্ট জমা দিন
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmitRequest}
                className="w-full sm:w-auto min-w-[200px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-base py-3 px-8 rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                পরীক্ষা শেষ করুন
              </button>
            )}
          </div>
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
          <div className="fixed bottom-20 right-4 z-50 bg-amber-100 dark:bg-amber-900 border border-amber-300 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg shadow-lg animate-bounce">
            সময় শেষ! অনুগ্রহ করে এখনই জমা দিন।
          </div>
        )}

        <ReportModal
          isOpen={reportModalState.isOpen}
          onClose={() =>
            setReportModalState({ isOpen: false, questionId: null })
          }
          onSubmit={handleReportSubmit}
          questionId={reportModalState.questionId}
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

        {/* OMR Print Modal */}
        <OmrPrintModal
          isOpen={isOmrPrintModalOpen}
          onClose={() => setIsOmrPrintModalOpen(false)}
          details={examDetails}
          totalQuestions={questions.length}
        />
      </div>
    </AppLayout>
  );
};

export default ExamRunner;
