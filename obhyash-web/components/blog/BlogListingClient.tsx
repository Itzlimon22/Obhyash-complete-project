'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { BlogPost } from '@/lib/blog-data';
import { useReadHistory } from '@/hooks/use-read-history';
import {
  ChevronRight,
  Clock,
  Search,
  Bookmark,
  Share2,
  Facebook,
  ArrowRight,
  CheckCheck,
  X,
  Flame,
  BookOpen,
  RotateCcw,
  Sparkles,
  Layers,
  Download,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import BlogSearchModal from '@/components/blog/BlogSearchModal';
import { getPostCover } from '@/lib/blog-images';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

// YouTube Icon Component
const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.782C18.256 3.9 12 3.9 12 3.9s-6.256 0-7.814.504A2.506 2.506 0 0 0 2.418 6.186C2 7.754 2 11 2 11s0 3.246.418 4.814a2.506 2.506 0 0 0 1.768 1.782c1.558.504 7.814.504 7.814.504s6.256 0 7.814-.504a2.506 2.506 0 0 0 1.768-1.782C22 14.246 22 11 22 11s0-3.246-.418-4.814zM10 14.5V7.5L16 11l-6 3.5z"
    />
  </svg>
);

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Universal Smart Matcher
function matchPost(post: BlogPost, category: string, tag: string, query: string): boolean {
  const normTitle = (post.title || '').normalize('NFC').toLowerCase();
  const normExcerpt = (post.excerpt || '').normalize('NFC').toLowerCase();
  const normCategory = (post.category || '').normalize('NFC').toLowerCase();
  const normTags = (post.tags || []).map((t) => (t || '').normalize('NFC').toLowerCase());
  const normSlug = (post.slug || '').normalize('NFC').toLowerCase();
  const fullSearchable = `${normTitle} ${normCategory} ${normExcerpt} ${normTags.join(' ')} ${normSlug}`;

  // 1. Query Search Match
  if (query && query.trim()) {
    const q = query.trim().normalize('NFC').toLowerCase();
    if (!fullSearchable.includes(q)) return false;
  }

  // 2. Tag Match
  if (tag && tag.trim()) {
    const t = tag.trim().normalize('NFC').toLowerCase();
    const hasTagMatch = normTags.some((item) => item.includes(t) || t.includes(item)) || normTitle.includes(t);
    if (!hasTagMatch) return false;
  }

  // 3. Category Match with Smart Bengali & Keyword Aliases
  if (category && category !== 'All' && category !== 'সকল বিষয়' && category !== 'সব') {
    const cat = category.trim().normalize('NFC').toLowerCase();

    if (cat === 'hsc 2027' || cat === 'এইচএসসি ২০২৭' || cat === '২০২৭') {
      return fullSearchable.includes('2027') || fullSearchable.includes('২০২৭');
    }
    if (cat === 'hsc 2026' || cat === 'এইচএসসি ২০২৬' || cat === '২০২৬') {
      return fullSearchable.includes('2026') || fullSearchable.includes('২০২৬');
    }
    if (cat === 'ssc' || cat === 'এসএসসি' || cat.includes('ssc 2027') || cat.includes('এসএসসি ২০২৭') || cat.includes('এসএসসি কর্নার')) {
      return fullSearchable.includes('ssc') || fullSearchable.includes('এসএসসি');
    }
    if (
      cat.includes('ভর্তি') ||
      cat.includes('admission') ||
      cat.includes('বিশ্ববিদ্যালয়') ||
      cat.includes('বিশ্ববিদ্যালয়')
    ) {
      return (
        fullSearchable.includes('ভর্তি') ||
        fullSearchable.includes('admission') ||
        fullSearchable.includes('বুয়েট') ||
        fullSearchable.includes('মেডিকেল') ||
        fullSearchable.includes('ঢাবি') ||
        fullSearchable.includes('বিশ্ববিদ্যালয়') ||
        fullSearchable.includes('বিশ্ববিদ্যালয়') ||
        fullSearchable.includes('ভার্সিটি')
      );
    }
    if (
      cat.includes('টিপস') ||
      cat.includes('হ্যাকস') ||
      cat.includes('study tips') ||
      cat.includes('কৌশল') ||
      cat.includes('রুটিন')
    ) {
      return (
        fullSearchable.includes('টিপস') ||
        fullSearchable.includes('কৌশল') ||
        fullSearchable.includes('পদ্ধতি') ||
        fullSearchable.includes('হ্যাকস') ||
        fullSearchable.includes('রুটিন') ||
        fullSearchable.includes('অভ্যাস') ||
        fullSearchable.includes('পড়ার কৌশল')
      );
    }
    if (cat.includes('পদার্থবিজ্ঞান') || cat.includes('physics')) {
      return fullSearchable.includes('পদার্থ') || fullSearchable.includes('physics');
    }
    if (cat.includes('রসায়ন') || cat.includes('রসায়ন') || cat.includes('chemistry')) {
      return fullSearchable.includes('রসায়ন') || fullSearchable.includes('রসায়ন') || fullSearchable.includes('chemistry');
    }
    if (cat.includes('উচ্চতর গণিত') || cat.includes('গণিত') || cat.includes('math')) {
      return fullSearchable.includes('গণিত') || fullSearchable.includes('math');
    }
    if (cat.includes('আইসিটি') || cat.includes('ict')) {
      return fullSearchable.includes('আইসিটি') || fullSearchable.includes('ict');
    }
    if (cat.includes('বাংলা')) {
      return fullSearchable.includes('বাংলা');
    }
    if (cat.includes('ইংরেজি') || cat.includes('english')) {
      return fullSearchable.includes('ইংরেজি') || fullSearchable.includes('english');
    }

    // Direct fallback match
    return fullSearchable.includes(cat);
  }

  return true;
}

// Primary Filter Tabs
const FILTER_TABS = [
  { id: 'All', label: 'সকল বিষয়' },
  { id: 'HSC 2027', label: 'এইচএসসি ২০২৭' },
  { id: 'HSC 2026', label: 'এইচএসসি ২০২৬' },
  { id: 'ভর্তি পরীক্ষা', label: 'ভর্তি পরীক্ষা' },
  { id: 'স্টাডি হ্যাকস', label: 'স্টাডি হ্যাকস ও রুটিন' },
  { id: 'পদার্থবিজ্ঞান', label: 'পদার্থবিজ্ঞান' },
  { id: 'রসায়ন', label: 'রসায়ন' },
  { id: 'উচ্চতর গণিত', label: 'উচ্চতর গণিত' },
  { id: 'আইসিটি', label: 'আইসিটি' },
  { id: 'এসএসসি', label: 'এসএসসি কর্নার' },
];

// Popular clickable tags
const POPULAR_TAGS = [
  'HSC 2027',
  'HSC 2026',
  'বিশ্ববিদ্যালয় ভর্তি',
  'বুয়েট ভর্তি পরীক্ষা',
  'মেডিকেল ভর্তি',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'উচ্চতর গণিত',
  'আইসিটি',
  'পড়ার কৌশল',
  'স্টাডি রুটিন',
  'এসএসসি ২০২৭',
];

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
}: BlogListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial params from URL
  const initialTag = searchParams.get('tag') ?? '';
  const initialCategory = searchParams.get('category') ?? '';
  const initialQuery = searchParams.get('q') ?? '';
  const initialFilter = searchParams.get('filter') ?? '';

  const [activeCategory, setActiveCategory] = useState<string>(() => initialCategory || 'All');
  const [activeTag, setActiveTag] = useState<string>(() => initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(() => initialQuery);
  const [isBookmarksOnly, setIsBookmarksOnly] = useState<boolean>(() => initialFilter === 'bookmarks');
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const readSlugs = useReadHistory();

  // Sync state when URL params change (e.g. user clicks browser back/forward or header links)
  useEffect(() => {
    const currentTag = searchParams.get('tag') ?? '';
    const currentCategory = searchParams.get('category') ?? '';
    const currentQ = searchParams.get('q') ?? '';
    const currentFilter = searchParams.get('filter') ?? '';

    setActiveTag(currentTag);
    setActiveCategory(currentCategory || 'All');
    setSearchQuery(currentQ);
    setIsBookmarksOnly(currentFilter === 'bookmarks');
  }, [searchParams]);

  // Update URL parameters smoothly without full reload
  const updateUrl = useCallback(
    (newCat: string, newTag: string, newQ: string, bookmarksOnly?: boolean) => {
      const params = new URLSearchParams();
      if (newCat && newCat !== 'All' && newCat !== 'সকল বিষয়') {
        params.set('category', newCat);
      }
      if (newTag) {
        params.set('tag', newTag);
      }
      if (newQ && newQ.trim()) {
        params.set('q', newQ.trim());
      }
      if (bookmarksOnly) {
        params.set('filter', 'bookmarks');
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `/blog?${queryString}` : '/blog';
      router.push(targetUrl, { scroll: false });
    },
    [router],
  );

  // Handle Category selection
  const handleSelectCategory = (catId: string) => {
    const nextCat = catId === activeCategory && catId !== 'All' ? 'All' : catId;
    setActiveCategory(nextCat);
    setIsBookmarksOnly(false);
    setVisibleCount(8);
    updateUrl(nextCat, activeTag, searchQuery, false);
  };

  // Handle Tag click
  const handleSelectTag = (tag: string) => {
    const nextTag = tag === activeTag ? '' : tag;
    setActiveTag(nextTag);
    setIsBookmarksOnly(false);
    setVisibleCount(8);
    updateUrl(activeCategory, nextTag, searchQuery, false);
  };

  // Toggle bookmarks only filter
  const handleToggleBookmarksFilter = () => {
    const next = !isBookmarksOnly;
    setIsBookmarksOnly(next);
    setVisibleCount(8);
    updateUrl(activeCategory, activeTag, searchQuery, next);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('All');
    setActiveTag('');
    setSearchQuery('');
    setIsBookmarksOnly(false);
    setVisibleCount(8);
    router.push('/blog', { scroll: false });
  };

  // Bookmarks SWR
  const { data: bookmarkData, mutate: mutateBookmarks } = useSWR<{ slugs: string[] }>(
    '/api/blog/bookmarks',
    fetcher,
  );
  const bookmarkedSlugs = useMemo(
    () => new Set(bookmarkData?.slugs ?? []),
    [bookmarkData],
  );

  const toggleBookmark = async (slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!bookmarkData) {
      toast.error('বুকমার্ক করতে লগইন করুন');
      return;
    }
    const already = bookmarkedSlugs.has(slug);
    const next = already
      ? bookmarkData.slugs.filter((s) => s !== slug)
      : [...bookmarkData.slugs, slug];
    mutateBookmarks({ slugs: next }, false);

    try {
      const res = await fetch('/api/blog/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        mutateBookmarks();
        toast.error('বুকমার্ক করতে লগইন করুন');
        return;
      }
      toast(already ? 'বুকমার্ক সরানো হয়েছে' : 'বুকমার্কে সংরক্ষণ করা হয়েছে');
    } catch {
      mutateBookmarks();
      toast.error('বুকমার্ক ব্যর্থ হয়েছে');
    }
  };

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://obhyash.com/blog/${post.slug}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: post.title,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast('লিংক কপি করা হয়েছে!');
    }
  };

  // All filtered posts
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (isBookmarksOnly) {
      result = result.filter((post) => bookmarkedSlugs.has(post.slug));
    }
    return result.filter((post) => matchPost(post, activeCategory, activeTag, searchQuery));
  }, [posts, isBookmarksOnly, bookmarkedSlugs, activeCategory, activeTag, searchQuery]);

  // Is any filter currently active?
  const isFiltered = useMemo(() => {
    return (
      isBookmarksOnly ||
      (activeCategory !== 'All' && activeCategory !== 'সকল বিষয়' && Boolean(activeCategory)) ||
      Boolean(activeTag) ||
      Boolean(searchQuery.trim())
    );
  }, [isBookmarksOnly, activeCategory, activeTag, searchQuery]);

  // Dynamic count map for the filter tabs
  const tabCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of FILTER_TABS) {
      if (tab.id === 'All') {
        map[tab.id] = posts.length;
      } else {
        map[tab.id] = posts.filter((p) => matchPost(p, tab.id, '', '')).length;
      }
    }
    return map;
  }, [posts]);

  // Hero section posts (when not filtered)
  const heroMainPost = featuredPost || posts[0];
  const popularHighlights = (recommendedPosts.length >= 4 ? recommendedPosts : posts).slice(0, 4);

  // Paginated visible posts
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <div className="bg-slate-50/60 dark:bg-[#0c0c0c] text-slate-800 dark:text-slate-100 min-h-screen py-8 sm:py-12 transition-colors font-anek">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        {/* ══════════════════════════════════════════════════════════════════
            HERO SHOWCASE (Shown in default / unfiltered mode)
           ══════════════════════════════════════════════════════════════════ */}
        {!isFiltered && heroMainPost && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Big Featured Hero Card (8 Cols) */}
            <div
              onClick={() => router.push(`/blog/${heroMainPost.slug}`)}
              className="lg:col-span-8 group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 min-h-[380px] sm:min-h-[460px] flex flex-col justify-end bg-slate-900 border border-slate-200/80 dark:border-white/10"
            >
              <Image
                src={getPostCover(heroMainPost)}
                alt={heroMainPost.title}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 820px"
              />

              {/* Gradient Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Overlay Content */}
              <div className="relative z-10 p-6 sm:p-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white rounded-full bg-slate-800/90 backdrop-blur-md border border-white/15 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>বিশেষ ফিচার্ড আর্টিকেল</span>
                  </span>
                  <span className="inline-block px-3 py-1 text-xs font-bold text-slate-200 rounded-full bg-white/10 backdrop-blur-md">
                    {heroMainPost.category}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-3 group-hover:text-slate-200 transition-colors">
                  {heroMainPost.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl mb-4 leading-relaxed font-sans">
                  {heroMainPost.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-white text-slate-900 font-bold text-[10px] flex items-center justify-center">
                    {heroMainPost.author.initials}
                  </div>
                  <span className="font-semibold text-white">{heroMainPost.author.name}</span>
                  <span>•</span>
                  <span>{formatDate(heroMainPost.publishedAt)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {BanglaNameHelper.toBanglaNumeral(heroMainPost.readTime)} মিনিট পঠিত
                  </span>
                </div>
              </div>
            </div>

            {/* Trending Highlights List (4 Cols) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      জনপ্রিয় ও আলোচিত
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    টপ {BanglaNameHelper.toBanglaNumeral(popularHighlights.length)}
                  </span>
                </div>

                <div className="space-y-4">
                  {popularHighlights.map((post, idx) => (
                    <div
                      key={post.slug + '-hero-highlight'}
                      onClick={() => router.push(`/blog/${post.slug}`)}
                      className="flex items-center gap-3.5 group cursor-pointer pb-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0"
                    >
                      {/* Number Indicator */}
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                        {BanglaNameHelper.toBanglaNumeral(idx + 1)}
                      </span>

                      {/* Small Thumbnail */}
                      <div className="relative w-14 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10">
                        <Image
                          src={getPostCover(post)}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="56px"
                        />
                      </div>

                      {/* Title & Date */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Free Question Bank Mini Link */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 text-center">
                <Link
                  href="/question-bank"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন ব্যাংক এক্সপ্লোর করো</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SMART FILTER & SEARCH CONTROL BAR
           ══════════════════════════════════════════════════════════════════ */}
        <section ref={filterBarRef} className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 sm:p-5 shadow-xs">
            {/* Search Input + Clear Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    setVisibleCount(8);
                    updateUrl(activeCategory, activeTag, q);
                  }}
                  placeholder="যেকোনো বিষয়, অধ্যায় বা আর্টিকেল খুঁজুন..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-full border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-black/30 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all font-anek"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      updateUrl(activeCategory, activeTag, '');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Quick Bookmarks Toggle Button */}
              <button
                type="button"
                onClick={handleToggleBookmarksFilter}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isBookmarksOnly
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300'
                }`}
                title="বুকমার্ক করা আর্টিকেল দেখুন"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarksOnly ? 'fill-current' : ''}`} />
                <span>বুকমার্কসমূহ</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isBookmarksOnly
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {BanglaNameHelper.toBanglaNumeral(bookmarkedSlugs.size)}
                </span>
              </button>

              {/* Reset All Filters Button (Visible when filtered) */}
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>সব ফিল্টার মুছুন</span>
                </button>
              )}
            </div>

            {/* Scrollable Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {FILTER_TABS.map((tab) => {
                const isActive =
                  (tab.id === 'All' && (!activeCategory || activeCategory === 'All')) ||
                  activeCategory === tab.id;
                const count = tabCounts[tab.id] ?? 0;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectCategory(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {BanglaNameHelper.toBanglaNumeral(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Status Bar */}
          {isFiltered && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200/80 dark:border-white/10 shadow-xs text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">সক্রিয় ফিল্টার:</span>

                {isBookmarksOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/50">
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>সংরক্ষিত বুকমার্কসমূহ</span>
                    <button
                      onClick={handleToggleBookmarksFilter}
                      className="hover:text-rose-950 dark:hover:text-white"
                      title="বুকমার্ক ফিল্টার সরান"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {activeCategory && activeCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold">
                    <span>{FILTER_TABS.find((t) => t.id === activeCategory)?.label || activeCategory}</span>
                    <button
                      onClick={() => handleSelectCategory('All')}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {activeTag && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold">
                    <span>#{activeTag}</span>
                    <button onClick={() => handleSelectTag(activeTag)} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold">
                    <span>খোঁজা হচ্ছে: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        updateUrl(activeCategory, activeTag, '');
                      }}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="font-bold text-slate-900 dark:text-white">
                মোট {BanglaNameHelper.toBanglaNumeral(filteredPosts.length)} টি আর্টিকেল পাওয়া গেছে
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN CONTENT AREA: ARTICLE GRID + SIDEBAR
           ══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Feed Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {isFiltered ? 'ফিল্টারকৃত আর্টিকেলসমূহ' : 'সর্বশেষ প্রকাশিত আর্টিকেল'}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                প্রদর্শিত: {BanglaNameHelper.toBanglaNumeral(Math.min(visibleCount, filteredPosts.length))} /{' '}
                {BanglaNameHelper.toBanglaNumeral(filteredPosts.length)}
              </span>
            </div>

            {/* Zero State if no posts match */}
            {filteredPosts.length === 0 && (
              <div className="p-10 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  কোনো আর্টিকেল পাওয়া যায়নি
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  আপনার নির্বাচিত ফিল্টার বা অনুসন্ধানের সাথে মিলিয়ে কোনো আর্টিকেল পাওয়া যায়নি। অনুগ্রহ করে কি-ওয়ার্ড পরিবর্তন করুন অথবা সব আর্টিকেল এক্সপ্লোর করুন।
                </p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>সকল আর্টিকেল দেখুন</span>
                </button>
              </div>
            )}

            {/* List of Clean Modern Article Cards */}
            <div className="space-y-6">
              {visiblePosts.map((post) => (
                <article
                  key={post.slug}
                  onClick={() => router.push(`/blog/${post.slug}`)}
                  className="group flex flex-col sm:flex-row gap-5 sm:gap-6 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer shadow-xs"
                >
                  {/* Banner Thumbnail (Clean SVG banner without overlapping badges) */}
                  <div className="relative w-full sm:w-64 md:w-72 h-44 sm:h-auto shrink-0 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <Image
                      src={getPostCover(post)}
                      alt={post.title}
                      fill
                      className="object-contain group-hover:scale-104 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 288px"
                    />
                  </div>

                  {/* Right Content */}
                  <div className="flex flex-col justify-between flex-1 py-0.5">
                    <div>
                      {/* Author + Category + Date */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
                        <div className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold text-[9px] flex items-center justify-center">
                          {post.author.initials}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {post.author.name}
                        </span>
                        <span>•</span>
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {BanglaNameHelper.toBanglaNumeral(post.readTime)} মি.
                        </span>
                        {readSlugs.has(post.slug) && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <CheckCheck className="w-3 h-3 text-emerald-500" />
                            পড়েছেন
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug mb-2.5 line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Interactive Tags Row */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTag(tag);
                              }}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                                activeTag === tag
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Share + Bookmark */}
                    <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-slate-100 dark:border-white/5 text-slate-400 text-xs">
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>শেয়ার</span>
                      </button>

                      <button
                        onClick={(e) => toggleBookmark(post.slug, e)}
                        className={`hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 ${
                          bookmarkedSlugs.has(post.slug)
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : ''
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            bookmarkedSlugs.has(post.slug) ? 'fill-current' : ''
                          }`}
                        />
                        <span>{bookmarkedSlugs.has(post.slug) ? 'সংরক্ষিত' : 'বুকমার্ক'}</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-sm transition-all group"
                >
                  <span>
                    আরও আর্টিকেল লোড করুন (বাকি{' '}
                    {BanglaNameHelper.toBanglaNumeral(filteredPosts.length - visibleCount)}টি)
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar Column (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Widget 1: Obhyash Platform / Exam Cell Card */}
            <div className="rounded-3xl bg-slate-900 dark:bg-[#161616] border border-slate-800 dark:border-white/10 text-white p-7 shadow-xs relative overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                অভ্যাস এক্সাম সেল
              </span>
              <h3 className="text-xl font-bold leading-snug mb-3">
                বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন ব্যাংক
              </h3>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed mb-6 font-sans">
                হাজারো নির্ভুল MCQ প্র্যাকটিস করো, পূর্ণাঙ্গ ব্যাখ্যা দেখো এবং নিজের ভুলগুলো স্বয়ংক্রিয় মিস্টেক নোটবুকে সংরক্ষণ করে প্রস্তুতি মজবুত করো।
              </p>
              <Link
                href="/question-bank"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-sm transition-all"
              >
                <span>ফ্রি অনুশীলন শুরু করো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Widget 2: Topic Categories with Live Counts */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 sm:p-7 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                জনপ্রিয় বিষয়সমূহ
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                {FILTER_TABS.map((tab) => {
                  const isSelected =
                    (tab.id === 'All' && (!activeCategory || activeCategory === 'All')) ||
                    activeCategory === tab.id;
                  const count = tabCounts[tab.id] ?? 0;

                  return (
                    <button
                      key={tab.id + '-sidebar'}
                      onClick={() => handleSelectCategory(tab.id)}
                      className="w-full flex items-center justify-between py-3 group font-medium transition-colors text-left"
                    >
                      <span
                        className={`flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'font-bold text-slate-950 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected
                              ? 'text-slate-900 dark:text-white translate-x-0.5'
                              : 'text-slate-400 group-hover:translate-x-1'
                          }`}
                        />
                        <span>{tab.label}</span>
                      </span>
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                            : 'text-slate-400 bg-slate-100 dark:bg-white/5'
                        }`}
                      >
                        {BanglaNameHelper.toBanglaNumeral(count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget 3: Popular Tags Cloud */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 sm:p-7 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                জনপ্রিয় ট্যাগসমূহ
              </h3>

              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => {
                  const isSelected = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleSelectTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                          : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white bg-slate-50/50 dark:bg-white/5'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget 4: Obhyash Mobile App Download Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 shadow-xs text-center font-anek">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <GooglePlayIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                অভ্যাস মোবাইল অ্যাপ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-sans">
                এইচএসসি ও ভর্তি পরীক্ষার সকল সূত্র অফলাইনে দেখতে এবং নিয়মিত কুইজ দিতে এখনই অ্যাপটি ইনস্টল করো।
              </p>
              <a
                href="https://play.google.com/store/apps/details?id=com.obhyash.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackBlogConversion({
                    eventType: 'app_download',
                    buttonLocation: 'sidebar',
                    sourceSlug: 'blog_home',
                  });
                }}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Google Play Store থেকে ইনস্টল</span>
              </a>
            </div>

            {/* Widget 5: Social Media Links */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 text-center shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                যুক্ত থাকুন অভ্যাসের সাথে
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans leading-relaxed">
                নতুন সব ক্লাস, লাইভ আপডেট ও গাইডলাইন পেতে আমাদের সোশ্যাল পেজে কানেক্টেড থাকুন।
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://www.facebook.com/obhyash.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                  aria-label="Facebook Page"
                >
                  <Facebook className="w-4 h-4 fill-current" />
                </a>
                <a
                  href="https://www.youtube.com/@phymathnerds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                  aria-label="YouTube Channel"
                >
                  <YouTubeIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* Global Search Modal */}
      <BlogSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        posts={posts}
      />
    </div>
  );
}
