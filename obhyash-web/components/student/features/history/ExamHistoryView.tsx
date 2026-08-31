"use client";

import React, { useState, useMemo } from "react";
import { ExamResult, Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LatexText from "@/components/student/ui/common/LatexText";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Trash2,
  X,
  Timer,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: (ids?: string[]) => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  bookmarkedQuestions?: Question[];
}

type TabMode = "exams" | "questions";

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onViewResult,
  onClearHistory,
  bookmarkedIds = new Set(),
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>("exams");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterChapter, setFilterChapter] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<ExamResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── 1. Subjects List with Emojis ──
  const subjectList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    history.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const subLabel = h.subjectLabel || (h as any).subject_label || (h as any).title || subId;
      const formatted = BanglaNameHelper.formatSubject(subId, subLabel);
      if (formatted && !map.has(formatted)) {
        map.set(formatted, { id: subId || formatted, name: formatted });
      }
    });
    return Array.from(map.values());
  }, [history]);

  // ── 2. Chapter List derived from history or selected subject ──
  const chapterList = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);
      if (!filterSubject || subId === filterSubject || formatted === filterSubject) {
        if (h.chapters) {
          h.chapters.split(",").forEach((c) => {
            const trimmed = c.trim();
            if (trimmed && trimmed.toLowerCase() !== "all") {
              set.add(BanglaNameHelper.formatChapter(trimmed));
            }
          });
        }
        if (h.questions) {
          h.questions.forEach((q) => {
            if (q.chapter) {
              set.add(BanglaNameHelper.formatChapter(q.chapter));
            }
          });
        }
      }
    });
    return Array.from(set);
  }, [history, filterSubject]);

  // ── 3. Filtered Exams (Tab 1) ──
  const filteredExams = useMemo(() => {
    return history.filter((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);

      // Subject filter
      if (filterSubject && subId !== filterSubject && formatted !== filterSubject) {
        return false;
      }

      // Chapter filter
      if (filterChapter) {
        const hasChapterInExam =
          (h.chapters && BanglaNameHelper.formatChapter(h.chapters).includes(filterChapter)) ||
          (h.questions &&
            h.questions.some((q) => BanglaNameHelper.formatChapter(q.chapter || "").includes(filterChapter)));
        if (!hasChapterInExam) return false;
      }

      // Date filter (YYYY-MM-DD match)
      if (filterDate) {
        const examDateStr = (h as any).created_at || h.date;
        if (examDateStr) {
          const d = new Date(examDateStr);
          const formattedD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (formattedD !== filterDate) return false;
        }
      }

      return true;
    });
  }, [history, filterSubject, filterChapter, filterDate]);

  // ── 4. Stat calculations for Filtered Exams ──
  const { totalQuestions, totalCorrect, avgScore } = useMemo(() => {
    let qCount = 0;
    let cCount = 0;
    let sumScore = 0;

    filteredExams.forEach((r) => {
      const tQ = r.totalQuestions || r.totalMarks || 1;
      const c = r.correctCount ?? (r as any).correct_count ?? 0;
      qCount += tQ;
      cCount += c;
      sumScore += r.score ?? 0;
    });

    const avg = filteredExams.length > 0 ? Math.round(sumScore / filteredExams.length) : 0;

    return {
      totalQuestions: qCount,
      totalCorrect: cCount,
      avgScore: avg,
    };
  }, [filteredExams]);

  // ── 5. Attempted Questions list for Tab 2 ──
  const attemptedQuestions = useMemo(() => {
    const list: {
      question: Question;
      userAns: number;
      examTitle: string;
      examDate: string;
    }[] = [];

    history.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);

      if (filterSubject && subId !== filterSubject && formatted !== filterSubject) {
        return;
      }

      if (h.questions && h.questions.length > 0) {
        h.questions.forEach((q) => {
          if (filterChapter && !BanglaNameHelper.formatChapter(q.chapter || "").includes(filterChapter)) {
            return;
          }

          if (filterDate) {
            const d = new Date((h as any).created_at || h.date);
            const formattedD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            if (formattedD !== filterDate) return;
          }

          const userAns = h.userAnswers ? h.userAnswers[q.id] : -1;
          if (userAns !== undefined && userAns !== -1) {
            list.push({
              question: q,
              userAns,
              examTitle: formatted,
              examDate: (h as any).created_at || h.date,
            });
          }
        });
      }
    });

    return list;
  }, [history, filterSubject, filterChapter, filterDate]);

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDur = (seconds: number) => {
    if (!seconds || seconds <= 0) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0 && s > 0) {
      return `${BanglaNameHelper.toBanglaNumeral(m)} মি. ${BanglaNameHelper.toBanglaNumeral(s)} সে.`;
    }
    if (m > 0) {
      return `${BanglaNameHelper.toBanglaNumeral(m)} মিনিট`;
    }
    return `${BanglaNameHelper.toBanglaNumeral(s)} সেকেন্ড`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Emerald
    if (score >= 60) return "#3B82F6"; // Blue
    if (score >= 40) return "#F59E0B"; // Amber
    return "#EF4444"; // Rose
  };

  const formatDateDisplay = (dateInput: string | Date) => {
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateInput);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-5 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Single Row Filter: Subject | Chapter | Date (Matching Flutter 1:1) ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {/* 1. Subject Dropdown */}
        <div className="flex-[5] min-w-0 relative">
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterChapter("");
            }}
            className={cn(
              "w-full h-[38px] pl-3 pr-7 rounded-xl text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer truncate",
              "bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200",
              filterSubject
                ? "border border-emerald-500 text-emerald-700 dark:text-emerald-300"
                : "border border-neutral-200 dark:border-[#2E2E2E]"
            )}
          >
            <option value="">সকল বিষয়</option>
            {subjectList.map((s) => {
              const emoji = BanglaNameHelper.getSubjectEmoji(s.id, s.name);
              return (
                <option key={s.id} value={s.id}>
                  {emoji} {s.name}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* 2. Chapter Dropdown */}
        <div className="flex-[5] min-w-0 relative">
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className={cn(
              "w-full h-[38px] pl-3 pr-7 rounded-xl text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer truncate",
              "bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200",
              filterChapter
                ? "border border-emerald-500 text-emerald-700 dark:text-emerald-300"
                : "border border-neutral-200 dark:border-[#2E2E2E]"
            )}
          >
            <option value="">সকল অধ্যায়</option>
            {chapterList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* 3. Date Filter Chip */}
        <div className="relative shrink-0">
          <label
            className={cn(
              "h-[38px] px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-bold transition-all select-none",
              filterDate
                ? "bg-emerald-50 dark:bg-[#064E3B] border border-emerald-500 text-[#004633] dark:text-[#34D399]"
                : "bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {filterDate
                ? `${new Date(filterDate).getDate()}/${new Date(filterDate).getMonth() + 1}`
                : "তারিখ"}
            </span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {filterDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFilterDate("");
                }}
                className="ml-1 p-0.5 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 rounded-full"
              >
                <X className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* ── 2. Compact 3-Card Stat Row (Matching Flutter _buildStatCard) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            মোট প্রশ্ন
          </span>
          <span className="text-base sm:text-xl font-black text-neutral-900 dark:text-white tabular-nums mt-0.5">
            {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            সঠিক উত্তর
          </span>
          <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {BanglaNameHelper.toBanglaNumeral(totalCorrect)}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            গড় নম্বর
          </span>
          <span className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
            {BanglaNameHelper.toBanglaNumeral(avgScore)}%
          </span>
        </div>
      </div>

      {/* ── 3. Tab Switcher (Matching Flutter TabBar) ── */}
      <div className="flex bg-neutral-100 dark:bg-[#18181B] p-1 rounded-2xl border border-neutral-200 dark:border-[#27272A] mb-4 w-full sm:w-fit shadow-sm">
        <button
          onClick={() => setActiveTab("exams")}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            activeTab === "exams"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          পরীক্ষাসমূহ ({BanglaNameHelper.toBanglaNumeral(filteredExams.length)})
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            activeTab === "questions"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          প্রশ্নোত্তর রিভিউ ({BanglaNameHelper.toBanglaNumeral(attemptedQuestions.length)})
        </button>
      </div>

      {/* ── 4. TAB 1: EXAMS LIST (Matching Flutter _ExamCard 1:1) ── */}
      {activeTab === "exams" && (
        <>
          {filteredExams.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <BookOpen size={28} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                কোনো পরীক্ষা দেওয়া হয়নি
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                একটি পরীক্ষা দাও এবং তোমার অগ্রগতি এখানে দেখো।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                  সাম্প্রতিক পরীক্ষাসমূহ
                </h3>
              </div>

              {filteredExams.map((exam) => {
                const scoreColor = getScoreColor(exam.score);
                const radius = 18;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset =
                  circumference - (Math.min(100, Math.max(0, exam.score)) / 100) * circumference;

                const dateStr = formatDateDisplay((exam as any).created_at || exam.date);
                const subjectLabel = BanglaNameHelper.formatSubject(
                  exam.subject,
                  exam.subjectLabel || (exam as any).subject_label || (exam as any).title
                );
                const timeStr = formatDur(exam.timeTaken ?? (exam as any).time_taken ?? 0);

                return (
                  <div
                    key={exam.id}
                    onClick={() => onViewResult(exam)}
                    className={cn(
                      "group p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A]",
                      "hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm transition-all duration-200 cursor-pointer",
                      "flex items-center justify-between gap-3 select-none"
                    )}
                  >
                    {/* Left: Score Ring (48x48) matching Flutter */}
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                          <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            className="stroke-neutral-100 dark:stroke-[#27272A]"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            stroke={scoreColor}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <span className="absolute text-xs sm:text-[13px] font-black text-neutral-900 dark:text-white tabular-nums">
                          {Math.round(exam.score)}%
                        </span>
                      </div>

                      {/* Middle: Details Center Aligned */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {subjectLabel}
                        </h4>

                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          <Calendar size={12} className="shrink-0" />
                          <span className="truncate">{dateStr}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs font-semibold">
                            {BanglaNameHelper.toBanglaNumeral(exam.correctCount || 0)} সঠিক,{" "}
                            {BanglaNameHelper.toBanglaNumeral(exam.wrongCount || 0)} ভুল
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                            <Timer size={11} className="shrink-0" />
                            <span>{timeStr}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Trailing Actions (Delete + Chevron) */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmExam(exam);
                        }}
                        title="পরীক্ষার রেকর্ড মুছুন"
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <ChevronRight
                        size={18}
                        className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── 5. TAB 2: QUESTIONS REVIEW (Matching Flutter _QuestionsTab 1:1) ── */}
      {activeTab === "questions" && (
        <>
          {attemptedQuestions.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                পরীক্ষা দেওয়ার পর এখানে প্রতিটি প্রশ্নের বিস্তারিত সমাধান ও ব্যাখ্যা দেখতে পারবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attemptedQuestions.map((item, idx) => {
                const q = item.question;
                const isCorrect =
                  String(item.userAns) === String(q.correctAnswer) ||
                  (typeof item.userAns === "number" &&
                    String.fromCharCode(65 + item.userAns) === q.correctAnswer);
                const isExp = expandedExplanation[String(q.id)];
                const isBookmarked = bookmarkedIds.has(String(q.id));

                return (
                  <div
                    key={`${q.id}-${idx}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm space-y-3.5"
                  >
                    {/* Question Header & Context */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md font-bold text-[11px]",
                            isCorrect
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                          )}
                        >
                          {isCorrect ? "✓ সঠিক উত্তর" : "✕ ভুল উত্তর"}
                        </span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                          {item.examTitle}
                        </span>
                        {q.chapter && (
                          <span className="text-neutral-500 dark:text-neutral-400">
                            • {BanglaNameHelper.formatChapter(q.chapter)}
                          </span>
                        )}
                      </div>

                      {onToggleBookmark && (
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(q.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            isBookmarked
                              ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                              : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                          )}
                        >
                          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white leading-relaxed">
                      <LatexText text={q.question} />
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isUserChoice = item.userAns === optIdx;
                        const isCorrectChoice =
                          String(q.correctAnswer) === String(optIdx) ||
                          q.correctAnswer === String.fromCharCode(65 + optIdx) ||
                          q.correctAnswer === opt;

                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2 transition-all",
                              isCorrectChoice
                                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 font-bold"
                                : isUserChoice
                                ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/60 text-rose-900 dark:text-rose-200"
                                : "bg-neutral-50/50 dark:bg-[#141417] border-neutral-200/80 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300"
                            )}
                          >
                            <span
                              className={cn(
                                "w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5",
                                isCorrectChoice
                                  ? "bg-emerald-500 text-white"
                                  : isUserChoice
                                  ? "bg-rose-500 text-white"
                                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                              )}
                            >
                              {["ক", "খ", "গ", "ঘ", "ঙ"][optIdx] || optIdx + 1}
                            </span>
                            <div className="flex-1">
                              <LatexText text={opt} />
                            </div>
                            {isCorrectChoice && (
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            {isUserChoice && !isCorrectChoice && (
                              <XCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Accordion */}
                    {q.explanation && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(String(q.id))}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
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

      {/* ── 6. DELETE CONFIRMATION MODAL (Matching Flutter dialog 1:1) ── */}
      {deleteConfirmExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                  পরীক্ষার রেকর্ড মুছবে?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  এই পদক্ষেপটি পরিবর্তন করা যাবে না
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
              <strong className="text-neutral-900 dark:text-white">
                {BanglaNameHelper.formatSubject(
                  deleteConfirmExam.subject,
                  deleteConfirmExam.subjectLabel ||
                    (deleteConfirmExam as any).subject_label ||
                    (deleteConfirmExam as any).title
                )}
              </strong>{" "}
              পরীক্ষার ফলাফল ও রিভিউ রেকর্ড স্থায়ীভাবে মুছে ফেলা হবে। তুমি কি নিশ্চিত?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmExam(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!deleteConfirmExam) return;
                  try {
                    setIsDeleting(true);
                    if (onClearHistory) {
                      await onClearHistory([deleteConfirmExam.id]);
                    }
                  } finally {
                    setIsDeleting(false);
                    setDeleteConfirmExam(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{isDeleting ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamHistoryView;
