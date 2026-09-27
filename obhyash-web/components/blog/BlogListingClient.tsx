'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  CheckCircle2,
  Star,
  Award,
  GraduationCap,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import BlogSearchModal from '@/components/blog/BlogSearchModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SUB_CATEGORIES = [
  'সব',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'উচ্চতর গণিত',
  'আইসিটি',
  'হিসাববিজ্ঞান',
  'ব্যবসায় সংগঠন ও ব্যবস্থাপনা',
  'ফিন্যাও্স/ব্যাংকিং',
  'উৎপাদন ব্যবস্থাপনা ও বিপণন',
  'বাংলাদেশ ও বিশ্বপরিচয়',
  'ভূগোল',
  'পৌরনীতি',
  'ইসলাম শিক্ষা',
  'বাংলা ১ম পত্র',
  'বাংলা ২য় পত্র',
  'ইংরেজি ১ম পত্র',
  'ইংরেজি ২য় পত্র',
  'সাধারণ গণিত',
];

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  All: 'সব',
  'Study Tips': 'স্টাডি টিপস',
  'Exam Prep': 'পরীক্ষার প্রস্তুতি',
  'MCQ Techniques': 'MCQ কৌশল',
  'Time Management': 'সময় ব্যবস্থাপনা',
  Motivation: 'অনুপ্রেরণা',
};

export type AudienceSegment =
  | 'all'
  | 'admission-2026'
  | 'test-paper'
  | 'study-hacks'
  | 'saved';

export const AUDIENCE_SEGMENTS = [
  { id: 'all' as const, label: 'সকল পোস্ট', icon: Sparkles },
  { id: 'admission-2026' as const, label: 'বিশ্ববিদ্যালয় ভর্তি ২০২৬', icon: GraduationCap },
  { id: 'test-paper' as const, label: 'এইচএসসি টেস্ট পেপার', icon: BookOpen },
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
      'admission-2026': posts.filter(
        (p) =>
          p.tags.some((t) =>
            /ভর্তি|Admission|বুয়েট|মেডিকেল|গুচ্ছ|CKRUET|DU|MIST|BUP/i.test(t),
          ) || /ভর্তি|admission|circular|সার্কুলার/i.test(p.title),
      ).length,
      'test-paper': posts.filter(
        (p) =>
          p.tags.some((t) => /টেস্ট পেপার|Test Paper/i.test(t)) ||
          /টেস্ট পেপার|test paper/i.test(p.title),
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

    if (activeSegment === 'admission-2026') {
      result = result.filter(
        (p) =>
          p.tags.some((t) =>
            /ভর্তি|Admission|বুয়েট|মেডিকেল|গুচ্ছ|CKRUET|DU|MIST|BUP/i.test(t),
          ) || /ভর্তি|admission|circular|সার্কুলার/i.test(p.title),
      );
    } else if (activeSegment === 'test-paper') {
      result = result.filter(
        (p) =>
          p.tags.some((t) => /টেস্ট পেপার|Test Paper/i.test(t)) ||
          /টেস্ট পেপার|test paper/i.test(p.title),
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

    if (
      activeCategory === 'বিষয়ভিত্তিক পড়াশোনা' &&
      activeSubCategory !== 'সব'
    ) {
      result = result.filter((p) => p.tags.includes(activeSubCategory));
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

    if (activeTag) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
      );
    }

    return result;
  }, [
    posts,
    activeSegment,
    activeCategory,
    activeSubCategory,
    searchQuery,
    activeTag,
    showSaved,
    bookmarkedSlugs,
  ]);

  const nonFeaturedFiltered = filteredPosts.filter(
    (p) =>
      !p.featured ||
      activeCategory !== 'All' ||
      activeSubCategory !== 'সব' ||
      searchQuery,
  );

  const showFeatured =
    !searchQuery &&
    !activeTag &&
    !showSaved &&
    activeCategory === 'All' &&
    activeSubCategory === 'সব' &&
    featuredPost;

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-[#FAF6F3] dark:bg-[#0a0a0a]">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-50 leading-[1.15] tracking-tight mb-6 animate-fade-in font-anek">
            স্মার্ট প্রস্তুতি,{' '}
            <span className="text-slate-500 dark:text-slate-400 font-light">
              সেরা ফলাফল
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-anek font-light">
            বাংলাদেশের শিক্ষার্থীদের SSC, HSC এবং অন্যাও্য পরীক্ষায় সফল হতে
            সাহায্য করার জন্য বিশেষজ্ঞ টিপস, পরীক্ষিত কৌশল এবং দিকনির্দেশনা।
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
            {[
              { icon: BookOpen, label: `${posts.length} আর্টিকেল` },
              { icon: TrendingUp, label: 'পরীক্ষার কৌশল' },
              { icon: CheckCircle2, label: 'সম্পূর্ণ ফ্রি' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-500"
              >
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>

          {/* Search bar — opens live search modal on click or Enter */}
          <div
            onClick={() => setIsSearchModalOpen(true)}
            className="relative max-w-lg mx-auto cursor-pointer group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-hover:text-rose-500 transition-colors pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="আর্টিকেল বা বিষয় সার্চ করুন..."
              value={searchQuery}
              className="w-full pl-11 pr-28 py-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-white shadow-sm dark:bg-[#111] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none cursor-pointer transition-all text-[15px] font-anek"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearchModalOpen(true);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors font-anek whitespace-nowrap shadow-sm shadow-rose-600/20"
              >
                সার্চ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Segmented Filter & Category Filter ─── */}
      <div id="blog-category-sticky-bar" className="sticky top-16 z-40 bg-[#FAF6F3]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.04] pt-3 pb-3 space-y-2">
        {/* Segmented Audience Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center">
            {AUDIENCE_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isActive = activeSegment === seg.id;
              const count = segmentCounts[seg.id as keyof typeof segmentCounts];
              return (
                <button
                  key={seg.id}
                  onClick={() => {
                    setActiveSegment(seg.id);
                    if (seg.id === 'saved') {
                      setShowSaved(true);
                    } else {
                      setShowSaved(false);
                    }
                    setActiveCategory('All');
                    setActiveSubCategory('সব');
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all font-anek shrink-0 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-white/80 dark:bg-[#141414] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-500'}`} />
                  <span>{seg.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-category pills for All / Subject study */}
        {activeSegment === 'all' && (
          <div className="max-w-7xl mx-auto pt-1">
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#FAF6F3]/90 dark:from-[#0a0a0a]/90 to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#FAF6F3]/90 dark:from-[#0a0a0a]/90 to-transparent z-10" />
              <div className="overflow-x-auto no-scrollbar px-4 sm:px-6">
                <div className="flex items-center gap-1.5 min-w-max mx-auto justify-start sm:justify-center">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setShowSaved(false);
                        setActiveCategory(cat);
                        setActiveSubCategory('সব');
                      }}
                      className={`px-3 py-1 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors border font-anek ${
                        !showSaved && activeCategory === cat
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                          : 'bg-transparent text-slate-600 dark:text-slate-400 border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {cat === 'All' ? 'সব বিষয়' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeCategory === 'বিষয়ভিত্তিক পড়াশোনা' && (
              <div className="relative mt-2 pt-2 border-t border-slate-100 dark:border-[#2b2b2b]">
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#FAF6F3]/90 dark:from-[#0a0a0a]/90 to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#FAF6F3]/90 dark:from-[#0a0a0a]/90 to-transparent z-10" />
                <div className="overflow-x-auto no-scrollbar px-4 sm:px-6">
                  <div className="flex items-center gap-2 min-w-max mx-auto justify-start sm:justify-center">
                    {SUB_CATEGORIES.map((subcat) => (
                      <button
                        key={subcat}
                        onClick={() => setActiveSubCategory(subcat)}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border font-anek ${
                          activeSubCategory === subcat
                            ? 'bg-slate-100 dark:bg-[#202020] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#404040]'
                            : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {subcat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Active tag filter chip */}
        {activeTag && (
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-anek">
              ট্যাগ ফিল্টার:
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-full border border-rose-200 dark:border-rose-900 font-anek">
              #{activeTag}
              <button
                onClick={() => router.push('/blog')}
                aria-label="ফিল্টার সরান"
                className="hover:text-rose-800 dark:hover:text-rose-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs text-slate-400 font-anek">
              {filteredPosts.length} টি আর্টিকেল পাওয়া গেছে
            </span>
          </div>
        )}

        {/* Recommended Top Section (Only shown if no search/tag) */}
        {!searchQuery &&
          !activeTag &&
          !showSaved &&
          activeCategory === 'All' &&
          activeSubCategory === 'সব' &&
          recommendedPosts.length > 0 && (
            <div className="mb-16 pt-4 border-b border-slate-100 dark:border-[#2b2b2b] pb-16">
              {isGuest ? (
                <>
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-anek">
                      শিক্ষার্থীদের কাছে জনপ্রিয়
                    </h2>
                  </div>
                  <div id="blog-guest-account-banner" className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-6 sm:p-8 mb-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] inapp-hide">
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-[15px] sm:text-[16px] text-left max-w-2xl leading-[1.6]">
                      <strong>এখানে নতুন?</strong> অভ্যাস-এ রেজিস্টার করে তোমার
                      অনুশীলনের তথ্যের ওপর ভিত্তি করে তোমার দুর্বল বিষয়গুলোর
                      জন্য নির্দিষ্ট স্টাডি টিপস, পরীক্ষার কৌশল এবং আর্টিকেল
                      পান।
                    </p>
                    <a
                      href="/login"
                      className="shrink-0 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg transition-colors text-sm hover:bg-slate-800 dark:hover:bg-slate-200 whitespace-nowrap font-anek"
                    >
                      ফ্রি অ্যাকাউন্ট খোলো
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight font-anek">
                    তোমার জন্য প্রস্তাবিত
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {recommendedPosts.map((post) => (
                  <BlogCard
                    key={post.slug + '-rec'}
                    post={post}
                    stats={postCounts[post.slug]}
                    isBookmarked={bookmarkedSlugs.has(post.slug)}
                    onToggleBookmark={toggleBookmark}
                    isRead={readSlugs.has(post.slug)}
                  />
                ))}
              </div>
            </div>
          )}

        {showFeatured && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-anek">
                নির্বাচিত পোস্ট
              </h2>
            </div>
            <BlogCard
              post={featuredPost!}
              featured
              stats={postCounts[featuredPost!.slug]}
              isBookmarked={bookmarkedSlugs.has(featuredPost!.slug)}
              onToggleBookmark={toggleBookmark}
              isRead={readSlugs.has(featuredPost!.slug)}
            />
          </div>
        )}

        {/* Post Grid */}
        {filteredPosts.length > 0 ? (
          <>
            {showFeatured && nonFeaturedFiltered.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-anek">
                  সকল আর্টিকেল
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {(showFeatured && !searchQuery
                ? nonFeaturedFiltered
                : filteredPosts
              ).map((post) => (
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
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-anek">
              কোনো আর্টিকেল পাওয়া যায়নি
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-anek">
              ভিন্ন কোনো শব্দ বা ক্যাটাগরি দিয়ে খুঁজুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setActiveSubCategory('সব');
              }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors font-anek"
            >
              ফিল্টার মুছুন →
            </button>
          </div>
        )}
      </section>

      {/* ─── CTA Banner ─── */}
      <section id="blog-cta-banner" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] p-8 sm:p-12 text-center shadow-sm">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-white/50 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-full uppercase tracking-wider border border-slate-200 dark:border-[#383838]">
              <GraduationCap className="w-3.5 h-3.5" />
              অভ্যাস প্ল্যাটফর্ম
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 font-anek">
              যা শিখেছেন তা অনুশীলনের জন্য প্রস্তুত?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto text-[15px] leading-[1.6] font-anek">
              বোর্ড স্ট্যাও্ডার্ড MCQ মডেল টেস্ট দিন, তোমার অগ্রগতি ট্র্যাক করো
              এবং দুর্বল বিষয়গুলো চিহ্নিত করো — সবই এক জায়গায়।
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm font-anek"
            >
              স্টুডেন্ট ড্যাশবোর্ডে যাও
            </Link>
          </div>
        </div>
      </section>

      {/* Live Search Modal */}
      <BlogSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        posts={posts}
        initialQuery={searchQuery}
      />
    </>
  );
}
