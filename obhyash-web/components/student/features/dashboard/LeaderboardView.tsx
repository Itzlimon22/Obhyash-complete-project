"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Crown,
  Shield,
  Zap,
  Sprout,
  Users,
  GraduationCap,
  ChevronDown,
  Calendar,
  Clock,
  Building2,
  Trophy,
  Medal,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle2,
  BarChart2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/lib/types";
import { isUserPro } from "@/lib/subscription-utils";
import UserAvatar from "../../ui/common/UserAvatar";
import { LeaderboardSkeleton } from "../../ui/common/Skeletons";
import { getCanonicalCollegeName } from "@/lib/college-mapping";

// ─── Level Definitions matching Flutter ──────────────────────────────────────
export interface LevelInfo {
  id: string;
  label: string;
  minXP: number;
  maxXP: number;
  xpRange: string;
  startColor: string;
  endColor: string;
  textColor: string;
  badgeBg: string;
  icon: React.ElementType;
  svgBadge: string;
}

export const LEADERBOARD_LEVELS: LevelInfo[] = [
  {
    id: "Legend",
    label: "লিজেন্ড",
    minXP: 15000,
    maxXP: 999999999,
    xpRange: "১৫K+ XP",
    startColor: "from-[#EF4444]",
    endColor: "to-[#991B1B]",
    textColor: "text-[#EF4444]",
    badgeBg: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: Crown,
    svgBadge: "/leaderboard-levels/level_5_legend.svg",
  },
  {
    id: "Scholar",
    label: "টাইটান",
    minXP: 7000,
    maxXP: 14999,
    xpRange: "৭K–১৫K XP",
    startColor: "from-[#F59E0B]",
    endColor: "to-[#B45309]",
    textColor: "text-[#F59E0B]",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: GraduationCap,
    svgBadge: "/leaderboard-levels/level_4_titan.svg",
  },
  {
    id: "Warrior",
    label: "ওয়ারিয়র",
    minXP: 3000,
    maxXP: 6999,
    xpRange: "৩K–৭K XP",
    startColor: "from-[#8B5CF6]",
    endColor: "to-[#6D28D9]",
    textColor: "text-[#8B5CF6]",
    badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    icon: Shield,
    svgBadge: "/leaderboard-levels/level_3_warrior.svg",
  },
  {
    id: "Challenger",
    label: "স্কাউট",
    minXP: 1000,
    maxXP: 2999,
    xpRange: "১K–৩K XP",
    startColor: "from-[#0284C7]",
    endColor: "to-[#0369A1]",
    textColor: "text-[#0284C7]",
    badgeBg: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    icon: Zap,
    svgBadge: "/leaderboard-levels/level_2_scout.svg",
  },
  {
    id: "Explorer",
    label: "রুকি",
    minXP: 0,
    maxXP: 999,
    xpRange: "০–১K XP",
    startColor: "from-[#10B981]",
    endColor: "to-[#047857]",
    textColor: "text-[#10B981]",
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: Sprout,
    svgBadge: "/leaderboard-levels/level_1_rookie.svg",
  },
];

export function getLevelById(id: string): LevelInfo {
  const clean = (id || "").toLowerCase();
  if (clean.includes("legend") || clean.includes("apex")) return LEADERBOARD_LEVELS[0];
  if (clean.includes("scholar") || clean.includes("titan")) return LEADERBOARD_LEVELS[1];
  if (clean.includes("warrior") || clean.includes("conqueror")) return LEADERBOARD_LEVELS[2];
  if (clean.includes("challenger") || clean.includes("scout")) return LEADERBOARD_LEVELS[3];
  return LEADERBOARD_LEVELS[4];
}

export function calculateLevelFromXp(xp: number): string {
  if (xp >= 15000) return "Legend";
  if (xp >= 7000) return "Scholar";
  if (xp >= 3000) return "Warrior";
  if (xp >= 1000) return "Challenger";
  return "Explorer";
}

// Convert numbers to Bengali digits
function toBengaliNum(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

function calculateRankPoints(rank: number): number {
  if (rank === 1) return 500;
  if (rank === 2) return 400;
  if (rank === 3) return 350;
  if (rank <= 5) return 300;
  if (rank <= 10) return 250;
  if (rank <= 25) return 180;
  if (rank <= 50) return 120;
  if (rank <= 100) return 80;
  if (rank <= 250) return 40;
  if (rank <= 500) return 20;
  return 10;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  institute?: string;
  xp: number;
  monthly_xp?: number;
  level?: string;
  exams_taken?: number;
  avatar_url?: string;
  batch?: string;
  rank: number;
  is_pro?: boolean;
}

export interface InstituteRank {
  institute: string;
  points: number;
  studentCount: number;
  bestRank: number;
  isMyCollege: boolean;
}

interface LeaderboardViewProps {
  currentUser?: UserProfile | null;
  onUserClick?: (user: UserProfile, rank: number) => void;
  onLegendsLeagueClick?: () => void;
}

const PAGE_SIZE = 20;

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUser: propUser,
  onUserClick,
  onLegendsLeagueClick,
}) => {
  const supabase = useMemo(() => createClient(), []);

  // ── States ─────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(propUser || null);
  const [viewMode, setViewMode] = useState<"level" | "college" | "rankings">("level");
  const [selectedLevel, setSelectedLevel] = useState<string>("Explorer");
  const [timeframe, setTimeframe] = useState<"monthly" | "all_time">("monthly");
  const [batchFilter, setBatchFilter] = useState<"all" | "my_batch">("my_batch");

  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [collegeUsers, setCollegeUsers] = useState<LeaderboardUser[]>([]);
  const [isLoadingCollege, setIsLoadingCollege] = useState(false);

  const [instituteRankings, setInstituteRankings] = useState<InstituteRank[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [searchCollegeQuery, setSearchCollegeQuery] = useState("");

  const [myExactRank, setMyExactRank] = useState(0);

  // ── 1. Fetch Current User Profile ──────────────────────────────────────────
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: prof } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          if (prof) {
            setCurrentUser(prof);
            const userEffXp = timeframe === "monthly" ? prof.monthly_xp || 0 : prof.xp || 0;
            const lvl = calculateLevelFromXp(userEffXp);
            setSelectedLevel(lvl);
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    loadCurrentUser();
  }, [supabase, timeframe]);

  // ── 2. Fetch Level Student Counts ──────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const sortColumn = timeframe === "monthly" ? "monthly_xp" : "xp";
      const counts: Record<string, number> = {};

      await Promise.all(
        LEADERBOARD_LEVELS.map(async (lvl) => {
          try {
            let query = supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .or("role.ilike.student,role.is.null");
            if (lvl.minXP > 0) {
              query = query.gte(sortColumn, lvl.minXP);
            }
            if (lvl.maxXP < 999999999) {
              query = query.lte(sortColumn, lvl.maxXP);
            }
            if (batchFilter === "my_batch" && currentUser?.batch) {
              query = query.ilike("batch", `%${currentUser.batch.trim()}%`);
            }
            const { count } = await query;
            counts[lvl.id] = count || 0;
          } catch {
            counts[lvl.id] = 0;
          }
        })
      );

      setLevelCounts(counts);
    } catch (err) {
      console.error("Error fetching level counts:", err);
    }
  }, [supabase, timeframe, batchFilter, currentUser]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // ── 3. Fetch Level Leaderboard Users ───────────────────────────────────────
  const fetchLevelUsers = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setOffset(0);
        setHasMore(true);
      }

      try {
        const currentOffset = isLoadMore ? offset : 0;
        const currentLevelInfo = getLevelById(selectedLevel);
        const sortColumn = timeframe === "monthly" ? "monthly_xp" : "xp";

        let mapped: LeaderboardUser[] = [];

        try {
          let query = supabase
            .from("users")
            .select("id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch, is_subscribed, subscription_status, subscription_expires_at, subscription, role, gender")
            .or("role.ilike.student,role.is.null");

          if (currentLevelInfo.minXP > 0) {
            query = query.gte(sortColumn, currentLevelInfo.minXP);
          }

          if (currentLevelInfo.maxXP < 999999999) {
            query = query.lte(sortColumn, currentLevelInfo.maxXP);
          }

          if (batchFilter === "my_batch" && currentUser?.batch) {
            query = query.ilike("batch", `%${currentUser.batch.trim()}%`);
          }

          if (timeframe === "monthly") {
            query = query
              .order("monthly_xp", { ascending: false, nullsFirst: false })
              .order("xp", { ascending: false, nullsFirst: false });
          } else {
            query = query.order("xp", { ascending: false, nullsFirst: false });
          }

          query = query.range(currentOffset, currentOffset + PAGE_SIZE - 1);

          const { data, error } = await query;

          if (error) throw error;

          if (data && data.length > 0) {
            mapped = data.map((u: any, idx: number) => {
              const isPro = isUserPro(u);
              const effXp = timeframe === "monthly" ? u.monthly_xp || 0 : u.xp || 0;

              return {
                id: u.id,
                name: u.name || "শিক্ষার্থী",
                institute: u.institute || "শিক্ষা প্রতিষ্ঠান নির্ধারিত নেই",
                xp: effXp,
                monthly_xp: u.monthly_xp || 0,
                level: calculateLevelFromXp(effXp),
                exams_taken: u.exams_taken || 0,
                avatar_url: u.avatar_url || undefined,
                batch: u.batch || undefined,
                rank: currentOffset + idx + 1,
                is_pro: isPro,
              };
            });
          }

          // Compute accurate current user rank in their tier if initial fetch
          if (currentUser && !isLoadMore) {
            try {
              const myEffXp = timeframe === "monthly" ? currentUser.monthly_xp || 0 : currentUser.xp || 0;
              const userCalculatedLevel = calculateLevelFromXp(myEffXp);
              const myLvlInfo = getLevelById(userCalculatedLevel);
              let countQuery = supabase
                .from("users")
                .select("id", { count: "exact", head: true })
                .or("role.ilike.student,role.is.null")
                .gte(sortColumn, myLvlInfo.minXP);
              if (myLvlInfo.maxXP < 999999999) {
                countQuery = countQuery.lte(sortColumn, myLvlInfo.maxXP);
              }
              if (batchFilter === "my_batch" && currentUser.batch) {
                countQuery = countQuery.ilike("batch", `%${currentUser.batch.trim()}%`);
              }
              countQuery = countQuery.gt(sortColumn, myEffXp);
              const { count: rankCount } = await countQuery;
              if (typeof rankCount === "number") {
                setMyExactRank(rankCount + 1);
              }
            } catch (rankErr) {
              console.warn("[LeaderboardView] Rank count error:", rankErr);
            }
          }
        } catch (dbErr) {
          console.warn("[LeaderboardView] Direct Supabase query failed, falling back to API:", dbErr);
          const params = new URLSearchParams({
            level: selectedLevel,
            timeframe,
            offset: String(currentOffset),
            limit: String(PAGE_SIZE),
          });
          if (batchFilter === "my_batch" && currentUser?.batch) {
            params.set("batch", currentUser.batch.trim());
          }
          const res = await fetch(`/api/leaderboard/level?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            mapped = (json.users || []).map((u: any, idx: number) => ({
              id: u.id,
              name: u.name || "শিক্ষার্থী",
              institute: u.institute || "শিক্ষা প্রতিষ্ঠান নির্ধারিত নেই",
              xp: u.xp || 0,
              monthly_xp: u.monthlyXp || 0,
              level: u.level || calculateLevelFromXp(u.xp || 0),
              exams_taken: u.examsTaken || 0,
              avatar_url: u.avatarUrl || undefined,
              batch: u.batch || undefined,
              rank: currentOffset + idx + 1,
              is_pro: Boolean(u.isPro || u.is_pro),
            }));
          }
        }

        if (isLoadMore) {
          setUsers((prev) => [...prev, ...mapped]);
          setOffset((prev) => prev + mapped.length);
        } else {
          setUsers(mapped);
          setOffset(mapped.length);
        }

        setHasMore(mapped.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching level users:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [supabase, selectedLevel, timeframe, batchFilter, currentUser, offset]
  );

  useEffect(() => {
    if (viewMode === "level") {
      fetchLevelUsers(false);
    }
  }, [selectedLevel, timeframe, batchFilter, viewMode]);

  // ── 4. Fetch College Leaderboard ───────────────────────────────────────────
  const fetchCollegeLeaderboard = useCallback(async () => {
    if (!currentUser?.institute) return;
    setIsLoadingCollege(true);
    try {
      let mapped: LeaderboardUser[] = [];
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch, is_subscribed, subscription_status, subscription_expires_at, subscription, role, gender")
          .or("role.ilike.student,role.is.null")
          .ilike("institute", currentUser.institute.trim())
          .order("monthly_xp", { ascending: false, nullsFirst: false })
          .order("xp", { ascending: false, nullsFirst: false })
          .limit(100);

        if (error) throw error;

        mapped = (data || [])
          .filter((u: any) => (u.role || "student").toLowerCase() === "student")
          .map((u: any) => {
            const isPro = isUserPro(u);
            const mXp = u.monthly_xp ?? 0;
            const effXp = timeframe === "monthly" ? mXp : (u.xp || 0);

            return {
              id: u.id,
              name: u.name || "শিক্ষার্থী",
              institute: u.institute,
              xp: effXp,
              monthly_xp: mXp,
              level: calculateLevelFromXp(effXp),
              exams_taken: u.exams_taken || 0,
              avatar_url: u.avatar_url || undefined,
              batch: u.batch || undefined,
              rank: 0,
              is_pro: isPro,
            };
          });

        mapped.sort((a, b) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          return (b.monthly_xp || 0) - (a.monthly_xp || 0);
        });
        mapped.forEach((u, idx) => {
          u.rank = idx + 1;
        });
      } catch (collegeErr) {
        console.warn("[LeaderboardView] Direct college query failed, falling back to API:", collegeErr);
        const res = await fetch(`/api/leaderboard/college?institute=${encodeURIComponent(currentUser.institute)}&limit=100`);
        if (res.ok) {
          const json = await res.json();
          mapped = (json.users || []).map((u: any, idx: number) => ({
            id: u.id,
            name: u.name || "শিক্ষার্থী",
            institute: u.institute || currentUser.institute,
            xp: u.xp || 0,
            monthly_xp: u.monthlyXp || 0,
            level: u.level || calculateLevelFromXp(u.xp || 0),
            exams_taken: u.examsTaken || 0,
            avatar_url: u.avatarUrl || undefined,
            batch: u.batch || undefined,
            rank: idx + 1,
            is_pro: Boolean(u.isPro || u.is_pro),
          }));
        }
      }

      setCollegeUsers(mapped);
    } catch (err) {
      console.error("Error fetching college leaderboard:", err);
    } finally {
      setIsLoadingCollege(false);
    }
  }, [supabase, currentUser]);

  useEffect(() => {
    if (viewMode === "college") {
      fetchCollegeLeaderboard();
    }
  }, [viewMode, fetchCollegeLeaderboard]);

  // ── 5. Fetch Institute Rankings ────────────────────────────────────────────
  const fetchInstituteRankings = useCallback(async () => {
    setIsLoadingRankings(true);
    try {
      let rankings: InstituteRank[] = [];

      try {
        const sortColumn = timeframe === "monthly" ? "monthly_xp" : "xp";
        const { data, error } = await supabase
          .from("users")
          .select("institute, xp, monthly_xp, role")
          .or("role.ilike.student,role.is.null")
          .not("institute", "is", null)
          .neq("institute", "")
          .order(sortColumn, { ascending: false, nullsFirst: false })
          .limit(5000);

        if (error) throw error;

        const pointsMap: Record<string, number> = {};
        const countsMap: Record<string, number> = {};
        const bestRankMap: Record<string, number> = {};

        (data || []).forEach((row: any, i: number) => {
          const rawInst = (row.institute || "").trim();
          if (!rawInst) return;
          const inst = getCanonicalCollegeName(rawInst);
          const rank = i + 1;
          const pts = calculateRankPoints(rank);

          pointsMap[inst] = (pointsMap[inst] || 0) + pts;
          countsMap[inst] = (countsMap[inst] || 0) + 1;
          if (!bestRankMap[inst] || rank < bestRankMap[inst]) {
            bestRankMap[inst] = rank;
          }
        });

        const myRawInst = (currentUser?.institute || "").trim();
        const myInst = myRawInst ? getCanonicalCollegeName(myRawInst) : "";

        rankings = Object.keys(pointsMap).map((inst) => ({
          institute: inst,
          points: pointsMap[inst],
          studentCount: countsMap[inst],
          bestRank: bestRankMap[inst],
          isMyCollege: Boolean(myInst && inst.toLowerCase() === myInst.toLowerCase()),
        }));

        rankings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.bestRank - b.bestRank;
        });
      } catch (rankingsErr) {
        console.warn("[LeaderboardView] Direct rankings query failed, falling back to API:", rankingsErr);
        const res = await fetch(`/api/leaderboard/rankings?timeframe=monthly`);
        if (res.ok) {
          const json = await res.json();
          const myRawInst = (currentUser?.institute || "").trim();
          const myInst = myRawInst ? getCanonicalCollegeName(myRawInst) : "";
          rankings = (json || []).map((r: any) => ({
            institute: r.institute,
            points: r.points || 0,
            studentCount: r.studentCount || 0,
            bestRank: r.bestRank || 9999,
            isMyCollege: Boolean(myInst && (r.institute || "").toLowerCase() === myInst.toLowerCase()),
          }));
        }
      }

      setInstituteRankings(rankings);
    } catch (err) {
      console.error("Error fetching institute rankings:", err);
    } finally {
      setIsLoadingRankings(false);
    }
  }, [supabase, currentUser, timeframe]);

  useEffect(() => {
    if (viewMode === "rankings") {
      fetchInstituteRankings();
    }
  }, [viewMode, fetchInstituteRankings]);

  // ── Derived Data ───────────────────────────────────────────────────────────
  const myEffectiveXp = timeframe === "monthly" ? currentUser?.monthly_xp || 0 : currentUser?.xp || 0;
  const myCalculatedLevel = calculateLevelFromXp(myEffectiveXp);
  const myLevelInfo = getLevelById(myCalculatedLevel);
  const currentSelectedLevelInfo = getLevelById(selectedLevel);
  const isOnOwnLevel = myCalculatedLevel === selectedLevel;

  const myRank = useMemo(() => {
    if (!currentUser) return 0;
    const idx = users.findIndex((u) => u.id === currentUser.id);
    return idx >= 0 ? idx + 1 : myExactRank;
  }, [currentUser, users, myExactRank]);

  // Next level progress calculation
  const nextLevelInfo = useMemo(() => {
    const currentIdx = LEADERBOARD_LEVELS.findIndex((l) => l.id === myCalculatedLevel);
    return currentIdx > 0 ? LEADERBOARD_LEVELS[currentIdx - 1] : null;
  }, [myCalculatedLevel]);

  const levelProgressPercent = useMemo(() => {
    if (!nextLevelInfo) return 100;
    const currentBase = myLevelInfo.minXP;
    const nextTarget = nextLevelInfo.minXP;
    const range = nextTarget - currentBase;
    if (range <= 0) return 100;
    const earned = myEffectiveXp - currentBase;
    return Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
  }, [myEffectiveXp, myLevelInfo, nextLevelInfo]);

  const top3Users = useMemo(() => users.slice(0, 3), [users]);

  const isSsc =
    (currentUser?.batch || "").toLowerCase().includes("ssc") ||
    (currentUser?.target || "").toLowerCase().includes("ssc");
  const instLabel = isSsc ? "স্কুল" : "কলেজ";

  const filteredInstituteRankings = useMemo(() => {
    if (!searchCollegeQuery.trim()) return instituteRankings;
    const q = searchCollegeQuery.toLowerCase();
    return instituteRankings.filter((r) => r.institute.toLowerCase().includes(q));
  }, [instituteRankings, searchCollegeQuery]);

  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl sm:text-2xl select-none leading-none">🥇</span>;
    if (rank === 2) return <span className="text-xl sm:text-2xl select-none leading-none">🥈</span>;
    if (rank === 3) return <span className="text-xl sm:text-2xl select-none leading-none">🥉</span>;
    return (
      <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#27272A] flex items-center justify-center text-xs font-black text-neutral-600 dark:text-neutral-400 tabular-nums shrink-0">
        {toBengaliNum(rank)}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3.5 sm:gap-4 font-sans pb-4">
      {/* ── 1. Top View Mode Tabs (র‍্যাংকিং, আমার প্রতিষ্ঠান, সব প্রতিষ্ঠান - Matching Flutter 1:1) ── */}
      <div className="w-full bg-[#F3F4F6] dark:bg-[#141416] p-1 rounded-2xl border border-neutral-200/90 dark:border-[#27272A] flex gap-1 select-none">
        <button
          type="button"
          onClick={() => setViewMode("level")}
          className={`flex-1 py-2 px-2 text-xs sm:text-sm font-['Anek_Bangla',sans-serif] font-bold rounded-xl transition-all duration-200 text-center cursor-pointer ${
            viewMode === "level"
              ? "bg-[#059669] text-white shadow-md shadow-emerald-600/30"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          র‍্যাংকিং
        </button>

        <button
          type="button"
          onClick={() => setViewMode("college")}
          className={`flex-1 py-2 px-2 text-xs sm:text-sm font-['Anek_Bangla',sans-serif] font-bold rounded-xl transition-all duration-200 text-center cursor-pointer ${
            viewMode === "college"
              ? "bg-[#059669] text-white shadow-md shadow-emerald-600/30"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          আমার {instLabel}
        </button>

        <button
          type="button"
          onClick={() => setViewMode("rankings")}
          className={`flex-1 py-2 px-2 text-xs sm:text-sm font-['Anek_Bangla',sans-serif] font-bold rounded-xl transition-all duration-200 text-center cursor-pointer ${
            viewMode === "rankings"
              ? "bg-[#059669] text-white shadow-md shadow-emerald-600/30"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          সব {instLabel}
        </button>
      </div>

      {/* ── 2. LEVEL RANKINGS VIEW ────────────────────────────────────────── */}
      {viewMode === "level" && (
        <div className="flex flex-col gap-3">
          {/* Level Selector (Horizontal Scrolling Carousel Matching Flutter 1:1) */}
          <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-0.5 px-0.5 select-none">
            <div className="flex items-center gap-2.5 min-w-max pb-1">
              {LEADERBOARD_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                const isUserLevel = myCalculatedLevel === lvl.id;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`relative w-[96px] sm:w-[108px] h-[118px] p-2.5 rounded-[20px] flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer select-none shrink-0 ${
                      isSelected
                        ? `bg-gradient-to-br ${lvl.startColor} ${lvl.endColor} text-white shadow-lg shadow-black/20 border-2 border-white/40 scale-[1.02]`
                        : "bg-white dark:bg-[#141416] border border-neutral-200/90 dark:border-[#27272A] text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs"
                    }`}
                  >
                    {isUserLevel && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 border border-white dark:border-black shadow-xs whitespace-nowrap">
                        আপনার স্তর
                      </div>
                    )}

                    <div className="w-9 h-9 sm:w-10 sm:h-10 mb-1.5 flex items-center justify-center">
                      <img
                        src={lvl.svgBadge}
                        alt={lvl.label}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                      />
                    </div>

                    <h4
                      className={`font-['Anek_Bangla',sans-serif] font-black text-[13.5px] leading-tight ${
                        isSelected ? "text-white" : "text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {lvl.label}
                    </h4>

                    <span
                      className={`text-[9.5px] font-bold mt-0.5 tracking-tight ${
                        isSelected
                          ? "text-white/90"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {lvl.xpRange}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch & Timeline Header (Directly under Level Selector Matching Flutter) */}
          <div className="flex items-center justify-between px-0.5 py-1">
            {/* Left: User Batch Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-[#1F1F23] border border-neutral-200 dark:border-[#2E2E33] shadow-2xs">
              <GraduationCap size={14} className="text-indigo-500 shrink-0" />
              <span className="text-[12px] font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                {currentUser?.batch || "HSC 2026"}
              </span>
            </div>

            {/* Right: Timeframe Selector Pill (মাসিক / লাইফটাইম) */}
            <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-[#1F1F23] border border-neutral-200 dark:border-[#2E2E33] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimeframe("monthly")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === "monthly"
                    ? "bg-white dark:bg-[#2C2C30] text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <Calendar size={13} className="shrink-0" />
                <span>মাসিক</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe("all_time")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === "all_time"
                    ? "bg-white dark:bg-[#2C2C30] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <Crown size={13} className="shrink-0" />
                <span>লাইফটাইম</span>
              </button>
            </div>
          </div>

          {/* Podium Section (শীর্ষ ৩ Matching Flutter Stepped Platforms) */}
          {!isLoading && top3Users.length >= 3 && (
            <div className="bg-white dark:bg-[#141416] border border-neutral-200/90 dark:border-[#27272A] rounded-2xl p-3 sm:p-4 mb-1 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base sm:text-lg">🏆</span>
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                  শীর্ষ ৩
                </h3>
              </div>

              <div className="flex items-end justify-center gap-2 pt-2">
                {/* 2nd Place (Silver - Left) */}
                {top3Users[1] && (
                  <div
                    onClick={() => onUserClick?.(top3Users[1] as any, 2)}
                    className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all select-none"
                  >
                    <div className="relative mb-1 flex flex-col items-center">
                      <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full p-0.5 ring-2 ring-blue-500/80 shadow-md">
                        <UserAvatar user={top3Users[1] as any} size="md" className="w-full h-full" />
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white text-center truncate max-w-[85px] sm:max-w-[110px] font-['Anek_Bangla',sans-serif]">
                      {top3Users[1].name.split(" ")[0]}
                    </h4>
                    <span className="text-[11px] font-black text-[#2563EB] dark:text-[#60A5FA] mb-1.5 tabular-nums">
                      {toBengaliNum(top3Users[1].xp)} XP
                    </span>

                    {/* Stepped platform (height 66px matching Flutter) */}
                    <div className="w-full h-[66px] rounded-t-xl bg-gradient-to-b from-blue-500/25 to-blue-700/5 border-t-[2.5px] border-t-blue-500 border-x border-blue-400/30 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-xl leading-none mb-1">🥈</span>
                      <span className="text-[11.5px] font-black text-[#2563EB] dark:text-[#60A5FA] font-['Anek_Bangla',sans-serif]">
                        ২য়
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold - Center Taller matching Flutter) */}
                {top3Users[0] && (
                  <div
                    onClick={() => onUserClick?.(top3Users[0] as any, 1)}
                    className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all select-none z-10 -mt-3"
                  >
                    <div className="relative mb-1 flex flex-col items-center">
                      <span className="text-lg leading-none animate-bounce mb-0.5">👑</span>
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 ring-[2.5px] ring-amber-400 shadow-lg shadow-amber-500/20">
                        <UserAvatar user={top3Users[0] as any} size="lg" className="w-full h-full" />
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white text-center truncate max-w-[95px] sm:max-w-[130px] font-['Anek_Bangla',sans-serif]">
                      {top3Users[0].name.split(" ")[0]}
                    </h4>
                    <span className="text-[11px] sm:text-xs font-black text-[#D97706] dark:text-[#F59E0B] mb-1.5 tabular-nums">
                      {toBengaliNum(top3Users[0].xp)} XP
                    </span>

                    {/* Stepped platform (height 86px matching Flutter) */}
                    <div className="w-full h-[86px] rounded-t-xl bg-gradient-to-b from-amber-500/30 to-amber-700/5 border-t-[2.5px] border-t-amber-500 border-x border-amber-400/30 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-2xl leading-none mb-1">🏆</span>
                      <span className="text-xs font-black text-[#D97706] dark:text-[#F59E0B] font-['Anek_Bangla',sans-serif]">
                        ১ম
                      </span>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze - Right) */}
                {top3Users[2] && (
                  <div
                    onClick={() => onUserClick?.(top3Users[2] as any, 3)}
                    className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition-all select-none"
                  >
                    <div className="relative mb-1 flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 ring-2 ring-orange-500/80 shadow-md">
                        <UserAvatar user={top3Users[2] as any} size="md" className="w-full h-full" />
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white text-center truncate max-w-[80px] sm:max-w-[100px] font-['Anek_Bangla',sans-serif]">
                      {top3Users[2].name.split(" ")[0]}
                    </h4>
                    <span className="text-[11px] font-black text-[#EA580C] dark:text-[#FB923C] mb-1.5 tabular-nums">
                      {toBengaliNum(top3Users[2].xp)} XP
                    </span>

                    {/* Stepped platform (height 52px matching Flutter) */}
                    <div className="w-full h-[52px] rounded-t-xl bg-gradient-to-b from-orange-500/25 to-orange-700/5 border-t-[2.5px] border-t-orange-500 border-x border-orange-400/30 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-lg leading-none mb-1">🥉</span>
                      <span className="text-[11.5px] font-black text-[#EA580C] dark:text-[#FB923C] font-['Anek_Bangla',sans-serif]">
                        ৩য়
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard Table List (Card Rows Matching Flutter 1:1) */}
          <div className="bg-white dark:bg-[#141416] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] overflow-hidden shadow-2xs">
            {/* Card Title Bar */}
            <div className="px-4 py-3 bg-neutral-50 dark:bg-[#18181B] border-b border-neutral-200/90 dark:border-[#27272A] flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                {currentSelectedLevelInfo.label} র‍্যাঙ্কিং
              </h3>
              <BarChart2 size={16} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
            </div>

            {/* Column Headers */}
            {users.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-b border-neutral-100 dark:border-[#1E1E22] flex items-center text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                <span className="w-9 shrink-0">RANK</span>
                <span className="w-10 shrink-0" />
                <span className="flex-1 ml-2">STUDENT</span>
                <span className="text-right shrink-0">XP</span>
              </div>
            )}

            {isLoading ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                <Trophy size={36} className="text-neutral-300 dark:text-neutral-700" />
                <p className="text-base font-bold font-['Anek_Bangla',sans-serif]">
                  এই স্তরে এখনও কোনো শিক্ষার্থী যুক্ত হয়নি
                </p>
                <p className="text-xs">পরীক্ষায় অংশ নিয়ে প্রথম স্থান অর্জন করুন!</p>
              </div>
            ) : (
              <div className="p-1.5 flex flex-col gap-1">
                {users.map((user) => {
                  const isMe = user.id === currentUser?.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => onUserClick?.(user as any, user.rank)}
                      className={`
                        rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-[0.99]
                        ${
                          isMe
                            ? "bg-red-50/80 dark:bg-[#450a0a]/30 border-1.5 border-red-500/60 shadow-xs"
                            : "bg-white dark:bg-[#1F1F23] border border-neutral-100 dark:border-[#2E2E33] hover:bg-neutral-50 dark:hover:bg-[#27272A]"
                        }
                      `}
                    >
                      {/* Left: Rank Badge + Avatar + Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 flex items-center justify-center shrink-0">
                          {renderRankBadge(user.rank)}
                        </div>

                        <UserAvatar
                          user={user as any}
                          size="md"
                          className={`w-9.5 h-9.5 sm:w-10 sm:h-10 shrink-0 ${
                            isMe ? "ring-2 ring-red-400" : ""
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className={`text-[13px] sm:text-[14px] font-bold truncate font-['Anek_Bangla',sans-serif] ${
                                isMe
                                  ? "text-red-700 dark:text-red-400 font-extrabold"
                                  : "text-neutral-900 dark:text-white"
                              }`}
                            >
                              {user.name}
                            </h4>
                            {isMe && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-extrabold shadow-2xs shrink-0">
                                তুমি
                              </span>
                            )}
                            {user.is_pro && (
                              <span className="text-[9px] px-1 py-0.2 rounded-md bg-amber-400 text-amber-950 font-black flex items-center gap-0.5 shrink-0 shadow-2xs">
                                <Crown size={9} /> PRO
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {user.institute || "শিক্ষাপ্রতিষ্ঠান"} {user.batch ? `• ${user.batch}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Right: XP Formatted */}
                      <div className="text-right shrink-0">
                        <div className="text-[13.5px] sm:text-[14.5px] font-black text-neutral-900 dark:text-neutral-100 font-['Anek_Bangla',sans-serif] tabular-nums">
                          {toBengaliNum(user.xp)} XP
                        </div>
                        <div className="text-[10px] text-neutral-400 font-medium">
                          {toBengaliNum(user.exams_taken || 0)} পরীক্ষা
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && (
              <div className="p-3 border-t border-neutral-100 dark:border-[#27272A] bg-neutral-50 dark:bg-[#18181B] text-center">
                <button
                  type="button"
                  onClick={() => fetchLevelUsers(true)}
                  disabled={isLoadingMore}
                  className="px-6 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-white font-['Anek_Bangla',sans-serif] font-bold text-xs sm:text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-2xs"
                >
                  {isLoadingMore ? "লোড হচ্ছে..." : "আরও লোড করুন"}
                </button>
              </div>
            )}
          </div>

          {/* ── Sticky User Rank Card at bottom (Matching Flutter _StickyUserRankCard 1:1) ── */}
          {currentUser && (
            <div className="sticky bottom-0 z-20 -mx-1 px-1 py-1 bg-white/95 dark:bg-[#0C0A09]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-[#27272A] shadow-lg rounded-t-2xl">
              <div
                onClick={() => onUserClick?.(currentUser, myRank)}
                className="rounded-xl p-2.5 bg-neutral-100 dark:bg-[#1F1F23] border border-neutral-200/90 dark:border-[#2E2E33] shadow-xs flex items-center justify-between gap-2.5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {renderRankBadge(myRank || 0)}
                  </div>
                  <UserAvatar
                    user={currentUser}
                    size="sm"
                    className="w-8.5 h-8.5 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {currentUser.name || "শিক্ষার্থী"}
                      </h4>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-[#2E2E33] text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-300 dark:border-[#3F3F46]">
                        তুমি
                      </span>
                    </div>
                    <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate">
                      {isOnOwnLevel
                        ? currentUser.institute || "আমার প্রোফাইল"
                        : `${myLevelInfo.label} স্তর • ${currentUser.institute || "আমার প্রোফাইল"}`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-neutral-100 tabular-nums font-['Anek_Bangla',sans-serif]">
                    {toBengaliNum(myEffectiveXp)} XP
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. MY COLLEGE LEADERBOARD VIEW ───────────────────────────────── */}
      {viewMode === "college" && (
        <div className="flex flex-col gap-3">
          {/* Header Card (Matching Flutter) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-[#0A1F17] border border-emerald-300 dark:border-[#059669] flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">🏫</span>
              <h2 className="text-sm sm:text-base font-extrabold text-emerald-800 dark:text-emerald-400 font-['Anek_Bangla',sans-serif] truncate">
                {currentUser?.institute || "শিক্ষা প্রতিষ্ঠান নির্ধারিত নেই"}
              </h2>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#141416] text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800/50">
              {toBengaliNum(collegeUsers.length)} জন
            </div>
          </div>

          {/* College Student List */}
          <div className="bg-white dark:bg-[#141416] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] overflow-hidden shadow-2xs">
            {isLoadingCollege ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : collegeUsers.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                <span className="text-4xl mb-1">🏫</span>
                <p className="font-bold text-sm sm:text-base font-['Anek_Bangla',sans-serif] text-neutral-700 dark:text-neutral-300">
                  তোমার প্রতিষ্ঠান থেকে এখনো কেউ যোগ দেয়নি
                </p>
                <p className="text-xs text-neutral-400">বন্ধুদের আমন্ত্রণ জানাও!</p>
              </div>
            ) : (
              <div className="p-1.5 flex flex-col gap-1">
                {collegeUsers.map((user) => {
                  const isMe = user.id === currentUser?.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => onUserClick?.(user as any, user.rank)}
                      className={`
                        rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-[0.99]
                        ${
                          isMe
                            ? "bg-red-50/80 dark:bg-[#450a0a]/30 border-1.5 border-red-500/60 shadow-xs"
                            : "bg-white dark:bg-[#1F1F23] border border-neutral-100 dark:border-[#2E2E33] hover:bg-neutral-50 dark:hover:bg-[#27272A]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 flex items-center justify-center shrink-0">
                          {renderRankBadge(user.rank)}
                        </div>

                        <UserAvatar
                          user={user as any}
                          size="md"
                          className={`w-9.5 h-9.5 sm:w-10 sm:h-10 shrink-0 ${
                            isMe ? "ring-2 ring-red-400" : ""
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className={`text-[13px] sm:text-[14px] font-bold truncate font-['Anek_Bangla',sans-serif] ${
                                isMe
                                  ? "text-red-700 dark:text-red-400 font-extrabold"
                                  : "text-neutral-900 dark:text-white"
                              }`}
                            >
                              {user.name}
                            </h4>
                            {isMe && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-extrabold shadow-2xs shrink-0">
                                তুমি
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {user.batch || "ব্যাচ নির্ধারিত নেই"} • {user.level || "শিক্ষার্থী"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[13.5px] sm:text-[14.5px] font-black text-neutral-900 dark:text-neutral-100 font-['Anek_Bangla',sans-serif] tabular-nums">
                          {toBengaliNum(user.xp)} XP
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. ALL INSTITUTES NATIONAL RANKINGS ──────────────────────────── */}
      {viewMode === "rankings" && (
        <div className="flex flex-col gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchCollegeQuery}
              onChange={(e) => setSearchCollegeQuery(e.target.value)}
              placeholder="শিক্ষা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/90 dark:border-[#27272A] text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 font-['Anek_Bangla',sans-serif] shadow-2xs"
            />
          </div>

          {/* Rankings List */}
          <div className="bg-white dark:bg-[#141416] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] overflow-hidden shadow-2xs">
            {isLoadingRankings ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : filteredInstituteRankings.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <p className="font-bold font-['Anek_Bangla',sans-serif]">কোন শিক্ষা প্রতিষ্ঠান পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="p-1.5 flex flex-col gap-1">
                {filteredInstituteRankings.map((inst, index) => {
                  const rank = index + 1;

                  return (
                    <div
                      key={inst.institute}
                      className={`
                        rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-all
                        ${
                          inst.isMyCollege
                            ? "bg-emerald-50/70 dark:bg-[#0A1F17] border-1.5 border-emerald-500/50 shadow-xs"
                            : "bg-white dark:bg-[#1F1F23] border border-neutral-100 dark:border-[#2E2E33] hover:bg-neutral-50 dark:hover:bg-[#27272A]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 flex items-center justify-center shrink-0">
                          {renderRankBadge(rank)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[13px] sm:text-[14px] font-bold text-neutral-900 dark:text-white truncate font-['Anek_Bangla',sans-serif]">
                              {inst.institute}
                            </h4>
                            {inst.isMyCollege && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-extrabold shrink-0 shadow-2xs">
                                তোমার প্রতিষ্ঠান
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            শিক্ষার্থী: {toBengaliNum(inst.studentCount)} জন • সেরা র‍্যাংক: {toBengaliNum(inst.bestRank)}ম
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-['Anek_Bangla',sans-serif] tabular-nums">
                          {toBengaliNum(inst.points)} পয়েন্ট
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardView;
