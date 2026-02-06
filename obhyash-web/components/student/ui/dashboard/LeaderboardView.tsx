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
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onUserClick }) => {
  const [currentUser, setCurrentUser] = useState<
    UserProfile | null | undefined
  >(undefined);
  const [selectedLevel, setSelectedLevel] = useState<LevelType>('Rookie');
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
        const isLevel = LEVELS.some((l) => l.id === user.level);
        if (isLevel) setSelectedLevel(user.level as LevelType);
      }

      // Fetch counts
      const counts = await getLevelUserCounts();
      setLevelCounts(counts);
    };
    initData();
  }, []);

  // Fetch Leaderboard when level changes
  useEffect(() => {
    const fetchLevelData = async () => {
      setIsLoading(true);
      const users = await getLeaderboardUsers(selectedLevel);
      setLeaderboardUsers(users);
      setIsLoading(false);
    };

    fetchLevelData();
  }, [selectedLevel]);

  // Calculate current user's rank in the fetched list (or their own level)
  const userRankInOwnLevel = useMemo(() => {
    if (!currentUser) return 0;
    // If the current list corresponds to user's level, find index there
    if (currentUser.level === selectedLevel) {
      const idx = leaderboardUsers.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) return idx + 1;
    }
    // If not in list (e.g. pagination or different level selected), return 0 or fetch separately
    return 0;
  }, [currentUser, leaderboardUsers, selectedLevel]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-2 md:p-6 animate-fade-in transition-colors pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"></div>

        <LevelSelector
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          currentUser={currentUser || undefined}
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
          onUserClick={onUserClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default LeaderboardView;
