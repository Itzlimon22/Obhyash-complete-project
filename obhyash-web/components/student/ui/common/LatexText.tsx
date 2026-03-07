import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import type { Components } from 'react-markdown';
import Image from 'next/image';
import type { StaticImport } from 'next/dist/shared/lib/get-img-props';

// Allow all attributes KaTeX injects (className, style on span/div) while
// blocking everything actually dangerous (script, event handlers, etc.).
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'style'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className', 'style'],
    // sup/sub used for footnotes / chemistry notation
    sup: ['className'],
    sub: ['className'],
  },
};

interface LatexTextProps {
  text: string;
  className?: string;
}

/**
 * A component that safely parses Markdown, HTML, and LaTeX equations.
 * It renders formatted text like tables, lists, and math using remark and rehype plugins.
 */
const LatexText: React.FC<LatexTextProps> = ({ text, className = '' }) => {
  const content = useMemo(() => {
    let formattedText = text || '';

    // ── Step 1: Un-escape over-escaped LaTeX FIRST (before \n expansion) ──────
    // TipTap-Markdown serialises \frac as \\frac inside $…$ blocks.
    // We fix that before any other transformation so the math block is valid.
    formattedText = formattedText.replace(
      /(\$\$[\s\S]*?\$\$|\$(?!\$)[^\n]*?\$)/g,
      (match) => match.replace(/\\\\([a-zA-Z{])/g, '\\$1'),
    );

    // ── Step 2: Normalize literal \n escape sequences to real newlines ────────
    formattedText = formattedText.replace(/\\n/g, '\n');

    // Format i., ii., iii. etc into newlines
    formattedText = formattedText.replace(
      /(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+/gi,
      '\n$1. ',
    );
    formattedText = formattedText.replace(
      /(?:\s+|^|-)\((i|ii|iii|iv|v)\)\s+/gi,
      '\n($1) ',
    );
    // Catch typical ending questions
    formattedText = formattedText.replace(
      /(?:\s+|^)নিচের কোনটি সঠিক\?/g,
      '\n\nনিচের কোনটি সঠিক?',
    );

    return formattedText;
  }, [text]);

  // import type { Components } from 'react-markdown'; // Moved to top-level

  const MarkdownComponents: Components = {
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      // Use div instead of span so block-level children (tables, images) inside
      // a <p> remain valid HTML and don't cause hydration mismatches.
      <div {...props} className="mb-1" />
    ),
    table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm custom-scrollbar max-w-full">
        <table
          className="w-full text-left border-collapse m-0 text-sm"
          {...props}
        />
      </div>
    ),
    thead: (props: React.TableHTMLAttributes<HTMLTableSectionElement>) => (
      <thead
        className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold"
        {...props}
      />
    ),
    th: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
      <th
        className="p-2 align-middle font-semibold border-neutral-200 dark:border-neutral-800 whitespace-nowrap"
        {...props}
      />
    ),
    td: (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
      <td
        className="p-2 align-middle border-t border-neutral-100 dark:border-neutral-800/50 text-neutral-600 dark:text-neutral-400"
        {...props}
      />
    ),
    tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr
        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
        {...props}
      />
    ),
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const { src = '', alt = '', width, height, ...rest } = props;
      // Ensure src is a string or StaticImport, not Blob
      let imageSrc: string | StaticImport = '';
      if (typeof src === 'string') {
        imageSrc = src;
      } else if (src instanceof Blob) {
        imageSrc = URL.createObjectURL(src);
      }

      return (
        <Image
          src={imageSrc}
          alt={alt || ''}
          width={width ? Number(width) : 400}
          height={height ? Number(height) : 300}
          className="max-w-full h-auto rounded-lg object-contain max-h-[400px] my-3 border border-neutral-200 dark:border-neutral-800"
          loading="lazy"
          {...rest}
        />
      );
    },
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul
        className="list-disc list-outside ml-5 space-y-1 my-2 marker:text-neutral-400 dark:marker:text-neutral-500"
        {...props}
      />
    ),
    ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
      <ol
        className="list-decimal list-outside ml-5 space-y-1 my-2 marker:font-semibold"
        {...props}
      />
    ),
    blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-4 border-rose-500 dark:border-rose-400 pl-4 py-1 my-3 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-r-lg italic text-neutral-600 dark:text-neutral-300 text-[14.5px]"
        {...props}
      />
    ),
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className="text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: ({
      inline,
      className,
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) => {
      if (inline) {
        return (
          <code
            className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[13px] font-mono font-medium text-rose-600 dark:text-rose-400"
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
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
      <div className="rounded-lg overflow-hidden my-3 bg-[#0d1117] border border-neutral-800 shadow-md">
        <pre
          {...props}
          className="p-3 overflow-x-auto text-[13px] font-mono m-0 bg-transparent text-neutral-300 custom-scrollbar"
        />
      </div>
    ),
  };

  return (
    <div
      className={`prose dark:prose-invert max-w-none w-full
        prose-p:my-0.5 prose-p:leading-[1.6] prose-ul:my-0.5 prose-ol:my-0.5
        prose-strong:font-bold prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100
        prose-headings:font-bold prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeKatex,
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LatexText;
