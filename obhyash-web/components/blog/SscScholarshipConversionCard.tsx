'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dblog%26utm_medium%3Dcta%26utm_campaign%3Dssc_britti_2026';

// Crisp Official Google Play Store Vector Icon
function GooglePlayColorIcon({ className = 'w-7 h-7 sm:w-8 sm:h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3.609 1.814L13.793 12 3.61 22.186A2.37 2.37 0 0 1 3 20.5V3.5c0-.653.228-1.25.609-1.686z"
        fill="#00E676"
      />
      <path
        d="M17.228 8.565L5.05 1.733A2.348 2.348 0 0 0 3.61 1.814L13.793 12l3.435-3.435z"
        fill="#FFD600"
      />
      <path
        d="M3.609 22.186c.433.155.932.124 1.44-.162l12.179-6.832L13.793 12 3.61 22.186z"
        fill="#FF1744"
      />
      <path
        d="M20.893 10.627l-3.665-2.062L13.793 12l3.435 3.435 3.665-2.062a1.58 1.58 0 0 0 0-2.746z"
        fill="#00B0FF"
      />
    </svg>
  );
}

interface SscScholarshipConversionCardProps {
  variant?: 'board-alert' | 'college-prep';
}

export default function SscScholarshipConversionCard({
  variant = 'board-alert',
}: SscScholarshipConversionCardProps) {
  const isAlert = variant === 'board-alert';

  const handleDownloadClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug: 'ssc-scholarship-britti-result-2026-check',
      sourceCategory: 'SSC',
      buttonLocation: 'scholarship_card',
    });
  };

  return (
    <div className="my-8 sm:my-10 not-prose rounded-2xl bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 font-noto transition-all duration-200">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{isAlert ? 'বোর্ড নোটিফিকেশন অ্যালার্ট' : 'স্মার্ট লার্নিং অ্যাপ'}</span>
        </span>

        {/* 1. Main Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 font-noto leading-snug tracking-tight mb-2.5">
          {isAlert
            ? 'বৃত্তির তালিকা প্রকাশের সঙ্গে সঙ্গেই মোবাইলে নোটিফিকেশন পেতে চাও?'
            : 'কলেজের প্রথম দিন থেকেই পড়াশোনায় এগিয়ে থাকো।'}
        </h2>

        {/* 2. Subtitle / Description */}
        <p className="text-sm sm:text-[15px] text-slate-600 dark:text-zinc-400 font-noto leading-relaxed mb-6">
          {isAlert
            ? 'শিক্ষা বোর্ডের মেধা ও সাধারণ বৃত্তির অফিসিয়াল গেজেট প্রকাশমাত্রই ফোনে অ্যালার্ট পেতে অভ্যাস অ্যাপের সাথে থাকো।'
            : 'অধ্যায়ভিত্তিক টেস্ট দাও, আর প্রতিটি ভুলের সহজ ব্যাখ্যা দেখে প্রস্তুতি গুছিয়ে নাও।'}
        </p>

        {/* 3. Sleek Google Play Pill Button */}
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            className="inline-flex items-center gap-3 py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 shadow-xs hover:shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <GooglePlayColorIcon className="w-5 h-5 shrink-0" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] text-slate-300 dark:text-zinc-500 font-medium">
                ফ্রি ডাউনলোড
              </span>
              <span className="text-sm font-bold font-sans tracking-tight mt-0.5">
                Google Play
              </span>
            </div>
          </a>

          <Link
            href="/demo"
            className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 font-noto font-medium transition-colors"
          >
            ডেমো টেস্ট দিয়ে দেখো →
          </Link>
        </div>
      </div>
    </div>
  );
}
