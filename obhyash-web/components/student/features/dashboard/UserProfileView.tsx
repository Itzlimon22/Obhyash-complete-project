'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UserProfile } from '@/lib/types';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import {
  getOverallAnalytics,
  OverallAnalytics,
} from '@/services/stats-service';
import dynamic from 'next/dynamic';
import { Award } from 'lucide-react';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import XpGainLineChartCard, {
  DailyXpPoint,
} from '@/components/student/ui/profile/dashboard/XpGainLineChartCard';

const SubjectsProgressSection = dynamic(
  () => import('@/components/student/ui/profile/dashboard/SubjectsProgressSection'),
);
const StreakCalendar = dynamic(
  () => import('@/components/student/ui/profile/dashboard/StreakCalendar'),
);
const BadgesShowcaseSection = dynamic(
  () => import('@/components/student/ui/profile/dashboard/BadgesShowcaseSection'),
);

interface UserProfileViewProps {
  user: UserProfile;
  currentUser?: UserProfile | null;
  rank: number;
  onBack: () => void;
  onSubjectClick?: (subject: string) => void;
}

function getBengaliWeekday(d: Date): string {
  const day = d.getDay(); // 0 is Sunday
  switch (day) {
    case 6: return 'শনি';
    case 0: return 'রবি';
    case 1: return 'সোম';
    case 2: return 'মঙ্গল';
    case 3: return 'বুধ';
    case 4: return 'বৃহঃ';
    case 5: return 'শুক্র';
    default: return '';
  }
}

function getLevelRank(xp: number): string {
  if (xp < 500) return 'রুকি';
  if (xp < 2000) return 'স্কাউট';
  if (xp < 5000) return 'ওয়ারিয়র';
  if (xp < 10000) return 'টাইটান';
  return 'লিজেন্ড';
}

function generateSimulatedAnalytics(user: {
  id: string;
  xp?: number;
  streakCount?: number;
  examsTaken?: number;
  stream?: string;
}) {
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) {
    hash = (hash << 5) - hash + user.id.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const isSsc = (user.stream || '').toUpperCase() === 'SSC';

  const subjectKeys = isSsc
    ? ['ssc_physics', 'ssc_chemistry', 'ssc_higher_math', 'ssc_biology', 'ssc_ict', 'ssc_bangla']
    : ['hsc_physics_1', 'hsc_chemistry_1', 'hsc_higher_math_1', 'hsc_biology_1', 'hsc_ict', 'hsc_bangla_1'];

  const baseAccuracy = Math.min(92, Math.max(75, 76 + (seed % 16)));
  const totalExams =
    user.examsTaken && user.examsTaken > 0
      ? user.examsTaken
      : Math.min(150, Math.max(10, Math.round((user.xp || 0) / 120)));
  const totalQuestions = totalExams * 25;

  let totalCorrect = 0;
  const subjects: Array<{
    subject: string;
    examCount: number;
    accuracy: number;
    lastActivity: string;
  }> = [];

  for (let i = 0; i < subjectKeys.length; i++) {
    const key = subjectKeys[i];
    const subWeight = 0.12 + (((seed + i * 7) % 12) / 100.0);
    const subExams = Math.min(totalExams, Math.max(1, Math.round(totalExams * subWeight)));
    const subTotal = Math.min(totalQuestions, Math.max(15, Math.round(totalQuestions * subWeight)));
    const subAcc = Math.min(96, Math.max(65, baseAccuracy + ((seed + i * 3) % 9) - 4));
    const subCorrect = Math.round(subTotal * (subAcc / 100.0));

    subjects.push({
      subject: BanglaNameHelper.formatSubject(key),
      examCount: subExams,
      accuracy: subAcc,
      lastActivity: 'সম্প্রতি',
    });

    totalCorrect += subCorrect;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const calendarDays: Array<{
    date: string;
    dayOfMonth: number;
    examCount: number;
    isCurrentMonth: boolean;
  }> = [];

  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, 1 - (startWeekday - i));
    calendarDays.push({
      date: d.toISOString(),
      dayOfMonth: d.getDate(),
      examCount: 0,
      isCurrentMonth: false,
    });
  }

  const streakDays = Math.min(now.getDate(), user.streakCount || 0);
  const activeStartDay = Math.max(1, now.getDate() - streakDays + 1);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    let examCount = 0;
    if (day <= now.getDate()) {
      if (day >= activeStartDay && streakDays > 0) {
        examCount = 1 + ((seed + day) % 3);
      } else if ((seed + day * 3) % 4 === 0) {
        examCount = 1 + ((seed + day) % 2);
      }
    }
    calendarDays.push({
      date: d.toISOString(),
      dayOfMonth: day,
      examCount,
      isCurrentMonth: true,
    });
  }

  while (calendarDays.length % 7 !== 0) {
    const nextDayNum = calendarDays.length - (startWeekday + daysInMonth) + 1;
    const d = new Date(year, month + 1, nextDayNum);
    calendarDays.push({
      date: d.toISOString(),
      dayOfMonth: d.getDate(),
      examCount: 0,
      isCurrentMonth: false,
    });
  }

  const dateXpMap: Record<string, number> = {};
  const activeDays =
    user.streakCount && user.streakCount > 0
      ? Math.min(7, Math.max(1, user.streakCount))
      : 3;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (i < activeDays) {
      const daySeed = Math.abs(seed + i * 37);
      dateXpMap[key] = Math.min(95, Math.max(20, 25 + (daySeed % 5) * 15));
    } else {
      dateXpMap[key] = 0;
    }
  }

  return {
    totalExams,
    totalCorrect,
    avgScore: baseAccuracy,
    subjects,
    calendarDays,
    dateXpMap,
  };
}

export default function UserProfileView({
  user,
  currentUser,
  rank,
  onBack,
  onSubjectClick,
}: UserProfileViewProps) {
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [currentUserAnalytics, setCurrentUserAnalytics] =
    useState<OverallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isViewingSelf = currentUser?.id === user.id;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const targetAnalytics = await getOverallAnalytics(user.id, 'all');
        if (isMounted) setAnalytics(targetAnalytics);

        if (currentUser && currentUser.id !== user.id) {
          const myAnalytics = await getOverallAnalytics(currentUser.id, 'all');
          if (isMounted) setCurrentUserAnalytics(myAnalytics);
        }
      } catch (err) {
        console.error('Failed to fetch profile analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user.id, currentUser?.id]);

  // Target User Simulation Fallback if real exams are empty (matching Flutter app)
  const simulatedTarget = useMemo(() => {
    return generateSimulatedAnalytics({
      id: user.id,
      xp: user.xp,
      streakCount: user.streakCount,
      examsTaken: user.examsTaken,
      stream: (user as any).stream || 'HSC',
    });
  }, [user.id, user.xp, user.streakCount, user.examsTaken, (user as any).stream]);

  // Current User Simulation Fallback for comparison curve if empty
  const simulatedMy = useMemo(() => {
    if (!currentUser) return null;
    return generateSimulatedAnalytics({
      id: currentUser.id,
      xp: currentUser.xp,
      streakCount: currentUser.streakCount,
      examsTaken: currentUser.examsTaken,
      stream: (currentUser as any).stream || 'HSC',
    });
  }, [currentUser?.id, currentUser?.xp, currentUser?.streakCount, currentUser?.examsTaken, (currentUser as any)?.stream]);

  const targetHasRealData = Boolean(analytics && analytics.totalExams > 0);
  const myHasRealData = Boolean(currentUserAnalytics && currentUserAnalytics.totalExams > 0);

  const targetExams = targetHasRealData
    ? analytics!.totalExams
    : user.examsTaken && user.examsTaken > 0
    ? user.examsTaken
    : simulatedTarget.totalExams;

  const targetAvgScore = targetHasRealData ? analytics!.avgScore : simulatedTarget.avgScore;
  const targetXp = user.xp || 0;
  const targetStreak = user.streakCount || 0;

  const myExams = myHasRealData
    ? currentUserAnalytics!.totalExams
    : currentUser?.examsTaken && currentUser.examsTaken > 0
    ? currentUser.examsTaken
    : simulatedMy?.totalExams || 0;

  const myAvgScore = myHasRealData
    ? currentUserAnalytics!.avgScore
    : simulatedMy?.avgScore || 0;
  const myXp = currentUser?.xp || 0;
  const myStreak = currentUser?.streakCount || 0;

  // Subjects
  const targetSubjects = useMemo(() => {
    if (targetHasRealData && analytics?.subjectData && analytics.subjectData.length > 0) {
      return analytics.subjectData.map((s) => ({
        subject: BanglaNameHelper.formatSubject(s.name),
        examCount: s.total,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        lastActivity: 'সম্প্রতি',
      }));
    }
    return simulatedTarget.subjects;
  }, [targetHasRealData, analytics, simulatedTarget.subjects]);

  // Calendar
  const calendarData = useMemo(() => {
    if (targetHasRealData && analytics?.timelineData && analytics.timelineData.length > 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startWeekday = firstDay.getDay();

      const days: any[] = [];
      for (let i = 0; i < startWeekday; i++) {
        const d = new Date(year, month, 1 - (startWeekday - i));
        days.push({
          date: d.toISOString(),
          dayOfMonth: d.getDate(),
          examCount: 0,
          isCurrentMonth: false,
        });
      }

      const activityDates = new Set(analytics.timelineData.map((t) => t.name));

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const isAct = activityDates.has(d.toLocaleDateString());
        days.push({
          date: d.toISOString(),
          dayOfMonth: day,
          examCount: isAct ? 1 : 0,
          isCurrentMonth: true,
        });
      }

      while (days.length % 7 !== 0) {
        const nextDayNum = days.length - (startWeekday + daysInMonth) + 1;
        const d = new Date(year, month + 1, nextDayNum);
        days.push({
          date: d.toISOString(),
          dayOfMonth: d.getDate(),
          examCount: 0,
          isCurrentMonth: false,
        });
      }

      return days;
    }
    return simulatedTarget.calendarDays;
  }, [targetHasRealData, analytics, simulatedTarget.calendarDays]);

  // 7-day XP comparison series for XpGainLineChartCard
  const { xpChartData, primaryXpTotal, secondaryXpTotal } = useMemo(() => {
    const list: DailyXpPoint[] = [];
    let pTotal = 0;
    let sTotal = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayLabel = getBengaliWeekday(d);

      let myVal = 0;
      let targetVal = 0;

      if (isViewingSelf) {
        // Primary is target user (which is current user)
        targetVal = simulatedTarget.dateXpMap[key] || 0;
        myVal = targetVal;
        pTotal += myVal;
      } else {
        // Primary is You, Secondary is Target
        myVal = simulatedMy?.dateXpMap[key] || 0;
        targetVal = simulatedTarget.dateXpMap[key] || 0;
        pTotal += myVal;
        sTotal += targetVal;
      }

      list.push({
        date: key,
        dayLabel,
        myXP: myVal,
        targetXP: isViewingSelf ? undefined : targetVal,
      });
    }

    return {
      xpChartData: list,
      primaryXpTotal: pTotal,
      secondaryXpTotal: sTotal,
    };
  }, [isViewingSelf, simulatedMy, simulatedTarget]);

  // Comparison Graph Bar Chart Data (Section 4)
  const comparisonGraphData = useMemo(() => {
    const targetFirstName = user.name?.split(' ')[0] || 'প্রতিপক্ষ';
    return [
      {
        name: 'পরীক্ষা',
        তুমি: Math.min(100, Math.max(5, myExams * 5)),
        [targetFirstName]: Math.min(100, Math.max(5, targetExams * 5)),
        rawMy: `${myExams}টি`,
        rawTarget: `${targetExams}টি`,
      },
      {
        name: 'গড় স্কোর',
        তুমি: Math.min(100, Math.max(5, myAvgScore)),
        [targetFirstName]: Math.min(100, Math.max(5, targetAvgScore)),
        rawMy: `${myAvgScore}%`,
        rawTarget: `${targetAvgScore}%`,
      },
      {
        name: 'XP',
        তুমি: Math.min(100, Math.max(5, Math.round(myXp / 100))),
        [targetFirstName]: Math.min(100, Math.max(5, Math.round(targetXp / 100))),
        rawMy: `${myXp} XP`,
        rawTarget: `${targetXp} XP`,
      },
      {
        name: 'স্ট্রিক',
        তুমি: Math.min(100, Math.max(5, myStreak * 10)),
        [targetFirstName]: Math.min(100, Math.max(5, targetStreak * 10)),
        rawMy: `${myStreak} দিন`,
        rawTarget: `${targetStreak} দিন`,
      },
    ];
  }, [myExams, targetExams, myAvgScore, targetAvgScore, myXp, targetXp, myStreak, targetStreak, user.name]);

  const targetShortName = user.name?.split(' ')[0] || 'প্রতিপক্ষ';

  // Render single comparison card matching Flutter _buildSingleComparisonCard exactly
  const renderComparisonCard = (
    title: string,
    myVal: string,
    targetVal: string,
    myNum: number,
    targetNum: number,
    suffix: string,
  ) => {
    const diff = myNum - targetNum;
    let badgeText = 'সমান স্তর';
    let badgeClass = 'bg-neutral-100 dark:bg-[#27272a] text-neutral-400 border border-transparent';

    if (diff > 0) {
      const formattedDiff =
        diff >= 1000 && suffix.includes('XP')
          ? `${(diff / 1000).toFixed(1)}k`
          : `${Math.round(diff)}`;
      badgeText = `+${BanglaNameHelper.toBanglaNumeral(formattedDiff)}${suffix} এগিয়ে`;
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    } else if (diff < 0) {
      const formattedDiff =
        Math.abs(diff) >= 1000 && suffix.includes('XP')
          ? `${(Math.abs(diff) / 1000).toFixed(1)}k`
          : `${Math.round(Math.abs(diff))}`;
      badgeText = `${BanglaNameHelper.toBanglaNumeral(formattedDiff)}${suffix} পিছিয়ে`;
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }

    return (
      <div className="bg-white dark:bg-[#18181b] p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-[#27272a] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="text-xs font-bold text-neutral-500 dark:text-[#a1a1aa] truncate">
            {title}
          </span>
          {!isViewingSelf && (
            <span
              className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md truncate max-w-[100px] shrink-0 ${badgeClass}`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {isViewingSelf ? (
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
            {myVal}
          </span>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                তুমি
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 block truncate">
                {myVal}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 dark:bg-[#27272a] mx-2 shrink-0" />
            <div className="text-right min-w-0">
              <span className="text-[10px] font-bold text-neutral-400 block truncate max-w-[80px]">
                {targetShortName}
              </span>
              <span className="text-sm sm:text-base font-black text-neutral-900 dark:text-white block truncate">
                {targetVal}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5 animate-fade-in pb-16 pt-2 px-2 sm:px-4">
      {/* ── 1. Target User Profile Header Card ───────────────────────── */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" showBorder />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {user.name}
              </h2>
              {isViewingSelf && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md">
                  তুমি
                </span>
              )}
            </div>
            {user.institute && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#a1a1aa] mt-0.5 mb-2">
                {user.institute}
              </p>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-black">
              <Award className="w-3.5 h-3.5" />
              <span>{getLevelRank(user.xp || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 4 Data Comparison Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {renderComparisonCard(
          'মোট পরীক্ষা',
          `${BanglaNameHelper.toBanglaNumeral(myExams)}টি`,
          `${BanglaNameHelper.toBanglaNumeral(targetExams)}টি`,
          myExams,
          targetExams,
          'টি',
        )}
        {renderComparisonCard(
          'গড় স্কোর',
          `${BanglaNameHelper.toBanglaNumeral(myAvgScore)}%`,
          `${BanglaNameHelper.toBanglaNumeral(targetAvgScore)}%`,
          myAvgScore,
          targetAvgScore,
          '%',
        )}
        {renderComparisonCard(
          'মোট XP',
          `${BanglaNameHelper.toBanglaNumeral(myXp)}`,
          `${BanglaNameHelper.toBanglaNumeral(targetXp)}`,
          myXp,
          targetXp,
          ' XP',
        )}
        {renderComparisonCard(
          'স্ট্রিক',
          `${BanglaNameHelper.toBanglaNumeral(myStreak)} দিন`,
          `${BanglaNameHelper.toBanglaNumeral(targetStreak)} দিন`,
          myStreak,
          targetStreak,
          ' দিন',
        )}
      </div>

      {/* ── 3. XP Gain Line Chart (Single on own profile, 2 lines on other user profile) ── */}
      <XpGainLineChartCard
        data={xpChartData}
        primaryTotal={primaryXpTotal}
        secondaryTotal={secondaryXpTotal}
        targetName={user.name}
        isViewingSelf={isViewingSelf}
      />

      {/* ── 4. Comparison Graph (Head to Head Bar Chart) ───────────────────────── */}
      {!isViewingSelf && (
        <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              তুলনামূলক বিশ্লেষণ
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-neutral-600 dark:text-neutral-300">তুমি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                <span className="text-neutral-600 dark:text-neutral-300">{targetShortName}</span>
              </div>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonGraphData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#27272a', strokeWidth: 1 }}
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 shadow-xl text-xs space-y-1 z-50">
                        <p className="font-bold text-gray-300 border-b border-[#27272a] pb-1 mb-1">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            তুমি:
                          </span>
                          <span>{item.rawMy}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-indigo-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {targetShortName}:
                          </span>
                          <span>{item.rawTarget}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="তুমি"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey={targetShortName}
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 5. বিষয়ভিত্তিক দক্ষতা (Subjects Progress) ─────────────────── */}
      <SubjectsProgressSection
        subjectStats={targetSubjects}
        onSubjectClick={onSubjectClick}
      />

      {/* ── 6. স্ট্রিক ক্যালেন্ডার (Streak Calendar) ────────────────────── */}
      <StreakCalendar
        calendarData={calendarData}
        streakCount={targetStreak}
      />

      {/* ── 7. অর্জন ও ব্যাজসমূহ (Badges Showcase) ────────────────────── */}
      <BadgesShowcaseSection
        userId={user.id}
        userStats={{
          xp: targetXp,
          examsTaken: targetExams,
          streakCount: targetStreak,
        }}
      />
    </div>
  );
}
