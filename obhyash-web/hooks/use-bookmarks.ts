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
export function useBookmarks(
  userId: string | undefined,
  loading: boolean = false,
  isPro: boolean = false,
  onLimitReached?: () => void,
) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || loading) {
      return;
    }

    let cancelled = false;

    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const ids = await getUserBookmarks(userId);
        if (!cancelled) {
          // Normalise every ID to string so Set.has() always works regardless
          // of whether a question ID was stored as a number or string.
          const normalised = new Set<string>([...ids].map((id) => String(id)));
          setBookmarkedIds(normalised);
        }
      } catch (err) {
        console.error('[useBookmarks] fetch error', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchBookmarks();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ── Toggle (optimistic with limit enforcement) ──────────────────────────────
  const toggle = useCallback(
    async (questionId: string | number) => {
      if (!userId) return;

      const qId = String(questionId);
      const wasBookmarked = bookmarkedIds.has(qId);

      // Check limit for free users when adding new bookmark
      if (!wasBookmarked && !isPro && bookmarkedIds.size >= 25) {
        if (onLimitReached) {
          onLimitReached();
        } else {
          toast.error(
            'বুকমার্ক লিমিট শেষ! ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন সংরক্ষণ করা যাবে।',
          );
        }
        return;
      }

      // Optimistic UI update
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(qId);
        else next.add(qId);
        return next;
      });

      try {
        await toggleBookmark(userId, qId, wasBookmarked, isPro);
        toast.success(
          wasBookmarked ? 'বুকমার্ক রিমুভ হয়েছে' : 'বুকমার্ক সেভ হয়েছে',
        );
      } catch (err: any) {
        // Roll back on failure
        console.error('[useBookmarks] toggle error', err);
        setBookmarkedIds((prev) => {
          const rollback = new Set(prev);
          if (wasBookmarked) rollback.add(qId);
          else rollback.delete(qId);
          return rollback;
        });

        if (err?.message === 'BOOKMARK_LIMIT_EXCEEDED') {
          if (onLimitReached) {
            onLimitReached();
          } else {
            toast.error(
              'বুকমার্ক লিমিট শেষ! ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন সংরক্ষণ করা যাবে।',
            );
          }
        } else {
          toast.error('বুকমার্ক আপডেট করা যায়নি');
        }
      }
    },
    [userId, bookmarkedIds, isPro, onLimitReached],
  );

  // ── Helper ──────────────────────────────────────────────────────────────────
  const isBookmarked = useCallback(
    (questionId: string | number) => bookmarkedIds.has(String(questionId)),
    [bookmarkedIds],
  );

  return { bookmarkedIds, isBookmarked, toggle, isLoading };
}
