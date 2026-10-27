'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogPost } from '@/lib/blog-data';
import { useReadHistory } from '@/hooks/use-read-history';
import {
  ChevronRight,
  Clock,
  Search,
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
import BlogThemeToggle from '@/components/blog/BlogThemeToggle';
import { getPostCover } from '@/lib/blog-images';
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

  const [activeCategory, setActiveCategory] = useState<string>(() => initialCategory || 'All');
  const [activeTag, setActiveTag] = useState<string>(() => initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(() => initialQuery);
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const readSlugs = useReadHistory();

  // Sync state when URL params change (e.g. user clicks browser back/forward or header links)
  useEffect(() => {
    const currentTag = searchParams.get('tag') ?? '';
    const currentCategory = searchParams.get('category') ?? '';
    const currentQ = searchParams.get('q') ?? '';

    setActiveTag(currentTag);
    setActiveCategory(currentCategory || 'All');
    setSearchQuery(currentQ);
  }, [searchParams]);

  // Update URL parameters smoothly without full reload
  const updateUrl = useCallback(
    (newCat: string, newTag: string, newQ: string) => {
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
    setVisibleCount(9);
    updateUrl(nextCat, activeTag, searchQuery);
  };

  // Handle Tag click
  const handleSelectTag = (tag: string) => {
    const nextTag = tag === activeTag ? '' : tag;
    setActiveTag(nextTag);
    setVisibleCount(9);
    updateUrl(activeCategory, nextTag, searchQuery);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('All');
    setActiveTag('');
    setSearchQuery('');
    setVisibleCount(9);
    router.push('/blog', { scroll: false });
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
    return posts.filter((post) => matchPost(post, activeCategory, activeTag, searchQuery));
  }, [posts, activeCategory, activeTag, searchQuery]);

  // Is any filter currently active?
  const isFiltered = useMemo(() => {
    return (
      (activeCategory !== 'All' && activeCategory !== 'সকল বিষয়' && Boolean(activeCategory)) ||
      Boolean(activeTag) ||
      Boolean(searchQuery.trim())
    );
  }, [activeCategory, activeTag, searchQuery]);

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
    <div className="bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-zinc-100 min-h-screen pb-20 transition-colors font-noto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        {/* ─── 1. MINIMAL MASTHEAD ─── */}
        <section className="pt-8 sm:pt-14 pb-6 border-b border-slate-200/70 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight font-noto">
                অভ্যাস ব্লগ
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 mt-2 font-noto">
                পড়ালেখার বৈজ্ঞানিক কৌশল, বোর্ড পরীক্ষা প্রস্তুতি ও ভর্তি নির্দেশিকা।
              </p>
            </div>

            {/* Sleek inline search bar */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setSearchQuery(q);
                  setVisibleCount(9);
                  updateUrl(activeCategory, activeTag, q);
                }}
                placeholder="আর্টিকেল খুঁজুন..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-600 transition-colors font-noto"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    updateUrl(activeCategory, activeTag, '');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Minimal Horizontal Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 -mb-2">
            {FILTER_TABS.map((tab) => {
              const isActive =
                (tab.id === 'All' && (!activeCategory || activeCategory === 'All')) ||
                activeCategory === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 font-noto ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── ACTIVE FILTER BAR (Shown only when filtered) ─── */}
        {isFiltered && (
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-zinc-400 py-3 border-b border-slate-100 dark:border-zinc-800/80 font-noto">
            <div className="flex flex-wrap items-center gap-2">
              <span>সক্রিয় ফিল্টার:</span>
              {activeCategory && activeCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-medium text-xs">
                  {FILTER_TABS.find((t) => t.id === activeCategory)?.label || activeCategory}
                  <button onClick={() => handleSelectCategory('All')} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-medium text-xs">
                  #{activeTag}
                  <button onClick={() => handleSelectTag(activeTag)} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-medium text-xs">
                  &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 shrink-0"
            >
              সব মুছুন
            </button>
          </div>
        )}

        {/* ─── 2. FEATURED STORY (Shown only in default / unfiltered mode) ─── */}
        {!isFiltered && heroMainPost && (
          <article
            onClick={() => router.push(`/blog/${heroMainPost.slug}`)}
            className="group cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200"
          >
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {heroMainPost.category || 'ফিচার্ড আর্টিকেল'}
                </span>
                <span className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {formatDate(heroMainPost.publishedAt)}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-zinc-100 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-snug tracking-tight font-noto">
                {heroMainPost.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 line-clamp-3 leading-relaxed font-noto">
                {heroMainPost.excerpt}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 pt-2 font-noto">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{heroMainPost.author.name}</span>
                <span>·</span>
                <span>{BanglaNameHelper.toBanglaNumeral(heroMainPost.readTime)} মিনিট পাঠ</span>
              </div>
            </div>

            <div className="md:col-span-5 relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <Image
                src={getPostCover(heroMainPost)}
                alt={heroMainPost.title}
                fill
                priority
                className="object-contain group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
          </article>
        )}

        {/* ─── 3. ARTICLES GRID (Clean 3-Column Minimal Grid) ─── */}
        <section className="space-y-8">
          {/* Zero State if no posts match */}
          {filteredPosts.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3 font-noto">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                কোনো আর্টিকেল পাওয়া যায়নি
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                আপনার অনুসন্ধানের সাথে মিলিয়ে কোনো লেখা পাওয়া যায়নি। কি-ওয়ার্ড পরিবর্তন করে চেষ্টা করুন।
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold mt-2 transition-opacity hover:opacity-90"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সব আর্টিকেল দেখুন</span>
              </button>
            </div>
          )}

          {/* Grid of Minimal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {visiblePosts.map((post) => (
              <article
                key={post.slug}
                onClick={() => router.push(`/blog/${post.slug}`)}
                className="group flex flex-col cursor-pointer p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 mb-4">
                  <Image
                    src={getPostCover(post)}
                    alt={post.title}
                    fill
                    className="object-contain group-hover:scale-[1.02] transition-transform duration-200"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mb-2 font-noto">
                  <span className="font-semibold uppercase tracking-wider">{post.category}</span>
                  <span>·</span>
                  <span>{formatDate(post.publishedAt)}</span>
                </div>

                <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-zinc-100 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-snug line-clamp-2 mb-2 font-noto">
                  {post.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4 font-noto">
                  {post.excerpt}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-noto">
                  <span>{post.author.name}</span>
                  <span>{BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট পাঠ</span>
                </div>
              </article>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 9)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-[0.98] font-noto"
              >
                <span>আরও আর্টিকেল দেখুন ({BanglaNameHelper.toBanglaNumeral(filteredPosts.length - visibleCount)}টি বাকি)</span>
                <span>↓</span>
              </button>
            </div>
          )}
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
