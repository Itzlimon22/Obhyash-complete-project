'use client';

import { useState, useMemo } from 'react';
import { BlogPost } from '@/lib/blog-data';
import BlogCard from '@/components/blog/BlogCard';
import { BookOpen, Sparkles, TrendingUp, Search } from 'lucide-react';

interface BlogListingClientProps {
  posts: BlogPost[];
  featuredPost?: BlogPost;
  categories: string[];
  recommendedPosts: BlogPost[];
  isGuest: boolean;
}

export default function BlogListingClient({
  posts,
  featuredPost,
  categories,
  recommendedPosts,
  isGuest,
}: BlogListingClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory);
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
  }, [posts, activeCategory, searchQuery]);

  const nonFeaturedFiltered = filteredPosts.filter(
    (p) => !p.featured || activeCategory !== 'All' || searchQuery,
  );

  const showFeatured = !searchQuery && activeCategory === 'All' && featuredPost;

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-[#2b2b2b]">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-slate-100 dark:bg-[#202020] text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-[#383838] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            শিক্ষার্থীদের জন্য
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 leading-[1.25] tracking-tight mb-5 animate-fade-in font-anek">
            স্মার্ট প্রস্তুতি,{' '}
            <span className="text-slate-600 dark:text-slate-400">
              সেরা ফলাফল
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-anek">
            বাংলাদেশের শিক্ষার্থীদের SSC, HSC এবং অন্যান্য পরীক্ষায় সফল হতে
            সাহায্য করার জন্য বিশেষজ্ঞ টিপস, পরীক্ষিত কৌশল এবং দিকনির্দেশনা।
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
            {[
              { icon: BookOpen, label: `${posts.length} আর্টিকেল` },
              { icon: TrendingUp, label: 'পরীক্ষার কৌশল' },
              { icon: Sparkles, label: 'সম্পূর্ণ ফ্রি' },
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

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="আর্টিকেল খুঁজুন…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-[#383838] bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* ─── Category Filter ─── */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-slate-100 dark:border-[#2b2b2b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max mx-auto justify-start sm:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#202020]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Recommended Top Section (Only shown if no search) */}
        {!searchQuery &&
          activeCategory === 'All' &&
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
                  <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] rounded-xl p-6 mb-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-[15px] text-left max-w-2xl leading-[1.6]">
                      <strong>এখানে নতুন?</strong> অভ্যাস-এ রেজিস্টার করে আপনার
                      অনুশীলনের তথ্যের ওপর ভিত্তি করে আপনার দুর্বল বিষয়গুলোর
                      জন্য নির্দিষ্ট স্টাডি টিপস, পরীক্ষার কৌশল এবং আর্টিকেল
                      পান।
                    </p>
                    <a
                      href="/login"
                      className="shrink-0 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg transition-colors text-sm hover:bg-slate-800 dark:hover:bg-slate-200 whitespace-nowrap font-anek"
                    >
                      ফ্রি অ্যাকাউন্ট খুলুন
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight font-anek">
                    আপনার জন্য প্রস্তাবিত
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {recommendedPosts.map((post) => (
                  <BlogCard key={post.slug + '-rec'} post={post} />
                ))}
              </div>
            </div>
          )}

        {showFeatured && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-anek">
                নির্বাচিত পোস্ট
              </h2>
            </div>
            <BlogCard post={featuredPost!} featured />
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
                <BlogCard key={post.slug} post={post} />
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
              }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors font-anek"
            >
              ফিল্টার মুছুন →
            </button>
          </div>
        )}
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] p-8 sm:p-12 text-center shadow-sm">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-white/50 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-full uppercase tracking-wider border border-slate-200 dark:border-[#383838]">
              <Sparkles className="w-3.5 h-3.5" />
              অভ্যাস প্ল্যাটফর্ম
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 font-anek">
              যা শিখেছেন তা অনুশীলনের জন্য প্রস্তুত?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto text-[15px] leading-[1.6] font-anek">
              বোর্ড স্ট্যান্ডার্ড MCQ মডেল টেস্ট দিন, আপনার অগ্রগতি ট্র্যাক করুন
              এবং দুর্বল বিষয়গুলো চিহ্নিত করুন — সবই এক জায়গায়।
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm font-anek"
            >
              স্টুডেন্ট ড্যাশবোর্ডে যান
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
