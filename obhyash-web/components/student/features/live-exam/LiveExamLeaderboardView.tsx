"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Trophy, 
  Medal, 
  Search, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Sparkles,
  School,
  FileText
} from "lucide-react";
import { getPublicLeaderboard, getStudentLiveExamDetails } from "@/services/live-exam-student-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { LiveExam, LiveExamAttempt } from "@/lib/types";

interface LiveExamLeaderboardViewProps {
  exam: LiveExam;
  onBack: () => void;
  onViewSolutions?: () => void;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  submit_time: string;
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

      setLeaderboard(lbData || []);
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
  const userRankIndex = userAttempt 
    ? leaderboard.findIndex(entry => entry.score <= (userAttempt.score ?? 0))
    : -1;
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : (leaderboard.length > 0 ? leaderboard.length : "-");

  const filteredLeaderboard = leaderboard.filter(entry => {
    const name = entry.users?.name || "পরীক্ষার্থী";
    const institute = entry.users?.institute || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           institute.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {exam.category}
              </span>
              <span className="text-xs font-bold text-neutral-500">অফিসিয়াল মেধা তালিকা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1">
              {exam.title}
            </h2>
          </div>
        </div>

        {onViewSolutions && (
          <button
            onClick={onViewSolutions}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-[#0B6B42] hover:bg-[#095937] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-800/20"
          >
            <FileText className="w-4 h-4" />
            <span>সমাধান ও ব্যাখ্যা</span>
          </button>
        )}
      </div>

      {/* Student's Own Performance Spotlight */}
      {userAttempt && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-900/20 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shrink-0">
                #{userRank}
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">আপনার অবস্থান</span>
                <h3 className="text-xl font-black text-white">
                  {user?.user_metadata?.full_name || "আপনি"}
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium">
                  মোট {leaderboard.length} জন পরীক্ষার্থীর মধ্যে {userRank}ম স্থান
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/15 text-center">
              <div>
                <span className="text-[11px] text-emerald-200 font-semibold">প্রাপ্ত নম্বর</span>
                <p className="text-lg font-black text-white">{userAttempt.score ?? 0}</p>
              </div>
              <div className="border-x border-white/20 px-2">
                <span className="text-[11px] text-emerald-200 font-semibold">সঠিক</span>
                <p className="text-lg font-black text-emerald-300">{userAttempt.correct_count ?? 0}</p>
              </div>
              <div>
                <span className="text-[11px] text-emerald-200 font-semibold">ভুল</span>
                <p className="text-lg font-black text-rose-300">{userAttempt.wrong_count ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium (If at least 3 candidates exist) */}
      {top3.length >= 3 && (
        <div className="mb-8">
          <div className="text-center mb-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">টপ ৩ স্থানাধিকারী</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto">
            
            {/* 2nd Place */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 text-center flex flex-col items-center justify-between shadow-sm relative pt-7">
              <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-900">
                ২
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg mb-2">
                {top3[1]?.users?.name?.[0] || "২"}
              </div>
              <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white truncate max-w-full">
                {top3[1]?.users?.name || "পরীক্ষার্থী"}
              </h4>
              <p className="text-[11px] text-neutral-500 truncate max-w-full">
                {top3[1]?.users?.institute || "কলেজ / স্কুল"}
              </p>
              <div className="mt-2.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-black text-xs text-slate-700 dark:text-slate-300">
                {top3[1]?.score} নম্বর
              </div>
            </div>

            {/* 1st Place (Champion) */}
            <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-neutral-900 border-2 border-amber-400/80 rounded-3xl p-5 text-center flex flex-col items-center justify-between shadow-lg relative pt-8 -translate-y-2">
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white dark:border-neutral-900">
                👑
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-black text-xl mb-2 shadow-inner">
                {top3[0]?.users?.name?.[0] || "১"}
              </div>
              <h4 className="font-black text-base text-neutral-900 dark:text-white truncate max-w-full">
                {top3[0]?.users?.name || "পরীক্ষার্থী"}
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-full">
                {top3[0]?.users?.institute || "কলেজ / স্কুল"}
              </p>
              <div className="mt-2.5 px-3.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm">
                {top3[0]?.score} নম্বর
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 text-center flex flex-col items-center justify-between shadow-sm relative pt-7">
              <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-900">
                ৩
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-2">
                {top3[2]?.users?.name?.[0] || "৩"}
              </div>
              <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white truncate max-w-full">
                {top3[2]?.users?.name || "পরীক্ষার্থী"}
              </h4>
              <p className="text-[11px] text-neutral-500 truncate max-w-full">
                {top3[2]?.users?.institute || "কলেজ / স্কুল"}
              </p>
              <div className="mt-2.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 font-black text-xs text-amber-900 dark:text-amber-300">
                {top3[2]?.score} নম্বর
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Full Merit Table Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        
        {/* Search & Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black text-neutral-900 dark:text-white text-base">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <span>পূর্ণাঙ্গ মেধা তালিকা ({leaderboard.length} জন)</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম বা প্রতিষ্ঠান দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-16 text-center text-neutral-400 font-bold">
            মেধা তালিকা লোড হচ্ছে...
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 font-bold">
            কোনো তথ্য পাওয়া যায়নি
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user && entry.users?.name === (user.user_metadata?.full_name || user.email);

              let rankBadge = (
                <span className="w-7 h-7 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-black text-xs flex items-center justify-center">
                  {rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                    ১
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
                    ২
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    ৩
                  </span>
                );
              }

              return (
                <div
                  key={entry.id || index}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isCurrentUser 
                      ? "bg-emerald-50/60 dark:bg-emerald-950/30" 
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {rankBadge}
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white truncate">
                          {entry.users?.name || "পরীক্ষার্থী"}
                        </h4>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                            আপনি
                          </span>
                        )}
                      </div>
                      {entry.users?.institute && (
                        <p className="text-xs text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                          <School className="w-3 h-3 shrink-0" />
                          <span>{entry.users.institute}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="hidden sm:block text-xs font-semibold text-neutral-500">
                      <span className="text-emerald-600 font-bold">{entry.correct_count} সঠিক</span>
                      <span className="mx-1.5">•</span>
                      <span className="text-rose-500 font-bold">{entry.wrong_count} ভুল</span>
                    </div>

                    <div className="w-20 sm:w-24">
                      <span className="text-base sm:text-lg font-black text-[#0B6B42] dark:text-emerald-400">
                        {entry.score}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-bold ml-1">নম্বর</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default LiveExamLeaderboardView;
