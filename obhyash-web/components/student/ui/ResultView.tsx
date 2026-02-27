import React, { useState, useEffect } from 'react';
import { Question, UserAnswers, UserProfile } from '@/lib/types';

import { useCountUp } from '@/hooks/use-count-up';
import { celebration } from '@/lib/confetti';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ReportModal from '@/components/student/ui/common/ReportModal';

interface ResultViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  timeTaken: number; // in seconds
  onRestart: () => void; // Used as "Back" in history mode
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isHistoryMode?: boolean;
  negativeMarking?: number;
  onDownloadQuestionPaper?: () => void;
  onDownloadResultWithExplanations?: () => void;
  submissionType?: 'digital' | 'script';
  onChallengeEvaluation?: () => void;
  /** @deprecated use bookmarkedIds instead */
  initialBookmarks?: Set<number | string>;
  currentUser?: UserProfile | null;
  /** DB-synced bookmark set from useBookmarks hook */
  bookmarkedIds?: Set<string>;
  /** Toggle a bookmark via useBookmarks hook */
  onToggleBookmark?: (questionId: string | number) => void;
  examDetails?: any;
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
  currentUser,
  bookmarkedIds,
  onToggleBookmark,
  examDetails,
}) => {
  // State for Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<
    number | string | null
  >(null);

  const openReportModal = (id: number | string) => {
    setReportingQuestionId(id);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingQuestionId(null);
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
      text: 'বিষয়টি পুনরায় পড়ে আবার চেষ্টা করো।',
    };
  };

  const feedback = getFeedbackMessage();

  // Count animations
  const animatedScore = useCountUp(finalScore, 1500);

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
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-8 animate-fade-in pb-20 relative">
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
            <div className="mt-6 max-w-xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="font-bold text-red-800 dark:text-red-200 text-sm">
                  OMR মূল্যায়ন নিয়ে সন্তুষ্ট নন?
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300">
                  যান্ত্রিক ত্রুটির কারণে ফলাফল ভুল হতে পারে।
                </p>
              </div>
              <button
                onClick={onChallengeEvaluation}
                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-bold rounded hover:bg-red-100 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                পুনরায় যাচাই করো
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
      {/* Exam Details Section */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 border-y sm:border border-neutral-100 dark:border-neutral-800 py-3.5 mb-8 -mx-2 sm:mx-0 px-2 sm:px-4 sm:rounded-2xl flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] sm:text-xs md:text-sm font-bold text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"
            />
          </svg>
          {examDetails?.subjectLabel || 'বিষয়'}
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          {isHistoryMode ? 'ইতিহাস' : 'আজকের পরীক্ষা'}
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
          মোট প্রশ্ন: {questions.length}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-12">
        {/* Accuracy */}
        <div className="bg-white dark:bg-neutral-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="relative w-16 h-16 sm:w-32 sm:h-32 flex items-center justify-center mb-2 sm:mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={283}
                strokeDashoffset={283 - (283 * percentage) / 100}
                className={`transition-all duration-1000 ease-out ${percentage >= 70 ? 'text-emerald-500' : percentage >= 40 ? 'text-red-500' : 'text-red-500'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm sm:text-3xl font-bold text-neutral-800 dark:text-white">
                {percentage}%
              </span>
            </div>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-[10px] sm:text-lg">
            সঠিকতা
          </div>
        </div>

        {/* Points */}
        <div className="bg-white dark:bg-neutral-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 sm:mb-4 text-red-600 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-8 sm:h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002"
              />
            </svg>
          </div>
          <div className="text-sm sm:text-3xl font-bold text-neutral-800 dark:text-white mb-0.5">
            {animatedScore.toFixed(1)}{' '}
            <span className="text-[10px] sm:text-lg text-neutral-500 dark:text-neutral-400 font-normal">
              / {totalPoints}
            </span>
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-[10px] sm:text-lg">
            প্রাপ্ত নম্বর
          </div>
        </div>

        {/* Time taken replaced XP gained */}
        <div className="bg-white dark:bg-neutral-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center transition-colors">
          <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2 sm:mb-4 text-emerald-600 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-8 sm:h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="text-[10px] sm:text-xl font-bold text-neutral-800 dark:text-white mb-0.5 text-center">
            {formatDuration(timeTaken)}
          </div>
          <div className="text-neutral-600 dark:text-neutral-300 font-bold text-[10px] sm:text-lg">
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
            const questionId = q.id;
            return (
              <QuestionCard
                key={q.id}
                question={q}
                serialNumber={idx + 1}
                selectedOptionIndex={userAnswers[q.id]}
                isFlagged={false}
                onSelectOption={() => {}} // Read-only
                onToggleFlag={() => {}}
                onReport={() => openReportModal(questionId)}
                readOnly={true}
                showFeedback={true}
                isBookmarked={
                  bookmarkedIds ? bookmarkedIds.has(String(questionId)) : false
                }
                onToggleBookmark={
                  onToggleBookmark
                    ? () => onToggleBookmark(questionId)
                    : undefined
                }
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
              নতুন পরীক্ষা শুরু করো
            </>
          )}
        </button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        onSubmit={() => {}} // Internal submission used
        questionId={reportingQuestionId}
        reporterId={currentUser?.id}
        reporterName={currentUser?.name}
      />
    </div>
  );
};

export default ResultView;
