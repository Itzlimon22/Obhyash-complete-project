'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function RefundPage() {
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
            <RefreshCw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            রিফান্ড পলিসি
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Obhyash এর সাবস্ক্রিপশন এবং রিফান্ড সংক্রান্ত নিয়মাবলী নিচে
            পরিষ্কারভাবে উল্লেখ করা হলো।
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              সাধারণ রিফান্ড নিয়ম
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              যেহেতু Obhyash একটি ডিজিটাল সেবা প্রদান করে (Digital Good), তাই
              সাধারণত কোনো সাবস্ক্রিপশন ক্রয় করার পর তার জন্য{' '}
              <strong>কোনো রিফান্ড প্রদান করা হয় না</strong>। পেমেন্ট করার সাথে
              সাথেই আপনি প্রিমিয়াম ফিচারগুলোতে এক্সেস পেয়ে যান, যা ব্যবহার করা
              হয়ে গেছে বলে গণ্য করা হয়।
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              তাই সাবস্ক্রিপশন কেনার আগে দয়া করে আমাদের ফ্রি ফিচারগুলো ব্যবহার
              করে নিশ্চিত হয়ে নিন যে অ্যাপটি আপনার প্রয়োজন মেটাচ্ছে কিনা।
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              রিফান্ডের ক্ষেত্রসমূহ (Exceptions)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              তবে নিম্নলিখিত বিশেষ কিছু ক্ষেত্রে আমরা রিফান্ড বিবেচনা করতে পারি:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2"></div>
                <span>
                  <strong>ডাবল পেমেন্ট (Double Deduction):</strong> যদি কারিগরি
                  ত্রুটির কারণে আপনার একাউন্ট থেকে ভুলে একাধিকবার টাকা কেটে
                  নেওয়া হয়।
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2"></div>
                <span>
                  <strong>সেবা প্রদানে ব্যর্থতা:</strong> যদি আপনি পেমেন্ট করার
                  পরেও ২৪ ঘন্টার মধ্যে প্রিমিয়াম এক্সেস না পান এবং আমাদের
                  সাপোর্ট টিম তা সমাধান করতে ব্যর্থ হয়।
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              কিভাবে রিফান্ড ক্লেইম করবেন?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              উপরোক্ত বিশেষ কোনো কারণ ঘটলে, অনুগ্রহ করে পেমেন্ট করার{' '}
              <strong>৪৮ ঘন্টার মধ্যে</strong> আমাদের সাথে যোগাযোগ করুন।
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300 font-medium">
              <li>
                আপনার নাম, ফোন নাম্বার এবং ট্রানজেকশন আইডি (Transaction ID)
                সংগ্রহ করুন।
              </li>
              <li>
                আমাদের ইমেইল করুন:{' '}
                <a
                  href="mailto:support@obhyash.com"
                  className="text-rose-600 underline"
                >
                  support@obhyash.com
                </a>
              </li>
              <li>
                অথবা আমাদের হটলাইনে কল করুন: <strong>+৮৮০ ১৭০০-০০০০০০</strong>
              </li>
            </ol>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 pt-4 border-t border-rose-200 dark:border-rose-800">
              যাচাই-বাছাই শেষে রিফান্ড অনুমোদিত হলে ৫-৭ কার্যদিবসের মধ্যে আপনার
              অরিজিনাল পেমেন্ট মেথডে টাকা ফেরত পাঠানো হবে।
            </p>
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
