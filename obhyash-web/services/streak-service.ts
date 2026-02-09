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
    } else if (diffDays === 1) {
      // Consecutive day!
      const xpGained = 20;
      const newXp = (user.xp || 0) + xpGained;
      const updatedUser: UserProfile = {
        ...user,
        streakCount: (user.streakCount || 0) + 1,
        lastStreakDate: now.toISOString(),
        xp: newXp,
        level: calculateLevel(newXp),
      };
      await updateUserProfile(updatedUser);
      return updatedUser;
    } else {
      // Missed a day
      const updatedUser: UserProfile = {
        ...user,
        streakCount: 1,
        lastStreakDate: now.toISOString(),
      };
      await updateUserProfile(updatedUser);
      return updatedUser;
    }
  } else {
    // First time streak tracking
    const xpGained = 20;
    const newXp = (user.xp || 0) + xpGained;
    const updatedUser: UserProfile = {
      ...user,
      streakCount: 1,
      lastStreakDate: now.toISOString(),
      xp: newXp,
      level: calculateLevel(newXp),
    };
    await updateUserProfile(updatedUser);
    return updatedUser;
  }
};
