"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Bookmark,
  Shuffle,
  PlayCircle,
  XOctagon,
  ArrowDown,
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
import ProUpgradeModal from "@/components/common/ProUpgradeModal";
import { isUserPro } from "@/lib/subscription-utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PracticeDashboardProps {
  history: ExamResult[];
  onStartPractice: (questions: Question[], details: ExamDetails) => void;
  onNavigateToMock: () => void;
  subjects?: string[];
  currentUser?: UserProfile | null;
  initialTab?: "mistakes" | "bookmarks";
  activeTab?: "mistakes" | "bookmarks";
  onTabChange?: (tab: "mistakes" | "bookmarks") => void;
}

type Tab = "mistakes" | "bookmarks";
type ViewState = "list" | "flashcard" | "summary";

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
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const { user: authUser, profile: authProfile } = useAuth();
  const effectiveUser = currentUser || authProfile;
  const userId = effectiveUser?.id || authUser?.id || "";

  const isPro = isUserPro(effectiveUser);

  const [showProBookmarkModal, setShowProBookmarkModal] = useState(false);
  const [internalTab, setInternalTab] = useState<Tab>(initialTab);
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: Tab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [flashcardQuestions, setFlashcardQuestions] = useState<Question[]>([]);
  const [flashcardResults, setFlashcardResults] = useState<FlashcardResult[]>([]);
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

  // ── User Stream Detection (Strict SSC vs HSC Separation) ──
  const isSSC = useMemo(() => {
    const anyUser = effectiveUser as any;
    const rawStream = (
      anyUser?.stream ||
      anyUser?.level ||
      anyUser?.user_metadata?.stream ||
      anyUser?.user_metadata?.level ||
      ""
    )
      .toString()
      .toUpperCase();
    return rawStream.includes("SSC");
  }, [effectiveUser]);

  // ── Active Base List (Filtered by Stream) ──
  const baseList = useMemo(() => {
    const rawList = activeTab === "mistakes" ? mistakesList : bookmarkedQuestionsList;
    return rawList.filter((q) => {
      const subId = (q.subject || "").toLowerCase();
      const subLabel = (q.subjectLabel || "").toLowerCase();
      if (isSSC) {
        if (subId.startsWith("hsc_") || subLabel.includes("hsc")) return false;
      } else {
        if (
          subId.startsWith("ssc_") ||
          subId === "math" ||
          subId === "general_math" ||
          subLabel.includes("ssc") ||
          subLabel === "সাধারণ গণিত"
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activeTab, mistakesList, bookmarkedQuestionsList, isSSC]);

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

    if (!isMarked && !isPro && bookmarkedIds.size >= 25) {
      setShowProBookmarkModal(true);
      return;
    }

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
      await toggleBookmark(userId, q.id, isMarked, isPro);
      toast.success(isMarked ? "বুকমার্ক সরানো হয়েছে" : "বুকমার্কে যোগ করা হয়েছে");
    } catch (err: any) {
      if (err?.message === "BOOKMARK_LIMIT_EXCEEDED") {
        setShowProBookmarkModal(true);
      } else {
        toast.error("বুকমার্ক আপডেট করতে সমস্যা হয়েছে");
      }
      fetchBookmarks();
    }
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
    <div className="w-full max-w-full min-w-0 flex flex-col font-sans pb-16 overflow-x-hidden">
      {/* ── 1. Top Stat Row (Matching Flutter _StatBox 1:1) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {/* Box 1: মোট ভুল */}
        <div className="py-3 px-2 sm:py-3.5 sm:px-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#F4F4F5] dark:border-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 mb-2">
            <img
              src="/dashboard-icons/mistake_review.svg"
              alt="Mistakes"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums leading-tight">
            {BanglaNameHelper.toBanglaNumeral(mistakesList.length)}
          </span>
          <span className="text-[11.5px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
            মোট ভুল
          </span>
        </div>

        {/* Box 2: বুকমার্ক */}
        <div className="py-3 px-2 sm:py-3.5 sm:px-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#F4F4F5] dark:border-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 mb-2">
            <img
              src="/dashboard-icons/bookmarks.svg"
              alt="Bookmarks"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums leading-tight">
            {BanglaNameHelper.toBanglaNumeral(bookmarkedIds.size)}
          </span>
          <span className="text-[11.5px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
            বুকমার্ক
          </span>
        </div>

        {/* Box 3: রিভিউ বাকি */}
        <div className="py-3 px-2 sm:py-3.5 sm:px-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#F4F4F5] dark:border-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 mb-2">
            <img
              src="/dashboard-icons/spaced_repetition.svg"
              alt="Spaced Repetition"
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums leading-tight">
            {BanglaNameHelper.toBanglaNumeral(dueCount)}
          </span>
          <span className="text-[11.5px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
            রিভিউ বাকি
          </span>
        </div>
      </div>

      {/* ── 2. Horizontal Subject Filter Pills (Matching Flutter _Pill 1:1) ── */}
      {availableSubjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <button
            type="button"
            onClick={() => setSubjectFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer border",
              subjectFilter === "all"
                ? "bg-[#B91C1C] border-[#B91C1C] text-white"
                : "bg-white dark:bg-black border-[#E5E5E5] dark:border-[#27272A] text-[#525252] dark:text-[#A3A3A3] hover:border-neutral-300"
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
                "px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer border",
                subjectFilter === s.key
                  ? "bg-[#B91C1C] border-[#B91C1C] text-white"
                  : "bg-white dark:bg-black border-[#E5E5E5] dark:border-[#27272A] text-[#525252] dark:text-[#A3A3A3] hover:border-neutral-300"
              )}
            >
              {s.value}
            </button>
          ))}
        </div>
      )}

      {/* ── 3. Toolbar (Matching Flutter _buildToolbar 1:1) ── */}
      {currentList.length > 0 && (
        <div className="flex items-center justify-between gap-3 py-2 px-1 mb-3">
          {/* Select all */}
          <div
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all",
                allSelected
                  ? "bg-[#B91C1C] border-[#B91C1C] text-white"
                  : "border-[#A3A3A3] bg-transparent"
              )}
            >
              {allSelected && <span className="text-xs font-bold leading-none">✓</span>}
            </div>
            <span className="text-base font-bold text-[#525252] dark:text-[#A3A3A3]">
              {selectedIds.size} নির্বাচিত
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Shuffle toggle */}
            <button
              type="button"
              onClick={() => setShuffle(!shuffle)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-base font-bold flex items-center gap-1 border transition-all cursor-pointer",
                shuffle
                  ? "bg-[#059669]/10 border-[#059669]/30 text-[#059669]"
                  : "bg-white dark:bg-[#1C1C1E] border-[#E5E5E5] dark:border-[#27272A] text-[#A3A3A3]"
              )}
            >
              <Shuffle size={14} className={shuffle ? "text-[#059669]" : "text-[#A3A3A3]"} />
              <span>{shuffle ? "র‍্যান্ডম অন" : "র‍্যান্ডম"}</span>
            </button>

            {/* Start practice button */}
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleLaunchFlashcard}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                selectedIds.size > 0
                  ? "bg-[#059669] hover:bg-[#047857] text-white active:scale-95 shadow-sm"
                  : "bg-[#E5E5E5] dark:bg-[#1C1C1E] text-neutral-400 cursor-not-allowed"
              )}
            >
              <PlayCircle size={16} className="text-white" />
              <span>শুরু</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Question Cards (Matching Flutter _buildQuestionCard 1:1) ── */}
      {isLoadingBookmarks && activeTab === "bookmarks" ? (
        <div className="py-20 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#059669] animate-spin" />
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            বুকমার্ক করা প্রশ্ন লোড হচ্ছে...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#A3A3A3] mx-auto flex items-center justify-center">
            {activeTab === "mistakes" ? <XOctagon size={32} /> : <Bookmark size={32} />}
          </div>
          <h3 className="text-[15.5px] font-semibold text-black dark:text-white">
            কোনো তথ্য পাওয়া যায়নি
          </h3>
          <p className="text-[12.5px] text-[#A3A3A3] max-w-sm mx-auto">
            {activeTab === "mistakes"
              ? "তুমি এখনো কোনো পরীক্ষায় ভুল করোনি।"
              : "তুমি এখনো কোনো প্রশ্ন বুকমার্ক করোনি।"}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToMock}
              className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-[10px] text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              নতুন পরীক্ষা দাও
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 w-full max-w-full min-w-0">
          {currentList.map((q, index) => {
            const isSel = selectedIds.has(String(q.id));
            const freq = mistakeFrequency.get(String(q.id));
            const isMarked = bookmarkedIds.has(String(q.id));

            return (
              <div
                key={q.id}
                onClick={() => toggleSelection(String(q.id))}
                className={cn(
                  "w-full max-w-full min-w-0 px-3.5 py-2.5 rounded-[14px] bg-white dark:bg-[#18181B] transition-all cursor-pointer shadow-[0_3px_8px_rgba(0,0,0,0.04)] select-none overflow-hidden break-words [overflow-wrap:anywhere]",
                  isSel
                    ? "border-[1.5px] border-[#EF4444]"
                    : "border border-[#E2E8F0] dark:border-[#27272A]"
                )}
              >
                {/* Top Row: Checkbox + Frequency Badge + Bookmark Icon */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-[5px] border-[1.5px] flex items-center justify-center transition-all",
                        isSel
                          ? "bg-[#EF4444] border-[#EF4444] text-white"
                          : "border-[#CBD5E1] dark:border-[#52525B] bg-transparent"
                      )}
                    >
                      {isSel && <span className="text-xs font-bold leading-none">✓</span>}
                    </div>

                    {activeTab === "mistakes" && freq != null && freq > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-xs font-bold border",
                          freq >= 3
                            ? "bg-[#059669]/15 border-[#059669]/40 text-[#059669]"
                            : freq === 2
                            ? "bg-[#B91C1C]/15 border-[#B91C1C]/40 text-[#B91C1C]"
                            : "bg-[#27272A]/30 border-[#525252]/40 text-[#A3A3A3]"
                        )}
                      >
                        {freq}x ভুল
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark(q);
                    }}
                    className={cn(
                      "p-1 rounded-md transition-all cursor-pointer",
                      isMarked
                        ? "text-[#10B981]"
                        : "text-[#94A3B8] dark:text-[#71717A] hover:text-neutral-600 dark:hover:text-neutral-300"
                    )}
                  >
                    <Bookmark size={18} />
                  </button>
                </div>

                {/* Question Text with Numbering */}
                <div className="text-base font-normal text-[#0F172A] dark:text-[#F4F4F5] leading-[1.45] w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word] overflow-x-auto">
                  <LatexText
                    text={`**${BanglaNameHelper.toBanglaNumeral(index + 1)}.** ${q.question}`}
                  />
                </div>
              </div>
            );
          })}

          {/* ── 5. Load More Button (Matching Flutter pagination 1:1) ── */}
          {hasMore && (
            <div className="pt-3 pb-8 text-center">
              <button
                type="button"
                onClick={() => setDisplayedCount((c) => c + 20)}
                className="w-[220px] h-[46px] rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-sm font-bold text-[#0F172A] dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 mx-auto shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <ArrowDown size={16} className="text-[#059669]" />
                <span>আরও ২০টি প্রশ্ন লোড করো</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pro Upgrade Modal for Bookmark Limit */}
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

export default PracticeDashboard;
