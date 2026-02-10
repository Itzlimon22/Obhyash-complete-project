import { UserProfile } from '@/lib/types';
import { updateUserProfile } from './user-service';
import { calculateLevel } from '@/lib/utils';

/**
 * Checks and updates the user's daily streak.
 * Logic:
 * - If last active was today: do nothing.
 * - If last active was yesterday: increment streak.
 * - If last active was before yesterday: reset streak to 1.
 *
 * @param user The current user profile
 * @returns The updated user profile if a change occurred, otherwise null
 */
export const checkAndUpdateStreak = async (
  user: UserProfile,
): Promise<UserProfile | null> => {
  if (!user.id) return null;

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const lastStreakDate = user.lastStreakDate
    ? new Date(user.lastStreakDate)
    : null;

  if (lastStreakDate) {
    const lastDate = new Date(
      lastStreakDate.getFullYear(),
      lastStreakDate.getMonth(),
      lastStreakDate.getDate(),
    ).getTime();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already active today
      return null;
    } else {
      // Login day (diffDays >= 1)
      const xpGained = 20;
      const newXp = (user.xp || 0) + xpGained;
      const updatedUser: UserProfile = {
        ...user,
        streakCount: diffDays === 1 ? (user.streakCount || 0) + 1 : 1,
        lastStreakDate: now.toISOString(),
        xp: newXp,
        level: calculateLevel(newXp),
      };
      await updateUserProfile(updatedUser);

      // ✅ Add Notification
      try {
        const { createNotification } = await import('./notification-service');
        await createNotification(
          user.id,
          'প্রতিদিনের বোনাস!',
          `আজকের লগইন এর জন্য আপনি +${xpGained} XP অর্জন করেছেন।`,
          'system',
          { icon: '🌟' },
        );
      } catch (e) {
        console.error('Failed to create notification:', e);
      }

      return updatedUser;
    }
  } else {
    // First time streak tracking: Calculate backlog since signup
    const joinedDate = user.createdAt ? new Date(user.createdAt) : now;
    const joinedDay = new Date(
      joinedDate.getFullYear(),
      joinedDate.getMonth(),
      joinedDate.getDate(),
    ).getTime();

    // Days since joining (inclusive)
    const totalDaysSinceSignup = Math.max(
      1,
      Math.floor((today - joinedDay) / (1000 * 60 * 60 * 24)) + 1,
    );
    const xpGained = totalDaysSinceSignup * 20;

    const newXp = (user.xp || 0) + xpGained;
    const updatedUser: UserProfile = {
      ...user,
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
        user.id,
        'লগইন বোনাস!',
        `আপনি প্ল্যাটফর্মে যোগদানের জন্য +${xpGained} XP অর্জন করেছেন।`,
        'system',
        { icon: '🔥' },
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return updatedUser;
  }
};
