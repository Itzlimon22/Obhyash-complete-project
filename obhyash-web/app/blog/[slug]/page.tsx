import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPost, getAllPosts } from '@/lib/blog-data';
import { getPostCover } from '@/lib/blog-images';

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
import BackToTop from '@/components/blog/BackToTop';
import BlogBookmarkButton from '@/components/blog/BlogBookmarkButton';
import BlogQuickShareButton from '@/components/blog/BlogQuickShareButton';
import HscGpaCalculator from '@/components/blog/HscGpaCalculator';
import InArticleRelatedCard from '@/components/blog/InArticleRelatedCard';
import ResultStepFlow from '@/components/blog/ResultStepFlow';
import SscScholarshipConversionCard from '@/components/blog/SscScholarshipConversionCard';
import HscPhysicsPdfDownloadCard from '@/components/blog/HscPhysicsPdfDownloadCard';

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
      images: [
        {
          url: `https://obhyash.com${getPostCover(post)}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [`https://obhyash.com${getPostCover(post)}`],
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

function formatBanglaDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return formatDate(dateStr);
  }
}

// Helper to inject in-article "আরও পড়ুন" card
function injectInArticleRelated(content: string, relatedSlug?: string): string {
  // If author explicitly used [related:slug], replace with widget div
  let processed = content.replace(/\[related:([a-zA-Z0-9_-]+)\]/g, (_match, slug) => {
    return `\n\n<div data-widget="related-post" data-slug="${slug}"></div>\n\n`;
  });

  if (!relatedSlug) return processed;

  // If already contains a related widget, do not auto-inject
  if (processed.includes('data-widget="related-post"')) {
    return processed;
  }

  // Auto-inject after the 3rd regular paragraph
  const blocks = processed.split(/\n{2,}/);
  if (blocks.length < 5) {
    return processed;
  }

  let paragraphCount = 0;
  let insertIndex = -1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    // Skip headings, tables, blockquotes, code fences, html tags, lists
    if (
      !block ||
      block.startsWith('#') ||
      block.startsWith('```') ||
      block.startsWith('<') ||
      block.startsWith('|') ||
      block.startsWith('>') ||
      block.startsWith('- ') ||
      block.startsWith('* ') ||
      /^\d+\.\s/.test(block)
    ) {
      continue;
    }

    paragraphCount++;
    if (paragraphCount === 3) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1 && blocks.length >= 6) {
    insertIndex = Math.floor(blocks.length / 2);
  }

  if (insertIndex !== -1 && insertIndex < blocks.length) {
    const widgetHtml = `<div data-widget="related-post" data-slug="${relatedSlug}"></div>`;
    blocks.splice(insertIndex, 0, widgetHtml);
    return blocks.join('\n\n');
  }

  return processed;
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

  const allPosts = await getAllPosts();
  const postsBySlug = new Map(allPosts.map((p) => [p.slug, p]));
  const otherPosts = allPosts.filter((p) => p.slug !== post.slug);

  // 4 Related posts (matching category or tags, fallback to other posts)
  const relatedPosts = otherPosts
    .filter((p) => p.category === post.category || p.tags.some((t) => post.tags.includes(t)))
    .concat(otherPosts)
    .filter((p, index, self) => self.findIndex((item) => item.slug === p.slug) === index)
  // Britti / scholarship page should not have in-article related card
  const isBrittiPost =
    post.slug === 'ssc-scholarship-britti-result-2026-check' ||
    post.slug.includes('britti');

  const processedContent = isBrittiPost
    ? post.content
    : injectInArticleRelated(post.content, relatedPosts[0]?.slug);

  const categoryStyle =
    'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `https://obhyash.com/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt,
    image: [
      `https://obhyash.com${getPostCover(post)}`,
    ],
    author: {
      '@type': 'Organization',
      name: post.author.name,
      url: 'https://obhyash.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Obhyash',
      url: 'https://obhyash.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://obhyash.com/icon-512.png',
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://obhyash.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    url: `https://obhyash.com/blog/${post.slug}`,
    inLanguage: 'bn-BD',
  };

  // Extract FAQs for FAQPage Schema if article contains FAQ section
  const faqItems: Array<{ question: string; answer: string }> = [];
  const faqSectionMatch = post.content.match(/## সচরাচর জিজ্ঞাসা \(FAQ\)[\s\S]*?(?=\n## |\n---|$)/);
  if (faqSectionMatch) {
    const faqSection = faqSectionMatch[0];
    const qMatches = [...faqSection.matchAll(/### ([^\n]+)\n+([\s\S]*?)(?=\n### |\n## |\n---|$)/g)];
    for (const m of qMatches) {
      const q = m[1].trim();
      const a = m[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*`_]/g, '').replace(/\s+/g, ' ');
      if (q && a) {
        faqItems.push({ question: q, answer: a });
      }
    }
  }

  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null;

  // Custom Markdown Callout components
  const MarkdownComponents = {
    div: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'div'> & { node?: unknown }) => {
      const widget = (props as Record<string, unknown>)['data-widget'];
      if (widget === 'hsc-gpa-calculator') {
        return <HscGpaCalculator />;
      }
      if (widget === 'result-step-flow' || widget === 'hsc-result-steps') {
        return <ResultStepFlow />;
      }
      if (widget === 'ssc-scholarship-alert') {
        return <SscScholarshipConversionCard variant="board-alert" />;
      }
      if (widget === 'ssc-college-prep') {
        return <SscScholarshipConversionCard variant="college-prep" />;
      }
      if (widget === 'hsc-physics-pdf-download') {
        return <HscPhysicsPdfDownloadCard />;
      }
      if (widget === 'related-post') {
        if (isBrittiPost) return null;
        const targetSlug = (props as Record<string, unknown>)['data-slug'] as string;
        const targetPost = postsBySlug.get(targetSlug) || relatedPosts[0];
        if (targetPost) {
          return <InArticleRelatedCard post={targetPost} />;
        }
      }
      return <div {...props} />;
    },
    blockquote: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<'blockquote'> & { node?: unknown }) => {
      // Helper to find the first non-empty text inside nested React elements
      const findFirstText = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) {
          for (const item of node) {
            const text = findFirstText(item);
            if (text.trim()) return text;
          }
        }
        if (node && typeof node === 'object' && 'props' in node) {
          const p = (node as React.ReactElement).props as { children?: React.ReactNode };
          if (p?.children) return findFirstText(p.children);
        }
        return '';
      };

      // Helper to strip [!NOTE] tag from the first text node
      const stripTag = (node: React.ReactNode): React.ReactNode => {
        if (typeof node === 'string') {
          return node.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
        }
        if (Array.isArray(node)) {
          let stripped = false;
          return node.map((child) => {
            if (!stripped) {
              const text = findFirstText(child);
              if (/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.test(text.trim())) {
                stripped = true;
                return stripTag(child);
              }
            }
            return child;
          });
        }
        if (node && typeof node === 'object' && 'props' in node) {
          const el = node as React.ReactElement;
          const p = el.props as { children?: React.ReactNode };
          if (p?.children) {
            return cloneElement(el, {}, stripTag(p.children));
          }
        }
        return node;
      };

      const firstText = findFirstText(children).trim();
      const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      const calloutType = match ? match[1].toUpperCase() : null;
      const cleanText = calloutType ? stripTag(children) : children;

      if (!calloutType) {
        return (
          <blockquote
            className="border-l-4 border-slate-300 dark:border-slate-700 pl-5 sm:pl-6 py-2 sm:py-3 my-6 sm:my-8 bg-slate-50 dark:bg-slate-900/60 rounded-r-xl not-italic text-slate-700 dark:text-slate-300 text-[16px] sm:text-[17px] leading-relaxed font-noto [&_p]:before:content-none [&_p]:after:content-none"
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
            'bg-blue-50/60 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-950 dark:text-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        },
        TIP: {
          color:
            'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200',
          icon: <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        },
        IMPORTANT: {
          color:
            'bg-purple-50/60 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-950 dark:text-purple-200',
          icon: <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        },
        WARNING: {
          color:
            'bg-amber-50/60 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-950 dark:text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        },
        CAUTION: {
          color:
            'bg-rose-50/60 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-950 dark:text-rose-200',
          icon: <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        },
      };

      const { color, icon } = config[calloutType] || config.NOTE;

      return (
        <div
          className={`not-prose flex flex-col sm:flex-row gap-3.5 p-4 sm:p-5 my-6 sm:my-8 rounded-xl border ${color} font-noto not-italic shadow-sm`}
        >
          <div className="shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0 text-[15px] sm:text-[16.5px] leading-relaxed space-y-2 [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_strong]:font-bold [&_p]:before:content-none [&_p]:after:content-none">
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
      <figure className="not-prose my-8 sm:my-10 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] bg-white dark:bg-slate-900/95 overflow-hidden">
        {/* Top vibrant brand gradient ribbon */}
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
        <div className="overflow-x-auto custom-scrollbar">
          <table
            className="w-full text-left border-collapse m-0 min-w-[520px] font-noto tabular-nums text-[14.5px] sm:text-[15.5px]"
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
        className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80"
        {...props}
      />
    ),
    th: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'th'> & { node?: unknown }) => (
      <th
        className="px-5 sm:px-6 py-4 align-middle font-bold text-slate-800 dark:text-slate-100 font-noto tracking-wider text-[13px] sm:text-[14px] uppercase whitespace-nowrap first:pl-6 last:pr-6"
        {...props}
      />
    ),
    td: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'td'> & { node?: unknown }) => (
      <td
        className="px-5 sm:px-6 py-3.5 sm:py-4 align-middle text-slate-700 dark:text-slate-300 leading-relaxed border-b border-slate-100 dark:border-slate-800/80 first:font-semibold first:text-slate-900 dark:first:text-white first:pl-6 last:pr-6"
        {...props}
      />
    ),
    tr: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'tr'> & { node?: unknown }) => (
      <tr
        className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/25 transition-colors duration-150 last:border-b-0"
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
          <span className="block text-center text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 p-3 font-noto italic bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
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
        className="list-none ml-2 sm:ml-4 space-y-2 sm:space-y-3 my-6 sm:my-8 font-noto"
        {...props}
      />
    ),
    ol: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'ol'> & { node?: unknown }) => (
      <ol
        className="list-decimal list-outside ml-5 sm:ml-6 space-y-2 sm:space-y-3 marker:text-rose-500/80 dark:marker:text-rose-400/80 marker:font-medium my-6 font-noto"
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
    h1: () => null,
    h2: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h2'> & { node?: unknown }) => (
      <h2
        className="text-2xl sm:text-3xl md:text-[28px] font-bold mt-10 sm:mt-12 mb-4 text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2.5 font-noto tracking-normal leading-snug"
        {...props}
      />
    ),
    h3: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h3'> & { node?: unknown }) => (
      <h3
        className="text-xl sm:text-2xl md:text-[22px] font-bold mt-8 mb-3 text-slate-800 dark:text-slate-100 font-noto tracking-normal leading-snug"
        {...props}
      />
    ),
    h4: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h4'> & { node?: unknown }) => (
      <h4
        className="text-lg sm:text-xl font-bold mt-6 mb-2.5 text-slate-800 dark:text-slate-200 font-noto tracking-normal"
        {...props}
      />
    ),
    h5: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h5'> & { node?: unknown }) => (
      <h5
        className="text-[16px] sm:text-[17px] font-semibold mt-5 mb-2 text-slate-700 dark:text-slate-300 font-noto tracking-normal"
        {...props}
      />
    ),
    h6: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h6'> & { node?: unknown }) => (
      <h6
        className="text-[14px] sm:text-[15px] font-semibold mt-5 mb-2 text-slate-600 dark:text-slate-400 font-noto uppercase tracking-normal"
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
        className="text-slate-700 dark:text-slate-300 leading-[1.85] sm:leading-[1.9] text-[16px] sm:text-[17px] mb-6 font-noto tracking-normal font-normal"
        {...props}
      />
    ),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 transition-colors">
      <ProgressBar />
      {/* JSON-LD Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* JSON-LD FAQPage Schema */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ViewTracker slug={post.slug} />

      {/* ─── Post Hero (Prothom Alo / BigganChinta Editorial Style) ─── */}
      <section className="bg-white dark:bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto pt-6 sm:pt-10 px-4 sm:px-6">
          {/* 1. Category Tag (Blue Underlined) */}
          <div className="mb-3">
            <Link
              href={`/blog?category=${encodeURIComponent(post.category || '')}`}
              className="text-[#0066cc] dark:text-[#38bdf8] font-bold text-base sm:text-lg underline underline-offset-4 decoration-2 hover:opacity-80 transition-opacity font-noto"
            >
              {post.category || 'শিক্ষা ও পরীক্ষা'}
            </Link>
          </div>

          {/* 2. Main Big Editorial Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 leading-[1.25] tracking-tight mb-4 font-noto">
            {post.title}
          </h1>

          {/* 3. Small Accent Indicator Line */}
          <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mb-3" />

          {/* 4. Author Line */}
          <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 font-noto mb-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">লেখা:</span> {post.author.name}
          </p>

          {/* 5. Publish Date (Left) & Share + Bookmark Icons (Right) */}
          <div className="flex items-center justify-between gap-4 py-1 font-noto">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              প্রকাশ: {formatBanglaDate(post.publishedAt)}
            </p>

            {/* Right: Only Share and Bookmark Buttons */}
            <div className="flex items-center gap-2">
              <BlogQuickShareButton title={post.title} url={jsonLd.url} />
              <BlogBookmarkButton slug={post.slug} iconOnly />
            </div>
          </div>

          {/* 6. Clean Divider Line */}
          <hr className="border-t border-slate-200 dark:border-white/10 mt-3 mb-6" />
        </div>
      </section>

      {/* Cover image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <div className="relative w-full aspect-[1200/630] rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900">
          <Image
            src={getPostCover(post)}
            alt={post.title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        </div>
      </div>

      {/* ─── Single-column layout ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col gap-10">
          <article className="min-w-0">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors group font-noto"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              ব্লগে ফিরে যাও
            </Link>

            {/* Post body */}
            <div className="w-full">
              <div
                className="prose prose-slate dark:prose-invert max-w-none w-full
                prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold font-normal font-noto
                prose-p:text-[16px] sm:prose-p:text-[17.5px] prose-p:leading-[1.85] prose-p:text-slate-700 dark:prose-p:text-slate-300
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
                  {processedContent}
                </ReactMarkdown>
              </div>
              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 font-noto flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3 text-[#059669]"
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
                      className="inline-flex items-center gap-1 px-3 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200/80 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#059669] dark:hover:text-[#34d399] hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                    >
                      <span className="text-[#059669] dark:text-[#34d399] font-bold">#</span>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {/* end max-w readable */}
          </article>
        </div>
      </div>

      {/* ─── 4-Card 'আরও পড়ুন' Section (Editorial Magazine / Newspaper Style) ─── */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 border-t border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-noto flex items-center gap-2.5">
              <span className="w-2.5 h-6 rounded-full bg-rose-600 dark:bg-rose-500 inline-block"></span>
              আরও পড়ুন
            </h2>
            <Link
              href="/blog"
              className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-noto"
            >
              সব লেখা দেখুন →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedPosts.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="group flex flex-col"
              >
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#121212] border border-slate-200/80 dark:border-white/10 mb-3 group-hover:shadow-md transition-all duration-300">
                  <Image
                    src={getPostCover(item)}
                    alt={item.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 mb-2 font-noto">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-noto mt-auto">
                  {formatBanglaDate(item.publishedAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BackToTop />
    </div>
  );
}
