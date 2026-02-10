import React, { useState, useMemo } from 'react';
import { ExamResult } from '@/lib/types';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: () => void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
  subjects?: any[]; // Replace with Subject type when available
}

const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onClearHistory,
  onViewResult,
  onRecheckRequest,
  subjects = [],
}) => {
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  // Extract unique subjects for dropdown (Merge DB subjects + History subjects)
  const uniqueSubjects = useMemo(() => {
    const subjectSet = new Set<string>();

    // Add subjects from DB
    subjects.forEach((s) => {
      if (s.name) subjectSet.add(s.name);
    });

    // Add subjects from history (in case some are missing from DB)
    history.forEach((item) => subjectSet.add(item.subject));

    return Array.from(subjectSet).sort();
  }, [history, subjects]);

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        const matchSubject = filterSubject
          ? item.subject.toLowerCase() === filterSubject.toLowerCase()
          : true;
        const matchDate = filterDate ? item.date.startsWith(filterDate) : true;
        return matchSubject && matchDate;
      })
      .reverse();
  }, [history, filterSubject, filterDate]);

  // Pagination Logic
  const displayedHistory = filteredHistory.slice(0, visibleCount);
  const hasMore = visibleCount < filteredHistory.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  // Calculate aggregate stats based on FILTERED data (all matching items, not just visible ones)
  const evaluatedExams = filteredHistory.filter(
    (h) => !h.status || h.status === 'evaluated',
  );
  const totalExams = evaluatedExams.length;

  const averageScore =
    totalExams > 0
      ? Math.round(
          evaluatedExams.reduce(
            (acc, curr) => acc + (curr.score / curr.totalMarks) * 100,
            0,
          ) / totalExams,
        )
      : 0;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} মি ${secs} সেকেন্ড`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] pt-2 md:pt-4 p-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Balanced Action Header */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="px-4 py-2 rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-bold text-xs md:text-sm disabled:opacity-30 flex items-center gap-2"
          >
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
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            <span className="hidden sm:inline">ইতিহাস মুছুন</span>
          </button>

          <button
            onClick={onBack}
            className="group px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-neutral-200 dark:shadow-black/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            ফিরে যান
          </button>
        </div>

        {/* 2-Column Main Layout - Optimized for Tablet (md:grid-cols-2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-8">
          {/* Filters Column (Left - 4 cols on lg, 2 cols on md) */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-5 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm sticky top-20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-neutral-800 dark:text-white">
                  সার্চ ও ফিল্টার
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
                    বিষয় অনুযায়ী খুঁজুন
                  </label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium appearance-none"
                  >
                    <option value="">সব বিষয় (All Subjects)</option>
                    {uniqueSubjects.map((idx) => (
                      <option key={idx} value={idx}>
                        {idx}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
                    তারিখ অনুযায়ী
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setVisibleCount(5);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats & History Column (Right - 8 cols on lg, full on md) */}
          <div className="md:col-span-2 lg:col-span-8 space-y-6">
            {/* Horizontal Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 group hover:border-rose-500/30 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-7 h-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    মোট পরীক্ষা
                  </span>
                  <span className="text-3xl font-black text-neutral-900 dark:text-white">
                    {totalExams}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 group hover:border-emerald-500/30 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-7 h-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    গড় স্কোর
                  </span>
                  <span className="text-3xl font-black text-neutral-900 dark:text-white">
                    {averageScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* History List */}
            {displayedHistory.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 border-dashed">
                <div className="mx-auto w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-neutral-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  কোন ফলাফল পাওয়া যায়নি
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                  ফিল্টার অনুযায়ী কোনো তথ্য নেই।
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedHistory.map((item) => {
                  const isPending =
                    item.submissionType === 'script' &&
                    item.status === 'pending';
                  const isRejected =
                    item.submissionType === 'script' &&
                    item.status === 'rejected';
                  const percentage = Math.round(
                    (item.score / item.totalMarks) * 100,
                  );

                  return (
                    <div
                      key={item.id}
                      className="group bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Info Section */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-neutral-900 dark:text-white break-words">
                              {item.subject}
                            </h3>
                            {item.submissionType === 'script' && (
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 uppercase border border-neutral-200 dark:border-neutral-700">
                                SCRIPT
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                PENDING
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                                REJECTED
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-neutral-400">
                            <div className="flex items-center gap-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-4 h-4 text-neutral-400"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                />
                              </svg>
                              {formatDate(item.date)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-4 h-4 text-neutral-400"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                              {formatDuration(item.timeTaken)}
                            </div>
                          </div>
                        </div>

                        {/* Result / Actions Section */}
                        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                          {isPending ? (
                            <div className="text-right flex-1 md:flex-none">
                              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">
                                প্রক্রিয়াধীন
                              </p>
                              <div className="flex items-center gap-2 text-neutral-500 font-bold text-sm">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                যাচাই করা হচ্ছে
                              </div>
                            </div>
                          ) : isRejected ? (
                            <div className="flex-1 md:flex-none flex items-center gap-3">
                              <button
                                onClick={() => onRecheckRequest(item.id)}
                                className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95"
                                title="Recheck Request"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase mb-0.5">
                                  স্কোর
                                </p>
                                <div className="text-xl font-black text-neutral-900 dark:text-white leading-none">
                                  {item.score.toFixed(0)}
                                  <span className="text-xs text-neutral-400 font-bold ml-0.5">
                                    / {item.totalMarks}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`relative w-12 h-12 flex items-center justify-center rounded-full border-4 ${
                                  percentage >= 80
                                    ? 'border-emerald-500/20'
                                    : percentage >= 50
                                      ? 'border-amber-500/20'
                                      : 'border-red-500/20'
                                }`}
                              >
                                <div
                                  className={`absolute inset-0 rounded-full border-4 border-t-transparent -rotate-45 ${
                                    percentage >= 80
                                      ? 'border-emerald-500'
                                      : percentage >= 50
                                        ? 'border-amber-500'
                                        : 'border-red-500'
                                  }`}
                                  style={{ clipPath: `inset(0 0 0 0)` }}
                                />
                                <span
                                  className={`text-[10px] font-black ${
                                    percentage >= 80
                                      ? 'text-emerald-600'
                                      : percentage >= 50
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {percentage}%
                                </span>
                              </div>

                              <button
                                onClick={() => onViewResult(item)}
                                className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all active:scale-95 shadow-sm"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-white font-bold rounded-2xl shadow-sm hover:border-rose-500/50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4 text-rose-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                      আরও দেখুন (Load More)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamHistoryView;
