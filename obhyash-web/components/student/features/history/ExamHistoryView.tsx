import React, { useState, useMemo } from 'react';
import { ExamResult, Question } from '@/lib/types'; // Updated to likely correct path
import LatexText from '@/components/student/ui/LatexText';
import QuestionCard from '../exam/QuestionCard';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: () => void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
}

// Helper component for Practicable Question Item
const PracticeRow: React.FC<{
  item: {
    examDate: string;
    subject: string;
    userAns: number | undefined;
    question: Question;
    flagged: boolean;
  };
  isMistakeTab?: boolean;
}> = ({ item, isMistakeTab }) => {
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
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {new Date(item.examDate).toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            • {item.subject}
          </span>
          {revealed && item.userAns !== undefined && isMistakeTab && (
            <span className="text-[10px] text-neutral-400 mt-0.5">
              আপনার পূর্বের উত্তর:{' '}
              <span
                className={
                  item.userAns === item.question.correctAnswerIndex
                    ? 'text-emerald-500 font-bold'
                    : 'text-red-500 font-bold'
                }
              >
                {/* ✅ UPDATED: Now supports Math/LaTeX rendering */}
                <LatexText
                  text={item.question.options[item.userAns] || 'উত্তর দেননি'}
                />
              </span>
            </span>
          )}
        </div>
        {revealed && (
          <button
            onClick={handleRetry}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
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
            আবার চেষ্টা করুন
          </button>
        )}
      </div>

      <QuestionCard
        question={item.question}
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
}) => {
  const [activeTab, setActiveTab] = useState<'marked' | 'mistakes' | 'exams'>(
    'exams',
  );
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  // Extract unique subjects for dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    history.forEach((item) => subjects.add(item.subject));
    return Array.from(subjects).sort();
  }, [history]);

  // -- EXAMS TAB LOGIC --
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        const matchSubject = filterSubject
          ? item.subject === filterSubject
          : true;
        const matchDate = filterDate ? item.date.startsWith(filterDate) : true;
        return matchSubject && matchDate;
      })
      .reverse();
  }, [history, filterSubject, filterDate]);

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
      userAns: number;
      flagged: boolean;
    }[] = [];
    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;

      if (!exam.questions || !exam.userAnswers) return;

      const flags = new Set(exam.flaggedQuestions || []);

      exam.questions.forEach((q) => {
        const ua = exam.userAnswers?.[q.id];
        // Check if attempted and wrong
        if (ua !== undefined && ua !== q.correctAnswerIndex) {
          allMistakes.push({
            question: q,
            examDate: exam.date,
            subject: exam.subject,
            userAns: ua,
            flagged: flags.has(
              typeof q.id === 'string' ? parseInt(q.id) : q.id,
            ),
          });
        }
      });
    });
    return allMistakes.reverse();
  }, [history, filterSubject, filterDate]);

  const displayedMistakes = mistakes.slice(0, visibleCount);
  const hasMoreMistakes = visibleCount < mistakes.length;

  // -- BOOKMARKED TAB LOGIC --
  const bookmarks = useMemo(() => {
    const allBookmarks: {
      question: Question;
      examDate: string;
      subject: string;
      userAns: number | undefined;
      flagged: boolean;
    }[] = [];
    history.forEach((exam) => {
      if (filterSubject && exam.subject !== filterSubject) return;
      if (filterDate && !exam.date.startsWith(filterDate)) return;

      if (
        !exam.questions ||
        !exam.flaggedQuestions ||
        exam.flaggedQuestions.length === 0
      )
        return;

      const flags = new Set(exam.flaggedQuestions);

      exam.questions.forEach((q) => {
        if (flags.has(typeof q.id === 'string' ? parseInt(q.id) : q.id)) {
          allBookmarks.push({
            question: q,
            examDate: exam.date,
            subject: exam.subject,
            userAns: exam.userAnswers?.[q.id],
            flagged: true,
          });
        }
      });
    });
    return allBookmarks.reverse();
  }, [history, filterSubject, filterDate]);

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
                                        ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400 scale-[1.02]'
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
                className="w-full appearance-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="">সকল বিষয়</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
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
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm h-full"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-5 animate-fade-in">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-2.5 md:p-4 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-center items-center md:items-start">
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
                    onClick={() => {
                      if (
                        confirm(
                          'আপনি কি নিশ্চিত যে আপনি সমস্ত ইতিহাস মুছে ফেলতে চান?',
                        )
                      ) {
                        onClearHistory();
                      }
                    }}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    সব ইতিহাস মুছুন
                  </button>
                </div>
              )}

              {/* Results List Grid */}
              {displayedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                    কোন ফলাফল পাওয়া যায়নি
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
                      'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
                    let statusText = `${scorePercent}%`;

                    if (isPending) {
                      badgeClass =
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                      statusText = 'Pending';
                    } else if (isRejected) {
                      badgeClass =
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                      statusText = 'Rejected';
                    } else if (scorePercent >= 80) {
                      badgeClass =
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                    }

                    return (
                      <div
                        key={item.id}
                        className="group bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden"
                      >
                        <div className="mb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                              {formatDate(item.date)}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
                            >
                              {statusText}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.subject}
                          </h3>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3 font-medium">
                            {item.examType || 'Practice Exam'}
                          </p>

                          {!isPending && !isRejected && (
                            <div className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800/50">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-neutral-400 uppercase font-bold">
                                  Score
                                </span>
                                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                  {item.score.toFixed(1)} / {item.totalMarks}
                                </span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-[9px] text-neutral-400 uppercase font-bold">
                                  Time
                                </span>
                                <span className="font-bold text-neutral-700 dark:text-neutral-200">
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
                            className="w-full py-2 flex items-center justify-center gap-1.5 text-white font-bold text-xs bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-500 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-neutral-400"
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
                    আরও দেখুন
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
                    কোনো ভুল পাওয়া যায়নি!
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    আপনি সব প্রশ্নের সঠিক উত্তর দিয়েছেন।
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-xl flex items-center gap-3">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600">
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
                    <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                      এখানে আপনি ভুল করা প্রশ্নগুলো পুনরায় চর্চা করতে পারবেন।
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {displayedMistakes.map((item, idx) => (
                      <PracticeRow
                        key={`${item.examDate}-${idx}`}
                        item={item}
                        isMistakeTab={true}
                      />
                    ))}
                  </div>

                  {hasMoreMistakes && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((p) => p + 9)}
                        className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                      >
                        আরও দেখুন
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
                    কোনো প্রশ্ন বুকমার্ক করা নেই
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs text-center">
                    গুরুত্বপূর্ণ প্রশ্ন বুকমার্ক করে এখানে সংরক্ষণ করুন।
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {displayedBookmarks.map((item, idx) => (
                      <PracticeRow
                        key={`${item.examDate}-${idx}`}
                        item={item}
                      />
                    ))}
                  </div>

                  {hasMoreBookmarks && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setVisibleCount((p) => p + 9)}
                        className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
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
      </div>
    </div>
  );
};

export default ExamHistoryView;
