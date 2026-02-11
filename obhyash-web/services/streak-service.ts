import { UserProfile } from '@/lib/types';
import { updateUserProfile, getUserProfile } from './user-service';
import { calculateLevel } from '@/lib/utils';

/**
 * Returns "YYYY-MM-DD" string from a Date using LOCAL timezone.
 * Bangladesh (UTC+6) has no DST, so local time is safe for day comparison.
 */
const toLocalDateStr = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Returns the number of calendar days between two dates using LOCAL timezone.
 * Anchors both dates to local midnight to avoid time-of-day interference.
 */
const daysDiff = (from: Date, to: Date): number => {
  const fromMidnight = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round(
    (toMidnight.getTime() - fromMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );
};

/**
 * Computes what streak count the UI should DISPLAY right now,
 * without modifying the database. Call this for instant header display.
 *
 * - If lastStreakDate is today or yesterday → streak is alive, return streakCount.
 * - If lastStreakDate is older → streak is broken, return 0.
 * - If no data → return 0.
 */
export const getDisplayStreak = (user: UserProfile): number => {
  if (!user.lastStreakDate || !user.streakCount) return 0;

  const last = new Date(user.lastStreakDate);
  const now = new Date();
  const diff = daysDiff(last, now);

  // Streak is still valid if last activity was today (0) or yesterday (1)
  if (diff <= 1) return user.streakCount;

  // Missed more than 1 day → streak is broken
  return 0;
};

/**
 * Checks and updates the user's daily streak.
 *
 * IMPORTANT: Fetches fresh user data from DB to avoid stale lastStreakDate.
 *
 * Logic:
 * - If last active was today (same local calendar day): do nothing (return null).
 * - If last active was yesterday: increment streak.
 * - If last active was before yesterday: reset streak to 1.
 *
 * @param user The current user profile (used for id and as fallback)
 * @returns The updated user profile if a change occurred, otherwise null
 */
export const checkAndUpdateStreak = async (
  user: UserProfile,
): Promise<UserProfile | null> => {
  if (!user.id) return null;

  // Fetch FRESH user data from DB to prevent stale lastStreakDate
  let freshUser: UserProfile;
  try {
    const dbUser = await getUserProfile(user.id);
    freshUser = dbUser || user;
  } catch {
    freshUser = user;
  }

  const now = new Date();
  const todayStr = toLocalDateStr(now);

  const lastStreakDate = freshUser.lastStreakDate
    ? new Date(freshUser.lastStreakDate)
    : null;

  if (lastStreakDate) {
    const lastDateStr = toLocalDateStr(lastStreakDate);

    if (lastDateStr === todayStr) {
      // Already active today — no XP, no celebration
      return null;
    }

    // New day login
    const diff = daysDiff(lastStreakDate, now);
    const xpGained = 20;
    const newXp = (freshUser.xp || 0) + xpGained;

    // If consecutive day (diff === 1), increment. Otherwise reset to 1.
    const newStreak = diff === 1 ? (freshUser.streakCount || 0) + 1 : 1;

    const updatedUser: UserProfile = {
      ...freshUser,
      streakCount: newStreak,
      lastStreakDate: now.toISOString(),
      xp: newXp,
      level: calculateLevel(newXp),
    };
    const result = await updateUserProfile(updatedUser);
    if (!result.success) {
      console.error('Streak update failed to save to DB:', result.error);
      return null; // Don't celebrate or show XP if DB write failed
    }

    // Add Notification
    try {
      const { createNotification } = await import('./notification-service');
      const message =
        diff === 1
          ? `আজকের লগইন এর জন্য আপনি +${xpGained} XP অর্জন করেছেন।`
          : `ফিরে আসার জন্য +${xpGained} XP! প্রতিদিন লগইন করে স্ট্রিক বজায় রাখুন।`;

      await createNotification(
        freshUser.id,
        'প্রতিদিনের বোনাস!',
        message,
        'system',
        { icon: '🌟' },
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return updatedUser;
  } else {
    // First time streak tracking OR no previous streak data
    const xpGained = 20;

    const newXp = (freshUser.xp || 0) + xpGained;
    const updatedUser: UserProfile = {
      ...freshUser,
      streakCount: 1,
      lastStreakDate: now.toISOString(),
      xp: newXp,
      level: calculateLevel(newXp),
    };
    const result = await updateUserProfile(updatedUser);
    if (!result.success) {
      console.error('Streak init failed to save to DB:', result.error);
      return null; // Don't celebrate if DB write failed
    }

    // Add Notification
    try {
      const { createNotification } = await import('./notification-service');
      await createNotification(
        freshUser.id,
        'লগইন বোনাস!',
        `আপনি স্ট্রিক শুরু করার জন্য +${xpGained} XP অর্জন করেছেন। চালিয়ে যান!`,
        'system',
        { icon: '🔥' },
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return updatedUser;
  }
};
