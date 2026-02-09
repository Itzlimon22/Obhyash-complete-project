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
  const getIcon = (id: LevelType) => {
    switch (id) {
      case 'Legend':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'Titan':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'Warrior':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
              clipRule="evenodd"
            />
            <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
          </svg>
        );
      case 'Scout':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path
              fillRule="evenodd"
              d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'Rookie':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="mb-6 md:mb-8 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-3 md:gap-4 min-w-max md:justify-center">
        {LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;
          const isUserLevel = currentUser?.level === level.id;

          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`
                            relative flex flex-col items-center p-3 md:p-4 rounded-2xl border-2 transition-all min-w-[105px] md:min-w-[130px] overflow-hidden
                            ${
                              isSelected
                                ? `border-transparent ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-neutral-950 shadow-lg scale-105`
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }
                        `}
            >
              {isUserLevel && (
                <div className="absolute top-2 right-2 w-2 h-2 md:w-2.5 md:h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm"></div>
              )}
              {isSelected && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-10`}
                ></div>
              )}
              <div
                className={`
                            w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 text-white bg-gradient-to-br shadow-sm
                            ${level.color}
                            ${!isSelected ? 'grayscale opacity-60' : ''}
                        `}
              >
                {getIcon(level.id)}
              </div>
              <span
                className={`text-xs md:text-sm font-bold mb-1 ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
              >
                {level.label.split(' ')[0]}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`}
              >
                {levelCounts[level.id] || 0} Students
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
