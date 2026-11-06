'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogPost } from '@/lib/blog-data';
import { useReadHistory } from '@/hooks/use-read-history';
import {
  Clock,
  Search,
  ArrowRight,
  X,
  Flame,
  BookOpen,
  RotateCcw,
  Sparkles,
  Layers,
  GraduationCap,
  FlaskConical,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import BlogSearchModal from '@/components/blog/BlogSearchModal';

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

    return fullSearchable.includes(cat);
  }

  return true;
}

// Primary Filter Tabs
const FILTER_TABS = [
  { id: 'All', label: 'সকল বিষয়' },
  { id: 'HSC 2026', label: 'এইচএসসি ২০২৬' },
  { id: 'HSC 2027', label: 'এইচএসসি ২০২৭' },
  { id: 'এসএসসি', label: 'এসএসসি কর্নার' },
  { id: 'ভর্তি পরীক্ষা', label: 'ভর্তি পরীক্ষা' },
  { id: 'স্টাডি হ্যাকস', label: 'স্টাডি হ্যাকস ও রুটিন' },
  { id: 'পদার্থবিজ্ঞান', label: 'পদার্থবিজ্ঞান' },
  { id: 'রসায়ন', label: 'রসায়ন' },
  { id: 'উচ্চতর গণিত', label: 'উচ্চতর গণিত' },
  { id: 'আইসিটি', label: 'আইসিটি' },
];

function getCategoryColor(category?: string, tags?: string[]) {
  const t = `${category || ''} ${(tags || []).join(' ')}`.toLowerCase();
  if (t.includes('পদার্থ') || t.includes('physics')) {
    return {
      accent: 'amber',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      borderHover: 'hover:border-amber-500/40',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    };
  }
  if (t.includes('রসায়ন') || t.includes('রসায়ন') || t.includes('chem')) {
    return {
      accent: 'teal',
      badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
      borderHover: 'hover:border-teal-500/40',
      gradient: 'from-teal-500/10 via-emerald-500/5 to-transparent',
    };
  }
  if (t.includes('গণিত') || t.includes('math')) {
    return {
      accent: 'violet',
      badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
      borderHover: 'hover:border-violet-500/40',
      gradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
    };
  }
  if (t.includes('জীববিজ্ঞান') || t.includes('bio')) {
    return {
      accent: 'emerald',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40',
      gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    };
  }
  if (t.includes('আইসিটি') || t.includes('ict')) {
    return {
      accent: 'cyan',
      badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
      borderHover: 'hover:border-cyan-500/40',
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    };
  }
  if (t.includes('ভর্তি') || t.includes('admission') || t.includes('বুয়েট') || t.includes('মেডিকেল')) {
    return {
      accent: 'blue',
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      borderHover: 'hover:border-blue-500/40',
      gradient: 'from-blue-500/10 via-sky-500/5 to-transparent',
    };
  }
  if (t.includes('স্টাডি') || t.includes('হ্যাকস') || t.includes('রুটিন') || t.includes('টিপস')) {
    return {
      accent: 'rose',
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
      borderHover: 'hover:border-rose-500/40',
      gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
    };
  }
  return {
    accent: 'slate',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/20',
    borderHover: 'hover:border-slate-400',
    gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
  };
}

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
  recommendedPosts,
}: BlogListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTag = searchParams.get('tag') ?? '';
  const initialCategory = searchParams.get('category') ?? '';
  const initialQuery = searchParams.get('q') ?? '';

  const [activeCategory, setActiveCategory] = useState<string>(() => initialCategory || 'All');
  const [activeTag, setActiveTag] = useState<string>(() => initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(() => initialQuery);
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Sync state when URL params change
  useEffect(() => {
    const currentTag = searchParams.get('tag') ?? '';
    const currentCategory = searchParams.get('category') ?? '';
    const currentQ = searchParams.get('q') ?? '';

    setActiveTag(currentTag);
    setActiveCategory(currentCategory || 'All');
    setSearchQuery(currentQ);
  }, [searchParams]);

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

  const handleSelectCategory = (catId: string) => {
    const nextCat = catId === activeCategory && catId !== 'All' ? 'All' : catId;
    setActiveCategory(nextCat);
    setVisibleCount(9);
    updateUrl(nextCat, activeTag, searchQuery);
  };

  const handleSelectTag = (tag: string) => {
    const nextTag = tag === activeTag ? '' : tag;
    setActiveTag(nextTag);
    setVisibleCount(9);
    updateUrl(activeCategory, nextTag, searchQuery);
  };

  const handleResetFilters = () => {
    setActiveCategory('All');
    setActiveTag('');
    setSearchQuery('');
    setVisibleCount(9);
    router.push('/blog', { scroll: false });
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => matchPost(post, activeCategory, activeTag, searchQuery));
  }, [posts, activeCategory, activeTag, searchQuery]);

  const isFiltered = useMemo(() => {
    return (
      (activeCategory !== 'All' && activeCategory !== 'সকল বিষয়' && Boolean(activeCategory)) ||
      Boolean(activeTag) ||
      Boolean(searchQuery.trim())
    );
  }, [activeCategory, activeTag, searchQuery]);

  // Lead Hero Article + Trending List
  const heroMainPost = featuredPost || posts[0];
  const trendingPosts = useMemo(() => {
    const list = recommendedPosts.length >= 4 ? recommendedPosts : posts.slice(1, 6);
    return list.filter((p) => p.slug !== heroMainPost?.slug).slice(0, 4);
  }, [recommendedPosts, posts, heroMainPost]);

  // Topic Clusters (when browsing all)
  const boardPosts = useMemo(() => {
    return posts
      .filter(
        (p) =>
          p.slug !== heroMainPost?.slug &&
          (matchPost(p, 'এইচএসসি ২০২৬', '', '') ||
            matchPost(p, 'এসএসসি', '', '') ||
            p.title.includes('বোর্ড') ||
            p.title.includes('সাজেশন'))
      )
      .slice(0, 3);
  }, [posts, heroMainPost]);

  const admissionPosts = useMemo(() => {
    return posts
      .filter(
        (p) =>
          p.slug !== heroMainPost?.slug &&
          (matchPost(p, 'ভর্তি পরীক্ষা', '', '') ||
            p.title.includes('ভর্তি') ||
            p.title.includes('বুয়েট') ||
            p.title.includes('মেডিকেল'))
      )
      .slice(0, 3);
  }, [posts, heroMainPost]);

  const studyHacksPosts = useMemo(() => {
    return posts
      .filter(
        (p) =>
          p.slug !== heroMainPost?.slug &&
          (matchPost(p, 'স্টাডি হ্যাকস', '', '') ||
            p.title.includes('কৌশল') ||
            p.title.includes('রুটিন') ||
            p.title.includes('টিপস'))
      )
      .slice(0, 3);
  }, [posts, heroMainPost]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <div className="bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-zinc-100 min-h-screen pb-20 transition-colors font-noto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        {/* ─── 1. EDITORIAL MASTHEAD ─────────────────────────────── */}
        <section className="pt-8 sm:pt-12 pb-6 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>অভ্যাস অ্যাকাডেমিক পাবলিকেশন</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-noto">
                অভ্যাস ব্লগ
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 font-noto max-w-xl">
                পড়ালেখার বৈজ্ঞানিক কৌশল, বিগত বছরের বোর্ড প্রশ্ন অ্যানালাইসিস ও ভার্সিটি ভর্তি নির্দেশিকা।
              </p>
            </div>

            {/* Sleek inline search bar */}
            <div className="relative w-full sm:w-80 shrink-0">
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
                placeholder="আর্টিকেল খুঁজুন (যেমন: উচ্চতর গণিত, বুয়েট)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-noto"
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

          {/* Minimal Horizontal Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 -mb-2">
            {FILTER_TABS.map((tab) => {
              const isActive =
                (tab.id === 'All' && (!activeCategory || activeCategory === 'All')) ||
                activeCategory === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 font-noto border ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── ACTIVE FILTER BAR (Shown only when filtered) ─────────── */}
        {isFiltered && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 py-3 border-b border-slate-100 dark:border-zinc-800/80 font-noto">
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
              সব ফিল্টার মুছুন
            </button>
          </div>
        )}

        {/* ─── 2. EDITORIAL HERO SPLIT: LEAD STORY + TRENDING TOP 4 ── */}
        {!isFiltered && heroMainPost && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Lead Feature Story */}
            <article
              onClick={() => router.push(`/blog/${heroMainPost.slug}`)}
              className="lg:col-span-7 group cursor-pointer rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    <span>সম্পাদকীয় নির্বাচন</span>
                  </span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    {formatDate(heroMainPost.publishedAt)}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-[1.25] tracking-tight mb-4">
                  {heroMainPost.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-6">
                  {heroMainPost.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <span className="font-semibold text-slate-900 dark:text-zinc-200">
                    {heroMainPost.author?.name || 'অভ্যাস অ্যাকাডেমিক টিম'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {BanglaNameHelper.toBanglaNumeral(heroMainPost.readTime)} মিনিট পাঠ
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
                  <span>সম্পূর্ণ গাইড পড়ুন</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </article>

            {/* Right 5 Columns: Trending / Most Read Ranked List */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 sm:p-7">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-zinc-800">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  সর্বাধিক পঠিত ও ট্রেন্ডিং
                </h3>
              </div>

              <div className="space-y-4">
                {trendingPosts.map((post, idx) => {
                  const rankBengali = ['০১', '০২', '০৩', '০৪'][idx] || `০${idx + 1}`;
                  return (
                    <article
                      key={post.slug}
                      onClick={() => router.push(`/blog/${post.slug}`)}
                      className="group cursor-pointer flex items-start gap-3.5 pb-4 last:pb-0 border-b last:border-0 border-slate-200/60 dark:border-zinc-800/60 transition-colors"
                    >
                      <span className="text-lg font-black text-slate-300 dark:text-zinc-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0 w-6">
                        {rankBengali}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                          {post.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 block">
                          {BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট পাঠ
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── 3. TOPIC CLUSTERS (Only shown in default / unfiltered mode) ─── */}
        {!isFiltered && (
          <div className="space-y-12 pt-4">
            {/* Cluster 1: Board Exam Special */}
            {boardPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                        বোর্ড পরীক্ষা প্রস্তুতি ও অধ্যায়ভিত্তিক গাইড
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        এসএসসি ও এইচএসসি পরীক্ষার সাজেশন, মানবণ্টন ও রিভিশন টেকনিক
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectCategory('HSC 2026')}
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>সকল বোর্ড গাইড</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {boardPosts.map((post) => (
                    <EditorialCard key={post.slug} post={post} onOpen={() => router.push(`/blog/${post.slug}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Cluster 2: Varsity & Medical Admission */}
            {admissionPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                        বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি পরীক্ষা
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        বুয়েট, মেডিকেল ও ঢাকা বিশ্ববিদ্যালয় ভর্তি যুদ্ধের প্রস্তুতি কৌশল
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectCategory('ভর্তি পরীক্ষা')}
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                  >
                    <span>ভর্তি সহায়িকা</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {admissionPosts.map((post) => (
                    <EditorialCard key={post.slug} post={post} onOpen={() => router.push(`/blog/${post.slug}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Cluster 3: Study Hacks & Scientific Learning */}
            {studyHacksPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                        বৈজ্ঞানিক পড়ার কৌশল ও স্টাডি হ্যাকস
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        কম পরিশ্রমে বেশি মনে রাখার কৌশল, রুটিন প্ল্যান ও মাইন্ডসেট
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectCategory('স্টাডি হ্যাকস')}
                    className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
                  >
                    <span>স্টাডি হ্যাকস</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {studyHacksPosts.map((post) => (
                    <EditorialCard key={post.slug} post={post} onOpen={() => router.push(`/blog/${post.slug}`)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ─── 4. ALL RECENT ARTICLES GRID (Filterable & Paginated) ─── */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {isFiltered ? 'ফিল্টারকৃত আর্টিকেলসমূহ' : 'সকল সাম্প্রতিক আর্টিকেল'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {filteredPosts.length}টি প্রকাশনা
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3 font-noto">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visiblePosts.map((post) => (
                <EditorialCard key={post.slug} post={post} onOpen={() => router.push(`/blog/${post.slug}`)} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 9)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.98] font-noto"
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

// ─── Human-Crafted Editorial Article Card (No Duplicate Text SVG) ──
function EditorialCard({ post, onOpen }: { post: BlogPost; onOpen: () => void }) {
  const theme = getCategoryColor(post.category, post.tags);

  return (
    <article
      onClick={onOpen}
      className={`group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60 p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs hover:shadow-md flex flex-col justify-between`}
    >
      <div>
        {/* Top Header Strip: Subtle Accent Banner + Category Pill */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
            {post.category}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
            {BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট পাঠ
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>
      </div>

      {/* Footer: Date & Read CTA */}
      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 dark:text-zinc-500">{formatDate(post.publishedAt)}</span>
        <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-zinc-200 group-hover:translate-x-0.5 transition-transform">
          <span>পড়ুন</span>
          <ArrowRight className="w-3 h-3 text-emerald-600" />
        </span>
      </div>
    </article>
  );
}
