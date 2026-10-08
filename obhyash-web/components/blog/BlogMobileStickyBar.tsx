'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, ArrowRight, Bell } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const BASE_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

// Crisp Google Play Store SVG Icon
function GooglePlayStoreIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

export default function BlogMobileStickyBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Extract slug if on a single blog post
  const currentSlug = pathname?.startsWith('/blog/')
    ? pathname.replace('/blog/', '')
    : 'blog_page';

  const isScholarshipPost = currentSlug === 'ssc-scholarship-britti-result-2026-check';

  // 30-40% scroll depth trigger
  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = (scrollTop / docHeight) * 100;
      if (scrollPercent >= 30) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (isDismissed || !isVisible) {
    return null;
  }

  // Targeted Play Store link with referrer tracking
  const playStoreReferrer = isScholarshipPost
    ? encodeURIComponent('utm_source=blog&utm_medium=cta&utm_campaign=ssc_britti_2026&utm_content=sticky')
    : encodeURIComponent(`utm_source=blog&utm_medium=cta&utm_campaign=general_blog&utm_content=${currentSlug}`);

  const playStoreUrl = `${BASE_PLAY_STORE_URL}&referrer=${playStoreReferrer}`;

  const handleAppDownloadClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug: currentSlug,
      buttonLocation: 'mobile_sticky',
    });
  };

  return (
    <aside
      aria-label="মোবাইল কুইক অ্যাকশন বার"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-white/10 shadow-[0_-6px_24px_rgba(0,0,0,0.12)] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] transition-all duration-300 animate-in slide-in-from-bottom"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
        {/* Left: Contextual Text */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 font-anek truncate">
              {isScholarshipPost ? 'বৃত্তির গেজেট নোটিফিকেশন' : 'অভ্যাস লার্নিং অ্যাপ'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-hind truncate">
              {isScholarshipPost ? 'বোর্ডের তালিকা প্রকাশ পেলেই অ্যালার্ট' : 'ফ্রি প্র্যাকটিস ও লাইভ টেস্ট'}
            </p>
          </div>
        </div>

        {/* Right: Direct Play Store Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAppDownloadClick}
            className="group relative flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white font-anek font-bold text-[13px] shadow-sm transition-all text-center"
          >
            <GooglePlayStoreIcon className="w-4 h-4 flex-shrink-0" />
            <span className="tracking-wide">ইনস্টল করুন</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
