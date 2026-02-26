import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
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
  const content = useMemo(() => text || '', [text]);

  return (
    <div
      className={`prose dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          p: ({ node, ...props }) => <span {...props} className="block mb-1" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LatexText;
