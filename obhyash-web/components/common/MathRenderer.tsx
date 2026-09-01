"use client";

import React from "react";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface MathRendererProps {
  text: string;
  block?: boolean;
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "className", "style"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "style"],
    table: [...(defaultSchema.attributes?.table ?? []), "className", "style"],
    th: [...(defaultSchema.attributes?.th ?? []), "className", "style"],
    td: [...(defaultSchema.attributes?.td ?? []), "className", "style"],
  },
};

function unwrapBengaliMathContent(inner: string): string {
  let clean = inner.replace(/\\(?:text|mathrm|textbf|textit)\{([^}]*)\}/g, "$1");

  clean = clean
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, " ")
    .replace(/\\ /g, " ")
    .replace(/~/g, " ");

  const tokenRegex = /(\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\])*|[a-zA-Z0-9]+(?:\^|\_)\{?[a-zA-Z0-9\-\+]+\}?)/g;
  clean = clean.replace(tokenRegex, "$$$1$$");

  return clean;
}

function cleanPipesAndDelimiters(text: string): string {
  const lines = text.split("\n");
  const cleaned = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length > 2) {
      return line;
    }
    return line.replace(/\s*\|\s*/g, "\n\n");
  });
  return cleaned.join("\n");
}

function separateTransitionSteps(text: string): string {
  let t = text;

  // Split transitions from Bengali punctuation or parentheses
  t = t.replace(
    /([।\?\!\:\;\|])\s*(ধরি|মনে করি|প্রদত্ত মানসমূহ|প্রদত্ত তথ্য|দেওয়া আছে|দেয়া আছে|আমরা জানি|জানা আছে|প্রশ্নমতে|শর্তমতে|অর্থাৎ|সুতরাং|অতএব|মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|হিসাব করে পাই|গণনা করে পাই|সঠিক উত্তর|উত্তর|নোট|টিপস)[\s:\-–—\.]*/g,
    "$1\n\n$2: "
  );
  t = t.replace(
    /(\))\s*(মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|হিসাব করে পাই|অতএব|সুতরাং|অর্থাৎ)[\s:\-–—\.]*/g,
    "$1\n\n$2: "
  );
  t = t.replace(/:\s*:\s*/g, ": ");

  return t;
}

function cleanIntraSentenceNewlines(text: string): string {
  const placeholder = "___DBL_NL___";
  text = text.replace(/\r\n|\r/g, "\n");
  text = text.replace(/\n\s*\n+/g, placeholder);

  const lines = text.split("\n");
  if (lines.length <= 1) {
    return text.replaceAll(placeholder, "\n\n");
  }

  const buffer: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (buffer.length === 0) {
      buffer.push(trimmed);
      continue;
    }

    const isListItem = /^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+[\.\)]|\-|\*|\#|নিচের)/.test(
      trimmed
    );
    const isTableLine = trimmed.startsWith("|") || trimmed.endsWith("|");
    const isHeaderOrStep = /^(?:ধাপ\s*[০-৯0-9]+|দেওয়া আছে|দেয়া আছে|আমরা জানি|সুতরাং|অতএব|শর্তমতে|সূত্র|ব্যাখ্যা|সমাধান|মনে করি|ধরি|লক্ষ্য করি|নোট|টিপস|প্রদত্ত মানসমূহ|মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|সঠিক উত্তর)[\s:\-–—\.]/i.test(
      trimmed
    );

    if (isListItem || isTableLine || isHeaderOrStep) {
      buffer.push("\n\n" + trimmed);
    } else {
      buffer.push(" " + trimmed);
    }
  }

  return buffer.join("").replaceAll(placeholder, "\n\n");
}

function wrapLatexExpressionsInBengaliText(str: string): string {
  // Normalize consecutive dollar signs (e.g. $$$$ -> \n\n)
  let s = str.replace(/\${3,}/g, "\n\n");

  // Format dimensional brackets like [MLT^{-2}], [M], [LT^{-1}], [T] into math
  s = s.replace(/(?<!\$)(?:\[[A-Za-z0-9\s\+\-\*\/\^\{\}\_\\]+\])(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // Detect and wrap raw LaTeX command clusters in non-math Bengali text
  s = s.replace(
    /(?:(?<=\s|^|[=+\-*/:])|(?<=\b))((?:[A-Za-z0-9=\+\-\*\/\(\)\s,.]|\\left|\\right|\\frac\{[^{}]*\}\{[^{}]*\}|\\times|\\cdot|\\sqrt\{[^{}]*\}|\\vec\{[^{}]*\}|\\cap|\\cup|\\pm|\^\{?[a-zA-Z0-9\-\+]+\}?|\_\{?[a-zA-Z0-9\-\+]+\}?)*\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\])*(?:[A-Za-z0-9=\+\-\*\/\(\)\s,.]|\\left|\\right|\\frac\{[^{}]*\}\{[^{}]*\}|\\times|\\cdot|\\sqrt\{[^{}]*\}|\\vec\{[^{}]*\}|\\cap|\\cup|\\pm|\^\{?[a-zA-Z0-9\-\+]+\}?|\_\{?[a-zA-Z0-9\-\+]+\}?)*)(?:(?=\s|$|[=+\-*/:])|(?=\b))/g,
    (match) => {
      const trimmed = match.trim();
      if (!trimmed || /[\u0980-\u09FF]/.test(trimmed)) return match;
      if (trimmed.startsWith("$") && trimmed.endsWith("$")) return match;
      return ` $${trimmed}$ `;
    }
  );

  return s;
}

const preprocessCache = new Map<string, string>();
const MAX_PREPROCESS_CACHE = 600;

function preprocess(text: string): string {
  if (preprocessCache.has(text)) {
    return preprocessCache.get(text)!;
  }

  // 1. Normalize literal \n and multiple $$$$
  let processedText = text.replace(/\\n/g, "\n").replace(/\${3,}/g, "\n\n");
  processedText = cleanPipesAndDelimiters(processedText);
  processedText = separateTransitionSteps(processedText);

  // 2. Line-by-line single dollar balancing & raw equation wrapping
  const rawLines = processedText.split("\n");
  const balancedLines = rawLines.map((line) => {
    let l = line.trim();
    if (!l) return "";

    const dollarCount = (l.match(/\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      if (l.endsWith("$")) {
        const withoutTrailing = l.slice(0, -1).trim();
        const colonIdx = withoutTrailing.lastIndexOf(":");
        if (colonIdx !== -1 && colonIdx < withoutTrailing.length - 1) {
          const prefix = withoutTrailing.slice(0, colonIdx + 1);
          const math = withoutTrailing.slice(colonIdx + 1).trim();
          l = `${prefix} $${math}$`;
        } else {
          const firstBackslash = withoutTrailing.indexOf("\\");
          if (firstBackslash !== -1) {
            const prefix = withoutTrailing.slice(0, firstBackslash);
            const math = withoutTrailing.slice(firstBackslash).trim();
            l = `${prefix}$${math}$`;
          } else if (withoutTrailing.startsWith("=")) {
            l = `$${withoutTrailing}$`;
          } else {
            l = withoutTrailing;
          }
        }
      } else if (l.startsWith("$")) {
        l = `${l}$`;
      }
    }

    if (!l.includes("$") && !/[\u0980-\u09FF]/.test(l) && (l.includes("\\") || l.includes("="))) {
      l = `$${l}$`;
    }

    l = l.replace(
      /(:\s*)([A-Za-z0-9\(\)\_]+(?:\s*(?:\\cap|\\cup|\\times|=|\\pm)\s*[A-Za-z0-9\(\)\_\s\+\-\*\/\\\{\}\^]+)+)(?=$|[\n\।])/g,
      (match, p1, p2) => {
        if (p2.includes("$") || /[\u0980-\u09FF]/.test(p2)) return match;
        return `${p1}$${p2.trim()}$`;
      }
    );

    return l;
  });

  processedText = balancedLines.join("\n\n");

  // 3. Split into math blocks and non-math segments
  const mathPattern = /(\$\$[\s\S]*?\$\$|\$(?!\$)[^\n]*?\$)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(processedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processedText.slice(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < processedText.length) {
    parts.push(processedText.slice(lastIndex));
  }

  // 4. Process each segment safely
  const processedParts = parts.map((part) => {
    if (part.startsWith("$")) {
      const isDisplay = part.startsWith("$$");
      const inner = isDisplay ? part.slice(2, -2) : part.slice(1, -1);

      const cleanInner = inner.replace(/\\\\([a-zA-Z{])/g, "\\$1");

      if (!/[\u0980-\u09FF]/.test(cleanInner)) {
        return isDisplay ? `$$${cleanInner}$$` : `$${cleanInner}$`;
      }

      return unwrapBengaliMathContent(cleanInner);
    }

    let t = part;
    const trimmed = t.trim();
    const hasNoBengali = !/[\u0980-\u09FF]/.test(trimmed);
    const hasLatexCmd = trimmed.includes("\\") && /\\[a-zA-Z]+/.test(trimmed);
    const hasMathExpr = /[a-zA-Z0-9]+(?:\^|\_)\{?[a-zA-Z0-9\-\+]+\}?/.test(trimmed);

    if (hasNoBengali && trimmed.length > 0 && (hasLatexCmd || (hasMathExpr && /[=+\-*/<>()]/.test(trimmed)))) {
      return `$${trimmed}$`;
    }

    // Wrap embedded LaTeX commands inside Bengali text
    t = wrapLatexExpressionsInBengaliText(t);

    t = t.replace(/\b([a-zA-Z0-9]+)\^(-?[0-9]+)\b/g, "$$$1^{$2}$$");
    t = t.replace(/\b([a-zA-Z0-9]+)\^\{(-?[0-9a-zA-Z]+)\}\b/g, "$$$1^{$2}$$");

    t = cleanIntraSentenceNewlines(t);

    t = t.replace(/(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+/gi, "\n$1. ");
    t = t.replace(/(?:\s+|^)\((i|ii|iii|iv|v)\)\s+/gi, "\n($1) ");
    t = t.replace(/(?:\s+|^)নিচের কোনটি সঠিক\?/g, "\n\nনিচের কোনটি সঠিক?");

    return t;
  });

  const result = processedParts.join("").replace(/\n{3,}/g, "\n\n");
  if (preprocessCache.size >= MAX_PREPROCESS_CACHE) {
    const firstKey = preprocessCache.keys().next().value;
    if (firstKey) preprocessCache.delete(firstKey);
  }
  preprocessCache.set(text, result);
  return result;
}

function BaseMathRenderer({ text, block = false }: MathRendererProps) {
  if (!text) return null;

  const formattedText = preprocess(text);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert font-['HindSiliguri']
        prose-p:leading-relaxed prose-p:my-2
        prose-li:my-1 prose-ul:my-2 prose-ol:my-2
        prose-table:my-3 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
        ${block ? "block my-2" : "inline"}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeKatex,
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          p: ({ node, ...props }) => (
            <p {...props} className={block ? "block mb-2.5 leading-relaxed text-[#2E2621] dark:text-[#F4F4F5]" : "inline leading-relaxed"} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#E2D7C9] dark:border-[#27272A] bg-white/60 dark:bg-[#121214]/60 shadow-xs">
              <table {...props} className="w-full text-left border-collapse text-sm" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} className="bg-[#F3ECE4] dark:bg-[#1E1E22] text-[#42352B] dark:text-[#F4F4F5] font-bold border-b border-[#E2D7C9] dark:border-[#27272A]" />
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="px-3.5 py-2.5 font-bold text-[14px] sm:text-[15px]" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="border-b border-[#F0EAE1] dark:border-[#1E1E22] px-3.5 py-2 text-[14px] sm:text-[15px] text-[#2E2621] dark:text-[#E4E4E7]" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside space-y-1.5 my-2 text-[#2E2621] dark:text-[#F4F4F5]" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside space-y-1.5 my-2 text-[#2E2621] dark:text-[#F4F4F5]" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="leading-relaxed my-0.5" />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 border-[#D97706] pl-3 py-1.5 my-2 italic bg-[#FEF3C7]/20 dark:bg-[#78350F]/20 rounded-r-lg text-[#2E2621] dark:text-[#F4F4F5]" />
          ),
        }}
      >
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}

export const MathRenderer = React.memo(BaseMathRenderer);
