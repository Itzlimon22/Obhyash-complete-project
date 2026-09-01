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
}

const toBanglaNumeral = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

export const ExamInstructionsView: React.FC<ExamInstructionsViewProps> = ({
  config,
  onStart,
  onBack,
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
      return <Atom className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    if (s.includes('chem') || s.includes('রসায়ন') || s.includes('রসায়ন'))
      return (
        <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      );
    if (s.includes('bio') || s.includes('জীব'))
      return <Dna className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    if (s.includes('math') || s.includes('গণিত'))
      return (
        <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      );
    if (s.includes('ict') || s.includes('তথ্য'))
      return <Binary className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    return <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6F9] dark:bg-[#0A0B0E] flex flex-col font-['HindSiliguri',sans-serif] select-none text-[#0F172A] dark:text-[#F8FAFC]">
      {/* ── Top App Bar ── */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white dark:bg-[#111216] border-b border-[#E5E9F0] dark:border-[#1F2026] flex items-center px-4 sm:px-6 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          aria-label="Back"
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] dark:text-[#E2E8F0] hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-base sm:text-lg text-[#0F172A] dark:text-white mr-9">
          পরীক্ষার নির্দেশাবলী
        </h1>
      </header>

      {/* ── Main Scrollable Content ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 flex justify-center">
        <div className="w-full max-w-lg flex flex-col gap-3.5 sm:gap-4 pb-24">
          {/* ── Card 1: Subject & Scope Accordion ── */}
          <div className="bg-white dark:bg-[#121318] rounded-[20px] border border-[#E5E9F0] dark:border-[#22242D] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Left: Icon & Subject Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-[14px] bg-[#FAF5FF] dark:bg-[#251833] border border-[#F3E8FF] dark:border-[#3B2252] flex items-center justify-center shrink-0">
                  {getSubjectIcon(config.subject || config.subjectLabel || '')}
                </div>
                <h2 className="font-bold text-base sm:text-[17px] text-[#0F172A] dark:text-white truncate">
                  {formattedSubject}
                </h2>
              </div>

              {/* Right: Pill with Chapter Count & Chevron */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E2028] border border-[#E2E8F0] dark:border-[#2D303B] text-[#334155] dark:text-[#CBD5E1] text-xs sm:text-sm font-semibold shrink-0">
                <span>{chapterCountLabel}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#64748B] dark:text-[#94A3B8] transition-transform duration-200',
                    isAccordionOpen && 'rotate-180',
                  )}
                />
              </div>
            </button>

            {/* Accordion Expandable Chapters List */}
            {isAccordionOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-[#F1F5F9] dark:border-[#1F2026] flex flex-col gap-2 animate-in fade-in duration-200">
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] pt-2">
                  অন্তর্ভুক্ত অধ্যায়সমূহ:
                </p>
                {cleanChapters.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1A1B22] text-xs text-[#64748B] dark:text-[#94A3B8]">
                    সম্পূর্ণ সিলেবাসের সকল অধ্যায় অন্তর্ভুক্ত।
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {cleanChapters.map((chapter, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#181920] border border-[#E2E8F0]/60 dark:border-[#272935] text-xs sm:text-sm font-medium text-[#1E293B] dark:text-[#E2E8F0]"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {toBanglaNumeral(idx + 1)}
                        </span>
                        <span className="truncate">{chapter}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Card 2: 4-Column Stat Ribbon ── */}
          <div className="bg-white dark:bg-[#121318] rounded-[20px] border border-[#E5E9F0] dark:border-[#22242D] py-4 px-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] grid grid-cols-4 divide-x divide-[#F1F5F9] dark:divide-[#1F2026] text-center">
            {/* Stat 1: সময়সীমা */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mb-1">
                সময়সীমা
              </span>
              <span className="font-bold text-[13px] sm:text-base text-[#0F172A] dark:text-white leading-tight">
                {durationStr} মিনিট
              </span>
            </div>

            {/* Stat 2: মোট প্রশ্ন */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mb-1">
                মোট প্রশ্ন
              </span>
              <span className="font-bold text-[13px] sm:text-base text-[#0F172A] dark:text-white leading-tight">
                {totalQStr}টি MCQ
              </span>
            </div>

            {/* Stat 3: নেগেটিভ */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mb-1">
                নেগেটিভ
              </span>
              <span className="font-bold text-[13px] sm:text-base text-[#0F172A] dark:text-white leading-tight">
                {negMarkStr}
              </span>
            </div>

            {/* Stat 4: পূর্ণমান */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mb-1">
                পূর্ণমান
              </span>
              <span className="font-bold text-[13px] sm:text-base text-[#0F172A] dark:text-white leading-tight">
                {totalMarksStr} নম্বর
              </span>
            </div>
          </div>

          {/* ── Card 3: Important Instructions Timeline Card ── */}
          <div className="bg-white dark:bg-[#121318] rounded-[20px] border border-[#E5E9F0] dark:border-[#22242D] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-[10px] bg-[#ECFDF5] dark:bg-[#064E3B]/30 flex items-center justify-center text-[#059669] dark:text-[#34D399]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0F172A] dark:text-white">
                গুরুত্বপূর্ণ নির্দেশনাবলী
              </h3>
            </div>

            {/* Timeline Items */}
            <div className="relative flex flex-col gap-6 pl-1">
              {/* Timeline Connector Line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-[#E2E8F0] dark:bg-[#22242D]" />

              {/* Item 1: সঠিক উত্তর নির্বাচন */}
              <div className="relative flex items-start gap-3.5 z-10">
                <div className="w-10 h-10 rounded-[12px] bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#10B981] dark:text-[#34D399] flex items-center justify-center shrink-0 border-2 border-white dark:border-[#121318] shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white leading-tight">
                    সঠিক উত্তর নির্বাচন
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-1">
                    প্রতিটি প্রশ্নে ৪টি অপশন থাকবে। পছন্দের অপশনে ট্যাপ করে উত্তর
                    দাও। একবার অপশন সিলেক্ট করলে তা লক হয়ে যাবে।
                  </p>
                </div>
              </div>

              {/* Item 2: টাইমার ও স্বয়ংক্রিয় সাবমিট */}
              <div className="relative flex items-start gap-3.5 z-10">
                <div className="w-10 h-10 rounded-[12px] bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#3B82F6] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border-2 border-white dark:border-[#121318] shadow-xs">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white leading-tight">
                    টাইমার ও স্বয়ংক্রিয় সাবমিট
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-1">
                    স্ক্রিনের শীর্ষে কাউন্টডাউন থাকবে। সময় শেষ হলে পরীক্ষা
                    নিজেই সাবমিট হয়ে রেজাল্ট দেখাবে।
                  </p>
                </div>
              </div>

              {/* Item 3: প্রশ্ন প্যালেট জাম্প */}
              <div className="relative flex items-start gap-3.5 z-10">
                <div className="w-10 h-10 rounded-[12px] bg-[#F5F3FF] dark:bg-[#4C1D95]/40 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center shrink-0 border-2 border-white dark:border-[#121318] shadow-xs">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white leading-tight">
                    প্রশ্ন প্যালেট জাম্প
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-1">
                    উপরের প্রশ্ন নম্বরে ট্যাপ করে সরাসরি যেকোনো প্রশ্নে চলে যাও।
                  </p>
                </div>
              </div>

              {/* Item 4: অ্যাপ ত্যাগ সতর্কতা */}
              <div className="relative flex items-start gap-3.5 z-10">
                <div className="w-10 h-10 rounded-[12px] bg-[#FEF2F2] dark:bg-[#7F1D1D]/40 text-[#EF4444] dark:text-[#F87171] flex items-center justify-center shrink-0 border-2 border-white dark:border-[#121318] shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm sm:text-base text-[#EF4444] dark:text-[#F87171] leading-tight">
                    অ্যাপ ত্যাগ সতর্কতা
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-1">
                    পরীক্ষা চলাকালে অ্যাপ থেকে বের বা ব্যাকগ্রাউন্ডে গেলে
                    পরীক্ষা অকার্যকর হতে পারে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom CTA Bar ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md border-t border-[#E5E9F0] dark:border-[#1F2026] p-3.5 sm:p-4 flex justify-center shadow-lg">
        <div className="w-full max-w-lg">
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-3.5 sm:py-4 px-6 rounded-[16px] bg-[#004633] hover:bg-[#003828] active:scale-[0.99] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(0,70,51,0.25)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>শুরু হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>পরীক্ষা শুরু করো</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ml-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ExamInstructionsView;
