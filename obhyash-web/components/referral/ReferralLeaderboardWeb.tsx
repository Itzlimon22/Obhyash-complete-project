'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Gift, Award } from 'lucide-react';

interface LeaderboardUser {
  user_id: string;
  name: string;
  total_referrals: number;
}

export const ReferralLeaderboardWeb: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/referral/leaderboard');
        const json = await res.json();
        setLeaderboard(json.leaderboard || []);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getPrizeText = (rank: number) => {
    if (rank === 1) return 'টি-শার্ট + ১০০০ টাকা';
    if (rank === 2) return 'টি-শার্ট + ৫০০ টাকা';
    if (rank === 3) return 'টি-শার্ট + ১০০ টাকা';
    return 'টি-শার্ট';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <Award className="w-5 h-5 text-rose-400" />;
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-slate-100 dark:bg-neutral-800 rounded-2xl mt-8"></div>;
  }

  if (leaderboard.length === 0) {
    return null; // Don't show if no one has referred yet this month
  }

  return (
    <div className="mt-12 bg-white dark:bg-[#121212] rounded-3xl border border-neutral-200 dark:border-[#2b2b2b] overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white text-center">
        <h2 className="text-2xl font-black font-anek flex items-center justify-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-300" />
          এই মাসের সেরা রেফারার
        </h2>
        <p className="text-rose-100 font-anek mt-2 text-sm">
          সবচেয়ে বেশি বন্ধুদের ইনভাইট করুন এবং জিতে নিন দারুণ সব পুরস্কার!
        </p>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            
            return (
              <div 
                key={user.user_id} 
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  rank === 1 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' :
                  rank === 2 ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/30' :
                  rank === 3 ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10' :
                  'border-slate-100 dark:border-neutral-800 bg-white dark:bg-[#18181b]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    isTop3 ? 'bg-white dark:bg-black shadow-sm' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
                  }`}>
                    {isTop3 ? getRankIcon(rank) : rank}
                  </div>
                  <div>
                    <p className={`font-bold font-anek ${isTop3 ? 'text-lg text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {user.name}
                    </p>
                    <p className="text-sm font-anek text-slate-500 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      {getPrizeText(rank)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-black font-anek text-rose-600 dark:text-rose-400">
                    {user.total_referrals}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    রেফারেল
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
