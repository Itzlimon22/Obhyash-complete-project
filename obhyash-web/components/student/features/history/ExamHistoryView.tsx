"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ExamResult, Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import QuestionCard from "@/components/student/ui/exam/QuestionCard";
import ReportModal from "@/components/student/ui/common/ReportModal";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trash2,
  X,
  Timer,
  ArrowDown,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deleteExamResult } from "@/services/database";

export interface ExamHistoryViewProps {
  history: ExamResult[];
  subjects?: any[];
  user?: any;
  onBack: () => void;
  onClearHistory?: (ids?: string[]) => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  bookmarkedQuestions?: Question[];
  activeTab?: "exams" | "questions";
  onTabChange?: (tab: "exams" | "questions") => void;
}

type SortMode = "date" | "scoreDesc" | "scoreAsc";

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

// Score color matching Flutter _scoreColor
const getScoreColor = (score: number) => {
  if (score >= 70) return "#10B981"; // Emerald / Flutter 0xFF004633
  if (score >= 40) return "#3B82F6"; // Navy Blue / Flutter 0xFF1E3A8A
  return "#EF4444"; // Red / Flutter 0xFFEF4444
};

// Duration formatting matching Flutter: 2মি 15সে
const formatDur = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${BanglaNameHelper.toBanglaNumeral(m)}মি ${BanglaNameHelper.toBanglaNumeral(s)}সে`;
};

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history: initialHistory,
  subjects = [],
  user,
  onBack,
  onViewResult,
  onClearHistory,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  activeTab: controlledTab,
  onTabChange: setControlledTab,
}) => {
  // Local history state so deletions reflect immediately
  const [history, setHistory] = useState<ExamResult[]>(initialHistory);
  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  // Tab State: sync with controlled prop or internal fallback
  const [internalTab, setInternalTab] = useState<"exams" | "questions">("exams");
  const currentTab = controlledTab ?? internalTab;
  const handleTabSelect = (tab: "exams" | "questions") => {
    if (setControlledTab) {
      setControlledTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Filter state (shared across tabs, exactly matching Flutter)
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterChapter, setFilterChapter] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(""); // YYYY-MM-DD
  const [sortBy, setSortBy] = useState<SortMode>("date");

  // Server-like pagination sizes (20 per page)
  const [examPageSize, setExamPageSize] = useState<number>(20);
  const [questionPageSize, setQuestionPageSize] = useState<number>(20);

  // Modals state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [deleteExamConfirm, setDeleteExamConfirm] = useState<ExamResult | null>(null);
  const [deleteQuestionConfirm, setDeleteQuestionConfirm] = useState<Question | null>(null);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<Set<string>>(new Set());
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Calendar internal month state
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => {
    return filterDate ? new Date(filterDate) : new Date();
  });
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(filterDate);

  // ── 1. User Stream (SSC vs HSC Separation) ──
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

  // ── 2. Subjects List with Emojis & Stream Safety ──
  const subjectList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; emoji: string }>();

    // A. From subjects prop
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
        const emoji = BanglaNameHelper.getSubjectEmoji(sub.id, formatted);
        map.set(sub.id, { id: sub.id, name: formatted, emoji });
      }
    });

    // B. From history exams
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
        const emoji = BanglaNameHelper.getSubjectEmoji(subId, formatted);
        map.set(subId, { id: subId || formatted, name: formatted, emoji });
      }
    });

    const entries = Array.from(map.values());
    entries.sort((a, b) => {
      const prioA = BanglaNameHelper.getSubjectSortPriority(a.name, a.id);
      const prioB = BanglaNameHelper.getSubjectSortPriority(b.name, b.id);
      if (prioA !== prioB) return prioA - prioB;
      return a.name.localeCompare(b.name, "bn");
    });
    return entries;
  }, [subjects, history, isSSC]);

  // ── 3. Chapter List dynamically derived for selected subject ──
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
    return Array.from(set).filter(Boolean);
  }, [history, filterSubject]);

  // ── 4. Filtered & Sorted Exams ──
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

      // Date filter (YYYY-MM-DD)
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

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "scoreDesc") {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === "scoreAsc") {
        return (a.score || 0) - (b.score || 0);
      }
      const dateA = new Date((a as any).created_at || a.date || 0).getTime();
      const dateB = new Date((b as any).created_at || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [history, isSSC, filterSubject, filterChapter, filterDate, sortBy]);

  const displayedExams = useMemo(() => {
    return filteredExams.slice(0, examPageSize);
  }, [filteredExams, examPageSize]);

  // ── 5. Center-Aligned 3-Card Stat Calculations ──
  const { totalQuestions, totalCorrect, avgScore } = useMemo(() => {
    let qCount = 0;
    let cCount = 0;
    let sumScore = 0;

    filteredExams.forEach((r) => {
      const tQ = r.totalQuestions || r.totalMarks || (r.questions ? r.questions.length : 0) || 0;
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

  // ── 6. Questions Tab Data (Extracted questions from completed exams) ──
  const attemptedQuestions = useMemo(() => {
    const list: {
      question: Question;
      userAns?: number;
      examTitle: string;
      examDate: string;
    }[] = [];
    const seenIds = new Set<string>();

    filteredExams.forEach((h) => {
      const subId = h.subject || (h as any).subject_id || "";
      const formatted = BanglaNameHelper.formatSubject(subId, h.subjectLabel);

      if (h.questions && Array.isArray(h.questions)) {
        h.questions.forEach((q) => {
          if (!q || !q.id || seenIds.has(String(q.id)) || deletedQuestionIds.has(String(q.id))) return;

          // Chapter filter on question level
          if (filterChapter) {
            const ch = BanglaNameHelper.formatChapter(q.chapter || "");
            if (!ch.includes(filterChapter)) return;
          }

          seenIds.add(String(q.id));
          const userAns = h.userAnswers ? h.userAnswers[q.id] : undefined;

          list.push({
            question: q,
            userAns,
            examTitle: formatted,
            examDate: (h as any).created_at || h.date,
          });
        });
      }
    });

    return list;
  }, [filteredExams, filterChapter, deletedQuestionIds]);

  const displayedQuestions = useMemo(() => {
    return attemptedQuestions.slice(0, questionPageSize);
  }, [attemptedQuestions, questionPageSize]);

  // Format date helper for Bengali chips: "১৪/৯"
  const formatChipDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${BanglaNameHelper.toBanglaNumeral(d.getDate())}/${BanglaNameHelper.toBanglaNumeral(
        d.getMonth() + 1
      )}`;
    } catch {
      return dateStr;
    }
  };

  // Format full date for cards: "১৪ সেপ্টেম্বর ২০২৬, ৩:৩৫ PM"
  const formatFullDate = (dateInput: string | Date) => {
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    } catch {
      return String(dateInput);
    }
  };

  // ── Deletion Handlers ──
  const handleDeleteExam = async () => {
    if (!deleteExamConfirm) return;
    setIsDeleting(true);
    try {
      const success = await deleteExamResult(deleteExamConfirm.id);
      if (success) {
        setHistory((prev) => prev.filter((r) => r.id !== deleteExamConfirm.id));
        toast.success("পরীক্ষার ফলাফল সফলভাবে মুছে ফেলা হয়েছে");
      } else {
        // Fallback optimistic delete
        setHistory((prev) => prev.filter((r) => r.id !== deleteExamConfirm.id));
        toast.success("পরীক্ষার ফলাফল মুছে ফেলা হয়েছে");
      }
    } catch (e) {
      setHistory((prev) => prev.filter((r) => r.id !== deleteExamConfirm.id));
      toast.success("পরীক্ষার ফলাফল মুছে ফেলা হয়েছে");
    } finally {
      setIsDeleting(false);
      setDeleteExamConfirm(null);
    }
  };

  const handleDeleteSingleQuestion = (q: Question) => {
    setDeletedQuestionIds((prev) => new Set(prev).add(String(q.id)));
    setDeleteQuestionConfirm(null);
    toast.success("প্রশ্নটি তালিকা থেকে সরানো হয়েছে");
  };

  // ── Calendar Days Calculation ──
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
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    setTempSelectedDate(dateStr);
    setDisplayedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className="w-full flex flex-col font-['HindSiliguri',sans-serif] pb-16 select-none">
      {/* ── Optional In-Page Segmented Tab Header (When headerRight is not in parent layout) ── */}
      {!controlledTab && (
        <div className="flex items-center justify-between gap-3 mb-3 px-2.5">
          <div className="flex items-center gap-2">
            <h1 className="font-['Anek_Bangla',sans-serif] text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
              ইতিহাস
            </h1>
          </div>
          <div className="h-[36px] p-[3px] bg-[#F3F4F6] dark:bg-[#1E1E1E] rounded-[12px] border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleTabSelect("exams")}
              className={cn(
                "h-[30px] px-3 rounded-[9px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center font-['Anek_Bangla',sans-serif]",
                currentTab === "exams"
                  ? "bg-[#12544F] text-white shadow-xs"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              পরীক্ষা
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("questions")}
              className={cn(
                "h-[30px] px-3 rounded-[9px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center font-['Anek_Bangla',sans-serif]",
                currentTab === "questions"
                  ? "bg-[#12544F] text-white shadow-xs"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              প্রশ্ন
            </button>
          </div>
        </div>
      )}

      {/* ── 1. Single Row Filter Bar (1:1 with Flutter Row: flex 5 Subject, flex 5 Chapter, auto Date Chip) ── */}
      <div className="px-2.5 pt-2 pb-2">
        <div className="flex items-center gap-1.5 w-full">
          {/* 1. Subject Dropdown (flex 5, h-38px) */}
          <div className="flex-[5] min-w-0">
            <div
              className={cn(
                "h-[38px] px-2.5 rounded-[10px] border flex items-center justify-between transition-colors bg-white dark:bg-[#1E1E1E]",
                filterSubject
                  ? "border-[#10B981]"
                  : "border-[#E5E7EB] dark:border-[#2E2E2E]"
              )}
            >
              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setFilterChapter(""); // reset chapter on subject change
                }}
                className="w-full bg-transparent text-[13px] font-medium text-[#0F172A] dark:text-neutral-200 outline-none cursor-pointer appearance-none truncate pr-4 font-['HindSiliguri',sans-serif]"
              >
                <option value="" className="bg-white dark:bg-[#1E1E1E] text-neutral-500">
                  সকল বিষয়
                </option>
                {subjectList.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-white"
                  >
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="text-[#6B7280] dark:text-[#A3A3A3] pointer-events-none -ml-3.5 shrink-0"
              />
            </div>
          </div>

          {/* 2. Chapter Dropdown (flex 5, h-38px) */}
          <div className="flex-[5] min-w-0">
            <div
              className={cn(
                "h-[38px] px-2.5 rounded-[10px] border flex items-center justify-between transition-colors bg-white dark:bg-[#1E1E1E]",
                filterChapter
                  ? "border-[#10B981]"
                  : "border-[#E5E7EB] dark:border-[#2E2E2E]"
              )}
            >
              <select
                value={filterChapter}
                onChange={(e) => setFilterChapter(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-[#0F172A] dark:text-neutral-200 outline-none cursor-pointer appearance-none truncate pr-4 font-['HindSiliguri',sans-serif]"
              >
                <option value="" className="bg-white dark:bg-[#1E1E1E] text-neutral-500">
                  সকল অধ্যায়
                </option>
                {chapterList.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-white"
                  >
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="text-[#6B7280] dark:text-[#A3A3A3] pointer-events-none -ml-3.5 shrink-0"
              />
            </div>
          </div>

          {/* 3. Date Filter Chip (auto width, h-38px) */}
          <div
            onClick={() => {
              setTempSelectedDate(filterDate);
              setIsDatePickerOpen(true);
            }}
            className={cn(
              "h-[38px] px-2.5 rounded-[10px] border flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer select-none",
              filterDate
                ? "bg-[#ECFDF5] dark:bg-[#064E3B] border-[#10B981] text-[#004633] dark:text-[#34D399]"
                : "bg-white dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-[#2E2E2E] text-[#6B7280] dark:text-[#A3A3A3]"
            )}
          >
            <Calendar
              size={14}
              className={cn(
                "shrink-0",
                filterDate
                  ? "text-[#004633] dark:text-[#34D399]"
                  : "text-[#6B7280] dark:text-[#A3A3A3]"
              )}
            />
            <span className="text-[13px] font-bold font-['Anek_Bangla',sans-serif] whitespace-nowrap">
              {filterDate ? formatChipDate(filterDate) : "তারিখ"}
            </span>
            {filterDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterDate("");
                }}
                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer ml-0.5"
                title="তারিখ ফিল্টার মুছুন"
              >
                <X size={13} className="shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Content Tabs (Exams vs Questions) ── */}
      <div className="px-2.5 pt-2">
        {currentTab === "exams" ? (
          /* ══════════════════════ TAB 1: EXAMS ══════════════════════ */
          filteredExams.length === 0 ? (
            /* Empty State matching Flutter _emptyState */
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-full bg-[#12544F] flex items-center justify-center text-white mb-3.5 shadow-md">
                <FlaskConical size={28} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-base font-semibold text-[#111827] dark:text-white">
                কোনো পরীক্ষা দেওয়া হয়নি
              </h3>
              <p className="font-['HindSiliguri',sans-serif] text-[13px] text-[#A3A3A3] mt-1 max-w-xs">
                {filterSubject || filterChapter || filterDate
                  ? "অন্য ফিল্টার নির্বাচন করে আবার চেষ্টা করুন।"
                  : "একটি পরীক্ষা দাও এবং তোমার অগ্রগতি এখানে দেখো।"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Center-Aligned 3-Card Stat Row matching Flutter _buildStatCard */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white dark:bg-[#18181B] rounded-[14px] border border-[#E4E4E7] dark:border-[#27272A] p-2 py-3 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[20px] font-black text-[#0F172A] dark:text-white leading-tight font-['Anek_Bangla',sans-serif]">
                    {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 font-['Anek_Bangla',sans-serif]">
                    মোট প্রশ্ন
                  </span>
                </div>
                <div className="bg-white dark:bg-[#18181B] rounded-[14px] border border-[#E4E4E7] dark:border-[#27272A] p-2 py-3 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[20px] font-black text-[#0F172A] dark:text-white leading-tight font-['Anek_Bangla',sans-serif]">
                    {BanglaNameHelper.toBanglaNumeral(totalCorrect)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 font-['Anek_Bangla',sans-serif]">
                    সঠিক উত্তর
                  </span>
                </div>
                <div className="bg-white dark:bg-[#18181B] rounded-[14px] border border-[#E4E4E7] dark:border-[#27272A] p-2 py-3 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[20px] font-black text-[#0F172A] dark:text-white leading-tight font-['Anek_Bangla',sans-serif]">
                    {BanglaNameHelper.toBanglaNumeral(avgScore)}%
                  </span>
                  <span className="text-[12px] font-semibold text-[#64748B] dark:text-[#A1A1AA] leading-tight mt-1 font-['Anek_Bangla',sans-serif]">
                    গড় নম্বর
                  </span>
                </div>
              </div>

              {/* Section Header: Title + Sort Mode Dropdown */}
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[16px] font-extrabold text-[#111827] dark:text-white font-['Anek_Bangla',sans-serif]">
                  সাম্প্রতিক পরীক্ষাসমূহ
                </h2>
                <div className="relative inline-flex items-center">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortMode)}
                    aria-label="পরীক্ষা সাজানোর ক্রম"
                    className="h-8 pl-2 pr-6 rounded-[8px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-xs font-semibold text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer appearance-none font-['Anek_Bangla',sans-serif]"
                  >
                    <option value="date">তারিখ অনুযায়ী</option>
                    <option value="scoreDesc">সর্বোচ্চ স্কোর</option>
                    <option value="scoreAsc">সর্বনিম্ন স্কোর</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="text-neutral-400 absolute right-1.5 pointer-events-none shrink-0"
                  />
                </div>
              </div>

              {/* Exam Cards List (1:1 with Flutter _ExamCard) */}
              <div className="space-y-2.5">
                {displayedExams.map((record) => {
                  const score = record.score ?? 0;
                  const scoreColor = getScoreColor(score);
                  const label = BanglaNameHelper.formatSubject(
                    record.subject,
                    record.subjectLabel || (record as any).title
                  );
                  const dateStr = formatFullDate((record as any).created_at || record.date);
                  const durationStr = formatDur(record.timeTaken);

                  // SVG Ring circumference calculations (radius = 18, 2 * PI * 18 = 113.1)
                  const radius = 18;
                  const circumference = 2 * Math.PI * radius;
                  const progressOffset = circumference - (score / 100) * circumference;

                  return (
                    <div
                      key={record.id}
                      onClick={() => onViewResult(record)}
                      className="bg-white dark:bg-[#18181B] rounded-[16px] border border-[#E4E4E7] dark:border-[#27272A] px-3.5 py-3 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group flex items-center justify-between gap-3"
                    >
                      {/* Left: 48x48 Circular Score Ring */}
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          {/* Background ring */}
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            strokeWidth="3.5"
                            className="stroke-[#F3F4F6] dark:stroke-[#27272A]"
                          />
                          {/* Progress arc */}
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            stroke={scoreColor}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[12.5px] font-semibold text-[#111827] dark:text-white font-['Anek_Bangla',sans-serif]">
                            {BanglaNameHelper.toBanglaNumeral(Math.round(score))}%
                          </span>
                        </div>
                      </div>

                      {/* Middle: Details Column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-semibold text-[14px] text-[#111827] dark:text-white truncate leading-[1.25] font-['Anek_Bangla',sans-serif]">
                          {label}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
                          <Calendar size={12} className="shrink-0" />
                          <span className="truncate">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <div className="px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#27272A] text-[11.5px] font-medium text-[#3F3F46] dark:text-[#E4E4E7] font-['Anek_Bangla',sans-serif]">
                            {BanglaNameHelper.toBanglaNumeral(record.correctCount ?? 0)} সঠিক,{" "}
                            {BanglaNameHelper.toBanglaNumeral(record.wrongCount ?? 0)} ভুল
                          </div>
                          <div className="px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#27272A] text-[11.5px] font-medium text-[#3F3F46] dark:text-[#E4E4E7] flex items-center gap-1 font-['Anek_Bangla',sans-serif]">
                            <Timer size={11} className="shrink-0" />
                            <span>{durationStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (Delete + Chevron) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteExamConfirm(record);
                          }}
                          className="p-1.5 rounded-[8px] text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="পরীক্ষা মুছে ফেলুন"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight
                          size={18}
                          className="text-[#A1A1AA] dark:text-[#525252] group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Exams Button matching Flutter */}
              {displayedExams.length < filteredExams.length && (
                <div className="pt-4 text-center">
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
          )
        ) : (
          /* ══════════════════════ TAB 2: QUESTIONS ══════════════════════ */
          attemptedQuestions.length === 0 ? (
            /* Empty State matching Flutter _emptyState */
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-full bg-[#12544F] flex items-center justify-center text-white mb-3.5 shadow-md">
                <FlaskConical size={28} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-base font-semibold text-[#111827] dark:text-white">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="font-['HindSiliguri',sans-serif] text-[13px] text-[#A3A3A3] mt-1 max-w-xs">
                {filterSubject || filterChapter || filterDate
                  ? "অন্য ফিল্টার নির্বাচন করে আবার চেষ্টা করুন।"
                  : "একটি পরীক্ষা দাও এবং তোমার সমাধান করা প্রশ্ন এখানে দেখো।"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Question list rendered using standard QuestionCard */}
              {displayedQuestions.map((item, idx) => {
                const q = item.question;
                const isBookmarked = bookmarkedIds.has(String(q.id));

                return (
                  <div key={`${q.id}-${idx}`} className="transition-all">
                    <QuestionCard
                      question={q}
                      serialNumber={idx + 1}
                      selectedOptionIndex={q.correctAnswerIndex}
                      isFlagged={false}
                      readOnly={true}
                      showAnswer={true}
                      showFeedback={true}
                      initiallyExpanded={false}
                      isBookmarked={isBookmarked}
                      onSelectOption={() => {}}
                      onToggleFlag={() => {}}
                      onToggleBookmark={onToggleBookmark ? () => onToggleBookmark(q.id) : undefined}
                      onDelete={() => setDeleteQuestionConfirm(q)}
                      onReport={() => setReportingQuestionId(String(q.id))}
                    />
                  </div>
                );
              })}

              {/* Load More Questions Button matching Flutter */}
              {displayedQuestions.length < attemptedQuestions.length && (
                <div className="pt-3 text-center">
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
          )
        )}
      </div>

      {/* ── 3. Premium Date Picker Modal (1:1 with Flutter _PremiumDatePickerModal) ── */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#27272A] rounded-t-[24px] sm:rounded-[24px] p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            {/* Top Handle Bar for Mobile */}
            <div className="w-9 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3.5 sm:hidden" />

            {/* Header: Calendar Icon + Title + Subtitle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-[#059669]/12 flex items-center justify-center text-[#10B981] shrink-0">
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-bold text-neutral-900 dark:text-white leading-tight">
                  তারিখ নির্বাচন করো
                </h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  নির্দিষ্ট দিনের পরীক্ষার ফলাফল ও প্রশ্নসমূহ দেখো
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preset Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-neutral-100 dark:border-[#222]">
              {[
                { label: "আজকে", days: 0 },
                { label: "গতকাল", days: 1 },
                { label: "৭ দিন আগে", days: 7 },
                { label: "৩০ দিন আগে", days: 30 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handleSelectPreset(p.days)}
                  className="px-2.5 py-1 rounded-[8px] bg-neutral-100 dark:bg-[#1E1E1E] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0 font-['Anek_Bangla',sans-serif]"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Month Selector Navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => {
                  setDisplayedMonth(
                    new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1)
                  );
                }}
                className="p-1 rounded-[8px] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-['Anek_Bangla',sans-serif] text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {BANGLA_MONTHS[displayedMonth.getMonth()]}{" "}
                {BanglaNameHelper.toBanglaNumeral(displayedMonth.getFullYear())}
              </span>
              <button
                type="button"
                disabled={isNextMonthDisabled}
                onClick={() => {
                  if (!isNextMonthDisabled) {
                    setDisplayedMonth(
                      new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1)
                    );
                  }
                }}
                className={cn(
                  "p-1 rounded-[8px] transition-colors",
                  isNextMonthDisabled
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {BANGLA_WEEKDAYS.map((w) => (
                <span
                  key={w}
                  className="text-[11px] font-bold text-neutral-400 font-['Anek_Bangla',sans-serif]"
                >
                  {w}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {currentMonthDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="w-8 h-8" />;
                }

                const d = new Date(
                  displayedMonth.getFullYear(),
                  displayedMonth.getMonth(),
                  day
                );
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                  d.getDate()
                ).padStart(2, "0")}`;

                const now = new Date();
                const isToday =
                  now.getFullYear() === d.getFullYear() &&
                  now.getMonth() === d.getMonth() &&
                  now.getDate() === d.getDate();

                const isFuture = d > now;
                const isSelected = tempSelectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setTempSelectedDate(dateStr)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-semibold mx-auto flex items-center justify-center transition-all font-['Anek_Bangla',sans-serif]",
                      isSelected
                        ? "bg-[#059669] text-white shadow-xs font-bold"
                        : isToday
                        ? "border border-[#059669] text-[#059669] dark:text-[#34D399]"
                        : isFuture
                        ? "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    )}
                  >
                    {BanglaNameHelper.toBanglaNumeral(day)}
                  </button>
                );
              })}
            </div>

            {/* Actions: Clear / Apply */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-[#222]">
              <button
                type="button"
                onClick={() => {
                  setFilterDate("");
                  setIsDatePickerOpen(false);
                }}
                className="flex-1 h-9 rounded-[10px] text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                ফিল্টার মুছুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterDate(tempSelectedDate);
                  setIsDatePickerOpen(false);
                }}
                className="flex-1 h-9 rounded-[10px] bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                প্রয়োগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Delete Exam Confirmation Modal (1:1 with Flutter) ── */}
      {deleteExamConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#27272A] rounded-[20px] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                পরীক্ষা মুছে ফেলবেন?
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed font-['HindSiliguri',sans-serif]">
              এই পরীক্ষার সমস্ত রেকর্ড এবং ফলাফল স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteExamConfirm(null)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteExam}
                className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 font-['Anek_Bangla',sans-serif]"
              >
                {isDeleting ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Delete Question Confirmation Modal (1:1 with Flutter _handleDeleteSingleQuestion) ── */}
      {deleteQuestionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#27272A] rounded-[20px] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="font-['Anek_Bangla',sans-serif] text-[17px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                প্রশ্নটি মুছে ফেলবে?
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed font-['HindSiliguri',sans-serif]">
              এই প্রশ্নটি তোমার তালিকা থেকে সরানো হবে। তুমি কি নিশ্চিত?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteQuestionConfirm(null)}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleQuestion(deleteQuestionConfirm)}
                className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs font-['Anek_Bangla',sans-serif]"
              >
                মুছে ফেলো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Question Report Modal (Uses common ReportModal) ── */}
      {reportingQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingQuestionId(null)}
          questionId={reportingQuestionId}
          reporterId={user?.id}
          reporterName={user?.name || user?.user_metadata?.full_name}
        />
      )}
    </div>
  );
};

export default ExamHistoryView;
