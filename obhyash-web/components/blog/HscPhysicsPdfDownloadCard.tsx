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
    <div className="my-6 not-prose rounded-xl bg-[#083344] text-white p-4 sm:p-5 border border-cyan-900/60 font-noto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            এইচএসসি পদার্থবিজ্ঞান ১ম ও ২য় পত্র: জ্ঞান ও অনুধাবন (ক ও খ) শিট
          </h3>
          <p className="text-xs sm:text-sm text-cyan-100/75">
            বোর্ড পরীক্ষার সকল অধ্যায়ের গুরুত্বপূর্ণ ক ও খ প্রশ্নের গোছানো পিডিএফ।
          </p>
        </div>

        <Link
          href="/notes/hsc-science-ka-kha"
          onClick={handleDownloadClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-[#6b1414] text-white text-sm font-semibold transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-white" />
          <span>PDF ডাউনলোড করো</span>
        </Link>
      </div>
    </div>
  );
}
