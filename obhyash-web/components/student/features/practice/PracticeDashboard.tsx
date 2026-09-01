"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Shuffle,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  XOctagon,
  ChevronDown,
  ArrowDown,
  Layers,
  Loader2,
} from "lucide-react";
import { Question, ExamResult, ExamDetails, UserProfile } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";
import {
  getUserBookmarks,
  toggleBookmark,
  getBookmarkedQuestions,
} from "@/services/bookmark-service";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
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

const BANGLA_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ"];
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
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

function isDue(id: string, map: Record<string, number>): boolean {
  const last = map[id];
  if (!last) return true;
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
  const { user: authUser } = useAuth();
  const userId = currentUser?.id || authUser?.id || "";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [flashcardQuestions, setFlashcardQuestions] = useState<Question[]>([]);
  const [flashcardResults, setFlashcardResults] = useState<FlashcardResult[]>([]);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [displayedCount, setDisplayedCount] = useState<number>(20);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkedQuestionsList, setBookmarkedQuestionsList] = useState<Question[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState<boolean>(false);

  // Spaced repetition state
  const [reviewedMap, setReviewedMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setReviewedMap(getLastReviewedMap());
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoadingBookmarks(true);
      let targetUserId = userId;
      if (!targetUserId) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        targetUserId = user?.id || "";
      }
      if (!targetUserId) {
        setIsLoadingBookmarks(false);
        return;
      }

      const bSetRaw = await getUserBookmarks(targetUserId);
      const bSet = new Set<string>(Array.from(bSetRaw).map((id) => String(id)));
      setBookmarkedIds(bSet);

      const qs = await getBookmarkedQuestions(targetUserId);
      setBookmarkedQuestionsList(qs);
    } catch (err) {
      console.error("[PracticeDashboard] Error loading bookmarks:", err);
    } finally {
      setIsLoadingBookmarks(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // ── Extract Mistakes from Exam History ──
  const { mistakesList, mistakeFrequency } = useMemo(() => {
    const map = new Map<string, Question>();
    const freq = new Map<string, number>();

    history.forEach((exam) => {
      if (!exam.questions || exam.questions.length === 0) return;

      exam.questions.forEach((q) => {
        const qId = String(q.id);
        const userAns = exam.userAnswers ? exam.userAnswers[q.id] : undefined;
        if (userAns === undefined) return;

        const isCorrect =
          String(userAns) === String(q.correctAnswer) ||
          (typeof userAns === "number" && String.fromCharCode(65 + userAns) === q.correctAnswer) ||
          userAns === q.correctAnswerIndex;

        if (!isCorrect) {
          freq.set(qId, (freq.get(qId) || 0) + 1);
          if (!map.has(qId)) {
            map.set(qId, q);
          }
        }
      });
    });

    return {
      mistakesList: Array.from(map.values()),
      mistakeFrequency: freq,
    };
  }, [history]);

  // ── Due Count for Spaced Repetition ──
  const dueCount = useMemo(() => {
    return mistakesList.filter((q) => isDue(String(q.id), reviewedMap)).length;
  }, [mistakesList, reviewedMap]);

  // ── Active Base List ──
  const baseList = useMemo(() => {
    return activeTab === "mistakes" ? mistakesList : bookmarkedQuestionsList;
  }, [activeTab, mistakesList, bookmarkedQuestionsList]);

  // ── Available Subjects for Filter Pills ──
  const availableSubjects = useMemo(() => {
    const map = new Map<string, string>();
    baseList.forEach((q) => {
      const subId = q.subject || "general";
      const formatted = BanglaNameHelper.formatSubject(subId, q.subjectLabel);
      if (!map.has(subId)) {
        map.set(subId, formatted);
      }
    });
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }, [baseList]);

  // ── Filtered List ──
  const filteredList = useMemo(() => {
    if (subjectFilter === "all") return baseList;
    return baseList.filter(
      (q) =>
        q.subject === subjectFilter ||
        BanglaNameHelper.formatSubject(q.subject, q.subjectLabel) === subjectFilter
    );
  }, [baseList, subjectFilter]);

  // ── Paginated / Displayed List ──
  const currentList = useMemo(() => {
    return filteredList.slice(0, displayedCount);
  }, [filteredList, displayedCount]);

  const hasMore = displayedCount < filteredList.length;

  // Toggle selection for a single question
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    const allSelected = currentList.every((q) => selectedIds.has(String(q.id)));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      currentList.forEach((q) => next.add(String(q.id)));
      setSelectedIds(next);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (q: Question) => {
    const qId = String(q.id);
    const isMarked = bookmarkedIds.has(qId);

    // Optimistic UI update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isMarked) next.delete(qId);
      else next.add(qId);
      return next;
    });

    if (isMarked) {
      setBookmarkedQuestionsList((prev) => prev.filter((item) => String(item.id) !== qId));
    } else {
      setBookmarkedQuestionsList((prev) => [q, ...prev]);
    }

    if (!userId) {
      toast.error("অনুগ্রহ করে লগইন করুন");
      return;
    }

    try {
      await toggleBookmark(userId, q.id, isMarked);
      toast.success(isMarked ? "বুকমার্ক সরানো হয়েছে" : "বুকমার্কে যোগ করা হয়েছে");
    } catch {
      toast.error("বুকমার্ক আপডেট করতে সমস্যা হয়েছে");
      fetchBookmarks();
    }
  };

  const toggleExplanation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Launch Flashcard Session
  const handleLaunchFlashcard = () => {
    let selected = filteredList.filter((q) => selectedIds.has(String(q.id)));
    if (selected.length === 0) return;

    if (shuffle) {
      selected = [...selected].sort(() => Math.random() - 0.5);
    }

    markReviewed(selected.map((q) => String(q.id)));
    setReviewedMap(getLastReviewedMap());
    setFlashcardQuestions(selected);
    setViewState("flashcard");
  };

  if (viewState === "flashcard") {
    return (
      <FlashcardMode
        questions={flashcardQuestions}
        onComplete={(results) => {
          setFlashcardResults(results);
          setViewState("summary");
        }}
        onExit={() => {
          setViewState("list");
          setSelectedIds(new Set());
        }}
      />
    );
  }

  if (viewState === "summary") {
    return (
      <PracticeSummary
        results={flashcardResults}
        mode="flashcard"
        onPracticeStruggling={(strugglingQuestions) => {
          setFlashcardQuestions(strugglingQuestions);
          setViewState("flashcard");
        }}
        onBack={() => {
          setViewState("list");
          setSelectedIds(new Set());
          fetchBookmarks();
        }}
      />
    );
  }

  const allSelected =
    currentList.length > 0 && currentList.every((q) => selectedIds.has(String(q.id)));

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-1 sm:px-3 py-2 sm:py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Top Stat Row (Matching Flutter _StatBox 1:1) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {/* Box 1: মোট ভুল (Red) */}
        {/* Box 1: মোট ভুল (Red) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0">
            <img src="/dashboard-icons/mistake_review.svg" alt="Mistakes" className="w-7 h-7 object-contain drop-shadow-xs" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              মোট ভুল
            </span>
            <span className="text-base sm:text-xl font-black text-red-600 dark:text-red-400 tabular-nums">
              {BanglaNameHelper.toBanglaNumeral(mistakesList.length)}
            </span>
          </div>
        </div>

        {/* Box 2: বুকমার্ক (Green) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
            <img src="/dashboard-icons/bookmarks.svg" alt="Bookmarks" className="w-7 h-7 object-contain drop-shadow-xs" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              বুকমার্ক
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {BanglaNameHelper.toBanglaNumeral(bookmarkedIds.size)}
            </span>
          </div>
        </div>

        {/* Box 3: রিভিউ বাকি (Indigo) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
            <img src="/dashboard-icons/spaced_repetition.svg" alt="Spaced Repetition" className="w-7 h-7 object-contain drop-shadow-xs" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
              রিভিউ বাকি
            </span>
            <span className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
              {BanglaNameHelper.toBanglaNumeral(dueCount)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Mode Tab Switcher (Mistakes vs Bookmarks) ── */}
      <div className="flex bg-neutral-100 dark:bg-[#18181B] p-1 rounded-2xl border border-neutral-200 dark:border-[#27272A] mb-3 w-full sm:w-fit shadow-sm">
        <button
          onClick={() => {
            setActiveTab("mistakes");
            setSubjectFilter("all");
            setSelectedIds(new Set());
          }}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            activeTab === "mistakes"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          ভুল উত্তরসমূহ ({BanglaNameHelper.toBanglaNumeral(mistakesList.length)})
        </button>
        <button
          onClick={() => {
            setActiveTab("bookmarks");
            setSubjectFilter("all");
            setSelectedIds(new Set());
          }}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center",
            activeTab === "bookmarks"
              ? "bg-[#004633] text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          বুকমার্কসমূহ ({BanglaNameHelper.toBanglaNumeral(bookmarkedIds.size)})
        </button>
      </div>

      {/* ── 3. Horizontal Subject Filter Pills (Matching Flutter _Pill 1:1) ── */}
      {availableSubjects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setSubjectFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              subjectFilter === "all"
                ? "bg-[#004633] text-white shadow-sm"
                : "bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
            )}
          >
            সব বিষয়
          </button>
          {availableSubjects.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSubjectFilter(s.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                subjectFilter === s.key
                  ? "bg-[#004633] text-white shadow-sm"
                  : "bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
              )}
            >
              {s.value}
            </button>
          ))}
        </div>
      )}

      {/* ── 4. Toolbar (Matching Flutter _buildToolbar 1:1) ── */}
      {currentList.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm mb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleSelectAll}
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                allSelected
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400"
              )}
            >
              {allSelected && <span className="text-xs font-bold">✓</span>}
            </button>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {BanglaNameHelper.toBanglaNumeral(selectedIds.size)} নির্বাচিত
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Shuffle toggle */}
            <button
              type="button"
              onClick={() => setShuffle(!shuffle)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                shuffle
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-700/60"
                  : "bg-white dark:bg-[#18181B] border-neutral-200 dark:border-[#27272A] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Shuffle size={13} className={shuffle ? "text-emerald-600" : "text-neutral-400"} />
              <span>{shuffle ? "র‍্যান্ডম অন" : "র‍্যান্ডম"}</span>
            </button>

            {/* Start practice button */}
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleLaunchFlashcard}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer",
                selectedIds.size > 0
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-600/20"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-neutral-700"
              )}
            >
              <PlayCircle size={15} />
              <span>শুরু</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Question Cards (Matching Flutter _buildQuestionCard 1:1) ── */}
      {isLoadingBookmarks && activeTab === "bookmarks" ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#004633] dark:text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            বুকমার্ক করা প্রশ্ন লোড হচ্ছে...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
            {activeTab === "mistakes" ? <XOctagon size={28} /> : <Bookmark size={28} />}
          </div>
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
            {activeTab === "mistakes" ? "কোনো ভুল উত্তর নেই" : "কোনো বুকমার্ক নেই"}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {activeTab === "mistakes"
              ? "তুমি পরীক্ষায় যে সকল ভুল করবে তা এখানে জমা হবে যাতে সহজে রিভিশন দিতে পারো।"
              : "গুরুত্বপূর্ণ প্রশ্ন বুকমার্ক করে রাখলে এখানে পেয়ে যাবে।"}
          </p>
          <button
            type="button"
            onClick={onNavigateToMock}
            className="px-5 py-2.5 bg-[#004633] text-white rounded-xl text-xs font-bold shadow hover:bg-[#003627] transition-all cursor-pointer"
          >
            মডেল টেস্ট শুরু করো
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((q) => {
            const isSel = selectedIds.has(String(q.id));
            const freq = mistakeFrequency.get(String(q.id));
            const isMarked = bookmarkedIds.has(String(q.id));
            const isExp = expandedExplanation[String(q.id)];

            return (
              <div
                key={q.id}
                onClick={() => toggleSelection(String(q.id))}
                className={cn(
                  "p-4 rounded-2xl bg-white dark:bg-[#18181B] border transition-all cursor-pointer shadow-sm space-y-3 select-none",
                  isSel
                    ? "border-red-500 dark:border-red-500 ring-1 ring-red-500"
                    : "border-neutral-200 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700"
                )}
              >
                {/* Top Row: Selection box + Mistake Badge + Bookmark */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        isSel
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-neutral-300 dark:border-neutral-600"
                      )}
                    >
                      {isSel && <span className="text-xs font-bold">✓</span>}
                    </div>

                    {activeTab === "mistakes" && freq && freq > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-200 dark:border-red-900/40">
                        {BanglaNameHelper.toBanglaNumeral(freq)} বার ভুল
                      </span>
                    )}

                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      {BanglaNameHelper.formatSubject(q.subject, q.subjectLabel)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark(q);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      isMarked
                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    )}
                  >
                    {isMarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white leading-relaxed">
                  <LatexText text={q.question} />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect =
                      String(q.correctAnswer) === String(optIdx) ||
                      q.correctAnswer === String.fromCharCode(65 + optIdx) ||
                      q.correctAnswer === opt ||
                      optIdx === q.correctAnswerIndex;

                    return (
                      <div
                        key={optIdx}
                        className={cn(
                          "p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2 transition-all",
                          isCorrect
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 font-bold"
                            : "bg-neutral-50/50 dark:bg-[#141417] border-neutral-200/80 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5",
                            isCorrect
                              ? "bg-emerald-500 text-white"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          )}
                        >
                          {BANGLA_OPTIONS[optIdx] || optIdx + 1}
                        </span>
                        <div className="flex-1">
                          <LatexText text={opt} />
                        </div>
                        {isCorrect && (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
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
                      onClick={(e) => toggleExplanation(String(q.id), e)}
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

          {/* ── 6. Load More Button (Matching Flutter pagination 1:1) ── */}
          {hasMore && (
            <div className="pt-3 pb-8 text-center">
              <button
                type="button"
                onClick={() => setDisplayedCount((c) => c + 20)}
                className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181B] text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 mx-auto shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <ArrowDown size={15} className="text-emerald-600" />
                <span>আরও ২০টি প্রশ্ন লোড করো</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeDashboard;
