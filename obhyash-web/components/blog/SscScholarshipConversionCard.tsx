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
    <div className="my-8 sm:my-10 not-prose rounded-3xl bg-[#111417] text-white p-6 sm:p-10 shadow-xl border border-white/5 font-noto transition-all duration-300">
      {/* 1. Main Title */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-noto leading-[1.25] tracking-tight mb-3">
        {isAlert
          ? 'বৃত্তির তালিকা এলেই সরাসরি ফোনে নোটিফিকেশন পাবে।'
          : 'কলেজের প্রথম দিন থেকেই এগিয়ে থাকো।'}
      </h2>

      {/* 2. Subtitle / Description */}
      <p className="text-sm sm:text-base md:text-lg text-slate-300 font-noto leading-relaxed mb-8 max-w-2xl">
        {isAlert
          ? 'তোমার শিক্ষা বোর্ডের মেধা ও সাধারণ বৃত্তির গেজেট প্রকাশমাত্রই মোবাইলে অ্যালার্ট পেতে যুক্ত হও অভ্যাস অ্যাপে।'
          : 'অধ্যায়ভিত্তিক ফ্রি টেস্ট দাও, আর প্রতিটি ভুলের ব্যাখ্যাসহ সমাধান দেখে নাও।'}
      </p>

      {/* 3. Big White Google Play Download Pill Button */}
      <div className="flex flex-col items-center">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          className="w-full max-w-xl flex items-center justify-center gap-3.5 py-3 sm:py-3.5 px-6 rounded-2xl bg-[#F1F3F4] hover:bg-white text-slate-900 shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <GooglePlayColorIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-noto -mb-0.5">
              বিনামূল্যে ডাউনলোড
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
              Google Play
            </span>
          </div>
        </a>

        {/* 4. Secondary Action Link: ডেমো টেস্ট দিয়ে দেখো */}
        <div className="mt-5 text-center">
          <Link
            href="/demo"
            className="text-sm sm:text-base text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-400 hover:decoration-white font-noto font-medium transition-colors"
          >
            ডেমো টেস্ট দিয়ে দেখো
          </Link>
        </div>

        {/* 5. Google Play Verified App Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-400 font-noto">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Google Play ভেরিফাইড অ্যাপ</span>
        </div>
      </div>
    </div>
  );
}
