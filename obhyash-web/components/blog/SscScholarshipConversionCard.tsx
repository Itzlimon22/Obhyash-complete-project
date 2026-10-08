'use client';

import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dblog%26utm_medium%3Dcta%26utm_campaign%3Dssc_britti_2026';

function GooglePlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
      sourceCategory: 'নোটিশ ও শিক্ষা আপডেট',
      buttonLocation: 'in_article',
    });
  };

  return (
    <div className="my-8 not-prose rounded-2xl sm:rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 dark:from-emerald-950/30 dark:via-[#0f1715] dark:to-teal-950/20 p-5 sm:p-7 shadow-md transition-all duration-300 font-sans">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        {/* Left: App Identity + Authentic Value Hook */}
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#065f46] to-[#10b981] p-0.5 shadow-md shrink-0 flex items-center justify-center text-white">
            <span className="font-extrabold text-2xl sm:text-3xl font-anek tracking-tight">অ</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-hind">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {isAlert ? 'বোর্ড নোটিফিকেশন অ্যালার্ট' : 'একাদশ শ্রেণির প্রস্তুতি'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-hind">
                অফিশিয়াল অ্যান্ড্রয়েড অ্যাপ
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 font-anek leading-tight">
              {isAlert
                ? 'বৃত্তির তালিকা এলেই সরাসরি ফোনে নোটিফিকেশন পাবে'
                : 'কলেজে প্রথম দিন থেকেই এগিয়ে থাকতে ফ্রি প্র্যাকটিস করো'}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-hind leading-relaxed">
              {isAlert
                ? 'তোমার শিক্ষা বোর্ডের মেধা ও সাধারণ বৃত্তির গেজেট প্রকাশমাত্রই ফোনে নোটিফিকেশন পেতে যুক্ত হও অভ্যাস অ্যাপে।'
                : 'একাদশের জন্য তোমার বেসিক কেমন তা যাচাই করো। অধ্যায়ভিত্তিক ফ্রি টেস্ট ও সমাধান দেখতে ডাউনলোড করো অভ্যাস।'}
            </p>
          </div>
        </div>

        {/* Right: Direct 1-Click Play Store Action */}
        <div className="w-full md:w-auto shrink-0 flex flex-col items-center sm:items-end gap-2.5">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white font-anek font-bold text-base shadow-md hover:shadow-lg transition-all group scale-100 hover:scale-[1.02]"
          >
            <GooglePlayIcon className="w-5 h-5 shrink-0" />
            <span>Play Store থেকে ইনস্টল করুন</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-hind">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Play ভেরিফাইড অ্যাপ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
