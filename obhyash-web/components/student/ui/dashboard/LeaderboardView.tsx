import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '@/lib/types';
import { LEVELS, LevelType } from './leaderboard/leaderboardData';
import LevelSelector from './leaderboard/LevelSelector';
import UserProgress from './leaderboard/UserProgress';
import LeaderboardTable from './leaderboard/LeaderboardTable';
import {
  getLeaderboardUsers,
  getLevelUserCounts,
  getUserProfile,
} from '@/services/database';

interface LeaderboardViewProps {
  onUserClick?: (user: UserProfile) => void;
  onLegendsLeagueClick?: () => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onUserClick,
  onLegendsLeagueClick,
}) => {
  const [currentUser, setCurrentUser] = useState<
    UserProfile | null | undefined
  >(undefined);
  const [selectedLevel, setSelectedLevel] = useState<LevelType>('Explorer');
  const [timeframe, setTimeframe] = useState<'monthly' | 'all_time'>('monthly');
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data
  useEffect(() => {
    const initData = async () => {
      // Fetch current user
      const user = await getUserProfile('me');
      setCurrentUser(user);
      if (user && user.level) {
        // Check if user level is valid leveltype
        const isLevel = LEVELS.some((l) => l.id.toLowerCase() === user.level.toLowerCase());
        if (isLevel) {
          const matched = LEVELS.find((l) => l.id.toLowerCase() === user.level.toLowerCase());
          if (matched) setSelectedLevel(matched.id as LevelType);
        }
      }

      // Fetch counts
      const counts = await getLevelUserCounts();
      setLevelCounts(counts);
    };
    initData();
  }, []);

  // Fetch Leaderboard when level or timeframe changes
  useEffect(() => {
    const fetchLevelData = async () => {
      setIsLoading(true);
      const result = await getLeaderboardUsers(selectedLevel, 0, 50, timeframe);
      setLeaderboardUsers(result.users);
      setIsLoading(false);
    };

    fetchLevelData();
  }, [selectedLevel, timeframe]);

  // Calculate current user's rank in the fetched list (or their own level)
  const userRankInOwnLevel = useMemo(() => {
    if (!currentUser) return 0;
    // If the current list corresponds to user's level, find index there
    if (currentUser.level?.toLowerCase() === selectedLevel.toLowerCase()) {
      const idx = leaderboardUsers.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) return idx + 1;
    }
    return 0;
  }, [currentUser, leaderboardUsers, selectedLevel]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-2 md:p-6 animate-fade-in transition-colors pb-24 font-['HindSiliguri']">
      <div className="max-w-7xl mx-auto">
        {/* Top Header Row with Legends League Glow Button */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
              মেধা লিডারবোর্ড 🏆
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              দৈনিক পরীক্ষা দিয়ে XP বাড়াও ও লিডারবোর্ডে এগিয়ে যাও
            </p>
          </div>

          <button
            type="button"
            onClick={onLegendsLeagueClick || (() => (window.location.href = "/legends-league"))}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 animate-pulse border border-rose-400/40"
          >
            <span>👑</span>
            <span>লেজেন্ডস লীগ</span>
          </button>
        </div>

        <LevelSelector
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          currentUser={currentUser || undefined}
          levelCounts={levelCounts}
        />

        {/* Timeframe & Filter bar */}
        <div className="mb-6 flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 md:p-4 shadow-sm">
          <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {currentUser?.batch ? `আমার ব্যাচ (${currentUser.batch})` : 'সকল শিক্ষার্থী'}
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                timeframe === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              📅 মাসিক (Monthly)
            </button>
            <button
              onClick={() => setTimeframe('all_time')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                timeframe === 'all_time'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              👑 লাইফটাইম (Lifetime)
            </button>
          </div>
        </div>

        {currentUser && (
          <UserProgress
            currentUser={currentUser}
            userRankInOwnLevel={userRankInOwnLevel}
          />
        )}

        <LeaderboardTable
          users={leaderboardUsers}
          selectedLevel={selectedLevel}
          onUserClick={onUserClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default LeaderboardView;
