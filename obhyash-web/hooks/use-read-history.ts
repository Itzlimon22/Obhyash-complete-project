'use client';

import { useState } from 'react';

const STORAGE_KEY = 'obhyash_blog_read';
const MAX_HISTORY = 300;

/** Returns the set of slugs the user has read (from localStorage). */
export function useReadHistory(): Set<string> {
  const [slugs] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  return slugs;
}

/** Records a slug as read in localStorage. Safe to call server-side (no-ops). */
export function markPostAsRead(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!existing.includes(slug)) {
      const next = [slug, ...existing].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}
