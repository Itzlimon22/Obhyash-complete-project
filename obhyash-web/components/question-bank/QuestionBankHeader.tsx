'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ChevronDown, User, BookOpen, Sparkles } from 'lucide-react';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dheader';

const exams = [
  {
    title: 'এসএসসি',
    desc: 'বোর্ড প্রস্তুতি · ৯ম-১০ম',
    href: '/question-bank/ssc',
    color: '#3fb68b',
  },
  {
    title: 'এইচএসসি',
    desc: 'বোর্ড প্রস্তুতি · ১১শ-১২শ',
    href: '/question-bank/hsc',
    color: '#5aa9e6',
  },
  {
    title: 'ভর্তি পরীক্ষা',
    desc: 'মেডিকেল · ইঞ্জিনিয়ারিং · ভার্সিটি',
    href: '/auth/login',
    color: '#e5534b',
  },
];

interface QuestionBankHeaderProps {
  activeSection?: 'ssc' | 'hsc';
}

export default function QuestionBankHeader({ activeSection }: QuestionBankHeaderProps) {
  const [drop, setDrop] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Logo matching Landing Page */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/obhyash_full_logo.svg"
              alt="অভ্যাস (Obhyash)"
              className="h-7 sm:h-8 w-auto transition-transform group-hover:scale-102"
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <BookOpen className="w-3 h-3 text-emerald-600" />
            <span>প্রশ্ন ব্যাংক</span>
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-[14px] text-slate-700 font-medium">
          {/* Exams Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDrop(true)}
            onMouseLeave={() => setDrop(false)}
          >
            <button
              type="button"
              onClick={() => setDrop(!drop)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <span>পরীক্ষা</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  drop ? 'rotate-180' : ''
                }`}
              />
            </button>

            {drop && (
              <div className="absolute left-0 top-full pt-2 w-[340px] animate-scale-up">
                <div className="p-2 rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {exams.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setDrop(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between px-2.5 text-xs">
                    <span className="text-slate-500">বিগত ১০ বছরের বোর্ড প্রশ্ন</span>
                    <span className="text-emerald-700 font-semibold">ফ্রি প্র্যাকটিস →</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/question-bank/ssc"
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeSection === 'ssc'
                ? 'text-slate-900 font-semibold bg-slate-100'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            এসএসসি
          </Link>

          <Link
            href="/question-bank/hsc"
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeSection === 'hsc'
                ? 'text-slate-900 font-semibold bg-slate-100'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            এইচএসসি
          </Link>

          <Link
            href="/#features"
            className="rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            ফিচার
          </Link>

          <Link
            href="/blog"
            className="rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            ব্লগ
          </Link>
        </nav>

        {/* Right Action CTAs matching Landing Page */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>অ্যাপ ডাউনলোড</span>
          </Link>

          <Link
            href="/auth/login"
            className="flex items-center gap-2 rounded-xl bg-[#0b5a50] hover:bg-[#0e6b5f] text-white px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_0_#063b34] transition-all active:translate-y-0.5 active:shadow-none"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">লগইন / রেজিস্ট্রেশন</span>
            <span className="sm:hidden">লগইন</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

