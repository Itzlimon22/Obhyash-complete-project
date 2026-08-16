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

    const isListItem = /^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+\.|\-|\*|\#|নিচের)/.test(
      trimmed
    );

    if (isListItem) {
      buffer.push("\n" + trimmed);
    } else {
      buffer.push(" " + trimmed);
    }
  }

  return buffer.join("").replaceAll(placeholder, "\n\n");
}

const preprocessCache = new Map<string, string>();
const MAX_PREPROCESS_CACHE = 600;

function preprocess(text: string): string {
  if (preprocessCache.has(text)) {
    return preprocessCache.get(text)!;
  }

  // 1. Normalize literal \n
  let processedText = text.replace(/\\n/g, "\n");

  // 2. Split into math blocks and non-math segments
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

  // 3. Process each segment safely (never modifying content inside pure math blocks)
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

    t = t.replace(/\b([a-zA-Z0-9]+)\^(-?[0-9]+)\b/g, "$$$1^{$2}$$");
    t = t.replace(/\b([a-zA-Z0-9]+)\^\{(-?[0-9a-zA-Z]+)\}\b/g, "$$$1^{$2}$$");

    t = cleanIntraSentenceNewlines(t);

    t = t.replace(/(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+/gi, "\n$1. ");
    t = t.replace(/(?:\s+|^)\((i|ii|iii|iv|v)\)\s+/gi, "\n($1) ");
    t = t.replace(/(?:\s+|^)নিচের কোনটি সঠিক\?/g, "\n\nনিচের কোনটি সঠিক?");

    return t;
  });

  const result = processedParts.join("");
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
      className={`prose prose-sm max-w-none dark:prose-invert 
        prose-p:leading-relaxed prose-p:my-1
        prose-li:my-0.5 prose-ul:my-1
        ${block ? "my-2" : "inline"}`}
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
            <span {...props} className={block ? "block mb-2" : ""} />
          ),
        }}
      >
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}

export const MathRenderer = React.memo(BaseMathRenderer);
