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
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import ScratchCardModal from './ScratchCardModal';

interface ReferralHistoryItem {
  id: string;
  redeemed_at: string;
  admin_status: 'Approved' | 'Rejected' | 'Pending';
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

export const ReferralView: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [scratchCards, setScratchCards] = useState<ScratchCardItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);

  // Claim Code & Lockout State
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasUsedReferral, setHasUsedReferral] = useState(true);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [activeScratchCardId, setActiveScratchCardId] = useState<string | null>(null);

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

  const loadReferralData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // 1. Check if user has already redeemed a referral code
      try {
        const { data: usedCheck } = await supabase
          .from('referral_history')
          .select('id')
          .eq('redeemed_by', user.id)
          .maybeSingle();

        setHasUsedReferral(!!usedCheck);
      } catch (e) {
        console.warn('usedCheck error:', e);
      }

      // 2. Check attempt status & lockout via RPC or direct log
      try {
        const { data: statusRes } = await supabase.rpc(
          'get_referral_attempt_status',
          { p_user_id: user.id }
        );
        if (statusRes && typeof statusRes === 'object') {
          const rem = (statusRes.remaining_attempts as number) ?? 3;
          setRemainingAttempts(rem);
          const lockSec = (statusRes.lock_seconds as number) ?? 0;
          if (lockSec > 0) {
            startLockoutTimer(lockSec);
          }
        }
      } catch (_) {}

      // 3. Fetch data from /api/referral/me
      const res = await fetch('/api/referral/me');
      if (res.ok) {
        const json = await res.json();
        if (json.referral?.code) {
          setCode(json.referral.code);
        }
        if (json.history) {
          setHistory(json.history);
        }
        if (typeof json.totalApproved === 'number') {
          setTotalReferrals(json.totalApproved);
        }
        if (json.scratchCards) {
          setScratchCards(json.scratchCards);
        }
      }

      // 4. Fetch leaderboard from /api/referral/leaderboard
      try {
        const lbRes = await fetch('/api/referral/leaderboard');
        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          if (Array.isArray(lbJson.leaderboard)) {
            setLeaderboard(lbJson.leaderboard);
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  const handleClaimReferral = async () => {
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
      const res = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: input }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(
          json.message || 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! 🎉'
        );
        setClaimCodeInput('');
        setHasUsedReferral(true);
        setRemainingAttempts(3);
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
    } catch (err: any) {
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
    const text = `অভ্যাস অ্যাপে আমার রেফারেল কোড ব্যবহার করে ফ্রি তে পাও ১ মাসের প্রিমিয়াম সাবস্ক্রিপশন! 🎉\n\nরেফারেল কোড: ${code}\n\nএখানে রেজিস্টার করো: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'অভ্যাস অ্যাপ - ১ মাসের ফ্রি প্রিমিয়াম রেফারেল কোড',
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

  const cardContainerClass =
    'bg-white dark:bg-[#18181B] rounded-[20px] p-5 sm:p-6 border border-[#E5E5E5] dark:border-[#1C1C1E] shadow-2xs mb-5';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#B91C1C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Hero Banner (1:1 with Flutter) ── */}
      <div className="p-5 sm:p-6 rounded-[20px] bg-gradient-to-br from-[#B91C1C] to-[#BE123C] text-white text-center shadow-lg shadow-[#B91C1C]/20 mb-5">
        <h2 className="text-lg sm:text-xl font-black leading-snug">
          বন্ধুদের আমন্ত্রণ জানাও,
          <br />
          প্রতি ৩ রেফারে পাও একটি স্ক্র্যাচ কার্ড!
        </h2>
      </div>

      {/* ── 2. Claim Friend's Referral Code Card (If not used yet) ── */}
      {!hasUsedReferral && (
        <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-5 sm:p-6 border border-[#A7F3D0] dark:border-[#059669]/30 shadow-2xs mb-5">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 flex items-center justify-center text-[#059669] shrink-0">
              <Gift className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                বন্ধুর রেফারেল কোড ক্লেইম করো
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                ১ মাসের ফ্রি প্রিমিয়াম উপভোগ করো
              </p>
            </div>
          </div>

          {/* Lockout Banner */}
          {lockoutSeconds > 0 ? (
            <div className="p-3 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ৩ বার ভুল কোড দেওয়ায় ইনপুট লক করা হয়েছে। আর{' '}
                {Math.floor(lockoutSeconds / 60)}:
                {(lockoutSeconds % 60).toString().padStart(2, '0')} মিনিট অপেক্ষা করো।
              </span>
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              ⚠️ সর্বোচ্চ ৩ বার ভুল কোড দেওয়া যাবে (অবশিষ্ট: {remainingAttempts} টি চেষ্টা)
            </p>
          )}

          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={claimCodeInput}
              onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
              disabled={lockoutSeconds > 0 || isClaiming}
              placeholder="CODE1234"
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm font-mono font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:border-[#059669]"
            />
            <button
              type="button"
              onClick={handleClaimReferral}
              disabled={lockoutSeconds > 0 || isClaiming}
              className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isClaiming && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>ক্লেইম করো</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Referral Code Card (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 block mb-2.5">
          তোমার রেফারেল কোড
        </span>

        {/* Code container */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] flex items-center justify-between gap-3 mb-3">
          <span className="text-lg sm:text-xl font-mono font-extrabold tracking-widest text-neutral-900 dark:text-white truncate">
            {code || '— — — — — — — —'}
          </span>

          <button
            type="button"
            onClick={copyCode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCopied
                ? 'bg-[#059669] text-white'
                : 'bg-neutral-200 dark:bg-[#27272A] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
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

        {/* Share Button */}
        <button
          type="button"
          onClick={shareCode}
          className="w-full py-3 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B91C1C]/20 active:scale-[0.99] cursor-pointer"
        >
          <Share2 className="w-4.5 h-4.5" />
          <span>বন্ধুদের সাথে শেয়ার করো</span>
        </button>
      </div>

      {/* ── 4. Scratch Card Progress Section ── */}
      <div className={cardContainerClass}>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            স্ক্র্যাচ কার্ড প্রগ্রেস
          </h3>
          <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900/50">
            {totalReferrals} / {nextMilestone}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-2.5">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent === 0 && totalReferrals > 0 && totalReferrals % 3 === 0 ? 100 : progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          {needed === 3 && totalReferrals > 0
            ? '🎉 অভিনন্দন! আপনি একটি নতুন স্ক্র্যাচ কার্ড পেয়েছেন!'
            : `আর মাত্র ${needed} টি সফল রেফারেল করলে পাবেন একটি স্ক্র্যাচ কার্ড!`}
        </p>
      </div>

      {/* ── 5. Scratch Cards Grid ── */}
      {scratchCards.length > 0 && (
        <div className="mb-5">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-3">
            আপনার স্ক্র্যাচ কার্ডসমূহ
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {scratchCards.map((card) => {
              const isScratched = card.is_scratched;

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (!isScratched) setActiveScratchCardId(card.id);
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isScratched
                      ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 cursor-default opacity-80'
                      : 'bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white border-amber-300 shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-2">
                    {isScratched ? (
                      <CheckCircle2 className="w-8 h-8 text-neutral-500 mb-1.5" />
                    ) : (
                      <Gift className="w-8 h-8 text-white mb-1.5 animate-pulse" />
                    )}
                    <span className="text-xs sm:text-sm font-bold">
                      {isScratched ? 'ব্যবহৃত' : 'খুলতে ক্লিক করুন'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Leaderboard Section (1:1 with Flutter) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[24px] border border-[#E5E5E5] dark:border-[#1C1C1E] shadow-2xs overflow-hidden mb-5">
        <div className="p-5 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-[#FDE047]" />
            <h3 className="text-lg sm:text-xl font-bold">
              এই মাসের সেরা রেফারার
            </h3>
          </div>
          <p className="text-xs text-rose-100 mt-1">
            সবচেয়ে বেশি বন্ধুদের ইনভাইট করুন এবং জিতে নিন দারুণ সব পুরস্কার!
          </p>
        </div>

        <div className="p-4 sm:p-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {leaderboard.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              এখনও কেউ লিডারবোর্ডে যুক্ত হয়নি। রেফার করে প্রথম স্থান দখল করো!
            </p>
          ) : (
            leaderboard.map((u, idx) => {
              const rank = idx + 1;
              const prize =
                rank === 1
                  ? 'টি-শার্ট + ১০০০ টাকা'
                  : rank === 2
                  ? 'টি-শার্ট + ৫০০ টাকা'
                  : rank === 3
                  ? 'টি-শার্ট + ১০০ টাকা'
                  : 'টি-শার্ট';

              return (
                <div
                  key={u.id || idx}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center font-bold text-sm">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {u.name || 'শিক্ষার্থী'}
                      </p>
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        🏆 {prize}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                    {u.total_referrals} রেফার
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 7. How It Works (1:1 with Flutter 3 Steps) ── */}
      <div className={cardContainerClass}>
        <h3 className="text-sm font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
          কীভাবে শুরু করবে?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] text-center">
            <div className="text-2xl mb-1.5">🔗</div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              কোড কপি করো
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              ওপরের কোডটি কপি করো।
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] text-center">
            <div className="text-2xl mb-1.5">📤</div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              শেয়ার করো
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              বন্ধুদের পাঠাও।
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] text-center">
            <div className="text-2xl mb-1.5">🎉</div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              পুরস্কার পাও
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              বন্ধু পাবে প্রিমিয়াম, তুমি পাবে কার্ড।
            </p>
          </div>
        </div>
      </div>

      {/* ── 8. Referral History ── */}
      {history.length > 0 && (
        <div className={cardContainerClass}>
          <div className="flex items-center gap-2 mb-3.5">
            <Users className="w-4 h-4 text-neutral-500" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
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
                  ? 'bg-emerald-50 text-[#059669] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50'
                  : status === 'Rejected'
                  ? 'bg-red-50 text-[#B91C1C] border-red-200 dark:bg-red-950/40 dark:border-red-900/50'
                  : 'bg-blue-50 text-[#1E3A8A] border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50';

              const statusLabel =
                status === 'Approved'
                  ? 'অনুমোদিত'
                  : status === 'Rejected'
                  ? 'বাতিল'
                  : 'অপেক্ষমান';

              return (
                <div
                  key={h.id || i}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#B91C1C]/15 text-[#B91C1C] font-bold flex items-center justify-center shrink-0">
                      {name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {name}
                      </p>
                      {dateStr && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {dateStr}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 9. Benefits Section (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
          রেফারেল প্রোগ্রামের সুবিধা
        </h3>

        <div className="space-y-2.5">
          {[
            {
              num: '১',
              title: 'বন্ধুর জন্য ১ মাস ফ্রি প্রিমিয়াম',
              desc: 'তোমার রেফারেল কোড দিয়ে যুক্ত হলেই তোমার বন্ধু পাবে ১ মাসের প্রিমিয়াম সম্পূর্ণ ফ্রি।',
            },
            {
              num: '২',
              title: 'তোমার জন্য স্ক্র্যাচ কার্ড',
              desc: 'প্রতি ৩ জন বন্ধুকে সফলভাবে যুক্ত করলে তুমি পাবে একটি স্ক্র্যাচ কার্ড, যেখানে থাকতে পারে ফ্রি প্রিমিয়াম।',
            },
            {
              num: '৩',
              title: 'আনলিমিটেড রেফারেল',
              desc: 'যত বেশি বন্ধুকে ইনভাইট করবে, তত বেশি স্ক্র্যাচ কার্ড জেতার সুযোগ পাবে।',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/50 text-[#B91C1C] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
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
    </div>
  );
};

export default ReferralView;
