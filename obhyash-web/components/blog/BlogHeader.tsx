'use client';

import Link from 'next/link';
import {
  Flame,
  LayoutDashboard,
  BookOpen,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BlogHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm shadow-slate-900/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <Link href="/blog" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 flex items-center justify-center text-slate-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-xl group-hover:scale-105 transition-all duration-300">
            <Flame className="w-[18px] h-[18px]" />
          </div>
          <div className="flex flex-col leading-none font-anek">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              অভ্যাস ব্লগ
            </span>
          </div>
        </Link>

        {/* Center: Nav Links (hidden on mobile) */}
        <nav className="hidden sm:flex items-center gap-1 font-anek">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <BookOpen className="w-3.5 h-3.5" />
            সকল আর্টিকেল
          </Link>
          <Link
            href="/blog/search"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <Search className="w-3.5 h-3.5" />
            আর্টিকেল খুঁজুন
          </Link>
        </nav>

        {/* Right: Search icon (mobile) + Dashboard CTA */}
        <div className="flex items-center gap-2">
          {/* Search icon — mobile only */}
          <Link
            href="/blog/search"
            aria-label="সার্চ"
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-[13px] font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shrink-0 font-anek"
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">ড্যাশবোর্ডে যাও</span>
            <span className="sm:hidden">ড্যাশবোর্ড</span>
            <ArrowRight className="w-3 h-3 hidden sm:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}
