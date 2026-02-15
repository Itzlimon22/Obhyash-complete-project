import React, { useState, useEffect } from 'react';
import { Question, UserAnswers } from '@/lib/types';

import { useCountUp } from '@/hooks/use-count-up';
import { celebration } from '@/lib/confetti';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

interface ResultViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  timeTaken: number; // in seconds
  onRestart: () => void; // Used as "Back" in history mode
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isHistoryMode?: boolean; // New prop to indicate if we are reviewing past history
  negativeMarking?: number;
  onDownloadQuestionPaper?: () => void;
  onDownloadResultWithExplanations?: () => void;
  submissionType?: 'digital' | 'script';
  onChallengeEvaluation?: () => void;
  initialBookmarks?: Set<number>;
}

const ResultView: React.FC<ResultViewProps> = ({
  questions,
  userAnswers,
  timeTaken,
  onRestart,
  isDarkMode,
  onToggleTheme,
  isHistoryMode = false,
  negativeMarking = 0.25,
  onDownloadQuestionPaper,
  onDownloadResultWithExplanations,
  submissionType,
  onChallengeEvaluation,
  initialBookmarks,
}) => {
  // Local state for bookmarks in result view
  const [bookmarked, setBookmarked] = useState<Set<number>>(
    initialBookmarks || new Set(),
  );

  // State for Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<number | null>(
    null,
  );
  const [reportReason, setReportReason] = useState('');

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

  const submitReport = () => {
    if (reportingQuestionId && reportReason.trim()) {
      console.log(
        `Report submitted for Q${reportingQuestionId}: ${reportReason}`,
      );
      alert('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে!');
      closeReportModal();
    }
  };

  // Logic to calculate final score including Negative Marking
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
        rawScore += q.points ?? 0;
        correctCount++;
      } else {
        wrongCount++;
        // Negative marking calculation based on prop
        negativeMarksDeduction += (q.points ?? 0) * negativeMarking;
      }
    });

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
  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 0), 0);
  const percentage = Math.round((finalScore / totalPoints) * 100);

  // Helper to format time seconds into mm:ss format
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} মি ${secs} সেকেন্ড`;
  };

  const getFeedbackMessage = () => {
    if (isHistoryMode)
      return {
        title: 'ফলাফল পর্যালোচনা',
        text: 'আপনার পূর্ববর্তী পরীক্ষার বিস্তারিত ফলাফল',
      };
    if (percentage >= 90)
      return {
        title: 'অসাধারণ!',
        text: 'আপনি এই বিষয়টি খুব ভালো আয়ত্ত করেছেন।',
      };
    if (percentage >= 70)
      return { title: 'খুব ভালো!', text: 'ভালো ধারণা আছে, চালিয়ে যান।' };
    if (percentage >= 50)
      return { title: 'ভালো প্রচেষ্টা', text: 'আপনি সঠিক পথে আছেন।' };
    return {
      title: 'আরও ভালো করতে হবে',
      text: 'বিষয়টি পুনরায় পড়ে আবার চেষ্টা করুন।',
    };
  };

  const feedback = getFeedbackMessage();

  // Count animations
  const animatedScore = useCountUp(finalScore, 1500);
  const totalXpGained =
    correctCount * 10 + 50 + (correctCount === questions.length ? 100 : 0);
  const animatedXp = useCountUp(totalXpGained, 2000);

  // Trigger Perfect Score Celebration
  useEffect(() => {
    if (
      !isHistoryMode &&
      correctCount === questions.length &&
      questions.length > 0
    ) {
      celebration.perfectScore();
    }
  }, [correctCount, questions.length, isHistoryMode]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in pb-20 relative">
      {/* Header Section */}
      <div className="text-center mb-8 mt-8">
        <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
          {feedback.title}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 text-base md:text-xl">
          {feedback.text}
        </p>

        {/* Challenge Banner for OMR */}
        {submissionType === 'script' &&
          onChallengeEvaluation &&
          !isHistoryMode && (
            <div className="mt-6 max-w-xl mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                  OMR মূল্যায়ন নিয়ে সন্তুষ্ট নন?
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  যান্ত্রিক ত্রুটির কারণে ফলাফল ভুল হতে পারে।
                </p>
              </div>
              <button
                onClick={onChallengeEvaluation}
                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-bold rounded hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                পুনরায় যাচাই করুন
              </button>
            </div>
          )}

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {onDownloadQuestionPaper && (
            <button
              onClick={onDownloadQuestionPaper}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700"
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              প্রশ্নপত্র ডাউনলোড
            </button>
          )}

          {onDownloadResultWithExplanations && (
            <button
              onClick={onDownloadResultWithExplanations}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-100 dark:border-emerald-800"
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              ফলাফল ও ব্যাখ্যা ডাউনলোড
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        {/* Accuracy */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={351}
                strokeDashoffset={351 - (351 * percentage) / 100}
                className={`transition-all duration-1000 ease-out ${percentage >= 70 ? 'text-emerald-500' : percentage >= 40 ? 'text-amber-500' : 'text-red-500'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-neutral-800 dark:text-white">
                {percentage}%
              </span>
            </div>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-semibold text-lg">
            সঠিকতা
          </div>
        </div>

        {/* Points */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002"
              />
            </svg>
          </div>
          <div className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">
            {animatedScore.toFixed(1)}{' '}
            <span className="text-lg text-neutral-500 dark:text-neutral-400 font-normal">
              / {totalPoints}
            </span>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-semibold text-lg">
            প্রাপ্ত নম্বর
          </div>
        </div>

        {/* XP Gained */}
        <div
          className={`bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border ${correctCount === questions.length && questions.length > 0 ? 'border-amber-400 dark:border-amber-600 bg-amber-50/10' : 'border-neutral-200 dark:border-neutral-800'} flex flex-col items-center justify-center transition-colors relative overflow-hidden group`}
        >
          <div
            className={`absolute top-0 right-0 w-16 h-16 ${correctCount === questions.length && questions.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/5'} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform`}
          />
          <div
            className={`w-16 h-16 rounded-full ${correctCount === questions.length && questions.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'} flex items-center justify-center mb-4 dark:text-emerald-400`}
          >
            {correctCount === questions.length && questions.length > 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            )}
          </div>
          <div
            className={`text-3xl font-bold ${correctCount === questions.length && questions.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-800 dark:text-white'} mb-1`}
          >
            +{animatedXp}
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-semibold text-lg flex items-center gap-1">
            XP অর্জিত
          </div>
        </div>

        {/* Time */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="text-xl font-bold text-neutral-800 dark:text-white mb-1 text-center">
            {formatDuration(timeTaken)}
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-semibold text-lg">
            সময় লেগেছে
          </div>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <div className="mb-12 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
            ফলাফল বিস্তারিত
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800 text-sm md:text-base">
          {/* Left Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                মোট প্রশ্ন
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {questions.length}
              </span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                উত্তর দেওয়া হয়েছে
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {correctCount + wrongCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                উত্তর দেওয়া হয়নি
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {skippedCount}
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                সঠিক উত্তর
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20">
              <span className="font-medium text-red-600 dark:text-red-400">
                ভুল উত্তর
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {wrongCount}
              </span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 bg-red-50/50 dark:bg-red-900/10">
              <span className="font-medium text-red-700 dark:text-red-300">
                নেগেটিভ মার্কিং ({negativeMarking}x)
              </span>
              <span className="font-bold text-red-700 dark:text-red-300">
                -{negativeMarksDeduction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Score Footer */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 px-6 py-5 flex justify-between items-center">
          <span className="font-bold text-lg md:text-xl text-neutral-900 dark:text-white">
            মোট প্রাপ্ত নম্বর
          </span>
          <span className="font-bold text-lg md:text-xl text-emerald-600 dark:text-emerald-400">
            {finalScore.toFixed(2)} / {totalPoints}
          </span>
        </div>
      </div>

      {/* Review Section */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">
            উত্তরপত্র পর্যালোচনা
          </h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                সঠিক
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                ভুল
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const questionId = typeof q.id === 'string' ? parseInt(q.id) : q.id;
            return (
              <QuestionCard
                key={q.id}
                question={q}
                serialNumber={idx + 1}
                selectedOptionIndex={userAnswers[q.id]}
                isFlagged={bookmarked.has(questionId)}
                onSelectOption={() => {}} // Read-only
                onToggleFlag={() => toggleBookmark(questionId)}
                onReport={() => openReportModal(questionId)}
                readOnly={true}
                showFeedback={true}
                // showAnswer={true} // showFeedback implies showing answers/correctness
              />
            );
          })}
        </div>
      </div>

      {/* Restart/Back Button */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isHistoryMode ? (
            <>
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
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
              </svg>
              ইতিহাসে ফিরে যান
            </>
          ) : (
            <>
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              নতুন পরীক্ষা শুরু করুন
            </>
          )}
        </button>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-neutral-100 dark:border-neutral-800 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              প্রশ্ন {reportingQuestionId} রিপোর্ট করুন
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-4">
              অনুগ্রহ করে সমস্যাটির কারণ উল্লেখ করুন:
            </p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="যেমন: সঠিক উত্তরটি ভুল, অথবা প্রশ্নে বানান ভুল আছে..."
              className="w-full h-32 p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none resize-none mb-6 text-base"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeReportModal}
                className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason.trim()}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                জমা দিন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
