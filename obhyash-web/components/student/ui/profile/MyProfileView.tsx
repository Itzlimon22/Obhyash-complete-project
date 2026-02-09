'use client';

import React, { useMemo } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import { calculateRadarData, calculateActivityStats } from '@/lib/stats-utils';
import StatsGrid from './dashboard/StatsGrid';
import SubjectRadar from './dashboard/SubjectRadar';
import SubjectsProgressSection from './dashboard/SubjectsProgressSection';
import StreakCalendar from './dashboard/StreakCalendar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useProfileData from '@/hooks/use-profile-data';

interface MyProfileViewProps {
  user: UserProfile;
  history?: ExamResult[];
  onEditProfile: () => void;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({
  user: propUser,
  history: propHistory,
  onEditProfile,
}) => {
  // Use hook for data if no history prop provided, otherwise use props (backward compatible)
  const hookData = useProfileData();

  const user = propUser || hookData.user;
  const history = propHistory ?? hookData.examHistory;
  const subjectStats = hookData.subjectStats;
  const calendarData = hookData.calendarData;
  const isLoading = !propHistory && hookData.isLoading;

  // -- Data Processing --
  const evaluatedExams = history.filter((h) => h.status === 'evaluated');
  const avgScore =
    evaluatedExams.length > 0
      ? Math.round(
          evaluatedExams.reduce(
            (acc, curr) => acc + (curr.score / curr.totalMarks) * 100,
            0,
          ) / evaluatedExams.length,
        )
      : 0;

  // Real Data from History
  const radarData = useMemo(() => calculateRadarData(history), [history]);
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
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            প্রোফাইল
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            আপনার শিখার যাত্রা এবং অর্জনসমূহ
          </p>
        </div>
        <button
          onClick={onEditProfile}
          className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-bold text-base hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          এডিট করুন
        </button>
      </div>

      {/* Level Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />

        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-black rounded-md uppercase tracking-wider">
                {user.level || 'Level 1'}
              </span>
              <h2 className="text-2xl font-black text-neutral-800 dark:text-white">
                পরবর্তী লেভেল রিভার্ড
              </h2>
            </div>
            <p className="text-base text-neutral-500 dark:text-neutral-400 font-medium">
              {(1000 - (user.xp % 1000)).toLocaleString()} XP প্রয়োজন পরবর্তী
              লেভেলের জন্য
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {Math.floor((user.xp % 1000) / 10)}%
            </span>
          </div>
        </div>

        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative border border-neutral-200/50 dark:border-neutral-700/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-1000 ease-out relative"
            style={{ width: `${(user.xp % 1000) / 10}%` }}
          >
            <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] animate-[shimmer_2s_linear_infinite]" />
          </div>
        </div>

        <div className="mt-4 flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">
          <span>{user.level || 'Level 1'}</span>
          <span>
            Level {parseInt((user.level || 'Level 1').split(' ')[1]) + 1}
          </span>
        </div>
      </div>

      {/* Key Stats Grid */}
      <StatsGrid
        examsTaken={user.examsTaken}
        avgScore={avgScore}
        xp={user.xp}
        streak={user.streakCount || 0}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Subject Radar */}
          <SubjectRadar data={radarData} />

          {/* Streak Calendar */}
          <StreakCalendar
            calendarData={calendarData}
            streakCount={user.streakCount || 0}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subjects Progress Section */}
          <SubjectsProgressSection subjectStats={subjectStats} />

          {/* Weekly Activity Graph */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
                  সাপ্তাহিক প্রোগ্রেস
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  গত ৭ দিনের XP অর্জনের চিত্র
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  weeklyChange >= 0
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {weeklyChange >= 0 ? '+' : ''}
                {weeklyChange}% vs last week
              </span>
            </div>
            <div className="h-64 w-full">
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
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    cursor={{
                      stroke: '#6366f1',
                      strokeWidth: 1,
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
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorXpProfile)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity List - Limited to 5 items */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
                সর্বশেষ কার্যক্রম
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {history.slice(0, 5).map((exam, idx) => (
                <div
                  key={exam.id || idx}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${exam.score / exam.totalMarks >= 0.8 ? 'bg-emerald-500' : exam.score / exam.totalMarks >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                    >
                      {Math.round((exam.score / exam.totalMarks) * 100)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                        {exam.subjectLabel || exam.subject}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(exam.date).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {exam.totalQuestions} প্রশ্ন
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                    {exam.examType || 'Practice'}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-8 text-center text-neutral-500 text-sm">
                  এখনও কোনো পরীক্ষা দেওয়া হয়নি।
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileView;
