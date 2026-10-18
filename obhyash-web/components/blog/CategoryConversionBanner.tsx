'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle2, ArrowRight, BookOpen, Smartphone } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

interface CategoryConversionBannerProps {
  category?: string;
  tags?: string[];
  slug?: string;
  placement?: 'in_article' | 'end_of_article';
}

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

export default function CategoryConversionBanner({
  category = '',
  tags = [],
  slug = '',
  placement = 'in_article',
}: CategoryConversionBannerProps) {
  // Determine cohort: SSC, HSC, or General
  const textToCheck = `${category} ${tags.join(' ')} ${slug}`.toLowerCase();
  const isSsc = textToCheck.includes('ssc') || textToCheck.includes('এসএসসি') || textToCheck.includes('দাখিল');
  const isHsc = textToCheck.includes('hsc') || textToCheck.includes('এইচএসসি') || textToCheck.includes('আলিম') || textToCheck.includes('ভর্তি') || textToCheck.includes('admission');

  let badge = 'স্মার্ট এক্সাম প্ল্যাটফর্ম';
  let title = 'ভুল থেকেই শুরু হোক তোমার নিখুঁত প্রস্তুতি';
  let description =
    'হাজারো বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস করো, নিজের ভুলগুলো নোটবুকে জমা রাখো এবং ইনস্ট্যান্ট সমাধান দেখো।';
  let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let registerUrl = '/auth/register';

  if (isSsc) {
    badge = '🎯 এসএসসি স্পেশাল প্রশ্নব্যাংক';
    title = 'এসএসসি বোর্ড পরীক্ষার বিগত ১০ বছরের প্রশ্ন ও নির্ভুল ব্যাখ্যা';
    description =
      'সব শিক্ষা বোর্ডের বিগত বছরের প্রশ্ন অধ্যায়ভিত্তিক সাজানো। রিয়েল টাইমার দিয়ে টেস্ট দাও এবং পাঠ্যবইয়ের প্রমাণসহ সমাধান দেখো।';
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    registerUrl = '/auth/register?stream=SSC';
  } else if (isHsc) {
    badge = '⚡ এইচএসসি ও এডমিশন স্পেশাল';
    title = 'এইচএসসি বোর্ড ও ভার্সিটি ভর্তি পরীক্ষার সম্পূর্ণ প্রস্তুতি';
    description =
      'পদার্থ, রসায়ন, গণিত ও বায়োলজির বিগত ২০ বছরের প্রশ্ন সমাধান। দুর্বল টপিক চিহ্নিত করো এবং নিজের পার্সেন্টাইল র‍্যাংক দেখো।';
    badgeColor = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20';
    registerUrl = '/auth/register?stream=HSC';
  }

  const handleCtaClick = () => {
    trackBlogConversion({
      eventType: 'practice_click',
      sourceSlug: slug || 'blog_banner',
      sourceCategory: isSsc ? 'SSC' : isHsc ? 'HSC' : 'General',
      buttonLocation: placement,
    });
  };

  return (
    <aside
      aria-label="অভ্যাস প্র্যাকটিস ব্যানার"
      className="my-8 sm:my-12 not-prose relative overflow-hidden rounded-3xl border border-emerald-500/25 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-[#0d1614] dark:via-[#0c0e12] dark:to-[#08120e] p-6 sm:p-9 shadow-lg dark:shadow-2xl transition-all duration-300 font-noto"
    >
      {/* Decorative ambient glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-teal-500/10 dark:bg-cyan-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Top Cohort Badge */}
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-[13px] font-bold tracking-tight shadow-2xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${badgeColor}`}>
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>{badge}</span>
          </span>
        </div>

        {/* Main Title */}
        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-[1.3] tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
          {description}
        </p>

        {/* Trust Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>অধ্যায়ভিত্তিক হাজারো MCQ</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>বইয়ের পৃষ্ঠা রেফারেন্সসহ সমাধান</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>১০০% ফ্রি অ্যাকাউন্ট</span>
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Primary High-Converting CTA: ফ্রি প্র্যাকটিস শুরু করো */}
          <Link
            href={registerUrl}
            onClick={handleCtaClick}
            className="group flex items-center justify-center gap-2.5 rounded-2xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white px-6 py-3.5 sm:py-4 font-bold text-sm sm:text-base shadow-[0_4px_16px_rgba(6,95,70,0.35)] hover:shadow-[0_6px_20px_rgba(6,95,70,0.45)] transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>ফ্রি প্র্যাকটিস শুরু করো</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA: সরাসরি ডেমো টেস্ট */}
          <Link
            href="/demo"
            onClick={() =>
              trackBlogConversion({
                eventType: 'demo_exam_start',
                sourceSlug: slug,
                sourceCategory: isSsc ? 'SSC' : isHsc ? 'HSC' : 'General',
                buttonLocation: `${placement}_demo`,
              })
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 px-5 py-3 sm:py-3.5 font-bold text-xs sm:text-sm transition-colors"
          >
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>লগইন ছাড়াই ডেমো পরীক্ষা</span>
          </Link>

          {/* Optional App Link */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackBlogConversion({
                eventType: 'app_download',
                sourceSlug: slug,
                sourceCategory: isSsc ? 'SSC' : isHsc ? 'HSC' : 'General',
                buttonLocation: `${placement}_app`,
              })
            }
            className="hidden md:inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-auto"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>বা অ্যাপ ডাউনলোড করো</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
