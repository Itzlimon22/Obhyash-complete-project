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
  LayoutDashboard,
  Bookmark,
  Download,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import BlogThemeToggle from './BlogThemeToggle';
import ProgressBar from './ProgressBar';
import BlogSearchModal from './BlogSearchModal';
import { BlogPost } from '@/lib/blog-data';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

// Authentic Google Play Store Icon
const GooglePlayIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
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

// Custom crafted "Writing on Paper / Exam Test" SVG Icon
const WritingOnPaperIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Paper Sheet Shadow/Back Layer */}
    <rect x="4" y="3" width="13" height="18" rx="2" fill="currentColor" fillOpacity="0.15" />
    
    {/* Exam Paper Sheet Outline */}
    <path
      d="M5 4C5 2.89543 5.89543 2 7 2H13.5858C14.1162 2 14.6249 2.21071 14.9999 2.58579L18.4142 6C18.7893 6.37508 19 6.88378 19 7.41421V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Folded paper corner notch */}
    <path
      d="M13.5 2V5.5C13.5 6.60457 14.3954 7.5 15.5 7.5H19"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Paper Header / Exam MCQ Checkmarks & Answer Lines */}
    {/* Line 1 with checkmark */}
    <path
      d="M7.5 7.5L8.2 8.2L9.5 6.8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.8 7.5H12"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />

    {/* Line 2 with checkmark */}
    <path
      d="M7.5 11.5L8.2 12.2L9.5 10.8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.8 11.5H13"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />

    {/* Line 3 (being actively written) */}
    <path
      d="M7.5 15.5H11.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    {/* Line 4 */}
    <path
      d="M7.5 18.5H10.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />

    {/* Tilted Fountain/Ballpoint Pen actively writing on paper */}
    <g transform="translate(1, 0)">
      {/* Pen nib touching paper */}
      <path
        d="M13.2 19.8L12.5 20.5L13.8 20L13.2 19.8Z"
        fill="currentColor"
      />
      {/* Pen body angled */}
      <path
        d="M13.8 20L12.5 20.5L13 19.2L19.3 12.9C19.7 12.5 20.3 12.5 20.7 12.9L21.1 13.3C21.5 13.7 21.5 14.3 21.1 14.7L13.8 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Pen clip/collar ring */}
      <path
        d="M18.2 14L19.8 15.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

function NavLinks() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTag = searchParams?.get('tag') ?? '';
  const currentCat = searchParams?.get('category') ?? '';
  const isHomeActive = pathname === '/blog' && !currentTag && (!currentCat || currentCat === 'All');

  const navItems = [
    {
      label: 'হোম',
      href: '/blog',
      active: isHomeActive,
    },
    {
      label: 'এইচএসসি ২০২৭',
      href: '/blog?category=HSC 2027',
      active: currentCat === 'HSC 2027' || currentCat === 'এইচএসসি ২০২৭' || currentTag === 'HSC 2027',
    },
    {
      label: 'এইচএসসি ২০২৬',
      href: '/blog?category=HSC 2026',
      active: currentCat === 'HSC 2026' || currentCat === 'এইচএসসি ২০২৬' || currentTag === 'HSC 2026',
    },
    {
      label: 'ভর্তি পরীক্ষা',
      href: '/blog?category=ভর্তি পরীক্ষা',
      active: currentCat === 'ভর্তি পরীক্ষা' || currentTag === 'বিশ্ববিদ্যালয় ভর্তি' || currentTag === 'ভর্তি পরীক্ষা',
    },
    {
      label: 'স্টাডি হ্যাকস',
      href: '/blog?category=স্টাডি হ্যাকস',
      active: currentCat === 'স্টাডি হ্যাকস' || currentTag === 'পড়ার কৌশল' || currentTag === 'স্টাডি হ্যাকস',
    },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-1.5 font-noto text-[15px]">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
            item.active
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
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
    const handleScroll = () => setScrolled(window.scrollY > 10);
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

      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-xs'
            : 'bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* ─── 1. LEFT: LOGO ─── */}
          <Link href="/blog" className="flex items-center group shrink-0" aria-label="অভ্যাস ব্লগ হোমপেজ">
            {/* Light mode logo */}
            <Image
              src="/obhyash_full_logo.svg"
              alt="অভ্যাস"
              width={128}
              height={32}
              className="h-7 sm:h-8 w-auto object-contain dark:hidden group-hover:opacity-90 transition-opacity"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/obhyash_full_logo_dark.svg"
              alt="অভ্যাস"
              width={128}
              height={32}
              className="h-7 sm:h-8 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          {/* ─── 2. CENTER: BENGALI NAVIGATION MENU (Neutral Gray/Dark Accent) ─── */}
          <Suspense fallback={<div className="hidden lg:block w-96 h-8" />}>
            <NavLinks />
          </Suspense>

          {/* ─── 3. RIGHT: SOCIAL ICONS + FREE EXAM + ACTIONS ─── */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Social Icons (Facebook & YouTube) */}
            <div className="hidden lg:flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <a
                href="https://www.facebook.com/obhyash.official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://www.youtube.com/@phymathnerds"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <YouTubeIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Subtle Divider (Desktop only) */}
            <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* Exam Button (Deep Cyan) */}
            <Link
              href="/demo"
              onClick={() =>
                trackBlogConversion({
                  eventType: 'practice_click',
                  buttonLocation: 'header',
                })
              }
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#0e7490] hover:bg-[#155e75] active:bg-[#164e63] active:scale-95 text-white text-xs sm:text-sm font-bold font-noto shadow-xs transition-all shrink-0"
            >
              <WritingOnPaperIcon className="w-3.5 h-3.5 text-cyan-200" />
              <span>এক্সাম দাও</span>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <BlogThemeToggle />

            {/* Search Button (Neutral Slate Circular) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              title="সার্চ করুন (Ctrl+K)"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/10 transition-colors shrink-0"
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Burger Menu Button (Neutral Slate Circular) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="মেনু খুলুন"
              title="মেনু"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/10 transition-colors shrink-0"
            >
              <Menu className="w-4.5 h-4.5" />
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
        className={`fixed top-0 right-0 bottom-0 z-[101] w-80 sm:w-96 bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out font-noto overflow-y-auto no-scrollbar ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Drawer Header & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center"
              aria-label="অভ্যাস ব্লগ"
            >
              <Image
                src="/obhyash_full_logo.svg"
                alt="অভ্যাস"
                width={110}
                height={28}
                className="h-7 w-auto object-contain dark:hidden"
              />
              <Image
                src="/obhyash_full_logo_dark.svg"
                alt="অভ্যাস"
                width={110}
                height={28}
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

          {/* Top Quick Actions (Dashboard, Bookmarks, Demo Exam) */}
          <div className="space-y-2">
            {/* Obhyash Dashboard Redirect */}
            <Link
              href="/dashboard"
              onClick={() => {
                setIsDrawerOpen(false);
                trackBlogConversion({
                  eventType: 'signup_click',
                  buttonLocation: 'drawer',
                });
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-sm transition-all"
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>অভ্যাস ড্যাশবোর্ড</span>
              </span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </Link>

            {/* Bookmarks Option */}
            <Link
              href="/blog?filter=bookmarks"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>সংরক্ষিত বুকমার্কসমূহ</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Exam Demo Link */}
            <Link
              href="/demo"
              onClick={() => {
                setIsDrawerOpen(false);
                trackBlogConversion({
                  eventType: 'practice_click',
                  buttonLocation: 'drawer',
                });
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
            >
              <span className="flex items-center gap-2.5">
                <WritingOnPaperIcon className="w-4 h-4 text-[#0e7490] dark:text-cyan-400" />
                <span>এক্সাম দাও (ডেমো টেস্ট)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Drawer Navigation Links */}
          <div className="py-2 space-y-1 border-t border-slate-100 dark:border-white/5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 pt-2">
              নেভিগেশন
            </h4>
            <Link
              href="/blog"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span>সকল আর্টিকেল (Home)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/blog?category=HSC 2027"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span>এইচএসসি ২০২৭ সিলেবাস ও গাইড</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/blog?category=HSC 2026"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span>এইচএসসি ২০২৬ রিভিশন ও রুটিন</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/blog?category=ভর্তি পরীক্ষা"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span>ভর্তি পরীক্ষা নির্দেশিকা</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/blog?category=স্টাডি হ্যাকস"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span>স্টাডি হ্যাকস ও রুটিন</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/question-bank"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>বোর্ড প্রশ্ন ব্যাংক</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Google Play Store App Download Card */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <a
              href="https://play.google.com/store/apps/details?id=com.obhyash.app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackBlogConversion({
                  eventType: 'app_download',
                  buttonLocation: 'drawer',
                });
              }}
              className="group flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/20 transition-all text-slate-800 dark:text-white"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/30 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
                <GooglePlayIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                  GET IT ON
                </span>
                <span className="text-xs sm:text-sm font-bold leading-tight block truncate">
                  Google Play Store
                </span>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </a>
          </div>
        </div>

        {/* Drawer Footer Socials (Facebook & YouTube with Official Links) */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/obhyash.official"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-xs"
            >
              <Facebook className="w-4 h-4 fill-current" />
            </a>
            <a
              href="https://www.youtube.com/@phymathnerds"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-xs"
            >
              <YouTubeIcon className="w-4 h-4" />
            </a>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-3 font-mono">
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
