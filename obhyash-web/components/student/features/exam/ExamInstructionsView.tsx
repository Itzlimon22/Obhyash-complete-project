'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Play,
  ArrowLeft,
  CheckCircle2,
  MinusCircle,
  ShieldAlert,
  Wifi,
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

  const chapterLabel =
    config.chapters === 'All'
      ? 'সব অধ্যায়'
      : `${config.chapters.split(',').length} টি অধ্যায়`;

  const hasNegative = config.negativeMarking > 0;

  return (
    <div className="w-full max-w-2xl mx-auto pb-10 px-3 md:px-0 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors font-semibold"
      >
        <ArrowLeft size={15} />
        সেটআপে ফিরে যাও
      </button>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          পরীক্ষার নির্দেশাবলী
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">শুরু করার আগে মনোযোগ দিয়ে পড়ো</p>
      </div>

      {/* Exam Summary Strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <StatChip
          label="বিষয়"
          value={config.subjectLabel?.split(' ')[0] ?? '—'}
          color="emerald"
        />
        <StatChip label="অধ্যায়" value={chapterLabel} color="sky" />
        <StatChip label="প্রশ্ন" value={`${config.questionCount} টি`} color="violet" />
        <StatChip label="সময়" value={`${config.durationMinutes} মি`} color="amber" />
      </div>

      {/* Instructions Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden mb-4">
        {/* Rules */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <RuleRow
            icon={<Clock size={15} className="text-emerald-500" />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            label="সময় ব্যবস্থাপনা"
            desc={`মোট ${config.durationMinutes} মিনিট। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হবে।`}
          />
          <RuleRow
            icon={
              hasNegative
                ? <MinusCircle size={15} className="text-red-500" />
                : <CheckCircle2 size={15} className="text-emerald-500" />
            }
            iconBg={hasNegative ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
            label="নেগেটিভ মার্কিং"
            desc={
              hasNegative
                ? `প্রতিটি ভুল উত্তরের জন্য ${config.negativeMarking} নম্বর কাটা যাবে।`
                : 'এই পরীক্ষায় কোনো নেগেটিভ মার্কিং নেই।'
            }
          />
          <RuleRow
            icon={<CheckCircle2 size={15} className="text-sky-500" />}
            iconBg="bg-sky-50 dark:bg-sky-900/20"
            label="পাস মার্ক"
            desc="সাধারণত ৫০% নম্বর পেলে পাস হিসেবে গণ্য করা হয়।"
          />
          <RuleRow
            icon={<Wifi size={15} className="text-violet-500" />}
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            label="নেটওয়ার্ক"
            desc="ভালো ইন্টারনেট সংযোগ আছে কিনা নিশ্চিত করো।"
          />
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/30">
          <ShieldAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>সতর্কতা:</strong> পরীক্ষা চলাকালীন উইন্ডো বা ট্যাব পরিবর্তন করলে তোমার পরীক্ষা বাতিল হতে পারে।
          </p>
        </div>
      </div>

      {/* Negative marking badge if applicable */}
      {hasNegative && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
            প্রতিটি ভুলে <span className="font-black">{config.negativeMarking}</span> মার্ক কাটা যাবে — নিশ্চিত না হলে এড়িয়ে যাও।
          </p>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -skew-x-12 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-white/10" />

        <div className="relative flex items-center justify-center gap-2.5">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>প্রশ্ন লোড হচ্ছে...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>পরীক্ষা শুরু করো</span>
            </>
          )}
        </div>
      </button>
      <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-600 mt-2">
        শুরু করলে টাইমার চালু হয়ে যাবে
      </p>
    </div>
  );
};

// ─── Compact Stat Chip ────────────────────────────────────────────────────────
type ChipColor = 'emerald' | 'sky' | 'violet' | 'amber';

const colorMap: Record<ChipColor, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
  sky:     'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/40',
  violet:  'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-900/40',
  amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
};

const StatChip = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: ChipColor;
}) => (
  <div className={cn('rounded-xl border px-2.5 py-2 text-center', colorMap[color])}>
    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{label}</p>
    <p className="text-sm font-extrabold truncate leading-tight">{value}</p>
  </div>
);

// ─── Rule Row ────────────────────────────────────────────────────────────────
const RuleRow = ({
  icon,
  iconBg,
  label,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{label}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
);
