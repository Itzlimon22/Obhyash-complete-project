'use client';

import Link from 'next/link';
import { Flame, LayoutDashboard, BookOpen, ArrowRight } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link href="/blog" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30 group-hover:scale-110 group-hover:shadow-rose-500/50 transition-all duration-300">
            <Flame className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Obhyash
            </span>
            <span className="text-[10px] font-semibold text-rose-500 tracking-widest uppercase">
              Blog
            </span>
          </div>
        </Link>

        {/* Center: Nav Links (hidden on small mobile) */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <BookOpen className="w-3.5 h-3.5" />
            All Posts
          </Link>
        </nav>

        {/* Right: Dashboard CTA */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shrink-0"
        >
          <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">Go to Dashboard</span>
          <span className="xs:hidden sm:hidden">Dashboard</span>
          <ArrowRight className="w-3 h-3 hidden sm:block" />
        </Link>
      </div>
    </header>
  );
}
