'use client';

import { useState, useMemo } from 'react';
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
  Youtube,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import BlogSearchModal from '@/components/blog/BlogSearchModal';
import { getPostCover } from '@/lib/blog-images';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Katen Signature Wave SVG Underline (in Deep Green)
const KatenWave = () => (
  <svg width="33" height="6" xmlns="http://www.w3.org/2000/svg" className="mt-1.5 mb-5 block">
    <path
      d="M0 2c3.5 0 3.5 2 7 2s3.5-2 7-2 3.5 2 7 2 3.5-2 7-2 3.5 2 5 2"
      stroke="#059669"
      strokeWidth="2.2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

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
  postCounts = {},
}: BlogListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') ?? '';

  const [heroTab, setHeroTab] = useState<'popular' | 'recent'>('popular');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [emailInput, setEmailInput] = useState('');

  const readSlugs = useReadHistory();

  // Bookmarks SWR
  const { data: bookmarkData, mutate: mutateBookmarks } = useSWR<{
    slugs: string[];
  }>('/api/blog/bookmarks', fetcher);
  const bookmarkedSlugs = useMemo(
    () => new Set(bookmarkData?.slugs ?? []),
    [bookmarkData],
  );

  const toggleBookmark = async (slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: `https://obhyash.com/blog/${post.slug}`,
      });
    } else {
      navigator.clipboard.writeText(`https://obhyash.com/blog/${post.slug}`);
      toast('লিংক কপি করা হয়েছে!');
    }
  };

  // Filtered latest posts
  const filteredLatestPosts = useMemo(() => {
    let result = posts;
    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (activeTag) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
      );
    }
    return result;
  }, [posts, activeCategory, activeTag]);

  // Content partition matching Katen's exact 4-section layout:
  const heroMainPost = featuredPost || posts[0];
  const heroPopularList = (recommendedPosts.length >= 4 ? recommendedPosts : posts).slice(0, 4);
  const heroRecentList = posts.slice(1, 5);

  // Editor's Pick section: 1 big card + 4 list cards
  const editorsPickMain = posts[1] || posts[0];
  const editorsPickList = posts.slice(2, 6);

  // Trending section: 2 cards grid + 2 small
  const trendingGrid = posts.slice(6, 8);
  const trendingSmall = posts.slice(8, 10);

  // Latest section: paginated list
  const latestList = filteredLatestPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLatestPosts.length;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c] = posts.filter((p) => p.category === c).length;
    });
    return counts;
  }, [posts, categories]);

  // Tag clouds
  const popularTags = [
    'HSC 2027',
    'HSC 2026',
    'পদার্থবিজ্ঞান',
    'রসায়ন',
    'উচ্চতর গণিত',
    'আইসিটি',
    'বাংলা ১ম পত্র',
    'ইংরেজি ২য় পত্র',
    'ভর্তি পরীক্ষা',
    'পড়ার কৌশল',
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    toast.success('অভ্যাস নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ!');
    setEmailInput('');
  };

  return (
    <div className="font-['Poppins',sans-serif] bg-white dark:bg-[#0e0e0e] text-[#203656] dark:text-slate-100 min-h-screen py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: HERO ROW (Screenshot 1)
            Left: Large Featured Hero Card
            Right: Tabbed Card (Popular / Recent) with Circular Thumbs
           ══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Hero Left (8 Cols): Big Featured Card */}
          <div
            onClick={() => router.push(`/blog/${heroMainPost.slug}`)}
            className="lg:col-span-8 group relative rounded-3xl overflow-hidden cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-300 min-h-[420px] sm:min-h-[480px] flex flex-col justify-end bg-slate-900"
          >
            <Image
              src={getPostCover(heroMainPost)}
              alt={heroMainPost.title}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1024px) 100vw, 800px"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

            {/* Content Bottom Left */}
            <div className="relative z-10 p-6 sm:p-10 md:p-12">
              <span className="inline-block px-3.5 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md mb-4 uppercase tracking-wider">
                {heroMainPost.category}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 group-hover:text-emerald-300 transition-colors font-anek">
                {heroMainPost.title}
              </h1>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80 font-anek">
                <span className="font-semibold text-white">{heroMainPost.author.name}</span>
                <span>•</span>
                <span>{formatDate(heroMainPost.publishedAt)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {BanglaNameHelper.toBanglaNumeral(heroMainPost.readTime)} মিনিট
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right (4 Cols): Tabbed Card (Popular / Recent) */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            {/* Tabs Header */}
            <div>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-white/5 rounded-full mb-6">
                <button
                  type="button"
                  onClick={() => setHeroTab('popular')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-150 ${
                    heroTab === 'popular'
                      ? 'bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white shadow-[0_3px_0_0_#064e3b,0_5px_12px_rgba(6,78,59,0.3)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Popular
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab('recent')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-150 ${
                    heroTab === 'recent'
                      ? 'bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white shadow-[0_3px_0_0_#064e3b,0_5px_12px_rgba(6,78,59,0.3)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Recent
                </button>
              </div>

              {/* 4 Posts with Circular Thumbs */}
              <div className="space-y-4">
                {(heroTab === 'popular' ? heroPopularList : heroRecentList).map((post) => (
                  <div
                    key={post.slug + '-hero-tab'}
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    className="flex items-center gap-4 group cursor-pointer pb-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0"
                  >
                    {/* Circular Thumbnail (52x52 rounded-full) */}
                    <div className="relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-white/10">
                      <Image
                        src={getPostCover(post)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="56px"
                      />
                    </div>
                    {/* Title + Date */}
                    <div className="flex-1 min-w-0 font-anek">
                      <h4 className="text-[13.5px] font-bold text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <span className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: EDITOR'S PICK ROW (Screenshot 2)
            Left: Editor's Pick Box (1 Big Card on Left + 4 List on Right)
            Right: Author Widget + Popular Posts with #1, #2 Badges
           ══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Editor's Pick */}
          <div className="lg:col-span-8">
            <h2 className="text-xl sm:text-2xl font-black text-[#203656] dark:text-white">
              Editor&apos;s Pick
            </h2>
            <KatenWave />

            {/* White Rounded Bordered Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Left Sub-Col (6 Cols): 1 Featured Post */}
                <div
                  onClick={() => router.push(`/blog/${editorsPickMain.slug}`)}
                  className="md:col-span-6 group cursor-pointer flex flex-col font-anek"
                >
                  <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 shadow-sm">
                    <Image
                      src={getPostCover(editorsPickMain)}
                      alt={editorsPickMain.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md">
                      {editorsPickMain.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#059669] text-white font-bold text-[10px] flex items-center justify-center">
                      {editorsPickMain.author.initials}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {editorsPickMain.author.name}
                    </span>
                    <span>•</span>
                    <span>{formatDate(editorsPickMain.publishedAt)}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors leading-snug mb-2.5">
                    {editorsPickMain.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {editorsPickMain.excerpt}
                  </p>
                </div>

                {/* Right Sub-Col (6 Cols): 4 Compact Items */}
                <div className="md:col-span-6 space-y-4">
                  {editorsPickList.map((post) => (
                    <div
                      key={post.slug + '-editor-list'}
                      onClick={() => router.push(`/blog/${post.slug}`)}
                      className="flex items-center gap-4 group cursor-pointer pb-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0 font-anek"
                    >
                      <div className="relative w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
                        <Image
                          src={getPostCover(post)}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13.5px] font-bold text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                        <span className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 Cols): Author Box + Popular Posts with 1, 2 Badges */}
          <div className="lg:col-span-4 space-y-8">
            {/* Widget 1: Author / About Box */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-7 text-center shadow-sm">
              <span className="text-3xl font-extrabold tracking-tight text-[#203656] dark:text-white block mb-3 font-['Poppins',sans-serif]">
                Obhyash<span className="text-[#059669]">.</span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto mb-5 font-anek">
                বাংলাদেশের শিক্ষার্থীদের এসএসসি, এইচএসসি এবং ভর্তি পরীক্ষার সেরা প্রস্তুতি ও নিয়মিত নির্দেশনার নির্ভরযোগ্য উন্মুক্ত প্ল্যাটফর্ম।
              </p>
              {/* Only Facebook & YouTube */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5 text-[#203656] dark:text-slate-300">
                <a
                  href="https://facebook.com/obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#059669] hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <Facebook className="w-4 h-4 fill-current" />
                </a>
                <a
                  href="https://youtube.com/@obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#059669] hover:text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                </a>
              </div>
            </div>

            {/* Widget 2: Popular Posts (With #1, #2 Badges) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-7 shadow-sm">
              <h3 className="text-base font-black text-[#203656] dark:text-white">
                Popular Posts
              </h3>
              <KatenWave />

              <div className="space-y-4">
                {heroPopularList.slice(0, 3).map((post, idx) => (
                  <div
                    key={post.slug + '-popular-widget'}
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    className="flex items-center gap-4 group cursor-pointer pb-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0 font-anek"
                  >
                    {/* Circular Thumbnail with Number Badge Overlay */}
                    <div className="relative w-14 h-14 shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-sm border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={getPostCover(post)}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="56px"
                        />
                      </div>
                      {/* Number Badge (1, 2) */}
                      <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <span className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: TRENDING ROW (Screenshot 3)
            Left: Trending Box (2 Column Grid + 2 Small Horizontal Items)
            Right: Explore Topics + Newsletter
           ══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Trending */}
          <div className="lg:col-span-8">
            <h2 className="text-xl sm:text-2xl font-black text-[#203656] dark:text-white">
              Trending
            </h2>
            <KatenWave />

            {/* White Rounded Bordered Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-8 shadow-sm">
              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-white/5 font-anek">
                {trendingGrid.map((post) => (
                  <div
                    key={post.slug + '-trend-grid'}
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 shadow-sm">
                      <Image
                        src={getPostCover(post)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 360px"
                      />
                      <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md">
                        {post.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
                      <div className="w-5 h-5 rounded-full bg-[#059669] text-white font-bold text-[9px] flex items-center justify-center">
                        {post.author.initials}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {post.author.name}
                      </span>
                      <span>•</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors leading-snug mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                ))}
              </div>

              {/* 2 Horizontal Compact Items Below Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 font-anek">
                {trendingSmall.map((post) => (
                  <div
                    key={post.slug + '-trend-small'}
                    onClick={() => router.push(`/blog/${post.slug}`)}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="relative w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
                      <Image
                        src={getPostCover(post)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 Cols): Explore Topics + Newsletter */}
          <div className="lg:col-span-4 space-y-8">
            {/* Widget 3: Explore Topics */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-7 shadow-sm">
              <h3 className="text-base font-black text-[#203656] dark:text-white">
                Explore Topics
              </h3>
              <KatenWave />

              <div className="divide-y divide-slate-100 dark:divide-white/5 font-anek">
                {categories.slice(0, 7).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="w-full flex items-center justify-between py-3 group text-xs sm:text-sm font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 group-hover:text-[#059669] dark:group-hover:text-[#34d399]">
                      <ChevronRight className="w-3.5 h-3.5 text-[#059669] group-hover:translate-x-1 transition-transform" />
                      {cat === 'All' ? 'সকল বিষয়' : cat}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">
                      ({categoryCounts[cat] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget 4: Newsletter */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-7 text-center shadow-sm font-anek">
              <h3 className="text-base font-black text-[#203656] dark:text-white">
                Newsletter
              </h3>
              <KatenWave />

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                সর্বশেষ স্টাডি টিপস, পরীক্ষার আপডেট ও মডেল টেস্টের নোটিফিকেশন পেতে যুক্ত হোন।
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Email address..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#059669]"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white text-xs font-bold shadow-[0_3px_0_0_#064e3b,0_5px_12px_rgba(6,78,59,0.3)] hover:shadow-[0_2px_0_0_#064e3b] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150"
                >
                  সাবস্ক্রাইব করুন
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: LATEST POSTS ROW (Screenshot 4)
            Left: Latest Posts with Classic Horizontal Cards + Load More
            Right: Obhyash Promo Banner + Tag Clouds
           ══════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 Cols): Latest Posts Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#203656] dark:text-white">
                  Latest Posts
                </h2>
                <KatenWave />
              </div>

              {/* Category Filter Pills (Quick filter) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-anek">
                {['All', 'এইচএসসি ২০২৭', 'এইচএসসি ২০২৬', 'ভর্তি'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c === 'ভর্তি' ? 'বিশ্ববিদ্যালয় ভর্তি' : c)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      (c === 'All' && activeCategory === 'All') || activeCategory === c
                        ? 'bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Classic Horizontal Cards */}
            <div className="space-y-6">
              {latestList.map((post) => (
                <div
                  key={post.slug + '-latest'}
                  onClick={() => router.push(`/blog/${post.slug}`)}
                  className="group flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer font-anek shadow-sm"
                >
                  {/* Thumbnail on Left */}
                  <div className="relative w-full sm:w-64 md:w-72 h-48 sm:h-auto shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={getPostCover(post)}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                    <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md">
                      {post.category}
                    </span>
                  </div>

                  {/* Content on Right */}
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div>
                      {/* Author + Category + Date */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#059669] text-white font-bold text-[9px] flex items-center justify-center">
                          {post.author.initials}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {post.author.name}
                        </span>
                        <span>•</span>
                        <span>{formatDate(post.publishedAt)}</span>
                        {readSlugs.has(post.slug) && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCheck className="w-3 h-3" />
                            পড়েছেন
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#203656] dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors leading-snug mb-2.5 line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Bottom Action Row (Share + Bookmark) */}
                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-white/5 text-slate-400">
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="hover:text-[#059669] transition-colors flex items-center gap-1 text-xs"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>শেয়ার</span>
                      </button>

                      <button
                        onClick={(e) => toggleBookmark(post.slug, e)}
                        className={`hover:text-[#059669] transition-colors flex items-center gap-1 text-xs ${
                          bookmarkedSlugs.has(post.slug) ? 'text-[#059669] font-bold' : ''
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${bookmarkedSlugs.has(post.slug) ? 'fill-current' : ''}`}
                        />
                        <span>{bookmarkedSlugs.has(post.slug) ? 'সংরক্ষিত' : 'বুকমার্ক'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More 3D Deep Green Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] text-white text-sm font-bold shadow-[0_3px_0_0_#064e3b,0_5px_12px_rgba(6,78,59,0.3)] hover:shadow-[0_2px_0_0_#064e3b] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150 group font-anek"
                >
                  <span>আরও আর্টিকেল লোড করুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar (4 Cols): Promo Banner + Tag Clouds */}
          <div className="lg:col-span-4 space-y-8">
            {/* Widget 5: Obhyash Platform Promo Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white p-7 shadow-xl relative overflow-hidden font-anek">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block mb-2">
                অভ্যাস এক্সাম সেল
              </span>
              <h3 className="text-xl font-black leading-snug mb-3">
                বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন ব্যাংক
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed mb-6 opacity-90">
                হাজারো নির্ভুল MCQ প্র্যাকটিস করো, সমাধান দেখো এবং নিজের ভুলগুলো স্বয়ংক্রিয় মিস্টেক নোটবুকে সংরক্ষণ করো।
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white text-[#064e3b] text-xs font-bold shadow-md hover:bg-emerald-50 transition-all"
              >
                <span>ফ্রি অনুশীলন শুরু করো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Widget 6: Tag Clouds */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] p-6 sm:p-7 shadow-sm font-anek">
              <h3 className="text-base font-black text-[#203656] dark:text-white">
                Tag Clouds
              </h3>
              <KatenWave />

              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/blog?tag=${encodeURIComponent(tag)}`)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#059669] hover:text-[#059669] dark:hover:text-[#34d399] transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Search Modal */}
      <BlogSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        posts={posts}
      />
    </div>
  );
}
