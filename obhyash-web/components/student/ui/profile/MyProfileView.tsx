'use client';

import React, { useMemo, useState } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import { calculateActivityStats } from '@/lib/stats-utils';
import dynamic from 'next/dynamic';
const StatsGrid = dynamic(() => import('./dashboard/StatsGrid'));
const SubjectsProgressSection = dynamic(
  () => import('./dashboard/SubjectsProgressSection'),
);
const StreakCalendar = dynamic(() => import('./dashboard/StreakCalendar'));
const AreaChart = dynamic(() =>
  import('recharts').then((mod) => mod.AreaChart),
);
const Area = dynamic(() => import('recharts').then((mod) => mod.Area));
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis));
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip));
const ResponsiveContainer = dynamic(() =>
  import('recharts').then((mod) => mod.ResponsiveContainer),
);
import useProfileData from '@/hooks/use-profile-data';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { EXAM_TARGETS } from '@/components/student/features/dashboard/ExamTargetModal';
const ExamTargetModal = dynamic(
  () => import('@/components/student/features/dashboard/ExamTargetModal'),
);

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

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [localExamTarget, setLocalExamTarget] = useState<string | null>(null);

  const user = propUser || hookData.user;
  const displayTarget = localExamTarget ?? user?.exam_target ?? '';
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

  // - Rank Systemm -
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

  // Real Data History
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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-3 w-full sm:w-auto">
            {onViewNotifications && (
              <button
                onClick={onViewNotifications}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-base sm:text-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95 shadow-sm"
              >
                নোটিফিকেশন
              </button>
            )}
            <button
              onClick={onEditProfile}
              className="flex-1 sm:flex-none px-5 py-2.5 sm:px-6 sm:py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-base sm:text-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all active:scale-95 shadow-sm"
            >
              এডিট করো
            </button>
          </div>
          <Link
            href="/referral"
            className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl font-bold text-base sm:text-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95 shadow-sm w-full sm:w-fit"
          >
            <Gift className="w-5 h-5" />
            রেফার করো
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
          <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-500">⚡</span>
                </div>
                সর্বশেষ কার্যক্রম
              </h3>
              <button className="text-sm font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2 rounded-xl transition-colors active:scale-95">
                সব দেখো
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-3 p-4 sm:p-6 pt-0 sm:pt-0 bg-neutral-50/50 dark:bg-neutral-900/50">
              {history.slice(0, 5).map((exam, idx) => (
                <div
                  key={exam.id || idx}
                  className="group relative bg-white dark:bg-neutral-800/80 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>

                  <div className="flex items-center gap-4 w-full">
                    <div className="relative">
                      <svg
                        className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-neutral-100 dark:text-neutral-700"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={`${exam.score / exam.totalMarks >= 0.8 ? 'text-emerald-500' : exam.score / exam.totalMarks >= 0.5 ? 'text-amber-500' : 'text-red-500'}`}
                          strokeDasharray={`${(exam.score / exam.totalMarks) * 100}, 100`}
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span
                          className={`text-sm sm:text-base font-black ${exam.score / exam.totalMarks >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : exam.score / exam.totalMarks >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {Math.round((exam.score / exam.totalMarks) * 100)}
                          <span className="text-[10px]">%</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-neutral-900 dark:text-white text-base sm:text-lg truncate">
                          {getSubjectDisplayName(
                            exam.subjectLabel || exam.subject,
                          )}
                        </h4>
                        <span className="shrink-0 text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/50 px-2 py-1 rounded-md border border-neutral-200/50 dark:border-neutral-600/50">
                          {exam.examType || 'Practice'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 sm:mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {new Date(exam.date).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{exam.totalQuestions} প্রশ্ন</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-700/50 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors ml-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-8 sm:p-12 text-center text-neutral-500 dark:text-neutral-400 text-base sm:text-lg font-medium flex flex-col items-center gap-4 bg-white dark:bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  এখনও কোনো পরীক্ষা দেওয়া হয়নি।
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Exam Target Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎯</span>
                তোমার লক্ষ্য কী?
              </h3>
              <button
                onClick={() => setShowTargetModal(true)}
                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
              >
                পরিবর্তন করো
              </button>
            </div>
            {displayTarget ? (
              (() => {
                const target = EXAM_TARGETS.find((t) => t.id === displayTarget);
                return target ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-600">
                    <span className="text-2xl">{target.emoji}</span>
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
                        {target.label}
                      </p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {target.sub}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTargetModal(true)}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm font-medium hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                  >
                    + লক্ষ্য নির্ধারণ করো
                  </button>
                );
              })()
            ) : (
              <button
                onClick={() => setShowTargetModal(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm font-medium hover:border-emerald-400 hover:text-emerald-500 transition-colors"
              >
                + লক্ষ্য নির্ধারণ করো
              </button>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 text-center">
              তোমার পরীক্ষার লক্ষ্য নির্বাচন করো — আমরা সেই অনুযায়ী তোমাকে
              সাহায্য করব
            </p>
          </div>

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
                    formatter={(value: unknown, name: unknown) => [
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
      {showTargetModal && user && (
        <ExamTargetModal
          user={{ ...user, exam_target: displayTarget || undefined }}
          onClose={(updatedTarget) => {
            if (updatedTarget) setLocalExamTarget(updatedTarget);
            setShowTargetModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MyProfileView;
