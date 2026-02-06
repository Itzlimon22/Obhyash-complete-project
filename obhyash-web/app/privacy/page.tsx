'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-rose-500/20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-rose-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-600 to-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-serif-exam">
              অভ্যাস
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম-এ ফিরে যান
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-white dark:bg-slate-900 border-b border-rose-100 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 to-transparent dark:from-rose-900/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            গোপনীয়তা নীতি (Privacy Policy)
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            আপনার তথ্যের সুরক্ষা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। আমরা কীভাবে
            আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা বিস্তারিত এখানে
            আলোচনা করা হলো।
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ১
              </span>
              আমরা কী তথ্য সংগ্রহ করি?
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                সেবা প্রদানের লক্ষে আমরা নিম্নলিখিত তথ্যগুলো সংগ্রহ করতে পারি:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>ব্যক্তিগত তথ্য:</strong> নাম, ইমেইল ঠিকানা, ফোন
                  নাম্বার (যা আপনি রেজিস্ট্রেশনের সময় প্রদান করেন)।
                </li>
                <li>
                  <strong>একাডেমিক তথ্য:</strong> আপনি কোন ক্লাসে পড়েন, কোন
                  গ্রুপ, এবং আপনার পরীক্ষার ফলাফল।
                </li>
                <li>
                  <strong>ব্যবহারের তথ্য:</strong> আপনি কখন লগইন করছেন, কোন
                  ফিচারগুলো ব্যবহার করছেন (এনালাইটিক্স-এর জন্য)।
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ২
              </span>
              আপনার তথ্য কীভাবে ব্যবহার করা হয়?
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>আপনার একাউন্ট তৈরি ও পরিচালনা করতে।</li>
                <li>
                  AI-এর মাধ্যমে আপনার জন্য পারসোনালাইজড প্রশ্ন ও সাজেশন তৈরি
                  করতে।
                </li>
                <li>পরীক্ষার ফলাফল এবং লিডারবোর্ড আপডেট করতে।</li>
                <li>গুরুত্বপূর্ণ নোটিফিকেশন বা আপডেট জানাতে।</li>
              </ul>
              <p className="mt-4 font-semibold text-rose-600">
                ⚠️ আমরা কখনোই আপনার ব্যক্তিগত তথ্য তৃতীয় কোনো পক্ষের কাছে বিক্রি
                করি না।
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৩
              </span>
              তথ্য সুরক্ষা ও নিরাপত্তা
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                আপনার ডাটা সুরক্ষিত রাখতে আমরা ইন্ডাস্ট্রি-স্ট্যান্ডার্ড
                এনক্রিপশন (SSL) এবং নিরাপদ সার্ভার (Supabase) ব্যবহার করি।
                পাসওয়ার্ডগুলো এনক্রিপ্ট করে সংরক্ষণ করা হয়, তাই আমরা বা অন্য কেউ
                তা দেখতে পায় না।
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৪
              </span>
              তৃতীয় পক্ষের সেবা
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                আমাদের সেবাকে সচল রাখতে আমরা কিছু বিশ্বস্ত থার্ড-পার্টি সার্ভিস
                ব্যবহার করি (যেমন: Cloudflare R2 ইমেজ স্টোরেজের জন্য, Supabase
                অথেন্টিকেশনের জন্য)। তাদের নিজস্ব প্রাইভেসি পলিসি আমাদের থেকে
                ভিন্ন হতে পারে।
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৫
              </span>
              আপনার অধিকার
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                আপনি যেকোনো সময় আপনার প্রোফাইল তথ্য পরিবর্তন বা আপডেট করতে
                পারেন। যদি আপনি আপনার একাউন্ট এবং সমস্ত তথ্য মুছে ফেলতে চান, তবে
                আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন (support@obhyash.com)।
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 text-center">
            সর্বশেষ আপডেট: ০৪ ফেব্রুয়ারি, ২০২৬
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-8 border-t border-rose-100 dark:border-slate-800 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Obhyash Platform. All rights reserved.
      </footer>
    </div>
  );
}
