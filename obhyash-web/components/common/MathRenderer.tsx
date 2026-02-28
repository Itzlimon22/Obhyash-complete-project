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

  // Enhance formatting for list items that are often pasted inline
  let formattedText = text;

  // Format i., ii., iii. etc
  // Use (?:\s+|^|-) to match space, start of string, or a dash before the numeral
  formattedText = formattedText.replace(
    /(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+/gi,
    '\n$1. ',
  );

  // Format parenthesis numerals (i), (ii), etc
  formattedText = formattedText.replace(
    /(?:\s+|^|-)\((i|ii|iii|iv|v)\)\s+/gi,
    '\n($1) ',
  );

  // Catch the typical ending question and push it to a new line
  formattedText = formattedText.replace(
    /(?:\s+|^)নিচের কোনটি সঠিক\?/g,
    '\n\nনিচের কোনটি সঠিক?',
  );

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
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}
