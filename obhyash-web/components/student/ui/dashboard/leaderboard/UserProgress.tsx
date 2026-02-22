import React from 'react';
import { UserProfile } from '@/lib/types';
import { LEVELS } from './leaderboardData';

interface UserProgressProps {
  currentUser: UserProfile;
  userRankInOwnLevel: number;
}

const UserProgress: React.FC<UserProgressProps> = ({
  currentUser,
  userRankInOwnLevel,
}) => {
  const currentUserLevelInfo = LEVELS.find((l) => l.id === currentUser.level);

  // Calculate next level requirements
  const nextLevelIndex = currentUserLevelInfo
    ? LEVELS.findIndex((l) => l.id === currentUserLevelInfo.id) - 1
    : -1;
  const nextLevel = nextLevelIndex >= 0 ? LEVELS[nextLevelIndex] : null;

  const xpNeeded =
    nextLevel && currentUser ? nextLevel.minXP - currentUser.xp : 0;
  const progressPercent =
    nextLevel && currentUser && currentUserLevelInfo
      ? ((currentUser.xp - currentUserLevelInfo.minXP) /
          (nextLevel.minXP - currentUserLevelInfo.minXP)) *
        100
      : 100;

  return (
    <div className="mb-6 md:mb-8 bg-white dark:bg-neutral-900 rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
          <div className="flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-800 shrink-0">
            <span className="text-[9px] md:text-[10px] uppercase opacity-70">
              Rank
            </span>
            <span className="text-lg md:text-xl">#{userRankInOwnLevel}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm md:text-lg">
              আপনি বর্তমানে{' '}
              <span className="text-emerald-600 dark:text-emerald-400">
                {currentUserLevelInfo?.label.split(' ')[0]}
              </span>{' '}
              লেভেলে আছেন
            </h3>
            {nextLevel ? (
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
                পরবর্তী লেভেলে যেতে আর{' '}
                <span className="font-bold text-red-500">{xpNeeded} XP</span>{' '}
                প্রয়োজন
              </p>
            ) : (
              <p className="text-xs md:text-sm text-emerald-500 font-bold">
                অভিনন্দন! আপনি সর্বোচ্চ লেভেলে পৌঁছেছেন!
              </p>
            )}
          </div>
        </div>

        <div className="w-full sm:w-1/3 flex flex-col items-end gap-1">
          <span className="text-xl md:text-2xl font-mono font-bold text-neutral-900 dark:text-white">
            {currentUser.xp.toLocaleString()}{' '}
            <span className="text-xs md:text-sm font-sans font-medium text-neutral-400">
              XP
            </span>
          </span>
          {nextLevel && (
            <div className="w-full h-2 md:h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProgress;
