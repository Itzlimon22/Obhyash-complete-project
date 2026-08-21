'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Rocket,
  Target,
  Zap,
  Flame,
  Timer,
  Moon,
  Brain,
  Crown,
  Swords,
  Lock,
  CheckCircle,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export interface BadgeItem {
  id: string;
  name: string;
  titleBangla: string;
  description: string;
  icon: any;
  gradientStart: string;
  gradientEnd: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export const ALL_BADGES: BadgeItem[] = [
  {
    id: 'first_step',
    name: 'First Step',
    titleBangla: 'প্রথম পদক্ষেপ',
    description: 'প্রথম পরীক্ষা সফলভাবে সম্পন্ন করেছো',
    icon: Rocket,
    gradientStart: '#0284C7',
    gradientEnd: '#0EA5E9',
    isUnlocked: false,
  },
  {
    id: 'precision_master',
    name: 'Perfect Score',
    titleBangla: 'পারফেক্ট স্কোর',
    description: 'যেকোনো পরীক্ষায় শতভাগ (১০০%) নির্ভুল স্কোর অর্জন',
    icon: Target,
    gradientStart: '#059669',
    gradientEnd: '#10B981',
    isUnlocked: false,
  },
  {
    id: 'streak_3',
    name: 'Habit Builder',
    titleBangla: '৩ দিনের স্ট্রিক',
    description: 'টানা ৩ দিন নিয়মিত পড়ার অভ্যাস বজায় রেখেছো',
    icon: Zap,
    gradientStart: '#D97706',
    gradientEnd: '#F59E0B',
    isUnlocked: false,
  },
  {
    id: 'streak_7',
    name: 'Streak Master',
    titleBangla: 'স্ট্রিক মাস্টার',
    description: 'টানা ৭ দিনের ধারাবাহিক পড়ার স্ট্রিক ধরে রেখেছো',
    icon: Flame,
    gradientStart: '#EA580C',
    gradientEnd: '#F97316',
    isUnlocked: false,
  },
  {
    id: 'speed_demon',
    name: 'Speed Star',
    titleBangla: 'স্পিড স্টার',
    description: '৬০ সেকেন্ডের মধ্যে ৮০%+ স্কোরে পরীক্ষা সম্পন্ন',
    icon: Timer,
    gradientStart: '#0891B2',
    gradientEnd: '#06B6D4',
    isUnlocked: false,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    titleBangla: 'নাইট আউল',
    description: 'রাত ১১টার পর গভীর মনোযোগে পরীক্ষা সম্পন্ন',
    icon: Moon,
    gradientStart: '#7C3AED',
    gradientEnd: '#8B5CF6',
    isUnlocked: false,
  },
  {
    id: 'knowledge_sage',
    name: 'Century Scholar',
    titleBangla: 'সেঞ্চুরি স্কলার',
    description: '১০০টির বেশি প্রশ্নের সঠিক উত্তর প্রদান করেছো',
    icon: Brain,
    gradientStart: '#9333EA',
    gradientEnd: '#A855F7',
    isUnlocked: false,
  },
  {
    id: 'apex_legend',
    name: 'Legend Trophy',
    titleBangla: 'লিজেন্ড ট্রফি',
    description: '৫,০০০+ মোট XP অর্জন করে শীর্ষ স্তরে পৌঁছেছো',
    icon: Crown,
    gradientStart: '#E11D48',
    gradientEnd: '#F43F5E',
    isUnlocked: false,
  },
  {
    id: 'live_champion',
    name: 'Live Arena Champion',
    titleBangla: 'লাইভ চ্যাম্পিয়ন',
    description: 'অফিসিয়াল লাইভ পরীক্ষায় অংশ নিয়ে শীর্ষস্থান ও বিজয় অর্জন',
    icon: Swords,
    gradientStart: '#EAB308',
    gradientEnd: '#EA580C',
    isUnlocked: false,
  },
];

interface BadgesShowcaseSectionProps {
  userId?: string;
}

export default function BadgesShowcaseSection({ userId }: BadgesShowcaseSectionProps) {
  const [badges, setBadges] = useState<BadgeItem[]>(ALL_BADGES);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadBadges() {
      if (!userId) return;
      try {
        const { data } = await supabase
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', userId);

        if (data) {
          const unlockedMap = new Map<string, string>();
          data.forEach((r: any) => {
            unlockedMap.set(r.badge_id, r.unlocked_at);
          });

          setBadges(
            ALL_BADGES.map((b) => ({
              ...b,
              isUnlocked: unlockedMap.has(b.id),
              unlockedAt: unlockedMap.get(b.id),
            }))
          );
        }
      } catch (_) {}
    }
    loadBadges();
  }, [userId, supabase]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            অর্জন ও ব্যাজসমূহ
          </h3>
        </div>
        <span className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-[#27272a] px-3 py-1 rounded-full border border-neutral-200/60 dark:border-[#3f3f46]">
          {unlockedCount}/{badges.length} আনলকড
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const IconComponent = badge.icon;
          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 active:scale-95 text-center group cursor-pointer ${
                badge.isUnlocked
                  ? 'bg-neutral-50 dark:bg-[#131316] border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-md'
                  : 'bg-neutral-50/50 dark:bg-[#131316]/50 border-neutral-200 dark:border-[#27272a] opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 ${
                  badge.isUnlocked
                    ? 'shadow-lg shadow-emerald-500/20 text-white'
                    : 'bg-neutral-200 dark:bg-[#27272a] text-neutral-400 dark:text-neutral-500'
                }`}
                style={{
                  background: badge.isUnlocked
                    ? `linear-gradient(135deg, ${badge.gradientStart}, ${badge.gradientEnd})`
                    : undefined,
                }}
              >
                {badge.isUnlocked ? (
                  <IconComponent className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-white truncate w-full mb-0.5">
                {badge.titleBangla}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  badge.isUnlocked
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {badge.isUnlocked ? 'অর্জন সম্পন্ন' : 'লকড'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181b] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-6 shadow-2xl relative animate-slide-up max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-full bg-neutral-100 dark:bg-[#27272a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div
                className={`w-18 h-18 rounded-full flex items-center justify-center mb-4 p-4 shadow-xl ${
                  selectedBadge.isUnlocked
                    ? 'text-white'
                    : 'bg-neutral-200 dark:bg-[#27272a] text-neutral-400'
                }`}
                style={{
                  background: selectedBadge.isUnlocked
                    ? `linear-gradient(135deg, ${selectedBadge.gradientStart}, ${selectedBadge.gradientEnd})`
                    : undefined,
                }}
              >
                {selectedBadge.isUnlocked ? (
                  <selectedBadge.icon className="w-9 h-9" />
                ) : (
                  <Lock className="w-9 h-9" />
                )}
              </div>

              <h4 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-0.5">
                {selectedBadge.titleBangla}
              </h4>
              <p className="text-xs font-semibold text-neutral-400 tracking-wider mb-3">
                {selectedBadge.name}
              </p>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${
                  selectedBadge.isUnlocked
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-neutral-100 dark:bg-[#27272a] text-neutral-500 border-neutral-200 dark:border-[#3f3f46]'
                }`}
              >
                {selectedBadge.isUnlocked ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>আনলকড সম্পন্ন</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>লকড অর্জন</span>
                  </>
                )}
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                {selectedBadge.description}
              </p>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-neutral-900 dark:text-white font-bold rounded-xl transition-all active:scale-95"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
