'use client';

import { useState, useMemo } from 'react';
import { BlogPost } from '@/lib/blog-data';
import BlogCard from '@/components/blog/BlogCard';
import { BookOpen, Sparkles, TrendingUp, Search } from 'lucide-react';

interface BlogListingClientProps {
  posts: BlogPost[];
  featuredPost?: BlogPost;
  categories: string[];
}

export default function BlogListingClient({
  posts,
  featuredPost,
  categories,
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
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b40_1px,transparent_1px),linear-gradient(to_bottom,#1e293b40_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        {/* Radial glow */}
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-rose-50/70 via-transparent to-transparent dark:from-rose-950/20 dark:via-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full border border-rose-100 dark:border-rose-500/20 uppercase tracking-wider animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Knowledge for Students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5 animate-fade-in">
            Study Smarter,{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700">
                Score Higher
              </span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-rose-100 dark:bg-rose-500/20 -z-10 rounded-sm" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Expert tips, proven exam strategies, and insights to help
            Bangladeshi students ace SSC, HSC, and beyond.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
            {[
              { icon: BookOpen, label: `${posts.length} Articles` },
              { icon: TrendingUp, label: 'Exam Strategies' },
              { icon: Sparkles, label: 'Free to Read' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400"
              >
                <Icon className="w-4 h-4 text-rose-500" />
                {label}
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm shadow-slate-900/5 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* ─── Category Filter ─── */}
      <div className="sticky top-16 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max mx-auto justify-start sm:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 scale-[1.03]'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 hover:text-rose-600 dark:hover:text-rose-400'
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
        {/* Featured Post */}
        {showFeatured && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Featured Post
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
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  All Articles
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Try a different search term or category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Clear filters →
            </button>
          </div>
        )}
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 p-8 sm:p-12 text-white text-center shadow-2xl shadow-rose-500/30">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Obhyash Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Ready to practice what you&apos;ve learned?
            </h2>
            <p className="text-rose-100 mb-7 max-w-lg mx-auto">
              Take real board-level MCQ practice exams, track your progress, and
              identify weak spots — all in one place.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-lg"
            >
              Open Student Dashboard
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
