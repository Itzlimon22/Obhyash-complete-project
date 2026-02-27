import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts, getBlogPost } from '@/lib/blog-data';
import { getAdvancedRecommendations } from '@/lib/blog-recommendations';
import { createClient } from '@/utils/supabase/server';
import ViewTracker from '@/components/blog/ViewTracker';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  LayoutDashboard,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

// ─── SEO Metadata ──────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      url: `https://obhyash.com/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://obhyash.com/blog/${post.slug}`,
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  'Study Tips':
    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
  'MCQ Techniques':
    'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
  'Exam Prep':
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  'Time Management':
    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  Motivation:
    'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
};

// ─── Page Component ────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const related = await getAdvancedRecommendations(post.slug, user?.id);

  const categoryStyle =
    CATEGORY_COLORS[post.category] ??
    'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Obhyash',
      url: 'https://obhyash.com',
    },
    datePublished: post.publishedAt,
    keywords: post.tags.join(', '),
    url: `https://obhyash.com/blog/${post.slug}`,
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker slug={post.slug} />

      {/* ─── Post Hero ─── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800">
        {/* Gradient color bar at top based on category */}
        <div className={`h-1 w-full bg-gradient-to-r ${post.coverColor}`} />

        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b40_1px,transparent_1px),linear-gradient(to_bottom,#1e293b40_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-rose-50/60 via-transparent to-transparent dark:from-rose-950/15" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-8">
            <Link
              href="/blog"
              className="hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Blog
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px] sm:max-w-none">
              {post.title}
            </span>
          </div>

          {/* Category badge */}
          <div className="mb-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${categoryStyle}`}
            >
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-5">
            {post.title}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-2xl">
            {post.excerpt}
          </p>

          {/* Author meta row */}
          <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.coverColor} flex items-center justify-center text-white text-sm font-bold shadow-md`}
            >
              {post.author.initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {post.author.name}
              </p>
              <p className="text-xs text-slate-400">{post.author.role}</p>
            </div>
            <div className="flex items-center gap-4 ml-auto text-xs text-slate-400 dark:text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} min read
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Two-column layout ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 xl:gap-16">
          {/* ── Article Content (Left / 70%) ── */}
          <article className="lg:w-[65%] xl:w-[68%] min-w-0">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Blog
            </Link>

            {/* Post body */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800
                prose-h3:text-xl prose-h3:mt-8
                prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-8 prose-p:text-base sm:prose-p:text-[17px]
                prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:leading-7
                prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                prose-a:text-rose-600 dark:prose-a:text-rose-400 prose-a:no-underline hover:prose-a:underline
                prose-ul:space-y-1 prose-ol:space-y-1
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author Bio block */}
            <div className="mt-10 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${post.coverColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                >
                  {post.author.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {post.author.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {post.author.role}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    The Obhyash team is passionate about helping Bangladeshi
                    students achieve their academic goals through smart
                    technology and proven learning strategies.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* ── Sticky Sidebar (Right / 30%) ── */}
          <aside className="lg:w-[35%] xl:w-[32%] space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Dashboard promo */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-6 text-white shadow-xl shadow-rose-500/20">
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg mb-2">
                    Practice Makes Perfect
                  </h3>
                  <p className="text-rose-100 text-sm leading-relaxed mb-5">
                    Apply what you&apos;ve read with real board-level MCQ exams
                    on Obhyash.
                  </p>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 hover:scale-[1.02] transition-all duration-200 shadow-md"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Reading info card */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Article Info
                </h3>
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Read Time
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {post.readTime} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Published
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Category
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 text-xs rounded-full border ${categoryStyle}`}
                    >
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Related Posts
                  </h3>
                  <div className="space-y-4">
                    {related.map((rp) => (
                      <Link
                        key={rp.slug}
                        href={`/blog/${rp.slug}`}
                        className="group flex items-start gap-3"
                      >
                        <div
                          className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${rp.coverColor} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {rp.author.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                            {rp.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rp.readTime} min
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* All posts link */}
              <Link
                href="/blog"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                View All Articles
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
