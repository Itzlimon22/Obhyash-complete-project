'use client';

import React from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import dynamic from 'next/dynamic';
import useProfileData from '@/hooks/use-profile-data';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import Link from 'next/link';
import {
  Gift,
  Trophy,
  Sparkles,
  Camera,
  Layers,
  Calendar,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

const StatsGrid = dynamic(() => import('./dashboard/StatsGrid'));
const SubjectsProgressSection = dynamic(
  () => import('./dashboard/SubjectsProgressSection'),
);
const StreakCalendar = dynamic(() => import('./dashboard/StreakCalendar'));
const BadgesShowcaseSection = dynamic(
  () => import('./dashboard/BadgesShowcaseSection'),
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

  const user = propUser || hookData.user;
  const history = propHistory ?? hookData.examHistory;
  const subjectStats = hookData.subjectStats;
  const calendarData = hookData.calendarData;
  const isLoading = !propHistory && hookData.isLoading;

  // 5-Tier Level Calculation matching Flutter
  const getLevelInfo = (xp: number) => {
    if (xp < 500) {
      const p = Math.min(1.0, Math.max(0.0, xp / 500.0));
      return { currentRank: 'রুকি', nextRank: 'স্কাউট', progress: p, percent: Math.round(p * 100), xpText: `${xp} / ৫০০ XP` };
    } else if (xp < 2000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 500) / 1500.0));
      return { currentRank: 'স্কাউট', nextRank: 'ওয়ারিয়র', progress: p, percent: Math.round(p * 100), xpText: `${xp} / ২,০০০ XP` };
    } else if (xp < 5000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 2000) / 3000.0));
      return { currentRank: 'ওয়ারিয়র', nextRank: 'টাইটান', progress: p, percent: Math.round(p * 100), xpText: `${xp} / ৫,০০০ XP` };
    } else if (xp < 10000) {
      const p = Math.min(1.0, Math.max(0.0, (xp - 5000) / 5000.0));
      return { currentRank: 'টাইটান', nextRank: 'লিজেন্ড', progress: p, percent: Math.round(p * 100), xpText: `${xp} / ১০,০০০ XP` };
    } else {
      return { currentRank: 'লিজেন্ড', nextRank: 'সর্বোচ্চ স্তর', progress: 1.0, percent: 100, xpText: `${xp} XP (সর্বোচ্চ স্তর)` };
    }
  };

  // Data Processing
  const evaluatedExams = history.filter(
    (h) => !h.status || h.status === 'evaluated',
  );
  const avgScore =
    evaluatedExams.length > 0
      ? Math.round(
          evaluatedExams.reduce(
            (acc, curr) =>
              acc +
              (curr.totalMarks > 0 ? (curr.score / curr.totalMarks) * 100 : 0),
            0,
          ) / evaluatedExams.length,
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

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-12 pt-2">
      {/* 1. User Profile Header Card */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar with Camera Badge */}
          <div className="relative group cursor-pointer" onClick={onEditProfile}>
            <div className="rounded-full p-0.5 border-2 border-neutral-200 dark:border-[#3f3f46]">
              <UserAvatar
                user={user}
                size="lg"
              />
            </div>
            <button
              onClick={onEditProfile}
              className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 text-white rounded-full border-2 border-white dark:border-[#18181b] shadow-md hover:bg-emerald-700 transition-transform active:scale-95"
              title="এডিট করো"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
              {user.name}
            </h2>
            {user.email && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                {user.email}
              </p>
            )}

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {user.institute && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-[#27272a] text-neutral-700 dark:text-[#e4e4e7] rounded-lg border border-neutral-200/60 dark:border-[#3f3f46]">
                  {user.institute}
                </span>
              )}
              {user.stream && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-[#27272a] text-neutral-700 dark:text-[#e4e4e7] rounded-lg border border-neutral-200/60 dark:border-[#3f3f46]">
                  {user.stream}
                </span>
              )}
              {user.batch && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-[#27272a] text-neutral-700 dark:text-[#e4e4e7] rounded-lg border border-neutral-200/60 dark:border-[#3f3f46]">
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
            className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-neutral-800 dark:text-white text-sm font-bold rounded-xl transition-all active:scale-95 border border-neutral-200/60 dark:border-[#3f3f46]"
          >
            এডিট করো
          </button>
          <Link
            href="/referral"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all active:scale-95"
          >
            <Gift className="w-4 h-4" />
            রেফার করো
          </Link>
        </div>
      </div>

      {/* 2. Level Progress Bar (Matching Flutter) */}
      <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <Sparkles className="absolute -top-6 -right-6 w-36 h-36 text-white/5 pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 text-sm font-black mb-2">
              <Trophy className="w-4 h-4" />
              <span>{levelInfo.currentRank}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white/80">
              পরবর্তী লেভেল রিওয়ার্ড
            </h3>
          </div>

          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-white block">
              {levelInfo.percent}%
            </span>
            <span className="text-xs font-bold text-yellow-300 bg-black/30 px-2.5 py-0.5 rounded-md border border-white/10 mt-1 inline-block">
              {levelInfo.xpText}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 sm:h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-yellow-300 transition-all duration-700 rounded-full shadow-lg shadow-amber-500/20"
            style={{ width: `${levelInfo.progress * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-white/60 mt-3">
          <span>{levelInfo.currentRank}</span>
          <span>{levelInfo.nextRank}</span>
        </div>
      </div>

      {/* 3. Key Stats Grid */}
      <StatsGrid
        examsTaken={evaluatedExams.length}
        avgScore={avgScore}
        xp={user.xp || 0}
        streak={user.streakCount || 0}
      />

      {/* 4. Badges Showcase Section */}
      <BadgesShowcaseSection userId={user.id} />

      {/* 5. Main Content Grid (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          <SubjectsProgressSection
            subjectStats={subjectStats}
            onSubjectClick={onSubjectClick}
          />

          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                সর্বশেষ কার্যক্রম
              </h3>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center">
                কোনো সাম্প্রতিক পরীক্ষা পাওয়া যায়নি।
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.slice(0, 5).map((exam, idx) => {
                  const scorePct =
                    exam.totalMarks > 0
                      ? Math.round((exam.score / exam.totalMarks) * 100)
                      : 0;

                  return (
                    <div
                      key={exam.id || idx}
                      className="p-3 sm:p-3.5 bg-neutral-50 dark:bg-[#27272a] rounded-xl border border-neutral-200/60 dark:border-[#3f3f46]/60 flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-[#52525b] transition-all"
                    >
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          {getSubjectDisplayName(
                            exam.subjectLabel || exam.subject,
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(exam.date).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {exam.totalQuestions} প্রশ্ন
                          </span>
                        </div>
                      </div>

                      <div
                        className={`text-sm sm:text-base font-black px-2.5 py-1 rounded-lg border ${
                          scorePct >= 80
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : scorePct >= 50
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}
                      >
                        {scorePct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <StreakCalendar
            calendarData={calendarData}
            streakCount={user.streakCount || 0}
          />
        </div>
      </div>
    </div>
  );
}
