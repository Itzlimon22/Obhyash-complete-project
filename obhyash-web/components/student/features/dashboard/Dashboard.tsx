import React, { useState, useEffect, useRef } from 'react';
import SubjectStat from './SubjectStat';
import { celebration } from '@/lib/confetti';
import { toast } from 'sonner';
import { ExamResult } from 'lib/types';
import { MOCK_USERS } from './leaderboard/leaderboardData'; // Removed direct usage, but checking if other imports are needed or if we can delete the line.
// Actually the previous step removed usage. So I can delete this line.
// But wait, replace_file_content cannot delete lines easily without replacement.
// I will replace it with empty string or comment.

interface SubjectStats {
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  avatarColor?: string;
}

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
  // Dynamic Subject Stats Logic
  const [subjectStats, setSubjectStats] = React.useState<SubjectStats[]>([]);

  React.useEffect(() => {
    const fetchStats = async () => {
      const { getUserProfile, getSubjects } =
        await import('@/services/database');
      try {
        const user = await getUserProfile('me');
        // Fetch subjects based on user's stream/group
        const subjects = await getSubjects(
          user?.division || undefined,
          user?.stream || undefined,
          user?.optional_subject || undefined,
        );

        // Calculate stats for each subject
        const stats = subjects.map((sub) => {
          // Find matching history items
          // We match by subject name (English/Bangla name) or ID
          // The history item 'subject' field usually contains the name like "Bangla", "Physics" etc.
          // normalize to lowercase for comparison
          const subName = sub.name.toLowerCase();
          const subId = sub.id.toLowerCase();

          let correct = 0;
          let wrong = 0;
          let skipped = 0;
          let total = 0;

          history.forEach((exam) => {
            const hSub = exam.subject.toLowerCase();
            // Check if exam subject matches (contains) the subject name
            // e.g. "Physics 1st Paper" contains "Physics"
            // Also check mapped names if necessary
            const isMatch =
              hSub.includes(subName) ||
              hSub.includes(subId) ||
              (subName === 'পদার্থবিজ্ঞান' && hSub.includes('physics')) ||
              (subName === 'রসায়ন' && hSub.includes('chemistry')) ||
              (subName === 'গণিত' && hSub.includes('math')) ||
              (subName === 'জীববিজ্ঞান' && hSub.includes('biology'));

            if (isMatch) {
              correct += exam.correctCount;
              wrong += exam.wrongCount;
              total += exam.totalQuestions;
              skipped +=
                exam.totalQuestions - exam.correctCount - exam.wrongCount;
            }
          });

          return {
            name: sub.name,
            correct,
            wrong,
            skipped,
            total,
          };
        });

        setSubjectStats(stats);
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      }
    };

    fetchStats();
  }, [history]);

  // Leaderboard Preview Logic
  const [topUser, setTopUser] = React.useState<LeaderboardUser | null>(null);
  const [userRank, setUserRank] = React.useState<number>(0);
  const [totalUsers, setTotalUsers] = React.useState<number>(0);
  const [xpDiff, setXpDiff] = React.useState<number>(0);

  const prevRankRef = useRef<number>(0);

  React.useEffect(() => {
    const fetchLeaderboardStats = async () => {
      const { getLeaderboardUsers, getUserProfile } =
        await import('@/services/database');

      try {
        const currentUser = await getUserProfile('me');
        if (!currentUser) return;

        const level = currentUser.level || 'Level 1';
        const users = await getLeaderboardUsers(level);

        const sorted = [...users].sort((a, b) => b.xp - a.xp);
        const rank = sorted.findIndex((u) => u.id === currentUser.id) + 1;
        const top = sorted[0];
        const diff =
          top && currentUser ? Math.max(0, top.xp - currentUser.xp) : 0;

        // Rank up celebration
        if (prevRankRef.current > 0 && rank < prevRankRef.current) {
          celebration.achievement();
          toast.success('অভিনন্দন! আপনার র‍্যাংক উন্নত হয়েছে!', {
            description: `আপনি এখন #${rank} স্থানে আছেন।`,
          });
        }
        prevRankRef.current = rank;

        setTopUser(top);
        setUserRank(rank);
        setTotalUsers(sorted.length);
        setXpDiff(diff);
      } catch (e) {
        console.error('Failed to fetch leaderboard stats', e);
      }
    };

    fetchLeaderboardStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Cards Section - Order 1 on Mobile, Top Left on Desktop */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4 h-fit">
        <button
          onClick={onMockExamClick}
          className="col-span-1 relative overflow-hidden bg-gradient-to-br from-white to-rose-50/50 dark:from-neutral-900 dark:to-neutral-800/50 p-3 md:p-4 rounded-2xl shadow-[0_2px_8px_-2px_rgba(225,29,72,0.1)] dark:shadow-none border border-rose-100/50 dark:border-neutral-800 flex flex-col justify-center items-center gap-2 md:gap-3 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all text-center h-full group active:scale-[0.98] duration-200"
        >
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-100/20 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-rose-100 dark:border-neutral-700 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              মক পরীক্ষা
            </h3>
          </div>
        </button>

        <button
          onClick={onHistoryClick}
          className="col-span-1 relative overflow-hidden bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-900 dark:to-neutral-800/50 p-3 md:p-4 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col justify-center items-center gap-2 md:gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-center h-full group active:scale-[0.98] duration-200"
        >
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-neutral-100/30 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 group-hover:scale-105 transition-transform relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
              ইতিহাস
            </h3>
          </div>
        </button>

        <button
          onClick={onLeaderboardClick}
          className="col-span-1 relative overflow-hidden bg-gradient-to-br from-white to-amber-50/80 dark:from-neutral-900 dark:to-neutral-800/50 p-3 md:p-4 rounded-2xl shadow-[0_2px_8px_-2px_rgba(245,158,11,0.1)] dark:shadow-none border border-amber-100/50 dark:border-neutral-800 flex flex-col justify-center items-center gap-2 md:gap-3 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all text-center h-full group active:scale-[0.98] duration-200"
        >
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-100/20 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-amber-100 dark:border-neutral-700 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.812a1.125 1.125 0 0 0-1.125 1.125v9.75"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              লিডারবোর্ড
            </h3>
          </div>
        </button>

        <button
          onClick={() => onLeaderboardClick()}
          className="col-span-1 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/80 dark:from-neutral-900 dark:to-neutral-800/50 p-3 md:p-4 rounded-2xl shadow-[0_2px_8px_-2px_rgba(5,150,105,0.1)] dark:shadow-none border border-emerald-100/50 dark:border-neutral-800 flex flex-col justify-center items-center gap-2 md:gap-3 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all text-center h-full group active:scale-[0.98] duration-200"
        >
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-neutral-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-sm md:text-base text-neutral-700 dark:text-neutral-200 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              এনালাইসিস
            </h3>
          </div>
        </button>
      </div>

      {/* Leaderboard Section - Order 2 on Mobile, Right Column on Desktop */}
      <div className="lg:col-span-1 h-full">
        <div
          onClick={onLeaderboardClick}
          className="relative bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden group cursor-pointer hover:border-amber-200 dark:hover:border-amber-900/50 transition-all active:scale-[0.99] duration-200 h-full"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10 dark:to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
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
            <button className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:gap-1.5 transition-all bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
              সব দেখুন
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
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
              <div className="flex-1">
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-1">
                  আপনার র‍্যাংক
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-neutral-800 dark:text-white">
                    #{userRank || '-'}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">
                    / {totalUsers}
                  </span>
                </div>
              </div>
              <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-700"></div>
              <div className="flex-1">
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-1">
                  শীর্ষ স্থান
                </p>
                {topUser ? (
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full ${topUser.avatarColor || 'bg-neutral-400'} text-white text-xs flex items-center justify-center font-bold shadow-sm ring-2 ring-white dark:ring-neutral-800`}
                    >
                      {topUser.name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                        {topUser.name?.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-amber-500 font-bold font-mono leading-none flex items-center gap-0.5">
                        {topUser.xp} XP
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400">Loading...</div>
                )}
              </div>
            </div>

            {xpDiff > 0 ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                <span>
                  শীর্ষে পৌঁছাতে আরও{' '}
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {xpDiff.toLocaleString()} XP
                  </span>{' '}
                  প্রয়োজন
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm4.402 4.05a.75.75 0 1 0-1.06-1.06l-3.667 3.667-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.59 1.591a.75.75 0 0 0 1.061 0l4.242-4.243Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-bold">
                  অভিনন্দন! আপনি এখন সবার শীর্ষে!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Stats Section - Order 3 on Mobile, Bottom Left on Desktop */}
      <div className="lg:col-span-2">
        <SubjectStat data={subjectStats} onSubjectClick={onSubjectClick} />
      </div>
    </div>
  );
};

export default Dashboard;
