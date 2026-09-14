"use client";

import React, { useState, useMemo } from "react";
import { ExamResult, Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trash2,
  X,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowDown,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamHistoryViewProps {
  history: ExamResult[];
  subjects?: any[];
  user?: any;
  onBack: () => void;
  onClearHistory: (ids?: string[]) => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  bookmarkedQuestions?: Question[];
}

type TabMode = "exams" | "questions";
type SortMode = "date" | "scoreDesc" | "scoreAsc";
type QuestionFilterStatus = "all" | "correct" | "incorrect";

// Bengali month names matching Flutter
const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const BANGLA_WEEKDAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  subjects = [],
  user,
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
  const [sortBy, setSortBy] = useState<SortMode>("date");
  const [questionStatusFilter, setQuestionStatusFilter] = useState<QuestionFilterStatus>("all");

  // Pagination states (matching Flutter 20-items page)
  const [examPageSize, setExamPageSize] = useState<number>(20);
  const [questionPageSize, setQuestionPageSize] = useState<number>(20);

  // Modals & Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<ExamResult | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Date picker internal state
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => {
    return filterDate ? new Date(filterDate) : new Date();
  });
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(filterDate);

  // ── 1. Determine user stream (Strict SSC vs HSC Separation) ──
  const isSSC = useMemo(() => {
    const rawStream = (
      user?.stream ||
      user?.level ||
      user?.user_metadata?.stream ||
      user?.user_metadata?.level ||
      ""
    )
      .toString()
      .toUpperCase();
    return rawStream.includes("SSC");
  }, [user]);

  // ── 2. Subjects List with Emojis & Strict Stream Separation ──
  const subjectList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    // A. Add from global subjects if matching user stream
    subjects.forEach((sub: any) => {
      const subId = (sub.id || "").toString().toLowerCase();
      const subName = (sub.name || sub.name_en || "").toString().toLowerCase();
      const subLevel = (sub.level || "").toString().toUpperCase();

      if (isSSC) {
        if (subId.startsWith("hsc_") || subName.includes("hsc") || subLevel === "HSC") return;
      } else {
        if (
          subId.startsWith("ssc_") ||
          subName.includes("ssc") ||
          subLevel === "SSC" ||
          subId === "math" ||
          subId === "general_math" ||
          subId === "ssc_general_math" ||
          subId === "ssc_math" ||
          subName === "গণিত" ||
          subName === "সাধারণ গণিত"
        ) {
          return;
        }
      }

      const formatted = BanglaNameHelper.formatSubject(sub.id, sub.name);
      if (formatted && !map.has(sub.id)) {
        map.set(sub.id, { id: sub.id, name: formatted });
      }
    });

    // B. Add from exam history
    history.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const subLabel = h.subjectLabel || (h as any).subject_label || (h as any).title || subId;
      const lowerSubId = subId.toLowerCase();

      if (isSSC) {
        if (lowerSubId.startsWith("hsc_") || subLabel.toLowerCase().includes("hsc")) return;
      } else {
        if (lowerSubId.startsWith("ssc_") || lowerSubId === "general_math" || lowerSubId === "math") return;
      }

      const formatted = BanglaNameHelper.formatSubject(subId, subLabel);
      if (formatted && !map.has(subId)) {
        map.set(subId, { id: subId || formatted, name: formatted });
      }
    });

    return Array.from(map.values());
  }, [subjects, history, isSSC]);

  // ── 3. Chapter List derived from history and selected subject ──
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

  // ── 4. Filtered & Sorted Exams (Tab 1) ──
  const filteredExams = useMemo(() => {
    const filtered = history.filter((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);

      // Stream safety
      if (isSSC) {
        if (subId.toLowerCase().startsWith("hsc_") || formatted.toLowerCase().includes("hsc")) return false;
      } else {
        if (
          subId.toLowerCase().startsWith("ssc_") ||
          subId.toLowerCase() === "math" ||
          subId.toLowerCase() === "general_math"
        ) {
          return false;
        }
      }

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
          const formattedD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
          if (formattedD !== filterDate) return false;
        }
      }

      return true;
    });

    // Sorting (Matching Flutter _SortMode)
    return filtered.sort((a, b) => {
      if (sortBy === "scoreDesc") {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === "scoreAsc") {
        return (a.score || 0) - (b.score || 0);
      }
      // Default: date desc
      const dateA = new Date((a as any).created_at || a.date || 0).getTime();
      const dateB = new Date((b as any).created_at || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [history, isSSC, filterSubject, filterChapter, filterDate, sortBy]);

  // Paginated exams
  const displayedExams = useMemo(() => {
    return filteredExams.slice(0, examPageSize);
  }, [filteredExams, examPageSize]);

  // ── 5. Stat calculations for Filtered Exams (Exact Flutter Parity) ──
  const { totalQuestions, totalCorrect, avgScore } = useMemo(() => {
    let qCount = 0;
    let cCount = 0;
    let sumScore = 0;

    filteredExams.forEach((r) => {
      const tQ = r.totalQuestions || r.totalMarks || (r.questions ? r.questions.length : 0) || 1;
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

  // ── 6. Attempted Questions list for Tab 2 ──
  const attemptedQuestions = useMemo(() => {
    const list: {
      question: Question;
      userAns: number;
      isCorrect: boolean;
      examTitle: string;
      examDate: string;
    }[] = [];

    history.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);

      if (isSSC) {
        if (subId.toLowerCase().startsWith("hsc_") || formatted.toLowerCase().includes("hsc")) return;
      } else {
        if (
          subId.toLowerCase().startsWith("ssc_") ||
          subId.toLowerCase() === "math" ||
          subId.toLowerCase() === "general_math"
        ) {
          return;
        }
      }

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
            const formattedD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
              d.getDate()
            ).padStart(2, "0")}`;
            if (formattedD !== filterDate) return;
          }

          const userAns = h.userAnswers ? h.userAnswers[q.id] : -1;
          if (userAns !== undefined && userAns !== -1) {
            const isCorrect =
              String(userAns) === String(q.correctAnswer) ||
              userAns === q.correctAnswerIndex ||
              (typeof userAns === "number" && String.fromCharCode(65 + userAns) === q.correctAnswer) ||
              (typeof userAns === "number" && q.options && q.options[userAns] === q.correctAnswer);

            if (questionStatusFilter === "correct" && !isCorrect) return;
            if (questionStatusFilter === "incorrect" && isCorrect) return;

            list.push({
              question: q,
              userAns,
              isCorrect,
              examTitle: formatted,
              examDate: (h as any).created_at || h.date,
            });
          }
        });
      }
    });

    return list;
  }, [history, isSSC, filterSubject, filterChapter, filterDate, questionStatusFilter]);

  const displayedQuestions = useMemo(() => {
    return attemptedQuestions.slice(0, questionPageSize);
  }, [attemptedQuestions, questionPageSize]);

  // Duration formatting matching Flutter: 2মি 15সে
  const formatDur = (seconds: number) => {
    if (!seconds || seconds <= 0) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${BanglaNameHelper.toBanglaNumeral(m)}মি ${BanglaNameHelper.toBanglaNumeral(s)}সে`;
  };

  // Score color matching Flutter: >= 70 emerald, >= 40 navy blue, < 40 red
  const getScoreColor = (score: number) => {
    if (score >= 70) return "#10B981"; // Emerald / Flutter 0xFF004633
    if (score >= 40) return "#3B82F6"; // Navy Blue / Flutter 0xFF1E3A8A
    return "#EF4444"; // Red / Flutter 0xFFEF4444
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

  const formatChipDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${BanglaNameHelper.toBanglaNumeral(d.getDate())}/${BanglaNameHelper.toBanglaNumeral(d.getMonth() + 1)}`;
    } catch {
      return dateStr;
    }
  };

  // ── Date Picker Helper Calculations ──
  const currentMonthDays = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [displayedMonth]);

  const isNextMonthDisabled = useMemo(() => {
    const now = new Date();
    return (
      displayedMonth.getFullYear() > now.getFullYear() ||
      (displayedMonth.getFullYear() === now.getFullYear() && displayedMonth.getMonth() >= now.getMonth())
    );
  }, [displayedMonth]);

  const handleSelectPreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setTempSelectedDate(dateStr);
    setDisplayedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className="w-full flex flex-col font-['HindSiliguri',sans-serif] pb-16 select-none">
      {/* ── 1. Header Row (Mobile & Desktop Parity with Flutter) ── */}
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-['Anek_Bangla',sans-serif] text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            পরীক্ষার ইতিহাস
          </h1>
          <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold font-['Anek_Bangla',sans-serif] bg-[#12544F]/10 text-[#12544F] dark:bg-[#12544F]/30 dark:text-[#34D399] border border-[#12544F]/20">
            {isSSC ? "SSC" : "HSC"}
          </span>
        </div>

        {/* Clear All Button matching Flutter right action */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearAllModal(true)}
            className="flex items-center gap-1.5 h-[34px] px-2.5 sm:px-3 rounded-[10px] text-xs font-bold font-['Anek_Bangla',sans-serif] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <Trash2 size={13} className="shrink-0" />
            <span>ইতিহাস মুছুন</span>
          </button>
        )}
      </div>

      {/* ── 2. Single-Row Compact Filter Bar (1:1 with Flutter Row(Subject, Chapter, Date)) ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        {/* 1. Subject Dropdown (flex: 5) */}
        <div className="flex-[5] relative min-w-0">
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterChapter("");
            }}
            className={cn(
              "w-full h-[38px] pl-2.5 pr-7 rounded-[10px] text-[13px] font-medium font-['Anek_Bangla',sans-serif] transition-all appearance-none cursor-pointer truncate shadow-2xs",
              "bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200",
              filterSubject
                ? "border border-[#10B981] text-[#10B981] dark:text-[#34D399]"
                : "border border-[#E5E7EB] dark:border-[#2E2E2E] hover:border-neutral-300 dark:hover:border-[#3E3E3E]"
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
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* 2. Chapter Dropdown (flex: 5) */}
        <div className="flex-[5] relative min-w-0">
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className={cn(
              "w-full h-[38px] pl-2.5 pr-7 rounded-[10px] text-[13px] font-medium font-['Anek_Bangla',sans-serif] transition-all appearance-none cursor-pointer truncate shadow-2xs",
              "bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200",
              filterChapter
                ? "border border-[#10B981] text-[#10B981] dark:text-[#34D399]"
                : "border border-[#E5E7EB] dark:border-[#2E2E2E] hover:border-neutral-300 dark:hover:border-[#3E3E3E]"
            )}
          >
            <option value="">সকল অধ্যায়</option>
            {chapterList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* 3. Date Filter Chip (shrink-0, triggers Flutter Date Picker modal) */}
        <button
          type="button"
          onClick={() => {
            setTempSelectedDate(filterDate);
            if (filterDate) {
              setDisplayedMonth(new Date(filterDate));
            }
            setIsDatePickerOpen(true);
          }}
          className={cn(
            "h-[38px] px-2.5 sm:px-3 rounded-[10px] border flex items-center gap-1.5 text-[13px] font-bold font-['Anek_Bangla',sans-serif] shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95",
            filterDate
              ? "bg-[#ECFDF5] dark:bg-[#064E3B] border-[#10B981] text-[#004633] dark:text-[#34D399]"
              : "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-[#2E2E2E] text-neutral-600 dark:text-[#A3A3A3] hover:border-neutral-300 dark:hover:border-[#3E3E3E]"
          )}
        >
          <Calendar className="w-3.5 h-3.5 text-current shrink-0" />
          <span>{filterDate ? formatChipDate(filterDate) : "তারিখ"}</span>
          {filterDate && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setFilterDate("");
              }}
              className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
            >
              <X className="w-3 h-3 text-current" />
            </span>
          )}
        </button>
      </div>

      {/* ── 3. Center-Aligned 3-Card Stat Row (Flutter _buildStatCard 1:1) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
        {/* Card 1: মোট প্রশ্ন */}
        <div className="p-2 sm:p-2.5 py-3 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-xs text-center flex flex-col items-center justify-center">
          <span className="font-['Anek_Bangla',sans-serif] text-lg sm:text-2xl font-black text-[#0F172A] dark:text-white leading-none">
            {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
          </span>
          <span className="font-['Anek_Bangla',sans-serif] text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 truncate">
            মোট প্রশ্ন
          </span>
        </div>

        {/* Card 2: সঠিক উত্তর */}
        <div className="p-2 sm:p-2.5 py-3 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-xs text-center flex flex-col items-center justify-center">
          <span className="font-['Anek_Bangla',sans-serif] text-lg sm:text-2xl font-black text-[#0F172A] dark:text-white leading-none">
            {BanglaNameHelper.toBanglaNumeral(totalCorrect)}
          </span>
          <span className="font-['Anek_Bangla',sans-serif] text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 truncate">
            সঠিক উত্তর
          </span>
        </div>

        {/* Card 3: গড় নম্বর */}
        <div className="p-2 sm:p-2.5 py-3 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-xs text-center flex flex-col items-center justify-center">
          <span className="font-['Anek_Bangla',sans-serif] text-lg sm:text-2xl font-black text-[#0F172A] dark:text-white leading-none">
            {BanglaNameHelper.toBanglaNumeral(avgScore)}%
          </span>
          <span className="font-['Anek_Bangla',sans-serif] text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 truncate">
            গড় নম্বর
          </span>
        </div>
      </div>

      {/* ── 4. Header Segmented Tab Switcher (Flutter _HeaderTabBtn 1:1) ── */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="h-9 p-[3px] rounded-[12px] bg-[#F3F4F6] dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center w-full sm:w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("exams")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-1 rounded-[9px] text-[13px] font-bold font-['Anek_Bangla',sans-serif] transition-all text-center cursor-pointer active:scale-95",
              activeTab === "exams"
                ? "bg-white dark:bg-[#2A2A2A] text-[#111827] dark:text-white shadow-xs"
                : "text-[#6B7280] dark:text-[#A3A3A3] hover:text-[#111827] dark:hover:text-white"
            )}
          >
            পরীক্ষা ({BanglaNameHelper.toBanglaNumeral(filteredExams.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-1 rounded-[9px] text-[13px] font-bold font-['Anek_Bangla',sans-serif] transition-all text-center cursor-pointer active:scale-95",
              activeTab === "questions"
                ? "bg-white dark:bg-[#2A2A2A] text-[#111827] dark:text-white shadow-xs"
                : "text-[#6B7280] dark:text-[#A3A3A3] hover:text-[#111827] dark:hover:text-white"
            )}
          >
            প্রশ্ন ({BanglaNameHelper.toBanglaNumeral(attemptedQuestions.length)})
          </button>
        </div>

        {/* Question status filters when on questions tab */}
        {activeTab === "questions" && (
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setQuestionStatusFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] transition-all cursor-pointer border shadow-2xs",
                questionStatusFilter === "all"
                  ? "bg-[#12544F] text-white border-transparent"
                  : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800"
              )}
            >
              সকল
            </button>
            <button
              type="button"
              onClick={() => setQuestionStatusFilter("correct")}
              className={cn(
                "px-2 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] transition-all cursor-pointer border flex items-center gap-1 shadow-2xs",
                questionStatusFilter === "correct"
                  ? "bg-[#10B981] text-white border-transparent"
                  : "bg-white dark:bg-[#18181B] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
              )}
            >
              <CheckCircle2 size={11} />
              <span>সঠিক</span>
            </button>
            <button
              type="button"
              onClick={() => setQuestionStatusFilter("incorrect")}
              className={cn(
                "px-2 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] transition-all cursor-pointer border flex items-center gap-1 shadow-2xs",
                questionStatusFilter === "incorrect"
                  ? "bg-[#EF4444] text-white border-transparent"
                  : "bg-white dark:bg-[#18181B] text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
              )}
            >
              <XCircle size={11} />
              <span>ভুল</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 5. TAB 1: EXAMS LIST (Flutter _ExamCard 1:1) ── */}
      {activeTab === "exams" && (
        <div className="flex flex-col">
          {filteredExams.length === 0 ? (
            /* Flutter _emptyState Parity */
            <div className="py-16 text-center rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-6 space-y-3.5 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#12544F] text-white mx-auto flex items-center justify-center shadow-sm">
                <FlaskConical size={26} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-base font-semibold text-[#111827] dark:text-white">
                কোনো পরীক্ষা দেওয়া হয়নি
              </h3>
              <p className="font-['HindSiliguri',sans-serif] text-[13px] text-[#A3A3A3] max-w-xs mx-auto">
                {filterSubject || filterChapter || filterDate
                  ? "ফিল্টারের সাথে মেলে এমন কোনো পরীক্ষা নেই।"
                  : "একটি পরীক্ষা দাও এবং তোমার অগ্রগতি এখানে দেখো।"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-0.5">
                <h2 className="font-['Anek_Bangla',sans-serif] text-[16px] font-extrabold text-[#111827] dark:text-white">
                  সাম্প্রতিক পরীক্ষাসমূহ
                </h2>
                <span className="font-['Anek_Bangla',sans-serif] text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {BanglaNameHelper.toBanglaNumeral(displayedExams.length)} / {BanglaNameHelper.toBanglaNumeral(filteredExams.length)} টি
                </span>
              </div>

              {displayedExams.map((exam) => {
                const scoreColor = getScoreColor(exam.score);
                const dateStr = formatDateDisplay((exam as any).created_at || exam.date);
                const subjectLabel = BanglaNameHelper.formatSubject(
                  exam.subject,
                  exam.subjectLabel || (exam as any).subject_label || (exam as any).title
                );
                const timeStr = formatDur(exam.timeTaken ?? (exam as any).time_taken ?? 0);
                const scorePercent = Math.min(100, Math.max(0, Math.round(exam.score)));

                // SVG Circular ring calculations
                const radius = 19;
                const circumference = 2 * Math.PI * radius; // ~119.38
                const strokeOffset = circumference - (circumference * scorePercent) / 100;

                return (
                  <div
                    key={exam.id}
                    onClick={() => onViewResult(exam)}
                    className={cn(
                      "rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A]",
                      "p-3.5 shadow-xs transition-all duration-150 cursor-pointer select-none",
                      "hover:shadow-md hover:border-neutral-300 dark:hover:border-[#38383E] active:scale-[0.99]",
                      "flex items-center gap-3.5"
                    )}
                  >
                    {/* Left: 48x48 Circular Score Ring (Flutter 1:1) */}
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        {/* Background track circle */}
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          className="stroke-[#F3F4F6] dark:stroke-[#27272A]"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          stroke={scoreColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <span className="absolute font-['Anek_Bangla',sans-serif] text-[12.5px] font-semibold text-[#111827] dark:text-white leading-none">
                        {BanglaNameHelper.toBanglaNumeral(scorePercent)}%
                      </span>
                    </div>

                    {/* Middle: Details Column */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Anek_Bangla',sans-serif] font-bold text-[14.5px] text-[#111827] dark:text-white line-clamp-1 leading-snug">
                        {subjectLabel}
                      </h3>

                      <div className="flex items-center gap-1 mt-0.5 text-xs text-[#71717A] dark:text-[#A1A1AA] font-normal">
                        <Calendar size={12} className="shrink-0 text-current" />
                        <span className="truncate">{dateStr}</span>
                      </div>

                      {/* Mini pills row matching Flutter */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <div className="px-2 py-[3px] rounded-[6px] bg-[#F4F4F5] dark:bg-[#27272A] text-[11.5px] font-medium font-['Anek_Bangla',sans-serif] text-[#3F3F46] dark:text-[#E4E4E7]">
                          {BanglaNameHelper.toBanglaNumeral(exam.correctCount || 0)} সঠিক, {BanglaNameHelper.toBanglaNumeral(exam.wrongCount || 0)} ভুল
                        </div>

                        <div className="px-2 py-[3px] rounded-[6px] bg-[#F4F4F5] dark:bg-[#27272A] text-[11.5px] font-medium font-['Anek_Bangla',sans-serif] text-[#3F3F46] dark:text-[#E4E4E7] flex items-center gap-1">
                          <Timer size={11} className="shrink-0" />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Trailing Actions (Trash + Chevron) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmExam(exam);
                        }}
                        title="পরীক্ষার রেকর্ড মুছুন"
                        className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={18} className="text-[#A1A1AA] dark:text-[#52525B]" />
                    </div>
                  </div>
                );
              })}

              {/* Load More Button (Flutter 1:1) */}
              {displayedExams.length < filteredExams.length && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setExamPageSize((prev) => prev + 20)}
                    className="w-[230px] h-[46px] rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] hover:border-emerald-500 text-sm font-bold font-['Anek_Bangla',sans-serif] text-[#0F172A] dark:text-white shadow-xs mx-auto flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowDown size={16} className="text-[#059669] shrink-0" />
                    <span>আরও ২০টি পরীক্ষা লোড করো</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 6. TAB 2: QUESTIONS TAB (Flutter _QuestionsTab 1:1) ── */}
      {activeTab === "questions" && (
        <div className="flex flex-col">
          {attemptedQuestions.length === 0 ? (
            /* Flutter _emptyState Parity */
            <div className="py-16 text-center rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-6 space-y-3.5 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#12544F] text-white mx-auto flex items-center justify-center shadow-sm">
                <FlaskConical size={26} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-base font-semibold text-[#111827] dark:text-white">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="font-['HindSiliguri',sans-serif] text-[13px] text-[#A3A3A3] max-w-xs mx-auto">
                {filterSubject || filterChapter || filterDate
                  ? "অন্য ফিল্টার নির্বাচন করে আবার চেষ্টা করুন।"
                  : "একটি পরীক্ষা দাও এবং তোমার সমাধান করা প্রশ্ন এখানে দেখো।"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-0.5">
                <h2 className="font-['Anek_Bangla',sans-serif] text-[16px] font-extrabold text-[#111827] dark:text-white">
                  প্রশ্নের ব্যাখ্যা ও রিভিউ
                </h2>
                <span className="font-['Anek_Bangla',sans-serif] text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {BanglaNameHelper.toBanglaNumeral(displayedQuestions.length)} / {BanglaNameHelper.toBanglaNumeral(attemptedQuestions.length)} টি
                </span>
              </div>

              {displayedQuestions.map((item, idx) => {
                const q = item.question;
                const isBookmarked = bookmarkedIds.has(String(q.id));

                return (
                  <div key={`${q.id}-${idx}`} className="transition-all">
                    <QuestionCard
                      question={q}
                      serialNumber={idx + 1}
                      selectedOptionIndex={item.userAns}
                      isFlagged={false}
                      readOnly={true}
                      showAnswer={true}
                      showFeedback={true}
                      initiallyExpanded={false}
                      isBookmarked={isBookmarked}
                      onSelectOption={() => {}}
                      onToggleFlag={() => {}}
                      onToggleBookmark={onToggleBookmark ? () => onToggleBookmark(q.id) : undefined}
                    />
                  </div>
                );
              })}

              {/* Load More Questions Button */}
              {displayedQuestions.length < attemptedQuestions.length && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setQuestionPageSize((prev) => prev + 20)}
                    className="w-[230px] h-[46px] rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] hover:border-emerald-500 text-sm font-bold font-['Anek_Bangla',sans-serif] text-[#0F172A] dark:text-white shadow-xs mx-auto flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowDown size={16} className="text-[#059669] shrink-0" />
                    <span>আরও ২০টি প্রশ্ন লোড করো</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 7. PREMIUM DATE PICKER MODAL (Flutter _PremiumDatePickerModal 1:1) ── */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] bg-white dark:bg-[#000000] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl p-5 pb-6 space-y-4 font-['HindSiliguri',sans-serif]"
          >
            {/* Top Drag Handle (Flutter Handle bar) */}
            <div className="w-9 h-1 rounded-full bg-neutral-300 dark:bg-[#3F3F46] mx-auto mb-1" />

            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#059669]/15 flex items-center justify-center text-[#10B981] shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-bold text-[#111827] dark:text-white leading-tight">
                    তারিখ নির্বাচন করো
                  </h3>
                  <p className="text-[12px] text-[#6B7280] dark:text-[#A1A1AA] leading-tight mt-0.5">
                    নির্দিষ্ট দিনের পরীক্ষার ফলাফল ও প্রশ্নসমূহ দেখো
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Preset Chips Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => handleSelectPreset(0)}
                className="px-3 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-700 dark:text-neutral-300 hover:bg-[#12544F]/10 hover:text-[#12544F] border border-neutral-200/80 dark:border-neutral-800 transition-all cursor-pointer"
              >
                আজ
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(1)}
                className="px-3 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-700 dark:text-neutral-300 hover:bg-[#12544F]/10 hover:text-[#12544F] border border-neutral-200/80 dark:border-neutral-800 transition-all cursor-pointer"
              >
                গতকাল
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(7)}
                className="px-3 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-700 dark:text-neutral-300 hover:bg-[#12544F]/10 hover:text-[#12544F] border border-neutral-200/80 dark:border-neutral-800 transition-all cursor-pointer"
              >
                গত ৭ দিন
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(30)}
                className="px-3 py-1 rounded-[8px] text-xs font-bold font-['Anek_Bangla',sans-serif] bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-700 dark:text-neutral-300 hover:bg-[#12544F]/10 hover:text-[#12544F] border border-neutral-200/80 dark:border-neutral-800 transition-all cursor-pointer"
              >
                এই মাস
              </button>
            </div>

            {/* Month Header with Prev & Next */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() =>
                  setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1))
                }
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-[#2E2E2E] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-['Anek_Bangla',sans-serif] text-base font-bold text-[#111827] dark:text-white">
                {BANGLA_MONTHS[displayedMonth.getMonth()]}{" "}
                {BanglaNameHelper.toBanglaNumeral(displayedMonth.getFullYear())}
              </span>
              <button
                type="button"
                disabled={isNextMonthDisabled}
                onClick={() =>
                  setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1))
                }
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-[#2E2E2E] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-['Anek_Bangla',sans-serif] text-xs font-semibold text-neutral-400 dark:text-neutral-500 py-1">
              {BANGLA_WEEKDAYS.map((w, idx) => (
                <span key={idx}>{w}</span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-['Anek_Bangla',sans-serif] text-sm">
              {currentMonthDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }

                const dateObj = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), day);
                const isFuture = dateObj > new Date();
                const dateKey = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(day).padStart(2, "0")}`;
                const isSelected = tempSelectedDate === dateKey;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setTempSelectedDate(dateKey)}
                    className={cn(
                      "h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#10B981] text-white shadow-xs font-black"
                        : isFuture
                        ? "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                        : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {BanglaNameHelper.toBanglaNumeral(day)}
                  </button>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setFilterDate("");
                  setIsDatePickerOpen(false);
                }}
                className="flex-1 h-11 rounded-[12px] border border-neutral-200 dark:border-[#2E2E2E] bg-neutral-50 dark:bg-[#18181B] text-xs font-bold font-['Anek_Bangla',sans-serif] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                রিসেট করো
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterDate(tempSelectedDate);
                  setIsDatePickerOpen(false);
                }}
                className="flex-[2] h-11 rounded-[12px] bg-[#12544F] hover:bg-[#0E4440] text-white text-xs font-bold font-['Anek_Bangla',sans-serif] shadow-xs active:scale-98 transition-all cursor-pointer"
              >
                তারিখ নিশ্চিত করো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. DELETE SINGLE EXAM CONFIRMATION MODAL (Flutter AlertDialog 1:1) ── */}
      {deleteConfirmExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-5 sm:p-6 rounded-[20px] bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#27272A] shadow-2xl space-y-3.5 font-['HindSiliguri',sans-serif]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-extrabold text-[#111827] dark:text-white leading-snug">
                পরীক্ষার রেকর্ড মুছবে?
              </h3>
            </div>

            <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
              {BanglaNameHelper.formatSubject(
                deleteConfirmExam.subject,
                deleteConfirmExam.subjectLabel ||
                  (deleteConfirmExam as any).subject_label ||
                  (deleteConfirmExam as any).title
              )}{" "}
              ({formatDateDisplay((deleteConfirmExam as any).created_at || deleteConfirmExam.date)}) পরীক্ষার ফলাফলটি মুছে ফেলা হবে। তুমি কি নিশ্চিত?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmExam(null)}
                className="px-3.5 py-2 text-sm font-bold font-['Anek_Bangla',sans-serif] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-white cursor-pointer"
              >
                না, থাক
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
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-bold font-['Anek_Bangla',sans-serif] shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলো"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. CLEAR ALL HISTORY CONFIRMATION MODAL ── */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-5 sm:p-6 rounded-[20px] bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#27272A] shadow-2xl space-y-3.5 font-['HindSiliguri',sans-serif]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-extrabold text-[#111827] dark:text-white leading-snug">
                সকল ইতিহাস মুছে ফেলবে?
              </h3>
            </div>

            <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed">
              তোমার সকল পরীক্ষার রেকর্ড, প্রাপ্ত নম্বর ও পর্যালোচনা সম্পূর্ণরূপে মুছে ফেলা হবে। এই পদক্ষেপটি পরিবর্তনযোগ্য নয়।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowClearAllModal(false)}
                className="px-3.5 py-2 text-sm font-bold font-['Anek_Bangla',sans-serif] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-white cursor-pointer"
              >
                না, থাক
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    if (onClearHistory) {
                      await onClearHistory();
                    }
                  } finally {
                    setIsDeleting(false);
                    setShowClearAllModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-bold font-['Anek_Bangla',sans-serif] shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "মুছে ফেলা হচ্ছে..." : "সব মুছে ফেলো"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamHistoryView;
