'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  Facebook,
  Youtube,
  Send,
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

  // Lock body scroll when drawer is open
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
      {/* Katen Top Reading Progress Bar */}
      <ProgressBar />

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 font-anek ${
          scrolled
            ? 'bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 shadow-sm'
            : 'bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Logo (Katen Minimal Style) */}
          <Link href="/blog" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#fe4f70] to-[#ffa387] p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white dark:bg-[#181818] rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                <Image
                  src="/obhyash_mark.svg"
                  alt="Obhyash Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  অভ্যাস
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white rounded-full">
                  ম্যাগাজিন
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
                স্মার্ট স্টাডি ও এক্সাম গাইড
              </span>
            </div>
          </Link>

          {/* Center: Main Navigation (Katen clean desktop nav) */}
          <nav className="hidden lg:flex items-center gap-1.5 font-anek">
            <Link
              href="/blog"
              className="px-3.5 py-2 text-[14px] font-bold text-slate-900 dark:text-white hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              হোম
            </Link>
            <Link
              href="/blog?tag=HSC 2027"
              className="px-3.5 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              এইচএসসি ২০২৭
            </Link>
            <Link
              href="/blog?tag=HSC 2026"
              className="px-3.5 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              এইচএসসি ২০২৬
            </Link>
            <Link
              href="/blog?tag=বিশ্ববিদ্যালয় ভর্তি"
              className="px-3.5 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              ভর্তি পরীক্ষা
            </Link>
            <Link
              href="/blog?tag=পড়ার কৌশল"
              className="px-3.5 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              স্টাডি হ্যাকস
            </Link>
          </nav>

          {/* Right: Katen Header Buttons (Search, Theme Toggle, Drawer, Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Button (Katen Circular Button) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="আর্টিকেল সার্চ করুন"
              title="সার্চ করুন (Ctrl+K)"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#fe4f70] hover:to-[#ffa387] hover:text-white transition-all duration-300 shadow-sm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <BlogThemeToggle />

            {/* Katen Burger Menu Button (Canvas Menu Drawer) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="মেনু খুলুন"
              title="অফ-ক্যানভাস মেনু"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Student Dashboard CTA */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387] hover:from-[#e1365b] hover:to-[#ff9170] text-white text-xs sm:text-[13px] font-bold shadow-md shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ড্যাশবোর্ড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Katen Off-Canvas Canvas Menu Drawer ─── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-[101] w-80 sm:w-96 bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out font-anek ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header & Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center gap-2.5"
            >
              <Image
                src="/obhyash_mark.svg"
                alt="Obhyash Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-black text-slate-900 dark:text-white">
                অভ্যাস
              </span>
            </Link>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* About Obhyash Brief */}
          <div className="py-6 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              অভ্যাস ম্যাগাজিন সম্পর্কে
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              বাংলাদেশের শিক্ষার্থীদের জন্য পূর্ণাঙ্গ স্মার্ট এক্সাম, বোর্ড প্রশ্ন ব্যাংক ও স্টাডি গাইড প্ল্যাটফর্ম। সেরা কৌশলে পড়ো, আত্মবিশ্বাসের সাথে পরীক্ষা দাও।
            </p>
          </div>

          {/* Drawer Navigation Links */}
          <div className="py-6 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              নেভিগেশন
            </h4>
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              <span>সকল আর্টিকেল</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blog?tag=HSC 2027"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              <span>এইচএসসি ২০২৭ সিলেবাস ও গাইড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blog?tag=HSC 2026"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
            >
              <span>এইচএসসি ২০২৬ রিভিশন ও রুটিন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 text-sm font-bold text-[#fe4f70] hover:underline"
            >
              <span>স্টুডেন্ট প্র্যাকটিস ড্যাশবোর্ড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Drawer Footer Socials */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://facebook.com/obhyash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com/@obhyash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/obhyash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
            >
              <Send className="w-4 h-4" />
            </a>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-4">
            © {new Date().getFullYear()} অভ্যাস (Obhyash)
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
