'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Headphones,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || searchParams.get('status');

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#18181B] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-8 text-center relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 dark:bg-amber-500/15 blur-3xl pointer-events-none -z-1" />

        {/* Warning/Cancel Icon */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <AlertTriangle className="w-10 h-10 stroke-[2.2]" />
          </div>
        </div>

        {/* Title */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          পেমেন্ট প্রক্রিয়া অসম্পূর্ণ
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
          পেমেন্ট সম্পন্ন হয়নি
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto mb-6 leading-relaxed">
          আপনি প্রক্রিয়াটি বাতিল করেছেন অথবা পেমেন্ট গেটওয়েতে কোনো সংযোগ বিঘ্ন ঘটেছে। আপনার অ্যাকাউন্ট থেকে কোনো টাকা কাটা হয়নি।
        </p>

        {reason && (
          <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-3 mb-5 text-xs text-neutral-500 dark:text-neutral-400">
            <span>বিবরণ: </span>
            <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
              {reason}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/subscription"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
            <span>আবার পেমেন্ট চেষ্টা করুন</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>ড্যাশবোর্ডে ফিরে যান</span>
            </Link>

            <a
              href="https://wa.me/8801409583992"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>সাপোর্ট হোয়াটসঅ্যাপ</span>
            </a>
          </div>
        </div>

        <p className="mt-5 text-[11px] text-neutral-400 dark:text-neutral-500">
          কোনো সমস্যায় পড়লে আমাদের হেল্পলাইন নম্বরে সরাসরি কল বা মেসেজ করতে পারেন: <a href="tel:+8801409583992" className="underline font-bold font-mono">01409583992</a>
        </p>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-sans">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
