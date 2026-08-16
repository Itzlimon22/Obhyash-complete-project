'use client';

import React from 'react';
import {
  FileQuestion,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';

interface QuestionBankHealthProps {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  onFilterStatus?: (status: string | null) => void;
  activeStatusFilter?: string | null;
}

export function QuestionBankHealthBar({
  totalCount = 0,
  approvedCount = 0,
  pendingCount = 0,
  rejectedCount = 0,
  onFilterStatus,
  activeStatusFilter,
}: QuestionBankHealthProps) {
  const approvalRate =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Tile 1: Total Bank */}
      <button
        type="button"
        onClick={() => onFilterStatus?.(null)}
        className={`p-4 rounded-2xl border text-left transition-all group ${
          !activeStatusFilter
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-sm'
            : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-blue-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
            মোট প্রশ্ন ভাণ্ডার
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileQuestion size={16} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
          {totalCount.toLocaleString()}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
            সকল ফিল্টারকৃত প্রশ্ন
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            All MCQs
          </span>
        </div>
      </button>

      {/* Tile 2: Approved MCQs */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('Approved')}
        className={`p-4 rounded-2xl border text-left transition-all group ${
          activeStatusFilter === 'Approved'
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
            : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-emerald-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
            অনুমোদিত ও ভেরিফাইড
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {approvedCount.toLocaleString()}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
            ভেরিফিকেশন রেট: {approvalRate}%
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            Live in App
          </span>
        </div>
      </button>

      {/* Tile 3: Pending Queue */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('Pending')}
        className={`p-4 rounded-2xl border text-left transition-all group ${
          activeStatusFilter === 'Pending'
            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm'
            : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
            রিভিউ ও অনুমোদন কিউ
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock size={16} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
          {pendingCount.toLocaleString()}
          {pendingCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
            {pendingCount > 0 ? 'পর্যালোচনা প্রয়োজন' : 'কিউ সম্পূর্ণ ক্লিয়ার'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            Awaiting Review
          </span>
        </div>
      </button>

      {/* Tile 4: Rejected / Drafts */}
      <button
        type="button"
        onClick={() => onFilterStatus?.('Rejected')}
        className={`p-4 rounded-2xl border text-left transition-all group ${
          activeStatusFilter === 'Rejected'
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm'
            : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-rose-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
            বাতিলকৃত প্রশ্ন
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Sparkles size={16} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
          {rejectedCount.toLocaleString()}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
            সংশোধন বা বাতিলের জন্য
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
            Rejected
          </span>
        </div>
      </button>
    </div>
  );
}
