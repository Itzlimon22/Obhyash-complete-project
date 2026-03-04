'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BlogPost } from '@/lib/blog-data';
import BlogCard from '@/components/blog/BlogCard';
import { Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import useSWR from 'swr';
import { useReadHistory } from '@/hooks/use-read-history';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResult {
  posts: BlogPost[];
  postCounts: Record<string, { likes: number; views: number }>;
  total: number;
}

interface BlogSearchPageProps {
  categories: string[];
}

const ALL_CATEGORIES = 'সব';

export default function BlogSearchPage({ categories }: BlogSearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query for both URL sync and SWR key
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      router.replace(`/blog/search${query.trim() ? `?${params}` : ''}`, {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query, router]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Server-side search via API
  const searchKey = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (activeCategory !== ALL_CATEGORIES)
      params.set('category', activeCategory);
    return `/api/blog/search?${params.toString()}`;
  }, [debouncedQuery, activeCategory]);

  const { data: searchData, isLoading } = useSWR<SearchResult>(
    searchKey,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const posts = searchData?.posts ?? [];
  const postCounts = searchData?.postCounts ?? {};
  const total = searchData?.total ?? 0;

  // Bookmarks (shared SWR key)
  const { data: bookmarkData, mutate: mutateBookmarks } = useSWR<{
    slugs: string[];
  }>('/api/blog/bookmarks', fetcher);
  const bookmarkedSlugs = useMemo(
    () => new Set(bookmarkData?.slugs ?? []),
    [bookmarkData],
  );

  const readSlugs = useReadHistory();

  const toggleBookmark = async (slug: string) => {
    if (!bookmarkData) return;
    const already = bookmarkedSlugs.has(slug);
    const next = already
      ? bookmarkData.slugs.filter((s) => s !== slug)
      : [...bookmarkData.slugs, slug];
    mutateBookmarks({ slugs: next }, false);
    await fetch('/api/blog/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    mutateBookmarks();
  };

  const hasQuery = debouncedQuery.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF6F3] dark:bg-[#0a0a0a]">
      {/* ─── Search Hero ─── */}
      <div className="bg-[#FAF6F3] dark:bg-[#0a0a0a] border-b border-slate-100 dark:border-[#1e1e1e] pt-20 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6 font-anek"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ব্লগে ফিরে যান
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 font-anek mb-5">
            আর্টিকেল খুঁজুন
          </h1>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="শিরোনাম, বিষয়, ট্যাগ বা লেখক..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#111] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-400/20 shadow-sm text-[16px] font-anek transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#2b2b2b] text-slate-500 hover:bg-slate-200 dark:hover:bg-[#333] transition-colors"
                aria-label="মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Result count */}
          {hasQuery && !isLoading && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-anek">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {total}
              </span>{' '}
              টি ফলাফল পাওয়া গেছে{' '}
              <span className="text-rose-500 dark:text-rose-400">
                &ldquo;{debouncedQuery}&rdquo;
              </span>{' '}
              এর জন্য
            </p>
          )}
        </div>
      </div>

      {/* ─── Category chips + Results ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setActiveCategory(ALL_CATEGORIES)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border font-anek ${
              activeCategory === ALL_CATEGORIES
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm border-transparent'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-black/8 dark:border-white/8 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            সব
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(cat === activeCategory ? ALL_CATEGORIES : cat)
              }
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border font-anek ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm border-transparent'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-black/8 dark:border-white/8 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading && !searchData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-100 dark:bg-[#1e1e1e] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Results grid */}
        {(!isLoading || searchData) &&
          (posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.slug}
                  post={post}
                  stats={postCounts[post.slug]}
                  isBookmarked={bookmarkedSlugs.has(post.slug)}
                  onToggleBookmark={toggleBookmark}
                  isRead={readSlugs.has(post.slug)}
                />
              ))}
            </div>
          ) : hasQuery ? (
            /* No results */
            <div className="text-center py-24">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 dark:bg-[#1e1e1e] flex items-center justify-center">
                <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-anek">
                কোনো ফলাফল পাওয়া যায়নি
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-anek">
                &ldquo;{debouncedQuery}&rdquo; অনুসন্ধানে কোনো আর্টিকেল মেলেনি।
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-sm text-slate-500 dark:text-slate-400 font-anek">
                <span>পরামর্শ:</span>
                <span>ভিন্ন বানান বা ছোট শব্দ ব্যবহার করুন</span>
              </div>
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory(ALL_CATEGORIES);
                }}
                className="mt-6 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-anek"
              >
                অনুসন্ধান মুছুন →
              </button>
            </div>
          ) : (
            /* Empty state — no query yet */
            <div className="text-center py-20">
              <p className="text-slate-400 dark:text-slate-500 font-anek text-[15px]">
                উপরের বাক্সে কিছু টাইপ করুন এবং সব আর্টিকেল থেকে ফলাফল দেখুন।
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
