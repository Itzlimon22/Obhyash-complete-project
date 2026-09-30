'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { BlogPost } from '@/lib/blog-data';
import BlogCard from '@/components/blog/BlogCard';
import { useReadHistory } from '@/hooks/use-read-history';
import {
  BookOpen,
  Search,
  TrendingUp,
  X,
  Bookmark,
  GraduationCap,
  Sparkles,
  Lightbulb,
  LayoutList,
  LayoutGrid,
  Facebook,
  Youtube,
  Send,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import BlogSearchModal from '@/components/blog/BlogSearchModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SUB_CATEGORIES = [
  'সব',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'উচ্চতর গণিত',
  'আইসিটি',
  'বাংলা',
  'ইংরেজি',
  'হিসাববিজ্ঞান',
  'ব্যবসায় সংগঠন',
  'ফিন্যান্স',
  'পৌরনীতি',
  'ভূগোল',
];

export type AudienceSegment =
  | 'all'
  | 'hsc-2027'
  | 'hsc-2026'
  | 'admission-2026'
  | 'study-hacks'
  | 'saved';

export const AUDIENCE_SEGMENTS = [
  { id: 'all' as const, label: 'সকল পোস্ট', icon: Sparkles },
  { id: 'hsc-2027' as const, label: 'এইচএসসি ২০২৭', icon: Flame },
  { id: 'hsc-2026' as const, label: 'এইচএসসি ২০২৬', icon: BookOpen },
  { id: 'admission-2026' as const, label: 'বিশ্ববিদ্যালয় ভর্তি', icon: GraduationCap },
  { id: 'study-hacks' as const, label: 'পড়ার স্মার্ট কৌশল', icon: Lightbulb },
  { id: 'saved' as const, label: 'সংরক্ষিত', icon: Bookmark },
] as const;

interface BlogListingClientProps {
  posts: BlogPost[];
  featuredPost?: BlogPost;
  categories: string[];
  recommendedPosts: BlogPost[];
  isGuest: boolean;
  postCounts?: Record<string, { likes: number; views: number }>;
}

export default function BlogListingClient({
  posts,
  featuredPost,
  categories,
  recommendedPosts,
  isGuest,
  postCounts = {},
}: BlogListingClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTag = searchParams.get('tag') ?? '';

  const [activeSegment, setActiveSegment] = useState<AudienceSegment>('all');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('সব');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [visibleCount, setVisibleCount] = useState(8);

  const readSlugs = useReadHistory();

  // ── Bookmarks ──────────────────────────────────────
  const { data: bookmarkData, mutate: mutateBookmarks } = useSWR<{
    slugs: string[];
  }>('/api/blog/bookmarks', fetcher);
  const bookmarkedSlugs = useMemo(
    () => new Set(bookmarkData?.slugs ?? []),
    [bookmarkData],
  );

  const segmentCounts = useMemo(() => {
    return {
      all: posts.length,
      'hsc-2027': posts.filter(
        (p) =>
          p.tags.some((t) => /2027|HSC 27|২০২৭/i.test(t)) ||
          /2027|২০২৭/i.test(p.title),
      ).length,
      'hsc-2026': posts.filter(
        (p) =>
          p.tags.some((t) => /2026|HSC 26|২০২৬/i.test(t)) ||
          /2026|২০২৬/i.test(p.title),
      ).length,
      'admission-2026': posts.filter(
        (p) =>
          p.tags.some((t) =>
            /ভর্তি|Admission|বুয়েট|মেডিকেল|গুচ্ছ|CKRUET|DU|MIST|BUP/i.test(t),
          ) || /ভর্তি|admission|circular|সার্কুলার/i.test(p.title),
      ).length,
      'study-hacks': posts.filter(
        (p) =>
          p.category === 'পড়ার কৌশল' ||
          p.category === 'স্টাডি টিপস' ||
          p.category === 'Study Tips' ||
          p.tags.some((t) =>
            /কৌশল|হ্যাকস|রুটিন|পমোডোরো|Routine|Tips|Memory|Stress/i.test(t),
          ),
      ).length,
      saved: bookmarkedSlugs.size,
    };
  }, [posts, bookmarkedSlugs]);

  const toggleBookmark = async (slug: string) => {
    if (!bookmarkData) {
      toast.error('বুকমার্ক করতে লগইন করো');
      return;
    }
    const already = bookmarkedSlugs.has(slug);
    const next = already
      ? bookmarkData.slugs.filter((s) => s !== slug)
      : [...bookmarkData.slugs, slug];
    mutateBookmarks({ slugs: next }, false);
    const res = await fetch('/api/blog/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    if (res.status === 401) {
      mutateBookmarks();
      toast.error('বুকমার্ক করতে লগইন করো');
      return;
    }
    toast(already ? 'বুকমার্ক সরানো হয়েছে' : 'বুকমার্কে যোগ করা হয়েছে');
  };

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (activeSegment === 'saved' || showSaved) {
      return result.filter((p) => bookmarkedSlugs.has(p.slug));
    }

    if (activeSegment === 'hsc-2027') {
      result = result.filter(
        (p) =>
          p.tags.some((t) => /2027|HSC 27|২০২৭/i.test(t)) ||
          /2027|২০২৭/i.test(p.title),
      );
    } else if (activeSegment === 'hsc-2026') {
      result = result.filter(
        (p) =>
          p.tags.some((t) => /2026|HSC 26|২০২৬/i.test(t)) ||
          /2026|২০২৬/i.test(p.title),
      );
    } else if (activeSegment === 'admission-2026') {
      result = result.filter(
        (p) =>
          p.tags.some((t) =>
            /ভর্তি|Admission|বুয়েট|মেডিকেল|গুচ্ছ|CKRUET|DU|MIST|BUP/i.test(t),
          ) || /ভর্তি|admission|circular|সার্কুলার/i.test(p.title),
      );
    } else if (activeSegment === 'study-hacks') {
      result = result.filter(
        (p) =>
          p.category === 'পড়ার কৌশল' ||
          p.category === 'স্টাডি টিপস' ||
          p.category === 'Study Tips' ||
          p.tags.some((t) =>
            /কৌশল|হ্যাকস|রুটিন|পমোডোরো|Routine|Tips|Memory|Stress/i.test(t),
          ),
      );
    }

    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (activeSubCategory !== 'সব') {
      result = result.filter(
        (p) =>
          p.tags.some((t) =>
            t.toLowerCase().includes(activeSubCategory.toLowerCase()),
          ) ||
          p.title.toLowerCase().includes(activeSubCategory.toLowerCase()) ||
          p.category.toLowerCase().includes(activeSubCategory.toLowerCase()),
      );
    }

    if (activeTag) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [
    posts,
    activeSegment,
    showSaved,
    bookmarkedSlugs,
    activeCategory,
    activeSubCategory,
    activeTag,
    searchQuery,
  ]);

  // Main hero featured post
  const heroPost = featuredPost || posts[0];
  // Secondary featured posts (next 2 posts)
  const secondaryFeatured = useMemo(() => {
    return posts.filter((p) => p.slug !== heroPost?.slug).slice(0, 2);
  }, [posts, heroPost]);

  // Trending posts for sidebar (top 5 posts with high views or recommendations)
  const trendingPosts = useMemo(() => {
    if (recommendedPosts.length >= 4) return recommendedPosts.slice(0, 5);
    return posts.slice(0, 5);
  }, [posts, recommendedPosts]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c] = posts.filter((p) => p.category === c).length;
    });
    return counts;
  }, [posts, categories]);

  // Popular tags
  const popularTags = useMemo(() => {
    return [
      'HSC 2027',
      'HSC 2026',
      'পদার্থবিজ্ঞান',
      'রসায়ন',
      'উচ্চতর গণিত',
      'আইসিটি',
      'বাংলা ১ম পত্র',
      'ইংরেজি ২য় পত্র',
      'বুয়েট ভর্তি',
      'মেডিকেল প্রস্তুতি',
      'পড়ার রুটিন',
    ];
  }, []);

  const pagedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <div className="font-anek bg-[#fdfdfd] dark:bg-[#0e0e0e] min-h-screen text-slate-800 dark:text-slate-100 transition-colors">
      {/* ─────────────────────────────────────────────────────────────
          1. KATEN MAGAZINE HERO: FEATURED POST SECTION
         ───────────────────────────────────────────────────────────── */}
      {!activeTag && !searchQuery && activeSegment === 'all' && heroPost && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          {/* Section Header with Katen Wave */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387]" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  নির্বাচিত ফিচার্ড পোস্ট
                </h2>
              </div>
              {/* Katen Signature Wave SVG */}
              <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
                  stroke="#fe4f70"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Katen 2-Tier Featured Layout (1 Large Banner + 2 Secondary Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Big Hero Card */}
            <div className="lg:col-span-8">
              <BlogCard
                post={heroPost}
                featured
                stats={postCounts[heroPost.slug]}
                isBookmarked={bookmarkedSlugs.has(heroPost.slug)}
                onToggleBookmark={toggleBookmark}
                isRead={readSlugs.has(heroPost.slug)}
              />
            </div>

            {/* Secondary 2 Column Featured Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {secondaryFeatured.map((post) => (
                <div key={post.slug + '-hero-sec'} className="flex-1">
                  <BlogCard
                    post={post}
                    layout="grid"
                    stats={postCounts[post.slug]}
                    isBookmarked={bookmarkedSlugs.has(post.slug)}
                    onToggleBookmark={toggleBookmark}
                    isRead={readSlugs.has(post.slug)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. KATEN CATEGORY & SEGMENT NAVIGATION BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="sticky top-20 z-30 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-y border-slate-200/80 dark:border-white/10 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Segment Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {AUDIENCE_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isActive = activeSegment === seg.id;
              const count = segmentCounts[seg.id as keyof typeof segmentCounts];
              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    setActiveSegment(seg.id);
                    setShowSaved(seg.id === 'saved');
                    setActiveCategory('All');
                    setActiveSubCategory('সব');
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white shadow-md shadow-rose-500/25 scale-[1.02]'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{seg.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-categories scroll pills for subjects */}
          {activeSegment === 'all' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-2 border-t border-slate-100 dark:border-white/5">
              {SUB_CATEGORIES.map((subcat) => (
                <button
                  key={subcat}
                  onClick={() => setActiveSubCategory(subcat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeSubCategory === subcat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. KATEN MAIN LAYOUT: 8-COL FEED + 4-COL STICKY SIDEBAR
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Active Tag Notice */}
        {activeTag && (
          <div className="flex items-center gap-2 mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              ট্যাগ ফিল্টার:
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white text-xs font-black rounded-full shadow-sm">
              #{activeTag}
              <button
                onClick={() => router.push('/blog')}
                aria-label="ফিল্টার মুছুন"
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs text-slate-500 ml-auto">
              {filteredPosts.length} টি পোস্ট
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ─── LEFT COLUMN (8 COLS): MAIN ARTICLES FEED ─── */}
          <div className="lg:col-span-8">
            {/* Feed Section Header with Katen Wave & View Switcher */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387]" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    সর্বশেষ আর্টিকেলসমূহ
                  </h2>
                </div>
                <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
                    stroke="#fe4f70"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* View Switcher (Katen List vs Grid View Toggle) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="লিস্ট ভিউ"
                  title="লিস্ট ভিউ"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#202020] text-[#fe4f70] shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="গ্রিড ভিউ"
                  title="গ্রিড ভিউ"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#202020] text-[#fe4f70] shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Articles List / Grid */}
            {pagedPosts.length > 0 ? (
              <div
                className={
                  viewMode === 'list'
                    ? 'space-y-6'
                    : 'grid grid-cols-1 sm:grid-cols-2 gap-6'
                }
              >
                {pagedPosts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    layout={viewMode}
                    stats={postCounts[post.slug]}
                    isBookmarked={bookmarkedSlugs.has(post.slug)}
                    onToggleBookmark={toggleBookmark}
                    isRead={readSlugs.has(post.slug)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#161616] rounded-3xl border border-slate-200/80 dark:border-white/10 p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-[#fe4f70] flex items-center justify-center">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  কোনো আর্টিকেল পাওয়া যায়নি
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                  অন্য কোনো বিষয় বা কিওয়ার্ড দিয়ে অনুসন্ধান করুন অথবা ফিল্টার মুছুন।
                </p>
                <button
                  onClick={() => {
                    setActiveSegment('all');
                    setActiveCategory('All');
                    setActiveSubCategory('সব');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  সকল পোস্ট দেখুন
                </button>
              </div>
            )}

            {/* Katen Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white dark:bg-[#161616] border border-slate-200/80 dark:border-white/10 hover:border-[#fe4f70] text-slate-800 dark:text-slate-200 hover:text-[#fe4f70] text-sm font-bold shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <span>আরও আর্টিকেল লোড করুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN (4 COLS): KATEN STICKY SIDEBAR ─── */}
          <aside className="lg:col-span-4 sticky top-36 space-y-8">
            {/* Widget 1: Author / Platform About Widget */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 text-center shadow-sm">
              <div className="relative w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-[#fe4f70] to-[#ffa387] p-1 shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-white dark:bg-[#181818] rounded-[20px] flex items-center justify-center p-3 overflow-hidden">
                  <Image
                    src="/obhyash_mark.svg"
                    alt="Obhyash Brand Icon"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                অভ্যাস (Obhyash)
              </h3>
              <p className="text-xs font-bold text-[#fe4f70] uppercase tracking-wider mb-3">
                স্মার্ট লার্নিং ও এক্সাম প্ল্যাটফর্ম
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                বাংলাদেশের শিক্ষার্থীদের এসএসসি, এইচএসসি এবং ভর্তি পরীক্ষার সেরা প্রস্তুতির জন্য প্রশ্ন ব্যাংক, বিষয়ভিত্তিক পরীক্ষা এবং স্মার্ট ভুল সংশোধনের ডিজিটাল মাধ্যম।
              </p>

              {/* Social Buttons */}
              <div className="flex items-center justify-center gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
                <a
                  href="https://facebook.com/obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com/@obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://t.me/obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#fe4f70] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Widget 2: Popular / Trending Posts (With #1, #2, #3 badges) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 shadow-sm">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#fe4f70]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    জনপ্রিয় আর্টিকেলসমূহ
                  </h3>
                </div>
                <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
                    stroke="#fe4f70"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="space-y-4">
                {trendingPosts.map((post, idx) => (
                  <div
                    key={post.slug + '-trending'}
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    className="flex items-start gap-3.5 group cursor-pointer"
                  >
                    {/* Number Badge */}
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#fe4f70] to-[#ffa387] text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#fe4f70] dark:group-hover:text-[#ffa387] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {post.category} • {post.readTime} মিনিট
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Categories & Counts */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 shadow-sm">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-[#fe4f70]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    বিষয় ও ক্যাটাগরি
                  </h3>
                </div>
                <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
                    stroke="#fe4f70"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSegment('all');
                      setActiveSubCategory('সব');
                    }}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      activeCategory === cat
                        ? 'bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{cat === 'All' ? 'সকল বিষয়' : cat}</span>
                    <span className="text-[11px] font-mono opacity-80">
                      ({categoryCounts[cat] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget 4: Practice Callout Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#18231C] to-[#080D0A] text-white p-7 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#fe4f70]/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-4 border border-white/10">
                  স্মার্ট প্র্যাকটিস
                </span>
                <h4 className="text-lg font-black leading-snug mb-2">
                  বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন ব্যাংক
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  হাজারো প্রশ্ন প্র্যাকটিস করো, ভুল হলে স্বয়ংক্রিয় মিস্টেক নোটবুকে সেভ করো এবং লাইভ লিডারবোর্ডে র‍্যাঙ্ক দেখো।
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387] text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-rose-500/30"
                >
                  <span>এখনই অনুশীলন শুরু করো</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Widget 5: Popular Tags Cloud */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 shadow-sm">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#fe4f70]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    জনপ্রিয় ট্যাগ
                  </h3>
                </div>
                <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
                    stroke="#fe4f70"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/blog?tag=${encodeURIComponent(tag)}`)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#fe4f70] hover:text-[#fe4f70] dark:hover:text-[#ffa387] transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Live Search Modal */}
      <BlogSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        posts={posts}
        initialQuery={searchQuery}
      />
    </div>
  );
}
