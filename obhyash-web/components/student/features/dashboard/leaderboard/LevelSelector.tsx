import React from 'react';
import { LEVELS, LevelType } from './leaderboardData';
import { UserProfile } from 'lib/types';

interface LevelSelectorProps {
  selectedLevel: LevelType;
  setSelectedLevel: (level: LevelType) => void;
  currentUser: UserProfile | undefined;
  levelCounts: Record<string, number>;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  setSelectedLevel,
  currentUser,
  levelCounts,
}) => {
  return (
    <div className="mb-5 overflow-x-auto -mx-2 px-2 scrollbar-hide">
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-1 min-w-max md:min-w-0">
        {LEVELS.map((level) => {
          const isSelected  = selectedLevel === level.id;
          const isUserLevel = currentUser?.level === level.id;
          const bnName      = level.label.split('(')[0].trim();
          const count       = levelCounts[level.id] ?? 0;

          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={[
                'relative flex-1 flex flex-col items-center gap-0.5 py-2.5 px-3 md:px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                isSelected
                  ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
              ].join(' ')}
            >
              {/* "You" dot indicator */}
              {isUserLevel && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}

              {/* Level name */}
              <span className="text-[13px] font-black leading-tight">{bnName}</span>

              {/* User count */}
              <span
                className={[
                  'text-[10px] font-semibold leading-none transition-colors',
                  isSelected
                    ? 'text-neutral-500 dark:text-neutral-400'
                    : 'text-neutral-400 dark:text-neutral-600',
                ].join(' ')}
              >
                {count.toLocaleString()} জন
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
