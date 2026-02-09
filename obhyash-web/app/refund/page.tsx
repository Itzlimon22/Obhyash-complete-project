'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, RefreshCw } from 'lucide-react';
import { POLICY_CONTENT } from '@/lib/constants/policies';

interface Section {
  id?: number;
  title: string;
  content: string | string[];
}

export default function RefundPage() {
  const content = POLICY_CONTENT.refund;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-rose-500/20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-rose-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-serif-exam">
              Obhyash
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম-এ ফিরে যান
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-white dark:bg-slate-900 border-b border-rose-100 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            {content.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          {content.sections.map((section: Section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-sm font-bold">
                  {section.id || idx + 1}
                </span>
                {section.title}
              </h2>
              <div className="pl-11 prose dark:prose-invert prose-indigo max-w-none">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-10 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 text-center font-bold">
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
