import { UserProfile } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';

export interface UserStreakInfo {
  currentStreak: number;
  hasCompletedToday: boolean;
  lastActiveDate: string | null;
  weekActivity: boolean[]; // 7 items (Sun=0, Mon=1, ..., Sat=6)
  last30DaysActivity: number[]; // 30 items (index 0 = 29 days ago, index 29 = today)
}

export const EMPTY_STREAK_INFO: UserStreakInfo = {
  currentStreak: 0,
  hasCompletedToday: false,
  lastActiveDate: null,
  weekActivity: [false, false, false, false, false, false, false],
  last30DaysActivity: new Array(30).fill(0),
};

/**
 * Returns "YYYY-MM-DD" string in Bangladesh Standard Time (UTC+6).
 */
export const toBangladeshDateStr = (date: Date = new Date()): string => {
  // Add 6 hours to UTC to get Asia/Dhaka time without DST anomalies
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const dhakaTime = new Date(utc + 3600000 * 6);
  return `${dhakaTime.getFullYear()}-${String(dhakaTime.getMonth() + 1).padStart(2, '0')}-${String(dhakaTime.getDate()).padStart(2, '0')}`;
};

/**
 * Computes consecutive streak from an array of unique date strings ("YYYY-MM-DD")
 * matching the production PostgreSQL algorithm.
 */
export const computeStreakFromDates = (
  activeDatesSet: Set<string>,
  todayDateStr: string = toBangladeshDateStr(new Date()),
): { currentStreak: number; hasCompletedToday: boolean } => {
  const hasCompletedToday = activeDatesSet.has(todayDateStr);

  const today = new Date(`${todayDateStr}T00:00:00Z`);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

  let cursorDate: Date | null = null;
  if (hasCompletedToday) {
    cursorDate = today;
  } else if (activeDatesSet.has(yesterdayStr)) {
    cursorDate = yesterday;
  }

  let streak = 0;
  if (cursorDate) {
    let curr = new Date(cursorDate);
    while (true) {
      const dStr = `${curr.getUTCFullYear()}-${String(curr.getUTCMonth() + 1).padStart(2, '0')}-${String(curr.getUTCDate()).padStart(2, '0')}`;
      if (activeDatesSet.has(dStr)) {
        streak++;
        curr = new Date(curr.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak: streak,
    hasCompletedToday,
  };
};

/**
 * Unified entry point: Fetches production-grade streak data from DB.
 * Uses get_user_streak_info RPC (PostgreSQL Asia/Dhaka single source of truth).
 * Falls back to client-side computation from exam tables if RPC is unavailable.
 */
export const fetchUserStreakInfo = async (
  userId: string,
): Promise<UserStreakInfo> => {
  if (!userId) return EMPTY_STREAK_INFO;

  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('get_user_streak_info', {
      p_user_id: userId,
    });

    if (!error && data) {
      return {
        currentStreak: Number(data.current_streak) || 0,
        hasCompletedToday: Boolean(data.has_completed_today),
        lastActiveDate: data.last_active_date || null,
        weekActivity: Array.isArray(data.week_activity)
          ? data.week_activity
          : EMPTY_STREAK_INFO.weekActivity,
        last30DaysActivity: Array.isArray(data.last_30_days)
          ? data.last_30_days
          : EMPTY_STREAK_INFO.last30DaysActivity,
      };
    }
  } catch (err) {
    console.warn('[StreakService] RPC call failed, using client fallback:', err);
  }

  // Client-Side Fallback: Query exam_results + live_exam_attempts
  try {
    const todayStr = toBangladeshDateStr(new Date());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 35);

    const [examResultsRes, liveAttemptsRes] = await Promise.all([
      supabase
        .from('exam_results')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('live_exam_attempts')
        .select('submit_time, created_at')
        .eq('user_id', userId)
        .eq('status', 'submitted')
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    const activeDates = new Set<string>();
    const dateCounts: Record<string, number> = {};

    (examResultsRes.data || []).forEach((row: { created_at?: string }) => {
      if (row.created_at) {
        const dStr = toBangladeshDateStr(new Date(row.created_at));
        activeDates.add(dStr);
        dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
      }
    });

    (liveAttemptsRes.data || []).forEach((row: { submit_time?: string; created_at?: string }) => {
      const timeStr = row.submit_time || row.created_at;
      if (timeStr) {
        const dStr = toBangladeshDateStr(new Date(timeStr));
        activeDates.add(dStr);
        dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;
      }
    });

    const { currentStreak, hasCompletedToday } = computeStreakFromDates(
      activeDates,
      todayStr,
    );

    // Build week activity (Sunday = 0 to Saturday = 6)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekActivity = Array(7).fill(false);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = toBangladeshDateStr(d);
      weekActivity[i] = activeDates.has(dStr);
    }

    // Build 30 days activity (29 days ago to today)
    const last30DaysActivity = Array(30).fill(0);
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dStr = toBangladeshDateStr(d);
      last30DaysActivity[i] = dateCounts[dStr] || 0;
    }

    return {
      currentStreak,
      hasCompletedToday,
      lastActiveDate: activeDates.size > 0 ? Array.from(activeDates).sort().reverse()[0] : null,
      weekActivity,
      last30DaysActivity,
    };
  } catch (fallbackErr) {
    console.error('[StreakService] Fallback calculation failed:', fallbackErr);
    return EMPTY_STREAK_INFO;
  }
};

/**
 * Backward compatibility helper for existing synchronous UI components.
 */
export const getDisplayStreak = (user: UserProfile): number => {
  return Number(user.streakCount || user.streak || 0);
};

/**
 * Legacy hook for exam submit celebration check.
 */
export const checkAndUpdateStreak = async (
  user: UserProfile,
): Promise<UserProfile | null> => {
  if (!user?.id) return null;
  const streakInfo = await fetchUserStreakInfo(user.id);
  return {
    ...user,
    streakCount: streakInfo.currentStreak,
  };
};
