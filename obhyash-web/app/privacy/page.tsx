'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft, ShieldCheck } from 'lucide-react';
import { POLICY_CONTENT } from '@/lib/constants/policies';

interface Section {
  id?: number;
  title: string;
  content: string | string[];
  warning?: string;
}

export default function PrivacyPage() {
  const content = POLICY_CONTENT.privacy;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] font-sans selection:bg-emerald-500/20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 dark:bg-[#09090B]/80 border-b border-slate-200 dark:border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-serif-exam">
              Obhyash (অভ্যাস)
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম-এ ফিরে যাও
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 bg-white dark:bg-[#121215] border-b border-slate-200 dark:border-[#27272A]">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl border border-emerald-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 font-serif-exam">
            {content.title}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {content.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {content.sections.map((section: Section, idx) => (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] hover:border-emerald-500/30 transition-all"
            >
              <h2 className="text-base md:text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 text-xs font-bold">
                  {section.id || idx + 1}
                </span>
                {section.title}
              </h2>
              <div className="pl-10 space-y-2">
                {Array.isArray(section.content) ? (
                  <ul className="grid gap-2">
                    {section.content.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {section.content}
                  </p>
                )}
                {section.warning && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <span>🛡️</span>
                    <span>{section.warning}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="pt-8 border-t border-slate-200 dark:border-[#27272A] text-xs text-slate-400 dark:text-slate-500 text-center font-bold">
            সর্বশেষ আপডেট: ১৫ আগস্ট, ২০২৬
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#121215] py-8 border-t border-slate-200 dark:border-[#27272A] text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Obhyash Platform. All rights reserved.
      </footer>
    </div>
  );
}
