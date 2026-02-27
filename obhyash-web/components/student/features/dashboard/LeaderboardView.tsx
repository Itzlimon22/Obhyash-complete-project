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
} from 'services/database';

import { LeaderboardSkeleton } from '@/components/student/ui/common/Skeletons';

interface LeaderboardViewProps {
  onUserClick?: (user: UserProfile, rank: number) => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onUserClick }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>(
    undefined,
  );
  const [selectedLevel, setSelectedLevel] = useState<LevelType>('Rookie');
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchLevelData = async () => {
      setIsLoading(true);
      const users = await getLeaderboardUsers(selectedLevel);
      setLeaderboardUsers(users);
      setIsLoading(false);
    };

    fetchLevelData();
  }, [selectedLevel]);

  const userRankInOwnLevel = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.level === selectedLevel) {
      const idx = leaderboardUsers.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) return idx + 1;
    }
    return 0;
  }, [currentUser, leaderboardUsers, selectedLevel]);

  if (isLoading && !leaderboardUsers.length) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-2 py-4 md:p-6 animate-fade-in transition-colors pb-24">
      <div className="max-w-7xl mx-auto">
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
            // Find the user's rank in the current list
            const rank =
              leaderboardUsers.findIndex((u) => u.id === user.id) + 1;
            onUserClick?.(user, rank);
          }}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default LeaderboardView;

