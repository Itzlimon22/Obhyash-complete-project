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
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    Rejected:
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
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
      'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    Hard: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    Mixed:
      'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded border ${colors[level] || colors.Medium} font-bold uppercase`}
    >
      {level}
    </span>
  );
};
