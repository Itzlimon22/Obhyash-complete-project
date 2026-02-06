import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { QuestionStatus, QuestionDifficulty } from '@/lib/types';

// --- Rich Text Renderer (Markdown + LaTeX) ---
// Supports: **Bold**, *Italic*, and $$Math$$
export const MathText: React.FC<{ text?: string }> = ({ text }) => {
  if (!text)
    return (
      <span className="text-gray-400 italic text-xs">(কোনো কন্টেন্ট নেই)</span>
    );

  // Split by LaTeX delimiters ($$ ... $$)
  const parts = text.split(/(\$\$[^$]+\$\$)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Render Math
          return (
            <span
              key={i}
              className="inline-block px-1.5 mx-0.5 bg-brand-50 dark:bg-brand-900/20 rounded text-brand-700 dark:text-brand-300 font-mono text-sm border border-brand-100 dark:border-brand-800"
              title="LaTeX Equation"
            >
              {part.slice(2, -2)}
            </span>
          );
        } else {
          // Render Markdown (Bold/Italic)
          return <MarkdownText key={i} text={part} />;
        }
      })}
    </span>
  );
};

// Helper to render bold/italic inside non-math parts
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  // Split by **bold** first
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {boldParts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        // Split by *italic* inside non-bold parts
        const italicParts = part.split(/(\*[^*]+\*)/g);
        return (
          <span key={j}>
            {italicParts.map((subPart, k) => {
              if (subPart.startsWith('*') && subPart.endsWith('*')) {
                return <em key={k}>{subPart.slice(1, -1)}</em>;
              }
              return subPart;
            })}
          </span>
        );
      })}
    </>
  );
};

// Alias specifically for clearer intent in new code
export const RichText = MathText;

// --- Status Badge (স্ট্যাটাস ব্যাজ) ---
export const StatusBadge: React.FC<{ status: QuestionStatus }> = ({
  status,
}) => {
  const styles = {
    Approved:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    Pending:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    Rejected:
      'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    Draft:
      'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles.Draft}`}
    >
      {status === 'Approved' && <CheckCircle2 size={10} className="mr-1" />}
      {status === 'Rejected' && <XCircle size={10} className="mr-1" />}
      {status === 'Pending' && <AlertTriangle size={10} className="mr-1" />}
      {status}
    </span>
  );
};

// --- Difficulty Badge (কঠিন্য ব্যাজ) ---
export const DifficultyBadge: React.FC<{ level: QuestionDifficulty }> = ({
  level,
}) => {
  const colors = {
    Easy: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium:
      'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Hard: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    Mixed:
      'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded border ${colors[level] || colors.Medium} font-bold uppercase`}
    >
      {level}
    </span>
  );
};
