'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { trackBlogConversion } from '@/lib/track-blog-conversion';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export interface LiveExamAppMockupCardProps {
  sourceSlug?: string;
  sourceCategory?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
}

// Crisp Official Google Play Store Vector Icon
function GooglePlayColorIcon({ className = 'w-7 h-7 sm:w-8 sm:h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function LiveExamAppMockupCard({
  sourceSlug = 'medical-admission-circular-2026-guide',
  sourceCategory = 'ভর্তি ও প্রস্তুতি',
  badge,
  title,
  subtitle,
}: LiveExamAppMockupCardProps) {
  const encodedSlug = encodeURIComponent(sourceSlug);
  const playStoreUrl = `https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dblog%26utm_medium%3Dlive_exam_mockup%26utm_campaign%3D${encodedSlug}`;

  const handleInstallClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug,
      sourceCategory,
      buttonLocation: 'live_exam_mockup_cta',
    });
  };

  // Smart Contextual Defaults if not explicitly passed
  const displayBadge = badge || '⚡ সম্পূর্ণ ফ্রি লাইভ পরীক্ষা ও মডেল টেস্ট';
  const displayTitle =
    title || 'বুয়েট, মেডিকেল, ভার্সিটি ও বোর্ড পরীক্ষার লাইভ প্রস্তুতি অভ্যাস অ্যাপে';
  const displaySubtitle =
    subtitle ||
    'হুবহু ভর্তি ও বোর্ড পরীক্ষার ওএমআর নিয়মে পরীক্ষা দাও, পরীক্ষা শেষে সাথে সাথে জাতীয় মেধা তালিকা ও ভুলের বিশদ ব্যাখ্যা দেখে প্রস্তুতি ঝালিয়ে নাও।';

  return (
    <div className="my-10 sm:my-14 not-prose relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/25 bg-gradient-to-b from-slate-900 via-[#0a1816] to-[#040e0c] text-white p-6 sm:p-10 shadow-2xl transition-all duration-300">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs sm:text-[13px] font-semibold tracking-wide mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{displayBadge}</span>
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-noto tracking-tight text-white max-w-2xl leading-snug mb-3">
          {displayTitle}
        </h3>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 max-w-xl font-noto leading-relaxed mb-8">
          {displaySubtitle}
        </p>

        {/* Phone Mockup Frame */}
        <div className="relative w-full max-w-[270px] sm:max-w-[310px] md:max-w-[330px] my-2 transition-transform duration-300 hover:scale-[1.01]">
          {/* Ambient phone back-glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 rounded-[44px] blur-2xl transform scale-90 -z-10" />

          <Image
            src="/images/blog/obhyash-live-exam-mockup.png"
            alt="অভ্যাস অ্যাপ - লাইভ পরীক্ষা (ইঞ্জিনিয়ারিং, মেডিকেল, ভার্সিটি ক-ইউনিট, এইচএসসি)"
            width={515}
            height={1024}
            priority={false}
            className="w-full h-auto object-contain block drop-shadow-[0_25px_50px_rgba(0,0,0,0.65)]"
            sizes="(max-width: 640px) 270px, (max-width: 768px) 310px, 330px"
          />
        </div>

        {/* Google Play Store Download Button below the Mockup */}
        <div className="mt-8 w-full max-w-sm flex flex-col items-center">
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInstallClick}
            className="group relative w-full flex items-center justify-center gap-3.5 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-sans shadow-[0_10px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_30px_rgba(16,185,129,0.25)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-white/80 cursor-pointer select-none"
          >
            <GooglePlayColorIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-bold tracking-wider uppercase">
                  GET IT ON
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  ফ্রি ইনস্টল
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-sans tracking-tight">
                Google Play
              </span>
            </div>
          </a>

          {/* Value Props & Trust Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-300 font-noto">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ১০০% ফ্রি লাইভ পরীক্ষা
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              তাৎক্ষণিক সমাধান ও বিশ্লেষণ
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              দেশসেরা লিডারবোর্ড
            </span>
          </div>

          {/* Browser fallback link */}
          <Link
            href="/demo"
            className="mt-3 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-noto font-medium transition-colors"
          >
            বা সরাসরি ব্রাউজারে ডেমো টেস্ট দাও →
          </Link>
        </div>
      </div>
    </div>
  );
}

