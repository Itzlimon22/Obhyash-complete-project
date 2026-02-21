'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// --- In-memory cache store (shared across all hook instances) ---
const cache = new Map<string, { data: unknown; timestamp: number }>();

interface UseCachedQueryOptions {
  /** Time in ms before data is considered stale (default: 5 min) */
  staleTime?: number;
  /** Whether to refetch when window regains focus (default: false) */
  refetchOnFocus?: boolean;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseCachedQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Lightweight SWR-like hook for caching async data fetches.
 *
 * - Deduplicates requests with the same key
 * - Serves stale data instantly while refetching
 * - In-memory cache (shared across component instances)
 *
 * Usage:
 *   const { data, isLoading } = useCachedQuery('subjects', () => getSubjects());
 *   const { data } = useCachedQuery(['chapters', subjectId], () => getChapters(subjectId));
 */
export function useCachedQuery<T>(
  key: string | (string | undefined | null)[],
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions = {},
): UseCachedQueryResult<T> {
  const {
    staleTime = 5 * 60 * 1000,
    refetchOnFocus = false,
    enabled = true,
  } = options;

  // Stable cache key
  const cacheKey = Array.isArray(key) ? key.filter(Boolean).join(':') : key;

  const [data, setData] = useState<T | undefined>(() => {
    // Serve cached data instantly if available
    const entry = cache.get(cacheKey);
    if (entry) return entry.data as T;
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(!cache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const doFetch = useCallback(async () => {
    if (fetchingRef.current || !enabled) return;
    fetchingRef.current = true;

    try {
      setError(null);
      // Only show loading if we have no cached data
      if (!cache.has(cacheKey)) setIsLoading(true);

      const result = await fetcher();

      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      setError(msg);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled]);

  // Fetch on mount or when key changes
  useEffect(() => {
    if (!enabled) return;

    const entry = cache.get(cacheKey);
    if (entry) {
      // Serve stale data instantly
      setData(entry.data as T);

      // Refetch in background if stale
      const age = Date.now() - entry.timestamp;
      if (age > staleTime) {
        doFetch();
      }
    } else {
      doFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled]);

  // Refetch on window focus (optional)
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const onFocus = () => {
      const entry = cache.get(cacheKey);
      if (!entry || Date.now() - entry.timestamp > staleTime) {
        doFetch();
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [cacheKey, refetchOnFocus, staleTime, doFetch, enabled]);

  const refetch = useCallback(() => {
    cache.delete(cacheKey);
    doFetch();
  }, [cacheKey, doFetch]);

  return { data, isLoading, error, refetch };
}

/** Invalidate a specific cache key or all keys matching a prefix */
export function invalidateCache(keyOrPrefix: string): void {
  for (const k of cache.keys()) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix + ':')) {
      cache.delete(k);
    }
  }
}
