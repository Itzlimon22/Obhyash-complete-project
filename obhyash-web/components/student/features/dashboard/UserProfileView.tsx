'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { UserProfile } from '@/lib/types';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import {
  getOverallAnalytics,
  OverallAnalytics,
} from '@/services/stats-service';
import dynamic from 'next/dynamic';
import { ArrowLeft, Award } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const targetAnalytics = await getOverallAnalytics(user.id, 'all');
        setAnalytics(targetAnalytics);

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

  const isViewingSelf = currentUser?.id === user.id;

  const targetSubjects = useMemo(() => {
    if (analytics?.subjectData && analytics.subjectData.length > 0) {
      return analytics.subjectData.map((s) => ({
        subject: s.name,
        examCount: s.total,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        lastActivity: 'সম্প্রতি',
      }));
    }
    return [];
  }, [analytics]);

  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

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

    const activityDates = new Set(
      analytics?.timelineData?.map((t) => t.name) || [],
    );

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
  }, [analytics]);

  const myExams = currentUserAnalytics?.totalExams || 0;
  const targetExams = analytics?.totalExams || user.examsTaken || 0;

  const myAvgScore = currentUserAnalytics?.avgScore || 0;
  const targetAvgScore = analytics?.avgScore || 0;

  const myXp = currentUser?.xp || 0;
  const targetXp = user.xp || 0;

  const myStreak = currentUser?.streakCount || 0;
  const targetStreak = user.streakCount || 0;

  const getRankName = (xp: number) => {
    if (xp < 500) return 'রুকি';
    if (xp < 2000) return 'স্কাউট';
    if (xp < 5000) return 'ওয়ারিয়র';
    if (xp < 10000) return 'টাইটান';
    return 'লিজেন্ড';
  };

  const comparisonGraphData = useMemo(() => {
    return [
      {
        name: 'মোট পরীক্ষা',
        তুমি: Math.min(100, myExams * 5),
        [user.name?.split(' ')[0] || 'প্রতিপক্ষ']: Math.min(100, targetExams * 5),
        rawMy: `${myExams}টি`,
        rawTarget: `${targetExams}টি`,
      },
      {
        name: 'গড় স্কোর',
        তুমি: myAvgScore,
        [user.name?.split(' ')[0] || 'প্রতিপক্ষ']: targetAvgScore,
        rawMy: `${myAvgScore}%`,
        rawTarget: `${targetAvgScore}%`,
      },
      {
        name: 'XP',
        তুমি: Math.min(100, Math.round(myXp / 100)),
        [user.name?.split(' ')[0] || 'প্রতিপক্ষ']: Math.min(100, Math.round(targetXp / 100)),
        rawMy: `${myXp} XP`,
        rawTarget: `${targetXp} XP`,
      },
      {
        name: 'স্ট্রিক',
        তুমি: Math.min(100, myStreak * 10),
        [user.name?.split(' ')[0] || 'প্রতিপক্ষ']: Math.min(100, targetStreak * 10),
        rawMy: `${myStreak} দিন`,
        rawTarget: `${targetStreak} দিন`,
      },
    ];
  }, [myExams, targetExams, myAvgScore, targetAvgScore, myXp, targetXp, myStreak, targetStreak, user.name]);

  const targetShortName = user.name?.split(' ')[0] || 'প্রতিপক্ষ';

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
    let badgeClass = 'bg-neutral-100 dark:bg-[#27272a] text-neutral-400';

    if (diff > 0) {
      badgeText = `+${diff}${suffix} এগিয়ে`;
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    } else if (diff < 0) {
      badgeText = `${Math.abs(diff)}${suffix} পিছিয়ে`;
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }

    return (
      <div className="bg-white dark:bg-[#18181b] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-[#27272a] shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            {title}
          </span>
          {!isViewingSelf && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
              {badgeText}
            </span>
          )}
        </div>

        {isViewingSelf ? (
          <span className="text-2xl font-black text-neutral-900 dark:text-white">
            {myVal}
          </span>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                তুমি
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {myVal}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 dark:bg-[#27272a]" />
            <div className="text-right">
              <span className="text-[11px] font-bold text-neutral-400 block truncate max-w-[80px]">
                {targetShortName}
              </span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                {targetVal}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto space-y-5 animate-fade-in pb-12 pt-2 px-1 sm:px-2">
      {/* 1. Target User Header Profile Card */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" showBorder />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {user.name}
              </h2>
              {isViewingSelf && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                  তুমি
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              {user.institute || 'ইনস্টিটিউট সেট করা নেই'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{getRankName(user.xp || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Data Comparison Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {renderComparisonCard('মোট পরীক্ষা', `${myExams}টি`, `${targetExams}টি`, myExams, targetExams, 'টি')}
        {renderComparisonCard('গড় স্কোর', `${myAvgScore}%`, `${targetAvgScore}%`, myAvgScore, targetAvgScore, '%')}
        {renderComparisonCard('মোট XP', `${myXp}`, `${targetXp}`, myXp, targetXp, ' XP')}
        {renderComparisonCard('স্ট্রিক', `${myStreak} দিন`, `${targetStreak} দিন`, myStreak, targetStreak, ' দিন')}
      </div>

      {/* 3. Comparison Graph */}
      {!isViewingSelf && (
        <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              তুলনামূলক বিশ্লেষণ
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-600 dark:text-neutral-300">তুমি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-neutral-600 dark:text-neutral-300">{targetShortName}</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888888' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#888888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                  }}
                />
                <Bar dataKey="তুমি" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey={targetShortName} fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* 5. বিষয়ভিত্তিক দক্ষতা */}
      <SubjectsProgressSection subjectStats={targetSubjects} onSubjectClick={onSubjectClick} />

      {/* 6. স্ট্রিক ক্যালেন্ডার */}
      <StreakCalendar calendarData={calendarData} streakCount={targetStreak} />

      {/* 7. অর্জন ও ব্যাজসমূহ */}
      <BadgesShowcaseSection userId={user.id} />
    </div>
  );
}
