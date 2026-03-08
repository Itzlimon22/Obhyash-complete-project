import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from 'lib/types';
import { LEVELS, LevelType } from './leaderboard/leaderboardData';
import LevelSelector from './leaderboard/LevelSelector';
import UserProgress from './leaderboard/UserProgress';
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

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onUserClick }) => {
  const { loading: authLoading } = useAuth();

  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>(
    undefined,
  );
  const [selectedLevel, setSelectedLevel] = useState<LevelType>('Rookie');
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'level' | 'college' | 'rankings'>(
    'level',
  );
  const [collegeUsers, setCollegeUsers] = useState<UserProfile[]>([]);
  const [isLoadingCollege, setIsLoadingCollege] = useState(false);
  const [instituteRankings, setInstituteRankings] = useState<
    InstituteRankEntry[]
  >([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const initData = async () => {
      const user = await getUserProfile('me');
      if (user) {
        setCurrentUser(user);
      }
      if (user && user.level) {
        const isLevel = LEVELS.some((l) => l.id === user.level);
        if (isLevel) setSelectedLevel(user.level as LevelType);
      }

      const counts = await getLevelUserCounts();
      setLevelCounts(counts);
    };
    initData();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const fetchLevelData = async () => {
      setIsLoading(true);
      const users = await getLeaderboardUsers(selectedLevel);
      setLeaderboardUsers(users);
      setIsLoading(false);
    };

    fetchLevelData();
  }, [selectedLevel, authLoading]);

  useEffect(() => {
    if (viewMode !== 'college' || !currentUser?.institute) return;
    setIsLoadingCollege(true);
    getInstituteLeaderboardUsers(currentUser.institute).then((users) => {
      setCollegeUsers(users);
      setIsLoadingCollege(false);
    });
  }, [viewMode, currentUser?.institute]);

  useEffect(() => {
    if (viewMode !== 'rankings') return;
    if (instituteRankings.length > 0) return; // already loaded
    setIsLoadingRankings(true);
    getInstituteRankings().then((data) => {
      setInstituteRankings(data);
      setIsLoadingRankings(false);
    });
  }, [viewMode]);

  const userRankInOwnLevel = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.level === selectedLevel) {
      const idx = leaderboardUsers.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) return idx + 1;
    }
    return 0;
  }, [currentUser, leaderboardUsers, selectedLevel]);

  if (isLoading && !leaderboardUsers.length && viewMode === 'level') {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-2 py-4 md:p-6 animate-fade-in transition-colors pb-24">
      <div className="max-w-7xl mx-auto">
        {/* View mode tabs */}
        <div className="flex gap-1 mb-5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-1">
          <button
            onClick={() => setViewMode('level')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'level'
                ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-700 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            লেভেল র‍্যাংকিং
          </button>
          <button
            onClick={() => setViewMode('college')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'college'
                ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-700 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            কলেজ র‍্যাংকিং
          </button>
          <button
            onClick={() => setViewMode('rankings')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'rankings'
                ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-700 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            কলেজ প্রতিযোগিতা
          </button>
        </div>

        {viewMode === 'rankings' ? (
          <InstituteRankingsView
            rankings={instituteRankings}
            isLoading={isLoadingRankings}
            myInstitute={currentUser?.institute}
          />
        ) : viewMode === 'level' ? (
          <>
            <LevelSelector
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              currentUser={currentUser}
              levelCounts={levelCounts}
            />
            {currentUser && (
              <UserProgress
                currentUser={currentUser}
                userRankInOwnLevel={userRankInOwnLevel}
              />
            )}
            <LeaderboardTable
              users={leaderboardUsers}
              selectedLevel={selectedLevel}
              onUserClick={(user) => {
                const rank =
                  leaderboardUsers.findIndex((u) => u.id === user.id) + 1;
                onUserClick?.(user, rank);
              }}
              isLoading={isLoading}
            />
          </>
        ) : (
          // College mode
          <>
            {currentUser?.institute ? (
              <>
                <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2">
                  <span className="text-lg">🏫</span>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wide">
                      তোমার কলেজ
                    </p>
                    <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                      {currentUser.institute}
                    </p>
                  </div>
                </div>
                <LeaderboardTable
                  users={collegeUsers}
                  selectedLevel={selectedLevel}
                  onUserClick={(user) => {
                    const rank =
                      collegeUsers.findIndex((u) => u.id === user.id) + 1;
                    onUserClick?.(user, rank);
                  }}
                  isLoading={isLoadingCollege}
                />
                {!isLoadingCollege && collegeUsers.length === 0 && (
                  <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
                    <p className="text-3xl mb-3">🏫</p>
                    <p className="font-bold text-sm">
                      তোমার কলেজ থেকে এখনো কেউ যোগ দেয়নি
                    </p>
                    <p className="text-xs mt-1">বন্ধুদের আমন্ত্রণ জানাও!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
                <p className="text-3xl mb-3">🏫</p>
                <p className="font-bold text-sm">
                  তোমার প্রোফাইলে কলেজের নাম যোগ করো
                </p>
                <p className="text-xs mt-1">
                  সেটিংস থেকে শিক্ষা প্রতিষ্ঠান আপডেট করো
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Institute Rankings View ─────────────────────────────────────────────────
interface InstituteRankingsViewProps {
  rankings: InstituteRankEntry[];
  isLoading: boolean;
  myInstitute?: string;
}

function InstituteRankingsView({
  rankings,
  isLoading,
  myInstitute,
}: InstituteRankingsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400 dark:text-neutral-600">
        <p className="text-4xl mb-3">🏆</p>
        <p className="font-bold text-sm">এখনো যথেষ্ট ডেটা নেই</p>
        <p className="text-xs mt-1">
          প্রতিটি কলেজ থেকে কমপক্ষে ৫ জন শিক্ষার্থী লাগবে
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-xs text-neutral-400 dark:text-neutral-600 font-semibold mb-3 px-1">
        র‍্যাংকিং: প্রতিটি কলেজের শীর্ষ ৫ শিক্ষার্থীর গড় XP অনুযায়ী
      </p>
      <div className="space-y-2">
        {rankings.map((entry, idx) => {
          const rank = idx + 1;
          const isMe = myInstitute && entry.institute === myInstitute;
          const medal =
            rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
          return (
            <div
              key={entry.institute}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
                isMe
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {medal ? (
                  <span className="text-xl">{medal}</span>
                ) : (
                  <span className="text-sm font-black text-neutral-400 dark:text-neutral-600">
                    {rank}
                  </span>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold truncate ${
                    isMe
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {entry.institute}
                  {isMe && (
                    <span className="ml-1.5 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                      (তোমার কলেজ)
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
                  {entry.studentCount} জন শিক্ষার্থী
                </p>
              </div>

              {/* Avg XP badge */}
              <div
                className={`text-right flex-shrink-0 px-2.5 py-1 rounded-xl ${
                  isMe
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-neutral-50 dark:bg-neutral-800'
                }`}
              >
                <p
                  className={`text-xs font-black ${
                    isMe
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {entry.avgXp.toLocaleString()} XP
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
                  গড় স্কোর
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeaderboardView;
