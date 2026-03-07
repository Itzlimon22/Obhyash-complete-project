import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPost, getAllPosts } from '@/lib/blog-data';

// ISR: serve cached HTML, revalidate in background every hour
// Aligned with the unstable_cache revalidate: 3600 in lib/blog-data.ts
export const revalidate = 3600;

// Pre-render all known slugs at build time; unknown slugs render on demand
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
import ViewTracker from '@/components/blog/ViewTracker';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { cloneElement } from 'react';
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
import MermaidRenderer from '@/components/blog/MermaidRenderer';
import SocialShare from '@/components/blog/SocialShare';
import TableOfContents from '@/components/blog/TableOfContents';
import CommentSection from '@/components/blog/CommentSection';
import NewsletterSubscribe from '@/components/blog/NewsletterSubscribe';
import BackToTop from '@/components/blog/BackToTop';
import BlogBookmarkButton from '@/components/blog/BlogBookmarkButton';
import EmojiReactions from '@/components/blog/EmojiReactions';

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
    blockquote: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'blockquote'> & { node?: unknown }) => {
      // Check if this is a custom callout
      const ch = children as React.ReactElement<{
        children?: React.ReactNode;
      }>[];
      const text = (ch?.[1]?.props as { children?: string } | undefined)
        ?.children;
      let calloutType: string | null = null;
      let cleanText: React.ReactNode = children;

      if (typeof text === 'string') {
        const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (match) {
          calloutType = match[1].toUpperCase();
          // Remove the tag from the text when rendering
          const updatedChild = cloneElement(
            ch[1],
            {},
            text.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, ''),
          );
          cleanText = [ch[0], updatedChild, ...ch.slice(2)];
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
      interface CalloutConfig {
        color: string;
        icon: React.ReactNode;
      }

      const config: Record<string, CalloutConfig> = {
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
    pre: ({
      node: _,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'pre'> & { node?: unknown }) => {
      // Intercept Mermaid / diagram code blocks.
      // rehypeHighlight appends ' hljs' to the className even for unknown
      // languages, so we must use includes() rather than exact equality.
      const codeChild = (
        Array.isArray(children) ? children[0] : children
      ) as React.ReactElement<{
        className?: string;
        children?: string;
      }>;
      const lang = codeChild?.props?.className ?? '';
      if (lang.includes('language-mermaid')) {
        const code = String(codeChild?.props?.children ?? '').replace(
          /\n$/,
          '',
        );
        return <MermaidRenderer code={code} />;
      }

      return (
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
          >
            {children}
          </pre>
        </div>
      );
    },
    code: ({
      node: _,
      inline,
      className,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'code'> & {
      node?: unknown;
      inline?: boolean;
    }) => {
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
    table: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'table'> & { node?: unknown }) => (
      <figure className="not-prose my-6 sm:my-8 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left border-collapse m-0 min-w-[480px] text-[13.5px] sm:text-[14.5px]"
            {...props}
          />
        </div>
      </figure>
    ),
    thead: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'thead'> & { node?: unknown }) => (
      <thead
        className="bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-800/60 border-b-2 border-indigo-100 dark:border-indigo-900/50"
        {...props}
      />
    ),
    th: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'th'> & { node?: unknown }) => (
      <th
        className="px-4 py-3 align-middle font-semibold text-indigo-900 dark:text-indigo-200 whitespace-nowrap tracking-wide text-[12px] sm:text-[13px] uppercase first:rounded-tl-2xl last:rounded-tr-2xl"
        {...props}
      />
    ),
    td: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'td'> & { node?: unknown }) => (
      <td
        className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 first:font-medium first:text-slate-900 dark:first:text-slate-100"
        {...props}
      />
    ),
    tr: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'tr'> & { node?: unknown }) => (
      <tr
        className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/25 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors duration-150"
        {...props}
      />
    ),
    img: ({
      node: _,
      alt,
      src,
      ...props
    }: React.ComponentPropsWithoutRef<'img'> & { node?: unknown }) => (
      <span className="block my-8 sm:my-10 group relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ''}
          {...props}
          className="w-full h-auto object-contain max-h-[600px] md:group-hover:scale-[1.01] transition-transform duration-500 m-0"
          loading="lazy"
        />
        {alt && (
          <span className="block text-center text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 p-3 font-anek italic bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {alt}
          </span>
        )}
      </span>
    ),
    ul: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'ul'> & { node?: unknown }) => (
      <ul
        className="list-none ml-2 sm:ml-4 space-y-2 sm:space-y-3 my-6 sm:my-8"
        {...props}
      />
    ),
    ol: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'ol'> & { node?: unknown }) => (
      <ol
        className="list-decimal list-outside ml-5 sm:ml-6 space-y-2 sm:space-y-3 marker:text-rose-500/80 dark:marker:text-rose-400/80 marker:font-semibold my-6 font-anek"
        {...props}
      />
    ),
    li: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'li'> & {
      node?: unknown;
      children?: React.ReactNode;
    }) => {
      // For unordered lists, add custom bullet icon
      const isUnordered =
        (node as { parent?: { tagName?: string } } | undefined)?.parent
          ?.tagName === 'ul';
      if (isUnordered) {
        return (
          <li className="relative pl-6 sm:pl-7 text-slate-700 dark:text-slate-300 leading-[1.8] text-[16px] sm:text-[17px] md:text-[18px]">
            <span className="absolute left-1 sm:left-1.5 top-[10px] sm:top-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
            {children}
          </li>
        );
      }
      return (
        <li
          className="pl-1 sm:pl-2 text-slate-700 dark:text-slate-300 leading-[1.8] text-[16px] sm:text-[17px] md:text-[18px]"
          {...props}
        >
          {children}
        </li>
      );
    },
    a: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'a'> & { node?: unknown }) => (
      <a
        className="text-rose-600 dark:text-rose-400 font-semibold underline decoration-rose-200 dark:decoration-rose-900 underline-offset-4 hover:decoration-rose-500 dark:hover:decoration-rose-500 transition-colors inline-block"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    hr: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'hr'> & { node?: unknown }) => (
      <hr
        className="my-10 sm:my-14 border-slate-200 dark:border-slate-800"
        {...props}
      />
    ),
    h1: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h1'> & { node?: unknown }) => (
      <h1
        className="text-3xl sm:text-4xl md:text-[40px] font-extrabold mt-12 sm:mt-16 mb-6 sm:mb-8 text-slate-900 dark:text-slate-50 font-anek tracking-tight leading-tight"
        {...props}
      />
    ),
    h2: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h2'> & { node?: unknown }) => (
      <h2
        className="text-2xl sm:text-3xl md:text-[32px] font-bold mt-12 sm:mt-14 mb-5 sm:mb-6 text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-3 font-anek tracking-tight"
        {...props}
      />
    ),
    h3: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h3'> & { node?: unknown }) => (
      <h3
        className="text-xl sm:text-2xl md:text-[26px] font-bold mt-10 mb-4 sm:mb-5 text-slate-800 dark:text-slate-100 font-anek"
        {...props}
      />
    ),
    h4: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h4'> & { node?: unknown }) => (
      <h4
        className="text-lg sm:text-xl md:text-[22px] font-bold mt-8 mb-3 sm:mb-4 text-slate-800 dark:text-slate-200 font-anek"
        {...props}
      />
    ),
    h5: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h5'> & { node?: unknown }) => (
      <h5
        className="text-[17px] sm:text-[19px] font-bold mt-6 mb-3 text-slate-700 dark:text-slate-300 font-anek"
        {...props}
      />
    ),
    h6: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h6'> & { node?: unknown }) => (
      <h6
        className="text-[15px] sm:text-[17px] font-bold mt-6 mb-2 text-slate-600 dark:text-slate-400 font-anek uppercase tracking-wide"
        {...props}
      />
    ),
    iframe: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'iframe'> & { node?: unknown }) => (
      <div className="relative w-full aspect-video my-8 sm:my-10 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 bg-slate-900">
        <iframe
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          {...props}
        />
      </div>
    ),
    p: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'p'> & { node?: unknown }) => (
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
          <div className="flex flex-wrap items-center gap-3 pb-12">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-semibold shrink-0`}
              >
                {post.author.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-400">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto text-xs text-slate-400 dark:text-slate-500 flex-wrap font-anek">
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
              ব্লগে ফিরে যাও
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
            <div className="max-w-[72ch] mx-auto">
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
                    [rehypeHighlight, { ignoreMissing: true }],
                  ]}
                  components={MarkdownComponents}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 font-anek flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  ট্যাগ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                    >
                      <span className="opacity-60">#</span>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {/* end max-w readable */}

            {/* Emoji Reactions */}
            <EmojiReactions slug={post.slug} />

            {/* Comments Section */}
            <CommentSection postSlug={post.slug} />

            {/* Share + Save Bar */}
            <div className="flex flex-wrap items-center gap-2.5 mt-5 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2b2b2b]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-anek">
                শেয়ার ও সেভ
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <SocialShare url={jsonLd.url} title={post.title} compact />
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <BlogBookmarkButton slug={post.slug} iconOnly />
              </div>
            </div>

            {/* Author Bio block */}
            <div className="mt-5 mb-4 p-5 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b]">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg">
                  {post.author.initials}
                </div>
                <div>
                  <Link
                    href={`/blog/author/${post.author.name}`}
                    className="font-bold text-[15px] text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {post.author.name}
                  </Link>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mt-0.5">
                    {post.author.role}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-anek">
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
