'use client';

import React, { useState } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import dynamic from 'next/dynamic';
import useProfileData from '@/hooks/use-profile-data';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import Link from 'next/link';
import {
  Gift,
  Trophy,
  Camera,
  Layers,
  Calendar,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import AvatarPickerModal from './dashboard/AvatarPickerModal';

const StatsGrid = dynamic(() => import('./dashboard/StatsGrid'));
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

  // 5-Tier Level Calculation matching Flutter my_profile_view.dart
  const getLevelInfo = (xp: number) => {
    if (xp < 500) {
      const p = Math.min(1.0, Math.max(0.0, xp / 500.0));
      return {
        currentRank: 'রুকি',
        nextRank: 'স্কাউট',
        progress: p,
        percent: Math.round(p * 100),
        xpText: `${BanglaNameHelper.toBanglaNumeral(xp)} / ৫০০ XP`,
      };
    } else if (xp < 2000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 500) / 1500.0));
      return {
        currentRank: 'স্কাউট',
        nextRank: 'ওয়ারিয়র',
        progress: p,
        percent: Math.round(p * 100),
        xpText: `${BanglaNameHelper.toBanglaNumeral(xp)} / ২,০০০ XP`,
      };
    } else if (xp < 5000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 2000) / 3000.0));
      return {
        currentRank: 'ওয়ারিয়র',
        nextRank: 'টাইটান',
        progress: p,
        percent: Math.round(p * 100),
        xpText: `${BanglaNameHelper.toBanglaNumeral(xp)} / ৫,০০০ XP`,
      };
    } else if (xp < 10000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 5000) / 5000.0));
      return {
        currentRank: 'টাইটান',
        nextRank: 'লিজেন্ড',
        progress: p,
        percent: Math.round(p * 100),
        xpText: `${BanglaNameHelper.toBanglaNumeral(xp)} / ১০,০০০ XP`,
      };
    } else {
      return {
        currentRank: 'লিজেন্ড',
        nextRank: 'সর্বোচ্চ স্তর',
        progress: 1.0,
        percent: 100,
        xpText: `${BanglaNameHelper.toBanglaNumeral(xp)} XP (সর্বোচ্চ স্তর)`,
      };
    }
  };

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

  const levelInfo = getLevelInfo(user.xp || 0);
  const isPro =
    (user as any).is_pro ||
    (user as any).is_subscribed ||
    (user as any).plan === 'pro';

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

      {/* ── 2. Level Progress Bar (Premium Design matching Flutter) ── */}
      <div className="bg-gradient-to-br from-[#312E81] to-[#4338CA] dark:from-[#1E1B4B] dark:to-[#312E81] text-white rounded-[24px] p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <Trophy className="absolute -top-6 -right-6 w-36 h-36 text-white/5 pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F59E0B]/20 border border-[#F59E0B]/50 rounded-[12px] text-[#FBBF24] text-sm font-black mb-2">
              <Trophy className="w-4 h-4" />
              <span>{levelInfo.currentRank}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white/80 leading-snug">
              পরবর্তী লেভেল রিওয়ার্ড
            </h3>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-white block tabular-nums leading-none">
              {BanglaNameHelper.toBanglaNumeral(levelInfo.percent)}%
            </span>
            <span className="text-xs font-bold text-[#FDE047] bg-black/25 px-2.5 py-0.5 rounded-[6px] border border-white/10 mt-1 inline-block">
              {levelInfo.xpText}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 bg-black/25 rounded-full overflow-hidden border border-white/10 relative my-1">
          <div
            className="h-full bg-gradient-to-r from-[#60A5FA] to-[#FDE047] transition-all duration-700 rounded-full shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
            style={{ width: `${levelInfo.progress * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-white/60 mt-3">
          <span>{levelInfo.currentRank}</span>
          <span>{levelInfo.nextRank}</span>
        </div>
      </div>

      {/* ── 3. Key Stats Grid ── */}
      <StatsGrid
        examsTaken={evaluatedExams.length}
        avgScore={avgScore}
        xp={user.xp || 0}
        streak={user.streakCount || 0}
      />

      {/* ── 4. Badges Showcase Section ── */}
      <BadgesShowcaseSection userId={user.id} />

      {/* ── 5. Main Content Layout (Left Column & Right Column mimic from Flutter) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Subjects Progress + Recent Activity */}
        <div className="space-y-5">
          <SubjectsProgressSection
            subjectStats={subjectStats}
            onSubjectClick={onSubjectClick}
          />
          <RecentActivitySection history={history} />
        </div>

        {/* Right Column: Streak Calendar */}
        <div>
          <StreakCalendar
            calendarData={calendarData}
            streakCount={user.streakCount || 0}
          />
        </div>
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
