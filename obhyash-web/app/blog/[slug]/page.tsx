import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '@/lib/blog-data';
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
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// ─── SEO Metadata ──────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
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
  const post = await getBlogPost(slug);
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
      <section className="bg-white dark:bg-[#121212]">
        <div className="relative max-w-4xl mx-auto mt-16 px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-400 dark:text-slate-500 mb-8 font-medium">
            <Link
              href="/blog"
              className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1 font-anek"
            >
              <BookOpen className="w-3.5 h-3.5" />
              ব্লগ
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold text-slate-900 dark:text-slate-100 leading-[1.2] tracking-tight mb-8 font-anek">
            {post.title}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-[1.6] mb-8 font-medium font-anek">
            {post.excerpt}
          </p>

          {/* Author meta row */}
          <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-slate-100 dark:border-[#2b2b2b]">
            <div
              className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-semibold`}
            >
              {post.author.initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {post.author.name}
              </p>
              <p className="text-xs text-slate-400">{post.author.role}</p>
            </div>
            <div className="flex items-center gap-4 ml-auto text-xs text-slate-400 dark:text-slate-500 flex-wrap font-anek">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} মিনিট
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
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors group font-anek"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              ব্লগে ফিরে যান
            </Link>

            {/* Post body */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                text-slate-900 dark:text-slate-50
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                prose-h2:text-2xl sm:prose-h2:text-[26px] prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-none
                prose-h3:text-xl sm:prose-h3:text-[22px] prose-h3:mt-8
                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.8] sm:prose-p:leading-[1.9] prose-p:text-[17px] sm:prose-p:text-[18px] prose-p:mb-8
                prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:leading-[1.8] prose-li:text-[17px] sm:prose-li:text-[18px]
                prose-strong:text-slate-900 dark:prose-strong:text-slate-100 font-medium
                prose-a:text-slate-900 dark:prose-a:text-slate-200 prose-a:underline hover:prose-a:no-underline
                prose-blockquote:border-l-4 prose-blockquote:border-slate-800 dark:prose-blockquote:border-slate-200 prose-blockquote:pl-6 prose-blockquote:italic
                prose-ul:space-y-2 prose-ol:space-y-2
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 font-anek">
                ট্যাগ
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
            <div className="mt-10 p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b]">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg`}
                >
                  {post.author.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {post.author.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {post.author.role}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-anek">
                    অভ্যাস টিম স্মার্ট প্রযুক্তি এবং পরীক্ষিত শিক্ষার কৌশলগুলির
                    মাধ্যমে বাংলাদেশী শিক্ষার্থীদের তাদের একাডেমিক লক্ষ্য অর্জনে
                    সহায়তা করতে অঙ্গীকারবদ্ধ।
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* ── Sticky Sidebar (Right / 30%) ── */}
          <aside className="lg:w-[35%] xl:w-[32%] space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Dashboard promo */}
              <div className="rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] p-6 text-slate-900 dark:text-slate-100 font-anek">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#2b2b2b] flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="font-bold text-[15px] mb-2">অনুশীলনেই সাফল্য</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-[1.6] mb-5">
                  আপনি যা পড়েছেন তা অভ্যাস-এ রিয়েল বোর্ড-স্ট্যান্ডার্ড MCQ
                  পরীক্ষার মাধ্যমে প্রয়োগ করুন।
                </p>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  ড্যাশবোর্ডে যান
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Reading info card */}
              <div className="rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] p-5 space-y-3 font-anek">
                <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  আর্টিকেল তথ্য
                </h3>
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> পড়ার সময়
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {post.readTime} মিনিট
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> প্রকাশিত
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> ক্যাটাগরি
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 text-xs rounded-full border ${categoryStyle}`}
                    >
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>

              {related.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] p-5 font-anek">
                  <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    সম্পর্কিত পোস্ট
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
                            <Clock className="w-3 h-3" /> {rp.readTime} মিনিট
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
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 font-medium text-[13px] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors font-anek"
              >
                <BookOpen className="w-4 h-4" />
                সকল আর্টিকেল দেখুন
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
