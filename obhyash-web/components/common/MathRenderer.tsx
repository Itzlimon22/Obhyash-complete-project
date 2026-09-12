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
  className?: string;
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

function healControlCharacters(raw: string): string {
  let text = raw;

  // \b (backspace \u0008) -> \begin, \bmatrix, \bullet, \binom, \beta, \bar, \boldsymbol
  text = text
    .replace(/[\u0008]egin\b/g, '\\begin')
    .replace(/[\u0008]matrix\b/g, '\\bmatrix')
    .replace(/[\u0008]ullet\b/g, '\\bullet')
    .replace(/[\u0008]inom\b/g, '\\binom')
    .replace(/[\u0008]eta\b/g, '\\beta')
    .replace(/[\u0008]ar\b/g, '\\bar')
    .replace(/[\u0008]oldsymbol\b/g, '\\boldsymbol')
    .replace(/[\u0008]/g, '')
    // \v (vertical tab \u000b) -> \vec, \vmatrix, \vert
    .replace(/[\u000b\v]ec\b/g, '\\vec')
    .replace(/[\u000b\v]ec\{/g, '\\vec{')
    .replace(/[\u000b\v]matrix\b/g, '\\vmatrix')
    .replace(/[\u000b\v]ert\b/g, '\\vert')
    .replace(/[\u000b\v]/g, '')
    // \t (tab \u0009) -> \text, \times, \theta, \tan, \tau, \to, \tilde
    .replace(/[\t\u0009]ext\{/g, '\\text{')
    .replace(/[\t\u0009]imes\b/g, '\\times')
    .replace(/[\t\u0009]heta\b/g, '\\theta')
    .replace(/[\t\u0009]an\b/g, '\\tan')
    .replace(/[\t\u0009]au\b/g, '\\tau')
    .replace(/[\t\u0009]o\b/g, '\\to')
    .replace(/[\t\u0009]ilde\{/g, '\\tilde{')
    // \a (bell \u0007) -> \alpha, \approx
    .replace(/[\u0007]lpha\b/g, '\\alpha')
    .replace(/[\u0007]pprox\b/g, '\\approx')
    .replace(/[\u0007]/g, '')
    // \f (form feed \u000c) -> \frac, \forall
    .replace(/[\u000c]rac\b/g, '\\frac')
    .replace(/[\u000c]orall\b/g, '\\forall')
    .replace(/[\u000c]/g, '')
    // Non-printable control characters
    .replace(/[\u0000-\u0006\u000e-\u001f]/g, '');

  // Auto-heal common LaTeX commands where the backslash was stripped
  text = text
    .replace(/(?<=\s|\$|\||^|\()ec\{/g, '\\vec{')
    .replace(/(?<=\s|\$|\||^|\()hat\{/g, '\\hat{')
    .replace(/(?<=\s|\$|\||^|\()bar\{/g, '\\bar{')
    .replace(/(?<=\s|\$|\||^|\()dot\{/g, '\\dot{')
    .replace(/(?<=\s|\$|\||^|\()ddot\{/g, '\\ddot{')
    .replace(/(?<=\s|\$|\||^|\()tilde\{/g, '\\tilde{')
    .replace(/(?<=\s|\$|\||^|\()sqrt\{/g, '\\sqrt{')
    .replace(/(?<=\s|\$|\||^|\()frac\{/g, '\\frac{')
    .replace(/(?<=\s|\$|\||^|\()imes(?=\s|[\$\d\w\\\{])/g, '\\times')
    .replace(/(?<=\s|\$|\||^|\()heta(?=\s|[\$\d\w\\\}\,\.\=])/g, '\\theta')
    .replace(/(?<=\s|\$|\||^|\()lpha(?=\s|[\$\d\w\\\}\,\.\=])/g, '\\alpha')
    .replace(/(?<=\s|\$|\||^|\()eta(?=\s|[\$\d\w\\\}\,\.\=])/g, '\\beta')
    .replace(/(?<=\s|\$|\||^|\()circ(?=\s|[\$\d\w\\\}\,\.\=])/g, '\\circ');

  // Normalize LaTeX bracket syntax \[ ... \] and \( ... \)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Normalize empty nucleus notation (e.g. \{} -> {} before sub/superscripts in isotopes like {}^{35}_{17}Cl)
  text = text.replace(/\\\{\}/g, '{}');

  // Matrix row break normalization (e.g. \begin{vmatrix} 1 & 2 \ 3 & 4 \end{vmatrix})
  text = text.replace(
    /(\\begin\{(?:v|p|b|B|V)?matrix\}[\s\S]*?\\end\{(?:v|p|b|B|V)?matrix\})/g,
    (mat) => {
      return mat.replace(/(?<=[^\\&])\s*\\\s+(?=[0-9a-zA-Z\-\+\&])/g, ' \\\\ ');
    }
  );

  return text;
}

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
        const placeholder = `@@TABLEBLOCK${tables.length}@@`;
        tables.push(currentTableLines.join("\n"));
        outputLines.push(placeholder);
        currentTableLines = [];
      }
      outputLines.push(line);
    }
  }

  if (currentTableLines.length > 0) {
    const placeholder = `@@TABLEBLOCK${tables.length}@@`;
    tables.push(currentTableLines.join("\n"));
    outputLines.push(placeholder);
  }

  return { textWithoutTables: outputLines.join("\n"), tables };
}

function restoreTables(text: string, tables: string[]): string {
  let result = text;
  tables.forEach((table, index) => {
    result = result.replace(`@@TABLEBLOCK${index}@@`, `\n\n${table}\n\n`);
  });
  return result;
}

function preprocess(text: string): string {
  if (preprocessCache.has(text)) {
    return preprocessCache.get(text)!;
  }

  // 0. Auto-heal unescaped escape sequences, control characters, brackets, matrices
  let processedText = healControlCharacters(text);

  // 1. Normalize literal \n, HTML <br>, and multiple $$$$
  processedText = processedText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\${3,}/g, "\n\n");

  // Protect Markdown tables from delimiters, step splitting and line restructuring
  const { textWithoutTables, tables } = extractAndProtectTables(processedText);
  processedText = textWithoutTables;

  processedText = cleanPipesAndDelimiters(processedText);
  processedText = separateTransitionSteps(processedText);

  // Auto-detect unwrapped LaTeX option / formula strings (e.g. "4 \times 10^{6} ms^{-1}")
  if (!processedText.includes("$") && !/[\u0980-\u09FF]/.test(processedText)) {
    const trimmed = processedText.trim();
    if (
      trimmed.length > 0 &&
      (trimmed.includes("\\") ||
        /\^\{?[0-9\-\+a-zA-Z]+\}?|_\{?[0-9\-\+a-zA-Z]+\}?/.test(trimmed))
    ) {
      processedText = `$${trimmed}$`;
    }
  }

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

function BaseMathRenderer({ text, block = false, className = "" }: MathRendererProps) {
  if (!text) return null;

  const formattedText = preprocess(text);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert font-sans
        prose-p:leading-relaxed prose-p:my-2
        prose-li:my-1 prose-ul:my-2 prose-ol:my-2
        prose-table:my-3 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
        ${block ? "block my-2" : "inline"} ${className}`}
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
