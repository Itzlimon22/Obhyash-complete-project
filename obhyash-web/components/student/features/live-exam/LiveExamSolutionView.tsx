"use client";

import React, { useState, useEffect } from "react";
import { Question } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { getLiveExamSolutions } from "@/services/live-exam-student-service";
import { toggleBookmark, getUserBookmarks } from "@/services/bookmark-service";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import ReportModal from "@/components/student/ui/common/ReportModal";
import LatexText from "@/components/student/ui/common/LatexText";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import ProUpgradeModal from "@/components/common/ProUpgradeModal";
import { isUserPro } from "@/lib/subscription-utils";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Bookmark, 
  BookmarkCheck, 
  Award,
  BookOpen,
  Target,
  HelpCircle,
  Lock,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { downloadLiveExamResult } from "@/services/download-service";

interface LiveExamSolutionViewProps {
  examId: string;
  examTitle: string;
  categoryTitle?: string;
  negativeMarking?: number;
  commonLayoutProps: any;
  onBack: () => void;
}

export const LiveExamSolutionView: React.FC<LiveExamSolutionViewProps> = ({
  examId,
  examTitle,
  categoryTitle = "লাইভ পরীক্ষা",
  negativeMarking = 0.25,
  commonLayoutProps,
  onBack,
}) => {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string | number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped" | "bookmarked">("all");
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [showProBookmarkModal, setShowProBookmarkModal] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const isPro = isUserPro(profile);

  useEffect(() => {
    fetchSolutions();
  }, [examId, user?.id]);

  const fetchSolutions = async () => {
    try {
      setIsLoading(true);
      setIsLocked(false);
      const [solutionData, userBookmarks] = await Promise.all([
        getLiveExamSolutions(examId, user?.id),
        user?.id ? getUserBookmarks(user.id) : Promise.resolve(new Set<string | number>())
      ]);

      setQuestions(solutionData.questions);
      setUserAnswers(solutionData.userAnswers);
      setBookmarkedIds(userBookmarks);
    } catch (error: any) {
      console.error("Failed to load solutions:", error);
      if (error?.message === "EXAM_RESULT_NOT_PUBLISHED") {
        setIsLocked(true);
      } else {
        toast.error("সমাধান লোড করতে সমস্যা হয়েছে");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async (questionId: string | number) => {
    if (!user?.id) {
      toast.error("বুকমার্ক করতে লগইন করুন");
      return;
    }

    const isBookmarked = bookmarkedIds.has(questionId);

    if (!isBookmarked && !isPro && bookmarkedIds.size >= 25) {
      setShowProBookmarkModal(true);
      return;
    }

    setBookmarkingId(String(questionId));

    try {
      const newStatus = await toggleBookmark(user.id, questionId, isBookmarked, isPro);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (newStatus) {
          next.add(questionId);
        } else {
          next.delete(questionId);
        }
        return next;
      });

      if (newStatus) {
        toast.success("প্রশ্নটি রিভিশন তালিকায় যুক্ত হয়েছে");
      } else {
        toast.info("প্রশ্নটি রিভিশন তালিকা থেকে সরানো হয়েছে");
      }
    } catch (e: any) {
      if (e?.message === "BOOKMARK_LIMIT_EXCEEDED") {
        setShowProBookmarkModal(true);
      } else {
        toast.error("বুকমার্ক সংরক্ষণে ব্যর্থ হয়েছে");
      }
    } finally {
      setBookmarkingId(null);
    }
  };

  // Stats calculation
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalScore = 0;

  questions.forEach((q) => {
    const userPick = userAnswers[q.id];
    const points = q.points || 1;
    const isCorrect = userPick !== undefined && (
      userPick === q.correctAnswerIndex || 
      (q.correctAnswerIndices && q.correctAnswerIndices.includes(userPick))
    );

    if (userPick === undefined) {
      skippedCount++;
    } else if (isCorrect) {
      correctCount++;
      totalScore += points;
    } else {
      wrongCount++;
      totalScore -= points * negativeMarking;
    }
  });

  const finalScore = Number(totalScore.toFixed(2));
  const totalAttempted = correctCount + wrongCount;
  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  const filteredQuestions = questions.filter((q) => {
    const userPick = userAnswers[q.id];
    const isCorrect = userPick !== undefined && (
      userPick === q.correctAnswerIndex || 
      (q.correctAnswerIndices && q.correctAnswerIndices.includes(userPick))
    );

    if (filter === "correct") return userPick !== undefined && isCorrect;
    if (filter === "wrong") return userPick !== undefined && !isCorrect;
    if (filter === "skipped") return userPick === undefined;
    if (filter === "bookmarked") return bookmarkedIds.has(q.id);
    return true;
  });

  const handleDownloadPdf = () => {
    if (questions.length === 0) {
      toast.error("কোনো প্রশ্ন পাওয়া যায়নি");
      return;
    }
    setIsDownloading(true);
    try {
      downloadLiveExamResult(
        {
          id: examId,
          title: examTitle,
          category: categoryTitle,
          negative_marking: negativeMarking,
          total_questions: questions.length,
          total_marks: questions.reduce((acc, q) => acc + (q.points || 1), 0),
        },
        questions,
        userAnswers,
        {
          score: finalScore,
          correct_count: correctCount,
          wrong_count: wrongCount,
        },
        profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || 'শিক্ষার্থী'
      );
      toast.success("পিডিএফ সল্যুশন শিট প্রস্তুত হয়েছে!");
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("পিডিএফ তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLocked) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title={`${examTitle} - সমাধান`}
        centerTitle={true}
        onBack={onBack}
      >
        <div className="w-full max-w-lg mx-auto px-4 py-20 text-center animate-in fade-in duration-300 font-['HindSiliguri']">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            ফলাফল ও সমাধান স্থগিত রয়েছে
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            এই লাইভ পরীক্ষার নির্দিষ্ট সময় শেষ হলে এবং কর্তৃপক্ষ কর্তৃক মেধা তালিকা প্রকাশিত হলে পূর্ণাঙ্গ সমাধান দেখতে পাবেন।
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-sm transition-all cursor-pointer"
            >
              ফিরে যান
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title={`${examTitle} - সমাধান`}
      onBack={onBack}
    >
      <div className="w-full max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6 animate-in fade-in duration-300 space-y-6 pb-24">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {categoryTitle}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mt-1">
              {examTitle} - সমাধান
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-sm font-black flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>প্রাপ্ত নম্বর: {finalScore}</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading || questions.length === 0}
              className="px-3.5 py-1.5 rounded-full bg-[#004633] hover:bg-[#003828] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="পিডিএফ সল্যুশন শিট ডাউনলোড"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{isDownloading ? "প্রস্তুত হচ্ছে..." : "PDF ডাউনলোড"}</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">সঠিক উত্তর</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{correctCount} টি</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">ভুল উত্তর</p>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{wrongCount} টি</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
              <MinusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">অনুত্তরিত</p>
              <p className="text-xl font-extrabold text-neutral-700 dark:text-neutral-300">{skippedCount} টি</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">নির্ভুলতা (Accuracy)</p>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{accuracy}%</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: `সবগুলো (${questions.length})` },
            { id: "correct", label: `সঠিক (${correctCount})` },
            { id: "wrong", label: `ভুল (${wrongCount})` },
            { id: "skipped", label: `অনুত্তরিত (${skippedCount})` },
            { id: "bookmarked", label: `রিভিশন তালিকা (${bookmarkedIds.size})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === item.id
                  ? "bg-[#12544F] text-white shadow-md shadow-[#12544F]/20"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Question List */}
        {isLoading ? (
          <div className="py-20 text-center text-neutral-500 font-medium animate-pulse">
            প্রশ্ন ও সমাধান লোড হচ্ছে...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <HelpCircle className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400 font-bold">কোনো প্রশ্ন পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredQuestions.map((q) => {
              const questionNumber = questions.findIndex(item => item.id === q.id) + 1;
              const userPick = userAnswers[q.id];

              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  serialNumber={questionNumber}
                  selectedOptionIndex={userPick}
                  readOnly={true}
                  showFeedback={true}
                  showAnswer={true}
                  isFlagged={false}
                  showReport={true}
                  onReport={() => setReportingQuestionId(q.id)}
                  isBookmarked={bookmarkedIds.has(q.id)}
                  onToggleBookmark={() => handleToggleBookmark(q.id)}
                  hideExplanation={!isPro}
                  className="mb-3.5"
                />
              );
            })}
          </div>
        )}

      </div>

      {/* Pro Upgrade Modal for Bookmark Limit */}
      <ProUpgradeModal
        isOpen={showProBookmarkModal}
        onClose={() => setShowProBookmarkModal(false)}
        title="বুকমার্ক লিমিট শেষ 📌"
        message="ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও প্র্যাকটিসের জন্য প্রো সাবস্ক্রিপশন নাও।"
        featurePill="বুকমার্ক লিমিট: ২৫/২৫"
      />

      {/* Report Modal */}
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
    </AppLayout>
  );
};

export default LiveExamSolutionView;
