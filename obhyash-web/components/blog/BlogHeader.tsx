'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  X,
  Facebook,
  Menu,
  ArrowRight,
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

          {/* ─── 2. CENTER: NAVIGATION MENU (Dynamic Active State, Clean Normal Styling) ─── */}
          <Suspense fallback={<div className="hidden lg:block w-96 h-8" />}>
            <NavLinks />
          </Suspense>

          {/* ─── 3. RIGHT: SOCIAL ICONS + SLEEK MATCHING ACTION BUTTONS ─── */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            {/* Social Icons (Facebook & YouTube) */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
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

            {/* Subtle Divider */}
            <div className="hidden sm:block w-[1px] h-5 bg-slate-200 dark:bg-white/10" />

            {/* Dark / Light Mode Toggle (Matching 40x40 circular) */}
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
