import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { UserProfile } from 'lib/types';
import { LEVELS, LevelType } from './leaderboard/leaderboardData';
import LevelSelector from './leaderboard/LevelSelector';
import LeaderboardTable from './leaderboard/LeaderboardTable';
import {
  getLeaderboardUsers,
  getLevelUserCounts,
  getUserProfile,
  getInstituteLeaderboardUsers,
  getInstituteRankings,
  InstituteRankEntry,
} from 'services/database';

import { useAuth } from '@/components/auth/AuthProvider';
import { LeaderboardSkeleton } from '@/components/student/ui/common/Skeletons';

interface LeaderboardViewProps {
  onUserClick?: (user: UserProfile, rank: number) => void;
}

const INSTITUTE_PAGE_SIZE = 15;

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onUserClick }) => {
  const { loading: authLoading, user: authUser } = useAuth();

  const [selectedLevel, setSelectedLevel] = useState<LevelType | null>(null);
  const [viewMode, setViewMode] = usePersistedState<'level' | 'college' | 'rankings'>('lb_view_mode', 'level');
  // Track which college is being viewed in college mode (defaults to own college)
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);

  // ── SWR: current user profile (cached in localStorage) ──────────────────────
  const { data: currentUser } = useSWR(
    authLoading || !authUser ? null : `profile:${authUser.id}`,
    () => getUserProfile('me'),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  // Effective college: user's selection or fall back to own college
  const effectiveCollege = selectedCollege ?? currentUser?.institute ?? null;

  // Set selectedCollege to own college when user data first loads (only if not already set)
  useEffect(() => {
    if (currentUser?.institute && !selectedCollege) {
      setSelectedCollege(currentUser.institute);
    }
  }, [currentUser?.institute]);

  // Set selectedLevel once we know the user's level
  const resolvedLevel: LevelType = useMemo(() => {
    if (selectedLevel) return selectedLevel;
    const ul = currentUser?.level as LevelType | undefined;
    return ul && LEVELS.some((l) => l.id === ul) ? ul : 'Rookie';
  }, [currentUser, selectedLevel]);

  // ── SWR: level user counts (cached) ─────────────────────────────────────────
  const { data: levelCounts = {} } = useSWR(
    authLoading ? null : 'leaderboard:levelCounts',
    getLevelUserCounts,
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  );

  // ── SWR: leaderboard users for selected level (cached per level) ─────────────
  const { data: leaderboardUsers = [], isLoading } = useSWR(
    authLoading ? null : `leaderboard:level:${resolvedLevel}`,
    () => getLeaderboardUsers(resolvedLevel),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  // ── SWR: all colleges list — used both for filter dropdown AND rankings tab ──
  // Fetch whenever college mode OR rankings mode is active
  const { data: allColleges = [] } = useSWR(
    viewMode === 'college' || viewMode === 'rankings' ? 'leaderboard:instituteRankings' : null,
    getInstituteRankings,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );

  // ── SWR: students for the selected college (cached per college name) ─────────
  const { data: collegeUsers = [], isLoading: isLoadingCollege } = useSWR(
    viewMode === 'college' && effectiveCollege
      ? `leaderboard:college:${effectiveCollege}`
      : null,
    () => getInstituteLeaderboardUsers(effectiveCollege!),
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  );

  // ── SWR: institute rankings (fetched only in rankings mode) ─────────────────
  const instituteRankings = viewMode === 'rankings' ? allColleges : [];
  const isLoadingRankings = viewMode === 'rankings' && allColleges.length === 0;

  const userRankInOwnLevel = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.level === resolvedLevel) {
      const idx = leaderboardUsers.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) return idx + 1;
    }
    return 0;
  }, [currentUser, leaderboardUsers, resolvedLevel]);

  if (isLoading && !leaderboardUsers.length && viewMode === 'level') {
    return <LeaderboardSkeleton />;
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
      active
        ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-700 dark:text-emerald-400'
        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
    }`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-2 py-4 md:p-6 animate-fade-in transition-colors pb-24">
      <div className="max-w-7xl mx-auto">
        {/* View mode tabs */}
        <div className="flex gap-1 mb-5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-1">
          <button onClick={() => setViewMode('level')} className={tabClass(viewMode === 'level')}>
            লেভেল র‍্যাংকিং
          </button>
          <button onClick={() => setViewMode('college')} className={tabClass(viewMode === 'college')}>
            কলেজ র‍্যাংকিং
          </button>
          <button onClick={() => setViewMode('rankings')} className={tabClass(viewMode === 'rankings')}>
            কলেজ প্রতিযোগিতা
          </button>
        </div>

        {viewMode === 'rankings' ? (
          <InstituteRankingsView
            key={instituteRankings.length}
            rankings={instituteRankings}
            isLoading={isLoadingRankings}
            myInstitute={currentUser?.institute}
          />
        ) : viewMode === 'level' ? (
          <>
            <LevelSelector
              selectedLevel={resolvedLevel}
              setSelectedLevel={setSelectedLevel}
              currentUser={currentUser ?? undefined}
              levelCounts={levelCounts}
            />

            <LeaderboardTable
              users={leaderboardUsers}
              selectedLevel={resolvedLevel}
              onUserClick={(user) => {
                const rank = leaderboardUsers.findIndex((u) => u.id === user.id) + 1;
                onUserClick?.(user, rank);
              }}
              isLoading={isLoading}
            />
          </>
        ) : (
          /* College mode */
          <>
            {currentUser?.institute || effectiveCollege ? (
              <>
                {/* ── Header row: own college (left) + filter dropdown (right) ── */}
                <div className="mb-4 flex items-center gap-3">
                  {/* Left: own college badge */}
                  <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-lg flex-shrink-0">🏫</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wide leading-none mb-0.5">
                        তোমার কলেজ
                      </p>
                      <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                        {currentUser?.institute || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Right: college filter dropdown */}
                  <div className="flex-shrink-0">
                    <select
                      value={effectiveCollege ?? ''}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="text-sm font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl px-3 py-2.5 pr-8 appearance-none cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all max-w-[160px] truncate"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                    >
                      {allColleges.length === 0 && (
                        <option value="" disabled>লোড হচ্ছে…</option>
                      )}
                      {allColleges.map((c) => (
                        <option key={c.institute} value={c.institute}>
                          {c.institute} ({c.studentCount})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <LeaderboardTable
                  users={collegeUsers}
                  selectedLevel={resolvedLevel}
                  title={`${effectiveCollege ?? 'কলেজ'} র‍্যাংকিং`}
                  onUserClick={(user) => {
                    const rank = collegeUsers.findIndex((u) => u.id === user.id) + 1;
                    onUserClick?.(user, rank);
                  }}
                  isLoading={isLoadingCollege}
                />
                {!isLoadingCollege && collegeUsers.length === 0 && (
                  <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
                    <p className="text-3xl mb-3">🏫</p>
                    <p className="font-bold text-sm">এই কলেজ থেকে এখনো কেউ যোগ দেয়নি</p>
                    <p className="text-xs mt-1">অন্য কলেজ বেছে নাও</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
                <p className="text-3xl mb-3">🏫</p>
                <p className="font-bold text-sm">তোমার প্রোফাইলে কলেজের নাম যোগ করো</p>
                <p className="text-xs mt-1">সেটিংস থেকে শিক্ষা প্রতিষ্ঠান আপডেট করো</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Pagination Controls (shared) ────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  showingFrom: number;
  showingTo: number;
  total: number;
  unit?: string;
}

function Pagination({ page, totalPages, onPageChange, showingFrom, showingTo, total, unit = 'জন' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const btnBase =
    'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all';

  return (
    <div className="px-4 md:px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
        দেখাচ্ছে{' '}
        <span className="text-neutral-700 dark:text-neutral-300 font-bold">
          {showingFrom}–{showingTo}
        </span>{' '}
        / {total} {unit}
      </p>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className={btnBase}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          আগে
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isVisible = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
            const isEllipsisBefore = p === 2 && page > 3;
            const isEllipsisAfter = p === totalPages - 1 && page < totalPages - 2;
            if (!isVisible) return null;
            if (isEllipsisBefore || isEllipsisAfter) {
              return <span key={p} className="text-xs text-neutral-400 dark:text-neutral-600 px-1 select-none">···</span>;
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
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

        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={btnBase}>
          পরে
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Institute Rankings View ─────────────────────────────────────────────────
interface InstituteRankingsViewProps {
  rankings: InstituteRankEntry[];
  isLoading: boolean;
  myInstitute?: string;
}

function InstituteRankingsView({ rankings, isLoading, myInstitute }: InstituteRankingsViewProps) {
  const [page, setPage] = useState(1);

  // page resets automatically via the `key` prop on the parent — no useEffect needed

  const totalPages = Math.ceil(rankings.length / INSTITUTE_PAGE_SIZE);
  const globalOffset = (page - 1) * INSTITUTE_PAGE_SIZE;
  const pageRankings = rankings.slice(globalOffset, globalOffset + INSTITUTE_PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400 dark:text-neutral-600">
        <p className="text-4xl mb-3">🏆</p>
        <p className="font-bold text-sm">এখনো যথেষ্ট ডেটা নেই</p>
        <p className="text-xs mt-1">প্রতিটি কলেজ থেকে কমপক্ষে ৫ জন শিক্ষার্থী লাগবে</p>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 md:px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-base text-neutral-700 dark:text-neutral-200">কলেজ প্রতিযোগিতা</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600 mt-0.5">
            শীর্ষ ৫ শিক্ষার্থীর গড় XP অনুযায়ী র‍্যাংকিং
          </p>
        </div>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
          {rankings.length} টি কলেজ
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {pageRankings.map((entry, localIdx) => {
          const rank = globalOffset + localIdx + 1;
          const isMe = myInstitute && entry.institute === myInstitute;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

          return (
            <div
              key={entry.institute}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isMe ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
              }`}
            >
              <div className="w-8 text-center flex-shrink-0">
                {medal ? (
                  <span className="text-xl">{medal}</span>
                ) : (
                  <span className="text-sm font-black text-neutral-400 dark:text-neutral-600">{rank}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isMe ? 'text-emerald-800 dark:text-emerald-300' : 'text-neutral-800 dark:text-neutral-200'}`}>
                  {entry.institute}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full">
                      তোমার কলেজ
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">{entry.studentCount} জন শিক্ষার্থী</p>
              </div>

              <div className={`text-right flex-shrink-0 px-2.5 py-1.5 rounded-xl ${isMe ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                <p className={`text-xs font-black ${isMe ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
                  {entry.avgXp.toLocaleString()} XP
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-600">গড় স্কোর</p>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showingFrom={globalOffset + 1}
        showingTo={Math.min(globalOffset + INSTITUTE_PAGE_SIZE, rankings.length)}
        total={rankings.length}
        unit="টি কলেজ"
      />
    </div>
  );
}

export default LeaderboardView;
