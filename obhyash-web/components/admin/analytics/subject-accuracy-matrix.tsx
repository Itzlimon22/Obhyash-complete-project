'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  Users,
} from 'lucide-react';

export interface SubjectPerf {
  subject: string;
  examsCount: number;
  averageScore: number;
  totalStudents: number;
  masteryTier: 'Mastered' | 'Moderate' | 'Needs Focus';
}

interface SubjectAccuracyMatrixProps {
  subjects: SubjectPerf[];
}

export function SubjectAccuracyMatrix({
  subjects = [],
}: SubjectAccuracyMatrixProps) {
  const [filterTier, setFilterTier] = useState<string>('all');

  const filteredSubjects = subjects.filter((s) => {
    if (filterTier === 'all') return true;
    return s.masteryTier === filterTier;
  });

  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-sm">
      {/* Header & Tier Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
              বিষয়ভিত্তিক নির্ভুলতা ও দক্ষতা ম্যাট্রিক্স (Subject Mastery Matrix)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              শিক্ষার্থীরা কোন বিষয়ে বেশি দক্ষ এবং কোন বিষয়ে বেশি ভুল করছে
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterTier('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTier === 'all'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
            }`}
          >
            সকল বিষয় ({subjects.length})
          </button>
          <button
            onClick={() => setFilterTier('Mastered')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTier === 'Mastered'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-emerald-500 dark:text-zinc-400'
            }`}
          >
            দক্ষ (Mastered)
          </button>
          <button
            onClick={() => setFilterTier('Needs Focus')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTier === 'Needs Focus'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-rose-500 dark:text-zinc-400'
            }`}
          >
            দুর্বল (Needs Focus)
          </button>
        </div>
      </div>

      {/* Subject List Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map((sub, idx) => {
            const isMastered = sub.masteryTier === 'Mastered';
            const isWeak = sub.masteryTier === 'Needs Focus';

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-neutral-200/80 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-900/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      {sub.subject}
                    </h4>
                    <span className="text-[11px] text-neutral-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <Users size={12} /> {sub.totalStudents} জন শিক্ষার্থী •{' '}
                      {sub.examsCount} টি পরীক্ষা
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border ${
                      isMastered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : isWeak
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                    }`}
                  >
                    {sub.averageScore}% Accuracy ({sub.masteryTier})
                  </span>
                </div>

                {/* Accuracy Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, sub.averageScore)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-emerald-500'
                          : isWeak
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-neutral-400 dark:text-zinc-500">
          কোনো বিষয়ের ডাটা পাওয়া যায়নি।
        </div>
      )}
    </div>
  );
}
