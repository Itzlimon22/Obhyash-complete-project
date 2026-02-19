'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { toggleBookmark, getUserBookmarks } from '@/services/bookmark-service';

/**
 * useBookmarks — centralised bookmark state for the entire app.
 *
 * Returns:
 *  - bookmarkedIds : Set<string>  — all bookmarked question IDs for the user
 *  - isBookmarked  : (id) => bool — quick look-up helper
 *  - toggle        : (id) => void — optimistic toggle with DB sync + toast
 *  - isLoading     : boolean      — true while initial fetch is in progress
 */
export function useBookmarks(userId: string | undefined) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setBookmarkedIds(new Set());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getUserBookmarks(userId)
      .then((ids) => {
        if (!cancelled) {
          // Normalise every ID to string so Set.has() always works regardless
          // of whether a question ID was stored as a number or string.
          const normalised = new Set<string>([...ids].map((id) => String(id)));
          setBookmarkedIds(normalised);
        }
      })
      .catch((err) => {
        console.error('[useBookmarks] fetch error', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ── Toggle (optimistic) ─────────────────────────────────────────────────────
  const toggle = useCallback(
    async (questionId: string | number) => {
      if (!userId) return;

      const qId = String(questionId);
      const wasBookmarked = bookmarkedIds.has(qId);

      // Optimistic UI update
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(qId);
        else next.add(qId);
        return next;
      });

      try {
        await toggleBookmark(userId, qId, wasBookmarked);
        toast.success(
          wasBookmarked ? 'বুকমার্ক রিমুভ হয়েছে' : 'বুকমার্ক সেভ হয়েছে',
        );
      } catch (err) {
        // Roll back on failure
        console.error('[useBookmarks] toggle error', err);
        setBookmarkedIds((prev) => {
          const rollback = new Set(prev);
          if (wasBookmarked) rollback.add(qId);
          else rollback.delete(qId);
          return rollback;
        });
        toast.error('বুকমার্ক আপডেট করা যায়নি');
      }
    },
    [userId, bookmarkedIds],
  );

  // ── Helper ──────────────────────────────────────────────────────────────────
  const isBookmarked = useCallback(
    (questionId: string | number) => bookmarkedIds.has(String(questionId)),
    [bookmarkedIds],
  );

  return { bookmarkedIds, isBookmarked, toggle, isLoading };
}
