'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X, Sparkles, Clock, BookOpen } from 'lucide-react';
import { BlogPost } from '@/lib/blog-data';

interface NextPostFloaterProps {
  currentSlug: string;
  nextPost: BlogPost | null;
}

export default function NextPostFloater({
  currentSlug,
  nextPost,
}: NextPostFloaterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissedSlugs = sessionStorage.getItem('obhyash_dismissed_next_posts');
      if (dismissedSlugs) {
        const list = JSON.parse(dismissedSlugs);
        return Array.isArray(list) && list.includes(currentSlug);
      }
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;

      const scrollPercent = (window.scrollY / totalHeight) * 100;

      // Show floater once user has read 45% or more of the article
      if (scrollPercent >= 45) {
        setIsVisible(true);
      } else if (scrollPercent < 25) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!nextPost || isDismissed || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const dismissed = JSON.parse(
        sessionStorage.getItem('obhyash_dismissed_next_posts') || '[]',
      );
      sessionStorage.setItem(
        'obhyash_dismissed_next_posts',
        JSON.stringify([...dismissed, currentSlug]),
      );
    } catch {
      // ignore
    }
  };

  return (
    <aside
      aria-label="পরবর্তী পড়ার জন্য সাজেস্টেড পোস্ট"
      className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-[360px] sm:max-w-[400px] w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative p-4 rounded-2xl bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="বন্ধ করুন"
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Tag */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-noto">
            <Sparkles className="w-3 h-3" /> পরবর্তী আর্টিকেল
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-noto flex items-center gap-1">
            <Clock className="w-3 h-3" /> {nextPost.readTime} মিনিট
          </span>
        </div>

        {/* Title */}
        <Link
          href={`/blog/${nextPost.slug}`}
          className="group block font-noto"
        >
          <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
            {nextPost.title}
          </h4>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-rose-500" />
              {nextPost.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform">
              পড়ুন <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
