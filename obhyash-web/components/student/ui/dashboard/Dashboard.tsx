import React from 'react';
import SubjectStat from './SubjectStat';
import { ExamResult } from '@/lib/types';
import { MOCK_USERS } from './leaderboard/leaderboardData';
import UserAvatar from '../common/UserAvatar';

interface DashboardProps {
  onMockExamClick: () => void;
  onHistoryClick: () => void;
  onSubjectClick: (subject: string) => void;
  onLeaderboardClick: () => void;
  history: ExamResult[];
}

const Dashboard: React.FC<DashboardProps> = ({
  onMockExamClick,
  onHistoryClick,
  onSubjectClick,
  onLeaderboardClick,
  history,
}) => {
  // Aggregate Subject Stats from History
  const calculateSubjectStats = () => {
    const subjects: Record<
      string,
      { correct: number; wrong: number; skipped: number; total: number }
    > = {};

    // Initialize common subjects
    ['পদার্থবিজ্ঞান', 'রসায়ন', 'উচ্চতর গণিত', 'জীববিজ্ঞান'].forEach((s) => {
      subjects[s] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    });

    history.forEach((exam) => {
      const subjectKey =
        Object.keys(subjects).find((k) => exam.subject.includes(k)) ||
        exam.subject;

      if (!subjects[subjectKey]) {
        subjects[subjectKey] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      }

      subjects[subjectKey].correct += exam.correctCount;
      subjects[subjectKey].wrong += exam.wrongCount;
      subjects[subjectKey].total += exam.totalQuestions;
      subjects[subjectKey].skipped +=
        exam.totalQuestions - exam.correctCount - exam.wrongCount;
    });

    return Object.entries(subjects).map(([name, stats]) => ({
      name,
      ...stats,
    }));
  };

  const subjectData = calculateSubjectStats();

  // Leaderboard Preview Logic
  const currentUser = MOCK_USERS.find((u) => u.isCurrentUser);
  const sortedUsers = [...MOCK_USERS].sort((a, b) => b.xp - a.xp);
  const userRank = sortedUsers.findIndex((u) => u.id === currentUser?.id) + 1;
  const topUser = sortedUsers[0];
  const xpDiff =
    topUser && currentUser ? Math.max(0, topUser.xp - currentUser.xp) : 0;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Left Column (Cards & Reports) */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        {/* Main Dashboard Cards Grid (2x2) */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Mock Exam Card */}
          <button
            onClick={onMockExamClick}
            className="col-span-1 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center gap-3 hover:border-red-100 dark:hover:border-red-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center h-full group active:scale-[0.98] duration-200"
          >
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight">
                মক পরীক্ষা
              </h3>
            </div>
          </button>

          {/* History Card */}
          <button
            onClick={onHistoryClick}
            className="col-span-1 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center h-full group active:scale-[0.98] duration-200"
          >
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight">
                ইতিহাস
              </h3>
            </div>
          </button>

          {/* Question Bank */}
          <div className="col-span-1 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center gap-3 hover:border-red-100 dark:hover:border-red-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center h-full group cursor-pointer active:scale-[0.98] duration-200">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight">
                প্রশ্নব্যাংক
              </h3>
            </div>
          </div>

          {/* Rapid Practice */}
          <div className="col-span-1 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center gap-3 hover:border-red-100 dark:hover:border-red-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center h-full group cursor-pointer active:scale-[0.98] duration-200">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight">
                দ্রুত চর্চা
              </h3>
            </div>
          </div>
        </div>

        {/* Subject Stats - Now in Left Column */}
        <SubjectStat data={subjectData} onSubjectClick={onSubjectClick} />
      </div>

      {/* Right Column (Leaderboard) */}
      <div className="lg:col-span-1">
        {/* Leaderboard Preview Card - Now in Right Sidebar */}
        <div
          onClick={onLeaderboardClick}
          className="relative bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden group cursor-pointer hover:border-red-200 dark:hover:border-red-900 transition-colors active:scale-[0.99] duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.625H9.21a.75.75 0 0 0 .375.093c.732 0 1.402.092 2.028.222.755.157 1.25.858 1.18 1.63a6.452 6.452 0 0 1-1.385 3.327.75.75 0 0 0 .97 1.133c1.768-1.516 3.037-3.66 3.426-6.079.035-.218.066-.437.093-.657.25-1.922 1.353-3.6 3.023-4.66a.75.75 0 0 0 .363-.63 6.753 6.753 0 0 0-6.138-5.625.75.75 0 0 0-.584-.858 47.76 47.76 0 0 0-3.07-.543V.87a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 0-.75.75ZM3.496 6.004c1.625-.33 3.315-.563 5.048-.678.18-.012.355-.022.525-.03h.001a.75.75 0 0 0 .698-.695 5.55 5.55 0 0 1 .497-2.193 49.33 49.33 0 0 1 2.97.518c.28.056.55.116.81.178.683.163 1.346.36 1.988.586a5.253 5.253 0 0 0-2.31 4.254v.001c-.027.218-.057.435-.092.65a6.45 6.45 0 0 1-1.576 3.37.75.75 0 0 0 .172 1.023 8.35 8.35 0 0 0 2.214 1.037c-.77 2.37-2.613 4.253-4.992 5.163a.75.75 0 0 0-.46.852l.223.924a.75.75 0 0 0 1.058.534c4.32-1.652 7.348-5.836 7.348-10.706 0-1.293-.21-2.533-.596-3.702a.75.75 0 0 0-1.127-.406 3.753 3.753 0 0 1-2.83.69 5.25 5.25 0 0 0-4.22 1.572.75.75 0 0 0 .195 1.156c1.61.942 2.7 2.554 2.943 4.417.027.21.054.42.083.629a8.077 8.077 0 0 1-1.282 4.63.75.75 0 0 0 .97 1.134 9.578 9.578 0 0 0 1.58-5.32c-.033-.236-.064-.474-.095-.712a3.751 3.751 0 0 0-2.99-3.23.75.75 0 0 0-.586.13 6.75 6.75 0 0 0-6.138 5.625Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              লিডারবোর্ড
            </h3>
            <button className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 group-hover:underline">
              সব দেখো
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Rank Info Grid */}
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="flex-1 bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-800/30">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                আপনার র‍্যাংক
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                  #{userRank}
                </span>
                <span className="text-xs font-medium text-neutral-500">
                  / {sortedUsers.length}
                </span>
              </div>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-800/30">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                শীর্ষ স্থান
              </span>
              {topUser && (
                <div className="flex items-center gap-2">
                  <UserAvatar user={topUser} size="sm" showBorder />
                  <div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[80px]">
                      {topUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono leading-none">
                      {topUser.xp} XP
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {xpDiff > 0 ? (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 relative z-10 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg inline-block">
              শীর্ষে পৌঁছাতে আরও{' '}
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {xpDiff.toLocaleString()} XP
              </span>{' '}
              প্রয়োজন
            </div>
          ) : (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 relative z-10 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg inline-block">
              অভিনন্দন! আপনি এখন সবার শীর্ষে!
            </div>
          )}

          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-50 dark:bg-red-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
