'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ChevronDown,
  X,
  Facebook,
  Youtube,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import BlogThemeToggle from './BlogThemeToggle';
import ProgressBar from './ProgressBar';
import BlogSearchModal from './BlogSearchModal';
import { BlogPost } from '@/lib/blog-data';

interface BlogHeaderProps {
  posts?: BlogPost[];
}

export default function BlogHeader({ posts = [] }: BlogHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when off-canvas drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Top Reading Progress Bar */}
      <ProgressBar />

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 font-sans ${
          scrolled
            ? 'bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-white/10 shadow-sm'
            : 'bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between gap-4">
          {/* ─── 1. LEFT: LOGO (Obhyash.) ─── */}
          <Link href="/blog" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/obhyash_mark.svg"
                alt="Obhyash"
                width={30}
                height={30}
                className="object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#203656] dark:text-white font-['Poppins',sans-serif]">
              Obhyash<span className="text-[#059669] dark:text-[#10b981]">.</span>
            </span>
          </Link>

          {/* ─── 2. CENTER: NAVIGATION MENU (3D Deep Green Active Pill) ─── */}
          <nav className="hidden lg:flex items-center gap-7 font-['Poppins',sans-serif] text-[14.5px]">
            {/* Active Pill: 3D Deep Green */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white font-bold shadow-[0_3px_0_0_#064e3b,0_5px_12px_rgba(6,78,59,0.3)] hover:shadow-[0_2px_0_0_#064e3b] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150"
            >
              <span>Home</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-90" />
            </Link>

            <Link
              href="/blog?tag=HSC 2027"
              className="font-medium text-[#79889e] dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              HSC 2027
            </Link>

            <Link
              href="/blog?tag=HSC 2026"
              className="font-medium text-[#79889e] dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              HSC 2026
            </Link>

            <Link
              href="/blog?tag=বিশ্ববিদ্যালয় ভর্তি"
              className="inline-flex items-center gap-1 font-medium text-[#79889e] dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              <span>Admission</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <Link
              href="/blog?tag=পড়ার কৌশল"
              className="inline-flex items-center gap-1 font-medium text-[#79889e] dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              <span>Study Hacks</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </nav>

          {/* ─── 3. RIGHT: ONLY FACEBOOK & YOUTUBE + 3D DEEP GREEN BUTTONS ─── */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons (Only Facebook & YouTube) */}
            <div className="flex items-center gap-3 text-[#203656] dark:text-slate-300">
              <a
                href="https://facebook.com/obhyash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#059669] dark:hover:text-[#34d399] transition-all"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://youtube.com/@obhyash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#059669] dark:hover:text-[#34d399] transition-all"
              >
                <Youtube className="w-4 h-4 fill-current" />
              </a>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-[1px] h-6 bg-slate-200 dark:bg-white/10" />

            {/* Dark / Light Mode Toggle */}
            <BlogThemeToggle />

            {/* ─── BUTTON 1: 3D DEEP GREEN CIRCULAR SEARCH BUTTON ─── */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              title="Search articles (Ctrl+K)"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] shadow-[0_4px_0_0_#064e3b,0_6px_14px_rgba(6,78,59,0.35)] hover:shadow-[0_2px_0_0_#064e3b,0_3px_8px_rgba(6,78,59,0.35)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150 shrink-0"
            >
              <Search className="w-4 h-4 text-white stroke-[2.4]" />
            </button>

            {/* ─── BUTTON 2: 3D DEEP GREEN CIRCULAR BURGER BUTTON (=) ─── */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Canvas Menu"
              title="Menu"
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1.5 text-white bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] shadow-[0_4px_0_0_#064e3b,0_6px_14px_rgba(6,78,59,0.35)] hover:shadow-[0_2px_0_0_#064e3b,0_3px_8px_rgba(6,78,59,0.35)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150 shrink-0"
            >
              {/* Katen signature 2 white horizontal bars */}
              <span className="w-4 h-[2px] bg-white rounded-full block shadow-sm" />
              <span className="w-4 h-[2px] bg-white rounded-full block shadow-sm" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── OFF-CANVAS DRAWER MENU ─── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-[101] w-80 sm:w-96 bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out font-sans ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header & Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center gap-2"
            >
              <span className="text-2xl font-extrabold tracking-tight text-[#203656] dark:text-white font-['Poppins',sans-serif]">
                Obhyash<span className="text-[#059669]">.</span>
              </span>
            </Link>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* About Obhyash Brief */}
          <div className="py-6 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 font-anek">
              অভ্যাস ম্যাগাজিন সম্পর্কে
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-anek">
              বাংলাদেশের শিক্ষার্থীদের জন্য পূর্ণাঙ্গ স্মার্ট এক্সাম, বোর্ড প্রশ্ন ব্যাংক ও স্টাডি গাইড প্ল্যাটফর্ম।
            </p>
          </div>

          {/* Drawer Navigation Links */}
          <div className="py-6 space-y-3 font-anek">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              নেভিগেশন
            </h4>
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              <span>সকল আর্টিকেল (Home)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blog?tag=HSC 2027"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              <span>এইচএসসি ২০২৭ সিলেবাস ও গাইড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blog?tag=HSC 2026"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
            >
              <span>এইচএসসি ২০২৬ রিভিশন ও রুটিন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-[#059669] hover:underline"
            >
              <span>স্টুডেন্ট প্র্যাকটিস ড্যাশবোর্ড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Drawer Footer Socials (Only Facebook & YouTube) */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://facebook.com/obhyash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#059669] hover:text-white flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm"
            >
              <Facebook className="w-4 h-4 fill-current" />
            </a>
            <a
              href="https://youtube.com/@obhyash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#059669] hover:text-white flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm"
            >
              <Youtube className="w-4 h-4 fill-current" />
            </a>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-4">
            © {new Date().getFullYear()} Obhyash. All rights reserved.
          </p>
        </div>
      </div>

      {/* Live Search Modal */}
      <BlogSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={posts}
      />
    </>
  );
}
