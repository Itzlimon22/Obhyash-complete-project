import React from 'react';
import { UserProfile } from 'lib/types';
import { LevelType, LEVELS } from './leaderboardData';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

interface LeaderboardTableProps {
  users: UserProfile[];
  selectedLevel: LevelType;
  onUserClick?: (user: UserProfile) => void;
  isLoading?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  users,
  selectedLevel,
  onUserClick,
  isLoading = false,
}) => {
  const getRankStyle = (index: number) => {
    if (index === 0) return 'text-red-500';
    if (index === 1) return 'text-neutral-400';
    if (index === 2) return 'text-red-700';
    return 'text-neutral-500 dark:text-neutral-400';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <span className="text-xl md:text-2xl">🥇</span>;
    if (index === 1) return <span className="text-xl md:text-2xl">🥈</span>;
    if (index === 2) return <span className="text-xl md:text-2xl">🥉</span>;
    return (
      <span className="font-bold text-sm md:text-lg w-6 md:w-8 text-center">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="p-4 md:p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex justify-between items-center">
        <h3 className="font-bold text-base md:text-lg text-neutral-700 dark:text-neutral-200">
          {LEVELS.find((l) => l.id === selectedLevel)?.label.split(' ')[0]}{' '}
          র‍্যাঙ্কিং
        </h3>
      </div>

      <div className="w-full">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] md:text-sm uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 md:px-6 md:py-5 font-bold text-neutral-600 dark:text-neutral-400 text-center w-10 md:w-16">
                Rank
              </th>
              <th className="px-3 py-3 md:px-6 md:py-5 font-bold text-neutral-600 dark:text-neutral-400">
                Student
              </th>
              <th className="px-3 py-3 md:px-6 md:py-5 font-bold text-neutral-600 dark:text-neutral-400 text-right whitespace-nowrap">
                Total XP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm md:text-base">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-4 md:px-6 text-center">
                    <div className="h-6 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto"></div>
                  </td>
                  <td className="px-3 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 md:px-6 text-right">
                    <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-neutral-500 text-sm flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 text-neutral-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </div>
                  <p>এই লেভেলে এখনও কোনো শিক্ষার্থী নেই।</p>
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const isMe = user.isCurrentUser;

                return (
                  <tr
                    key={user.id}
                    className={`
                                        transition-colors group
                                        ${isMe ? 'bg-red-50/60 dark:bg-red-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'}
                                    `}
                  >
                    <td className="px-3 py-3 md:px-6 md:py-5 text-center">
                      <div
                        className={`flex items-center justify-center mx-auto ${getRankStyle(idx)}`}
                      >
                        {getRankIcon(idx)}
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-5 max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                      <div
                        className={`flex items-center gap-2 md:gap-4 ${onUserClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onUserClick && onUserClick(user)}
                      >
                        <UserAvatar
                          user={user}
                          size="lg"
                          className={`ring-2 ${isMe ? 'ring-red-200 dark:ring-red-800' : 'ring-transparent'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-bold text-sm md:text-lg truncate ${isMe ? 'text-red-700 dark:text-red-300' : 'text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors'}`}
                          >
                            {user.name}
                            {isMe && (
                              <span className="ml-2 text-[8px] md:text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-full font-bold uppercase tracking-wide align-middle">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
                            {user.institute}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-5 text-right whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm md:text-xl">
                        {user.xp.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
