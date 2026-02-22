import React, { useState, useMemo } from 'react';
import DeleteConfirmModal from '@/components/student/ui/common/DeleteConfirmModal';
import { ExamResult, Question } from '@/lib/types'; // Updated to likely correct path
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import LatexText from '@/components/student/ui/LatexText';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: () => Promise<void> | void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
  /** DB-synced bookmark set from useBookmarks hook */
  bookmarkedIds?: Set<string>;
  /** Toggle a bookmark via useBookmarks hook */
  onToggleBookmark?: (questionId: string | number) => void;
}

// Helper component for Practicable Question Item
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
    <div className="mb-8">
      <div className="flex justify-between items-center px-2 mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-black text-black/60 dark:text-white/60">
            {new Date(item.examDate).toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            • {item.subjectLabel || getSubjectDisplayName(item.subject)}
          </span>
          {revealed && item.userAns !== undefined && isMistakeTab && (
            <span className="text-[10px] text-black/50 dark:text-white/50 mt-0.5 font-bold uppercase tracking-wider">
              তোমার আগের উত্তর:{' '}
              <span
                className={
                  item.userAns === item.question.correctAnswerIndex
                    ? 'text-emerald-500 font-bold'
                    : 'text-red-500 font-bold'
                }
              >
                {/* ✅ UPDATED: Now supports Math/LaTeX rendering */}
                <LatexText
                  text={item.question.options[item.userAns] || 'উত্তর দাওনি'}
                />
              </span>
            </span>
          )}
        </div>
        {revealed && (
          <button
            onClick={handleRetry}
            className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-widest"
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            আবার চেষ্টা করো
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

const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onClearHistory,
  onViewResult,
  onRecheckRequest,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'marked' | 'mistakes' | 'exams'>(
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

  // Extract unique subjects for dropdown — value = raw code, label = display name
  const uniqueSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    history.forEach((item) => {
      if (!subjectMap.has(item.subject)) {
        subjectMap.set(
          item.subject,
          item.subjectLabel || getSubjectDisplayName(item.subject),
        );
      }
    });
    return Array.from(subjectMap.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [history]);

  // -- EXAMS TAB LOGIC --
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

    // Sort
    if (sortBy === 'score-high') {
      filtered.sort((a, b) => {
        const aP = a.totalMarks > 0 ? a.score / a.totalMarks : 0;
        const bP = b.totalMarks > 0 ? b.score / b.totalMarks : 0;
        return bP - aP;
      });
    } else if (sortBy === 'score-low') {
      filtered.sort((a, b) => {
        const aP = a.totalMarks > 0 ? a.score / a.totalMarks : 0;
        const bP = b.totalMarks > 0 ? b.score / b.totalMarks : 0;
        return aP - bP;
      });
    } else {
      filtered.reverse(); // date descending (newest first)
    }

    return filtered;
  }, [history, filterSubject, filterDate, searchText, sortBy]);

  // ✅ FIXED: Removed the useEffect causing the error.
  // We now reset visibleCount(9) directly in the onChange/onClick handlers below.

  const displayedHistory = filteredHistory.slice(0, visibleCount);
  const hasMoreHistory = visibleCount < filteredHistory.length;

  const stats = useMemo(() => {
    const evaluatedExams = filteredHistory.filter(
      (h) => !h.status || h.status === 'evaluated',
    );
    const total = evaluatedExams.length;
    const avgScore =
      total > 0
        ? Math.round(
            evaluatedExams.reduce(
              (acc, curr) => acc + (curr.score / curr.totalMarks) * 100,
              0,
            ) / total,
          )
        : 0;

    const highestScore =
      total > 0
        ? Math.max(...evaluatedExams.map((e) => (e.score / e.totalMarks) * 100))
        : 0;

    return { total, avgScore, highestScore };
  }, [filteredHistory]);

  // -- MISTAKES TAB LOGIC --
  const mistakes = useMemo(() => {
    const allMistakes: {
      question: Question;
      examDate: string;
      subject: string;
      subjectLabel?: string;
      userAns: number;
      flagged: boolean;
    }[] = [];

    // Deduplicate by question id so the same wrong answer multiple times isn't duplicated
    const seenMistakes = new Set<string | number>();

    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;

      if (!exam.questions || !exam.userAnswers) return;

      const flags = new Set(exam.flaggedQuestions || []);

      exam.questions.forEach((q) => {
        const ua = exam.userAnswers?.[q.id];
        // Check if attempted and wrong
        if (
          ua !== undefined &&
          ua !== null &&
          ua !== -1 &&
          ua !== q.correctAnswerIndex
        ) {
          if (!seenMistakes.has(q.id)) {
            seenMistakes.add(q.id);
            allMistakes.push({
              question: q,
              examDate: exam.date,
              subject: exam.subject,
              subjectLabel: exam.subjectLabel,
              userAns: ua,
              flagged: flags.has(q.id),
            });
          }
        }
      });
    });
    return allMistakes.reverse();
  }, [history, filterSubject, filterDate]);

  const displayedMistakes = mistakes.slice(0, visibleCount);
  const hasMoreMistakes = visibleCount < mistakes.length;

  // -- BOOKMARKED TAB LOGIC --
  // Uses DB-synced bookmarkedIds (from useBookmarks hook) when available,
  // otherwise falls back to exam.flaggedQuestions stored in history records.
  const bookmarks = useMemo(() => {
    const allBookmarks: {
      question: Question;
      examDate: string;
      subject: string;
      subjectLabel?: string;
      userAns: number | undefined;
      flagged: boolean;
    }[] = [];

    // Deduplicate by question id (a question may appear in multiple exams)
    const seenIds = new Set<string | number>();

    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;
      if (!exam.questions) return;

      exam.questions.forEach((q) => {
        if (seenIds.has(q.id)) return;

        // Prefer DB bookmark set; fall back to per-exam flaggedQuestions
        const isMarked = bookmarkedIds
          ? bookmarkedIds.has(String(q.id))
          : !!(exam.flaggedQuestions && exam.flaggedQuestions.includes(q.id));

        if (isMarked) {
          seenIds.add(q.id);
          allBookmarks.push({
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
    return allBookmarks.reverse();
  }, [history, filterSubject, filterDate, bookmarkedIds]);

  const displayedBookmarks = bookmarks.slice(0, visibleCount);
  const hasMoreBookmarks = visibleCount < bookmarks.length;

  // -- HELPERS --
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
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
          className="w-4 h-4"
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
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 animate-fade-in transition-colors font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* ✅ ADD THIS HEADER SECTION */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">
            অতীতের ফলাফল (History)
          </h1>
        </div>
        {/* ✅ END OF NEW SECTION */}
        {/* Top Controls: Tabs & Filters */}
        <div className="flex flex-col gap-3">
          {/* Tabs Row */}
          <div className="flex items-center justify-between">
            <div className="p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/50 inline-flex w-full md:w-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as 'exams' | 'mistakes' | 'marked');
                      setVisibleCount(9); // ✅ Reset visible count here
                    }}
                    className={`
                                    flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300
                                    ${
                                      isActive
                                        ? 'bg-white dark:bg-neutral-700 shadow-sm text-emerald-700 dark:text-emerald-400 scale-[1.02]'
                                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'
                                    }
                                `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:flex md:justify-end gap-2 md:gap-3">
            {/* Search Input */}
            <div className="relative col-span-2 md:w-auto md:min-w-[180px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
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
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setVisibleCount(9);
                }}
                placeholder="খুঁজুন..."
                aria-label="পরীক্ষার ইতিহাস খুঁজুন"
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm placeholder:text-neutral-400"
              />
            </div>
            {/* Subject Filter */}
            <div className="relative col-span-1 md:w-auto md:min-w-[200px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
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
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
                  />
                </svg>
              </div>
              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setVisibleCount(9); // ✅ Reset visible count here
                }}
                aria-label="বিষয় অনুযায়ী ফিল্টার"
                className="w-full appearance-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm cursor-pointer"
              >
                <option value="">সকল বিষয়</option>
                {uniqueSubjects.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-500">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative col-span-1 md:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setVisibleCount(9); // ✅ Reset visible count here
                }}
                aria-label="তারিখ অনুযায়ী ফিল্টার"
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm h-full"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative col-span-1 md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as 'date' | 'score-high' | 'score-low',
                  );
                  setVisibleCount(9);
                }}
                aria-label="ক্রম অনুযায়ী সাজান"
                className="w-full appearance-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm cursor-pointer"
              >
                <option value="date">তারিখ অনুযায়ী</option>
                <option value="score-high">স্কোর: বেশি আগে</option>
                <option value="score-low">স্কোর: কম আগে</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-5 animate-fade-in">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-xl p-2.5 md:p-4 text-white shadow-lg shadow-emerald-700/20 flex flex-col justify-center items-center md:items-start">
                  <div className="flex items-center gap-2 mb-0.5 md:mb-1 opacity-80">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-center md:text-left">
                      মোট পরীক্ষা
                    </span>
                  </div>
                  <div className="text-lg md:text-3xl font-extrabold">
                    {stats.total}
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-2.5 md:p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between items-center md:items-start">
                  <span className="text-neutral-500 dark:text-neutral-400 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center md:text-left">
                    গড় স্কোর
                  </span>
                  <div className="text-lg md:text-3xl font-extrabold text-neutral-800 dark:text-white">
                    {stats.avgScore}%
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-2.5 md:p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between items-center md:items-start">
                  <span className="text-neutral-500 dark:text-neutral-400 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center md:text-left">
                    সর্বোচ্চ
                  </span>
                  <div className="text-lg md:text-3xl font-extrabold text-emerald-500">
                    {Math.round(stats.highestScore)}%
                  </div>
                </div>
              </div>

              {/* Clear History Button Container */}
              {history.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
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
                    সব ইতিহাস মোছো
                  </button>
                </div>
              )}

              {/* Results List Grid */}
              {displayedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                    কোনো ফলাফল পাওয়া যায়নি
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

                    let badgeClass =
                      'bg-black/5 text-black/80 dark:bg-white/10 dark:text-white/80 border border-black/10 dark:border-white/20';
                    let statusText = `${scorePercent}%`;

                    if (isPending) {
                      badgeClass =
                        'bg-black text-white dark:bg-white dark:text-black';
                      statusText = 'Pending';
                    } else if (isRejected) {
                      badgeClass =
                        'bg-red-600 text-white dark:bg-red-500 dark:text-white';
                      statusText = 'Rejected';
                    } else if (scorePercent >= 80) {
                      badgeClass =
                        'bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white shadow-sm';
                    } else if (scorePercent < 40) {
                      badgeClass =
                        'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
                    }

                    return (
                      <div
                        key={item.id}
                        className="group bg-white dark:bg-black rounded-2xl p-5 border border-black/10 dark:border-white/10 hover:shadow-2xl hover:border-emerald-700/50 dark:hover:border-emerald-700/50 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
                      >
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-black/60 dark:text-white/60 font-black uppercase tracking-widest">
                              {formatDate(item.date)}
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${badgeClass}`}
                            >
                              {statusText}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-black dark:text-white line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-500 transition-colors tracking-tight mb-1">
                            {item.subjectLabel || item.subject}
                          </h3>
                          <p className="text-xs text-black/60 dark:text-white/60 mb-5 font-bold uppercase tracking-wider">
                            {item.examType || 'Practice Exam'}
                          </p>

                          {!isPending && !isRejected && (
                            <div className="flex items-center justify-between text-xs bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-black/50 dark:text-white/50 uppercase font-black tracking-widest mb-0.5">
                                  Score
                                </span>
                                <span className="text-sm font-black text-black dark:text-white">
                                  {item.score.toFixed(1)}{' '}
                                  <span className="text-black/40 dark:text-white/40 font-bold">
                                    / {item.totalMarks}
                                  </span>
                                </span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-[10px] text-black/50 dark:text-white/50 uppercase font-black tracking-widest mb-0.5">
                                  Time
                                </span>
                                <span className="text-sm font-black text-black dark:text-white">
                                  {formatDuration(item.timeTaken)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-auto">
                          <button
                            onClick={
                              isRejected
                                ? () => onRecheckRequest(item.id)
                                : () => onViewResult(item)
                            }
                            disabled={isPending}
                            className="w-full py-3 flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest bg-black dark:bg-white dark:text-black hover:bg-emerald-700 dark:hover:bg-emerald-500 dark:hover:text-white rounded-xl shadow-md transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:bg-black/20 dark:disabled:bg-white/20"
                          >
                            {isRejected ? 'Request Recheck' : 'View Result'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasMoreHistory && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount((p) => p + 9)}
                    className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                  >
                    আরও দেখো
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MISTAKES TAB */}
          {activeTab === 'mistakes' && (
            <div className="animate-fade-in space-y-6">
              {displayedMistakes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
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
                    কোনো ভুল পাওয়া যায়নি!
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    তুমি সব প্রশ্নের সঠিক উত্তর দিয়েছো।
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
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
                    <p className="text-xs text-red-800 dark:text-red-400 font-medium">
                      এখানে তুমি ভুল করা প্রশ্নগুলো আবার প্র্যাকটিস করতে পারবে।
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {displayedMistakes.map((item, idx) => (
                      <PracticeRow
                        key={`${item.examDate}-${idx}`}
                        item={item}
                        isMistakeTab={true}
                        index={idx + 1}
                      />
                    ))}
                  </div>

                  {hasMoreMistakes && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((p) => p + 9)}
                        className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                      >
                        আরও দেখো
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* MARKED TAB */}
          {activeTab === 'marked' && (
            <div className="animate-fade-in space-y-6">
              {displayedBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
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
                    কোনো প্রশ্ন বুকমার্ক করা নেই
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs text-center">
                    গুরুত্বপূর্ণ প্রশ্ন বুকমার্ক করে এখানে জমিয়ে রাখো।
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {displayedBookmarks.map((item, idx) => (
                      <PracticeRow
                        key={`${item.examDate}-${idx}`}
                        item={item}
                        index={idx + 1}
                      />
                    ))}
                  </div>

                  {hasMoreBookmarks && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((p) => p + 9)}
                        className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                      >
                        আরও দেখো
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
        description="এই পদক্ষেপটি স্থায়ী। তোমার সব পরীক্ষার ইতিহাস ডেটাবেজ থেকে মুছে যাবে এবং আর ফিরে পাওয়া যাবে না।"
        confirmLabel="হ্যাঁ, মুছে ফেলো"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ExamHistoryView;
