import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPost } from '@/lib/blog-data';
import ViewTracker from '@/components/blog/ViewTracker';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

import ProgressBar from '@/components/blog/ProgressBar';
import SocialShare from '@/components/blog/SocialShare';
import TableOfContents from '@/components/blog/TableOfContents';
import CommentSection from '@/components/blog/CommentSection';
import LikeButton from '@/components/blog/LikeButton';
import NewsletterSubscribe from '@/components/blog/NewsletterSubscribe';
import BackToTop from '@/components/blog/BackToTop';

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

// ─── Page Component ────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const categoryStyle =
    'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

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

  // Extract headings for Table of Contents
  const extractHeadings = (markdown: string) => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items = [];
    let match;
    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
        .replace(/(^-|-$)/g, '');
      items.push({ id, text, level });
    }
    return items;
  };
  const tocItems = extractHeadings(post.content);

  // Custom Markdown Callout components
  const MarkdownComponents = {
    blockquote: ({ node, children, ...props }: any) => {
      // Check if this is a custom callout
      const text = children?.[1]?.props?.children;
      let calloutType = null;
      let cleanText = children;

      if (typeof text === 'string') {
        const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (match) {
          calloutType = match[1].toUpperCase();
          // Remove the tag from the text when rendering
          const updatedChild = { ...children[1] };
          updatedChild.props = {
            ...updatedChild.props,
            children: text.replace(
              /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
              '',
            ),
          };
          cleanText = [children[0], updatedChild, ...children.slice(2)];
        }
      }

      if (!calloutType) {
        return (
          <blockquote
            className="border-l-4 border-rose-500 dark:border-rose-400 pl-5 sm:pl-6 py-2 sm:py-3 my-6 sm:my-8 bg-rose-50/50 dark:bg-rose-900/10 rounded-r-xl italic text-slate-700 dark:text-slate-300 text-[16px] sm:text-[17px] leading-relaxed"
            {...props}
          >
            {children}
          </blockquote>
        );
      }

      // Render custom gorgeous callout boxes
      const config: any = {
        NOTE: {
          color:
            'bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-200',
          icon: <Info className="w-5 h-5 text-blue-500" />,
        },
        TIP: {
          color:
            'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200',
          icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
        },
        IMPORTANT: {
          color:
            'bg-purple-50/50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-200',
          icon: <CheckCircle2 className="w-5 h-5 text-purple-500" />,
        },
        WARNING: {
          color:
            'bg-amber-50/50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        },
        CAUTION: {
          color:
            'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200',
          icon: <AlertOctagon className="w-5 h-5 text-rose-500" />,
        },
      };

      const { color, icon } = config[calloutType] || config.NOTE;

      return (
        <div
          className={`not-prose flex flex-col sm:flex-row gap-3 p-4 sm:p-5 my-6 sm:my-8 rounded-xl border ${color} font-anek`}
        >
          <div className="shrink-0 mt-0.5">{icon}</div>
          <div className="text-[15px] sm:text-[16px] leading-relaxed [&>p]:m-0">
            {cleanText}
          </div>
        </div>
      );
    },
    pre: ({ node, ...props }: any) => (
      <div className="relative group rounded-xl overflow-hidden my-6 sm:my-8 bg-[#0d1117] border border-slate-800 shadow-xl">
        <div className="flex items-center px-4 py-2 sm:py-2.5 bg-[#161b22] border-b border-slate-800">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80"></div>
          </div>
        </div>
        <pre
          {...props}
          className="p-4 sm:p-5 overflow-x-auto text-[13px] sm:text-[14px] leading-relaxed font-mono m-0 bg-transparent text-slate-300 custom-scrollbar"
        />
      </div>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md text-[13px] sm:text-[14px] font-mono font-medium text-rose-600 dark:text-rose-400 before:content-none after:content-none border border-rose-100 dark:border-rose-900/30"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-8 sm:my-10 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm custom-scrollbar">
        <table
          className="w-full text-left border-collapse m-0 min-w-[500px] text-[14px] sm:text-[15px]"
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead
        className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
        {...props}
      />
    ),
    th: ({ node, ...props }: any) => (
      <th
        className="p-3 sm:p-4 align-middle font-semibold border-slate-200 dark:border-slate-800 whitespace-nowrap"
        {...props}
      />
    ),
    td: ({ node, ...props }: any) => (
      <td
        className="p-3 sm:p-4 align-middle border-t border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400"
        {...props}
      />
    ),
    tr: ({ node, ...props }: any) => (
      <tr
        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        {...props}
      />
    ),
    img: ({ node, ...props }: any) => (
      <span className="block my-8 sm:my-10 group relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <img
          {...props}
          className="w-full h-auto object-contain max-h-[600px] md:group-hover:scale-[1.01] transition-transform duration-500 m-0"
          loading="lazy"
        />
        {props.alt && (
          <span className="block text-center text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 p-3 font-anek italic bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {props.alt}
          </span>
        )}
      </span>
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className="list-none ml-2 sm:ml-4 space-y-2 sm:space-y-3 my-6 sm:my-8"
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal list-outside ml-5 sm:ml-6 space-y-2 sm:space-y-3 marker:text-rose-500/80 dark:marker:text-rose-400/80 marker:font-semibold my-6 font-anek"
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => {
      // For unordered lists, add custom bullet icon
      const isUnordered = node?.parent?.tagName === 'ul';
      if (isUnordered) {
        return (
          <li className="relative pl-6 sm:pl-7 text-slate-700 dark:text-slate-300 leading-[1.8] text-[16px] sm:text-[17px] md:text-[18px]">
            <span className="absolute left-1 sm:left-1.5 top-[10px] sm:top-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
            {props.children}
          </li>
        );
      }
      return (
        <li
          className="pl-1 sm:pl-2 text-slate-700 dark:text-slate-300 leading-[1.8] text-[16px] sm:text-[17px] md:text-[18px]"
          {...props}
        />
      );
    },
    a: ({ node, ...props }: any) => (
      <a
        className="text-rose-600 dark:text-rose-400 font-semibold underline decoration-rose-200 dark:decoration-rose-900 underline-offset-4 hover:decoration-rose-500 dark:hover:decoration-rose-500 transition-colors inline-block"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    hr: ({ node, ...props }: any) => (
      <hr
        className="my-10 sm:my-14 border-slate-200 dark:border-slate-800"
        {...props}
      />
    ),
    h1: ({ node, ...props }: any) => (
      <h1
        className="text-3xl sm:text-4xl md:text-[40px] font-extrabold mt-12 sm:mt-16 mb-6 sm:mb-8 text-slate-900 dark:text-slate-50 font-anek tracking-tight leading-tight"
        {...props}
      />
    ),
    h2: ({ node, ...props }: any) => (
      <h2
        className="text-2xl sm:text-3xl md:text-[32px] font-bold mt-12 sm:mt-14 mb-5 sm:mb-6 text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-3 font-anek tracking-tight"
        {...props}
      />
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className="text-xl sm:text-2xl md:text-[26px] font-bold mt-10 mb-4 sm:mb-5 text-slate-800 dark:text-slate-100 font-anek"
        {...props}
      />
    ),
    h4: ({ node, ...props }: any) => (
      <h4
        className="text-lg sm:text-xl md:text-[22px] font-bold mt-8 mb-3 sm:mb-4 text-slate-800 dark:text-slate-200 font-anek"
        {...props}
      />
    ),
    h5: ({ node, ...props }: any) => (
      <h5
        className="text-[17px] sm:text-[19px] font-bold mt-6 mb-3 text-slate-700 dark:text-slate-300 font-anek"
        {...props}
      />
    ),
    h6: ({ node, ...props }: any) => (
      <h6
        className="text-[15px] sm:text-[17px] font-bold mt-6 mb-2 text-slate-600 dark:text-slate-400 font-anek uppercase tracking-wide"
        {...props}
      />
    ),
    iframe: ({ node, ...props }: any) => (
      <div className="relative w-full aspect-video my-8 sm:my-10 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 bg-slate-900">
        <iframe
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          {...props}
        />
      </div>
    ),
    p: ({ node, ...props }: any) => (
      <p
        className="text-slate-700 dark:text-slate-300 leading-[1.8] sm:leading-[1.9] text-[16.5px] sm:text-[17px] md:text-[18px] mb-6 sm:mb-8 text-justify font-normal"
        {...props}
      />
    ),
  };

  return (
    <>
      <ProgressBar />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker slug={post.slug} />

      {/* ─── Post Hero ─── */}
      <section className="bg-[#FAF6F3] dark:bg-[#121212]">
        <div className="relative max-w-6xl mx-auto mt-16 px-4 sm:px-6">
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

          <h1 className="text-4xl sm:text-5xl md:text-[56px] font-extrabold text-slate-900 dark:text-slate-50 leading-[1.15] tracking-tight mb-6 font-anek">
            {post.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-[1.6] mb-8 font-light font-anek max-w-4xl">
            {post.excerpt}
          </p>

          {/* Author meta row */}
          <div className="flex flex-wrap items-center gap-4 pb-12">
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

      {/* Cover image */}
      {post.coverImage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
          <div className="relative w-full h-64 sm:h-80 md:h-[420px] rounded-2xl overflow-hidden shadow-md border border-black/5 dark:border-white/5">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1152px"
              priority
            />
          </div>
        </div>
      )}

      {/* ─── Single-column layout ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col gap-10">
          <article className="min-w-0">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors group font-anek"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              ব্লগে ফিরে যান
            </Link>

            {/* Top Cards: Table of Contents & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <TableOfContents items={tocItems} />

              {/* Reading info card */}
              <div className="rounded-2xl bg-[#fafafa] dark:bg-[#111] p-5 space-y-3 font-anek">
                <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  আর্টিকেল তথ্য
                </h3>
                <div className="space-y-3 sm:space-y-4 text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> পড়ার সময়
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {post.readTime} মিনিট
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{' '}
                      প্রকাশিত
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ক্যাটাগরি
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs rounded-full border ${categoryStyle}`}
                    >
                      {post.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post body */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none w-full
                prose-strong:text-slate-900 dark:prose-strong:text-slate-100 font-medium
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[
                  rehypeKatex,
                  rehypeRaw,
                  rehypeSlug,
                  rehypeHighlight,
                ]}
                components={MarkdownComponents}
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
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <CommentSection postSlug={post.slug} />
            </div>

            {/* Interaction Ribbon (Likes + Social Share) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-10 bg-slate-50 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-slate-100 dark:border-[#2b2b2b]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-anek">
                  পোস্টটি কেমন লাগলো?
                </span>
                <LikeButton postSlug={post.slug} />
              </div>
              <SocialShare url={jsonLd.url} title={post.title} />
            </div>

            {/* Author Bio block */}
            <div className="mt-10 mb-8 p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b]">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg`}
                >
                  {post.author.initials}
                </div>
                <div>
                  <Link
                    href={`/blog/author/${post.author.name}`}
                    className="font-bold text-lg text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {post.author.name}
                  </Link>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mt-0.5">
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

            {/* Newsletter Subscription */}
            <NewsletterSubscribe />
          </article>
        </div>
      </div>
      <BackToTop />
    </>
  );
}
