"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Question, UserAnswers, UserProfile } from "@/lib/types";
import { celebration } from "@/lib/confetti";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import ExamScopeHeader from "@/components/student/ui/exam/ExamScopeHeader";
import ResultStats from "@/components/student/ui/exam/ResultStats";
import ReportModal from "@/components/student/ui/common/ReportModal";
import ProUpgradeModal from "@/components/common/ProUpgradeModal";
import { supabase } from "@/services/core";
import {
  Trophy,
  RotateCcw,
  Download,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  submissionType?: "digital" | "script";
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
  };
  onRetryWrongAnswers?: (wrongQuestions: Question[]) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  questions,
  userAnswers,
  timeTaken,
  onRestart,
  isHistoryMode = false,
  negativeMarking = 0.25,
  onDownloadQuestionPaper,
  onDownloadResultWithExplanations,
  initialBookmarks,
  currentUser,
  bookmarkedIds: propBookmarks,
  onToggleBookmark: propToggleBookmark,
  examDetails,
  onRetryWrongAnswers,
}) => {
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "correct" | "wrong" | "skipped" | "bookmarked"
  >("all");
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(
    propBookmarks ? new Set(propBookmarks) : new Set()
  );
  const [reportingQuestionId, setReportingQuestionId] = useState<string | number | null>(null);
  const [showProBookmarkModal, setShowProBookmarkModal] = useState<boolean>(false);

  // Confetti on mount (if direct exam finish)
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

  // Fetch bookmarks from DB if not provided
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && questions.length > 0) {
          const qIds = questions.map((q) => q.id.toString());
          const { data } = await supabase
            .from("bookmarks")
            .select("question_id")
            .eq("user_id", userData.user.id)
            .in("question_id", qIds);

          if (data) {
            setLocalBookmarks(new Set(data.map((r: any) => r.question_id.toString())));
          }
        }
      } catch (e) {
        console.warn("[ResultView] Error fetching bookmarks:", e);
      }
    };

    if (!propBookmarks) {
      fetchBookmarks();
    }
  }, [questions, propBookmarks]);

  // Toggle Bookmark Handler
  const handleToggleBookmark = async (qId: string | number) => {
    const idStr = qId.toString();
    const isBookmarked = localBookmarks.has(idStr);

    if (!isBookmarked && localBookmarks.size >= 25 && !currentUser?.subscription?.plan) {
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
              .from("bookmarks")
              .delete()
              .eq("user_id", userData.user.id)
              .eq("question_id", idStr);
          } else {
            await supabase
              .from("bookmarks")
              .insert({ user_id: userData.user.id, question_id: idStr });
          }
        }
      } catch (e) {
        console.error("[ResultView] Bookmark toggle failed:", e);
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
          (q.correctAnswerIndices != null && q.correctAnswerIndices.includes(ua));

        if (isCorrect) {
          rawScore += points;
          correctCount++;
        } else {
          wrongCount++;
          wrongQuestions.push(q);
        }
      }
    });

    const negativeMarksDeduction = wrongCount * negativeMarking;
    const finalScore = Math.max(0, rawScore - negativeMarksDeduction);
    const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);
    const percentage = totalPoints > 0 ? (finalScore / totalPoints) * 100 : 0;
    const xpEarned = correctCount * 2;

    return {
      rawScore,
      finalScore,
      correctCount,
      wrongCount,
      skippedCount,
      negativeMarksDeduction,
      totalPoints,
      percentage,
      xpEarned,
      wrongQuestions,
    };
  }, [questions, userAnswers, negativeMarking]);

  // Filtered questions for review
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const ua = userAnswers[q.id];
      const isCorrect =
        ua !== undefined &&
        (ua === q.correctAnswerIndex ||
          (q.correctAnswerIndices != null && q.correctAnswerIndices.includes(ua)));

      if (reviewFilter === "correct") return isCorrect;
      if (reviewFilter === "wrong") return ua !== undefined && !isCorrect;
      if (reviewFilter === "skipped") return ua === undefined;
      if (reviewFilter === "bookmarked") return localBookmarks.has(q.id.toString());
      return true;
    });
  }, [questions, userAnswers, reviewFilter, localBookmarks]);

  // Subject and chapters
  const subjectTitle = examDetails?.subjectLabel || examDetails?.subject || "বিষয়";
  const chapterList = examDetails?.chapters ? examDetails.chapters.split(", ") : [];
  const topicList = examDetails?.topics ? examDetails.topics.split(", ") : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri'] pb-24 pt-4 sm:pt-6">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 flex flex-col gap-4 sm:gap-5">
        {/* ── 1. Exam Scope Accordion Header (Matching Flutter ExamScopeHeader) ── */}
        <ExamScopeHeader
          subjectName={subjectTitle}
          chapters={chapterList}
          topics={topicList}
          initiallyExpanded={false}
        />

        {/* ── 2. Result Stats & Detailed Performance Table (Matching Flutter ResultStats) ── */}
        <ResultStats
          percentage={stats.percentage}
          finalScore={stats.finalScore}
          totalPoints={stats.totalPoints}
          timeTaken={timeTaken}
          totalQuestions={questions.length}
          correctCount={stats.correctCount}
          wrongCount={stats.wrongCount}
          skippedCount={stats.skippedCount}
          negativeMarking={negativeMarking}
          negativeMarksDeduction={stats.negativeMarksDeduction}
        />

        {/* ── 3. Primary Action Buttons (Matching Flutter Result View) ── */}
        <div className="w-full flex items-center justify-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 min-w-[140px] py-3.5 px-4 rounded-xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-sm shadow-md shadow-[#004633]/25 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>পুনরায় পরীক্ষা দাও</span>
          </button>

          {stats.wrongQuestions.length > 0 && onRetryWrongAnswers && (
            <button
              type="button"
              onClick={() => onRetryWrongAnswers(stats.wrongQuestions)}
              className="flex-1 min-w-[140px] py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/25 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <TrendingUp size={16} />
              <span>ভুলগুলো রিভিশন ({BanglaNameHelper.toBanglaNumeral(stats.wrongQuestions.length)})</span>
            </button>
          )}

          {onDownloadResultWithExplanations && (
            <button
              type="button"
              onClick={onDownloadResultWithExplanations}
              className="py-3.5 px-4 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download size={16} />
              <span>PDF সমাধান</span>
            </button>
          )}
        </div>

        {/* ── 4. Review Filter Tabs (Matching Flutter Review Filters) ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto select-none mt-2">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm w-full">
            {[
              { id: "all", label: `সবগুলো (${BanglaNameHelper.toBanglaNumeral(questions.length)})` },
              { id: "correct", label: `সঠিক (${BanglaNameHelper.toBanglaNumeral(stats.correctCount)})` },
              { id: "wrong", label: `ভুল (${BanglaNameHelper.toBanglaNumeral(stats.wrongCount)})` },
              { id: "skipped", label: `বাকি (${BanglaNameHelper.toBanglaNumeral(stats.skippedCount)})` },
              { id: "bookmarked", label: `বুকমার্ক (${BanglaNameHelper.toBanglaNumeral(localBookmarks.size)})` },
            ].map((tab) => {
              const isSelected = reviewFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReviewFilter(tab.id as any)}
                  className={cn(
                    "flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition text-center whitespace-nowrap",
                    isSelected
                      ? "bg-[#004633] dark:bg-[#003D2C] text-white border border-[#004633] dark:border-[#059669] shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. Question By Question Review List ── */}
        <div className="flex flex-col mt-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-500 dark:text-neutral-400 font-bold">
              এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।
            </div>
          ) : (
            filteredQuestions.map((question) => {
              const originalIndex = questions.findIndex((q) => q.id === question.id);
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
                  initiallyExpanded={true}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Question Report Modal */}
      {reportingQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingQuestionId(null)}
          onSubmit={() => {
            setReportingQuestionId(null);
            toast.success("রিপোর্ট গ্রহণ করা হয়েছে। ধন্যবাদ!");
          }}
          questionId={reportingQuestionId}
        />
      )}

      {/* Pro Bookmark Limit Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProBookmarkModal}
        onClose={() => setShowProBookmarkModal(false)}
        title="বুকমার্ক লিমিট শেষ 📌"
        message="ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও স্টাডি নোটের জন্য প্রো সাবস্ক্রিপশন নাও।"
        featurePill="বুকমার্ক লিমিট: ২৫/২৫"
        icon={Bookmark}
      />
    </div>
  );
};

export default ResultView;
