'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, ExamResult, ExamDetails, UserProfile } from '@/lib/types';
import { getUserBookmarks, toggleBookmark } from '@/services/bookmark-service';
import { getQuestionsByIds } from '@/services/question-service';
import { toast } from 'sonner';
import FlashcardMode, { FlashcardResult } from './FlashcardMode';
import PracticeSummary from './PracticeSummary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PracticeDashboardProps {
  history: ExamResult[];
  onStartPractice: (questions: Question[], details: ExamDetails) => void; // kept for compatibility
  onNavigateToMock: () => void;
  subjects?: any[];
  currentUser?: UserProfile | null;
}

type Tab = 'mistakes' | 'bookmarks';
type ViewState = 'list' | 'flashcard' | 'summary';

// ─── Spaced Repetition Helpers ─────────────────────────────────────────────

const REVIEW_INTERVAL_DAYS = 3;
const LS_KEY = 'practice_last_reviewed';

function getLastReviewedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
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
  if (!last) return false; // never reviewed → not "due" yet, it's just new
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return daysSince >= REVIEW_INTERVAL_DAYS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({
  history,
  onStartPractice,
  onNavigateToMock,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('mistakes');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [shuffle, setShuffle] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [flashcardQuestions, setFlashcardQuestions] = useState<Question[]>([]);
  const [flashcardResults, setFlashcardResults] = useState<FlashcardResult[]>(
    [],
  );

  // Bookmarks state
  const [globalBookmarks, setGlobalBookmarks] = useState<Question[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

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
          if (
            userAns !== undefined &&
            userAns !== q.correctAnswerIndex &&
            q.correctAnswerIndex !== undefined
          ) {
            mistakeMap.set(q.id, q);
            freq.set(q.id, (freq.get(q.id) ?? 0) + 1);
          }
        });
      }
    });

    // Sort by frequency descending
    const sorted = Array.from(mistakeMap.values()).sort(
      (a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0),
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
          const questions = await getQuestionsByIds(ids);
          setGlobalBookmarks(questions);
        } else {
          setGlobalBookmarks([]);
        }
      } catch {
        toast.error('বুকমার্ক লোড করতে সমস্যা হয়েছে।');
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
        if (activeTab === 'mistakes') {
          const q = mistakes.find((q) => q.id === questionId);
          if (q) setGlobalBookmarks((prev) => [...prev, q]);
        }
      }
      setBookmarkedIds(newIds);
      try {
        await toggleBookmark(currentUser.id, questionId, isCurrentlyBookmarked);
        toast.success(
          isCurrentlyBookmarked
            ? 'বুকমার্ক রিমুভ করা হয়েছে'
            : 'বুকমার্ক সেভ করা হয়েছে',
        );
      } catch {
        toast.error('বুকমার্ক আপডেট করতে সমস্যা হয়েছে।');
        setBookmarkedIds(bookmarkedIds);
      }
    },
    [currentUser?.id, bookmarkedIds, activeTab, mistakes],
  );

  // ── All subjects from current list ─────────────────────────────────────────
  const baseList = activeTab === 'mistakes' ? mistakes : globalBookmarks;

  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    baseList.forEach((q) => {
      if (q.subject) subjects.add(q.subject);
    });
    return Array.from(subjects);
  }, [baseList]);

  // Reset filter when tab changes
  useEffect(() => {
    setSubjectFilter('all');
    setSelectedQuestions(new Set());
  }, [activeTab]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const currentList = useMemo(() => {
    if (subjectFilter === 'all') return baseList;
    return baseList.filter((q) => q.subject === subjectFilter);
  }, [baseList, subjectFilter]);

  // Due-today derived
  const dueCount = useMemo(
    () =>
      [...mistakes, ...globalBookmarks].filter((q) => isDue(q.id, reviewedMap))
        .length,
    [mistakes, globalBookmarks, reviewedMap],
  );

  // ── Selection helpers ───────────────────────────────────────────────────────
  const currentSelection = useMemo(
    () =>
      new Set(
        [...selectedQuestions].filter((id) =>
          currentList.some((q) => q.id === id),
        ),
      ),
    [selectedQuestions, currentList],
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

  // ── Launch helpers ──────────────────────────────────────────────────────────
  const buildDetails = (questions: Question[], mode: string): ExamDetails => ({
    subject: 'অনুশীলন',
    subjectLabel: 'অনুশীলন',
    examType: mode,
    chapters: 'Mixed',
    topics: 'Mixed',
    totalQuestions: questions.length,
    durationMinutes: questions.length * 2,
    totalMarks: questions.reduce((acc, q) => acc + (q.points || 1), 0),
    negativeMarking: 0,
  });

  const getSelectedQuestions = (): Question[] => {
    let qs = currentList.filter((q) => currentSelection.has(q.id));
    if (shuffle) qs = [...qs].sort(() => Math.random() - 0.5);
    return qs;
  };

  const handleLaunch = () => {
    const qs = getSelectedQuestions();
    if (qs.length === 0) return;
    markReviewed(qs.map((q) => q.id));
    setReviewedMap(getLastReviewedMap());
    setFlashcardQuestions(qs);
    setViewState('flashcard');
  };

  const handleFlashcardComplete = (results: FlashcardResult[]) => {
    setFlashcardResults(results);
    setViewState('summary');
  };

  const handlePracticeStruggling = (qs: Question[]) => {
    setFlashcardQuestions(qs);
    setFlashcardResults([]);
    setViewState('flashcard');
  };

  // ── Alternate views: flashcard / summary ───────────────────────────────────
  if (viewState === 'flashcard') {
    return (
      <FlashcardMode
        questions={flashcardQuestions}
        onComplete={handleFlashcardComplete}
        onExit={() => setViewState('list')}
      />
    );
  }

  if (viewState === 'summary') {
    return (
      <PracticeSummary
        results={flashcardResults}
        mode="flashcard"
        onPracticeStruggling={handlePracticeStruggling}
        onBack={() => setViewState('list')}
      />
    );
  }

  // ── Badge helper ────────────────────────────────────────────────────────────
  const FrequencyBadge = ({ count }: { count: number }) => {
    const cfg =
      count >= 3
        ? {
            bg: 'bg-rose-900/50 text-rose-400 border-rose-800/50',
            label: `${count}× ভুল`,
          }
        : count === 2
          ? {
              bg: 'bg-amber-900/50 text-amber-400 border-amber-800/50',
              label: `${count}× ভুল`,
            }
          : {
              bg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
              label: `${count}× ভুল`,
            };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg}`}
      >
        {cfg.label}
      </span>
    );
  };

  // ── Main list UI ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'মোট ভুল', value: mistakes.length, color: 'text-rose-500' },
          {
            label: 'বুকমার্ক',
            value: globalBookmarks.length,
            color: 'text-amber-500',
          },
          { label: 'রিভিউ বাকি', value: dueCount, color: 'text-indigo-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-center shadow-sm"
          >
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl w-fit border border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'mistakes'
              ? 'bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          ভুল সমূহ ({mistakes.length})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          বুকমার্ক ({globalBookmarks.length})
        </button>
      </div>

      {/* ── Subject filter pills ── */}
      {allSubjects.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', ...allSubjects].map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                subjectFilter === s
                  ? 'bg-rose-600 text-white border-rose-600 shadow'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-rose-400'
              }`}
            >
              {s === 'all' ? 'সব বিষয়' : s}
            </button>
          ))}
        </div>
      )}

      {/* ── Main content box ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        {isLoadingBookmarks && activeTab === 'bookmarks' ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-neutral-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              কোনো তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mb-6">
              {activeTab === 'mistakes'
                ? subjectFilter !== 'all'
                  ? `"${subjectFilter}" বিষয়ে কোনো ভুল পাওয়া যায়নি।`
                  : 'আপনি এখনো কোনো পরীক্ষায় ভুল করেননি।'
                : 'আপনি এখনো কোনো প্রশ্ন বুকমার্ক করেননি।'}
            </p>
            <button
              onClick={onNavigateToMock}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold shadow hover:bg-rose-700 transition-colors"
            >
              নতুন পরীক্ষা দিন
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    currentSelection.size === currentList.length &&
                    currentList.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-neutral-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {currentSelection.size} নির্বাচিত
                </span>

                {/* Shuffle toggle */}
                <button
                  onClick={() => setShuffle((s) => !s)}
                  title="এলোমেলো করুন"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    shuffle
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                  </svg>
                  {shuffle ? 'র‍্যান্ডম অন' : 'র‍্যান্ডম'}
                </button>
              </div>

              {/* Start practice button — flashcard only */}
              <button
                onClick={handleLaunch}
                disabled={currentSelection.size === 0}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all transform active:scale-95 ${
                  currentSelection.size > 0
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                }`}
              >
                📇 ফ্ল্যাশকার্ড শুরু করুন
              </button>
            </div>

            {/* Question list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-black/20">
              {currentList.map((question, idx) => {
                const freq = mistakeFrequency.get(question.id);
                const due = isDue(question.id, reviewedMap);
                const isSelected = selectedQuestions.has(question.id);

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => toggleSelection(question.id)}
                    className={`group relative bg-white dark:bg-neutral-900 border rounded-xl p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1 flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-rose-600 border-rose-600'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {question.subject && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              {question.subject}
                            </span>
                          )}
                          {freq !== undefined && activeTab === 'mistakes' && (
                            <FrequencyBadge count={freq} />
                          )}
                          {due && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/30 text-indigo-400 border border-indigo-800/30">
                              📅 রিভিউ বাকি
                            </span>
                          )}
                          {activeTab === 'mistakes' &&
                            bookmarkedIds.has(question.id) && (
                              <span className="text-amber-500 text-sm">🔖</span>
                            )}
                        </div>

                        {/* Question text */}
                        <p className="text-sm font-medium text-neutral-900 dark:text-white leading-snug line-clamp-2">
                          {idx + 1}. {question.question}
                        </p>

                        {/* Correct answer hint */}
                        {question.options &&
                          question.correctAnswerIndex !== undefined && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1">
                              ✓ {question.options[question.correctAnswerIndex]}
                            </p>
                          )}
                      </div>

                      {/* Bookmark toggle icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(question.id);
                        }}
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                          bookmarkedIds.has(question.id)
                            ? 'text-amber-500'
                            : 'text-neutral-400 hover:text-amber-500'
                        }`}
                        title="বুকমার্ক"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill={
                            bookmarkedIds.has(question.id)
                              ? 'currentColor'
                              : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeDashboard;
