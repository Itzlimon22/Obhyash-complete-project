'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Step {
  num: string;
  title: string;
  value?: string;
  description?: string;
  links?: { label: string; url: string }[];
  isAction?: boolean;
}

const STEPS: Step[] = [
  {
    num: '১',
    title: 'ওয়েবসাইট ভিজিট',
    description: 'যেকোনো ব্রাউজারে অফিসিয়াল রেজাল্ট সার্ভার ওপেন করুন',
    links: [
      { label: 'eboardresults.com', url: 'https://eboardresults.com' },
      { label: 'educationboardresults.gov.bd', url: 'http://www.educationboardresults.gov.bd' },
    ],
  },
  {
    num: '২',
    title: 'Examination',
    value: 'HSC / Alim / Equivalent',
    description: 'ড্রপডাউন লিস্ট থেকে পরীক্ষার নাম নির্বাচন করুন',
  },
  {
    num: '৩',
    title: 'Year',
    value: '২০২৬',
    description: 'পাসিং ইয়ার হিসেবে ২০২৬ বেছে নিন',
  },
  {
    num: '৪',
    title: 'Board',
    value: 'আপনার শিক্ষা বোর্ড',
    description: 'যেমন: Dhaka, Rajshahi, Cumilla ইত্যাদি',
  },
  {
    num: '৫',
    title: 'Result Type',
    value: 'Individual Result',
    description: 'ব্যক্তিগত মার্কশিট পেতে অবশ্যই Individual সিলেক্ট করুন',
  },
  {
    num: '৬',
    title: 'Roll & Registration',
    value: 'রোল ও ১০ ডিজিটের রেজি নম্বর',
    description: 'অ্যাডমিট কার্ড দেখে সঠিক নম্বর লিখুন',
  },
  {
    num: '৭',
    title: 'Security Key & Submit',
    value: 'Get Result ↵',
    description: 'ক্যাপচার যোগফল লিখে বাটনে ক্লিক করলেই মার্কশিট দৃশ্যমান হবে',
    isAction: true,
  },
];

export default function ResultStepFlow() {
  return (
    <div className="my-8 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-6 not-prose font-sans">
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isLast = idx === STEPS.length - 1;
          return (
            <div key={step.num} className="relative flex items-start gap-3 sm:gap-4">
              {/* Connecting line */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="absolute left-[13px] sm:left-[15px] top-7 sm:top-8 bottom-[-14px] w-px bg-slate-200 dark:bg-white/10"
                />
              )}

              {/* Number circle */}
              <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-[#181818] text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200 dark:border-white/15 shadow-xs font-anek">
                {step.num}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 font-anek">
                    {step.title}
                  </span>

                  {step.links ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {step.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 px-2 py-0.5 rounded-md transition-colors font-mono"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  ) : step.value ? (
                    <span
                      className={`inline-flex items-center text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-md font-mono ${
                        step.isAction
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
                      }`}
                    >
                      {step.value}
                    </span>
                  ) : null}
                </div>

                {step.description && (
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal font-anek">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
