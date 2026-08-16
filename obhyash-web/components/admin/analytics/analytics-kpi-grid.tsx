'use client';

import React from 'react';
import {
  Users,
  Activity,
  Target,
  Clock,
  Crown,
  FileQuestion,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export interface AnalyticsKPIs {
  totalExams: number;
  rangeExamsCount: number;
  averageScore: number;
  avgTimePerExam: number;
  totalQuestions: number;
  totalUsers: number;
  proUsers: number;
  dau: number;
  mau: number;
  stickinessRatio: number;
  completionRate: number;
}

interface AnalyticsKPIGridProps {
  kpis: AnalyticsKPIs;
  timeRange: string;
}

export function AnalyticsKPIGrid({ kpis, timeRange }: AnalyticsKPIGridProps) {
  const formatTime = (seconds: number) => {
    if (!seconds) return '০ মিনিট';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const proPercent =
    kpis.totalUsers > 0
      ? Math.round((kpis.proUsers / kpis.totalUsers) * 100)
      : 0;

  const cards = [
    {
      title: 'DAU / MAU (প্ল্যাটফর্ম স্টিকিনেস)',
      value: `${kpis.dau} / ${kpis.mau}`,
      subtext: `স্টিকিনেস রেশিও: ${kpis.stickinessRatio}%`,
      badge:
        kpis.stickinessRatio >= 20 ? '🔥 High Retention' : 'Regular Activity',
      icon: Flame,
      color: 'amber',
    },
    {
      title: 'গড় নির্ভুলতা (Global Accuracy)',
      value: `${kpis.averageScore}%`,
      subtext: `গড় সময়/পরীক্ষা: ${formatTime(kpis.avgTimePerExam)}`,
      badge: kpis.averageScore >= 70 ? 'Good Accuracy' : 'Moderate',
      icon: Target,
      color: 'emerald',
    },
    {
      title: 'সম্পন্ন পরীক্ষা (Exam Submissions)',
      value: kpis.rangeExamsCount.toLocaleString(),
      subtext: `সর্বমোট সম্পন্ন: ${kpis.totalExams.toLocaleString()}`,
      badge: `${timeRange} ভলিউম`,
      icon: Activity,
      color: 'blue',
    },
    {
      title: 'পেইড ও প্রো সাবস্ক্রাইবার',
      value: kpis.proUsers.toLocaleString(),
      subtext: `কনভার্সন রেট: ${proPercent}% (মোট: ${kpis.totalUsers})`,
      badge: 'Paid Members',
      icon: Crown,
      color: 'purple',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-2 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800/80 text-neutral-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <Icon size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                {card.value}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-400 dark:text-zinc-500 truncate pr-1">
                  {card.subtext}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 shrink-0">
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
