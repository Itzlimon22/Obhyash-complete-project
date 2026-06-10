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
  BookOpen,
  Layers,
  HelpCircle,
  Hourglass,
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

  const chapterCount = config.chapters === 'All' ? 'সব' : config.chapters.split(',').length.toString();

  const getSubjectColor = (subjectId?: string) => {
    if (!subjectId) return 'from-emerald-500/20 to-transparent';
    const s = subjectId.toLowerCase();
    if (s.includes('physics')) return 'from-blue-500/20 to-transparent';
    if (s.includes('chemistry')) return 'from-orange-500/20 to-transparent';
    if (s.includes('biology')) return 'from-teal-500/20 to-transparent';
    if (s.includes('math')) return 'from-purple-500/20 to-transparent';
    return 'from-emerald-500/20 to-transparent';
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto pb-24 px-4 md:px-6">
      
      {/* 3. Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex justify-center">
        <div className={cn("w-[600px] h-[300px] rounded-full bg-gradient-radial blur-[100px] opacity-60 dark:opacity-30", getSubjectColor(config.subject))} />
      </div>

      {/* 6. Contextual Header */}
      <div className="flex justify-center mb-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          <span className="text-neutral-800 dark:text-neutral-200">{config.subjectLabel?.split(' ')[0]}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span>{config.examType}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span>{config.difficulty}</span>
        </div>
      </div>

      {/* Exam Summary Card (Staggered Animation 1) */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[2rem] border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm mb-5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100/50 dark:border-neutral-800/50">
          <p className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            পরীক্ষার সারসংক্ষেপ
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-100/50 dark:divide-neutral-800/50">
          {/* 1. Professional Icons & 4. Typography Hierarchy */}
          <StatCell
            icon={<BookOpen size={18} strokeWidth={2.5} />}
            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            label="বিষয়"
            value={config.subjectLabel?.split(' ')[0] ?? '—'}
          />
          <StatCell
            icon={<Layers size={18} strokeWidth={2.5} />}
            iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            label="অধ্যায়"
            value={chapterCount}
          />
          <StatCell
            icon={<HelpCircle size={18} strokeWidth={2.5} />}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            label="প্রশ্ন"
            value={`${config.questionCount}`}
            highlight
          />
          <StatCell
            icon={<Hourglass size={18} strokeWidth={2.5} />}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            label="সময় (মিনিট)"
            value={`${config.durationMinutes}`}
            highlight
          />
        </div>
      </div>

      {/* Rules Card (Staggered Animation 2) */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[2rem] border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm mb-5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100/50 dark:border-neutral-800/50">
          <p className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            নিয়মাবলী
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-neutral-100/50 dark:bg-neutral-800/50">
          <RuleRow
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            icon={<Clock size={13} className="text-emerald-700 dark:text-emerald-400" />}
            title="সময় ব্যবস্থাপনা"
            desc={`${config.durationMinutes} মিনিট — সময় শেষে স্বয়ংক্রিয় জমা`}
          />
          <RuleRow
            iconBg={hasNegative ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}
            icon={
              hasNegative
                ? <MinusCircle size={13} className="text-red-600 dark:text-red-400" />
                : <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400" />
            }
            title="নেগেটিভ মার্কিং"
            desc={hasNegative ? `প্রতি ভুলে −${config.negativeMarking} নম্বর কাটা` : 'নেগেটিভ মার্কিং নেই'}
            badge={hasNegative ? `−${config.negativeMarking}` : '✓'}
            badgeColor={hasNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}
          />
          <RuleRow
            iconBg="bg-sky-100 dark:bg-sky-900/30"
            icon={<CheckCircle2 size={13} className="text-sky-700 dark:text-sky-400" />}
            title="পাস মার্ক"
            desc="৫০% বা তার বেশি পেলে পাস"
            badge="৫০%"
            badgeColor="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
          />
          <RuleRow
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            icon={<AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />}
            title="ট্যাব পরিবর্তন"
            desc="ট্যাব বদলালে পরীক্ষা বাতিল হতে পারে"
          />
          <RuleRow
            iconBg="bg-neutral-100 dark:bg-neutral-800"
            icon={<Wifi size={13} className="text-neutral-600 dark:text-neutral-400" />}
            title="ইন্টারনেট"
            desc="স্থিতিশীল সংযোগ নিশ্চিত করো"
          />
        </div>
      </div>

      {/* CTA (Staggered Animation 3) */}
      <div className="flex flex-row gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-1/3 group relative overflow-hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-extrabold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 px-2"
        >
          <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform shrink-0" />
            <span className="text-[13px] sm:text-lg whitespace-nowrap">ফিরে যাও</span>
          </div>
        </button>

        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-2/3 group relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none px-2"
        >
          <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-3">
            {isLoading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span className="text-[14px] sm:text-lg whitespace-nowrap">লোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <span className="text-[14px] sm:text-lg whitespace-nowrap">পরীক্ষা শুরু করো</span>
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform duration-300 shrink-0 hidden sm:block" />
              </>
            )}
          </div>
        </button>
      </div>

      <p className="text-center text-[11px] text-neutral-400 mt-4 font-bold uppercase tracking-widest animate-in fade-in duration-500 delay-500 fill-mode-both">
        শুরু করলে টাইমার চালু হয়ে যাবে
      </p>
    </div>
  );
};

// ─── Stat Cell (summary grid) ─────────────────────────────────────────────────
const StatCell = ({
  icon,
  iconColor,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-inner", iconColor || "bg-neutral-100 text-neutral-500 dark:bg-neutral-800")}>
      {icon}
    </div>
    <p
      className={cn(
        'font-black text-2xl md:text-3xl leading-none mb-1.5',
        highlight
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-neutral-900 dark:text-white',
      )}
    >
      {value}
    </p>
    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
      {label}
    </p>
  </div>
);

// ─── Rule Card (compact 2-col grid) ──────────────────────────────────────────
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
  <div className="flex items-start gap-3 px-4 py-3.5 bg-white/60 dark:bg-neutral-900/60 backdrop-blur hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors">
    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm', iconBg)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-xs font-extrabold text-neutral-900 dark:text-white leading-tight">{title}</p>
        {badge && (
          <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm', badgeColor)}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5">{desc}</p>
    </div>
  </div>
);


