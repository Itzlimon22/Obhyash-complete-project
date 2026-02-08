import React, { useState, useMemo } from 'react';
import { ExamResult } from '@/lib/types';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onBack: () => void;
  onClearHistory: () => void;
  onViewResult: (result: ExamResult) => void;
  onRecheckRequest: (id: string) => void;
}

const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onBack,
  onClearHistory,
  onViewResult,
  onRecheckRequest,
}) => {
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        const matchSubject = filterSubject
          ? item.subject.toLowerCase().includes(filterSubject.toLowerCase())
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header Removed - Actions Retained */}
        <div className="flex justify-end gap-3 mb-8">
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
          >
            ইতিহাস মুছুন
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            ফিরে যান
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="বিষয় অনুযায়ী খুঁজুন... (Subject)"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:w-1/3">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setVisibleCount(5);
              }}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-medium text-neutral-500 dark:text-neutral-400">
                মোট পরীক্ষা (মূল্যায়িত)
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {totalExams}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-medium text-neutral-500 dark:text-neutral-400">
                গড় স্কোর (মূল্যায়িত)
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {averageScore}%
              </span>
            </div>
          </div>
        </div>

        {/* History List */}
        {displayedHistory.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed">
            <div className="mx-auto w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              কোন ফলাফল পাওয়া যায়নি
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              ফিল্টার অনুযায়ী কোনো তথ্য নেই।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedHistory.map((item) => {
              const isPending =
                item.submissionType === 'script' && item.status === 'pending';
              const isRejected =
                item.submissionType === 'script' && item.status === 'rejected';

              let statusBadge;
              let mainContent;

              if (isPending) {
                statusBadge = (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    অপেক্ষমান (Pending)
                  </span>
                );
                mainContent = (
                  <div className="flex-1 mt-3 lg:mt-0 flex flex-col items-start lg:items-end justify-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 text-center lg:text-right">
                      আপনার উত্তরপত্রটি পরীক্ষকের যাচাইয়ের জন্য অপেক্ষমান রয়েছে।
                    </p>
                    <button
                      disabled
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 rounded-lg font-bold cursor-not-allowed flex items-center gap-2 text-sm border border-neutral-200 dark:border-neutral-700"
                    >
                      <span>ফলাফল প্রক্রিয়াজাতকরণ</span>
                      <svg
                        className="animate-spin h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
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
                    </button>
                  </div>
                );
              } else if (isRejected) {
                statusBadge = (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                    বাতিল (Rejected)
                  </span>
                );

                const hasReason =
                  item.rejectionReason &&
                  item.rejectionReason !== 'No reason provided' &&
                  item.rejectionReason.trim() !== '';

                mainContent = (
                  <div className="flex-1 mt-3 lg:mt-0 flex flex-col lg:items-end items-start gap-3">
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30 max-w-md w-full">
                      <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-1">
                        বাতিল করার কারণ:
                      </h4>
                      <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                        {item.rejectionReason || 'অজানা কারণে বাতিল করা হয়েছে'}
                      </p>
                    </div>

                    {!hasReason && (
                      <button
                        onClick={() => onRecheckRequest(item.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
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
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                        পুনরায় যাচাই করুন (Request Recheck)
                      </button>
                    )}
                  </div>
                );
              } else {
                // Evaluated / Digital
                const percentage = Math.round(
                  (item.score / item.totalMarks) * 100,
                );
                const scoreColor =
                  percentage >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : percentage >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400';
                const badgeColor =
                  percentage >= 80
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : percentage >= 50
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-red-100 dark:bg-red-900/30';

                statusBadge = (
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${badgeColor} ${scoreColor} border border-transparent`}
                  >
                    {percentage}%
                  </span>
                );

                mainContent = (
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="text-center min-w-[80px]">
                      <span className="block text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide font-bold">
                        স্কোর
                      </span>
                      <span className={`text-lg font-bold ${scoreColor}`}>
                        {item.score.toFixed(1)}{' '}
                        <span className="text-neutral-400 text-sm font-normal">
                          / {item.totalMarks}
                        </span>
                      </span>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <span className="block text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide font-bold">
                        সঠিক
                      </span>
                      <span className="text-lg font-bold text-neutral-800 dark:text-white">
                        {item.correctCount}{' '}
                        <span className="text-neutral-400 text-sm font-normal">
                          / {item.totalQuestions}
                        </span>
                      </span>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <span className="block text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide font-bold">
                        সময়
                      </span>
                      <span className="text-lg font-bold text-neutral-800 dark:text-white">
                        {formatDuration(item.timeTaken)}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewResult(item)}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 border border-neutral-200 dark:border-neutral-700"
                    >
                      <span>ফলাফল দেখুন</span>
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
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                          {item.subject}
                        </h3>
                        {statusBadge}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                          {formatDate(item.date)}
                        </p>
                        {item.submissionType === 'script' && (
                          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-3 h-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                              />
                            </svg>
                            OMR Script
                          </span>
                        )}
                      </div>
                    </div>

                    {mainContent}
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
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
  );
};

export default ExamHistoryView;
