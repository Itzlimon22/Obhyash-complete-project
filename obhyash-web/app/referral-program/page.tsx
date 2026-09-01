'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Share2,
  Users,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Lock,
  Award,
  BookOpen,
  Laptop,
} from 'lucide-react';

export default function ReferralProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'আমি কীভাবে আমার রেফারেল কোড বা লিংক পাব?',
      a: 'অভ্যাসে লগইন করার পর তোমার স্টুডেন্ট ড্যাশবোর্ডে "রেফারেল ও রিওয়ার্ডস" ট্যাবে যাও। সেখানে তোমার ইউনিক রেফারেল কোড এবং ওয়ান-ক্লিক কপি লিংক পেয়ে যাবে।',
    },
    {
      q: 'আমার রেফারেল কোড ব্যবহার করে বন্ধু কী সুবিধা পাবে?',
      a: 'তোমার রেফারেল কোড ব্যবহার করে যেকোনো নতুন শিক্ষার্থী সাইনআপ করলে বা কোড রিডিম করলে সে সাথে সাথে ১ মাসের সম্পূর্ণ ফ্রি প্রো (Pro) প্রিমিয়াম অ্যাক্সেস পেয়ে যাবে।',
    },
    {
      q: 'রেফারকারী হিসেবে আমি কী রিওয়ার্ড পাব?',
      a: 'প্রতিটি সফল রেফারেলের জন্য তুমি পাবে একটি সারপ্রাইজ স্ক্র্যাচ কার্ড (Scratch Card), প্রো মেম্বারশিপ ডেজ এবং ন্যাশনাল রেফারেল লিডারবোর্ডে পয়েন্ট। স্ক্র্যাচ কার্ড ঘষে আকর্ষণীয় সব রিওয়ার্ড আনলক করতে পারবে।',
    },
    {
      q: 'আমি কতজন বন্ধুকে রেফার করতে পারব? কোনো লিমিট আছে কি?',
      a: 'না, কোনো সর্বোচ্চ সীমা নেই! তুমি যত খুশি বন্ধু ও সহপাঠীকে আমন্ত্রণ জানাতে পারবে এবং আনলিমিটেড স্ক্র্যাচ কার্ড ও প্রিমিয়াম মেয়াদ অর্জন করতে পারবে।',
    },
    {
      q: 'রেফারেল প্রোগ্রামের নীতিমালা ও ফেয়ার-ইউজ পলিসি কী?',
      a: 'নিজের অ্যাকাউন্টে নিজের কোড ব্যবহার করা যাবে না। প্রতিটি নতুন একাউন্ট কেবল একবারই রেফারেল কোড ব্যবহার করতে পারবে। ফেক বা স্প্যামিং রোধে সিস্টেমে স্বয়ংক্রিয় সিকিউরিটি গার্ড ও রেট-লিমিট সক্রিয় রয়েছে।',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#004633]/20">
      {/* ── Top Navigation Header ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#004633] text-white flex items-center justify-center font-black text-base shadow-sm">
              অ
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
                OBHYASH
              </span>
              <span className="text-xl font-black text-[#004633] dark:text-emerald-400 leading-none mt-0.5">
                অভ্যাস
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:text-[#004633] dark:hover:text-emerald-400 transition-colors"
            >
              লগইন
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#004633]/20 transition-all hover:scale-105"
            >
              ফ্রি রেজিস্ট্রেশন
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80">
        {/* Subtle Brand Background Glows */}
        <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-96 h-96 bg-[#004633]/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 -translate-y-1/2 w-96 h-96 bg-red-600/5 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#004633]/10 dark:bg-emerald-950/50 border border-[#004633]/20 dark:border-emerald-800/50 text-[#004633] dark:text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-[#004633] dark:text-emerald-400" />
            <span>অভ্যাস রেফারেল ও রিওয়ার্ডস প্রোগ্রাম</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.25]">
            বন্ধুকে আমন্ত্রণ জানাও — <br />
            <span className="text-[#004633] dark:text-emerald-400">
              দুজনেই উপভোগ করো এক্সক্লুসিভ রিওয়ার্ড!
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            তোমার ইউনিক রেফারেল লিংক দিয়ে কোনো বন্ধু যুক্ত হলে সে পাবে <strong className="text-neutral-900 dark:text-white font-bold">১ মাসের ফ্রি প্রো সাবস্ক্রিপশন</strong>, আর তোমার অ্যাকাউন্টে যোগ হবে <strong className="text-neutral-900 dark:text-white font-bold">সারপ্রাইজ স্ক্র্যাচ কার্ড</strong> ও আনলিমিটেড প্রিমিয়াম সুবিধা।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#004633]/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>রেফারেল শুরু করো</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl font-bold text-sm transition-all"
            >
              কীভাবে কাজ করে দেখো
            </a>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-8 border-t border-neutral-200/80 dark:border-neutral-800">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-[#004633] dark:text-emerald-400">১ মাস</div>
              <div className="text-[11px] text-neutral-500 font-semibold mt-0.5">বন্ধুর জন্য ফ্রি প্রো</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">🎁 কার্ড</div>
              <div className="text-[11px] text-neutral-500 font-semibold mt-0.5">প্রতি রেফারেলে স্ক্র্যাচ</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">আনলিমিটেড</div>
              <div className="text-[11px] text-neutral-500 font-semibold mt-0.5">রেফারেল আর্নিং সীমা</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dual Benefit Breakdown ── */}
      <section className="py-16 lg:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            উভয়ের জন্যই লাভ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            রেফারেল প্রোগ্রামে কে কী পাচ্ছে?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            শুধু তুমি একাই নও, তোমার মাধ্যমে যুক্ত হওয়া বন্ধুও সাথে সাথে পুরস্কৃত হবে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Box 1: Referrer Benefits */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-lg shadow-emerald-500/5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#004633] text-white flex items-center justify-center font-bold text-xl shadow-md">
                  🎁
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#004633] dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-[#004633]/20 dark:border-emerald-800/40">
                  তোমার জন্য (Referrer)
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  নিশ্চিত স্ক্র্যাচ কার্ড ও প্রিমিয়াম এক্সটেনশন
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  তোমার কোড দিয়ে কোনো বন্ধু সাইনআপ করলেই তোমার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে রিওয়ার্ড যোগ হবে।
                </p>
              </div>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>প্রতি রেফারেলে স্ক্র্যাচ কার্ড:</strong> কার্ড ঘষে জিতে নাও এক্সক্লুসিভ প্রো প্রিমিয়াম প্যাকেজ ও মেম্বারশিপ।</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>টিয়ার আনলক ও ব্যাজ:</strong> ৫, ১০ ও ২৫টি রেফারেলে বিশেষ সিলভার, গোল্ড ও লিজেন্ডারি ব্যাজ।</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>ন্যাশনাল লিডারবোর্ড র‍্যাংক:</strong> সেরা রেফারারদের তালিকায় নিজের নাম ও ইনস্টিটিউট তুলে ধরো।</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/login"
                className="w-full py-2.5 bg-[#004633] hover:bg-[#003828] text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>ড্যাশবোর্ড থেকে রেফারেল লিংক নাও</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Box 2: Invitee / Friend Benefits */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-red-200/80 dark:border-red-900/40 shadow-lg shadow-red-500/5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  ✨
                </div>
                <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-black uppercase tracking-wider border border-red-200 dark:border-red-900/40">
                  তোমার বন্ধুর জন্য (Friend)
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  ১ মাসের সম্পূর্ণ ফ্রি প্রো প্রিমিয়াম
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  তোমার লিংকের মাধ্যমে যুক্ত হয়ে রেজিস্ট্রেশন করলেই কোনো খরচ ছাড়াই ১ মাসের প্রিমিয়াম এক্টিভ।
                </p>
              </div>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>আনলিমিটেড মডেল টেস্ট ও এক্সাম:</strong> অধ্যায়ভিত্তিক ও সমন্বিত সব প্রশ্ন ও পরীক্ষা আনলক।</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>পাঠ্যবই রেফারেন্স সহ সমাধান:</strong> মূল পাঠ্যবই ও সম্মানিত লেখকদের রেফারেন্স সমৃদ্ধ এক্সপ্ল্যানেশন।</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span><strong>অফলাইন ২-কলাম PDF প্রিন্ট:</strong> যেকোনো পরীক্ষার প্রশ্ন ও উত্তরপত্র এক ক্লিকে ডাউনলোড।</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/signup"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>নতুন অ্যাকাউন্ট খুলো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step-by-Step Instructions ── */}
      <section id="how-it-works" className="py-16 bg-neutral-100/70 dark:bg-neutral-900/40 border-y border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-[#004633] dark:text-emerald-400 uppercase tracking-wider">
              সহজ ৪টি ধাপ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              কীভাবে রেফারেল সম্পন্ন করবে?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              মাত্র কয়েক ক্লিকেই তোমার বন্ধুদের সাথে যুক্ত হও এবং রিওয়ার্ড আনলক করো।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#004633] text-white flex items-center justify-center font-black text-sm">
                ১
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                কোড বা লিংক সংগ্রহ
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                লগইন করে ড্যাশবোর্ড থেকে তোমার ব্যক্তিগত রেফারেল কোড বা লিংক কপি করে নাও।
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">
                ২
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                বন্ধুদের সাথে শেয়ার
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                মেসেঞ্জার, হোয়াটসঅ্যাপ, ফেসবুক বা সহপাঠীদের মেসেজ করে লিংকটি পাঠিয়ে দাও।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#004633] text-white flex items-center justify-center font-black text-sm">
                ৩
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                বন্ধু যুক্ত হওয়া ও ক্লেইম
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                বন্ধু সাইনআপ করার সাথে সাথে অথবা কোড রিডিম করলেই পাবে ১ মাসের ফ্রি প্রো।
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                ৪
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                স্ক্র্যাচ কার্ড ও উপহার
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                তোমার ড্যাশবোর্ডে সারপ্রাইজ স্ক্র্যাচ কার্ড জমা হবে। কার্ড ঘষে জিতে নাও উপহার!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Milestones & Reward Tiers ── */}
      <section className="py-16 lg:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            লেভেল ও ব্যাজ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            রেফারেল মাইলস্টোন ও রিওয়ার্ড টিয়ার
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            যত বেশি বন্ধু যুক্ত করবে, তত বড় বড় স্পেশাল গিফট প্যাক আনলক হবে।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2 text-left">
            <div className="text-2xl">🥉</div>
            <div className="text-xs font-black text-neutral-500 uppercase tracking-wide">১-৪ জন রেফারেল</div>
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">ব্রোঞ্জ টিয়ার</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">প্রতিটি রেফারেলে ইনস্ট্যান্ট স্ক্র্যাচ কার্ড ও রিওয়ার্ড।</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2 text-left">
            <div className="text-2xl">🥈</div>
            <div className="text-xs font-black text-neutral-500 uppercase tracking-wide">৫-৯ জন রেফারেল</div>
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">সিলভার টিয়ার</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">সিলভার রেফারার ব্যাজ + ৩ মাসের ফ্রি প্রো এক্সটেনশন।</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2 text-left">
            <div className="text-2xl">🥇</div>
            <div className="text-xs font-black text-neutral-500 uppercase tracking-wide">১০-২৪ জন রেফারেল</div>
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">গোল্ড টিয়ার</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">গোল্ডেন ব্যাজ + ৬ মাসের মেম্বারশিপ ও বোনাস পয়েন্ট।</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-[#004633]/30 dark:border-emerald-800/60 shadow-xs space-y-2 text-left bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-neutral-900">
            <div className="text-2xl">👑</div>
            <div className="text-xs font-black text-[#004633] dark:text-emerald-400 uppercase tracking-wide">২৫+ জন রেফারেল</div>
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">লিজেন্ড টিয়ার</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">আজীবন প্রিমিয়াম প্রায়োরিটি ও ন্যাশনাল ট্রফি সম্মাননা।</p>
          </div>
        </div>
      </section>

      {/* ── Fair Usage & Security Section ── */}
      <section className="py-12 bg-neutral-50 dark:bg-neutral-950 border-y border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#004633]/10 text-[#004633] dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                ন্যায্য ব্যবহার নীতি ও নিরাপত্তা নির্দেশিকা
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                অভ্যাসের রেফারেল প্রোগ্রামটি প্রকৃত শিক্ষার্থীদের সহযোগিতার জন্য প্রণীত। নিজের ডিভাইসে ফেক অ্যাকাউন্ট তৈরি করে নিজের কোড ব্যবহার করা বা অনৈতিক উপায় অবলম্বন করা সম্পূর্ণ নিষিদ্ধ। সিস্টেম স্বয়ংক্রিয়ভাবে ভেরিফিকেশন করে এবং নিয়ম লঙ্ঘনে রেফারেল সুবিধা স্থগিত করা হতে পারে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            রেফারেল প্রোগ্রাম সম্পর্কে সাধারণ কিছু প্রশ্নের উত্তর
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-neutral-900 ${
                  isOpen
                    ? 'border-[#004633]/40 dark:border-emerald-600/40 shadow-sm'
                    : 'border-neutral-200/80 dark:border-neutral-800'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                    <span className="text-[#004633] dark:text-emerald-400 font-mono font-bold">Q.</span>
                    {faq.q}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#004633] dark:text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-14 bg-gradient-to-br from-[#004633]/10 via-white to-red-500/10 dark:from-[#004633]/20 dark:via-black dark:to-red-950/20 border-t border-neutral-200 dark:border-neutral-800 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="w-12 h-12 bg-[#004633] text-white rounded-2xl flex items-center justify-center mx-auto text-xl shadow-md">
            🎁
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            আজই বন্ধুদের আমন্ত্রণ জানিয়ে শুরু করো
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            তোমার সহপাঠীদের সাথে অভ্যাসের সেরা প্রস্তুতি শেয়ার করো এবং একসাথে মেম্বারশিপ উপভোগ করো।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#004633]/20 transition-all hover:scale-105"
            >
              লগইন করে রেফারেল ড্যাশবোর্ডে যাও
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl font-bold text-xs sm:text-sm transition-all"
            >
              নতুন অ্যাকাউন্ট তৈরি করো
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-neutral-50 dark:bg-neutral-950 py-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Obhyash Platform. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
}
