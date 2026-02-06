import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Question, UserAnswers } from '@/lib/types';
import ResultStats from './ResultStats';
import ReviewList from './ReviewList';

interface ResultViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  timeTaken: number; // in seconds
  // onRestart: () => void; // Used as "Back" in history mode
  // onToggleTheme: () => void;
  isHistoryMode?: boolean; // New prop to indicate if we are reviewing past history
  negativeMarking?: number;
  onDownloadQuestionPaper?: () => void;
  onDownloadResultWithExplanations?: () => void;
  submissionType?: 'digital' | 'script';
  onChallengeEvaluation?: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({
  questions,
  userAnswers,
  timeTaken,
  // onToggleTheme,
  isHistoryMode = false,
  negativeMarking = 0.25,
  onDownloadQuestionPaper,
  onDownloadResultWithExplanations,
  submissionType,
  onChallengeEvaluation,
}) => {
  // Local state for bookmarks in result view
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  // State for Report Modal (User feedback on questions)
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<number | null>(
    null,
  );
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState<string>('Wrong Answer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleBookmark = (id: number) => {
    setBookmarked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openReportModal = (id: number) => {
    setReportingQuestionId(id);
    setReportReason('');
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingQuestionId(null);
  };

  const submitReport = async () => {
    if (!reportingQuestionId || !reportReason.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('রিপোর্ট করার জন্য লগইন প্রয়োজন।');
        return;
      }

      const { error } = await supabase.from('reports').insert({
        question_id: reportingQuestionId.toString(),
        reporter_id: user.id,
        reason: reportCategory,
        description: reportReason,
        status: 'Pending',
        severity: 'Medium',
      });

      if (error) throw error;

      toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে! আমরা শীঘ্রই যাচাই করব।');
      closeReportModal();
    } catch (error) {
      console.error('Report submission failed:', error);
      toast.error('দুঃখিত, রিপোর্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Logic to calculate final score including Negative Marking ---
  const calculateStats = () => {
    let rawScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let negativeMarksDeduction = 0;

    questions.forEach((q) => {
      const ua = userAnswers[q.id];
      if (ua === undefined) {
        skippedCount++;
      } else if (ua === q.correctAnswerIndex) {
        rawScore += q.points ?? 1;
        correctCount++;
      } else {
        wrongCount++;
        // Negative marking calculation based on prop
        negativeMarksDeduction += (q.points ?? 1) * negativeMarking;
      }
    });

    // Score cannot be negative
    const finalScore = Math.max(0, rawScore - negativeMarksDeduction);
    return {
      rawScore,
      finalScore,
      correctCount,
      wrongCount,
      skippedCount,
      negativeMarksDeduction,
    };
  };

  const {
    finalScore,
    correctCount,
    wrongCount,
    skippedCount,
    negativeMarksDeduction,
  } = calculateStats();
  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);
  const percentage = Math.round((finalScore / totalPoints) * 100);

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 animate-fade-in pb-20 relative">
      {/* Header Section (Compact) */}
      <div className="mb-6">
        {/* Challenge Banner for OMR (Manual Recheck Request) */}
        {submissionType === 'script' &&
          onChallengeEvaluation &&
          !isHistoryMode && (
            <div className="mb-4 max-w-xl mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <h4 className="font-bold text-amber-800 dark:text-amber-200 text-xs md:text-sm">
                  OMR মূল্যায়ন নিয়ে সন্তুষ্ট নন?
                </h4>
                <p className="text-[10px] md:text-xs text-amber-700 dark:text-amber-300">
                  যান্ত্রিক ত্রুটির কারণে ফলাফল ভুল হতে পারে।
                </p>
              </div>
              <button
                onClick={onChallengeEvaluation}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold rounded hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                পুনরায় যাচাই করুন
              </button>
            </div>
          )}

        {/* Action Buttons: Question Paper & Result Download */}
        <div className="flex flex-row justify-center gap-2 w-full max-w-lg mx-auto">
          {onDownloadQuestionPaper && (
            <button
              onClick={onDownloadQuestionPaper}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-2 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700 whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              প্রশ্নপত্র
            </button>
          )}

          {onDownloadResultWithExplanations && (
            <button
              onClick={onDownloadResultWithExplanations}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800 whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              ফলাফল ও ব্যাখ্যা
            </button>
          )}
        </div>
      </div>

      {/* Core Components: Stats and Question Review */}
      <ResultStats
        percentage={percentage}
        finalScore={finalScore}
        totalPoints={totalPoints}
        timeTaken={timeTaken}
        totalQuestions={questions.length}
        correctCount={correctCount}
        wrongCount={wrongCount}
        skippedCount={skippedCount}
        negativeMarking={negativeMarking}
        negativeMarksDeduction={negativeMarksDeduction}
      />

      <ReviewList
        questions={questions}
        userAnswers={userAnswers}
        bookmarked={bookmarked}
        toggleBookmark={toggleBookmark}
        openReportModal={openReportModal}
      />

      {/* Modal: Report Question Issue */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full p-5 border border-neutral-100 dark:border-neutral-800 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              প্রশ্ন {reportingQuestionId} রিপোর্ট করুন
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              অনুগ্রহ করে সমস্যাটির কারণ উল্লেখ করুন:
            </p>

            <div className="mb-3">
              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                সমস্যার ধরন
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-black text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Wrong Answer">ভুল উত্তর (Wrong Answer)</option>
                <option value="Typo/Grammar">বানান ভুল (Typo/Grammar)</option>
                <option value="Inappropriate Content">
                  অপ্রাসঙ্গিক (Inappropriate)
                </option>
                <option value="Other">অন্যান্য (Other)</option>
              </select>
            </div>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="বিস্তারিত বর্ণনা করুন..."
              className="w-full h-24 p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none resize-none mb-4 text-sm"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeReportModal}
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason.trim() || isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-2"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
