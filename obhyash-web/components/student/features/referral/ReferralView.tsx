'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Lock,
  Loader2,
  Users,
  Trophy,
  Award,
  CheckCircle2,
  ArrowRight,
  Crown,
  Sparkles,
  Zap,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { celebration } from '@/lib/confetti';
import { useAuth } from '@/components/auth/AuthProvider';
import ScratchCardModal from './ScratchCardModal';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';

interface ReferralHistoryItem {
  id: string;
  redeemed_at: string;
  admin_status: 'Approved' | 'Rejected' | 'Pending' | 'Pending Exam' | 'Pending Review' | string;
  name?: string;
  redeemed_by?: { name?: string; email?: string } | string;
}

interface ScratchCardItem {
  id: string;
  user_id: string;
  is_scratched: boolean;
  reward_type?: string;
  created_at: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  total_referrals: number;
  avatar_url?: string;
}

interface ReferralViewProps {
  user?: any;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ user: propUser }) => {
  const { user: authUser, refreshProfile } = useAuth();
  const effectiveUser = propUser || authUser;
  const router = useRouter();

  // ── Synchronous Instant Cache Load (0-second cold open) ──
  const getInitialCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      const uid = effectiveUser?.id;
      const key = uid ? `cached_referral_${uid}` : 'cached_referral_data';
      const stored = localStorage.getItem(key) || localStorage.getItem('cached_referral_data');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  };

  const initialCache = getInitialCache();

  const [code, setCode] = useState<string | null>(initialCache?.code || null);
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState<ReferralHistoryItem[]>(initialCache?.history || []);
  const [scratchCards, setScratchCards] = useState<ScratchCardItem[]>(initialCache?.scratchCards || []);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(initialCache?.leaderboard || []);
  const [totalReferrals, setTotalReferrals] = useState<number>(initialCache?.totalApproved || 0);
  const [hasUsedReferral, setHasUsedReferral] = useState<boolean>(initialCache?.hasUsedReferral ?? false);
  const [isReferralEnabled, setIsReferralEnabled] = useState<boolean>(initialCache?.is_enabled ?? true);

  // Claim Code & Lockout State
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [activeScratchCardId, setActiveScratchCardId] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLockoutTimer = (seconds: number) => {
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    setLockoutSeconds(seconds);

    lockoutTimerRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
          setRemainingAttempts(3);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, []);

  // ── Background Data Fetch (Parallel, non-blocking) ──
  const loadReferralData = async () => {
    try {
      const supabase = createClient();
      let uid = effectiveUser?.id;

      if (!uid) {
        const { data } = await supabase.auth.getSession();
        uid = data.session?.user?.id;
      }

      if (!uid) return;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Parallelize calls
      const [meResult, lbResult, eligResult] = await Promise.all([
        fetch('/api/referral/me', { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        Promise.resolve(supabase.rpc('get_monthly_leaderboard')).catch(() => null),
        Promise.resolve(supabase.rpc('check_referral_eligibility', { p_user_id: uid })).catch(() => null),
      ]);

      let newCode = code;
      let newTotal = totalReferrals;
      let newHistory = history;
      let newScratch = scratchCards;
      let newHasUsed = hasUsedReferral;
      let newEnabled = isReferralEnabled;

      if (meResult) {
        if (meResult.referral?.code) {
          newCode = meResult.referral.code;
          setCode(newCode);
        }
        if (Array.isArray(meResult.history)) {
          newHistory = meResult.history;
          setHistory(newHistory);
        }
        if (typeof meResult.totalApproved === 'number') {
          newTotal = meResult.totalApproved;
          setTotalReferrals(newTotal);
        }
        if (Array.isArray(meResult.scratchCards)) {
          newScratch = meResult.scratchCards;
          setScratchCards(newScratch);
        }
        if (typeof meResult.hasUsedReferral === 'boolean') {
          newHasUsed = meResult.hasUsedReferral;
          setHasUsedReferral(newHasUsed);
        }
        if (typeof meResult.is_enabled === 'boolean') {
          newEnabled = meResult.is_enabled;
          setIsReferralEnabled(newEnabled);
        }
      }

      let newLeaderboard = leaderboard;
      if (lbResult?.data && Array.isArray(lbResult.data)) {
        newLeaderboard = lbResult.data;
        setLeaderboard(newLeaderboard);
      }

      if (eligResult?.data && typeof eligResult.data === 'object') {
        const elig = eligResult.data as any;
        if (typeof elig.has_used_referral === 'boolean') {
          newHasUsed = elig.has_used_referral;
          setHasUsedReferral(newHasUsed);
        }
        if (typeof elig.remaining_attempts === 'number') {
          setRemainingAttempts(elig.remaining_attempts);
        }
        if (typeof elig.lock_seconds === 'number' && elig.lock_seconds > 0) {
          startLockoutTimer(elig.lock_seconds);
        }
      }

      // Save to localStorage for instant 0-second reloads
      if (typeof window !== 'undefined' && uid) {
        try {
          const cacheObj = {
            code: newCode,
            totalApproved: newTotal,
            history: newHistory,
            scratchCards: newScratch,
            hasUsedReferral: newHasUsed,
            leaderboard: newLeaderboard,
            is_enabled: newEnabled,
          };
          localStorage.setItem(`cached_referral_${uid}`, JSON.stringify(cacheObj));
          localStorage.setItem('cached_referral_data', JSON.stringify(cacheObj));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Error loading referral data:', err);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, [effectiveUser?.id]);

  const handleClaimReferral = async () => {
    if (!isReferralEnabled) {
      toast.warning('বর্তমানে রেফারেল প্রোগ্রাম সাময়িকভাবে বন্ধ আছে।');
      return;
    }

    const input = claimCodeInput.trim().toUpperCase();
    if (!input) {
      toast.warning('রেফারেল কোডটি লিখুন');
      return;
    }

    if (lockoutSeconds > 0) {
      const min = Math.floor(lockoutSeconds / 60);
      const sec = lockoutSeconds % 60;
      toast.warning(
        `ভুল কোড দেওয়ার কারণে ইনপুট সাময়িকভাবে লক আছে। আর ${min} মিনিট ${sec} সেকেন্ড অপেক্ষা করুন।`
      );
      return;
    }

    setIsClaiming(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const deviceId = getDeviceFingerprint();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: input, deviceId }),
      });

      const json = await res.json();

      if (res.ok && json.success !== false) {
        toast.success(
          json.message || 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! 🎉'
        );
        celebration.levelUp();
        setShowCelebrationModal(true);
        setClaimCodeInput('');
        setHasUsedReferral(true);
        setRemainingAttempts(3);
        try {
          await refreshProfile();
        } catch (_) {}
        loadReferralData();
      } else {
        const isLocked = json.locked === true;
        const lockSec = json.lock_seconds || 0;
        const rem = json.remaining_attempts ?? Math.max(0, remainingAttempts - 1);
        setRemainingAttempts(rem);

        if (isLocked || lockSec > 0) {
          startLockoutTimer(lockSec > 0 ? lockSec : 600);
          toast.error(json.error || '৩ বার ভুল কোড দেওয়ায় ইনপুট লক করা হয়েছে।');
        } else {
          toast.error(json.error || 'ভুল রেফারেল কোড!');
        }
      }
    } catch (_) {
      toast.error('রেফারেল ক্লেইম করতে সমস্যা হয়েছে।');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('রেফারেল কোড কপি হয়েছে!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!code) return;
    const shareUrl = `https://obhyash.com/signup?ref=${code}`;
    const text = `অভ্যাস অ্যাপে আমার রেফারেল কোড ব্যবহার করে ফ্রি তে পাও ১৫ দিনের সম্পূর্ণ প্রো সাবস্ক্রিপশন! 🎉\n\nরেফারেল কোড: ${code}\n\nএখানে রেজিস্টার করো: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'অভ্যাস অ্যাপ - ১৫ দিনের ফ্রি প্রো প্রিমিয়াম',
          text,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }

    navigator.clipboard.writeText(text);
    toast.success('শেয়ার লিংক ক্লিপবোর্ডে কপি হয়েছে!');
  };

  const nextMilestone = (Math.floor(totalReferrals / 3) + 1) * 3;
  const progressPercent = Math.min(100, Math.round(((totalReferrals % 3) / 3) * 100));
  const needed = 3 - (totalReferrals % 3);

  // Flat premium card style
  const cardClass =
    'bg-[#121214] rounded-2xl p-4 sm:p-5 border border-neutral-800/80 shadow-xs transition-colors';

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 sm:px-4 py-3 sm:py-4 font-['HindSiliguri',sans-serif] pb-24 select-none space-y-3.5">
      {/* ── 0. Paused Warning Banner (if disabled by admin) ── */}
      {!isReferralEnabled && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-2.5 text-amber-200 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>বর্তমানে রেফারেল প্রোগ্রাম সাময়িকভাবে বন্ধ আছে। শীঘ্রই পুনরায় চালু করা হবে।</span>
        </div>
      )}

      {/* ── 1. Unified Referral Hero Hub (Flagship Flat Card) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121214] border border-neutral-800/90 p-4.5 sm:p-5.5 shadow-lg">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Row: Badge & Incentive */}
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-bold tracking-wide">
            <Gift className="w-3.5 h-3.5 text-rose-500" />
            <span>রেফারেল ও রিওয়ার্ড</span>
          </div>
          <span className="text-[11px] font-bold text-amber-400/90 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            প্রতি রেফারে ৭ দিন প্রো
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="relative z-10 mb-4">
          <h2 className="text-base sm:text-[17px] font-extrabold text-white leading-snug">
            বন্ধুদের আমন্ত্রণ জানাও, দুজনেই পাও প্রো!
          </h2>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            তোমার কোড দিয়ে বন্ধু পাবে <strong className="text-neutral-200 font-semibold">১৫ দিন প্রো</strong> এবং তুমি পাবে <strong className="text-neutral-200 font-semibold">৭ দিন প্রো</strong>। প্রতি ৩ রেফারে আনলক হবে বিশেষ স্ক্র্যাচ কার্ড 🎉
          </p>
        </div>

        {/* Integrated Referral Code Display */}
        <div className="relative z-10 p-3 sm:p-3.5 rounded-xl bg-black/60 border border-neutral-800 flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block leading-tight">
              তোমার রেফারেল কোড
            </span>
            <span className="text-base sm:text-lg font-mono font-extrabold tracking-widest text-white truncate block">
              {code || '— — — — — — — —'}
            </span>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isCopied
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-[#27272A] hover:bg-[#323238] text-neutral-200'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি করো</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Share CTA */}
        <button
          type="button"
          onClick={shareCode}
          className="relative z-10 w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#BE123C] hover:from-[#991B1B] hover:to-[#9F1239] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B91C1C]/25 active:scale-[0.99] cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>বন্ধুদের সাথে শেয়ার করো</span>
        </button>

        {/* Seamless Milestones & Progress Strip */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-neutral-300">স্ক্র্যাচ কার্ড প্রগ্রেস</span>
            </div>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {totalReferrals} / {nextMilestone}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{
                width: `${
                  progressPercent === 0 && totalReferrals > 0 && totalReferrals % 3 === 0
                    ? 100
                    : progressPercent
                }%`,
              }}
            />
          </div>

          <p className="text-[11px] text-neutral-400">
            {needed === 3 && totalReferrals > 0
              ? '🎉 অভিনন্দন! তুমি একটি নতুন স্ক্র্যাচ কার্ড পেয়েছ!'
              : `আর মাত্র ${needed} টি সফল রেফারেল করলে পাবেন একটি স্ক্র্যাচ কার্ড!`}
          </p>
        </div>
      </div>

      {/* ── 2. Claim Friend's Referral Code (Compact & Flat) ── */}
      {!hasUsedReferral && (
        <div className="rounded-2xl p-4 bg-[#121214] border border-emerald-900/40 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                কারো রেফারেল কোড আছে?
              </h3>
              <p className="text-[11px] text-neutral-400">
                ১৫ দিনের সম্পূর্ণ প্রো প্রিমিয়াম ফ্রি উপভোগ করো
              </p>
            </div>
          </div>

          {/* Lockout Warning */}
          {lockoutSeconds > 0 ? (
            <div className="p-2.5 mb-2.5 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                ৩ বার ভুল কোড দেওয়ায় ইনপুট লক। আর{' '}
                {Math.floor(lockoutSeconds / 60)}:
                {(lockoutSeconds % 60).toString().padStart(2, '0')} মিনিট অপেক্ষা করো।
              </span>
            </div>
          ) : (
            <p className="text-[10px] font-semibold text-neutral-400 mb-2">
              ⚠️ সর্বোচ্চ ৩ বার ভুল কোড দেওয়া যাবে (অবশিষ্ট: {remainingAttempts} টি চেষ্টা)
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={claimCodeInput}
              onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
              disabled={lockoutSeconds > 0 || isClaiming || !isReferralEnabled}
              placeholder={!isReferralEnabled ? 'সাময়িক বন্ধ' : 'CODE1234'}
              className="flex-1 h-10 px-3.5 rounded-xl border border-neutral-800 bg-black/60 text-xs sm:text-sm font-mono font-bold tracking-widest text-white uppercase focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleClaimReferral}
              disabled={lockoutSeconds > 0 || isClaiming || !isReferralEnabled}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {isClaiming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>ক্লেইম করো</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. How It Works (Clean Flat Stepper Strip) ── */}
      <div className="rounded-2xl p-4 bg-[#121214] border border-neutral-800/80">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">
          কীভাবে কাজ করে?
        </span>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex flex-col items-center">
            <span className="text-lg mb-1">🔗</span>
            <span className="text-[11px] font-bold text-neutral-200">কোড কপি</span>
            <span className="text-[10px] text-neutral-500 mt-0.5">তোমার কোড নাও</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex flex-col items-center">
            <span className="text-lg mb-1">📤</span>
            <span className="text-[11px] font-bold text-neutral-200">শেয়ার করো</span>
            <span className="text-[10px] text-neutral-500 mt-0.5">বন্ধুদের পাঠাও</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex flex-col items-center">
            <span className="text-lg mb-1">🎉</span>
            <span className="text-[11px] font-bold text-neutral-200">পুরস্কার লাভ</span>
            <span className="text-[10px] text-neutral-500 mt-0.5">প্রো ও কার্ড পাও</span>
          </div>
        </div>
      </div>

      {/* ── 4. Scratch Cards Grid (If Any) ── */}
      {scratchCards.length > 0 && (
        <div className="rounded-2xl p-4 bg-[#121214] border border-neutral-800/80">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">
            তোমার স্ক্র্যাচ কার্ডসমূহ
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {scratchCards.map((card) => {
              const isScratched = card.is_scratched;

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (!isScratched) setActiveScratchCardId(card.id);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    isScratched
                      ? 'bg-neutral-900/40 border-neutral-800 cursor-default opacity-60'
                      : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white border-amber-400/50 shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-1">
                    {isScratched ? (
                      <CheckCircle2 className="w-6 h-6 text-neutral-500 mb-1" />
                    ) : (
                      <Gift className="w-6 h-6 text-white mb-1 animate-pulse" />
                    )}
                    <span className="text-xs font-bold">
                      {isScratched ? 'ব্যবহৃত' : 'খুলতে ট্যাপ করো'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Monthly Leaderboard (Grouped Flat Card) ── */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800/80 overflow-hidden shadow-xs">
        <div className="py-3 px-4 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FDE047]" />
            <h3 className="text-xs sm:text-sm font-bold">
              এই মাসের সেরা রেফারার
            </h3>
          </div>
          <span className="text-[10px] text-rose-200 font-semibold">মাসিক পুরস্কার</span>
        </div>

        <div className="p-3 divide-y divide-neutral-800/50">
          {leaderboard.length === 0 ? (
            <p className="py-4 text-center text-xs text-neutral-500">
              এখনও কেউ লিডারবোর্ডে যুক্ত হয়নি। রেফার করে প্রথম স্থান দখল করো!
            </p>
          ) : (
            leaderboard.map((u, idx) => {
              const rank = idx + 1;
              const prize =
                rank === 1
                  ? 'টি-শার্ট + মেগা গিফট বক্স'
                  : rank === 2
                  ? 'টি-শার্ট + স্পেশাল বক্স'
                  : rank === 3
                  ? 'টি-শার্ট + ভাউচার'
                  : 'টি-শার্ট';

              return (
                <div
                  key={u.id || idx}
                  className="py-2.5 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-bold text-xs sm:text-sm">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {u.name || 'শিক্ষার্থী'}
                      </p>
                      <span className="text-[10px] text-rose-400 font-semibold">
                        🏆 {prize}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-300 shrink-0">
                    {u.total_referrals} রেফার
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 6. Referral History (Grouped Flat Card) ── */}
      {history.length > 0 && (
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              রেফারেল ইতিহাস ({history.length} জন)
            </h3>
          </div>

          <div className="space-y-2">
            {history.map((h, i) => {
              const name =
                typeof h.redeemed_by === 'object'
                  ? h.redeemed_by?.name || 'ব্যবহারকারী'
                  : h.name || 'ব্যবহারকারী';
              const status = h.admin_status || 'Pending';
              const dateStr = h.redeemed_at
                ? new Date(h.redeemed_at).toLocaleDateString('bn-BD')
                : '';

              const statusColor =
                status === 'Approved'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : status === 'Rejected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : status === 'Pending Exam'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

              const statusLabel =
                status === 'Approved'
                  ? 'অনুমোদিত (৭ দিন সক্রিয়)'
                  : status === 'Rejected'
                  ? 'বাতিল'
                  : status === 'Pending Exam'
                  ? '১ম পরীক্ষা বাকি ⏳'
                  : status === 'Pending Review'
                  ? 'পর্যালোচনাধীন ⏳'
                  : 'অপেক্ষমাণ';

              return (
                <div
                  key={h.id || i}
                  className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/70 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        {name}
                      </p>
                      {dateStr && (
                        <p className="text-[10px] text-neutral-500">
                          {dateStr}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. Benefits Section (Clean & Flat) ── */}
      <div className={cardClass}>
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">
          রেফারেল প্রোগ্রামের সুবিধা
        </span>

        <div className="space-y-2">
          {[
            {
              num: '১',
              title: 'বন্ধুর জন্য ১৫ দিন সম্পূর্ণ ফ্রি প্রো',
              desc: 'তোমার রেফারেল কোড দিয়ে যুক্ত হলেই তোমার বন্ধু পাবে ১৫ দিনের সম্পূর্ণ প্রো প্রিমিয়াম সাবস্ক্রিপশন।',
            },
            {
              num: '২',
              title: 'তোমার জন্য প্রতি রেফারে ৭ দিন ফ্রি প্রো',
              desc: 'যেকোনো বন্ধু তোমার রেফারেল কোড সফলভাবে ব্যবহার করলে তোমার অ্যাকাউন্টে ৭ দিন প্রো সাবস্ক্রিপশন যোগ হবে।',
            },
            {
              num: '৩',
              title: 'প্রতি ৩ রেফারে ১টি স্ক্র্যাচ কার্ড',
              desc: 'প্রতি ৩ জন বন্ধুকে যুক্ত করলেই তুমি পাবে একটি স্ক্র্যাচ কার্ড, যেখান থেকে পেতে পারো অতিরিক্ত ফ্রি প্রিমিয়াম!',
            },
            {
              num: '৪',
              title: 'মাসিক লিডারবোর্ড ও আকর্ষণীয় পুরস্কার',
              desc: 'শীর্ষ রেফারারদের জন্য রয়েছে মেগা গিফট বক্স, স্পেশাল টি-শার্ট ও অনন্য ব্যাজ!',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/70 flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scratch Card Modal */}
      {activeScratchCardId && (
        <ScratchCardModal
          cardId={activeScratchCardId}
          onClose={() => setActiveScratchCardId(null)}
          onScratched={() => {
            loadReferralData();
          }}
        />
      )}

      {/* Celebration Modal */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowCelebrationModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#13151F] rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-300 dark:border-amber-500/40 z-10 text-center animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <X size={18} />
            </button>

            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-3 animate-bounce">
              <Crown className="w-8 h-8 text-white drop-shadow-md" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2.5">
              <Sparkles size={14} className="text-emerald-500" />
              <span>১৫ দিনের প্রো প্রিমিয়াম সক্রিয় 👑</span>
            </div>

            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-1.5">
              অভিনন্দন! 🎉
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
              রেফারেল কোড ব্যবহারের জন্য তোমার অ্যাকাউন্টে <strong className="text-amber-600 dark:text-amber-400">১৫ দিনের সম্পূর্ণ প্রো সাবস্ক্রিপশন</strong> যুক্ত করা হয়েছে!
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowCelebrationModal(false);
                  router.push('/setup');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
              >
                <Zap size={16} />
                <span>পরীক্ষা শুরু করো</span>
              </button>

              <button
                onClick={() => {
                  setShowCelebrationModal(false);
                  router.push('/subscription');
                }}
                className="w-full py-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition"
              >
                সাবস্ক্রিপশন স্টেটাস দেখো
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralView;
