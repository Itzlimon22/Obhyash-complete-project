'use client';

import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

interface MathRendererProps {
  text: string;
  block?: boolean;
}

export function MathRenderer({ text, block = false }: MathRendererProps) {
  if (!text) return null;

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert 
        prose-p:leading-relaxed prose-p:my-1
        prose-li:my-0.5 prose-ul:my-1
        ${block ? 'my-2' : 'inline'}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          p: ({ node, ...props }) => (
            <span {...props} className={block ? 'block mb-2' : ''} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
