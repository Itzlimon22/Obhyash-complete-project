'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, Scale } from 'lucide-react';

export default function TermsPage() {
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
          </Link> It's likely that your database has an automated trigger that creates a blank user profile immediately upon Google authentication. 
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
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            ব্যবহারের শর্তাবলী
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Obhyash প্ল্যাটফর্ম ব্যবহার করার পূর্বে দয়া করে এই শর্তাবলী মনোযোগ
            সহকারে পড়ুন। আমাদের সেবা গ্রহণ করার মাধ্যমে আপনি এই শর্তাবলীর সাথে
            একমত পোষণ করছেন।
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
              শর্তাবলী গ্রহণ (Acceptance of Terms)
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                Obhyash অ্যাপ বা ওয়েবসাইট ব্যবহার করে একাউন্ট তৈরি বা
                সাবস্ক্রিপশন কেনার মাধ্যমে আপনি আমাদের এই &ldquo;Terms of
                Service&rdquo; এবং &ldquo;Privacy Policy&rdquo;-র সাথে আইনিভাবে
                চুক্তিবদ্ধ হচ্ছেন। আপনি যদি এই শর্তাবলীর কোনো অংশের সাথে দ্বিমত
                পোষণ করেন, তবে অনুগহ করে আমাদের সেবা ব্যবহার থেকে বিরত থাকুন।
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ২
              </span>
              একাউন্ট ও নিরাপত্তা (User Accounts)
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                আমাদের সেবা পুরোপুরি ব্যবহার করার জন্য আপনাকে একটি একাউন্ট তৈরি
                করতে হবে।
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  আপনি যেসব তথ্য প্রদান করবেন (যেমন নাম, ইমেইল) তা অবশ্যই সঠিক
                  এবং হালনাগাদ হতে হবে।
                </li>
                <li>
                  আপনার একাউন্টের পাসওয়ার্ড এবং নিরাপত্তার দায়ভার সম্পূর্ণ
                  আপনার। কারো সাথে পাসওয়ার্ড শেয়ার করা নিষিদ্ধ।
                </li>
                <li>
                  একই একাউন্ট একাধিক ব্যক্তি ব্যবহার করা আমাদের নীতিমালার
                  পরিপন্থী এবং এর ফলে একাউন্ট বাতিল হতে পারে।
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৩
              </span>
              মেধাস্বত্ব (Intellectual Property)
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                Obhyash এ প্রদর্শিত সকল কন্টেন্ট (প্রশ্ন, সমাধান, লোগো,
                গ্রাফিক্স, কোড) Obhyash কর্তৃপক্ষের মেধাস্বত্ব বা লাইসেন্সকৃত।
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  আমাদের কন্টেন্ট কপি করা, পুনরায় বিক্রি করা বা অনুমতি ছাড়া অন্য
                  কোথাও প্রকাশ করা সম্পূর্ণ নিষিদ্ধ।
                </li>
                <li>
                  ব্যক্তিগত পড়াশোনার কাজে আপনি এটি ব্যবহার করতে পারেন, কিন্তু
                  বাণিজ্যিক উদ্দেশ্যে নয়।
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৪
              </span>
              সাবস্ক্রিপশন ও পেমেন্ট (Payments)
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>আমাদের কিছু সেবা প্রিমিয়াম সাবস্ক্রিপশনের অন্তর্ভুক্ত।</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই আপনার একাউন্টে ফিচারগুলো চালু
                  হয়ে যাবে।
                </li>
                <li>
                  সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার পর অটো-রিনিউ হবে না, আপনাকে
                  নতুন করে কিনতে হবে।
                </li>
                <li>
                  মূল্য যেকোনো সময় পরিবর্তনের অধিকার Obhyash কর্তৃপক্ষ সংরক্ষণ
                  করে।
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-bold">
                ৫
              </span>
              একাউন্ট বাতিল (Termination)
            </h2>
            <div className="pl-11 prose dark:prose-invert prose-slate max-w-none">
              <p>
                আমরা যেকোনো সময় নোটিশ দিয়ে বা নোটিশ ছাড়াই আপনার একাউন্ট স্থগিত
                বা বাতিল করার অধিকার রাখি যদি:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>আপনি এই ব্যবহারের শর্তাবলী লঙ্ঘন করেন।</li>
                <li>প্লাটফর্মের নিরাপত্তার জন্য হুমকি হয় এমন কোনো কাজ করেন।</li>
              </ul>
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
