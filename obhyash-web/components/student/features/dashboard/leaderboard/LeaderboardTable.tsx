import React, { useEffect, useState } from 'react';
import { UserProfile } from 'lib/types';
import { LevelType, LEVELS } from './leaderboardData';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

const PAGE_SIZE = 20;

interface LeaderboardTableProps {
  users: UserProfile[];
  selectedLevel: LevelType;
  onUserClick?: (user: UserProfile) => void;
  isLoading?: boolean;
  /** Override the header title (e.g. for college mode) */
  title?: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  users,
  selectedLevel,
  onUserClick,
  isLoading = false,
  title,
}) => {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the underlying list changes
  useEffect(() => {
    setPage(1);
  }, [users]);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const globalOffset = (page - 1) * PAGE_SIZE; // so rank numbers stay correct across pages

  const getRankStyle = (globalIndex: number) => {
    if (globalIndex === 0) return 'text-yellow-500';
    if (globalIndex === 1) return 'text-neutral-400';
    if (globalIndex === 2) return 'text-amber-700';
    return 'text-neutral-500 dark:text-neutral-400';
  };

  const getRankIcon = (globalIndex: number) => {
    if (globalIndex === 0) return <span className="text-xl md:text-2xl">🥇</span>;
    if (globalIndex === 1) return <span className="text-xl md:text-2xl">🥈</span>;
    if (globalIndex === 2) return <span className="text-xl md:text-2xl">🥉</span>;
    return (
      <span className="font-bold text-sm md:text-base w-6 md:w-8 text-center inline-block">
        {globalIndex + 1}
      </span>
    );
  };

  const displayTitle = title ?? `${LEVELS.find((l) => l.id === selectedLevel)?.label.split(' ')[0] ?? ''} র‍্যাঙ্কিং`;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex justify-between items-center gap-2 flex-wrap">
        <h3 className="font-bold text-base md:text-lg text-neutral-700 dark:text-neutral-200">
          {displayTitle}
        </h3>
        {users.length > 0 && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
            মোট {users.length} জন
          </span>
        )}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] md:text-sm uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400 text-center w-10 md:w-16">
                #
              </th>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400">
                শিক্ষার্থী
              </th>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400 text-right whitespace-nowrap">
                মোট XP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm md:text-base">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-4 md:px-6 text-center">
                    <div className="h-6 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto" />
                  </td>
                  <td className="px-3 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        <div className="h-2.5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 md:px-6 text-right">
                    <div className="h-4 w-14 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-600">
                    <span className="text-4xl">🏆</span>
                    <p className="text-sm font-semibold">এই লেভেলে এখনও কোনো শিক্ষার্থী নেই।</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageUsers.map((user, localIdx) => {
                const globalIdx = globalOffset + localIdx;
                const isMe = user.isCurrentUser;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors group ${
                      isMe
                        ? 'bg-emerald-50/70 dark:bg-emerald-900/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-3 py-3.5 md:px-6 md:py-4 text-center">
                      <div className={`flex items-center justify-center mx-auto ${getRankStyle(globalIdx)}`}>
                        {getRankIcon(globalIdx)}
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-3 py-3.5 md:px-6 md:py-4 max-w-[160px] xs:max-w-[220px] sm:max-w-none">
                      <div
                        className={`flex items-center gap-2 md:gap-3 ${onUserClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onUserClick && onUserClick(user)}
                      >
                        <UserAvatar
                          user={user}
                          size="md"
                          className={`ring-2 shrink-0 ${isMe ? 'ring-emerald-300 dark:ring-emerald-700' : 'ring-transparent group-hover:ring-neutral-200 dark:group-hover:ring-neutral-700'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold text-sm md:text-base truncate flex items-center gap-1.5 ${isMe ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'}`}>
                            <span className="truncate">{user.name}</span>
                            {isMe && (
                              <span className="shrink-0 text-[9px] md:text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full font-black uppercase tracking-wide">
                                তুমি
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] md:text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-medium truncate">
                            {user.institute || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* XP */}
                    <td className="px-3 py-3.5 md:px-6 md:py-4 text-right whitespace-nowrap">
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm md:text-lg">
                        {user.xp.toLocaleString()}
                        <span className="text-[10px] font-bold text-emerald-500/70 dark:text-emerald-600 ml-0.5">XP</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="px-4 md:px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between gap-3 flex-wrap">
          {/* Info */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            দেখাচ্ছে{' '}
            <span className="text-neutral-700 dark:text-neutral-300 font-bold">
              {globalOffset + 1}–{Math.min(globalOffset + PAGE_SIZE, users.length)}
            </span>{' '}
            / {users.length} জন
          </p>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              আগে
            </button>

            {/* Page Pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                // Show: first, last, current, and neighbors
                const isVisible =
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1;
                const isEllipsisBefore = p === 2 && page > 3;
                const isEllipsisAfter = p === totalPages - 1 && page < totalPages - 2;

                if (!isVisible) return null;
                if (isEllipsisBefore || isEllipsisAfter) {
                  return (
                    <span key={p} className="text-xs text-neutral-400 dark:text-neutral-600 px-1 select-none">
                      ···
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[2rem] h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                      p === page
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              পরে
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
