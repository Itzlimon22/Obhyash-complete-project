import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPost, getAllPosts } from '@/lib/blog-data';
import { getPostCover } from '@/lib/blog-images';

// 100% Static HTML on Vercel CDN — 0 CPU execution, 0 ISR writes
export const dynamic = 'force-static';
export const revalidate = false;

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
import BlogQuickShareButton from '@/components/blog/BlogQuickShareButton';
import HscGpaCalculator from '@/components/blog/HscGpaCalculator';
import InArticleRelatedCard from '@/components/blog/InArticleRelatedCard';
import ResultStepFlow from '@/components/blog/ResultStepFlow';
import SscScholarshipConversionCard from '@/components/blog/SscScholarshipConversionCard';
import HscPhysicsPdfDownloadCard from '@/components/blog/HscPhysicsPdfDownloadCard';
import SscMathAppMockupCard from '@/components/blog/SscMathAppMockupCard';
import LiveExamAppMockupCard from '@/components/blog/LiveExamAppMockupCard';
import CategoryConversionBanner from '@/components/blog/CategoryConversionBanner';

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

// Helper to inject HSC Science Ka-Kha PDF download card across all blog posts (like on the britti page)
function injectHscNotesCard(content: string, slug?: string): string {
  // If the article already contains a custom widget, or is the SSC Math article, do not inject HSC physics card
  if (
    content.includes('data-widget="hsc-physics-pdf-download"') ||
    content.includes('data-widget="ssc-math-app-mockup"') ||
    slug === 'ssc-general-math-all-board-questions-solution-2026'
  ) {
    return content;
  }

  // Inject after the 2nd regular paragraph (same position as the britti post)
  const blocks = content.split(/\n{2,}/);
  if (blocks.length < 3) {
    return `${content}\n\n<div data-widget="hsc-physics-pdf-download"></div>\n\n`;
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
    if (paragraphCount === 2) {
      insertIndex = i + 1;
      break;
    }
  }

  // Fallback: if 2 paragraphs couldn't be counted, insert after the 1st paragraph
  if (insertIndex === -1) {
    paragraphCount = 0;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
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
      if (paragraphCount === 1) {
        insertIndex = i + 1;
        break;
      }
    }
  }

  if (insertIndex !== -1 && insertIndex <= blocks.length) {
    const widgetHtml = '<div data-widget="hsc-physics-pdf-download"></div>';
    blocks.splice(insertIndex, 0, widgetHtml);
    return blocks.join('\n\n');
  }

  return `${content}\n\n<div data-widget="hsc-physics-pdf-download"></div>\n\n`;
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

  // Auto-inject after the 4th regular paragraph (providing breathing room after the notes card)
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
    if (paragraphCount === 4) {
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

// Helper to inject smart contextual in-article conversion banner (disabled globally)
function injectCategoryConversionBanner(content: string): string {
  return content;
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
    .slice(0, 4);
  // Britti / scholarship page should not have in-article related card
  const isBrittiPost =
    post.slug === 'ssc-scholarship-britti-result-2026-check' ||
    post.slug.includes('britti');

  // Targeted blogs where user requested to hide both in-article related card and conversion banner
  const TARGET_PROMO_SLUGS = new Set([
    'medical-admission-circular-2026-guide',
    'all-university-admission-circular-2026',
    'buet-admission-2026-27',
    'ssc-general-math-all-board-questions-solution-2026',
    'ssc-physics-all-board-questions-solution-2026',
    'ssc-scholarship-britti-result-2026-check',
    'hsc-2027-bangla-syllabus-marks-distribution',
    'hsc-2027-syllabus-exam-system-breakdown',
  ]);

  const shouldHideInArticleRelated =
    Boolean(post.hideInArticleRelated) ||
    TARGET_PROMO_SLUGS.has(post.slug) ||
    isBrittiPost;

  // 1. Ensure HSC Science Ka-Kha PDF card is only injected for HSC physics/science relevant posts
  const textToCheck = `${post.category} ${post.tags.join(' ')} ${post.slug}`.toLowerCase();
  const isHscSciencePost =
    textToCheck.includes('hsc-physics') ||
    textToCheck.includes('পদার্থবিজ্ঞান') ||
    (textToCheck.includes('hsc') && (textToCheck.includes('physics') || textToCheck.includes('বিজ্ঞান')));

  const withHscCard = isHscSciencePost
    ? injectHscNotesCard(post.content, post.slug)
    : post.content;

  // 2. Inject related posts card for articles that don't have it hidden
  const withRelated = shouldHideInArticleRelated
    ? withHscCard
    : injectInArticleRelated(withHscCard, relatedPosts[0]?.slug);

  // 3. Processed markdown content
  const processedContent = withRelated;

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
        return (
          <HscPhysicsPdfDownloadCard
            sourceSlug={post.slug}
            sourceCategory={post.category}
          />
        );
      }
      if (widget === 'ssc-math-app-mockup') {
        return <SscMathAppMockupCard />;
      }
      if (widget === 'live-exam-app-mockup' || widget === 'app-live-exam-mockup') {
        const title = (props as Record<string, unknown>)['data-title'] as string | undefined;
        const subtitle = (props as Record<string, unknown>)['data-subtitle'] as string | undefined;
        const badge = (props as Record<string, unknown>)['data-badge'] as string | undefined;
        return (
          <LiveExamAppMockupCard
            sourceSlug={post.slug}
            sourceCategory={post.category}
            badge={badge}
            title={title}
            subtitle={subtitle}
          />
        );
      }
      if (widget === 'category-conversion-banner') {
        return null;
      }
      if (widget === 'related-post') {
        if (shouldHideInArticleRelated) return null;
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
            'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 border-l-4 border-l-blue-500 text-slate-800 dark:text-zinc-200',
          icon: <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
        },
        TIP: {
          color:
            'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 border-l-4 border-l-emerald-500 text-slate-800 dark:text-zinc-200',
          icon: <Lightbulb className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
        },
        IMPORTANT: {
          color:
            'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 border-l-4 border-l-purple-500 text-slate-800 dark:text-zinc-200',
          icon: <CheckCircle2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
        },
        WARNING: {
          color:
            'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 border-l-4 border-l-amber-500 text-slate-800 dark:text-zinc-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
        },
        CAUTION: {
          color:
            'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 border-l-4 border-l-rose-500 text-slate-800 dark:text-zinc-200',
          icon: <AlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
        },
      };

      const { color, icon } = config[calloutType] || config.NOTE;

      return (
        <div
          className={`not-prose flex flex-col sm:flex-row gap-3 p-4 sm:p-5 my-6 sm:my-8 rounded-xl border ${color} font-noto not-italic`}
        >
          <div className="shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0 text-[14.5px] sm:text-[15.5px] leading-relaxed space-y-1.5 [&_p]:my-1 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_p]:before:content-none [&_p]:after:content-none">
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
            className="bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-[13px] sm:text-[13.5px] font-mono font-normal text-slate-800 dark:text-zinc-200 before:content-none after:content-none border border-slate-200/60 dark:border-zinc-700/60"
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
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table
            className="w-full text-left border-collapse m-0 min-w-[500px] font-noto tabular-nums text-[14px] sm:text-[15px]"
            {...props}
          />
        </div>
      </div>
    ),
    thead: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'thead'> & { node?: unknown }) => (
      <thead
        className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200"
        {...props}
      />
    ),
    th: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'th'> & { node?: unknown }) => (
      <th
        className="px-4 sm:px-5 py-3 align-middle font-semibold text-slate-800 dark:text-zinc-200 font-noto text-xs sm:text-[13px] tracking-normal first:pl-5 last:pr-5"
        {...props}
      />
    ),
    td: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'td'> & { node?: unknown }) => (
      <td
        className="px-4 sm:px-5 py-3.5 align-middle text-slate-700 dark:text-zinc-300 leading-relaxed border-b border-slate-100 dark:border-zinc-800/60 first:font-medium first:text-slate-900 dark:first:text-zinc-100 first:pl-5 last:pr-5"
        {...props}
      />
    ),
    tr: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'tr'> & { node?: unknown }) => (
      <tr
        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors duration-100 last:border-b-0"
        {...props}
      />
    ),
    img: ({
      node: _,
      alt,
      src,
      ...props
    }: React.ComponentPropsWithoutRef<'img'> & { node?: unknown }) => (
      <span className="block my-8 sm:my-10 group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ''}
          {...props}
          className="w-full h-auto object-contain max-h-[600px] transition-transform duration-300 m-0"
          loading="lazy"
        />
        {alt && (
          <span className="block text-center text-xs text-slate-500 dark:text-zinc-400 p-2.5 font-noto border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
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
        className="list-none ml-1 sm:ml-2 space-y-2.5 my-6 sm:my-8 font-noto"
        {...props}
      />
    ),
    ol: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'ol'> & { node?: unknown }) => (
      <ol
        className="list-decimal list-outside ml-5 sm:ml-6 space-y-2.5 marker:text-slate-500 dark:marker:text-zinc-400 marker:font-medium my-6 font-noto"
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
      // For unordered lists, add custom minimal bullet
      const isUnordered =
        (node as { parent?: { tagName?: string } } | undefined)?.parent
          ?.tagName === 'ul';
      if (isUnordered) {
        return (
          <li className="relative pl-5 sm:pl-6 text-slate-700 dark:text-zinc-300 leading-[1.8] text-[16px] sm:text-[17px]">
            <span className="absolute left-1 top-[11px] w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500"></span>
            {children}
          </li>
        );
      }
      return (
        <li
          className="pl-1 sm:pl-2 text-slate-700 dark:text-zinc-300 leading-[1.8] text-[16px] sm:text-[17px]"
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
        className="text-slate-900 dark:text-zinc-100 font-medium underline underline-offset-4 decoration-slate-300 dark:decoration-zinc-600 hover:decoration-slate-900 dark:hover:decoration-zinc-100 transition-colors inline-block"
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
        className="my-10 sm:my-12 border-slate-200/80 dark:border-zinc-800"
        {...props}
      />
    ),
    h1: () => null,
    h2: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h2'> & { node?: unknown }) => (
      <h2
        className="text-xl sm:text-2xl md:text-[26px] font-bold mt-10 sm:mt-12 mb-4 text-slate-900 dark:text-zinc-100 font-noto tracking-tight leading-snug"
        {...props}
      />
    ),
    h3: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h3'> & { node?: unknown }) => (
      <h3
        className="text-lg sm:text-xl md:text-[21px] font-bold mt-8 mb-3 text-slate-800 dark:text-zinc-200 font-noto tracking-tight leading-snug"
        {...props}
      />
    ),
    h4: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h4'> & { node?: unknown }) => (
      <h4
        className="text-base sm:text-lg font-bold mt-6 mb-2.5 text-slate-800 dark:text-zinc-200 font-noto tracking-tight"
        {...props}
      />
    ),
    h5: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h5'> & { node?: unknown }) => (
      <h5
        className="text-[15px] sm:text-[16px] font-semibold mt-5 mb-2 text-slate-700 dark:text-zinc-300 font-noto tracking-tight"
        {...props}
      />
    ),
    h6: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'h6'> & { node?: unknown }) => (
      <h6
        className="text-[13px] sm:text-[14px] font-semibold mt-5 mb-2 text-slate-600 dark:text-zinc-400 font-noto uppercase tracking-wider"
        {...props}
      />
    ),
    iframe: ({
      node: _,
      ...props
    }: React.ComponentPropsWithoutRef<'iframe'> & { node?: unknown }) => (
      <div className="relative w-full aspect-video my-8 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-900">
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
        className="text-slate-700 dark:text-zinc-300 leading-[1.85] sm:leading-[1.9] text-[16px] sm:text-[17px] mb-6 font-noto font-normal"
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

      {/* ─── Post Hero (Modern Editorial / Substack Style) ─── */}
      <section className="bg-white dark:bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto pt-6 sm:pt-10 px-4 sm:px-6">
          {/* Top Breadcrumb & Share Action */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors font-noto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ব্লগ</span>
              {post.category && (
                <>
                  <span className="text-slate-300 dark:text-zinc-700">/</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-normal">{post.category}</span>
                </>
              )}
            </Link>

            <div className="flex items-center gap-2">
              <BlogQuickShareButton title={post.title} url={jsonLd.url} />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] font-bold text-slate-900 dark:text-zinc-50 leading-[1.3] sm:leading-[1.25] tracking-tight mb-4 font-noto">
            {post.title}
          </h1>

          {/* Author & Meta Row */}
          <div className="flex items-center gap-3 text-xs sm:text-[13.5px] text-slate-500 dark:text-zinc-400 font-noto">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-zinc-300 shrink-0">
              অ
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{post.author.name}</span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span>{formatBanglaDate(post.publishedAt)}</span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span>৫ মিনিট পাঠ</span>
            </div>
          </div>

          {/* Clean Divider Line */}
          <div className="border-t border-slate-200/70 dark:border-zinc-800 mt-5 mb-8" />
        </div>
      </section>

      {/* Cover image */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
        <div className="relative w-full aspect-[16/9] sm:aspect-[1200/630] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
          <Image
            src={getPostCover(post)}
            alt={post.title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 768px"
            priority
          />
        </div>
      </div>

      {/* ─── Reading Article Layout ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <article className="min-w-0">
          <div className="w-full">
            <div
              className="prose prose-slate dark:prose-invert max-w-none w-full
              prose-strong:text-slate-900 dark:prose-strong:text-zinc-100 prose-strong:font-semibold font-normal font-noto
              prose-p:text-[16px] sm:prose-p:text-[17px] prose-p:leading-[1.85] prose-p:text-slate-700 dark:prose-p:text-zinc-300
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
            <div className="mt-10 pt-6 border-t border-slate-200/70 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 dark:text-zinc-500 mr-1.5 font-noto">ট্যাগ:</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors font-noto"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </article>
      </div>

      {/* ─── 4-Card 'আরও পড়ুন' Section (Clean Editorial Minimal) ─── */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 border-t border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 font-noto">
              আরও পড়ুন
            </h2>
            <Link
              href="/blog"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 font-noto transition-colors"
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
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 mb-3 group-hover:border-slate-300 dark:group-hover:border-zinc-700 transition-all duration-200">
                  <Image
                    src={getPostCover(item)}
                    alt={item.title}
                    fill
                    className="object-contain group-hover:scale-[1.02] transition-transform duration-200"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-[14.5px] sm:text-[15px] font-bold text-slate-800 dark:text-zinc-200 leading-snug group-hover:text-slate-950 dark:group-hover:text-white transition-colors line-clamp-2 mb-1.5 font-noto">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-noto mt-auto">
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
