'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MinusCircle,
  Wifi,
  Sparkles,
  FileText,
  Shield,
} from 'lucide-react';
import { ExamConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExamInstructionsViewProps {
  config: ExamConfig;
  onStart: () => Promise<boolean>;
  onBack: () => void;
}

export const ExamInstructionsView: React.FC<ExamInstructionsViewProps> = ({
  config,
  onStart,
  onBack,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const success = await onStart();
      if (!success) setIsLoading(false);
    } catch (error) {
      console.error('Error starting exam:', error);
      setIsLoading(false);
    }
  };

  const hasNegative = config.negativeMarking > 0;

  const chapterLabel =
    config.chapters === 'All'
      ? 'সব অধ্যায়'
      : `${config.chapters.split(',').length} টি অধ্যায়`;

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors font-bold text-sm group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        সেটআপে ফিরে যাও
      </button>

      {/* Page Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-3">
          <FileText size={11} />
          নির্দেশাবলী
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
          পরীক্ষার বিবরণ
        </h1>
        <p className="text-neutral-400 dark:text-neutral-500 text-sm font-medium mt-1">
          শুরু করার আগে নিচের তথ্যগুলো মনোযোগ দিয়ে দেখো
        </p>
      </div>

      {/* Exam Summary Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm mb-5 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            পরীক্ষার সারসংক্ষেপ
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-100 dark:divide-neutral-800">
          <StatCell
            emoji="📚"
            label="বিষয়"
            value={config.subjectLabel?.split(' ')[0] ?? '—'}
          />
          <StatCell
            emoji="📖"
            label="অধ্যায়"
            value={chapterLabel}
          />
          <StatCell
            emoji="❓"
            label="প্রশ্ন"
            value={`${config.questionCount} টি`}
            highlight
          />
          <StatCell
            emoji="⏱️"
            label="সময়"
            value={`${config.durationMinutes} মিনিট`}
            highlight
          />
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm mb-5 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            নিয়মাবলী
          </p>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <RuleRow
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            icon={<Clock size={14} className="text-emerald-700 dark:text-emerald-400" />}
            title="সময় ব্যবস্থাপনা"
            desc={`মোট ${config.durationMinutes} মিনিট সময় আছে। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।`}
          />
          <RuleRow
            iconBg={hasNegative ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}
            icon={
              hasNegative
                ? <MinusCircle size={14} className="text-red-600 dark:text-red-400" />
                : <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-400" />
            }
            title="নেগেটিভ মার্কিং"
            desc={
              hasNegative
                ? `প্রতিটি ভুল উত্তরের জন্য ${config.negativeMarking} নম্বর কাটা যাবে। নিশ্চিত না হলে উত্তর না দেওয়াই ভালো।`
                : 'এই পরীক্ষায় কোনো নেগেটিভ মার্কিং নেই। নির্ভয়ে সব প্রশ্নের উত্তর দাও।'
            }
            badge={hasNegative ? `−${config.negativeMarking}` : undefined}
            badgeColor={hasNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : undefined}
          />
          <RuleRow
            iconBg="bg-sky-100 dark:bg-sky-900/30"
            icon={<CheckCircle2 size={14} className="text-sky-700 dark:text-sky-400" />}
            title="পাস মার্ক"
            desc="সাধারণত ৫০% নম্বর পেলে পাস হিসেবে গণ্য করা হয়।"
            badge="৫০%"
            badgeColor="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
          />
          <RuleRow
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            icon={<AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />}
            title="উইন্ডো / ট্যাব পরিবর্তন"
            desc="পরীক্ষা চলাকালীন ব্রাউজার ট্যাব বা উইন্ডো পরিবর্তন করলে পরীক্ষা বাতিল হতে পারে।"
          />
          <RuleRow
            iconBg="bg-neutral-100 dark:bg-neutral-800"
            icon={<Wifi size={14} className="text-neutral-600 dark:text-neutral-400" />}
            title="ইন্টারনেট সংযোগ"
            desc="পরীক্ষার আগে ভালো ইন্টারনেট সংযোগ আছে কিনা নিশ্চিত করো।"
          />
        </div>
      </div>

      {/* Safety reminder if negative marking */}
      {hasNegative && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 mb-5">
          <Shield size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">
            এই পরীক্ষায় নেগেটিভ মার্কিং আছে।{' '}
            <strong className="font-extrabold">নিশ্চিত না হলে উত্তর এড়িয়ে যাও</strong> — ভুল উত্তরে{' '}
            <span className="font-extrabold">{config.negativeMarking} নম্বর</span> কাটা যাবে।
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full group relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-5 rounded-3xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        <div className="relative z-10 flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-lg">প্রশ্ন লোড হচ্ছে...</span>
            </>
          ) : (
            <>
              <span className="text-lg">পরীক্ষা শুরু করো</span>
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            </>
          )}
        </div>
      </button>

      <p className="text-center text-[11px] text-neutral-400 mt-4 font-bold uppercase tracking-widest">
        শুরু করলে টাইমার চালু হয়ে যাবে
      </p>
    </div>
  );
};

// ─── Stat Cell (summary grid) ─────────────────────────────────────────────────
const StatCell = ({
  emoji,
  label,
  value,
  highlight = false,
}: {
  emoji: string;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center gap-1 py-5 px-3 text-center">
    <span className="text-2xl mb-0.5">{emoji}</span>
    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
      {label}
    </p>
    <p
      className={cn(
        'font-extrabold text-sm leading-tight',
        highlight
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-neutral-900 dark:text-white',
      )}
    >
      {value}
    </p>
  </div>
);

// ─── Rule Row ────────────────────────────────────────────────────────────────
const RuleRow = ({
  icon,
  iconBg,
  title,
  desc,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
}) => (
  <div className="flex items-start gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
    <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-extrabold text-neutral-900 dark:text-white">{title}</p>
        {badge && (
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', badgeColor)}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
);
