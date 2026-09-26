import React from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';

interface LatexTextProps {
  text: string;
  className?: string;
}

/**
 * LatexText: Standard student-facing component for safely parsing Markdown,
 * tables, LaTeX math formulas, vectors, matrices, and scientific notation.
 * Uses the unified MathRenderer engine to ensure 100% visual consistency.
 */
const LatexText: React.FC<LatexTextProps> = ({ text, className = '' }) => {
  return (
    <div className="w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]">
      <MathRenderer text={text} className={className} block />
    </div>
  );
};

export default React.memo(LatexText);
