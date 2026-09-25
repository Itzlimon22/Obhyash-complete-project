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
import { cn } from "@/lib/utils";

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

/**
 * Heals control characters created when JSON strings with single backslashes are parsed.
 * E.g. \b (backspace \u0008) -> \begin, \v (vertical tab \u000b) -> \vec, \t -> \text, \a -> \alpha, \f -> \frac
 */
function healControlCharacters(raw: string): string {
  let text = raw;

  text = text
    .replace(/[\u0008]egin\b/g, "\\begin")
    .replace(/[\u0008]matrix\b/g, "\\bmatrix")
    .replace(/[\u0008]ullet\b/g, "\\bullet")
    .replace(/[\u0008]inom\b/g, "\\binom")
    .replace(/[\u0008]eta\b/g, "\\beta")
    .replace(/[\u0008]ar\b/g, "\\bar")
    .replace(/[\u0008]oldsymbol\b/g, "\\boldsymbol")
    .replace(/[\u0008]/g, "")
    .replace(/[\u000b\v]ec\b/g, "\\vec")
    .replace(/[\u000b\v]ec\{/g, "\\vec{")
    .replace(/[\u000b\v]matrix\b/g, "\\vmatrix")
    .replace(/[\u000b\v]ert\b/g, "\\vert")
    .replace(/[\u000b\v]/g, "")
    .replace(/[\t\u0009]ext\{/g, "\\text{")
    .replace(/[\t\u0009]imes\b/g, "\\times")
    .replace(/[\t\u0009]heta\b/g, "\\theta")
    .replace(/[\t\u0009]an\b/g, "\\tan")
    .replace(/[\t\u0009]au\b/g, "\\tau")
    .replace(/[\t\u0009]o\b/g, "\\to")
    .replace(/[\t\u0009]ilde\{/g, "\\tilde{")
    .replace(/[\u0007]lpha\b/g, "\\alpha")
    .replace(/[\u0007]pprox\b/g, "\\approx")
    .replace(/[\u0007]/g, "")
    .replace(/[\u000c]rac\b/g, "\\frac")
    .replace(/[\u000c]orall\b/g, "\\forall")
    .replace(/[\u000c]/g, "")
    .replace(/[\u0000-\u0006\u000e-\u001f]/g, "");

  // Auto-heal common LaTeX commands where the backslash was stripped
  text = text
    .replace(/(?<=\s|\$|\||^|\()ec\{/g, "\\vec{")
    .replace(/(?<=\s|\$|\||^|\()hat\{/g, "\\hat{")
    .replace(/(?<=\s|\$|\||^|\()bar\{/g, "\\bar{")
    .replace(/(?<=\s|\$|\||^|\()dot\{/g, "\\dot{")
    .replace(/(?<=\s|\$|\||^|\()ddot\{/g, "\\ddot{")
    .replace(/(?<=\s|\$|\||^|\()tilde\{/g, "\\tilde{")
    .replace(/(?<=\s|\$|\||^|\()sqrt\{/g, "\\sqrt{")
    .replace(/(?<=\s|\$|\||^|\()frac\{/g, "\\frac{")
    .replace(/(?<=\s|\$|\||^|\()imes(?=\s|[\$\d\w\\\{])/g, "\\times")
    .replace(/(?<=\s|\$|\||^|\()heta(?=\s|[\$\d\w\\\}\,\.\=])/g, "\\theta")
    .replace(/(?<=\s|\$|\||^|\()lpha(?=\s|[\$\d\w\\\}\,\.\=])/g, "\\alpha")
    .replace(/(?<=\s|\$|\||^|\()eta(?=\s|[\$\d\w\\\}\,\.\=])/g, "\\beta")
    .replace(/(?<=\s|\$|\||^|\()circ(?=\s|[\$\d\w\\\}\,\.\=])/g, "\\circ");

  // Normalize LaTeX bracket syntax \[ ... \] and \( ... \)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$");
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");
  text = text.replace(/\\\{\}/g, "{}");

  return text;
}

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
        return "$" + math.replace(/\|/g, "\\vert ") + "$";
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

const preprocessCache = new Map<string, string>();
const MAX_PREPROCESS_CACHE = 600;

/**
 * Preprocesses raw question/explanation/option strings into standard LaTeX and Markdown:
 * - Fixes escaped and broken delimiters ($$$, $|, unclosed $$)
 * - Normalizes matrix row breaks (\ to \\)
 * - Safely wraps naked Bengali words inside math mode in \text{...}
 * - Automatically detects and wraps unwrapped formulas and chemical equations
 * - Ensures space boundaries around $ for remark-math
 */
function sanitizeLatexTokens(s: string): string {
  if (!s) return s;
  let res = s;
  // 1. Fix nested dollars inside equations e.g. $f \propto \sqrt{$[\text{M}\text{L}]$}$
  res = res.replace(/(\$(?:[^\$\n]+))\$([^\$\n]+)\$((?:[^\$\n]+)\$)/g, "$1$2$3");

  // 2. Fix over-escaped double backslashes in math commands e.g. ^\\circ -> ^\circ
  res = res.replace(
    /\\\\(circ|Delta|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|times|cdot|frac|sqrt|text|mathrm|pm|to|rightarrow|leftarrow|rightleftharpoons|approx|ne|leq|geq|infty|sum|int|partial|sim|propto|perp|parallel)\b/g,
    "\\$1"
  );

  // 3. Unpack Greek and math symbols incorrectly enclosed in \text{...}
  res = res.replace(
    /\\text\{\s*\\(Omega|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi)\s*\}/g,
    "\\$1"
  );

  // 4. Unpack math expressions inside \text{...} that contain \pi, \frac or math operators
  res = res.replace(/\\text\{\s*([^}]*\\(?:pi|frac|sqrt|times|cdot|pm)[^}]*)\}/g, "$1");

  // 5. Fix units with exponents inside \text{...} e.g. \text{L^-1}, \text{s^-1}, \text{m s^-2}
  res = res.replace(/\\text\{([A-Za-z]+)\^([-\d]+)\}/g, "\\text{$1}^{$2}");
  res = res.replace(/\\text\{([A-Za-z]+)\^-\}/g, "\\text{$1}^{-}");
  res = res.replace(/\\text\{([A-Za-z\s]+)\^([-\d]+)\}/g, "\\text{$1}^{$2}");

  // 6. Fix subscript inside \text{} e.g. \text{y_m} -> y_m, \text{N_A} -> N_A
  res = res.replace(/\\text\{([A-Za-z]+)_([A-Za-z0-9]+)\}/g, "$1_{$2}");

  // 7. Fix \text{^\circ...} -> ^{\circ...}
  res = res.replace(/\\text\{\s*\^\\circ\s*([A-Za-z]*)\s*\}/g, "^{\\circ}\\text{$1}");
  res = res.replace(/\\text\{\s*\^([^{}]+)\s*\}/g, "^{$1}");
  res = res.replace(/\\text\{\s*_([^{}]+)\s*\}/g, "_{$1}");

  // 8. Typo in physics questions e.g. \pier -> \pi r
  res = res.replace(/\\pier\b/g, "\\pi r");

  // 9. Stray carriage returns in chemical reactions e.g. \r\rightleftharpoons or \r\rightarrow
  res = res.replace(/\\r\\(rightleftharpoons|rightarrow|leftarrow|leftrightharpoons)/g, "\\$1");

  // 10. Fix stray \&& -> \&\&
  res = res.replace(/\\&&/g, "\\&\\&");

  // 11. Fix \text{B^-}1 -> B^{-1}
  res = res.replace(/\\text\{([A-Za-z]+)\^-\}([0-9]+)/g, "$1^{-$2}");

  // 12. Fix $14 x $1.66 -> $14 \times 1.66
  res = res.replace(/\$([0-9\.]+)\s*x\s*\$/gi, "$1 \\times ");

  // 13. Fix degree Celsius e.g. ^\circC -> ^\circ \text{C}
  res = res.replace(/\^\\circ([A-Z])/g, "^{\\circ}\\text{$1}");

  // 14. Fix empty \text{}
  res = res.replace(/\\text\{\s*\}/g, "");

  return res;
}

function preprocess(text: string): string {
  if (!text) return "";
  if (preprocessCache.has(text)) {
    return preprocessCache.get(text)!;
  }

  // 1. Heal control characters and legacy bracket syntax
  let processedText = healControlCharacters(text);

  // 1.1 Sanitize broken LaTeX tokens and corrupt constructs
  processedText = sanitizeLatexTokens(processedText);

  // 2. Protect Markdown tables from line adjustments
  const { textWithoutTables, tables } = extractAndProtectTables(processedText);
  processedText = textWithoutTables;

  // 3. Normalize multiple $$$ or $$$$ to $$
  processedText = processedText.replace(/\${3,}/g, "$$");

  // 4. Clean literal \n at math delimiters (e.g. \end{bmatrix} \n$)
  processedText = processedText.replace(/\\n\s*\$/g, "$\n");
  processedText = processedText.replace(/\$\s*\\n/g, "\n$");
  processedText = processedText.replace(/(?<=\$)(\s*\\n\s*)+(?=[^\$])/g, " ");

  // 5. Normalize matrix and tabular environments (clean stray dollars and row breaks)
  processedText = processedText.replace(
    /\$*\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?)\}\$*([\s\S]*?)\$*\\end\{\1\}\$*/g,
    (_full, env, body) => {
      const cleanBody = body
        .replace(/\$/g, "")
        .replace(/(?<=[^\\&])\s*\\\s+(?=[0-9a-zA-Z\-\+\&\.\,\(\)\{\}\\])/g, " \\\\ ");
      return `\n\n$$\\begin{${env}}${cleanBody}\\end{${env}}$$\n\n`;
    }
  );

  // 6. Close unclosed $$ before Bengali transition text or equations
  processedText = processedText.replace(
    /(\$\$\s*[^\n$]*?\\end\{(?:v|p|b|B|V|small)?matrix\}[^$\n]*?)([ \t]*[\u0980-\u09FF])/g,
    "$1$$\n\n$2"
  );
  processedText = processedText.replace(
    /(\$\$\s*[^\n$]*?=[\s\S]*?\\end\{(?:v|p|b|B|V|small)?matrix\}[^$\n]*?)([ \t]*[\u0980-\u09FF])/g,
    "$1$$\n\n$2"
  );

  // 7. Fix mismatched $$...$ (starts with $$ but ends with single $)
  processedText = processedText.replace(/(?<=\n|^)\$\$([^\$\n]+)\$(?=\s*($|\n))/gm, "$$$$$1$$$$");
  processedText = processedText.replace(/\$\|\s*$/gm, "$");

  // 8. Fix broken nested dollars like $$\nনির্ণায়ক: $...$ -> remove outer $$
  processedText = processedText.replace(
    /\$\$\s*([\u0980-\u09FF\s\:\,\।]+)\$([^\$]+)\$([^$]*?)\$\$/g,
    "$1 $$$2$$ $3"
  );

  // 9. Dimensional formula brackets e.g. [MLT^{-2}], [M], [LT^{-1}]
  processedText = processedText.replace(
    /(?<!\$)(?:\[[A-Za-z0-9\s\+\-\*\/\^\{\}\_\\]+\])(?!\$)(?!\()/g,
    "$$$&$$"
  );

  // 10. Ensure space around $ next to Bengali letters for remark-math delimiter recognition
  processedText = processedText.replace(/(?<=[\u0980-\u09FF])\$(?!\$)/g, " $");
  processedText = processedText.replace(/(?<!\$)\$(?=[\u0980-\u09FF])/g, "$ ");

  // 11. Wrap naked Bengali words inside $...$ in \text{...} so KaTeX renders without errors
  processedText = processedText.replace(/\$([^\$\n]+)\$/g, (match, inner) => {
    if (/[\u0980-\u09FF]/.test(inner)) {
      const safe = inner
        .replace(/([^\\]|^)(\b[\u0980-\u09FF\s]+)/g, (m: string, prefix: string, bengali: string) => {
          if (prefix.includes("\\text")) return m;
          return `${prefix}\\text{${bengali.trim()}}`;
        })
        .replace(/\\text\{\\text\{([^}]+)\}\}/g, "\\text{$1}");
      return `$${safe}$`;
    }
    return match;
  });

  // 12. Auto-wrap unwrapped equations in options or questions
  if (!processedText.includes("$")) {
    const trimmed = processedText.trim();
    if (
      trimmed.includes("\\frac") ||
      trimmed.includes("\\times") ||
      trimmed.includes("\\cdot") ||
      trimmed.includes("\\sqrt") ||
      trimmed.includes("\\vec") ||
      trimmed.includes("\\hat") ||
      trimmed.includes("\\bar") ||
      trimmed.includes("\\begin{") ||
      trimmed.includes("\\circ") ||
      trimmed.includes("\\pm") ||
      trimmed.includes("\\infty") ||
      /\b[a-zA-Z]\s*=\s*[-0-9]/.test(trimmed) ||
      /^[a-zA-Z0-9]+[\^_]\{?[0-9a-zA-Z\-\+]+\}?/.test(trimmed)
    ) {
      processedText = `$${trimmed}$`;
    } else if (
      /[\u0980-\u09FF]/.test(trimmed) &&
      (trimmed.includes("\\") || /\b[A-Za-z0-9]+\^[0-9\-\+]+\b/.test(trimmed))
    ) {
      // Mixed Bengali with embedded formula
      processedText = trimmed.replace(
        /(\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\])*|[A-Za-z0-9]+\^\{?[0-9\-\+]+\}?)/g,
        " $$$1$$ "
      );
    }
  }

  // 13. Restore protected tables
  const result = restoreTables(processedText, tables);

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
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert font-sans min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]",
        block ? "block my-1.5" : "inline-block max-w-full align-middle",
        !block && "prose-p:inline prose-p:my-0 prose-p:leading-normal",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
        ]}
        components={{
          p: ({ node, ...props }) => (
            <p
              {...props}
              className={cn(
                "break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full",
                block
                  ? "block mb-2 leading-relaxed text-[#2E2621] dark:text-[#F4F4F5]"
                  : "inline leading-normal"
              )}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#E2D7C9] dark:border-[#27272A] bg-white/80 dark:bg-[#121214]/80 shadow-xs max-w-full">
              <table {...props} className="w-full text-left border-collapse text-sm min-w-full" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              {...props}
              className="bg-[#F3ECE4] dark:bg-[#1E1E22] text-[#42352B] dark:text-[#F4F4F5] font-bold border-b border-[#E2D7C9] dark:border-[#27272A]"
            />
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
            <td
              {...props}
              className="px-3.5 py-2 text-[14px] sm:text-[15px] text-[#2E2621] dark:text-[#E4E4E7]"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside space-y-1.5 my-2 text-[#2E2621] dark:text-[#F4F4F5] max-w-full break-words [overflow-wrap:anywhere]" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside space-y-1.5 my-2 text-[#2E2621] dark:text-[#F4F4F5] max-w-full break-words [overflow-wrap:anywhere]" />
          ),
          li: ({ node, ...props }) => <li {...props} className="leading-relaxed my-0.5 max-w-full break-words [overflow-wrap:anywhere]" />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-[#D97706] pl-3 py-1.5 my-2 italic bg-[#FEF3C7]/20 dark:bg-[#78350F]/20 rounded-r-lg text-[#2E2621] dark:text-[#F4F4F5] max-w-full break-words [overflow-wrap:anywhere]"
            />
          ),
          code: ({ node, inline, ...props }: any) => (
            <code
              {...props}
              className={cn(
                "font-mono text-[13px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1E1E22] text-[#B45309] dark:text-[#FCD34D] break-all max-w-full inline-block",
                props.className
              )}
            />
          ),
          pre: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2 p-3 rounded-xl bg-neutral-100 dark:bg-[#1E1E22] max-w-full">
              <pre {...props} className="text-xs font-mono max-w-full" />
            </div>
          ),
        }}
      >
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}

export const MathRenderer = React.memo(BaseMathRenderer);
export default MathRenderer;
