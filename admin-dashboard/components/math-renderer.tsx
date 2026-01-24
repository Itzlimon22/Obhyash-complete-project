'use client';

// ✅ This import is crucial for symbols to look correct
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  text: string;
  block?: boolean;
}

export function MathRenderer({ text, block = false }: MathRendererProps) {
  if (!text) return null;

  // Split text by $ symbols to identify LaTeX parts (e.g., $E=mc^2$)
  const parts = text.split(/(\$.*?\$)/g);

  return (
    <span className={block ? 'block my-2' : 'inline'}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const content = part.slice(1, -1);
          return block ? (
            <BlockMath key={i} math={content} />
          ) : (
            <InlineMath key={i} math={content} />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
