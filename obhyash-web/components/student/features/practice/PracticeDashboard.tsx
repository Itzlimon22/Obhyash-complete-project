"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Shuffle,
  Play,
  Layers,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Question, ExamResult, ExamDetails, UserProfile } from "@/lib/types";
import {
  getUserBookmarks,
  toggleBookmark,
  getBookmarkedQuestions,
} from "@/services/bookmark-service";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { toast } from "sonner";
import FlashcardMode, { FlashcardResult } from "./FlashcardMode";
import PracticeSummary from "./PracticeSummary";
import LatexText from "@/components/student/ui/common/LatexText";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PracticeDashboardProps {
  history: ExamResult[];
  onStartPractice: (questions: Question[], details: ExamDetails) => void;
  onNavigateToMock: () => void;
  subjects?: string[];
  currentUser?: UserProfile | null;
  initialTab?: "mistakes" | "bookmarks";
}

type Tab = "mistakes" | "bookmarks";
type ViewState = "list" | "flashcard" | "summary";

const ITEMS_PER_PAGE = 15;
const BANGLA_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ"];

// ─── Spaced Repetition Helpers ─────────────────────────────────────────────

const REVIEW_INTERVAL_DAYS = 3;
const LS_KEY = "practice_last_reviewed";

function getLastReviewedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function markReviewed(ids: string[]) {
  const map = getLastReviewedMap();
  const now = Date.now();
  ids.forEach((id) => (map[id] = now));
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

function isDue(id: string, map: Record<string, number>): boolean {
  const last = map[id];
  if (!last) return false;
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return daysSince >= REVIEW_INTERVAL_DAYS;
}

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({
  history,
  onStartPractice,
  onNavigateToMock,
  currentUser,
  initialTab = "mistakes",
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [shuffle, setShuffle] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [flashcardQuestions, setFlashcardQuestions] = useState<Question[]>([]);
  const [flashcardResults, setFlashcardResults] = useState<FlashcardResult[]>(
    []
  );
  const [expandedExplanation, setExpandedExplanation] = useState<
    Record<string, boolean>
  >({});

  // Bookmarks state
  const [globalBookmarks, setGlobalBookmarks] = useState<Question[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Spaced repetition
  const [reviewedMap, setReviewedMap] = useState<Record<string, number>>({});
  useEffect(() => {
    setReviewedMap(getLastReviewedMap());
  }, []);

  // ── Compute mistake frequency map ──────────────────────────────────────────
  const { mistakes, mistakeFrequency } = useMemo(() => {
    const mistakeMap = new Map<string, Question>();
    const freq = new Map<string, number>();

    history.forEach((result) => {
      if (result.questions && result.userAnswers) {
        result.questions.forEach((q) => {
          const userAns = result.userAnswers?.[q.id];
          if (userAns !== undefined && userAns !== null && userAns !== -1) {
            const isCorrect =
              userAns === q.correctAnswerIndex ||
              (q.correctAnswerIndices != null &&
                q.correctAnswerIndices.includes(userAns));

            if (!isCorrect) {
              mistakeMap.set(q.id, q);
              freq.set(q.id, (freq.get(q.id) ?? 0) + 1);
            }
          }
        });
      }
    });

    const sorted = Array.from(mistakeMap.values()).sort(
      (a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0)
    );

    return { mistakes: sorted, mistakeFrequency: freq };
  }, [history]);

  // ── Fetch Bookmarks ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!currentUser?.id) return;
      setIsLoadingBookmarks(true);
      try {
        const idsSet = await getUserBookmarks(currentUser.id);
        const ids = Array.from(idsSet).map(String);
        setBookmarkedIds(new Set(ids));
        if (ids.length > 0) {
          const questions = await getBookmarkedQuestions(currentUser.id);
          questions.sort((a, b) => {
            if (!a.bookmarkedAt || !b.bookmarkedAt) return 0;
            return (
              new Date(b.bookmarkedAt).getTime() -
              new Date(a.bookmarkedAt).getTime()
            );
          });
          setGlobalBookmarks(questions);
        } else {
          setGlobalBookmarks([]);
        }
      } catch {
        toast.error("বুকমার্ক লোড করতে সমস্যা হয়েছে।");
      } finally {
        setIsLoadingBookmarks(false);
      }
    };
    fetchBookmarks();
  }, [currentUser?.id]);

  // ── Bookmark Toggle ─────────────────────────────────────────────────────────
  const handleToggleBookmark = useCallback(
    async (questionId: string) => {
      if (!currentUser?.id) return;
      const isCurrentlyBookmarked = bookmarkedIds.has(questionId);
      const newIds = new Set(bookmarkedIds);
      if (isCurrentlyBookmarked) {
        newIds.delete(questionId);
        setGlobalBookmarks((prev) => prev.filter((q) => q.id !== questionId));
      } else {
        newIds.add(questionId);
        if (activeTab === "mistakes") {
          const q = mistakes.find((q) => q.id === questionId);
          if (q) setGlobalBookmarks((prev) => [...prev, q]);
        }
      }
      setBookmarkedIds(newIds);
      try {
        await toggleBookmark(currentUser.id, questionId, isCurrentlyBookmarked);
        toast.success(
          isCurrentlyBookmarked
            ? "বুকমার্ক সরানো হয়েছে"
            : "বুকমার্ক সেভ করা হয়েছে"
        );
      } catch {
        toast.error("বুকমার্ক আপডেট করতে সমস্যা হয়েছে।");
        setBookmarkedIds(bookmarkedIds);
      }
    },
    [currentUser?.id, bookmarkedIds, activeTab, mistakes]
  );

  // ── All subjects from current list ─────────────────────────────────────────
  const baseList = activeTab === "mistakes" ? mistakes : globalBookmarks;

  const allSubjects = useMemo(() => {
    const labelMap = new Map<string, string>();
    baseList.forEach((q) => {
      const label = q.subjectLabel || q.subject;
      if (label && !labelMap.has(label)) {
        labelMap.set(label, q.subject);
      }
    });

    return Array.from(labelMap.entries()).map(
      ([label, id]) => [id, label] as [string, string]
    );
  }, [baseList]);

  useEffect(() => {
    setSubjectFilter("all");
    setDateFilter("");
    setSelectedQuestions(new Set());
    setCurrentPage(1);
  }, [activeTab]);

  const currentList = useMemo(() => {
    let list = baseList;

    if (subjectFilter !== "all") {
      const targetLabel = allSubjects.find(([id]) => id === subjectFilter)?.[1];
      list = list.filter((q) => (q.subjectLabel || q.subject) === targetLabel);
    }

    if (activeTab === "bookmarks" && dateFilter) {
      list = list.filter((q) => {
        if (!q.bookmarkedAt) return false;
        const bDate = new Date(q.bookmarkedAt).toISOString().split("T")[0];
        return bDate === dateFilter;
      });
    }

    if (shuffle) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, [baseList, subjectFilter, allSubjects, dateFilter, activeTab, shuffle]);

  const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    return currentList.slice(startIdx, endIdx);
  }, [currentList, currentPage]);

  const dueCount = useMemo(
    () =>
      [...mistakes, ...globalBookmarks].filter((q) => isDue(q.id, reviewedMap))
        .length,
    [mistakes, globalBookmarks, reviewedMap]
  );

  const currentSelection = useMemo(
    () =>
      new Set(
        [...selectedQuestions].filter((id) =>
          currentList.some((q) => q.id === id)
        )
      ),
    [selectedQuestions, currentList]
  );

  const toggleSelection = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (currentSelection.size === currentList.length) {
      setSelectedQuestions((prev) => {
        const next = new Set(prev);
        currentList.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      setSelectedQuestions((prev) => {
        const next = new Set(prev);
        currentList.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  const toggleExplanation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ── Launch helpers ──────────────────────────────────────────────────────────
  const getSelectedQuestions = (): Question[] => {
    let qs = currentList.filter((q) => currentSelection.has(q.id));
    if (shuffle) qs = [...qs].sort(() => Math.random() - 0.5);
    return qs;
  };

  const handleLaunchFlashcards = () => {
    const qs = getSelectedQuestions();
    if (qs.length === 0) return;
    markReviewed(qs.map((q) => q.id));
    setReviewedMap(getLastReviewedMap());
    setFlashcardQuestions(qs);
    setViewState("flashcard");
  };

  const handleLaunchPracticeExam = () => {
    const qs = getSelectedQuestions();
    if (qs.length === 0) return;

    const details: ExamDetails = {
      subject: "অনুশীলন পরীক্ষা",
      subjectLabel: "অনুশীলন ও ভুল উত্তর রিভিশন",
      examType: "Practice Exam",
      chapters: "Custom Selection",
      topics: "Mixed",
      totalQuestions: qs.length,
      durationMinutes: Math.max(5, Math.ceil(qs.length * 1.5)),
      totalMarks: qs.reduce((acc, q) => acc + (q.points || 1), 0),
      negativeMarking: 0.25,
    };

    onStartPractice(qs, details);
  };

  const handleFlashcardComplete = (results: FlashcardResult[]) => {
    setFlashcardResults(results);
    setViewState("summary");
  };

  const handlePracticeStruggling = (qs: Question[]) => {
    setFlashcardQuestions(qs);
    setFlashcardResults([]);
    setViewState("flashcard");
  };

  // ── Alternate views: flashcard / summary ───────────────────────────────────
  if (viewState === "flashcard") {
    return (
      <FlashcardMode
        questions={flashcardQuestions}
        onComplete={handleFlashcardComplete}
        onExit={() => setViewState("list")}
      />
    );
  }

  if (viewState === "summary") {
    return (
      <PracticeSummary
        results={flashcardResults}
        mode="flashcard"
        onPracticeStruggling={handlePracticeStruggling}
        onBack={() => setViewState("list")}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-4 md:p-6 space-y-4 animate-fade-in font-['HindSiliguri'] pb-24">
      {/* ── Top Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          {
            label: "মোট ভুল উত্তর",
            value: BanglaNameHelper.toBanglaNumeral(mistakes.length),
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/30",
            border: "border-red-200 dark:border-red-900/40",
          },
          {
            label: "সংরক্ষিত বুকমার্ক",
            value: BanglaNameHelper.toBanglaNumeral(globalBookmarks.length),
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            border: "border-emerald-200 dark:border-emerald-900/40",
          },
          {
            label: "আজকের রিভিশন বাকি",
            value: BanglaNameHelper.toBanglaNumeral(dueCount),
            color: "text-sky-500",
            bg: "bg-sky-50 dark:bg-sky-950/30",
            border: "border-sky-200 dark:border-sky-900/40",
          },
        ].map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl p-3 sm:p-4 text-center shadow-sm border",
              bg,
              border
            )}
          >
            <div className={cn("text-2xl sm:text-3xl font-black", color)}>
              {value}
            </div>
            <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs (Mistakes vs Bookmarks) ── */}
      <div className="flex bg-neutral-100 dark:bg-[#18181B] p-1 rounded-2xl w-fit border border-neutral-200 dark:border-[#27272A] shadow-sm">
        <button
          onClick={() => setActiveTab("mistakes")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all",
            activeTab === "mistakes"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          ভুল উত্তর ব্যাংক ({BanglaNameHelper.toBanglaNumeral(mistakes.length)})
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all",
            activeTab === "bookmarks"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          বুকমার্কস ({BanglaNameHelper.toBanglaNumeral(globalBookmarks.length)})
        </button>
      </div>

      {/* ── Subject Filter Pills ── */}
      {(allSubjects.length > 0 || activeTab === "bookmarks") && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {([["all", "সব বিষয়"]] as [string, string][])
              .concat(allSubjects)
              .map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setSubjectFilter(code)}
                  className={cn(
                    "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                    subjectFilter === code
                      ? "bg-[#004633] text-white border-[#004633] shadow"
                      : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A] hover:border-neutral-400"
                  )}
                >
                  {BanglaNameHelper.formatSubject(label, label)}
                </button>
              ))}
          </div>

          {activeTab === "bookmarks" && (
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Main List Container ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] overflow-hidden shadow-sm flex flex-col">
        {isLoadingBookmarks && activeTab === "bookmarks" ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-3 text-neutral-400">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white mb-1">
              কোনো তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-neutral-500 text-xs max-w-md mb-5">
              {activeTab === "mistakes"
                ? "তুমি এখনো কোনো পরীক্ষায় ভুল উত্তর দাওনি অথবা ফিল্টারে কোনো তথ্য নেই।"
                : "তুমি এখনো কোনো প্রশ্ন বুকমার্ক করে রাখোনি।"}
            </p>
            <button
              onClick={onNavigateToMock}
              className="px-5 py-2 bg-[#004633] text-white rounded-xl text-xs font-bold shadow hover:bg-[#003627] transition-all"
            >
              নতুন পরীক্ষা দিন
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-3.5 sm:p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex justify-between items-center bg-neutral-50/50 dark:bg-[#141417] gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    currentSelection.size === currentList.length &&
                    currentList.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  {BanglaNameHelper.toBanglaNumeral(currentSelection.size)}টি নির্বাচিত
                </span>

                {/* Shuffle toggle */}
                <button
                  onClick={() => setShuffle((s) => !s)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all",
                    shuffle
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300"
                      : "bg-white dark:bg-[#18181B] text-neutral-500 border-neutral-200 dark:border-[#27272A]"
                  )}
                >
                  <Shuffle size={12} />
                  <span>{shuffle ? "Random On" : "Random"}</span>
                </button>
              </div>

              {/* Dual Launch Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchFlashcards}
                  disabled={currentSelection.size === 0}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm",
                    currentSelection.size > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-indigo-600/20"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  )}
                >
                  <Layers size={14} />
                  <span>ফ্ল্যাশকার্ড</span>
                </button>

                <button
                  onClick={handleLaunchPracticeExam}
                  disabled={currentSelection.size === 0}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm",
                    currentSelection.size > 0
                      ? "bg-[#004633] hover:bg-[#003627] text-white active:scale-95 shadow-emerald-900/30"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  )}
                >
                  <Play size={14} className="fill-white" />
                  <span>অনুশীলন পরীক্ষা</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-neutral-50/40 dark:bg-[#121214]">
              {paginatedList.map((question, idx) => {
                const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                const freq = mistakeFrequency.get(question.id);
                const isSelected = selectedQuestions.has(question.id);
                const isExp = !!expandedExplanation[question.id];

                const sourceTag = BanglaNameHelper.formatQuestionSource({
                  institutes: (question as any).institutes,
                  years: (question as any).years,
                  examHistory:
                    (question as any).examHistory ||
                    (question as any).exam_history,
                });

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => toggleSelection(question.id)}
                    className={cn(
                      "group rounded-2xl p-4 transition-all cursor-pointer border bg-white dark:bg-[#18181B] shadow-sm",
                      isSelected
                        ? "border-[#004633] dark:border-[#004633] ring-1 ring-[#004633]"
                        : "border-neutral-200/90 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-[#004633] border-[#004633]"
                              : "border-neutral-300 dark:border-neutral-600"
                          )}
                        >
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3 h-3 text-white"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta Tags Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-neutral-300 text-[10px] font-bold">
                            {BanglaNameHelper.formatSubject(
                              question.subjectLabel || question.subject,
                              question.subject
                            )}
                          </span>

                          {sourceTag && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black border border-blue-200 dark:border-blue-800">
                              {sourceTag}
                            </span>
                          )}

                          {freq !== undefined && activeTab === "mistakes" && (
                            <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-900/40">
                              {BanglaNameHelper.toBanglaNumeral(freq)}× ভুল
                            </span>
                          )}
                        </div>

                        {/* Question Text */}
                        <div className="text-sm font-bold text-neutral-900 dark:text-white leading-snug mb-2 flex items-start gap-1.5">
                          <span className="font-mono text-neutral-500">
                            {BanglaNameHelper.toBanglaNumeral(globalIdx + 1)}.
                          </span>
                          <div className="flex-1">
                            <LatexText text={question.question} />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-2">
                          {question.options.map((opt, optIdx) => {
                            const isCorrect =
                              optIdx === question.correctAnswerIndex ||
                              (question.correctAnswerIndices != null &&
                                question.correctAnswerIndices.includes(optIdx));

                            return (
                              <div
                                key={optIdx}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2",
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-[#004633]/30 border-emerald-300 dark:border-[#004633] text-emerald-800 dark:text-emerald-300"
                                    : "bg-neutral-50/60 dark:bg-[#141417] border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                    isCorrect
                                      ? "bg-[#004633] text-white"
                                      : "bg-neutral-200 dark:bg-[#27272A] text-neutral-600 dark:text-neutral-400"
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

                        {/* Explanation Toggle & Drawer */}
                        {question.explanation && (
                          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                            <button
                              type="button"
                              onClick={(e) => toggleExplanation(question.id, e)}
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
                                <LatexText text={question.explanation} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bookmark Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(question.id);
                        }}
                        className={cn(
                          "p-2 rounded-xl transition-all shrink-0",
                          bookmarkedIds.has(question.id)
                            ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-neutral-400 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-[#27272A]"
                        )}
                      >
                        <Bookmark
                          size={16}
                          className={cn(
                            bookmarkedIds.has(question.id) && "fill-emerald-500"
                          )}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="text-neutral-500 font-bold">
                  পৃষ্ঠা {BanglaNameHelper.toBanglaNumeral(currentPage)} /{" "}
                  {BanglaNameHelper.toBanglaNumeral(totalPages)} (
                  {BanglaNameHelper.toBanglaNumeral(currentList.length)}টি প্রশ্ন)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-neutral-200 dark:border-[#27272A] disabled:opacity-40 font-bold"
                  >
                    পূর্ববর্তী
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-neutral-200 dark:border-[#27272A] disabled:opacity-40 font-bold"
                  >
                    পরবর্তী
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeDashboard;
