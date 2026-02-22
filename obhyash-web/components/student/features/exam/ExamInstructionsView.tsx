'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Play,
  ArrowLeft,
  FileQuestion,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { ExamConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExamInstructionsViewProps {
  config: ExamConfig;
  onStart: () => Promise<boolean>; // Returns true if successful
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
      if (!success) {
        // If false is returned, it likely means error or no questions.
        // The engine might have already handled state, but we ensure loading stops.
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="font-bold">সেটআপে ফিরে যাও</span>
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                <FileQuestion size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  পরীক্ষার নির্দেশাবলী
                </h1>
                <p className="text-sm text-neutral-500">
                  Please read carefully before starting
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <InstructionItem
                  icon={<Clock className="text-emerald-500" />}
                  title="সময় ব্যবস্থাপনা (Time Management)"
                  desc={`এই পরীক্ষার জন্য মোট সময় ${config.durationMinutes} মিনিট। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।`}
                />
                <InstructionItem
                  icon={<AlertTriangle className="text-red-500" />}
                  title="নেগেটিভ মার্কিং (Negative Marking)"
                  desc={
                    config.negativeMarking > 0
                      ? `প্রতিটি ভুল উত্তরের জন্য ${config.negativeMarking} নম্বর কাটা যাবে।`
                      : 'এই পরীক্ষায় কোনো নেগেটিভ মার্কিং নেই।'
                  }
                />
                <InstructionItem
                  icon={<CheckCircle2 className="text-emerald-500" />}
                  title="পাস মার্ক (Pass Mark)"
                  desc="সাধারণত ৫০% নম্বর পেলে পাস হিসেবে গণ্য করা হয়, তবে এটি পরীক্ষার ধরণের উপর নির্ভর করে।"
                />
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <strong className="block text-neutral-900 dark:text-white mb-2">
                  সতর্কতা:
                </strong>
                পরীক্ষা চলাকালীন উইন্ডো বা ট্যাব পরিবর্তন করলে তোমার পরীক্ষা
                বাতিল হতে পারে। ভালো ইন্টারনেট সংযোগ আছে কিনা দেখে নাও।
              </div>
            </div>
          </div>
        </div>

        {/* Summary Side Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 sticky top-24">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-neutral-400" />
              সংক্ষিপ্ত বিবরণ
            </h3>

            <div className="space-y-4 mb-8">
              <SummaryRow label="বিষয়" value={config.subjectLabel} />
              <SummaryRow
                label="অধ্যায়"
                value={
                  config.chapters === 'All'
                    ? 'সব অধ্যায়'
                    : `${config.chapters.split(',').length} টি অধ্যায়`
                }
              />
              <SummaryRow label="প্রশ্ন সংখ্যা" value={config.questionCount} />
              <SummaryRow label="সময়" value={`${config.durationMinutes} min`} />
              <SummaryRow
                label="নেগেটিভ মার্কিং"
                value={config.negativeMarking}
                isNegative
              />
            </div>

            <button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>লোডিং...</span>
                  </>
                ) : (
                  <>
                    <span>পরীক্ষা শুরু করো</span>
                    <Play size={18} fill="currentColor" />
                  </>
                )}
              </div>
            </button>
            <p className="text-center text-[10px] text-neutral-400 mt-3">
              Start Exam বাটনে ক্লিক করলে প্রশ্ন লোড হবে
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InstructionItem = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
    <div className="mt-1">{icon}</div>
    <div>
      <h4 className="font-bold text-neutral-900 dark:text-white text-sm mb-1">
        {title}
      </h4>
      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const SummaryRow = ({
  label,
  value,
  isNegative = false,
}: {
  label: string;
  value: string | number;
  isNegative?: boolean;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800 last:border-0">
    <span className="text-xs font-bold text-neutral-500 uppercase">
      {label}
    </span>
    <span
      className={cn(
        'font-bold text-sm',
        isNegative
          ? 'text-red-500'
          : 'text-neutral-900 dark:text-white truncate max-w-[150px]',
      )}
    >
      {value}
    </span>
  </div>
);
