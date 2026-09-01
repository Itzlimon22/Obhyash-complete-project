'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserAnswers, UserProfile } from '@/lib/types';
import { celebration } from '@/lib/confetti';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ExamScopeHeader from '@/components/student/ui/exam/ExamScopeHeader';
import ResultStats from '@/components/student/ui/exam/ResultStats';
import ReportModal from '@/components/student/ui/common/ReportModal';
import ProUpgradeModal from '@/components/common/ProUpgradeModal';
import {
  downloadQuestionPaper,
  downloadResultWithExplanations,
} from '@/services/download-service';
import { supabase } from '@/services/core';
import {
  X,
  ArrowLeft,
  Download,
  CheckCircle2,
  Check,
  Bookmark,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ResultViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  timeTaken: number; // in seconds
  onRestart: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  isHistoryMode?: boolean;
  negativeMarking?: number;
  onDownloadQuestionPaper?: () => void;
  onDownloadResultWithExplanations?: () => void;
  submissionType?: 'digital' | 'script';
  onChallengeEvaluation?: () => void;
  initialBookmarks?: Set<number | string>;
  currentUser?: UserProfile | null;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  examDetails?: {
    subject?: string;
    subjectLabel?: string;
    chapters?: string;
    topics?: string;
    durationMinutes?: number;
    totalMarks?: number;
    negativeMarking?: number;
    examType?: string;
  };
  onRetryWrongAnswers?: (wrongQuestions: Question[]) => void;
  onReexam?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  questions,
  userAnswers,
  timeTaken,
  onRestart,
  isHistoryMode = false,
  negativeMarking = 0.25,
  onDownloadQuestionPaper: propDownloadQuestionPaper,
  onDownloadResultWithExplanations: propDownloadResultWithExplanations,
  currentUser,
  bookmarkedIds: propBookmarks,
  onToggleBookmark: propToggleBookmark,
  examDetails,
  onToggleTheme,
  isDarkMode = false,
  onReexam,
}) => {
  const [reviewFilter, setReviewFilter] = useState<
    'all' | 'correct' | 'wrong' | 'skipped'
  >('all');
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(
    propBookmarks ? new Set(propBookmarks) : new Set(),
  );
  const [reportingQuestionId, setReportingQuestionId] = useState<
    string | number | null
  >(null);
  const [showProBookmarkModal, setShowProBookmarkModal] =
    useState<boolean>(false);

  // Confetti celebration on mount (if direct exam finish)
  useEffect(() => {
    if (!isHistoryMode) {
      celebration.levelUp();
    }
  }, [isHistoryMode]);

  // Sync prop bookmarks
  useEffect(() => {
    if (propBookmarks) {
      setLocalBookmarks(new Set(propBookmarks));
    }
  }, [propBookmarks]);

  const isPro = Boolean(
    (currentUser as any)?.isPro ||
    (currentUser as any)?.is_pro ||
    (currentUser as any)?.is_subscribed ||
    (currentUser as any)?.subscription_status === 'active' ||
    (currentUser as any)?.plan === 'pro' ||
    currentUser?.subscription?.plan === 'Pro' ||
    (currentUser?.role as string)?.toLowerCase() === 'admin'
  );

  // Toggle Bookmark Handler
  const handleToggleBookmark = async (qId: string | number) => {
    const idStr = qId.toString();
    const isBookmarked = localBookmarks.has(idStr);

    if (
      !isBookmarked &&
      !isPro &&
      localBookmarks.size >= 25
    ) {
      setShowProBookmarkModal(true);
      return;
    }

    setLocalBookmarks((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(idStr);
      else next.add(idStr);
      return next;
    });

    if (propToggleBookmark) {
      propToggleBookmark(qId);
    } else {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          if (isBookmarked) {
            await supabase
              .from('bookmarks')
              .delete()
              .eq('user_id', userData.user.id)
              .eq('question_id', idStr);
          } else {
            await supabase
              .from('bookmarks')
              .insert({ user_id: userData.user.id, question_id: idStr });
          }
        }
      } catch (e: any) {
        console.error('[ResultView] Bookmark toggle failed:', e);
        // Rollback
        setLocalBookmarks((prev) => {
          const next = new Set(prev);
          if (isBookmarked) next.add(idStr);
          else next.delete(idStr);
          return next;
        });
      }
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    let rawScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const wrongQuestions: Question[] = [];

    questions.forEach((q) => {
      const ua = userAnswers[q.id];
      const points = q.points ?? 1;

      if (ua === undefined) {
        skippedCount++;
      } else {
        const isCorrect =
          ua === q.correctAnswerIndex ||
          (q.correctAnswerIndices != null &&
            q.correctAnswerIndices.includes(ua));

        if (isCorrect) {
          rawScore += points;
          correctCount++;
        } else {
          wrongCount++;
          wrongQuestions.push(q);
        }
      }
    });

    const effNeg = examDetails?.negativeMarking ?? negativeMarking;
    const negativeMarksDeduction = wrongCount * effNeg;
    const finalScore = Math.max(0, rawScore - negativeMarksDeduction);
    const totalPoints =
      examDetails?.totalMarks ||
      questions.reduce((acc, q) => acc + (q.points ?? 1), 0);
    const percentage = totalPoints > 0 ? (finalScore / totalPoints) * 100 : 0;

    return {
      rawScore,
      finalScore,
      correctCount,
      wrongCount,
      skippedCount,
      negativeMarksDeduction,
      totalPoints,
      percentage,
      wrongQuestions,
    };
  }, [questions, userAnswers, negativeMarking, examDetails]);

  // Filtered questions for review
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const ua = userAnswers[q.id];
      const isSkipped = ua === undefined;
      const isCorrect =
        !isSkipped &&
        (ua === q.correctAnswerIndex ||
          (q.correctAnswerIndices != null &&
            q.correctAnswerIndices.includes(ua)));
      const isWrong = !isSkipped && !isCorrect;

      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'wrong') return isWrong;
      if (reviewFilter === 'skipped') return isSkipped;
      return true;
    });
  }, [questions, userAnswers, reviewFilter]);

  // Subject and chapters
  const subjectTitle = BanglaNameHelper.formatSubject(
    examDetails?.subject,
    examDetails?.subjectLabel || (examDetails as any)?.title,
  );
  const chapterList = examDetails?.chapters
    ? examDetails.chapters.split(', ').filter(Boolean)
    : Array.from(new Set(questions.map((q) => q.chapter).filter(Boolean)));
  const topicList = examDetails?.topics
    ? examDetails.topics.split(', ').filter(Boolean)
    : [];

  const handleDownloadPaper = () => {
    if (propDownloadQuestionPaper) {
      propDownloadQuestionPaper();
    } else {
      toast.info('প্রশ্নপত্র PDF তৈরি হচ্ছে...');
      const fallbackDetails = {
        subject: examDetails?.subject || 'Exam',
        subjectLabel: examDetails?.subjectLabel || subjectTitle,
        durationMinutes: examDetails?.durationMinutes || 25,
        totalMarks: stats.totalPoints,
        negativeMarking: examDetails?.negativeMarking || negativeMarking,
        examType: examDetails?.examType || 'Mock Exam',
        chapters: chapterList.join(', ') || 'সকল অধ্যায়',
      };
      downloadQuestionPaper(fallbackDetails as any, questions);
    }
  };

  const handleDownloadSolution = () => {
    if (propDownloadResultWithExplanations) {
      propDownloadResultWithExplanations();
    } else {
      toast.info('ফলাফল ও ব্যাখ্যা PDF তৈরি হচ্ছে...');
      const fallbackDetails = {
        subject: examDetails?.subject || 'Exam',
        subjectLabel: examDetails?.subjectLabel || subjectTitle,
        durationMinutes: examDetails?.durationMinutes || 25,
        totalMarks: stats.totalPoints,
        negativeMarking: examDetails?.negativeMarking || negativeMarking,
        examType: examDetails?.examType || 'Mock Exam',
        chapters: chapterList.join(', ') || 'সকল অধ্যায়',
      };
      downloadResultWithExplanations(fallbackDetails as any, questions, userAnswers);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri',sans-serif] flex flex-col">
      {/* ── 1. Top App Bar (Matching Flutter Scaffold AppBar) ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#000000] border-b border-[#E2E8F0] dark:border-[#27272A] shadow-xs">
        <div className="max-w-3xl mx-auto px-3.5 sm:px-4 h-14 flex items-center justify-between">
          {/* Left Close / Back Button */}
          <button
            type="button"
            onClick={onRestart}
            title={isHistoryMode ? 'পিছনে যাও' : 'বন্ধ করো'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C1C1E] transition-colors cursor-pointer"
          >
            {isHistoryMode ? <ArrowLeft size={20} /> : <X size={20} />}
          </button>

          {/* Centered Page Title */}
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            পরীক্ষার ফলাফল
          </h1>

          {/* Right Action / Theme Toggle */}
          <div className="w-9 h-9 flex items-center justify-center">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
                className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-center text-[#475569] dark:text-[#D4D4D4] hover:bg-[#E2E8F0] dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3.5 sm:px-4 pt-4 sm:pt-5 pb-20 flex flex-col gap-4">
        {/* ── 2. Top Action Buttons (PDF Downloads) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Button 1: প্রশ্নপত্র */}
          <button
            type="button"
            onClick={handleDownloadPaper}
            title="শুধুমাত্র প্রশ্নপত্রের PDF ডাউনলোড করো"
            className="py-3 px-4 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#004633] dark:border-[#27272A] text-[#004633] dark:text-[#34D399] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#004633]/5 dark:hover:bg-white/5 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <Download size={16} />
            <span>প্রশ্নপত্র</span>
          </button>

          {/* Button 2: ফলাফল ও ব্যাখ্যা */}
          <button
            type="button"
            onClick={handleDownloadSolution}
            title="প্রতিটি প্রশ্নের সঠিক উত্তর ও বিস্তারিত ব্যাখ্যা সহ PDF ডাউনলোড করো"
            className="py-3 px-4 rounded-[14px] bg-[#004633]/10 dark:bg-[#059669]/20 border border-[#004633] dark:border-[#059669]/40 text-[#004633] dark:text-[#34D399] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#004633]/15 dark:hover:bg-[#059669]/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <Check size={16} className="stroke-[3]" />
            <span>ফলাফল ও ব্যাখ্যা</span>
          </button>
        </div>

        {/* ── 3. Subject & Scope Accordion Header ── */}
        <ExamScopeHeader
          subjectName={subjectTitle}
          chapters={chapterList}
          topics={topicList}
          initiallyExpanded={false}
        />

        {/* ── 4. 3-Card Summary Metrics & Detailed Performance Table ── */}
        <ResultStats
          percentage={stats.percentage}
          finalScore={stats.finalScore}
          totalPoints={stats.totalPoints}
          timeTaken={timeTaken}
          totalQuestions={questions.length}
          correctCount={stats.correctCount}
          wrongCount={stats.wrongCount}
          skippedCount={stats.skippedCount}
          negativeMarking={examDetails?.negativeMarking ?? negativeMarking}
          negativeMarksDeduction={stats.negativeMarksDeduction}
        />

        {/* ── 5. Answer Review Section Header ── */}
        <div className="pt-2">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-3">
            উত্তরপত্র পর্যালোচনা
          </h3>

          {/* Filter Chips Pill Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Filter: সব */}
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer',
                reviewFilter === 'all'
                  ? 'bg-[#E2E8F0] dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                  : 'bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#94A3B8] hover:bg-neutral-100 dark:hover:bg-[#202024]',
              )}
            >
              সব ({questions.length})
            </button>

            {/* Filter: সঠিক */}
            <button
              type="button"
              onClick={() => setReviewFilter('correct')}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer',
                reviewFilter === 'correct'
                  ? 'bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#065F46] dark:text-[#34D399] border border-[#10B981]'
                  : 'bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#94A3B8] hover:bg-neutral-100 dark:hover:bg-[#202024]',
              )}
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>সঠিক ({stats.correctCount})</span>
            </button>

            {/* Filter: ভুল */}
            <button
              type="button"
              onClick={() => setReviewFilter('wrong')}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer',
                reviewFilter === 'wrong'
                  ? 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 text-[#991B1B] dark:text-[#F87171] border border-[#EF4444]'
                  : 'bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#94A3B8] hover:bg-neutral-100 dark:hover:bg-[#202024]',
              )}
            >
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span>ভুল ({stats.wrongCount})</span>
            </button>

            {/* Filter: স্কিপ */}
            <button
              type="button"
              onClick={() => setReviewFilter('skipped')}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer',
                reviewFilter === 'skipped'
                  ? 'bg-[#F1F5F9] dark:bg-[#27272A] text-neutral-900 dark:text-white border border-[#94A3B8]'
                  : 'bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#94A3B8] hover:bg-neutral-100 dark:hover:bg-[#202024]',
              )}
            >
              <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
              <span>স্কিপ ({stats.skippedCount})</span>
            </button>
          </div>
        </div>

        {/* ── 6. Virtualized Question Cards Review List ── */}
        <div className="flex flex-col gap-3 sm:gap-4 mt-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-[18px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-neutral-500 dark:text-neutral-400 font-bold">
              এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।
            </div>
          ) : (
            filteredQuestions.map((question) => {
              const originalIndex = questions.findIndex(
                (q) => q.id === question.id,
              );
              const isBookmarked = localBookmarks.has(question.id.toString());

              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  serialNumber={originalIndex + 1}
                  selectedOptionIndex={userAnswers[question.id]}
                  showFeedback={true}
                  showAnswer={true}
                  readOnly={true}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={() => handleToggleBookmark(question.id)}
                  onReport={() => setReportingQuestionId(question.id)}
                  initiallyExpanded={false}
                />
              );
            })
          )}
        </div>

        {/* ── 7. Bottom Action: আবার পরীক্ষা দাও (Only shown when not in history mode) ── */}
        {!isHistoryMode && (
          <div className="pt-2 pb-6">
            <button
              type="button"
              onClick={onReexam ? onReexam : () => onRestart()}
              className="w-full py-3.5 px-6 rounded-[12px] bg-[#004633] hover:bg-[#003828] active:scale-[0.99] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md shadow-[#004633]/25 transition-all cursor-pointer"
            >
              <RotateCcw size={18} />
              <span>আবার পরীক্ষা দাও</span>
            </button>
          </div>
        )}
      </main>

      {/* Question Report Modal */}
      {reportingQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingQuestionId(null)}
          onSubmit={() => {
            setReportingQuestionId(null);
            toast.success('রিপোর্ট গ্রহণ করা হয়েছে। ধন্যবাদ!');
          }}
          questionId={reportingQuestionId}
        />
      )}

      {/* Pro Bookmark Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProBookmarkModal}
        onClose={() => setShowProBookmarkModal(false)}
        title="বুকমার্ক লিমিট শেষ 📌"
        message="ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও প্র্যাকটিসের জন্য প্রো সাবস্ক্রিপশন নাও।"
        featurePill="বুকমার্ক লিমিট: ২৫/২৫"
      />
    </div>
  );
};

export default ResultView;
