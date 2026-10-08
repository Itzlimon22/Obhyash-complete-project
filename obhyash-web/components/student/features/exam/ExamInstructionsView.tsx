'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Timer,
  LayoutGrid,
  AlertTriangle,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Binary,
  BookOpen,
} from 'lucide-react';
import { ExamConfig } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { cn } from '@/lib/utils';

interface ExamInstructionsViewProps {
  config: ExamConfig;
  onStart: () => Promise<boolean>;
  onBack: () => void;
  showHeader?: boolean;
}

const toBanglaNumeral = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

export const ExamInstructionsView: React.FC<ExamInstructionsViewProps> = ({
  config,
  onStart,
  onBack,
  showHeader = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

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

  const formattedSubject = BanglaNameHelper.formatSubject(
    config.subject,
    config.subjectLabel,
  );

  const cleanChapters = (config.chapters || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.toLowerCase() !== 'all');

  const chapterCountLabel =
    cleanChapters.length > 0
      ? `${toBanglaNumeral(cleanChapters.length)}টি অধ্যায়`
      : 'সকল অধ্যায়';

  const durationStr = toBanglaNumeral(config.durationMinutes || 25);
  const totalQStr = toBanglaNumeral(config.questionCount || 25);
  const negMarkStr =
    config.negativeMarking > 0
      ? `-${toBanglaNumeral(config.negativeMarking)}`
      : 'নেই';
  const totalMarksStr = toBanglaNumeral(config.questionCount || 25);

  // Subject Icon Mapping
  const getSubjectIcon = (subjectStr: string) => {
    const s = subjectStr.toLowerCase();
    if (s.includes('physics') || s.includes('পদার্থ'))
      return <Atom className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />;
    if (s.includes('chem') || s.includes('রসায়ন') || s.includes('রসায়ন'))
      return (
        <FlaskConical className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />
      );
    if (s.includes('bio') || s.includes('জীব'))
      return <Dna className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />;
    if (s.includes('math') || s.includes('গণিত'))
      return (
        <Calculator className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />
      );
    if (s.includes('ict') || s.includes('তথ্য'))
      return <Binary className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />;
    return <BookOpen className="w-5 h-5 text-[#12544F] dark:text-[#34D399]" />;
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col select-none text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif]",
        showHeader ? "min-h-screen bg-[#f4f7fb] dark:bg-[#090d10]" : "py-2 sm:py-4"
      )}
    >
      {/* ── Top App Bar (Title + Back Arrow) ── */}
      {showHeader && (
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#111417]/95 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/[0.08] flex items-center px-4 sm:px-6 select-none shadow-xs">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} className="stroke-[2.2]" />
          </button>
          <h1 className="flex-1 text-center font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-xl text-neutral-900 dark:text-white tracking-tight mr-9">
            পরীক্ষার নির্দেশাবলী
          </h1>
        </header>
      )}

      {/* ── Main Content Container ── */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 flex justify-center">
        <div className="w-full max-w-md flex flex-col gap-4 pb-28">
          {/* ── Card 1: Subject Header with 4-Stat Ribbon inside ── */}
          <div className="bg-white dark:bg-[#111417] rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            {/* Subject Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Purple square icon with atom */}
                <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center shrink-0">
                  <Atom className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="font-bold text-lg sm:text-[19px] text-neutral-900 dark:text-white truncate font-['Anek_Bangla',sans-serif]">
                  {formattedSubject || 'পদার্থবিজ্ঞান ১ম পত্র'}
                </h2>
              </div>

              {/* Muted green 'মডেল টেস্ট' badge */}
              <span className="px-3 py-1 rounded-xl bg-[#e8f3ef] dark:bg-[#0c2f25] text-[#12544F] dark:text-[#34D399] text-xs font-bold font-['Anek_Bangla',sans-serif] shrink-0">
                মডেল টেস্ট
              </span>
            </div>

            {/* Horizontal line divider */}
            <div className="w-full h-[1px] bg-neutral-100 dark:bg-white/[0.06]" />

            {/* 4-Column Stat Ribbon */}
            <div className="grid grid-cols-4 divide-x divide-neutral-100 dark:divide-white/[0.06] text-center">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1 font-['Anek_Bangla',sans-serif]">
                  সময়সীমা
                </span>
                <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
                  {durationStr} মিনিট
                </span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1 font-['Anek_Bangla',sans-serif]">
                  মোট প্রশ্ন
                </span>
                <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
                  {totalQStr}টি MCQ
                </span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1 font-['Anek_Bangla',sans-serif]">
                  নেগেটিভ
                </span>
                <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
                  {negMarkStr}
                </span>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-1 font-['Anek_Bangla',sans-serif]">
                  পূর্ণমান
                </span>
                <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
                  {totalMarksStr} নম্বর
                </span>
              </div>
            </div>
          </div>

          {/* ── Card 2: গুরুত্বপূর্ণ নির্দেশনাবলী (Instructions Card) ── */}
          <div className="bg-white dark:bg-[#111417] rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs flex flex-col gap-6">
            {/* Header: Shield Icon + Text */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0f3e37] dark:text-emerald-400 font-['Anek_Bangla',sans-serif]">
                গুরুত্বপূর্ণ নির্দেশনাবলী
              </h3>
            </div>

            {/* Instruction Timeline Items */}
            <div className="flex flex-col gap-6">
              {/* Item 1: সঠিক উত্তর নির্বাচন */}
              <div className="flex items-start gap-3.5">
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {/* Vertical connecting line */}
                  <div className="w-[1.5px] h-10 bg-neutral-100 dark:bg-white/[0.08] mt-2" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                    সঠিক উত্তর নির্বাচন
                  </h4>
                  <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1 font-['HindSiliguri',sans-serif]">
                    প্রতিটি প্রশ্নে ৪টি অপশন থাকবে। পছন্দের অপশনে ট্যাপ করে উত্তর দাও। একবার অপশন সিলেক্ট করলে তা লক হয়ে যাবে।
                  </p>
                </div>
              </div>

              {/* Item 2: টাইমার ও স্বয়ংক্রিয় সাবমিট */}
              <div className="flex items-start gap-3.5">
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {/* Vertical connecting line */}
                  <div className="w-[1.5px] h-10 bg-neutral-100 dark:bg-white/[0.08] mt-2" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                    টাইমার ও স্বয়ংক্রিয় সাবমিট
                  </h4>
                  <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1 font-['HindSiliguri',sans-serif]">
                    স্ক্রিনের শীর্ষে কাউন্টডাউন থাকবে। সময় শেষ হলে পরীক্ষা নিজেই সাবমিট হয়ে রেজাল্ট দেখাবে।
                  </p>
                </div>
              </div>

              {/* Item 3: অ্যাপ ত্যাগ সতর্কতা */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-rose-500 dark:text-rose-400 font-['Anek_Bangla',sans-serif]">
                    অ্যাপ ত্যাগ সতর্কতা
                  </h4>
                  <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1 font-['HindSiliguri',sans-serif]">
                    পরীক্ষা চলাকালে অ্যাপ থেকে বের বা ব্যাকগ্রাউন্ডে গেলে পরীক্ষা অকার্যকর হতে পারে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom CTA Button (Exact match: Dark Green with Play triangle) ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d10]/95 backdrop-blur-md border-t border-neutral-200/60 dark:border-white/[0.08] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-center">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="w-full h-13 rounded-2xl bg-[#0b4d44] hover:bg-[#093e37] active:scale-[0.99] text-white font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-['Anek_Bangla',sans-serif] shadow-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-sm">▷</span>
                <span>পরীক্ষা শুরু করো</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ExamInstructionsView;
