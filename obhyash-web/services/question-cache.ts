/**
 * Offline Question Cache Service
 *
 * Caches fetched exam questions in localStorage so users can
 * start exams even with poor connectivity. Uses a subject-based
 * cache key with 24-hour TTL.
 */

import { Question } from '@/lib/types';

const CACHE_PREFIX = 'obhyash_q_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 10; // Keep last 10 subject caches

interface CachedQuestionSet {
  questions: Question[];
  timestamp: number;
  subject: string;
  chapters?: string[];
}

/**
 * Build a cache key from subject and optional chapters.
 */
function buildKey(subject: string, chapters?: string[] | null): string {
  const chapterPart = chapters?.length
    ? '_' + chapters.sort().join('_').slice(0, 50) // cap key length
    : '_all';
  return CACHE_PREFIX + subject.normalize('NFC') + chapterPart;
}

/**
 * Save questions to the offline cache.
 */
export function cacheQuestions(
  subject: string,
  questions: Question[],
  chapters?: string[] | null,
): void {
  if (typeof window === 'undefined' || questions.length === 0) return;

  try {
    const key = buildKey(subject, chapters);
    const entry: CachedQuestionSet = {
      questions,
      timestamp: Date.now(),
      subject,
      chapters: chapters || undefined,
    };

    localStorage.setItem(key, JSON.stringify(entry));
    pruneOldCaches();
  } catch (e) {
    // localStorage full or unavailable — silently fail
    console.warn('Failed to cache questions:', e);
  }
}

/**
 * Retrieve cached questions. Returns null if cache miss or expired.
 */
export function getCachedQuestions(
  subject: string,
  chapters?: string[] | null,
): Question[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildKey(subject, chapters);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CachedQuestionSet = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (age > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.questions;
  } catch {
    return null;
  }
}

/**
 * Check if we have a valid cache for the given subject/chapters.
 */
export function hasCachedQuestions(
  subject: string,
  chapters?: string[] | null,
): boolean {
  return getCachedQuestions(subject, chapters) !== null;
}

/**
 * Remove oldest cache entries when we exceed MAX_CACHE_ENTRIES.
 */
function pruneOldCaches(): void {
  try {
    const cacheKeys: { key: string; timestamp: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry = JSON.parse(raw);
            cacheKeys.push({ key, timestamp: entry.timestamp || 0 });
          }
        } catch {
          // Corrupted entry, remove it
          if (key) localStorage.removeItem(key);
        }
      }
    }

    if (cacheKeys.length > MAX_CACHE_ENTRIES) {
      // Sort oldest first
      cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = cacheKeys.slice(0, cacheKeys.length - MAX_CACHE_ENTRIES);
      toRemove.forEach(({ key }) => localStorage.removeItem(key));
    }
  } catch {
    // ignore
  }
}

/**
 * Clear all question caches (e.g., on logout).
 */
export function clearQuestionCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
