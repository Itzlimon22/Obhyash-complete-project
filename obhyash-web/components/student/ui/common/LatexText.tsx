
import React, { useMemo } from 'react';
import katex from 'katex';

interface LatexTextProps {
  text: string;
  className?: string;
}

/**
 * A component that safely parses mixed text and LaTeX equations.
 * It looks for LaTeX content enclosed in '$' delimiters (e.g. $E=mc^2$) 
 * and renders it using KaTeX.
 */
const LatexText: React.FC<LatexTextProps> = ({ text, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Split text by regex looking for content between $ delimiters.
    // The capturing parentheses in split() keeps the delimiters in the result array.
    const parts = text.split(/(\$[^$]+\$)/g);

    return parts.map((part, index) => {
      // Check if this part is a LaTeX segment
      if (part.startsWith('$') && part.endsWith('$')) {
        // Remove the surrounding '$'
        const math = part.slice(1, -1);
        try {
          // Render to HTML string using KaTeX
          const html = katex.renderToString(math, {
            throwOnError: false, // Don't crash on bad LaTeX syntax
            displayMode: false,  // Inline mode
          });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          // Fallback to raw text if rendering fails
          return <span key={index}>{part}</span>;
        }
      }
      // Return regular text as is
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{renderedContent}</span>;
};

export default LatexText;
