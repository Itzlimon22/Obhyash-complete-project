import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UserProfile } from 'lib/types';
import { LevelType, LEVELS } from './leaderboardData';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

const PAGE_SIZE = 20;

interface LeaderboardTableProps {
  users: UserProfile[];
  selectedLevel: LevelType;
  onUserClick?: (user: UserProfile) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  title?: string;
  totalCount?: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  users,
  selectedLevel,
  onUserClick,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  title,
  totalCount,
}) => {
  // Sentinel element watched by IntersectionObserver to trigger next page load
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const getRankStyle = (idx: number) => {
    if (idx === 0) return 'text-yellow-500';
    if (idx === 1) return 'text-neutral-400';
    if (idx === 2) return 'text-amber-700';
    return 'text-neutral-500 dark:text-neutral-400';
  };

  const getRankIcon = (idx: number) => {
    if (idx === 0) return <span className="text-xl md:text-2xl">🥇</span>;
    if (idx === 1) return <span className="text-xl md:text-2xl">🥈</span>;
    if (idx === 2) return <span className="text-xl md:text-2xl">🥉</span>;
    return (
      <span className="font-bold text-sm md:text-base w-6 md:w-8 text-center inline-block">
        {idx + 1}
      </span>
    );
  };

  const displayTitle =
    title ?? `${LEVELS.find((l) => l.id === selectedLevel)?.label.split(' ')[0] ?? ''} র‍্যাঙ্কিং`;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex justify-between items-center gap-2 flex-wrap">
        <h3 className="font-bold text-base md:text-lg text-neutral-700 dark:text-neutral-200">
          {displayTitle}
        </h3>
        {(totalCount ?? users.length) > 0 && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
            {users.length} জন{hasMore ? '+' : ' মোট'}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] md:text-sm uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400 text-center w-10 md:w-16">#</th>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400">শিক্ষার্থী</th>
              <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-neutral-500 dark:text-neutral-400 text-right whitespace-nowrap">মোট XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm md:text-base">
            {isLoading ? (
              // Initial skeleton
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
              users.map((user, idx) => {
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
                    <td className="px-3 py-3.5 md:px-6 md:py-4 text-center">
                      <div className={`flex items-center justify-center mx-auto ${getRankStyle(idx)}`}>
                        {getRankIcon(idx)}
                      </div>
                    </td>
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

      {/* Infinite scroll sentinel + loading indicator */}
      <div ref={sentinelRef} className="py-1" />
      {isLoadingMore && (
        <div className="flex justify-center py-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            আরো লোড হচ্ছে…
          </div>
        </div>
      )}
      {!hasMore && !isLoading && users.length > 0 && (
        <div className="py-3 text-center border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[11px] text-neutral-300 dark:text-neutral-700 font-medium">— সব শিক্ষার্থী দেখানো হয়েছে —</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
