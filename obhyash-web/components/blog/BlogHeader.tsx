'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  X,
  Facebook,
  Menu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import BlogThemeToggle from './BlogThemeToggle';
import ProgressBar from './ProgressBar';
import BlogSearchModal from './BlogSearchModal';
import { BlogPost } from '@/lib/blog-data';

// Crisp YouTube SVG Icon with transparent knockout play triangle
const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.782C18.256 3.9 12 3.9 12 3.9s-6.256 0-7.814.504A2.506 2.506 0 0 0 2.418 6.186C2 7.754 2 11 2 11s0 3.246.418 4.814a2.506 2.506 0 0 0 1.768 1.782c1.558.504 7.814.504 7.814.504s6.256 0 7.814-.504a2.506 2.506 0 0 0 1.768-1.782C22 14.246 22 11 22 11s0-3.246-.418-4.814zM10 14.5V7.5L16 11l-6 3.5z"
    />
  </svg>
);

function NavLinks() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTag = searchParams?.get('tag') ?? '';
  const isHomeActive = pathname === '/blog' && !currentTag;

  const navItems = [
    { label: 'Home', href: '/blog', active: isHomeActive },
    { label: 'HSC 2027', href: '/blog?tag=HSC 2027', active: currentTag === 'HSC 2027' },
    { label: 'HSC 2026', href: '/blog?tag=HSC 2026', active: currentTag === 'HSC 2026' },
    { label: 'Admission', href: '/blog?tag=বিশ্ববিদ্যালয় ভর্তি', active: currentTag === 'বিশ্ববিদ্যালয় ভর্তি' },
    { label: 'Study Hacks', href: '/blog?tag=পড়ার কৌশল', active: currentTag === 'পড়ার কৌশল' },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-1 font-['Poppins',sans-serif] text-[14px]">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
            item.active
              ? 'bg-[#059669] text-white font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

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
          {/* ─── 1. LEFT: LOGO (Exact same logo as obhyash.com) ─── */}
          <Link href="/blog" className="flex items-center group shrink-0" aria-label="অভ্যাস ব্লগ হোমপেজ">
            {/* Light mode logo */}
            <Image
              src="/obhyash_full_logo.svg"
              alt="অভ্যাস"
              width={132}
              height={34}
              className="h-7 sm:h-8 w-auto object-contain dark:hidden group-hover:opacity-90 transition-opacity"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/obhyash_full_logo_dark.svg"
              alt="অভ্যাস"
              width={132}
              height={34}
              className="h-7 sm:h-8 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          {/* ─── 2. CENTER: NAVIGATION MENU (Dynamic Active State, Clean Normal Styling) ─── */}
          <Suspense fallback={<div className="hidden lg:block w-96 h-8" />}>
            <NavLinks />
          </Suspense>

          {/* ─── 3. RIGHT: FREE EXAM CTA + ACTIONS ─── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Social Icons (Facebook & YouTube) - Desktop only */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <a
                href="https://facebook.com/obhyash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://youtube.com/@obhyash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
              >
                <YouTubeIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Subtle Divider (Desktop only) */}
            <div className="hidden lg:block w-[1px] h-5 bg-slate-200 dark:bg-white/10" />

            {/* Free Exam Button (ফ্রি এক্সাম দাও) */}
            <Link
              href="/demo"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#059669] hover:bg-[#047857] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 hover:shadow transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
              <span>ফ্রি এক্সাম দাও</span>
            </Link>

            {/* Dark / Light Mode Toggle (Matching circular button) */}
            <BlogThemeToggle />

            {/* Search Button (Normal sleek circular) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              title="Search articles (Ctrl+K)"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#059669] hover:bg-[#047857] shadow-sm transition-colors shrink-0"
            >
              <Search className="w-4 h-4 text-white stroke-[2.2]" />
            </button>

            {/* Burger Menu Button (Normal sleek circular with 3-line Menu) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Canvas Menu"
              title="Menu"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#059669] hover:bg-[#047857] shadow-sm transition-colors shrink-0"
            >
              <Menu className="w-5 h-5 text-white" />
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
              className="flex items-center"
              aria-label="অভ্যাস ব্লগ"
            >
              <Image
                src="/obhyash_full_logo.svg"
                alt="অভ্যাস"
                width={120}
                height={30}
                className="h-7 w-auto object-contain dark:hidden"
              />
              <Image
                src="/obhyash_full_logo_dark.svg"
                alt="অভ্যাস"
                width={120}
                height={30}
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </Link>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Free Exam CTA Banner in Drawer */}
          <div className="py-4 border-b border-slate-100 dark:border-white/5">
            <Link
              href="/demo"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/40" />
              <span>ফ্রি এক্সাম দাও (ডেমো টেস্ট)</span>
            </Link>
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
              <YouTubeIcon className="w-4 h-4" />
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
