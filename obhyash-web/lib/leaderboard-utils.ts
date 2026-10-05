import { SupabaseClient } from '@supabase/supabase-js';

// Global timestamp to debounce reset runs (at most once every 30 minutes per instance)
let lastResetCheck = 0;
const RESET_DEBOUNCE_MS = 30 * 60 * 1000;

/**
 * Checks and resets stale monthly_xp for all students if the calendar month has rolled over.
 * Safe to call from leaderboard APIs, server components, and cron jobs.
 */
export async function ensureMonthlyLeaderboardReset(supabase: SupabaseClient): Promise<number> {
  const now = Date.now();
  if (now - lastResetCheck < RESET_DEBOUNCE_MS) {
    return 0;
  }
  lastResetCheck = now;

  try {
    const nowUtc = new Date();
    const startOfMonthUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), 1));
    const startOfMonthIso = startOfMonthUtc.toISOString();

    // Reset all users whose monthly_xp_reset_at is before the current month start
    const { data, error } = await supabase
      .from('users')
      .update({
        monthly_xp: 0,
        monthly_xp_reset_at: startOfMonthIso,
      })
      .or('role.ilike.student,role.is.null')
      .or(`monthly_xp_reset_at.is.null,monthly_xp_reset_at.lt.${startOfMonthIso}`)
      .gt('monthly_xp', 0)
      .select('id');

    if (error) {
      console.warn('[ensureMonthlyLeaderboardReset] Update warning:', error.message);
      return 0;
    }

    const resetCount = data?.length || 0;
    if (resetCount > 0) {
      console.log(`[ensureMonthlyLeaderboardReset] Successfully reset ${resetCount} users for ${startOfMonthIso.slice(0, 7)}`);
    }
    return resetCount;
  } catch (err) {
    console.error('[ensureMonthlyLeaderboardReset] Error:', err);
    return 0;
  }
}

/**
 * Pure calculation of effective XP considering timeframe and calendar month rollover.
 */
export function calculateEffectiveXp(
  user: {
    xp?: number | null;
    monthly_xp?: number | null;
    monthly_xp_reset_at?: string | null;
  },
  timeframe: 'monthly' | 'all_time' | string = 'monthly',
): number {
  if (timeframe === 'all_time') {
    return user.xp || 0;
  }

  // Monthly timeframe
  let mXp = user.monthly_xp ?? 0;
  if (user.monthly_xp_reset_at) {
    const resetDate = new Date(user.monthly_xp_reset_at);
    const now = new Date();
    if (
      now.getUTCFullYear() > resetDate.getUTCFullYear() ||
      now.getUTCMonth() > resetDate.getUTCMonth()
    ) {
      mXp = 0;
    }
  }

  return Math.max(0, mXp);
}
