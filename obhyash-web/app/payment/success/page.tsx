'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Crown,
  ArrowRight,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId =
    searchParams.get('invoice_id') ||
    searchParams.get('invoiceId') ||
    searchParams.get('trx') ||
    '';

  const [isVerifying, setIsVerifying] = useState<boolean>(Boolean(invoiceId));
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(6);
  const [planName, setPlanName] = useState<string>('প্রো সাবস্ক্রিপশন');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch (_) {}
  }, []);

  const verifyPayment = useCallback(
    async (retryCount = 0) => {
      if (!invoiceId) {
        // Legacy or direct link flow without invoice_id
        setIsVerifying(false);
        setIsVerified(true);
        triggerCelebration();
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/payment/uddoktapay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invoiceId }),
        });

        const data = await res.json();

        if (data.success && (data.verified || data.is_subscribed)) {
          setIsVerified(true);
          setIsVerifying(false);
          if (data.planName) setPlanName(data.planName);
          if (data.expiresAt) {
            const date = new Date(data.expiresAt);
            setExpiryDate(
              date.toLocaleDateString('bn-BD', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            );
          }
          triggerCelebration();
        } else if (
          retryCount < 2 &&
          (data.status === 'INITIATED' || data.status === 'PENDING' || !data.verified)
        ) {
          // Retry automatically after a short delay in case of gateway processing latency
          setTimeout(() => {
            verifyPayment(retryCount + 1);
          }, 2000);
        } else {
          setIsVerifying(false);
          // Fallback: query user's profile directly
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('subscription, subscription_expires_at, is_subscribed')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.is_subscribed) {
              setIsVerified(true);
              if (profile?.subscription?.plan || profile?.subscription?.plan_name) {
                setPlanName(profile.subscription.plan || profile.subscription.plan_name);
              }
              if (profile?.subscription_expires_at) {
                const date = new Date(profile.subscription_expires_at);
                setExpiryDate(
                  date.toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                );
              }
              triggerCelebration();
              return;
            }
          }

          setErrorMessage(
            data.message ||
              'পেমেন্ট এখনো সম্পন্ন বা শনাক্ত হয়নি। টাকা কেটে থাকলে অনুগ্রহ করে কিছুক্ষণ পর চেক করুন।',
          );
        }
      } catch (err: any) {
        console.error('[Payment Verification] Error:', err);
        if (retryCount < 1) {
          setTimeout(() => verifyPayment(retryCount + 1), 2000);
        } else {
          setIsVerifying(false);
          setErrorMessage('নেটওয়ার্ক সমস্যার কারণে ভেরিফিকেশন করা সম্ভব হয়নি।');
        }
      }
    },
    [invoiceId, triggerCelebration],
  );

  // Trigger verification on page load
  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  // Redirect Countdown only when verified
  useEffect(() => {
    if (!isVerified || isVerifying) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVerified, isVerifying]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#18181B] rounded-3xl border border-emerald-100 dark:border-emerald-950/80 shadow-2xl overflow-hidden p-6 sm:p-8 text-center relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl pointer-events-none -z-1" />

        {isVerifying ? (
          /* Verifying State */
          <div className="py-8 space-y-4">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Loader2 className="w-10 h-10 animate-spin stroke-[2.5]" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
              পেমেন্ট যাচাই করা হচ্ছে...
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              অনুগ্রহ করে অপেক্ষা করুন, UddoktaPay থেকে আপনার লেনদেন স্বয়ংক্রিয়ভাবে নিশ্চিত করা হচ্ছে।
            </p>
            {invoiceId && (
              <p className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 py-1.5 px-3 rounded-lg inline-block text-neutral-600 dark:text-neutral-300">
                Invoice: {invoiceId}
              </p>
            )}
          </div>
        ) : isVerified ? (
          /* Verified Success State */
          <>
            {/* Success Icon */}
            <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/80 animate-ping opacity-25" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md animate-bounce">
                <Crown className="w-4 h-4 fill-amber-950" />
              </div>
            </div>

            {/* Title */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              পেমেন্ট সফল ও সক্রিয় হয়েছে
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
              অভিনন্দন! আপনি এখন প্রো সদস্য 🎉
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto mb-6 leading-relaxed">
              আপনার পেমেন্ট সফলভাবে যাচাই করা হয়েছে। সকল প্রিমিয়াম ফিচার, আনলিমিটেড পরীক্ষা ও বিশ্লেষণ তাৎক্ষণিক চালু করা হয়েছে।
            </p>

            {/* Details Card */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>প্যাকেজ:</span>
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Crown className="w-3.5 h-3.5" />
                  {planName}
                </span>
              </div>
              {expiryDate && (
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span>মেয়াদ শেষ:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{expiryDate}</span>
                </div>
              )}
              {invoiceId && (
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  <span>ইনভয়েস আইডি:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                    {invoiceId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>স্ট্যাটাস:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  সক্রিয় (Active)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Link
                href="/dashboard"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/subscription"
                  className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>সাবস্ক্রিপশন পেজ</span>
                </Link>
                <Link
                  href="/question-bank"
                  className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>প্রশ্নব্যাংক প্র্যাকটিস</span>
                </Link>
              </div>
            </div>

            {/* Auto Redirect Countdown */}
            <p className="mt-5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {countdown}
              </span>{' '}
              সেকেন্ডের মধ্যে স্বয়ংক্রিয়ভাবে ড্যাশবোর্ডে রিডাইরেক্ট করা হবে...
            </p>
          </>
        ) : (
          /* Unverified / Pending Error State */
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              পেমেন্ট নিশ্চিতকরণ অপেক্ষমাণ
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              {errorMessage ||
                'পেমেন্টটি এখনো গেটওয়েতে প্রক্রিয়াধীন থাকতে পারে। যদি আপনার অ্যাকাউন্ট থেকে টাকা কেটে গিয়ে থাকে, তবে সাধারণত কয়েক মিনিটের মধ্যেই তা স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।'}
            </p>

            {invoiceId && (
              <div className="bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-xl text-xs font-mono text-neutral-700 dark:text-neutral-300">
                Invoice ID: {invoiceId}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={() => verifyPayment(0)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় যাচাই করুন (Check Again)</span>
              </button>

              <a
                href={`https://wa.me/8801409583992?text=${encodeURIComponent(
                  `আমার UddoktaPay পেমেন্ট ভেরিফাই হচ্ছে না। ইনভয়েস আইডি: ${invoiceId}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপ সাপোর্টে সহায়তা নিন</span>
              </a>

              <Link
                href="/dashboard"
                className="block text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 pt-2"
              >
                ড্যাশবোর্ডে ফিরে যান
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-sans">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
