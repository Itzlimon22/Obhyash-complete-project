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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/lib/types";
import UserAvatar from "../../ui/common/UserAvatar";
import { LeaderboardSkeleton } from "../../ui/common/Skeletons";

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
}

export const LEADERBOARD_LEVELS: LevelInfo[] = [
  {
    id: "Legend",
    label: "লিজেন্ড",
    minXP: 15000,
    maxXP: 999999999,
    xpRange: "15K+ XP",
    startColor: "from-red-500",
    endColor: "to-red-700",
    textColor: "text-red-500",
    badgeBg: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: Crown,
  },
  {
    id: "Scholar",
    label: "স্কলার",
    minXP: 7000,
    maxXP: 14999,
    xpRange: "7K–15K XP",
    startColor: "from-amber-500",
    endColor: "to-amber-700",
    textColor: "text-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: GraduationCap,
  },
  {
    id: "Warrior",
    label: "ওয়ারিয়র",
    minXP: 3000,
    maxXP: 6999,
    xpRange: "3K–7K XP",
    startColor: "from-purple-500",
    endColor: "to-purple-700",
    textColor: "text-purple-500",
    badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    icon: Shield,
  },
  {
    id: "Challenger",
    label: "চ্যালেঞ্জার",
    minXP: 1000,
    maxXP: 2999,
    xpRange: "1K–3K XP",
    startColor: "from-sky-500",
    endColor: "to-sky-700",
    textColor: "text-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    icon: Zap,
  },
  {
    id: "Explorer",
    label: "এক্সপ্লোরার",
    minXP: 0,
    maxXP: 999,
    xpRange: "0–1K XP",
    startColor: "from-emerald-500",
    endColor: "to-emerald-700",
    textColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: Sprout,
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
  onUserClick?: (user: UserProfile, rank: number) => void;
  onLegendsLeagueClick?: () => void;
}

const PAGE_SIZE = 20;

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onUserClick,
  onLegendsLeagueClick,
}) => {
  const supabase = useMemo(() => createClient(), []);

  // ── States ─────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<"level" | "college" | "rankings">("level");
  const [selectedLevel, setSelectedLevel] = useState<string>("Explorer");
  const [timeframe, setTimeframe] = useState<"monthly" | "all_time">("monthly");
  const [batchFilter, setBatchFilter] = useState<"all" | "my_batch">("all");

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
            let query = supabase.from("users").select("id", { count: "exact", head: true });
            if (lvl.minXP > 0) {
              query = query.gte(sortColumn, lvl.minXP);
            }
            if (lvl.maxXP < 999999999) {
              query = query.lte(sortColumn, lvl.maxXP);
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
  }, [supabase, timeframe]);

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
            .select("id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch, is_subscribed, subscription_status");

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
              const isPro = Boolean(u.is_subscribed || u.subscription_status === "active" || u.is_pro);
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
        const sortColumn = timeframe === "monthly" ? "monthly_xp" : "xp";
        let query = supabase
          .from("users")
          .select("id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch, is_subscribed, subscription_status")
          .eq("institute", currentUser.institute);

        if (timeframe === "monthly") {
          query = query.order("monthly_xp", { ascending: false, nullsFirst: false }).order("xp", { ascending: false, nullsFirst: false });
        } else {
          query = query.order("xp", { ascending: false, nullsFirst: false });
        }

        query = query.limit(100);

        const { data, error } = await query;
        if (error) throw error;

        mapped = (data || []).map((u: any, idx: number) => {
          const isPro = Boolean(u.is_subscribed || u.subscription_status === "active" || u.is_pro);
          const effXp = timeframe === "monthly" ? u.monthly_xp || 0 : u.xp || 0;

          return {
            id: u.id,
            name: u.name || "শিক্ষার্থী",
            institute: u.institute,
            xp: effXp,
            monthly_xp: u.monthly_xp || 0,
            level: calculateLevelFromXp(effXp),
            exams_taken: u.exams_taken || 0,
            avatar_url: u.avatar_url || undefined,
            batch: u.batch || undefined,
            rank: idx + 1,
            is_pro: isPro,
          };
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
  }, [supabase, currentUser, timeframe]);

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
          .select("institute, xp, monthly_xp")
          .not("institute", "is", null)
          .neq("institute", "")
          .order(sortColumn, { ascending: false, nullsFirst: false })
          .limit(3000);

        if (error) throw error;

        const pointsMap: Record<string, number> = {};
        const countsMap: Record<string, number> = {};
        const bestRankMap: Record<string, number> = {};

        (data || []).forEach((row: any, i: number) => {
          const inst = (row.institute || "").trim();
          if (!inst) return;
          const rank = i + 1;
          const pts = calculateRankPoints(rank);

          pointsMap[inst] = (pointsMap[inst] || 0) + pts;
          countsMap[inst] = (countsMap[inst] || 0) + 1;
          if (!bestRankMap[inst] || rank < bestRankMap[inst]) {
            bestRankMap[inst] = rank;
          }
        });

        const myInst = (currentUser?.institute || "").trim().toLowerCase();

        rankings = Object.keys(pointsMap).map((inst) => ({
          institute: inst,
          points: pointsMap[inst],
          studentCount: countsMap[inst],
          bestRank: bestRankMap[inst],
          isMyCollege: myInst.length > 0 && inst.toLowerCase() === myInst,
        }));

        rankings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.bestRank - b.bestRank;
        });
      } catch (rankingsErr) {
        console.warn("[LeaderboardView] Direct rankings query failed, falling back to API:", rankingsErr);
        const res = await fetch(`/api/leaderboard/rankings?timeframe=${timeframe}`);
        if (res.ok) {
          const json = await res.json();
          const myInst = (currentUser?.institute || "").trim().toLowerCase();
          rankings = (json || []).map((r: any) => ({
            institute: r.institute,
            points: r.points || 0,
            studentCount: r.studentCount || 0,
            bestRank: r.bestRank || 9999,
            isMyCollege: myInst.length > 0 && (r.institute || "").toLowerCase() === myInst,
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

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 px-2 sm:px-4 py-4 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Top View Mode Tabs (র‍্যাংকিং, আমার প্রতিষ্ঠান, সব প্রতিষ্ঠান) ── */}
      <div className="bg-white dark:bg-[#0C0A09] p-1.5 rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] shadow-sm">
        <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-[#141416] p-1 rounded-xl">
          <button
            onClick={() => setViewMode("level")}
            className={`py-2.5 px-3 rounded-lg text-sm sm:text-base font-['Anek_Bangla',sans-serif] font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === "level"
                ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Trophy size={18} className={viewMode === "level" ? "text-amber-500" : ""} />
            <span>র‍্যাংকিং</span>
          </button>

          <button
            onClick={() => setViewMode("college")}
            className={`py-2.5 px-3 rounded-lg text-sm sm:text-base font-['Anek_Bangla',sans-serif] font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === "college"
                ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Building2 size={18} className={viewMode === "college" ? "text-emerald-500" : ""} />
            <span>আমার {instLabel}</span>
          </button>

          <button
            onClick={() => setViewMode("rankings")}
            className={`py-2.5 px-3 rounded-lg text-sm sm:text-base font-['Anek_Bangla',sans-serif] font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === "rankings"
                ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Medal size={18} className={viewMode === "rankings" ? "text-indigo-500" : ""} />
            <span>সব {instLabel}</span>
          </button>
        </div>
      </div>

      {/* ── 2. LEVEL RANKINGS VIEW ────────────────────────────────────────── */}
      {viewMode === "level" && (
        <>
          {/* Level Selector Carousel Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            {LEADERBOARD_LEVELS.map((lvl) => {
              const Icon = lvl.icon;
              const isSelected = selectedLevel === lvl.id;
              const isUserLevel = myCalculatedLevel === lvl.id;
              const count = levelCounts[lvl.id] || 0;

              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`
                    relative p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between cursor-pointer
                    ${
                      isSelected
                        ? "bg-white dark:bg-[#161412] border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                        : "bg-white dark:bg-[#12100E] border-neutral-200 dark:border-[#1C1C1E] hover:border-neutral-300 dark:hover:border-neutral-700"
                    }
                  `}
                >
                  {/* Top: Icon + Count Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${lvl.startColor} ${lvl.endColor} flex items-center justify-center text-white shadow-xs`}>
                      <Icon size={18} className="stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-300">
                      {toBengaliNum(count)} জন
                    </span>
                  </div>

                  {/* Level Name & Threshold */}
                  <div>
                    <h4 className="text-[17px] font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-tight">
                      {lvl.label}
                    </h4>
                    <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {lvl.xpRange}
                    </p>
                  </div>

                  {/* Your Level Badge */}
                  {isUserLevel && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-center border border-emerald-200 dark:border-emerald-800/40">
                      আপনার স্তর
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters Bar: Batch Filter & Timeframe Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#12100E] border border-neutral-200 dark:border-[#1C1C1E]">
            {/* Batch Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 font-['Anek_Bangla',sans-serif]">ব্যাচ:</span>
              <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-[#1C1C1E] p-0.5 border border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setBatchFilter("all")}
                  className={`px-3 py-1 text-xs font-bold font-['Anek_Bangla',sans-serif] rounded-lg transition-all ${
                    batchFilter === "all"
                      ? "bg-white dark:bg-[#27272A] text-black dark:text-white shadow-xs"
                      : "text-neutral-500"
                  }`}
                >
                  সকল ব্যাচ
                </button>
                {currentUser?.batch && (
                  <button
                    onClick={() => setBatchFilter("my_batch")}
                    className={`px-3 py-1 text-xs font-bold font-['Anek_Bangla',sans-serif] rounded-lg transition-all ${
                      batchFilter === "my_batch"
                        ? "bg-white dark:bg-[#27272A] text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-neutral-500"
                    }`}
                  >
                    আমার ব্যাচ ({currentUser.batch})
                  </button>
                )}
              </div>
            </div>

            {/* Timeframe Filter (Monthly vs All-time) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 font-['Anek_Bangla',sans-serif]">সময়কাল:</span>
              <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-[#1C1C1E] p-0.5 border border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setTimeframe("monthly")}
                  className={`px-3 py-1 text-xs font-bold font-['Anek_Bangla',sans-serif] rounded-lg transition-all ${
                    timeframe === "monthly"
                      ? "bg-[#059669] text-white shadow-xs"
                      : "text-neutral-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  মাসিক র‍্যাংকিং
                </button>
                <button
                  onClick={() => setTimeframe("all_time")}
                  className={`px-3 py-1 text-xs font-bold font-['Anek_Bangla',sans-serif] rounded-lg transition-all ${
                    timeframe === "all_time"
                      ? "bg-[#059669] text-white shadow-xs"
                      : "text-neutral-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  সর্বকালীন (All Time)
                </button>
              </div>
            </div>
          </div>

          {/* User Progress Banner (When viewing own level) */}
          {currentUser && isOnOwnLevel && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-neutral-50 to-white dark:from-emerald-950/20 dark:via-[#12100E] dark:to-[#12100E] border border-emerald-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <UserAvatar user={currentUser} size="md" className="w-12 h-12 ring-2 ring-emerald-500" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">
                    {toBengaliNum(myRank || 1)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                      {currentUser.name || "শিক্ষার্থী"}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                      {myLevelInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    বর্তমান অবস্থান: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-['Anek_Bangla',sans-serif]">{myRank > 0 ? `${toBengaliNum(myRank)}ম স্থান` : "তালিকায় অন্তর্ভুক্ত"}</strong> • {toBengaliNum(myEffectiveXp)} XP
                  </p>
                </div>
              </div>

              {/* Progress to next level */}
              {nextLevelInfo && (
                <div className="w-full sm:w-64 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <span>পরবর্তী স্তর: <strong className="text-neutral-900 dark:text-white">{nextLevelInfo.label}</strong></span>
                    <span>{toBengaliNum(nextLevelInfo.minXP - myEffectiveXp)} XP বাকি</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${levelProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top 3 Podium Section */}
          {!isLoading && top3Users.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 pb-2">
              {/* 2nd Place (Silver) */}
              <div
                onClick={() => onUserClick?.(top3Users[1] as any, 2)}
                className="bg-white dark:bg-[#12100E] p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] flex flex-col items-center text-center relative group cursor-pointer hover:border-neutral-400 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-extrabold flex items-center justify-center absolute -top-3 shadow-md">
                  ২
                </div>
                <UserAvatar user={top3Users[1] as any} size="md" className="w-11 h-11 sm:w-14 sm:h-14 ring-2 ring-slate-300 mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate w-full font-['Anek_Bangla',sans-serif]">
                  {top3Users[1].name}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate w-full">{top3Users[1].institute}</p>
                <div className="mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-extrabold">
                  {toBengaliNum(top3Users[1].xp)} XP
                </div>
              </div>

              {/* 1st Place (Gold - Taller & Highlighted) */}
              <div
                onClick={() => onUserClick?.(top3Users[0] as any, 1)}
                className="bg-gradient-to-b from-amber-500/10 to-white dark:to-[#141210] p-4 sm:p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-500/50 flex flex-col items-center text-center relative group cursor-pointer shadow-lg shadow-amber-500/10 -mt-4 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 text-sm font-black flex items-center justify-center absolute -top-4 shadow-md">
                  <Crown size={16} className="stroke-[2.5]" />
                </div>
                <UserAvatar user={top3Users[0] as any} size="lg" className="w-14 h-14 sm:w-16 sm:h-16 ring-4 ring-amber-400 mb-2 mt-1" />
                <h4 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white truncate w-full font-['Anek_Bangla',sans-serif]">
                  {top3Users[0].name}
                </h4>
                <p className="text-xs text-neutral-400 truncate w-full">{top3Users[0].institute}</p>
                <div className="mt-2.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-xs">
                  {toBengaliNum(top3Users[0].xp)} XP
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div
                onClick={() => onUserClick?.(top3Users[2] as any, 3)}
                className="bg-white dark:bg-[#12100E] p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] flex flex-col items-center text-center relative group cursor-pointer hover:border-neutral-400 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-extrabold flex items-center justify-center absolute -top-3 shadow-md">
                  ৩
                </div>
                <UserAvatar user={top3Users[2] as any} size="md" className="w-11 h-11 sm:w-14 sm:h-14 ring-2 ring-amber-700 mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate w-full font-['Anek_Bangla',sans-serif]">
                  {top3Users[2].name}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate w-full">{top3Users[2].institute}</p>
                <div className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
                  {toBengaliNum(top3Users[2].xp)} XP
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="bg-white dark:bg-[#0C0A09] rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                <Trophy size={36} className="text-neutral-300 dark:text-neutral-700" />
                <p className="text-base font-bold font-['Anek_Bangla',sans-serif]">এই স্তরে এখনও কোন শিক্ষার্থী যুক্ত হয়নি</p>
                <p className="text-xs">পরীক্ষায় অংশগ্রহণ করে প্রথম স্থান অর্জন করুন!</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-[#1C1C1E]">
                {users.map((user) => {
                  const isMe = user.id === currentUser?.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => onUserClick?.(user as any, user.rank)}
                      className={`
                        p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group
                        ${
                          isMe
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                            : "hover:bg-neutral-50 dark:hover:bg-[#141210]"
                        }
                      `}
                    >
                      {/* Rank + Avatar + Name & Institute */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`
                            w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shrink-0
                            ${
                              user.rank === 1
                                ? "bg-amber-400 text-amber-950"
                                : user.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : user.rank === 3
                                ? "bg-amber-700 text-amber-100"
                                : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                            }
                          `}
                        >
                          {toBengaliNum(user.rank)}
                        </div>

                        {/* Avatar */}
                        <UserAvatar user={user as any} size="sm" className="w-10 h-10 shrink-0" />

                        {/* Name & Institute */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[15px] sm:text-[16px] font-bold text-neutral-900 dark:text-white truncate font-['Anek_Bangla',sans-serif]">
                              {user.name}
                            </h4>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-bold">
                                আপনি
                              </span>
                            )}
                            {user.is_pro && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold flex items-center gap-0.5">
                                <Crown size={10} /> PRO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 truncate max-w-[200px] sm:max-w-[320px]">
                            {user.institute} {user.batch ? `• ${user.batch}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Right: XP Badge & Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-extrabold text-[#059669] dark:text-[#10B981] font-['Anek_Bangla',sans-serif]">
                            {toBengaliNum(user.xp)} XP
                          </div>
                          <div className="text-[11px] text-neutral-400 font-medium">
                            {toBengaliNum(user.exams_taken || 0)} পরীক্ষা
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && (
              <div className="p-4 border-t border-neutral-100 dark:border-[#1C1C1E] bg-neutral-50 dark:bg-[#12100E] text-center">
                <button
                  onClick={() => fetchLevelUsers(true)}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-white font-['Anek_Bangla',sans-serif] font-bold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingMore ? "লোড হচ্ছে..." : "আরও লোড করুন"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 3. MY COLLEGE LEADERBOARD VIEW ───────────────────────────────── */}
      {viewMode === "college" && (
        <div className="flex flex-col gap-4">
          {/* Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12100E] border border-neutral-200 dark:border-[#1C1C1E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Building2 size={15} />
                <span>আমার শিক্ষা প্রতিষ্ঠান</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] mt-1">
                {currentUser?.institute || "শিক্ষা প্রতিষ্ঠান নির্ধারিত নেই"}
              </h2>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#1C1C1E] text-sm font-bold text-neutral-700 dark:text-neutral-300">
              মোট শিক্ষার্থী: {toBengaliNum(collegeUsers.length)} জন
            </div>
          </div>

          {/* College Student List */}
          <div className="bg-white dark:bg-[#0C0A09] rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] overflow-hidden">
            {isLoadingCollege ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : collegeUsers.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <Building2 size={36} className="mx-auto mb-2 text-neutral-400" />
                <p className="font-bold font-['Anek_Bangla',sans-serif]">আপনার প্রতিষ্ঠানের আর কোন শিক্ষার্থী পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-[#1C1C1E]">
                {collegeUsers.map((user) => {
                  const isMe = user.id === currentUser?.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => onUserClick?.(user as any, user.rank)}
                      className={`
                        p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group
                        ${
                          isMe
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                            : "hover:bg-neutral-50 dark:hover:bg-[#141210]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`
                            w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                            ${
                              user.rank === 1
                                ? "bg-amber-400 text-amber-950"
                                : user.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : user.rank === 3
                                ? "bg-amber-700 text-amber-100"
                                : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                            }
                          `}
                        >
                          {toBengaliNum(user.rank)}
                        </div>
                        <UserAvatar user={user as any} size="sm" className="w-10 h-10 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[15px] font-bold text-neutral-900 dark:text-white truncate font-['Anek_Bangla',sans-serif]">
                              {user.name}
                            </h4>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-bold">
                                আপনি
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">{user.batch || "ব্যাচ নির্ধারিত নেই"}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-[#059669] dark:text-[#10B981] font-['Anek_Bangla',sans-serif]">
                          {toBengaliNum(user.xp)} XP
                        </div>
                        <div className="text-xs text-neutral-400">{user.level}</div>
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
        <div className="flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchCollegeQuery}
              onChange={(e) => setSearchCollegeQuery(e.target.value)}
              placeholder="শিক্ষা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#12100E] border border-neutral-200 dark:border-[#1C1C1E] text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-['Anek_Bangla',sans-serif]"
            />
          </div>

          {/* Rankings List */}
          <div className="bg-white dark:bg-[#0C0A09] rounded-2xl border border-neutral-200 dark:border-[#1C1C1E] overflow-hidden">
            {isLoadingRankings ? (
              <div className="p-6">
                <LeaderboardSkeleton />
              </div>
            ) : filteredInstituteRankings.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <p className="font-bold font-['Anek_Bangla',sans-serif]">কোন শিক্ষা প্রতিষ্ঠান পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-[#1C1C1E]">
                {filteredInstituteRankings.map((inst, index) => {
                  const rank = index + 1;

                  return (
                    <div
                      key={inst.institute}
                      className={`
                        p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors
                        ${
                          inst.isMyCollege
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                            : "hover:bg-neutral-50 dark:hover:bg-[#141210]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`
                            w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                            ${
                              rank === 1
                                ? "bg-amber-400 text-amber-950"
                                : rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : rank === 3
                                ? "bg-amber-700 text-amber-100"
                                : "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400"
                            }
                          `}
                        >
                          {toBengaliNum(rank)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[15px] sm:text-[16px] font-bold text-neutral-900 dark:text-white truncate font-['Anek_Bangla',sans-serif]">
                              {inst.institute}
                            </h4>
                            {inst.isMyCollege && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-bold">
                                আপনার প্রতিষ্ঠান
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">
                            শিক্ষার্থী: {toBengaliNum(inst.studentCount)} জন • সেরা র‍্যাংক: {toBengaliNum(inst.bestRank)}ম
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-['Anek_Bangla',sans-serif]">
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
