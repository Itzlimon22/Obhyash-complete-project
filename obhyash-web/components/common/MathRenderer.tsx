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

const mathMLTags = [
  "math",
  "semantics",
  "mrow",
  "mo",
  "mi",
  "mn",
  "annotation",
  "annotation-xml",
  "mstyle",
  "mfrac",
  "msqrt",
  "mroot",
  "msub",
  "msup",
  "msubsup",
  "mtable",
  "mtr",
  "mtd",
  "mtext",
  "mspace",
  "mpadded",
  "mover",
  "munder",
  "munderover",
  "svg",
  "path",
  "g",
  "line",
];

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...mathMLTags],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "className", "style", "aria-hidden"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "style"],
    table: [...(defaultSchema.attributes?.table ?? []), "className", "style"],
    thead: [...(defaultSchema.attributes?.thead ?? []), "className", "style"],
    tbody: [...(defaultSchema.attributes?.tbody ?? []), "className", "style"],
    tr: [...(defaultSchema.attributes?.tr ?? []), "className", "style"],
    th: [...(defaultSchema.attributes?.th ?? []), "className", "style", "colSpan", "rowSpan", "align", "scope"],
    td: [...(defaultSchema.attributes?.td ?? []), "className", "style", "colSpan", "rowSpan", "align"],
    math: ["xmlns", "display"],
    annotation: ["encoding"],
    svg: ["xmlns", "viewBox", "width", "height", "style", "className"],
    path: ["d", "style", "className"],
    g: ["fill", "stroke"],
    line: ["x1", "y1", "x2", "y2", "stroke", "strokeWidth"],
    sup: ["className"],
    sub: ["className"],
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
    // Only convert pipes used as text delimiters between Bengali words, NEVER inside math or math symbols
    return line.replace(/(?<=[\u0980-\u09FF\s])\|(?=[\u0980-\u09FF\s])/g, (match, offset, str) => {
      const prefix = str.slice(0, offset);
      const dollarCount = (prefix.match(/\$/g) || []).length;
      if (dollarCount % 2 !== 0) return "|";
      return "\n\n";
    });
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

  // Format dimensional brackets like [MLT^{-2}], [M], [LT^{-1}], [T] into math (ignore markdown links [text](url))
  s = s.replace(/(?<!\$)(?:\[[A-Za-z0-9\s\+\-\*\/\^\{\}\_\\]+\])(?!\$)(?!\()/g, (match) => {
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

function extractAndProtectTables(text: string): { textWithoutTables: string; tables: string[] } {
  const lines = text.split("\n");
  const tables: string[] = [];
  const outputLines: string[] = [];
  let currentTableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length > 2;

    if (isTableLine) {
      // Escape inner pipes inside $...$ in table cells so GFM doesn't confuse them with column delimiters
      const safeLine = line.replace(/\$([^$]+)\$/g, (_m, math) => {
        return '$' + math.replace(/\|/g, '\\vert ') + '$';
      });
      currentTableLines.push(safeLine);
    } else {
      if (currentTableLines.length > 0) {
        const placeholder = `___MD_TABLE_${tables.length}___`;
        tables.push(currentTableLines.join("\n"));
        outputLines.push(placeholder);
        currentTableLines = [];
      }
      outputLines.push(line);
    }
  }

  if (currentTableLines.length > 0) {
    const placeholder = `___MD_TABLE_${tables.length}___`;
    tables.push(currentTableLines.join("\n"));
    outputLines.push(placeholder);
  }

  return { textWithoutTables: outputLines.join("\n"), tables };
}

function restoreTables(text: string, tables: string[]): string {
  let result = text;
  tables.forEach((table, index) => {
    result = result.replace(`___MD_TABLE_${index}___`, `\n\n${table}\n\n`);
  });
  return result;
}

function preprocess(text: string): string {
  if (preprocessCache.has(text)) {
    return preprocessCache.get(text)!;
  }

  // 1. Normalize literal \n and multiple $$$$
  let processedText = text.replace(/\\n/g, "\n").replace(/\${3,}/g, "\n\n");

  // Protect Markdown tables from delimiters, step splitting and line restructuring
  const { textWithoutTables, tables } = extractAndProtectTables(processedText);
  processedText = textWithoutTables;

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

  const result = restoreTables(
    processedParts.join("").replace(/\n{3,}/g, "\n\n"),
    tables
  );
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
      className={`prose prose-sm max-w-none dark:prose-invert font-sans
        prose-p:leading-relaxed prose-p:my-2
        prose-li:my-1 prose-ul:my-2 prose-ol:my-2
        prose-table:my-3 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
        ${block ? "block my-2" : "inline"}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          p: ({ node, ...props }) => (
            <p {...props} className={block ? "block mb-2.5 leading-relaxed text-[#2E2621] dark:text-[#F4F4F5]" : "inline leading-relaxed"} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#E2D7C9] dark:border-[#27272A] bg-white/80 dark:bg-[#121214]/80 shadow-xs max-w-full">
              <table {...props} className="w-full text-left border-collapse text-sm min-w-full" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} className="bg-[#F3ECE4] dark:bg-[#1E1E22] text-[#42352B] dark:text-[#F4F4F5] font-bold border-b border-[#E2D7C9] dark:border-[#27272A]" />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} className="divide-y divide-[#F0EAE1] dark:divide-[#1E1E22]" />
          ),
          tr: ({ node, ...props }) => (
            <tr {...props} className="hover:bg-amber-500/5 dark:hover:bg-white/5 transition-colors" />
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="px-3.5 py-2.5 font-bold text-[14px] sm:text-[15px]" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="px-3.5 py-2 text-[14px] sm:text-[15px] text-[#2E2621] dark:text-[#E4E4E7]" />
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
