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
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Text "আনলিমিটেড এক্সাম দাও" */}
        <Link
          href="/demo"
          onClick={() =>
            trackBlogConversion({
              eventType: 'practice_click',
              sourceSlug: currentSlug,
              sourceCategory: cohortCategory,
              buttonLocation: 'mobile_sticky_left_text',
            })
          }
          className="flex items-center min-w-0 flex-1 py-1 group"
        >
          <span className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-slate-100 font-noto truncate tracking-tight group-hover:text-[#0e7490] dark:group-hover:text-cyan-400 transition-colors">
            আনলিমিটেড এক্সাম দাও
          </span>
        </Link>

        {/* Right: Deep Green: App Download Button */}
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAppDownloadClick}
          className="group relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white font-noto font-bold text-[13px] sm:text-[14px] shadow-sm hover:shadow-md transition-all duration-150 text-center shrink-0"
        >
          <GooglePlayStoreIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate tracking-wide">App Download</span>
        </a>
      </div>
    </aside>
  );
}
