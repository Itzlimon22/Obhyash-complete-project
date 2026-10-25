'use client';

import React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

interface HscPhysicsPdfDownloadCardProps {
  sourceSlug?: string;
  sourceCategory?: string;
}

export default function HscPhysicsPdfDownloadCard({
  sourceSlug = 'ssc-scholarship-britti-result-2026-check',
  sourceCategory = 'HSC',
}: HscPhysicsPdfDownloadCardProps) {
  const handleDownloadClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug,
      sourceCategory,
      buttonLocation: 'physics_pdf_card',
    });
  };

  return (
    <div className="my-8 not-prose rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 p-5 sm:p-6 font-noto transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-zinc-200 shadow-2xs">
            <Download className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                ফ্রি পিডিএফ শিট
              </span>
            </div>
            <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-zinc-100 leading-snug">
              এইচএসসি পদার্থবিজ্ঞান ১ম ও ২য় পত্র: জ্ঞান ও অনুধাবন (ক ও খ)
            </h3>
            <p className="text-xs sm:text-[13.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              বোর্ড পরীক্ষার সকল অধ্যায়ের গুরুত্বপূর্ণ ক ও খ প্রশ্নের গোছানো পিডিএফ সংগ্রহ করো।
            </p>
          </div>
        </div>

        <Link
          href="/notes/hsc-science-ka-kha"
          onClick={handleDownloadClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-slate-900 text-white text-xs sm:text-sm font-semibold transition-all duration-150 shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF ডাউনলোড</span>
        </Link>
      </div>
    </div>
  );
}
