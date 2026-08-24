'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Layers, Award, Sparkles, CheckCircle2, Flame, Clock } from 'lucide-react';
import { getSpacedRepetitionStats, SpacedRepetitionStats } from '@/services/spaced-repetition-service';

interface LeitnerMemoryBoxCardProps {
  userId?: string;
}

export default function LeitnerMemoryBoxCard({ userId }: LeitnerMemoryBoxCardProps) {
  const [stats, setStats] = useState<SpacedRepetitionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getSpacedRepetitionStats(userId).then((data) => {
      if (isMounted) {
        setStats(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const total = stats ? stats.total_tracked : 0;
  const mastered = stats ? stats.mastered_count : 0;
  const masteryPercentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const boxes = [
    {
      level: 1,
      name: 'Box 1: দৈনিক রিভিশন',
      desc: 'নতুন ও ভুল হওয়া প্রশ্ন',
      interval: '১ দিন পর',
      count: stats?.box1_count || 0,
      color: 'from-rose-500 to-orange-500',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20',
      text: 'text-rose-400',
    },
    {
      level: 2,
      name: 'Box 2: প্রাথমিক স্মৃতি',
      desc: '১ বার সফল রিভিশন',
      interval: '৩ দিন পর',
      count: stats?.box2_count || 0,
      color: 'from-amber-500 to-yellow-500',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      text: 'text-amber-400',
    },
    {
      level: 3,
      name: 'Box 3: মধ্যবর্তী স্মৃতি',
      desc: '২ বার সফল রিভিশন',
      interval: '৭ দিন পর',
      count: stats?.box3_count || 0,
      color: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/20',
      text: 'text-cyan-400',
    },
    {
      level: 4,
      name: 'Box 4: দীর্ঘস্থায়ী স্মৃতি',
      desc: '৩ বার সফল রিভিশন',
      interval: '১৪ দিন পর',
      count: stats?.box4_count || 0,
      color: 'from-purple-500 to-indigo-500',
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      text: 'text-purple-400',
    },
    {
      level: 5,
      name: 'Box 5: Mastered 🏆',
      desc: 'স্থায়ী স্মৃতিতে সম্পূর্ণ আয়ত্তে',
      interval: '৩০ দিন পর',
      count: stats?.box5_count || 0,
      color: 'from-emerald-500 to-teal-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-400',
    },
  ];

  return (
    <div className="rounded-2xl p-5 md:p-6 bg-slate-900 border border-slate-800 shadow-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Leitner 5-Box মেমোরি আয়ত্ত</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                SM-2 Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              স্মৃতিবিজ্ঞান অনুযায়ী আপনার পড়া প্রশ্নগুলোর স্থায়ী রূপান্তরের স্তর
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Mastery Score</span>
            <span className="text-lg font-black text-emerald-400">{masteryPercentage}%</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Overview Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>মোট ট্র্যাক করা প্রশ্ন: {total}টি</span>
          <span className="text-emerald-400 font-semibold">{mastered}টি Mastered 🏆</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          {boxes.map((b) => {
            const widthPct = total > 0 ? (b.count / total) * 100 : 20;
            return (
              <div
                key={b.level}
                style={{ width: `${widthPct}%` }}
                className={`h-full bg-gradient-to-r ${b.color} transition-all duration-500`}
                title={`${b.name}: ${b.count} questions`}
              />
            );
          })}
        </div>
      </div>

      {/* 5 Box Level Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {boxes.map((b) => (
          <div
            key={b.level}
            className={`p-3.5 rounded-xl border ${b.bg} ${b.border} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                  {b.interval}
                </span>
                <span className={`text-xs font-bold ${b.text}`}>Box {b.level}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 mt-1">{b.name.split(':')[0]}</h4>
              <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
              <span className="text-[10px] text-slate-500 uppercase">প্রশ্ন সংখ্যা</span>
              <span className={`text-base font-black ${b.text}`}>{b.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
