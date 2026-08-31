"use client";

import React, { useState, useMemo } from "react";
import { ExamResult, Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LatexText from "@/components/student/ui/common/LatexText";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Calendar,
  Filter,
  ArrowUpDown,
  BookOpen,
  Trophy,
  Search,
  Check,
  ChevronDown,
  Bookmark,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: (ids?: string[]) => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  bookmarkedQuestions?: Question[];
}

type SortOption = "date_desc" | "score_desc" | "score_asc";
type TabMode = "exams" | "questions";

const BANGLA_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ"];

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onViewResult,
  bookmarkedIds = new Set(),
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>("exams");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${BanglaNameHelper.toBanglaNumeral(m)}মি ${BanglaNameHelper.toBanglaNumeral(s)}সে`;
    }
    return `${BanglaNameHelper.toBanglaNumeral(s)} সেকেন্ড`;
  };

  // Top Summary Statistics
  const { totalExams, avgAccuracy, totalStudyTime } = useMemo(() => {
    if (history.length === 0) {
      return { totalExams: 0, avgAccuracy: 0, totalStudyTime: 0 };
    }
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTime = 0;

    history.forEach((h) => {
      const qCount = h.totalQuestions || h.totalMarks || 1;
      const cCount = h.correctCount ?? (h as any).correct_count ?? 0;
      const time = h.timeTaken ?? (h as any).time_taken ?? 0;
      totalQuestions += qCount;
      totalCorrect += cCount;
      totalTime += time;
    });

    const acc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return {
      totalExams: history.length,
      avgAccuracy: acc,
      totalStudyTime: totalTime,
    };
  }, [history]);

  const allSubjects = useMemo(() => {
    const map = new Map<string, string>();
    history.forEach((h) => {
      const label = h.subjectLabel || (h as any).subject_label || h.subject;
      if (label && !map.has(label)) {
        map.set(label, h.subject);
      }
    });
    return Array.from(map.entries()).map(([label, id]) => ({ id, label }));
  }, [history]);

  // Filtered Exams
  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (selectedSubject !== "all") {
      list = list.filter((h) => {
        const lbl = h.subjectLabel || (h as any).subject_label;
        return (
          h.subject === selectedSubject ||
          (lbl &&
            allSubjects.find((s) => s.id === selectedSubject)?.label === lbl)
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((h) => {
        const lbl = (h.subjectLabel || (h as any).subject_label || "").toLowerCase();
        const sub = (h.subject || "").toLowerCase();
        const typ = (h.examType || (h as any).exam_type || "").toLowerCase();
        return lbl.includes(q) || sub.includes(q) || typ.includes(q);
      });
    }

    if (sortBy === "date_desc") {
      list.sort(
        (a, b) =>
          new Date((b as any).created_at || b.date).getTime() -
          new Date((a as any).created_at || a.date).getTime()
      );
    } else if (sortBy === "score_desc") {
      list.sort((a, b) => {
        const maxA = a.totalMarks || a.totalQuestions || 1;
        const maxB = b.totalMarks || b.totalQuestions || 1;
        const scoreA = (a.score / maxA) * 100;
        const scoreB = (b.score / maxB) * 100;
        return scoreB - scoreA;
      });
    } else if (sortBy === "score_asc") {
      list.sort((a, b) => {
        const maxA = a.totalMarks || a.totalQuestions || 1;
        const maxB = b.totalMarks || b.totalQuestions || 1;
        const scoreA = (a.score / maxA) * 100;
        const scoreB = (b.score / maxB) * 100;
        return scoreA - scoreB;
      });
    }

    return list;
  }, [history, selectedSubject, searchQuery, sortBy, allSubjects]);

  // Flattened Questions List across all exams for Question Review Tab
  const allAttemptedQuestions = useMemo(() => {
    const list: {
      question: Question;
      userAns: number;
      examTitle: string;
      examDate: string;
    }[] = [];

    history.forEach((h) => {
      if (h.questions && h.userAnswers) {
        h.questions.forEach((q) => {
          const ans = h.userAnswers?.[q.id];
          if (ans !== undefined && ans !== null && ans !== -1) {
            list.push({
              question: q,
              userAns: ans,
              examTitle: h.subjectLabel || BanglaNameHelper.formatSubject(h.subject, h.subject),
              examDate: h.date,
            });
          }
        });
      }
    });

    if (selectedSubject !== "all") {
      return list.filter((item) => {
        const sub = item.question.subject;
        const subLabel = item.question.subjectLabel;
        return (
          sub === selectedSubject ||
          (subLabel &&
            allSubjects.find((s) => s.id === selectedSubject)?.label === subLabel)
        );
      });
    }

    return list;
  }, [history, selectedSubject, allSubjects]);

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
            পরীক্ষার ইতিহাস ও পর্যালোচনা 📜
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            তোমার দেওয়া সকল পরীক্ষা ও প্রশ্নোত্তরের পূর্ণাঙ্গ সংগ্রহশালা
          </p>
        </div>

        {/* Tab Switcher (Exams vs Questions Review) */}
        <div className="flex bg-neutral-100 dark:bg-[#18181B] p-1 rounded-2xl border border-neutral-200 dark:border-[#27272A] w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("exams")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all",
              activeTab === "exams"
                ? "bg-[#004633] text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            পরীক্ষাসমূহ ({BanglaNameHelper.toBanglaNumeral(history.length)})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all",
              activeTab === "questions"
                ? "bg-[#004633] text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            প্রশ্নোত্তর রিভিউ ({BanglaNameHelper.toBanglaNumeral(allAttemptedQuestions.length)})
          </button>
        </div>
      </div>

      {/* ── Summary Statistics Cards ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm flex flex-col items-center sm:items-start">
          <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
            মোট পরীক্ষা
          </span>
          <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
            {BanglaNameHelper.toBanglaNumeral(totalExams)}টি
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm flex flex-col items-center sm:items-start">
          <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
            গড় নির্ভুলতা
          </span>
          <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {BanglaNameHelper.toBanglaNumeral(avgAccuracy)}%
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm flex flex-col items-center sm:items-start">
          <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
            মোট পড়ার সময়
          </span>
          <span className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums mt-0.5">
            {formatDuration(totalStudyTime)}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Subject Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          <button
            onClick={() => setSelectedSubject("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0",
              selectedSubject === "all"
                ? "bg-[#004633] text-white border-[#004633] shadow-sm"
                : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
            )}
          >
            সব বিষয়
          </button>
          {allSubjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0",
                selectedSubject === s.id
                  ? "bg-[#004633] text-white border-[#004633] shadow-sm"
                  : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
              )}
            >
              {BanglaNameHelper.formatSubject(s.label, s.id)}
            </button>
          ))}
        </div>

        {/* Search & Sort for Exams tab */}
        {activeTab === "exams" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer shadow-sm"
              >
                <option value="date_desc">📅 সর্বশেষ</option>
                <option value="score_desc">🏆 সর্বোচ্চ স্কোর</option>
                <option value="score_asc">📉 সর্বনিম্ন স্কোর</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── TAB 1: EXAMS LIST ── */}
      {activeTab === "exams" && (
        <>
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center mb-3">
                <BookOpen size={24} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                কোনো পরীক্ষার রেকর্ড পাওয়া যায়নি
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                মডেল টেস্ট দিয়ে তোমার ইতিহাস তৈরি করো
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredHistory.map((exam) => {
                const total = exam.totalQuestions || exam.totalMarks || 1;
                const correct = exam.correctCount ?? (exam as any).correct_count ?? 0;
                const wrong = exam.wrongCount ?? (exam as any).wrong_count ?? 0;
                const totalMarks = exam.totalMarks || total;
                const netScore = exam.score ?? 0;
                const pct = Math.max(
                  0,
                  Math.min(100, Math.round((netScore / totalMarks) * 100))
                );

                let scoreBadgeClass =
                  "bg-emerald-50 dark:bg-[#0C2419] text-[#004633] dark:text-[#4ADE80] border-emerald-300 dark:border-emerald-900/50";
                if (pct < 40) {
                  scoreBadgeClass =
                    "bg-red-50 dark:bg-[#260C0E] text-red-600 dark:text-[#F87171] border-red-200 dark:border-red-900/50";
                } else if (pct < 70) {
                  scoreBadgeClass =
                    "bg-blue-50 dark:bg-[#0E1A2E] text-blue-700 dark:text-[#60A5FA] border-blue-200 dark:border-blue-900/50";
                }

                const examDate = new Date((exam as any).created_at || exam.date);
                const dateStr = !isNaN(examDate.getTime())
                  ? examDate.toLocaleDateString("bn-BD", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const timeStr = !isNaN(examDate.getTime())
                  ? examDate.toLocaleTimeString("bn-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div
                    key={exam.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Exam Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-[10px] font-black text-neutral-600 dark:text-neutral-300 uppercase">
                          {BanglaNameHelper.formatSubject(
                            exam.subjectLabel || (exam as any).subject_label || exam.subject,
                            exam.subject
                          )}
                        </span>
                        <span className="text-xs font-bold text-neutral-400">
                          {dateStr} {timeStr && `• ${timeStr}`}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate">
                        {exam.subjectLabel || (exam as any).subject_label || BanglaNameHelper.formatSubject(exam.subject, exam.subject)}
                      </h3>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          <span>{BanglaNameHelper.toBanglaNumeral(correct)}টি সঠিক</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-red-500">
                          <XCircle size={12} />
                          <span>{BanglaNameHelper.toBanglaNumeral(wrong)}টি ভুল</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Clock size={12} />
                          <span>{formatDuration(exam.timeTaken || (exam as any).time_taken)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Score Badge & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                      {/* Score Pill */}
                      <div
                        className={cn(
                          "px-3.5 py-1.5 rounded-2xl border text-center font-black",
                          scoreBadgeClass
                        )}
                      >
                        <div className="text-base sm:text-lg tabular-nums leading-tight">
                          {BanglaNameHelper.toBanglaNumeral(pct)}%
                        </div>
                        <div className="text-[10px] font-bold uppercase opacity-80">
                          স্কোর: {BanglaNameHelper.toBanglaNumeral(netScore)}/{BanglaNameHelper.toBanglaNumeral(totalMarks)}
                        </div>
                      </div>

                      {/* View Details / Review Button */}
                      <button
                        onClick={() => onViewResult(exam)}
                        className="px-4 py-2 rounded-xl bg-[#004633] hover:bg-[#003627] text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Eye size={14} />
                        <span>উত্তরপত্র ও রিভিউ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: QUESTIONS REVIEW (QUESTION BANK) ── */}
      {activeTab === "questions" && (
        <>
          {allAttemptedQuestions.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center mb-3">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                পরীক্ষা দেওয়ার পর প্রশ্নগুলো এখানে রিভিউ করতে পারবে
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allAttemptedQuestions.map((item, idx) => {
                const q = item.question;
                const isCorrect =
                  item.userAns === q.correctAnswerIndex ||
                  (q.correctAnswerIndices != null &&
                    q.correctAnswerIndices.includes(item.userAns));
                const isExp = !!expandedExplanation[q.id];

                return (
                  <div
                    key={`${q.id}-${idx}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm space-y-3"
                  >
                    {/* Top Row: Meta Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-[10px] font-black text-neutral-600 dark:text-neutral-300 uppercase">
                          {item.examTitle}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black border",
                            isCorrect
                              ? "bg-emerald-50 dark:bg-[#0C2419] text-emerald-600 border-emerald-200"
                              : "bg-red-50 dark:bg-[#260C0E] text-red-600 border-red-200"
                          )}
                        >
                          {isCorrect ? "✓ সঠিক উত্তর" : "✗ ভুল উত্তর"}
                        </span>
                      </div>

                      {onToggleBookmark && (
                        <button
                          onClick={() => onToggleBookmark(q.id)}
                          className="p-1 text-neutral-400 hover:text-emerald-500 transition-colors"
                        >
                          <Bookmark
                            size={16}
                            className={cn(
                              bookmarkedIds.has(String(q.id)) &&
                                "fill-emerald-500 text-emerald-500"
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <div className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-relaxed flex items-start gap-1.5">
                      <span className="font-mono text-neutral-400">
                        {BanglaNameHelper.toBanglaNumeral(idx + 1)}.
                      </span>
                      <div className="flex-1">
                        <LatexText text={q.question} />
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisCorrect =
                          optIdx === q.correctAnswerIndex ||
                          (q.correctAnswerIndices != null &&
                            q.correctAnswerIndices.includes(optIdx));
                        const isUserChoice = optIdx === item.userAns;

                        let optClass =
                          "bg-neutral-50/70 dark:bg-[#141417] border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300";

                        if (isThisCorrect) {
                          optClass =
                            "bg-emerald-50 dark:bg-[#004633]/30 border-emerald-400 dark:border-[#004633] text-emerald-900 dark:text-emerald-300 font-bold";
                        } else if (isUserChoice && !isThisCorrect) {
                          optClass =
                            "bg-red-50 dark:bg-[#260C0E] border-red-300 dark:border-red-900/50 text-red-700 dark:text-red-300";
                        }

                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs flex items-center gap-2",
                              optClass
                            )}
                          >
                            <span
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                isThisCorrect
                                  ? "bg-[#004633] text-white"
                                  : isUserChoice
                                  ? "bg-red-600 text-white"
                                  : "bg-neutral-200 dark:bg-[#27272A] text-neutral-600"
                              )}
                            >
                              {BANGLA_OPTIONS[optIdx] || optIdx + 1}
                            </span>
                            <div className="flex-1 truncate">
                              <LatexText text={opt} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Drawer */}
                    {q.explanation && (
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(String(q.id))}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                        >
                          <span>{isExp ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা ও সমাধান দেখুন"}</span>
                          <ChevronDown
                            size={14}
                            className={cn("transition-transform", isExp && "rotate-180")}
                          />
                        </button>

                        {isExp && (
                          <div className="mt-2 p-3 rounded-xl bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-[#27272A] text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            <LatexText text={q.explanation} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamHistoryView;
