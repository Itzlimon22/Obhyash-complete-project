'use client';

import React from 'react';
import Image from 'next/image';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dblog%26utm_medium%3Dssc_math_post%26utm_campaign%3Dssc_general_math_solution_2026';

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

export default function SscMathAppMockupCard() {
  const handleInstallClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug: 'ssc-general-math-all-board-questions-solution-2026',
      sourceCategory: 'SSC',
      buttonLocation: 'ssc_math_mockup_cta',
    });
  };

  return (
    <div className="my-8 sm:my-10 not-prose flex flex-col items-center">
      {/* PNG Mockup Image */}
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 bg-[#061A22]">
        <Image
          src="/images/blog/s25_pair_cyan_math.png"
          alt="Obhyash App SSC Math Mock Exam"
          width={1200}
          height={1096}
          priority={false}
          className="w-full h-auto object-contain block"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>

      {/* Just ONE Play Store button below the PNG */}
      <div className="mt-5 sm:mt-6 w-full max-w-sm flex justify-center">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-3 py-3 sm:py-3.5 px-6 rounded-2xl bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#020617] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-slate-700/60 cursor-pointer"
        >
          <GooglePlayColorIcon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium tracking-wide uppercase">
              GET IT ON
            </span>
            <span className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight mt-0.5">
              Google Play
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
