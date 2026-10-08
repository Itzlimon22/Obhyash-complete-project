'use client';

import React, { useState } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import dynamic from 'next/dynamic';
import useProfileData from '@/hooks/use-profile-data';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import Link from 'next/link';
import {
  Gift,
  Camera,
} from 'lucide-react';
import { isUserPro } from '@/lib/subscription-utils';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import AvatarPickerModal from './dashboard/AvatarPickerModal';
import type { DailyXpPoint } from './dashboard/XpGainLineChartCard';

const StatsGrid = dynamic(() => import('./dashboard/StatsGrid'));
const XpGainLineChartCard = dynamic(
  () => import('./dashboard/XpGainLineChartCard')
);
const SubjectsProgressSection = dynamic(
  () => import('./dashboard/SubjectsProgressSection')
);
const StreakCalendar = dynamic(() => import('./dashboard/StreakCalendar'));
const BadgesShowcaseSection = dynamic(
  () => import('./dashboard/BadgesShowcaseSection')
);
const RecentActivitySection = dynamic(
  () => import('./dashboard/RecentActivitySection')
);

interface MyProfileViewProps {
  user: UserProfile;
  history?: ExamResult[];
  onEditProfile: () => void;
  onSubjectClick?: (subject: string) => void;
  onViewNotifications?: () => void;
}

export default function MyProfileView({
  user: propUser,
  history: propHistory,
  onEditProfile,
  onSubjectClick,
}: MyProfileViewProps) {
  const hookData = useProfileData();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const user = propUser || hookData.user;
  const history = propHistory ?? hookData.examHistory;
  const subjectStats = hookData.subjectStats;
  const calendarData = hookData.calendarData;
  const isLoading = !propHistory && hookData.isLoading;

  function getBengaliWeekday(d: Date): string {
    const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    return days[d.getDay()];
  }

  const evaluatedExams = history.filter(
    (h) => !h.status || h.status === 'evaluated'
  );
  const avgScore =
    evaluatedExams.length > 0
      ? Math.round(
          evaluatedExams.reduce((acc, curr) => {
            const maxMarks = curr.totalMarks || curr.totalQuestions || 1;
            const scoreVal = curr.score ?? (curr as any).correctCount ?? 0;
            return acc + (maxMarks > 0 ? (scoreVal / maxMarks) * 100 : 0);
          }, 0) / evaluatedExams.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 animate-pulse pb-12 pt-2">
        <div className="h-28 bg-neutral-200 dark:bg-[#18181b] rounded-3xl" />
        <div className="h-36 bg-neutral-200 dark:bg-[#18181b] rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-neutral-200 dark:bg-[#18181b] rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isPro = isUserPro(user);

  // 7-day XP data for XpGainLineChartCard
  const { xpChartData, primaryXpTotal } = React.useMemo(() => {
    const dateXpMap: Record<string, number> = {};
    if (history && history.length > 0) {
      for (const exam of history) {
        const rawDate = (exam as any).createdAt || (exam as any).date || (exam as any).timestamp;
        const d = rawDate ? new Date(rawDate) : new Date();
        const key = d.toISOString().split('T')[0];
        const earned = (exam as any).xpEarned ?? ((exam.score ?? (exam as any).correctCount ?? 0) * 10);
        dateXpMap[key] = (dateXpMap[key] || 0) + earned;
      }
    }

    if (Object.keys(dateXpMap).length === 0 && (user?.xp || 0) > 0) {
      const streak = user.streakCount || 1;
      const avg = Math.min(100, Math.max(10, Math.round((user.xp || 0) / (streak > 0 ? streak : 1))));
      const activeDays = Math.min(7, Math.max(1, streak));
      for (let i = 0; i < activeDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dateXpMap[key] = avg;
      }
    }

    const list: DailyXpPoint[] = [];
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const xpVal = dateXpMap[key] || 0;
      total += xpVal;
      list.push({
        date: key,
        dayLabel: getBengaliWeekday(d),
        myXP: xpVal,
      });
    }

    return {
      xpChartData: list,
      primaryXpTotal: total,
    };
  }, [history, user?.xp, user?.streakCount]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-24 pt-2 font-['HindSiliguri']">
      {/* ── 1. User Profile Header Card (1:1 with Flutter _UserProfileCard) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[22px] border border-[#E4E4E7] dark:border-[#27272A] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar with Camera Edit Badge */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowAvatarPicker(true)}
          >
            <div className="rounded-full p-0.5 border-2 border-neutral-200 dark:border-[#3F3F46] shadow-sm transition-transform group-hover:scale-105">
              <UserAvatar user={user} size="lg" className="w-16 h-16" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAvatarPicker(true);
              }}
              className="absolute -bottom-1 -right-1 p-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-full border-2 border-white dark:border-[#18181B] shadow-md transition-transform active:scale-95"
              title="অ্যাভাটার পরিবর্তন করো"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white leading-tight">
                {user.name}
              </h2>
              {isPro && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 text-[10px] font-black rounded-md shadow-sm">
                  PRO
                </span>
              )}
            </div>

            {user.email && (
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A1A1AA] mt-0.5 mb-2">
                {user.email}
              </p>
            )}

            {/* Info Chips (Matching Flutter _InfoChip) */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {user.institute && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#27272A] text-[#3F3F46] dark:text-[#E4E4E7] rounded-[8px] border border-[#E4E4E7] dark:border-[#3F3F46]">
                  {user.institute}
                </span>
              )}
              {user.stream && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#27272A] text-[#3F3F46] dark:text-[#E4E4E7] rounded-[8px] border border-[#E4E4E7] dark:border-[#3F3F46]">
                  {user.stream}
                </span>
              )}
              {user.batch && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#27272A] text-[#3F3F46] dark:text-[#E4E4E7] rounded-[8px] border border-[#E4E4E7] dark:border-[#3F3F46]">
                  ব্যাচ: {user.batch}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0">
          <button
            onClick={onEditProfile}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272A] dark:hover:bg-[#3F3F46] text-neutral-800 dark:text-white text-xs font-bold rounded-xl transition-all active:scale-95 border border-neutral-200/60 dark:border-[#3F3F46] cursor-pointer"
          >
            প্রোফাইল এডিট
          </button>
          <Link
            href="/referral"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95"
          >
            <Gift className="w-4 h-4" />
            <span>রেফার করো</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Key Stats Grid ── */}
      <StatsGrid
        examsTaken={evaluatedExams.length}
        avgScore={avgScore}
        xp={user.xp || 0}
        streak={user.streakCount || 0}
      />

      {/* ── 3. XP Gain Line Chart (Above Badges Showcase) ── */}
      <XpGainLineChartCard
        data={xpChartData}
        primaryTotal={primaryXpTotal}
        isViewingSelf={true}
      />

      {/* ── 4. Streak Calendar (Directly below XP Graph Card) ── */}
      <StreakCalendar
        calendarData={calendarData}
        streakCount={user.streakCount || 0}
      />

      {/* ── 5. Badges Showcase Section (অর্জন ও ব্যাজ) ── */}
      <BadgesShowcaseSection userId={user.id} />

      {/* ── 6. Subjects Progress & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SubjectsProgressSection
          subjectStats={subjectStats}
          onSubjectClick={onSubjectClick}
        />
        <RecentActivitySection history={history} />
      </div>

      {/* ── Avatar Picker Modal ── */}
      {showAvatarPicker && (
        <AvatarPickerModal
          user={user}
          onClose={() => setShowAvatarPicker(false)}
          onAvatarUpdated={(newUrl) => {
            if (user) {
              user.avatarUrl = newUrl;
            }
          }}
        />
      )}
    </div>
  );
}
