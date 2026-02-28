import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';

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

  const MarkdownComponents: any = {
    p: ({ node, ...props }: any) => <span {...props} className="block mb-1" />,
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm custom-scrollbar max-w-full">
        <table
          className="w-full text-left border-collapse m-0 text-sm"
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead
        className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold"
        {...props}
      />
    ),
    th: ({ node, ...props }: any) => (
      <th
        className="p-2 align-middle font-semibold border-neutral-200 dark:border-neutral-800 whitespace-nowrap"
        {...props}
      />
    ),
    td: ({ node, ...props }: any) => (
      <td
        className="p-2 align-middle border-t border-neutral-100 dark:border-neutral-800/50 text-neutral-600 dark:text-neutral-400"
        {...props}
      />
    ),
    tr: ({ node, ...props }: any) => (
      <tr
        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
        {...props}
      />
    ),
    img: ({ node, ...props }: any) => (
      <img
        {...props}
        className="max-w-full h-auto rounded-lg object-contain max-h-[400px] my-3 border border-neutral-200 dark:border-neutral-800"
        loading="lazy"
      />
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className="list-disc list-outside ml-5 space-y-1 my-2 marker:text-neutral-400 dark:marker:text-neutral-500"
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal list-outside ml-5 space-y-1 my-2 marker:font-semibold"
        {...props}
      />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className="border-l-4 border-rose-500 dark:border-rose-400 pl-4 py-1 my-3 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-r-lg italic text-neutral-600 dark:text-neutral-300 text-[14.5px]"
        {...props}
      />
    ),
    a: ({ node, ...props }: any) => (
      <a
        className="text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
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
    pre: ({ node, ...props }: any) => (
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
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LatexText;
