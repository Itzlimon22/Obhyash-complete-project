import React from 'react';
import { LEVELS, LevelType } from './leaderboardData';
import { UserProfile } from 'lib/types';

interface LevelSelectorProps {
  selectedLevel: LevelType;
  setSelectedLevel: (level: LevelType) => void;
  currentUser: UserProfile | undefined;
  levelCounts: Record<string, number>;
}

/** Per-level design tokens — accent colour used for the left stripe & active ring */
const LEVEL_ACCENT: Record<LevelType, { stripe: string; ring: string; text: string; badge: string }> = {
  Legend: {
    stripe: 'bg-red-700',
    ring:   'ring-red-700/30 dark:ring-red-600/30',
    text:   'text-red-700 dark:text-red-400',
    badge:  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  Titan: {
    stripe: 'bg-orange-500',
    ring:   'ring-orange-500/30 dark:ring-orange-400/30',
    text:   'text-orange-600 dark:text-orange-400',
    badge:  'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  Warrior: {
    stripe: 'bg-red-500',
    ring:   'ring-red-500/30 dark:ring-red-400/30',
    text:   'text-red-600 dark:text-red-400',
    badge:  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  Scout: {
    stripe: 'bg-emerald-500',
    ring:   'ring-emerald-500/30 dark:ring-emerald-400/30',
    text:   'text-emerald-600 dark:text-emerald-400',
    badge:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  Rookie: {
    stripe: 'bg-slate-400',
    ring:   'ring-slate-400/30 dark:ring-slate-500/30',
    text:   'text-slate-500 dark:text-slate-400',
    badge:  'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400',
  },
};

function formatXP(xp: number): string {
  return xp >= 1000 ? `${(xp / 1000).toFixed(xp % 1000 === 0 ? 0 : 1)}k` : `${xp}`;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  setSelectedLevel,
  currentUser,
  levelCounts,
}) => {
  return (
    <div className="mb-6 overflow-x-auto -mx-2 px-2 pb-1 scrollbar-hide">
      <div className="flex gap-2.5 min-w-max md:min-w-0 md:grid md:grid-cols-5">
        {LEVELS.map((level) => {
          const isSelected   = selectedLevel === level.id;
          const isUserLevel  = currentUser?.level === level.id;
          const accent       = LEVEL_ACCENT[level.id];
          const count        = levelCounts[level.id] ?? 0;
          const [bnName, enName] = level.label.split('(');

          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={[
                'relative flex items-stretch rounded-xl border transition-all duration-200 text-left overflow-hidden',
                'bg-white dark:bg-neutral-900',
                isSelected
                  ? `border-neutral-200 dark:border-neutral-700 shadow-md ring-2 ${accent.ring}`
                  : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-sm opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              {/* Left accent stripe */}
              <span className={`w-1 shrink-0 rounded-l-xl ${accent.stripe}`} />

              {/* Card body */}
              <span className="flex flex-col gap-1 px-3 py-3 min-w-[110px] flex-1">
                {/* Level name */}
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-black tracking-tight leading-none ${
                      isSelected ? accent.text : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {bnName?.trim()}
                  </span>

                  {/* "You" pill */}
                  {isUserLevel && (
                    <span className="shrink-0 text-[9px] font-black uppercase tracking-wider bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                      You
                    </span>
                  )}
                </span>

                {/* English name */}
                <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-600 leading-none">
                  {enName?.replace(')', '').trim()}
                </span>

                {/* XP range + user count */}
                <span className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${accent.badge}`}>
                    {formatXP(level.minXP)}
                    {level.maxXP && level.maxXP < 100000 ? `–${formatXP(level.maxXP)}` : '+'} XP
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 leading-none">
                    {count.toLocaleString()} জন
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
