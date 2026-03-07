import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UserProfile } from 'lib/types';
import SubjectStat from './SubjectStat';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import {
  getOverallAnalytics,
  OverallAnalytics,
} from '@/services/stats-service';

interface UserProfileViewProps {
  user: UserProfile;
  currentUser?: UserProfile | null;
  rank: number;
  onBack: () => void;
  onSubjectClick?: (subject: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  currentUser,
  rank,
  onBack,
  onSubjectClick,
}) => {
  // Fetch real analytics for the viewed user
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [currentUserAnalytics, setCurrentUserAnalytics] =
    useState<OverallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch target user's analytics
        const targetAnalytics = await getOverallAnalytics(user.id, 'all');
        setAnalytics(targetAnalytics);

        // Fetch current user's analytics for comparison (if not viewing self)
        if (currentUser && currentUser.id !== user.id) {
          const myAnalytics = await getOverallAnalytics(currentUser.id, 'all');
          setCurrentUserAnalytics(myAnalytics);
        }
      } catch (err) {
        console.error('Failed to fetch profile analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id, currentUser?.id]);

  // Subject stats from real analytics
  const subjectStats = useMemo(() => {
    if (
      analytics &&
      analytics.subjectData &&
      analytics.subjectData.length > 0
    ) {
      return analytics.subjectData.map((s) => ({
        name: s.name,
        correct: s.correct,
        wrong: s.wrong,
        skipped: s.skipped,
        total: s.total,
      }));
    }
    return [];
  }, [analytics]);

  // Total correct answers from analytics for badge
  const totalCorrect = useMemo(() => {
    if (analytics?.subjectData) {
      return analytics.subjectData.reduce((sum, s) => sum + s.correct, 0);
    }
    return 0;
  }, [analytics]);

  // Comparison chart data using real XP and timeline
  const comparisonData = useMemo(() => {
    const isViewingSelf = currentUser?.id === user.id;

    if (isViewingSelf) {
      // If viewing self, just show own timeline
      if (analytics?.timelineData && analytics.timelineData.length > 0) {
        return analytics.timelineData.slice(-7).map((d) => ({
          name: d.name,
          you: d.score,
          opponent: 0,
        }));
      }
      return [];
    }

    // Compare current user vs target user using timeline data
    const targetTimeline = analytics?.timelineData || [];
    const myTimeline = currentUserAnalytics?.timelineData || [];

    // If both have timeline data, merge them
    if (targetTimeline.length > 0 || myTimeline.length > 0) {
      // Use the last 7 entries, aligning by date
      const allDates = new Set<string>();
      targetTimeline.forEach((d) => allDates.add(d.name));
      myTimeline.forEach((d) => allDates.add(d.name));

      const dateArray = Array.from(allDates).sort().slice(-7);

      return dateArray.map((date) => {
        const myEntry = myTimeline.find((d) => d.name === date);
        const targetEntry = targetTimeline.find((d) => d.name === date);
        return {
          name: date,
          you: myEntry?.score || 0,
          opponent: targetEntry?.score || 0,
        };
      });
    }

    // Fallback: show XP comparison as a simple bar-style display
    return [{ name: 'XP', you: currentUser?.xp || 0, opponent: user.xp || 0 }];
  }, [analytics, currentUserAnalytics, currentUser, user]);

  const isViewingSelf = currentUser?.id === user.id;
  const myXp = currentUser?.xp || 0;
  const opponentXp = user.xp || 0;

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-neutral-950 px-2 py-4 md:p-8 animate-fade-in transition-colors font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
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
          <span>ফিরে যাও</span>
        </button>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <UserAvatar user={user} size="2xl" showBorder />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                {user.name}
              </h1>
              <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full mb-1">
                {user.level || 'Rookie'}
              </span>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                {user.institute}
              </p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-around md:justify-end">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.xp.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                পয়েন্ট
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {rank > 0 ? rank : '-'}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                র‍্যাংক
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.387 17.387 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.165 17.165 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49 2.098zM2.644 14.752c1.682.097 3.53.75 5.49 2.098a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.817z" />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.examsTaken || 0}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                পরীক্ষা
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.streakCount || 0}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                স্ট্রিক
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {/* Badges - Real data */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4">
                ব্যাজেস
              </h3>
              {isLoading ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-2" />
                  <div className="h-6 w-10 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                  <div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2 ring-4 ring-green-50 dark:ring-green-900/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {totalCorrect}
                  </div>
                  <div className="text-sm text-neutral-500 font-medium">
                    সঠিক উত্তর
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Chart - Real data */}
            {!isViewingSelf && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 flex-1">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4 text-center">
                  তুলনা: আপনি vs {user.name?.split(' ')[0]}
                </h3>

                {/* XP Comparison Summary */}
                <div className="flex justify-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      আপনি — {myXp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {user.name?.split(' ')[0]} — {opponentXp.toLocaleString()}{' '}
                      XP
                    </span>
                  </div>
                </div>

                {/* XP Bar Comparison */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>আপনি</span>
                      <span className="font-mono font-bold">
                        {myXp.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neutral-400 to-neutral-600 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (myXp / Math.max(myXp, opponentXp, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>{user.name?.split(' ')[0]}</span>
                      <span className="font-mono font-bold">
                        {opponentXp.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (opponentXp / Math.max(myXp, opponentXp, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Comparison Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl text-center">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                      পরীক্ষা
                    </div>
                    <div className="flex justify-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                          {currentUser?.examsTaken || 0}
                        </div>
                        <div className="text-[10px] text-neutral-400">আপনি</div>
                      </div>
                      <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {user.examsTaken || 0}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {user.name?.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl text-center">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                      স্ট্রিক
                    </div>
                    <div className="flex justify-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                          {currentUser?.streakCount || 0}
                        </div>
                        <div className="text-[10px] text-neutral-400">আপনি</div>
                      </div>
                      <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {user.streakCount || 0}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {user.name?.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl text-center">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                      গড় স্কোর
                    </div>
                    <div className="flex justify-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                          {currentUserAnalytics?.avgScore
                            ? Math.round(currentUserAnalytics.avgScore)
                            : 0}
                          %
                        </div>
                        <div className="text-[10px] text-neutral-400">আপনি</div>
                      </div>
                      <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {analytics?.avgScore
                            ? Math.round(analytics.avgScore)
                            : 0}
                          %
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {user.name?.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl text-center">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                      নির্ভুলতা
                    </div>
                    <div className="flex justify-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                          {currentUserAnalytics?.avgAccuracy
                            ? Math.round(currentUserAnalytics.avgAccuracy)
                            : 0}
                          %
                        </div>
                        <div className="text-[10px] text-neutral-400">আপনি</div>
                      </div>
                      <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {analytics?.avgAccuracy
                            ? Math.round(analytics.avgAccuracy)
                            : 0}
                          %
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {user.name?.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Chart (if data available) */}
                {comparisonData.length > 1 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-3 text-center">
                      স্কোর প্রবণতা
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={comparisonData}>
                          <defs>
                            <linearGradient
                              id="colorOpponent"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.1}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="you"
                            stroke="#64748b"
                            strokeWidth={2}
                            fill="transparent"
                            dot={{
                              r: 3,
                              fill: '#64748b',
                              strokeWidth: 2,
                              stroke: '#fff',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="opponent"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorOpponent)"
                            dot={{
                              r: 3,
                              fill: '#3b82f6',
                              strokeWidth: 2,
                              stroke: '#fff',
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject Report - Real data */}
          <div>
            <SubjectStat
              data={subjectStats}
              onSubjectClick={
                user.isCurrentUser && onSubjectClick
                  ? (subject) => onSubjectClick(subject)
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
