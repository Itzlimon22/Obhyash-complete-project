'use client';

import React, { useMemo } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import { calculateActivityStats } from '@/lib/stats-utils';
import StatsGrid from './dashboard/StatsGrid';
import SubjectsProgressSection from './dashboard/SubjectsProgressSection';
import StreakCalendar from './dashboard/StreakCalendar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useProfileData from '@/hooks/use-profile-data';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import Link from 'next/link';
import { Gift } from 'lucide-react';

interface MyProfileViewProps {
  user: UserProfile;
  history?: ExamResult[];
  onEditProfile: () => void;
  onSubjectClick?: (subject: string) => void;
  onViewNotifications?: () => void;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({
  user: propUser,
  history: propHistory,
  onEditProfile,
  onSubjectClick,
  onViewNotifications,
}) => {
  const hookData = useProfileData();

  const user = propUser || hookData.user;
  const history = propHistory ?? hookData.examHistory;
  const subjectStats = hookData.subjectStats;
  const calendarData = hookData.calendarData;
  const isLoading = !propHistory && hookData.isLoading;

  // -- Data Processing --
  const evaluatedExams = history.filter(
    (h) => !h.status || h.status === 'evaluated',
  );
  const avgScore =
    evaluatedExams.length > 0
      ? Math.round(
          evaluatedExams.reduce(
            (acc, curr) => acc + (curr.score / curr.totalMarks) * 100,
            0,
          ) / evaluatedExams.length,
        )
      : 0;

  // -- Rank System --
  const getRankName = (xp: number) => {
    if (xp < 1000) return 'রকি';
    if (xp < 2000) return 'স্কাউট';
    if (xp < 3000) return 'ওয়ারিয়র';
    if (xp < 4000) return 'টাইটান';
    return 'লিজেন্ড';
  };

  const getNextRankName = (xp: number) => {
    if (xp < 1000) return 'স্কাউট';
    if (xp < 2000) return 'ওয়ারিয়র';
    if (xp < 3000) return 'টাইটান';
    if (xp < 4000) return 'লিজেন্ড';
    return 'লিজেন্ড';
  };

  // Real Data from History
  const activityData = useMemo(
    () => calculateActivityStats(history),
    [history],
  );

  // Calculate weekly progress comparison
  const weeklyChange = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    let thisWeekXP = 0;
    let lastWeekXP = 0;

    history.forEach((exam) => {
      const examDate = new Date(exam.date);
      const xp = exam.correctCount * 10;
      if (examDate >= thisWeekStart) {
        thisWeekXP += xp;
      } else if (examDate >= lastWeekStart && examDate <= lastWeekEnd) {
        lastWeekXP += xp;
      }
    });

    if (lastWeekXP === 0) return thisWeekXP > 0 ? 100 : 0;
    return Math.round(((thisWeekXP - lastWeekXP) / lastWeekXP) * 100);
  }, [history]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse pb-12 pt-2">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            প্রোফাইল
          </h1>
        </div>
        <div className="flex gap-3">
          {onViewNotifications && (
            <button
              onClick={onViewNotifications}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-base sm:text-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95 shadow-sm"
            >
              নোটিফিকেশন
            </button>
          )}
          <button
            onClick={onEditProfile}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-base sm:text-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all active:scale-95 shadow-sm w-fit"
          >
            এডিট করো
          </button>
          <Link
            href="/profile/referral"
            className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl font-bold text-base sm:text-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95 shadow-sm w-fit"
          >
            <Gift className="w-5 h-5" />
            রেফার করুন
          </Link>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-red-500/5 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24 group-hover:scale-110 transition-transform duration-700" />

        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 sm:gap-0 mb-4 sm:mb-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-sm sm:text-base font-black rounded-lg uppercase tracking-wider">
                {getRankName(user.xp || 0)}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-800 dark:text-white">
                পরবর্তী লেভেল রিভার্ড
              </h2>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-red-600 dark:text-red-400">
              {Math.floor((user.xp % 1000) / 10)}%
            </span>
          </div>
        </div>

        <div className="h-3 sm:h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative border border-neutral-200/50 dark:border-neutral-700/50">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-red-500 to-red-600 transition-all duration-1000 ease-out relative"
            style={{ width: `${(user.xp % 1000) / 10}%` }}
          >
            <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] animate-[shimmer_2s_linear_infinite]" />
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex justify-between text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">
          <span>{getRankName(user.xp || 0)}</span>
          <span>{getNextRankName(user.xp || 0)}</span>
        </div>
      </div>

      {/* Key Stats Grid */}
      <StatsGrid
        examsTaken={evaluatedExams.length}
        avgScore={avgScore}
        xp={user.xp}
        streak={user.streakCount || 0}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Subjects Progress Section */}
          <SubjectsProgressSection
            subjectStats={subjectStats}
            onSubjectClick={onSubjectClick}
          />

          {/* Recent Activity List - Moved to Left Column */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-2xl font-bold text-neutral-800 dark:text-white">
                সর্বশেষ কার্যক্রম
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {history.slice(0, 5).map((exam, idx) => (
                <div
                  key={exam.id || idx}
                  className="p-6 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${exam.score / exam.totalMarks >= 0.8 ? 'bg-emerald-500' : exam.score / exam.totalMarks >= 0.5 ? 'bg-red-500' : 'bg-red-500'}`}
                    >
                      {Math.round((exam.score / exam.totalMarks) * 100)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-base md:text-lg">
                        {getSubjectDisplayName(
                          exam.subjectLabel || exam.subject,
                        )}
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                        {new Date(exam.date).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {exam.totalQuestions} প্রশ্ন
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                    {exam.examType || 'Practice'}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-12 text-center text-neutral-500 text-lg font-medium">
                  এখনও কোনো পরীক্ষা দেওয়া হয়নি।
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Streak Calendar */}
          <StreakCalendar
            calendarData={calendarData}
            streakCount={user.streakCount || 0}
          />

          {/* Weekly Activity Graph */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5 sm:p-8">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white">
                সাপ্তাহিক প্রোগ্রেস
              </h3>
              <span
                className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                  weeklyChange >= 0
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {weeklyChange >= 0 ? '+' : ''}
                {weeklyChange}% vs last week
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient
                      id="colorXpProfile"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                    cursor={{
                      stroke: '#059669',
                      strokeWidth: 2,
                      strokeDasharray: '5 5',
                    }}
                    formatter={(value?: number) => [
                      `${value ?? 0} XP`,
                      'অর্জিত',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#059669"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorXpProfile)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileView;
