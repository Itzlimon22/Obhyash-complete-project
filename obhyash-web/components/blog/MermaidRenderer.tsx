'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default);
  }
  return mermaidPromise;
}

let idCounter = 0;

const DIAGRAM_META: Record<string, { label: string; icon: string }> = {
  flowchart: { label: 'Flowchart', icon: 'flow' },
  graph: { label: 'Graph', icon: 'flow' },
  sequencediagram: { label: 'Sequence Diagram', icon: 'seq' },
  classDiagram: { label: 'Class Diagram', icon: 'class' },
  statediagram: { label: 'State Diagram', icon: 'state' },
  erdiagram: { label: 'ER Diagram', icon: 'er' },
  gantt: { label: 'Gantt Chart', icon: 'gantt' },
  pie: { label: 'Pie Chart', icon: 'pie' },
  mindmap: { label: 'Mind Map', icon: 'mind' },
  timeline: { label: 'Timeline', icon: 'time' },
  'xychart-beta': { label: 'Chart', icon: 'chart' },
  quadrantchart: { label: 'Quadrant Chart', icon: 'quad' },
};

function getDiagramMeta(code: string) {
  const first = code.trim().split('\n')[0].toLowerCase().trim();
  for (const [key, meta] of Object.entries(DIAGRAM_META)) {
    if (first.startsWith(key.toLowerCase())) return meta;
  }
  return { label: 'Diagram', icon: 'flow' };
}

function DiagramIcon({ type }: { type: string }) {
  if (type === 'mind') {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="3" />
        <circle cx="4" cy="6" r="2" />
        <line x1="6" y1="7.5" x2="9.3" y2="10.5" />
        <circle cx="20" cy="6" r="2" />
        <line x1="18" y1="7.5" x2="14.7" y2="10.5" />
        <circle cx="4" cy="18" r="2" />
        <line x1="6" y1="16.5" x2="9.3" y2="13.5" />
        <circle cx="20" cy="18" r="2" />
        <line x1="18" y1="16.5" x2="14.7" y2="13.5" />
        <circle cx="12" cy="3" r="2" />
        <line x1="12" y1="5" x2="12" y2="9" />
      </svg>
    );
  }
  if (type === 'chart' || type === 'pie') {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    );
  }
  if (type === 'time' || type === 'gantt') {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="10" width="12" height="4" rx="1" />
        <rect x="3" y="16" width="15" height="4" rx="1" />
      </svg>
    );
  }
  // default: flow/graph
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="6" height="5" rx="1" />
      <rect x="15" y="8" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <line x1="9" y1="5.5" x2="15" y2="10.5" />
      <line x1="9" y1="18.5" x2="15" y2="13" />
    </svg>
  );
}

export default function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [zoom, setZoom] = useState(1);
  const idRef = useRef(`mermaid-${++idCounter}`);
  const meta = getDiagramMeta(code);

  const applyZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(2.5, Math.max(0.4, Math.round(newZoom * 10) / 10));
    setZoom(clamped);
    if (svgRef.current) {
      svgRef.current.style.width = `${clamped * 100}%`;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRendered(false);
    setError(null);
    setZoom(1);

    const render = async () => {
      try {
        const mermaid = await getMermaid();
        const isDark = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
          securityLevel: 'loose',
          fontFamily: "'Inter', 'system-ui', '-apple-system', sans-serif",
          fontSize: 16,
          flowchart: {
            curve: 'basis',
            padding: 36,
            useMaxWidth: true,
            htmlLabels: true,
          },
          mindmap: { useMaxWidth: true, padding: 36 },
          sequence: { useMaxWidth: true, boxMargin: 20, messageMargin: 50 },
        });

        if (containerRef.current) containerRef.current.innerHTML = '';

        const { svg } = await mermaid.render(idRef.current, code.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgRef.current = svgEl;
            svgEl.removeAttribute('height');
            svgEl.setAttribute('width', '100%');
            svgEl.style.width = '100%';
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.minHeight = '320px';
            svgEl.style.display = 'block';
          }
          setRendered(true);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <figure className="not-prose my-6 sm:my-8 rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/30 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 border-b border-rose-200 dark:border-rose-800/50">
          <svg
            className="w-3.5 h-3.5 text-rose-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
            Diagram Error
          </span>
        </div>
        <pre className="p-4 text-xs text-rose-600 dark:text-rose-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {error}
        </pre>
      </figure>
    );
  }

  return (
    <figure className="not-prose my-6 sm:my-8 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <DiagramIcon type={meta.icon} />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
            {meta.label}
          </span>
        </div>

        {rendered && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyZoom(zoom - 0.1)}
              disabled={zoom <= 0.4}
              aria-label="Zoom out"
              className="flex items-center justify-center w-6 h-6 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold leading-none"
            >
              −
            </button>
            <button
              onClick={() => applyZoom(1)}
              aria-label="Reset zoom"
              className="px-2 h-6 rounded-md text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors tabular-nums min-w-[40px] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => applyZoom(zoom + 0.1)}
              disabled={zoom >= 2.5}
              aria-label="Zoom in"
              className="flex items-center justify-center w-6 h-6 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold leading-none"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {!rendered && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
          <svg
            className="animate-spin w-5 h-5 text-indigo-400 dark:text-indigo-500"
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
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Rendering {meta.label.toLowerCase()}…
          </span>
        </div>
      )}

      {/* ── Diagram canvas ── */}
      <div
        className="overflow-x-auto px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 bg-white dark:bg-slate-900 min-h-[340px] sm:min-h-[420px] flex items-center"
        style={{
          touchAction: 'pan-x pan-y',
          display: rendered ? undefined : 'none',
        }}
      >
        <div
          ref={containerRef}
          className="w-full"
          style={{ transition: 'all 0.15s ease' }}
        />
      </div>
    </figure>
  );
}
