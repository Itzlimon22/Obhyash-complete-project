"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trophy,
  Search,
  Clock,
  X,
  FileText,
  AlertCircle,
  SearchX,
} from "lucide-react";
import {
  getPublicLeaderboard,
  getStudentLiveExamDetails,
} from "@/services/live-exam-student-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { LiveExam, LiveExamAttempt } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

interface LiveExamLeaderboardViewProps {
  exam: LiveExam;
  onBack: () => void;
  onViewSolutions?: () => void;
}

interface LeaderboardEntry {
  id: string;
  user_id?: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  submit_time?: string;
  start_time?: string;
  time_taken_seconds?: number;
  users?: {
    name?: string;
    avatarUrl?: string;
    avatarColor?: string;
    institute?: string;
  };
}

export const LiveExamLeaderboardView: React.FC<LiveExamLeaderboardViewProps> = ({
  exam,
  onBack,
  onViewSolutions,
}) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userAttempt, setUserAttempt] = useState<LiveExamAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLeaderboardData();
  }, [exam.id, user?.id]);

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      const [lbData, details] = await Promise.all([
        getPublicLeaderboard(exam.id, 200),
        user?.id ? getStudentLiveExamDetails(exam.id, user.id) : Promise.resolve(null),
      ]);

      setLeaderboard((lbData || []) as any);
      if (details) {
        setUserAttempt(details.attempt);
      }
    } catch (error) {
      console.error("Error fetching live exam leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Find user rank
  const myIndex = leaderboard.findIndex(
    (e) =>
      user &&
      ((e.user_id && e.user_id === user.id) ||
        (e.users?.name &&
          e.users.name.toLowerCase() ===
            (user.user_metadata?.full_name || user.email || "").toLowerCase()))
  );

  const myEntry = myIndex !== -1 ? leaderboard[myIndex] : null;
  const myRank = myIndex !== -1 ? myIndex + 1 : null;

  const q = searchQuery.trim().toLowerCase();
  const filteredEntries = q.length === 0
    ? leaderboard
    : leaderboard.filter((entry) => {
        const name = (entry.users?.name || "").toLowerCase();
        const inst = (entry.users?.institute || "").toLowerCase();
        return name.includes(q) || inst.includes(q);
      });

  const formatTime = (seconds?: number, startTime?: string, submitTime?: string) => {
    if (seconds && seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${BanglaNameHelper.toBanglaNumeral(String(mins).padStart(2, "0"))}:${BanglaNameHelper.toBanglaNumeral(String(secs).padStart(2, "0"))} মি.`;
    }
    if (startTime && submitTime) {
      const diff = Math.floor(
        (new Date(submitTime).getTime() - new Date(startTime).getTime()) / 1000
      );
      if (diff > 0 && diff <= 86400) {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${BanglaNameHelper.toBanglaNumeral(String(mins).padStart(2, "0"))}:${BanglaNameHelper.toBanglaNumeral(String(secs).padStart(2, "0"))} মি.`;
      }
    }
    if (submitTime) {
      const d = new Date(submitTime);
      let hours = d.getHours();
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${BanglaNameHelper.toBanglaNumeral(String(hours).padStart(2, "0"))}:${BanglaNameHelper.toBanglaNumeral(String(d.getMinutes()).padStart(2, "0"))} ${period}`;
    }
    return "--";
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-[8px] bg-[#F59E0B] flex items-center justify-center text-white text-[13px] font-black shadow-xs">
          ১
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-[8px] bg-[#94A3B8] flex items-center justify-center text-white text-[13px] font-black">
          ২
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-[8px] bg-[#B45309] flex items-center justify-center text-white text-[13px] font-black">
          ৩
        </div>
      );
    }
    return (
      <span className="text-[12.5px] font-extrabold text-[#64748B] dark:text-[#A1A1AA]">
        {BanglaNameHelper.toBanglaNumeral(rank)}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
      {/* Top Header Row matching Flutter AppBar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white">
            অফিসিয়াল মেধা তালিকা
          </h1>
          <p className="text-[11px] sm:text-[12px] text-neutral-500 dark:text-neutral-400 truncate max-w-sm sm:max-w-md">
            {exam.title}
          </p>
        </div>

        {onViewSolutions && (
          <button
            type="button"
            onClick={onViewSolutions}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#12544F] hover:bg-[#0D3E3A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FileText size={14} />
            <span>সমাধান ও ব্যাখ্যা</span>
          </button>
        )}
      </div>

      {/* Review / Unpublished Banner if admin didn't publish yet */}
      {exam.is_leaderboard_published === false && (
        <div className="mb-4 rounded-[16px] bg-[#F59E0B]/12 border border-[#F59E0B]/30 p-4 flex items-center gap-3">
          <Clock size={20} className="text-[#D97706] shrink-0" />
          <p className="text-[12px] font-semibold text-[#92400E] dark:text-amber-200 leading-relaxed">
            মেধা তালিকা পর্যালোচনাধীন রয়েছে। এডমিন কর্তৃক চূড়ান্ত প্রকাশের পর এখানে সকলের তালিকা দৃশ্যমান হবে।
          </p>
        </div>
      )}

      {/* Current User Spotlight Card matching Flutter */}
      {myEntry && myRank && (
        <div className="mb-4 rounded-[22px] bg-white dark:bg-[#18181B] border border-[#CBD5E1] dark:border-[#27272A] p-4.5 shadow-xs flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Big Rank Square */}
            <div className="w-12 h-12 rounded-[14px] bg-[#E2E8F0] dark:bg-[#27272A] border border-[#CBD5E1] dark:border-[#3F3F46] flex items-center justify-center font-black text-[17px] text-[#0F172A] dark:text-[#F8FAFC] shrink-0">
              {BanglaNameHelper.toBanglaNumeral(myRank)}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase">
                আপনার অবস্থান
              </span>
              <h3 className="text-[15.5px] font-black text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {myEntry.users?.name || "আপনি"}
              </h3>
              <p className="text-[11px] text-[#94A3B8] dark:text-[#71717A] truncate">
                মোট {BanglaNameHelper.toBanglaNumeral(leaderboard.length)} জনের মধ্যে{" "}
                {BanglaNameHelper.toBanglaNumeral(myRank)}ম স্থান
              </p>
            </div>
          </div>

          {/* Score Box */}
          <div className="px-3.5 py-2 rounded-[12px] bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-[#3F3F46] text-center shrink-0">
            <span className="block text-[17px] font-black text-[#0F172A] dark:text-[#F8FAFC]">
              {BanglaNameHelper.toBanglaNumeral(myEntry.score)}
            </span>
            <span className="text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA]">
              মার্কস
            </span>
          </div>
        </div>
      )}

      {/* Search Input Box matching Flutter 44px pill */}
      <div className="mb-4 h-[44px] rounded-[14px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] px-3 flex items-center gap-2 shadow-2xs">
        <Search size={16} className="text-[#94A3B8] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="শিক্ষার্থী বা কলেজের নাম দিয়ে খুঁজুন..."
          className="flex-1 bg-transparent text-[13.5px] text-[#0F172A] dark:text-white placeholder-[#94A3B8] outline-none"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="p-1 rounded-full bg-[#E2E8F0] dark:bg-[#27272A] text-[#64748B] dark:text-[#A1A1AA] hover:opacity-80"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Leaderboard Table matching Flutter layout */}
      {isLoading ? (
        <div className="py-20 text-center text-sm font-semibold text-neutral-400 animate-pulse">
          মেধা তালিকা লোড হচ্ছে...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 text-center rounded-[18px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] p-6">
          <SearchX size={40} className="mx-auto text-[#CBD5E1] dark:text-[#3F3F46] mb-2.5" />
          <p className="text-[14px] font-medium text-[#64748B] dark:text-[#A1A1AA]">
            কোনো শিক্ষার্থী বা কলেজ পাওয়া যায়নি
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs overflow-hidden">
          {/* Table Header Row */}
          <div className="px-3 py-3 bg-[#F8FAFC] dark:bg-[#1C1C20] border-b border-[#E2E8F0] dark:border-[#27272A] flex items-center text-[12px] font-extrabold text-[#64748B] dark:text-[#A1A1AA]">
            <div className="w-[44px] text-center shrink-0">র‍্যাংক</div>
            <div className="w-[36px] text-center shrink-0 ml-2">ছবি</div>
            <div className="flex-1 min-w-0 ml-2.5">নাম ও প্রতিষ্ঠান</div>
            <div className="w-[65px] text-center shrink-0">সময়</div>
            <div className="w-[50px] text-right shrink-0">মার্কস</div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#1F1F24]">
            {filteredEntries.map((candidate, idx) => {
              const rank = idx + 1;
              const isMe =
                user &&
                ((candidate.user_id && candidate.user_id === user.id) ||
                  (candidate.users?.name &&
                    candidate.users.name.toLowerCase() ===
                      (user.user_metadata?.full_name || user.email || "").toLowerCase()));

              const timeText = formatTime(
                candidate.time_taken_seconds,
                candidate.start_time,
                candidate.submit_time
              );

              return (
                <div
                  key={candidate.id || idx}
                  className={cn(
                    "px-3 py-2.5 flex items-center transition-colors",
                    isMe
                      ? "bg-[#059669]/10 dark:bg-[#059669]/20"
                      : idx % 2 === 1
                      ? "bg-[#FAFAFC] dark:bg-[#18181D]"
                      : "bg-transparent"
                  )}
                >
                  {/* 1. Rank */}
                  <div className="w-[44px] flex items-center justify-center shrink-0">
                    {renderRankBadge(rank)}
                  </div>

                  {/* 2. Avatar / Image */}
                  <div className="w-[36px] flex items-center justify-center shrink-0 ml-2">
                    <div
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-2xs overflow-hidden"
                      style={{
                        backgroundColor: candidate.users?.avatarColor || "#059669",
                      }}
                    >
                      {candidate.users?.avatarUrl ? (
                        <img
                          src={candidate.users.avatarUrl}
                          alt={candidate.users.name || "avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (candidate.users?.name?.charAt(0) || "U").toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* 3. Name & Institute */}
                  <div className="flex-1 min-w-0 ml-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13.5px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                        {candidate.users?.name || "পরীক্ষার্থী"}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[#059669]/20 text-[#059669] dark:text-[#34D399] text-[9.5px] font-bold">
                          আপনি
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[#64748B] dark:text-[#A1A1AA] truncate">
                      {candidate.users?.institute || "প্রতিষ্ঠান নেই"}
                    </p>
                  </div>

                  {/* 4. Time */}
                  <div className="w-[65px] text-center text-[11.5px] font-semibold text-[#475569] dark:text-[#CBD5E1] shrink-0">
                    {timeText}
                  </div>

                  {/* 5. Marks */}
                  <div className="w-[50px] text-right font-black text-[14px] text-[#059669] dark:text-[#34D399] shrink-0">
                    {BanglaNameHelper.toBanglaNumeral(candidate.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveExamLeaderboardView;
