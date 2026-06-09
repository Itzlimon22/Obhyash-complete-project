import React from 'react';
import { LEVELS, LevelType } from './leaderboardData';
import { UserProfile } from 'lib/types';

interface LevelSelectorProps {
  selectedLevel: LevelType;
  setSelectedLevel: (level: LevelType) => void;
  currentUser: UserProfile | undefined;
  levelCounts: Record<string, number>;
}

/** Format XP numbers compactly: 800 → "800", 1999 → "2K", 5000 → "5K" */
function formatXP(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function xpRangeLabel(minXP: number, maxXP?: number): string {
  if (maxXP === undefined || maxXP >= 100000) return `${formatXP(minXP)}+ XP`;
  return `${formatXP(minXP)}–${formatXP(maxXP)} XP`;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  setSelectedLevel,
  currentUser,
  levelCounts,
}) => {
  return (
    <div className="mb-5 overflow-x-auto -mx-2 px-2 scrollbar-hide">
      <div className="flex items-end gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-1 min-w-max md:min-w-0">
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
                'relative flex flex-col items-center gap-0.5 rounded-xl font-bold transition-all duration-200 whitespace-nowrap',
                isSelected
                  // Selected: larger, elevated, full padding
                  ? 'flex-[1.35] py-3.5 px-3 md:px-5 bg-white dark:bg-neutral-800 shadow-md text-neutral-900 dark:text-white scale-[1.04] z-10'
                  // Others: compact, faded
                  : 'flex-1 py-2.5 px-2 md:px-3 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300',
              ].join(' ')}
            >
              {/* "You are here" dot */}
              {isUserLevel && (
                <span className={[
                  'absolute rounded-full bg-emerald-500',
                  isSelected ? 'top-2 right-2 w-2 h-2' : 'top-1.5 right-1.5 w-1.5 h-1.5',
                ].join(' ')} />
              )}

              {/* Level name */}
              <span className={[
                'font-black leading-tight transition-all',
                isSelected ? 'text-[15px]' : 'text-[12px]',
              ].join(' ')}>
                {bnName}
              </span>

              {/* Student count */}
              <span className={[
                'font-semibold leading-none transition-all',
                isSelected
                  ? 'text-[11px] text-neutral-500 dark:text-neutral-400'
                  : 'text-[10px] text-neutral-400 dark:text-neutral-600',
              ].join(' ')}>
                {count > 0 ? `${count.toLocaleString()} জন` : '—'}
              </span>

              {/* XP range — highlighted on selected */}
              <span className={[
                'font-medium leading-none mt-0.5 transition-all',
                isSelected
                  ? 'text-[10px] text-emerald-600 dark:text-emerald-400'
                  : 'text-[9px] text-neutral-300 dark:text-neutral-700',
              ].join(' ')}>
                {xpRangeLabel(level.minXP, level.maxXP)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
