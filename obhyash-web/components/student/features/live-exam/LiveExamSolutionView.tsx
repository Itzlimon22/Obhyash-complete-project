"use client";

import React, { useState, useEffect } from "react";
import { Question } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { getLiveExamSolutions } from "@/services/live-exam-student-service";
import { toggleBookmark, getUserBookmarks } from "@/services/bookmark-service";
import LatexText from "@/components/student/ui/common/LatexText";
import AppLayout from "@/components/student/ui/layout/AppLayout";
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
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string | number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped" | "bookmarked">("all");
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSolutions();
  }, [examId, user?.id]);

  const fetchSolutions = async () => {
    try {
      setIsLoading(true);
      const [solutionData, userBookmarks] = await Promise.all([
        getLiveExamSolutions(examId, user?.id),
        user?.id ? getUserBookmarks(user.id) : Promise.resolve(new Set<string | number>())
      ]);

      setQuestions(solutionData.questions);
      setUserAnswers(solutionData.userAnswers);
      setBookmarkedIds(userBookmarks);
    } catch (error) {
      console.error("Failed to load solutions:", error);
      toast.error("সমাধান লোড করতে সমস্যা হয়েছে");
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
    setBookmarkingId(String(questionId));

    try {
      const newStatus = await toggleBookmark(user.id, questionId, isBookmarked);
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
    } catch (e) {
      toast.error("বুকমার্ক সংরক্ষণে ব্যর্থ হয়েছে");
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

  const finalScore = Math.max(0, Number(totalScore.toFixed(2)));
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

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title="সমাধান ও ব্যাখ্যা"
    >
      <div className="w-full max-w-5xl mx-auto px-3 md:px-6 py-6 animate-in fade-in duration-300 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
              title="ফিরে যান"
            >
              <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
            </button>
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {categoryTitle}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white">
                {examTitle} - সমাধান
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>প্রাপ্ত নম্বর: {finalScore}</span>
            </div>
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                filter === item.id
                  ? "bg-[#0B6B42] text-white shadow-md shadow-emerald-700/20"
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
          <div className="space-y-6">
            {filteredQuestions.map((q) => {
              const questionNumber = questions.findIndex(item => item.id === q.id) + 1;
              const userPick = userAnswers[q.id];
              const isCorrect = userPick !== undefined && (
                userPick === q.correctAnswerIndex || 
                (q.correctAnswerIndices && q.correctAnswerIndices.includes(userPick))
              );
              const isBookmarked = bookmarkedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  {/* Question Header & Badges */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-black text-sm text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
                        {questionNumber}
                      </span>
                      
                      {q.subject && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          {BanglaNameHelper.formatSubject(q.subject, (q as any).subjectLabel)}
                        </span>
                      )}

                      {q.chapter && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {q.chapter}
                        </span>
                      )}

                      {userPick === undefined ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          অনুত্তরিত
                        </span>
                      ) : isCorrect ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> সঠিক (+{q.points || 1})
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> ভুল (-{negativeMarking})
                        </span>
                      )}
                    </div>

                    {/* Bookmark Action */}
                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      disabled={bookmarkingId === String(q.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        isBookmarked
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 shadow-sm"
                          : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      }`}
                      title={isBookmarked ? "রিভিশন তালিকা থেকে সরান" : "রিভিশনে যোগ করুন"}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-neutral-900 dark:text-neutral-100 font-bold text-base sm:text-lg mb-4 leading-relaxed">
                    <LatexText text={q.question} />
                  </div>

                  {/* Optional Question Image */}
                  {q.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden max-w-md border border-neutral-200 dark:border-neutral-700">
                      <img src={q.imageUrl} alt="Question Diagram" className="w-full object-contain max-h-60" />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {q.options.map((opt, optIndex) => {
                      const banglaOptions = ["ক", "খ", "গ", "ঘ", "ঙ"];
                      const banglaLetter = banglaOptions[optIndex] || `${optIndex + 1}`;
                      const isOptionCorrect = optIndex === q.correctAnswerIndex || (q.correctAnswerIndices && q.correctAnswerIndices.includes(optIndex));
                      const isUserSelected = userPick === optIndex;

                      let optionBorder = "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30";
                      let optionBadge = "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300";

                      if (isOptionCorrect) {
                        optionBorder = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200";
                        optionBadge = "bg-emerald-600 text-white";
                      } else if (isUserSelected && !isOptionCorrect) {
                        optionBorder = "border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-950 dark:text-red-200";
                        optionBadge = "bg-red-600 text-white";
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all ${optionBorder}`}
                        >
                          <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${optionBadge}`}>
                            {banglaLetter}
                          </span>
                          <div className="flex-1 font-medium text-sm">
                            <LatexText text={opt} />
                          </div>
                          {isOptionCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          {isUserSelected && !isOptionCorrect && (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation Block */}
                  {q.explanation && (
                    <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 text-sm text-neutral-800 dark:text-neutral-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                        <BookOpen className="w-4 h-4" />
                        <span>সঠিক ব্যাখ্যা:</span>
                      </div>
                      <div className="leading-relaxed pl-6">
                        <LatexText text={q.explanation} />
                      </div>
                      {q.explanationImageUrl && (
                        <div className="pt-2 pl-6">
                          <img src={q.explanationImageUrl} alt="Explanation Diagram" className="rounded-lg max-h-48 border border-blue-200 dark:border-blue-800" />
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default LiveExamSolutionView;
