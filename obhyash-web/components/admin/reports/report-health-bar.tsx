'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gift,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface ReportHealthBarProps {
  stats: {
    total: number;
    pending: number;
    resolved: number;
    ignored: number;
  };
  activeFilter: 'All' | 'Pending' | 'Resolved' | 'Ignored';
  onSelectFilter: (filter: 'All' | 'Pending' | 'Resolved' | 'Ignored') => void;
}

export function ReportHealthBar({
  stats,
  activeFilter,
  onSelectFilter,
}: ReportHealthBarProps) {
  const resolutionRate =
    stats.total > 0
      ? Math.round(((stats.resolved + stats.ignored) / stats.total) * 100)
      : 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 animate-in fade-in duration-300">
      {/* 🔴 Pending Action Queue */}
      <button
        type="button"
        onClick={() => onSelectFilter('Pending')}
        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
          activeFilter === 'Pending'
            ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/30 ring-2 ring-amber-500/30'
            : 'bg-white dark:bg-[#141417] border-neutral-200 dark:border-zinc-800/80 hover:border-amber-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold mb-1">
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
            অ্যাকশন প্রয়োজন (Pending)
          </span>
          <AlertTriangle size={16} className="text-amber-500" />
        </div>
        <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
          {stats.pending}{' '}
          <span className="text-xs font-normal text-zinc-500">টি রিপোর্ট</span>
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">
          {stats.pending > 0 ? 'রিভিউ ও সংশোধনের অপেক্ষায়' : 'সব রিপোর্ট ক্লিয়ার! 🎉'}
        </p>
      </button>

      {/* 🟢 Resolved Reports */}
      <button
        type="button"
        onClick={() => onSelectFilter('Resolved')}
        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
          activeFilter === 'Resolved'
            ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
            : 'bg-white dark:bg-[#141417] border-neutral-200 dark:border-zinc-800/80 hover:border-emerald-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold mb-1">
          <span className="text-emerald-600 dark:text-emerald-400">
            সমাধানকৃত (Resolved)
          </span>
          <CheckCircle2 size={16} className="text-emerald-500" />
        </div>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {stats.resolved}{' '}
          <span className="text-xs font-normal text-zinc-500">টি ত্রুটি ফিক্সড</span>
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">
          শিক্ষার্থীদের ১ দিনের প্রো রিওয়ার্ডসহ
        </p>
      </button>

      {/* ⚪ Dismissed / Ignored */}
      <button
        type="button"
        onClick={() => onSelectFilter('Ignored')}
        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
          activeFilter === 'Ignored'
            ? 'bg-zinc-500/10 border-zinc-500/50 dark:bg-zinc-800 ring-2 ring-zinc-500/30'
            : 'bg-white dark:bg-[#141417] border-neutral-200 dark:border-zinc-800/80 hover:border-zinc-600'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold mb-1">
          <span>বাতিলকৃত (Dismissed)</span>
          <XCircle size={16} className="text-zinc-400" />
        </div>
        <p className="text-2xl font-black text-neutral-700 dark:text-zinc-300 font-mono">
          {stats.ignored}{' '}
          <span className="text-xs font-normal text-zinc-500">টি বাদ দেওয়া</span>
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">ভিত্তিহীন বা ডুপ্লিকেট</p>
      </button>

      {/* ⚡ Total & Resolution Rate */}
      <button
        type="button"
        onClick={() => onSelectFilter('All')}
        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
          activeFilter === 'All'
            ? 'bg-blue-500/10 border-blue-500/50 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
            : 'bg-white dark:bg-[#141417] border-neutral-200 dark:border-zinc-800/80 hover:border-blue-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold mb-1">
          <span>সমাধান রেট (Rate)</span>
          <TrendingUp size={16} className="text-blue-500" />
        </div>
        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
          {resolutionRate}%{' '}
          <span className="text-xs font-normal text-zinc-500">
            ({stats.total} মোট)
          </span>
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">সকল রিপোর্ট দেখতে চাপুন</p>
      </button>
    </div>
  );
}
