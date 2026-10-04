'use client';

import React, { useState } from 'react';
import {
  Globe,
  FileCheck2,
  Calendar,
  Building2,
  UserCheck,
  CreditCard,
  Send,
  ExternalLink,
  Check,
  Copy,
  Sparkles,
  Info,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

interface StepItem {
  id: number;
  banglaNum: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  actionType: 'links' | 'badge' | 'input' | 'button';
  links?: { label: string; url: string }[];
  badgeText?: string;
  tip?: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    banglaNum: '১',
    title: 'অফিসিয়াল রেজাল্ট সাইট ওপেন করুন',
    desc: 'যেকোনো মোবাইল বা কম্পিউটার ব্রাউজারে নিচের যেকোনো একটি সরকারি সার্ভার ওপেন করুন:',
    icon: Globe,
    actionType: 'links',
    links: [
      { label: 'eboardresults.com', url: 'https://eboardresults.com' },
      { label: 'educationboardresults.gov.bd', url: 'http://www.educationboardresults.gov.bd' },
    ],
    tip: 'রেজাল্ট প্রকাশের শুরুতে eboardresults.com সার্ভারটি দ্রুত লোড হয়।',
  },
  {
    id: 2,
    banglaNum: '২',
    title: 'Examination নির্বাচন করুন',
    desc: 'ড্রপডাউন লিস্ট থেকে আপনার সংশ্লিষ্ট পরীক্ষার নাম নির্বাচন করুন:',
    icon: FileCheck2,
    actionType: 'badge',
    badgeText: 'HSC / Alim / Equivalent',
  },
  {
    id: 3,
    banglaNum: '৩',
    title: 'Year (পরীক্ষার সাল) দিন',
    desc: 'পাসিং ইয়ার অপশনে আপনার পরীক্ষার বছর বেছে নিন:',
    icon: Calendar,
    actionType: 'badge',
    badgeText: '২০২৬ (2026)',
  },
  {
    id: 4,
    banglaNum: '৪',
    title: 'শিক্ষা বোর্ড (Board) সিলেক্ট করুন',
    desc: 'আপনার নিজ সাধারণ শিক্ষা বোর্ড, মাদ্রাসা বা কারিগরি বোর্ড বেছে নিন:',
    icon: Building2,
    actionType: 'badge',
    badgeText: 'Dhaka / Rajshahi / Cumilla / ইত্যাদি',
  },
  {
    id: 5,
    banglaNum: '৫',
    title: 'Result Type নির্বাচন করুন',
    desc: 'ব্যক্তিগত একক মার্কশিট পেতে অবশ্যই নিচের অপশনটি সিলেক্ট করবেন:',
    icon: UserCheck,
    actionType: 'badge',
    badgeText: 'Individual Result',
    tip: 'সতর্কতা: "Individual" না নিলে নিজের ফলের বদলে পুরো শিক্ষাপ্রতিষ্ঠানের ফলাফল চলে আসবে।',
  },
  {
    id: 6,
    banglaNum: '৬',
    title: 'রোল ও রেজিস্ট্রেশন নম্বর লিখুন',
    desc: 'আপনার অ্যাডমিট কার্ডে থাকা সঠিক রোল ও ১০ ডিজিটের রেজিস্ট্রেশন নম্বর লিখুন:',
    icon: CreditCard,
    actionType: 'input',
    badgeText: 'Roll: ১২৩৪৫৬  |  Reg: XXXXXXXXXX',
  },
  {
    id: 7,
    banglaNum: '৭',
    title: 'ক্যাপচা কোড মিলিয়ে Submit চাপুন',
    desc: 'ছবিতে প্রদর্শিত ৪ ডিজিট বা সাধারণ যোগফল পূরণ করে বাটনে ক্লিক করুন:',
    icon: Send,
    actionType: 'button',
    badgeText: 'Get Result / Submit ↵',
  },
];

export default function ResultStepFlow() {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const summaryText = `অনলাইনে এইচএসসি রেজাল্ট ও মার্কশিট দেখার নিয়ম:
১. eboardresults.com ভিজিট করুন
২. Examination: HSC/Alim/Equivalent
৩. Year: 2026
৪. Board: আপনার বোর্ড
৫. Result Type: Individual Result
৬. Roll & Registration নম্বর লিখুন
৭. Security Key যোগফল মিলিয়ে Submit চাপুন`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      toast.success('৭টি ধাপ কপি করা হয়েছে!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="my-10 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-[#141414] dark:via-[#111111] dark:to-[#141414] p-5 sm:p-8 shadow-sm font-anek not-prose">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ভিজ্যুয়াল স্টেপ গাইড (Infographic Flow)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            অনলাইনে মার্কশিটসহ রেজাল্ট দেখার ৭টি সহজ ধাপ
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            নিচের ইনফোগ্রাফিক ফ্লো অনুসরণ করে ১ মিনিটেই পুরো বিষয়ভিত্তিক মার্কশিট দেখতে পাবেন:
          </p>
        </div>

        <button
          onClick={handleCopySummary}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all shrink-0 self-start sm:self-auto shadow-xs"
          title="ধাপগুলো সংক্ষেপে কপি করুন"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'কপি হয়েছে' : 'ধাপগুলো কপি করুন'}</span>
        </button>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="relative pt-6 sm:pt-8 pl-3 sm:pl-6 space-y-6 sm:space-y-7 before:absolute before:top-10 before:bottom-12 before:left-[19px] sm:before:left-[31px] before:w-[2px] before:bg-gradient-to-b before:from-slate-900 before:via-slate-300 before:to-emerald-500 dark:before:from-white dark:before:via-white/20 dark:before:to-emerald-400">
        {STEPS.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-4 sm:gap-6 group">
              {/* Step Number Node */}
              <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shrink-0 ring-4 ring-white dark:ring-[#141414] group-hover:scale-110 transition-transform duration-300">
                <span>{step.banglaNum}</span>
              </div>

              {/* Step Card Content */}
              <div className="flex-1 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181818] p-4 sm:p-5 shadow-xs group-hover:border-slate-400 dark:group-hover:border-white/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                  </div>

                  {/* Step Action Component */}
                  {step.actionType === 'links' && step.links && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {step.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition-colors"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ))}
                    </div>
                  )}

                  {step.actionType === 'badge' && step.badgeText && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 font-mono">
                      {step.badgeText}
                    </span>
                  )}

                  {step.actionType === 'input' && step.badgeText && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40 font-mono">
                      {step.badgeText}
                    </span>
                  )}

                  {step.actionType === 'button' && step.badgeText && (
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs font-mono">
                      {step.badgeText}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {step.desc}
                </p>

                {step.tip && (
                  <div className="mt-2.5 flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] sm:text-xs text-amber-900 dark:text-amber-200">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Outcome Celebration Box */}
      <div className="mt-8 p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-200 mb-1">
            ফলাফল: পূর্ণাঙ্গ মার্কশিট স্ক্রিনে দৃশ্যমান হবে!
          </h4>
          <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed font-sans">
            এখানে আপনার প্রতিটি বিষয়ের প্রাপ্ত গ্রেড (A+, A ইত্যাদি) এবং নম্বর দেখতে পাবেন। ভর্তির আবেদনের জন্য সাথে সাথে একটি স্ক্রিনশট নিন অথবা ব্রাউজারে <strong>Ctrl + P</strong> চেপে PDF কপি সেভ করে রাখুন।
          </p>
        </div>
      </div>
    </div>
  );
}
