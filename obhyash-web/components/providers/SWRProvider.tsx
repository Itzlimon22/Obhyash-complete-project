'use client';

import { SWRConfig, type State } from 'swr';
import React from 'react';

const CACHE_KEY = 'obhyash_swr_cache';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — stale cache entries older than this are dropped

/**
 * Persistent SWR cache provider backed by localStorage.
 *
 * How it works:
 * - On mount: reads the entire SWR cache from localStorage into an in-memory Map.
 *   SWR serves that data instantly (no network round-trip) on the first render.
 * - While running: the in-memory Map is the live cache (SWR's default).
 * - On beforeunload: writes the in-memory Map back to localStorage so it
 *   survives page reloads and tab closes.
 *
 * This means:
 *   Cold start (first ever visit): skeleton → data (normal)
 *   Warm start (any subsequent visit): data IMMEDIATELY, then silently revalidates
 */
function localStorageProvider(): Map<string, State<any>> {
  if (typeof window === 'undefined') return new Map();

  let initial: [string, State<any>][] = [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: { entries: [string, State<any>][]; savedAt: number } = JSON.parse(raw);
      // Drop cache if it's older than MAX_AGE_MS to prevent permanently stale data
      if (Date.now() - parsed.savedAt < MAX_AGE_MS) {
        initial = parsed.entries;
      }
    }
  } catch {
    // Corrupt cache — start fresh
  }

  const map = new Map<string, State<any>>(initial);

  const persist = () => {
    try {
      const payload = JSON.stringify({
        entries: Array.from(map.entries()),
        savedAt: Date.now(),
      });
      localStorage.setItem(CACHE_KEY, payload);
    } catch {
      // Storage quota exceeded — clear old cache and try again
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
    }
  };

  // Save on tab hide/close (more reliable than beforeunload on mobile)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist();
  });
  window.addEventListener('beforeunload', persist);

  return map;
}

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        // Global defaults — individual hooks can still override these
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 30_000,
        // When cache has data, show it immediately and revalidate in background
        revalidateIfStale: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
