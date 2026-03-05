'use client';

import { useEffect, useRef, useState } from 'react';

// Mermaid is loaded dynamically to avoid SSR issues
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default;
      return mermaid;
    });
  }
  return mermaidPromise;
}

let idCounter = 0;

export default function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const idRef = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = await getMermaid();

        // Detect dark mode from the `dark` class on <html>
        const isDark = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });

        // Clean up any previous render
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        const { svg } = await mermaid.render(idRef.current, code.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make the SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('height');
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-8 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 overflow-hidden">
        <div className="px-4 py-2 bg-rose-100 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-900/40 text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold">
          Diagram Error
        </div>
        <pre className="p-4 text-sm text-rose-600 dark:text-rose-400 overflow-x-auto whitespace-pre-wrap">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-8 sm:my-10 not-prose flex flex-col items-center">
      {!rendered && !error && (
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm py-8">
          <svg
            className="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Rendering diagram…
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto flex justify-center rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm custom-scrollbar"
        style={{ display: rendered ? undefined : 'none' }}
      />
    </div>
  );
}
