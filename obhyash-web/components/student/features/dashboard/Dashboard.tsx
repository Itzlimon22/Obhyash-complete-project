import React, { useState, useRef, useMemo } from 'react';
import useSWR from 'swr';
import SubjectStat from './SubjectStat';
import { celebration } from '@/lib/confetti';
import { toast } from 'sonner';
import { ExamResult, UserProfile } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { DashboardSkeleton } from '@/components/student/ui/common/Skeletons';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

interface SubjectStats {
  id: string;
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
  avatarUrl?: string;
  gender?: string;
}

interface DashboardProps {
  user: UserProfile;
  onMockExamClick: () => void;
  onHistoryClick: () => void;
  onSubjectClick: (subject: string) => void;
  onLeaderboardClick: () => void;
  onAnalysisClick: () => void;
  onPracticeClick: () => void;
  onBlogClick: () => void;
  history: ExamResult[];
  examTarget?: string;
  onChangeTarget?: () => void;
}

import { useAuth } from '@/components/auth/AuthProvider';

const fetchSubjectsOnly = async ([
  _,
  userId,
  division,
  stream,
  optional_subject,
]: [
  string,
  string,
  string | undefined,
  string | undefined,
  string | undefined,
]) => {
  const { getSubjects } = await import('@/services/database');
  return await getSubjects(
    division || undefined,
    stream || undefined,
    optional_subject || undefined,
  );
};

const fetchLeaderboardStats = async ([_, level]: [string, string]) => {
  const { getLeaderboardUsers } = await import('@/services/database');
  const users = await getLeaderboardUsers(level);
  return [...users].sort((a, b) => b.xp - a.xp);
};

const Dashboard: React.FC<DashboardProps> = ({
  user,
  onMockExamClick,
  onHistoryClick,
  onSubjectClick,
  onLeaderboardClick,
  onAnalysisClick,
  onPracticeClick,
  onBlogClick,
  history,
  examTarget,
  onChangeTarget,
}) => {
  const { loading: authLoading } = useAuth();

  const { data: subjects = [], isLoading: isLoadingStats } = useSWR(
    user && !authLoading
      ? [
          'userSubjects',
          user.id,
          user.division,
          user.stream,
          user.optional_subject,
        ]
      : null,
    fetchSubjectsOnly,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const subjectStats = useMemo(() => {
    return subjects.map((sub) => {
      const subName = sub.name.toLowerCase();
      const subId = sub.id.toLowerCase();

      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let total = 0;

      history.forEach((exam) => {
        const hSub = (exam.subjectLabel || exam.subject).toLowerCase();
        const hSubId = exam.subject.toLowerCase();
        const isMatch =
          hSubId === subId ||
          hSub.includes(subName) ||
          hSub.includes(subId) ||
          (subName === 'পদার্থবিজ্ঞান' && hSub.includes('physics')) ||
          (subName === 'রসায়ন' && hSub.includes('chemistry')) ||
          (subName === 'গণিত' && hSub.includes('math')) ||
          (subName === 'জীববিজ্ঞান' && hSub.includes('biology')) ||
          (subName === 'বাংলা' && hSub.includes('bangla')) ||
          (subName === 'ইংরেজি' && hSub.includes('english')) ||
          (subName === 'সাধারণ জ্ঞান' && hSub.includes('gk')) ||
          (subName === 'আইসিটি' && hSub.includes('ict'));

        if (isMatch) {
          correct += exam.correctCount;
          wrong += exam.wrongCount;
          total += exam.totalQuestions;
          skipped += exam.totalQuestions - exam.correctCount - exam.wrongCount;
        }
      });

      return {
        id: sub.id,
        name: getSubjectDisplayName(sub.id),
        correct,
        wrong,
        skipped,
        total,
      };
    });
  }, [subjects, history]);

  const prevRankRef = useRef<number>(0);

  const { data: leaderboardUsers = [], isLoading: isLoadingLeaderboard } =
    useSWR(
      user && !authLoading
        ? ['leaderboardUsers', user.level || 'Rookie']
        : null,
      fetchLeaderboardStats,
      { revalidateOnFocus: false, dedupingInterval: 60000 },
    );

  const { topUser, userRank, totalUsers, xpDiff } = useMemo(() => {
    if (!leaderboardUsers.length || !user)
      return { topUser: null, userRank: 0, totalUsers: 0, xpDiff: 0 };

    const rank = leaderboardUsers.findIndex((u) => u.id === user.id) + 1;
    const top = leaderboardUsers[0];
    const diff = top ? Math.max(0, top.xp - user.xp) : 0;

    return {
      topUser: top,
      userRank: rank,
      totalUsers: leaderboardUsers.length,
      xpDiff: diff,
    };
  }, [leaderboardUsers, user]);

  React.useEffect(() => {
    if (userRank > 0) {
      if (prevRankRef.current > 0 && userRank < prevRankRef.current) {
        celebration.achievement();
        toast.success('অভিনন্দন! তোমার র‍্যাংক উন্নত হয়েছে!', {
          description: `তুমি এখন #${userRank} স্থানে আছো।`,
        });
      }
      prevRankRef.current = userRank;
    }
  }, [userRank]);

  if (isLoadingStats && !subjectStats.length) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-1">
      {/* Cards Section */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3 h-fit">
        <button
          onClick={onMockExamClick}
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-neutral-900 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 dark:hover:border-emerald-800 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-emerald-950/30 transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
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
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            মক পরীক্ষা
          </h3>
        </button>

        {/* অনুশীলন */}
        <button
          onClick={onPracticeClick}
          className="group relative overflow-hidden bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-neutral-900 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-sky-300 dark:hover:border-sky-800 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-700 dark:text-sky-400 group-hover:scale-105 transition-transform shrink-0">
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
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
            অনুশীলন
          </h3>
        </button>

        {/* ইতিহাস */}
        <button
          onClick={onHistoryClick}
          className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-neutral-900 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-amber-300 dark:hover:border-amber-800 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
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
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            ইতিহাস
          </h3>
        </button>

        {/* লিডারবোর্ড */}
        <button
          onClick={onLeaderboardClick}
          className="group relative overflow-hidden bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900 border border-violet-100 dark:border-violet-900/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-violet-300 dark:hover:border-violet-800 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-400 group-hover:scale-105 transition-transform shrink-0">
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
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.812a1.125 1.125 0 0 0-1.125 1.125v9.75"
              />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
            লিডারবোর্ড
          </h3>
        </button>

        {/* এনালাইসিস */}
        <button
          onClick={onAnalysisClick}
          className="group relative overflow-hidden bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-neutral-900 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-rose-300 dark:hover:border-rose-800 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
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
                d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
              />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            এনালাইসিস
          </h3>
        </button>

        {/* ব্লগ */}
        <button
          onClick={onBlogClick}
          className="group relative overflow-hidden bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/20 dark:to-neutral-900 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-teal-300 dark:hover:border-teal-800 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-[0.97] duration-200 text-center h-28 sm:h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 group-hover:scale-105 transition-transform shrink-0">
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
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
              />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
            ব্লগ
          </h3>
        </button>
      </div>

      {/* Leaderboard Section - Order 2 on Mobile, Right Column on Desktop */}
      <div className="lg:col-span-1 h-full">
        <div
          onClick={onLeaderboardClick}
          className="relative bg-white dark:bg-neutral-900 rounded-3xl p-5 md:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all active:scale-[0.99] duration-200 h-full"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.625 6.753 6.753 0 0 0 6.138-5.625.75.75 0 0 0-.584-.86 47.78 47.78 0 0 0-3.07-.542V2.62a.75.75 0 0 0-.75-.75h-3.467a.75.75 0 0 0-.75.75ZM12.75 21.696a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-3.803a6.753 6.753 0 0 1-5.625-6.138.75.75 0 0 1 .859-.584c.213.036.427.07.641.1V9.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 .75.75v1.521c.214-.03.428-.064.641-.1a.75.75 0 0 1 .859.584 6.753 6.753 0 0 1-5.625 6.138v3.803Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              লিডারবোর্ড
            </h3>
            <button className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-1.5 transition-all bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
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

          {/* Mini Leaderboard Table */}
          <div className="relative z-10 space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <span>#</span>
              <span></span>
              <span>নাম</span>
            </div>

            {/* Topper Row */}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-900/5 border border-emerald-100/60 dark:border-emerald-800/30">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                🥇
              </span>
              {isLoadingLeaderboard ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
                  <div className="h-3.5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                </>
              ) : topUser ? (
                <>
                  <UserAvatar
                    user={topUser as unknown as UserProfile}
                    size="sm"
                    className="w-7 h-7 text-[11px] shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800"
                  />
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {topUser.name?.split(' ').slice(0, 2).join(' ')}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-lg">
                    —
                  </div>
                  <span className="text-sm text-neutral-400 dark:text-neutral-500">
                    কেউ নেই
                  </span>
                </>
              )}
            </div>

            {/* Current User Row */}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-900/15 dark:to-emerald-900/5 border border-emerald-100/60 dark:border-emerald-800/30">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                #{userRank || '-'}
              </span>
              <UserAvatar
                user={user}
                size="sm"
                className="w-7 h-7 text-[11px] shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800"
              />
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {user.name?.split(' ').slice(0, 2).join(' ')}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                  তুমি
                </span>
              </div>
            </div>

            {/* XP Gap Indicator */}
            {xpDiff > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 px-3 pt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                শীর্ষে পৌঁছাতে আরও{' '}
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  {xpDiff.toLocaleString()} XP
                </span>{' '}
                লাগবে
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Stats Section - Order 3 on Mobile, Bottom Left on Desktop */}
      <div className="lg:col-span-2">
        <SubjectStat
          data={subjectStats}
          onSubjectClick={onSubjectClick}
          isLoading={isLoadingStats}
        />
      </div>
    </div>
  );
};

export default Dashboard;
