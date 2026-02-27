'use client';
import React, { useState, useMemo } from 'react';
import DeleteConfirmModal from '@/components/student/ui/common/DeleteConfirmModal';
import { ExamResult, Question } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import LatexText from '@/components/student/ui/LatexText';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: () => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ'];

/* ── Score Ring SVG ── */
const ScoreRing: React.FC<{ percent: number; size?: number }> = ({
  percent,
  size = 44,
}) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  const color =
    percent >= 80 ? '#16a34a' : percent >= 50 ? '#ca8a04' : '#dc2626';
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={5}
        stroke="currentColor"
        className="text-neutral-200 dark:text-neutral-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={5}
        stroke={color}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        fontSize={size * 0.26}
        fontWeight="700"
        fill={color}
      >
        {percent}%
      </text>
    </svg>
  );
};

/* ── PracticeRow ── */
const PracticeRow: React.FC<{
  item: {
    examDate: string;
    subject: string;
    subjectLabel?: string;
    userAns: number | undefined;
    question: Question;
    flagged: boolean;
  };
  isMistakeTab?: boolean;
  index: number;
}> = ({ item, isMistakeTab, index }) => {
  const [selectedOpt, setSelectedOpt] = useState<number | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedOpt(idx);
    setRevealed(true);
  };
  const handleRetry = () => {
    setSelectedOpt(undefined);
    setRevealed(false);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center px-1 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            {new Date(item.examDate).toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'short',
            })}
            &nbsp;•&nbsp;
            {item.subjectLabel || getSubjectDisplayName(item.subject)}
          </span>
          {revealed && item.userAns !== undefined && isMistakeTab && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">
              আগের উত্তর:{' '}
              <span
                className={
                  item.userAns === item.question.correctAnswerIndex
                    ? 'text-emerald-500'
                    : 'text-red-500'
                }
              >
                <LatexText text={item.question.options[item.userAns] || '—'} />
              </span>
            </span>
          )}
        </div>
        {revealed && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            আবার চেষ্টা
          </button>
        )}
      </div>
      <QuestionCard
        question={item.question}
        serialNumber={index}
        selectedOptionIndex={selectedOpt}
        isFlagged={item.flagged}
        onSelectOption={handleSelect}
        onToggleFlag={() => {}}
        onReport={() => {}}
        showFeedback={revealed}
        readOnly={revealed}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onClearHistory,
  onViewResult,
  onRecheckRequest,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'mistakes' | 'marked'>(
    'exams',
  );
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'score-high' | 'score-low'>(
    'date',
  );
  const [searchText, setSearchText] = useState('');

  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    history.forEach((item) => {
      if (!map.has(item.subject))
        map.set(
          item.subject,
          item.subjectLabel || getSubjectDisplayName(item.subject),
        );
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [history]);

  const filteredHistory = useMemo(() => {
    const filtered = history.filter((item) => {
      const matchSubject = filterSubject
        ? item.subject === filterSubject
        : true;
      const matchDate = filterDate ? item.date.startsWith(filterDate) : true;
      const matchSearch = searchText
        ? (item.subjectLabel || item.subject || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (item.examType || '').toLowerCase().includes(searchText.toLowerCase())
        : true;
      return matchSubject && matchDate && matchSearch;
    });
    if (sortBy === 'score-high')
      filtered.sort((a, b) => b.score / b.totalMarks - a.score / a.totalMarks);
    else if (sortBy === 'score-low')
      filtered.sort((a, b) => a.score / a.totalMarks - b.score / b.totalMarks);
    else filtered.reverse();
    return filtered;
  }, [history, filterSubject, filterDate, searchText, sortBy]);

  const displayedHistory = filteredHistory.slice(0, visibleCount);
  const hasMoreHistory = visibleCount < filteredHistory.length;

  const stats = useMemo(() => {
    const ev = filteredHistory.filter(
      (h) => !h.status || h.status === 'evaluated',
    );
    const total = ev.length;
    const avgScore =
      total > 0
        ? Math.round(
            ev.reduce((acc, c) => acc + (c.score / c.totalMarks) * 100, 0) /
              total,
          )
        : 0;
    const highestScore =
      total > 0
        ? Math.max(...ev.map((e) => (e.score / e.totalMarks) * 100))
        : 0;
    return { total, avgScore, highestScore };
  }, [filteredHistory]);

  const mistakes = useMemo(() => {
    const all: {
      question: Question;
      examDate: string;
      subject: string;
      subjectLabel?: string;
      userAns: number;
      flagged: boolean;
    }[] = [];
    const seen = new Set<string | number>();
    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;
      if (!exam.questions || !exam.userAnswers) return;
      const flags = new Set(exam.flaggedQuestions || []);
      exam.questions.forEach((q) => {
        const ua = exam.userAnswers?.[q.id];
        if (
          ua !== undefined &&
          ua !== null &&
          ua !== -1 &&
          ua !== q.correctAnswerIndex &&
          !seen.has(q.id)
        ) {
          seen.add(q.id);
          all.push({
            question: q,
            examDate: exam.date,
            subject: exam.subject,
            subjectLabel: exam.subjectLabel,
            userAns: ua,
            flagged: flags.has(q.id),
          });
        }
      });
    });
    return all.reverse();
  }, [history, filterSubject, filterDate]);

  const bookmarks = useMemo(() => {
    const all: {
      question: Question;
      examDate: string;
      subject: string;
      subjectLabel?: string;
      userAns: number | undefined;
      flagged: boolean;
    }[] = [];
    const seen = new Set<string | number>();
    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;
      if (!exam.questions) return;
      exam.questions.forEach((q) => {
        if (seen.has(q.id)) return;
        const isMarked = bookmarkedIds
          ? bookmarkedIds.has(String(q.id))
          : !!(exam.flaggedQuestions && exam.flaggedQuestions.includes(q.id));
        if (isMarked) {
          seen.add(q.id);
          all.push({
            question: q,
            examDate: exam.date,
            subject: exam.subject,
            subjectLabel: exam.subjectLabel,
            userAns: exam.userAnswers?.[q.id],
            flagged: true,
          });
        }
      });
    });
    return all.reverse();
  }, [history, filterSubject, filterDate, bookmarkedIds]);

  const displayedMistakes = mistakes.slice(0, visibleCount);
  const hasMoreMistakes = visibleCount < mistakes.length;
  const displayedBookmarks = bookmarks.slice(0, visibleCount);
  const hasMoreBookmarks = visibleCount < bookmarks.length;

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const TABS = [
    {
      id: 'exams',
      label: 'পরীক্ষা',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
          />
        </svg>
      ),
    },
    {
      id: 'mistakes',
      label: 'ভুলসমূহ',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      ),
    },
    {
      id: 'marked',
      label: 'বুকমার্ক',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
          />
        </svg>
      ),
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0e0e0e] transition-colors pb-28 md:pb-10">
      {/* ── Android-style top app bar (mobile) / Desktop header ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#161616] border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-end gap-3">
          {/* Desktop tab strip */}
          <div className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setVisibleCount(9);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-2 md:px-4 pt-4 md:pt-6 space-y-4">
        {/* ── Filters row ── */}
        {activeTab === 'exams' && (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setVisibleCount(9);
                }}
                placeholder="খুঁজুন..."
                className="w-full bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>
            {/* Subject */}
            <div className="relative">
              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setVisibleCount(9);
                }}
                className="appearance-none bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl px-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all w-full sm:w-auto cursor-pointer"
              >
                <option value="">সকল বিষয়</option>
                {uniqueSubjects.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {/* Date */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setVisibleCount(9);
              }}
              className="bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all w-full sm:w-auto"
            />
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as 'date' | 'score-high' | 'score-low',
                );
                setVisibleCount(9);
              }}
              className="bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all w-full sm:w-auto cursor-pointer"
            >
              <option value="date">তারিখ অনুযায়ী</option>
              <option value="score-high">স্কোর: বেশি আগে</option>
              <option value="score-low">স্কোর: কম আগে</option>
            </select>
          </div>
        )}

        {/* ══════════════ EXAMS TAB ══════════════ */}
        {activeTab === 'exams' && (
          <div className="space-y-4 animate-fade-in">
            {/* Stats bar — Android Material-style chips on mobile */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {/* Total */}
              <div className="bg-emerald-700 dark:bg-emerald-800 rounded-2xl p-3 md:p-5 flex flex-col items-center md:items-start text-white shadow-md shadow-emerald-700/20">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mb-0.5">
                  মোট
                </p>
                <p className="text-2xl md:text-4xl font-extrabold leading-tight">
                  {stats.total}
                </p>
                <p className="hidden md:block text-xs opacity-60 mt-0.5">
                  পরীক্ষা
                </p>
              </div>
              {/* Avg */}
              <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-3 md:p-5 flex flex-col items-center md:items-start border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-0.5">
                  গড়
                </p>
                <p className="text-2xl md:text-4xl font-extrabold text-neutral-800 dark:text-white leading-tight">
                  {stats.avgScore}%
                </p>
                <p className="hidden md:block text-xs text-neutral-400 mt-0.5">
                  স্কোর
                </p>
              </div>
              {/* Best */}
              <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-3 md:p-5 flex flex-col items-center md:items-start border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-0.5">
                  সর্বোচ্চ
                </p>
                <p className="text-2xl md:text-4xl font-extrabold text-emerald-600 dark:text-emerald-500 leading-tight">
                  {Math.round(stats.highestScore)}%
                </p>
                <p className="hidden md:block text-xs text-neutral-400 mt-0.5">
                  স্কোর
                </p>
              </div>
            </div>

            {/* Clear history */}
            {history.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                  সব মুছুন
                </button>
              </div>
            )}

            {/* Empty state */}
            {displayedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 font-semibold text-sm">
                  কোনো ফলাফল পাওয়া যায়নি
                </p>
              </div>
            ) : (
              <>
                {/* ── Mobile: Android-style list rows ── */}
                <div className="flex flex-col gap-2 md:hidden">
                  {displayedHistory.map((item) => {
                    const isPending =
                      item.submissionType === 'script' &&
                      item.status === 'pending';
                    const isRejected =
                      item.submissionType === 'script' &&
                      item.status === 'rejected';
                    const scorePercent =
                      item.totalMarks > 0
                        ? Math.round((item.score / item.totalMarks) * 100)
                        : 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden active:scale-[0.99] transition-transform"
                      >
                        <div className="flex items-center gap-3 px-4 py-2">
                          {/* Score Ring */}
                          {!isPending && !isRejected ? (
                            <ScoreRing percent={scorePercent} size={36} />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black uppercase ${isPending ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}
                            >
                              {isPending ? 'Wait' : 'Rej.'}
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">
                              {item.subjectLabel || item.subject}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                              {item.examType || 'Practice Exam'} •{' '}
                              {formatDate(item.date)}
                            </p>
                            {!isPending && !isRejected && (
                              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                {item.score.toFixed(1)} / {item.totalMarks}{' '}
                                &nbsp;·&nbsp; {formatDuration(item.timeTaken)}
                              </p>
                            )}
                          </div>

                          {/* Chevron / action */}
                          <button
                            onClick={
                              isRejected
                                ? () => onRecheckRequest(item.id)
                                : () => onViewResult(item)
                            }
                            disabled={isPending}
                            className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-colors ${isPending ? 'opacity-30 cursor-default' : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-90'}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2.5}
                              stroke="currentColor"
                              className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m8.25 4.5 7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop: Card Grid ── */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedHistory.map((item) => {
                    const isPending =
                      item.submissionType === 'script' &&
                      item.status === 'pending';
                    const isRejected =
                      item.submissionType === 'script' &&
                      item.status === 'rejected';
                    const scorePercent =
                      item.totalMarks > 0
                        ? Math.round((item.score / item.totalMarks) * 100)
                        : 0;

                    return (
                      <div
                        key={item.id}
                        className="group bg-white dark:bg-[#1c1c1c] rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 flex flex-col gap-4"
                      >
                        {/* Top row */}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                              {formatDate(item.date)}
                            </p>
                            <h3 className="text-[17px] font-black text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
                              {item.subjectLabel || item.subject}
                            </h3>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
                              {item.examType || 'Practice Exam'}
                            </p>
                          </div>
                          {!isPending && !isRejected && (
                            <ScoreRing percent={scorePercent} size={36} />
                          )}
                          {isPending && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-neutral-800 dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-lg">
                              Pending
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 rounded-lg">
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* Score detail row */}
                        {!isPending && !isRejected && (
                          <div className="grid grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                                স্কোর
                              </p>
                              <p className="text-sm font-black text-neutral-800 dark:text-white">
                                {item.score.toFixed(1)}{' '}
                                <span className="text-neutral-400 font-bold">
                                  / {item.totalMarks}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                                সময়
                              </p>
                              <p className="text-sm font-black text-neutral-800 dark:text-white">
                                {formatDuration(item.timeTaken)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* CTA */}
                        <button
                          onClick={
                            isRejected
                              ? () => onRecheckRequest(item.id)
                              : () => onViewResult(item)
                          }
                          disabled={isPending}
                          className="mt-auto w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isRejected ? 'রিচেক করুন' : 'ফলাফল দেখুন →'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {hasMoreHistory && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount((p) => p + 9)}
                  className="px-6 py-2.5 bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  আরও দেখুন
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ MISTAKES TAB ══════════════ */}
        {activeTab === 'mistakes' && (
          <div className="animate-fade-in space-y-4">
            {displayedMistakes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  কোনো ভুল নেই!
                </h3>
                <p className="text-neutral-400 dark:text-neutral-500 mt-1 text-sm">
                  তুমি সব প্রশ্নের সঠিক উত্তর দিয়েছো।
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 p-3 rounded-xl">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-red-800 dark:text-red-300 font-semibold">
                    ভুল করা প্রশ্নগুলো আবার প্র্যাকটিস করো।
                  </p>
                </div>
                <div className="space-y-2">
                  {displayedMistakes.map((item, idx) => (
                    <PracticeRow
                      key={`${item.examDate}-${idx}`}
                      item={item}
                      isMistakeTab
                      index={idx + 1}
                    />
                  ))}
                </div>
                {hasMoreMistakes && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount((p) => p + 9)}
                      className="px-6 py-2.5 bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      আরও দেখুন
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════ BOOKMARKS TAB ══════════════ */}
        {activeTab === 'marked' && (
          <div className="animate-fade-in space-y-4">
            {displayedBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4 text-amber-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                  কোনো বুকমার্ক নেই
                </h3>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center max-w-xs">
                  গুরুত্বপূর্ণ প্রশ্ন বুকমার্ক করে এখানে জমিয়ে রাখো।
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {displayedBookmarks.map((item, idx) => (
                    <PracticeRow
                      key={`${item.examDate}-${idx}`}
                      item={item}
                      index={idx + 1}
                    />
                  ))}
                </div>
                {hasMoreBookmarks && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount((p) => p + 9)}
                      className="px-6 py-2.5 bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      আরও দেখুন
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Android bottom nav bar (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#161616] border-t border-neutral-200 dark:border-neutral-800 flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setVisibleCount(9);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`}
            >
              {tab.icon}
              <span
                className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          await onClearHistory();
          setIsDeleting(false);
          setShowDeleteModal(false);
        }}
        title="সব ইতিহাস মুছবে?"
        description="এই পদক্ষেপটি স্থায়ী। তোমার সব পরীক্ষার ইতিহাস ডেটাবেজ থেকে মুছে যাবে।"
        confirmLabel="হ্যাঁ, মুছে ফেলো"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ExamHistoryView;
