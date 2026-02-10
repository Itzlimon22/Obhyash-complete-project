import { UserProfile } from '@/lib/types';
import { updateUserProfile, getUserProfile } from './user-service';
import { calculateLevel } from '@/lib/utils';

/**
 * Checks and updates the user's daily streak.
 *
 * IMPORTANT: This function fetches fresh user data from DB to avoid
 * stale `lastStreakDate` from props/SSR causing duplicate XP awards.
 *
 * Logic:
 * - If last active was today: do nothing (return null).
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

  // ✅ Fetch FRESH user data from DB to prevent stale lastStreakDate
  let freshUser: UserProfile;
  try {
    const dbUser = await getUserProfile(user.id);
    freshUser = dbUser || user;
  } catch {
    // If DB fetch fails, fall back to the passed-in user
    freshUser = user;
  }

  const now = new Date();

  // Use UTC to avoid DST issues when calculating day differences
  const getUtcDate = (date: Date) => {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const today = getUtcDate(now);

  const lastStreakDate = freshUser.lastStreakDate
    ? new Date(freshUser.lastStreakDate)
    : null;

  if (lastStreakDate) {
    const lastDate = getUtcDate(lastStreakDate);

    // Calculate difference in days (independent of time of day)
    const diffMs = today - lastDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already active today — no XP, no celebration
      return null;
    } else {
      // New day login (diffDays >= 1)
      const xpGained = 20;
      const newXp = (freshUser.xp || 0) + xpGained;

      // If missed a day (diffDays > 1), reset to 1. If consecutive (diffDays === 1), increment.
      const newStreak = diffDays === 1 ? (freshUser.streakCount || 0) + 1 : 1;

      const updatedUser: UserProfile = {
        ...freshUser,
        streakCount: newStreak,
        lastStreakDate: now.toISOString(),
        xp: newXp,
        level: calculateLevel(newXp),
      };
      await updateUserProfile(updatedUser);

      // ✅ Add Notification
      try {
        const { createNotification } = await import('./notification-service');
        const message =
          diffDays === 1
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
    }
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
    await updateUserProfile(updatedUser);

    // ✅ Add Notification
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
