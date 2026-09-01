"use client";

import React from "react";
import { UserProfile } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import UserAvatar from "@/components/student/ui/common/UserAvatar";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardPodiumProps {
  topUsers: UserProfile[];
  onUserClick?: (user: UserProfile, rank: number) => void;
  timeframe?: "weekly" | "monthly" | "all_time";
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  topUsers,
  onUserClick,
  timeframe = "monthly",
}) => {
  if (topUsers.length === 0) return null;

  const first = topUsers[0] || null;
  const second = topUsers[1] || null;
  const third = topUsers[2] || null;

  const getEffectiveXp = (user: UserProfile | null) => {
    if (!user) return 0;
    if (timeframe === "all_time") return user.xp || 0;
    return (user as any).monthly_xp ?? user.xp ?? 0;
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-2 font-['HindSiliguri']">
      <div className="flex items-end justify-center gap-2 sm:gap-4 pt-8 pb-4">
        {/* ── SECOND PLACE (SILVER) ── */}
        {second ? (
          <div
            onClick={() => onUserClick?.(second, 2)}
            className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
          >
            <div className="relative mb-2 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-slate-400 to-slate-200 shadow-md">
                <UserAvatar user={second} size="lg" className="w-full h-full text-base" />
              </div>
              <div className="absolute -bottom-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-full text-[10px] font-black border border-slate-300 dark:border-slate-600 shadow-sm flex items-center gap-0.5">
                <span>🥈</span>
                <span>#২</span>
              </div>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white mt-1 text-center truncate max-w-[100px] sm:max-w-[120px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {second.name || "শিক্ষার্থী"}
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold truncate max-w-[100px] text-center">
              {second.institute || "কলেজ"}
            </p>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {BanglaNameHelper.toBanglaNumeral(getEffectiveXp(second))} XP
            </span>

            {/* Pedestal */}
            <div className="w-full h-20 sm:h-24 mt-2 rounded-t-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#202024] dark:to-[#18181B] border-t-2 border-x border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 font-mono">
                ২
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* ── FIRST PLACE (GOLD - CENTER) ── */}
        {first && (
          <div
            onClick={() => onUserClick?.(first, 1)}
            className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all -mt-6 z-10"
          >
            <div className="relative mb-2 flex flex-col items-center">
              <Crown className="w-6 h-6 text-amber-500 animate-bounce mb-1 drop-shadow" />
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/20">
                <UserAvatar user={first} size="lg" className="w-full h-full text-lg" />
              </div>
              <div className="absolute -bottom-2 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-900 rounded-full text-[11px] font-black border border-amber-300 shadow-md flex items-center gap-1">
                <span>🥇</span>
                <span>#১</span>
              </div>
            </div>

            <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white mt-1 text-center truncate max-w-[110px] sm:max-w-[140px] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {first.name || "শিক্ষার্থী"}
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold truncate max-w-[110px] text-center">
              {first.institute || "কলেজ"}
            </p>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {BanglaNameHelper.toBanglaNumeral(getEffectiveXp(first))} XP
            </span>

            {/* Pedestal */}
            <div className="w-full h-28 sm:h-32 mt-2 rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-200 dark:from-[#2c2210] dark:to-[#1e1708] border-t-2 border-x border-amber-300 dark:border-amber-700/60 flex items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 font-mono">
                ১
              </span>
            </div>
          </div>
        )}

        {/* ── THIRD PLACE (BRONZE) ── */}
        {third ? (
          <div
            onClick={() => onUserClick?.(third, 3)}
            className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
          >
            <div className="relative mb-2 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-700 to-amber-600 shadow-md">
                <UserAvatar user={third} size="lg" className="w-full h-full text-base" />
              </div>
              <div className="absolute -bottom-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded-full text-[10px] font-black border border-amber-300 dark:border-amber-800 shadow-sm flex items-center gap-0.5">
                <span>🥉</span>
                <span>#৩</span>
              </div>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white mt-1 text-center truncate max-w-[100px] sm:max-w-[120px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {third.name || "শিক্ষার্থী"}
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold truncate max-w-[100px] text-center">
              {third.institute || "কলেজ"}
            </p>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {BanglaNameHelper.toBanglaNumeral(getEffectiveXp(third))} XP
            </span>

            {/* Pedestal */}
            <div className="w-full h-16 sm:h-20 mt-2 rounded-t-2xl bg-gradient-to-b from-orange-50 to-orange-100 dark:from-[#241712] dark:to-[#18181B] border-t-2 border-x border-orange-200 dark:border-orange-900/40 flex items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-orange-400 dark:text-orange-500 font-mono">
                ৩
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
};

export default LeaderboardPodium;
