'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const PLAY_STORE_URL =
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

  // Extract slug if on a single blog post
  const currentSlug = pathname?.startsWith('/blog/')
    ? pathname.replace('/blog/', '')
    : 'blog_page';

  // Determine cohort category (SSC / HSC / General)
  const cohortCategory = currentSlug.toLowerCase().includes('ssc')
    ? 'SSC'
    : currentSlug.toLowerCase().includes('hsc')
    ? 'HSC'
    : 'General';

  const handleAppDownloadClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug: currentSlug,
      sourceCategory: cohortCategory,
      buttonLocation: 'mobile_sticky',
    });
  };

  return (
    <aside
      aria-label="মোবাইল কুইক অ্যাকশন বার"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-white/10 shadow-[0_-6px_24px_rgba(0,0,0,0.12)] px-3.5 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] transition-all duration-200"
    >
      <div className="max-w-md mx-auto flex items-center gap-2.5">
        {/* Secondary: Sleek Google Play Store Icon Button */}
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAppDownloadClick}
          title="Google Play থেকে অ্যাপ ইনস্টল করো"
          aria-label="Google Play থেকে অ্যাপ ইনস্টল করো"
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-noto font-semibold text-xs shrink-0 transition-colors"
        >
          <GooglePlayStoreIcon className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">অ্যাপ</span>
        </a>

        {/* Primary Dominant CTA: ফ্রি প্র্যাকটিস শুরু করো */}
        <Link
          href="/auth/register"
          onClick={() =>
            trackBlogConversion({
              eventType: 'practice_click',
              sourceSlug: currentSlug,
              sourceCategory: cohortCategory,
              buttonLocation: 'mobile_sticky_primary',
            })
          }
          className="group flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white font-noto font-bold text-[14px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-center"
        >
          <span>ফ্রি প্র্যাকটিস শুরু করো</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Link>
      </div>
    </aside>
  );
}
