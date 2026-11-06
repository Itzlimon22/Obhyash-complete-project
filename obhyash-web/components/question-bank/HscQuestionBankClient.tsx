'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  BookOpen,
  Languages,
  GraduationCap,
  SpellCheck,
  Cpu,
  ReceiptText,
  Landmark,
  Globe2,
  Compass,
  ChevronRight,
  Download,
  Layers,
  FileText,
} from 'lucide-react';
import { HSC_SUBJECTS } from '@/lib/data/hsc-question-bank-data';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dhsc_hub';

const iconMap: Record<string, React.ElementType> = {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  BookOpen,
  Languages,
  GraduationCap,
  SpellCheck,
  Cpu,
  ReceiptText,
  Landmark,
  Globe2,
  Compass,
};

type StreamFilter = 'all' | 'science' | 'general' | 'business' | 'humanities';

const STREAM_TABS = [
  { id: 'all' as StreamFilter, label: 'সকল বিষয়', count: HSC_SUBJECTS.length },
  { id: 'science' as StreamFilter, label: 'বিজ্ঞান', count: HSC_SUBJECTS.filter((s) => s.stream === 'science').length },
  { id: 'general' as StreamFilter, label: 'আবশ্যিক ও সাধারণ', count: HSC_SUBJECTS.filter((s) => s.stream === 'general').length },
  { id: 'business' as StreamFilter, label: 'ব্যবসায় শিক্ষা', count: HSC_SUBJECTS.filter((s) => s.stream === 'business').length },
  { id: 'humanities' as StreamFilter, label: 'মানবিক বিভাগ', count: HSC_SUBJECTS.filter((s) => s.stream === 'humanities').length },
];

export default function HscQuestionBankClient() {
  const [selectedStream, setSelectedStream] = useState<StreamFilter>('all');

  const filteredSubjects = useMemo(() => {
    if (selectedStream === 'all') return HSC_SUBJECTS;
    return HSC_SUBJECTS.filter((subj) => subj.stream === selectedStream);
  }, [selectedStream]);

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-brand-500/30 font-sans antialiased">
      {/* ─── 1. TOP NAV ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07090E]/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 p-0.5">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                <span className="font-bold text-sm text-indigo-400">অ</span>
              </div>
            </div>
            <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
              অভ্যাস <span className="text-indigo-400 font-medium">HSC প্রশ্ন ব্যাংক</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs text-neutral-300">
            <Link href="/" className="hover:text-white transition-colors hidden sm:inline">
              হোম
            </Link>
            <Link href="/question-bank/ssc" className="hover:text-white transition-colors hidden sm:inline">
              এসএসসি
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors hidden sm:inline">
              ব্লগ
            </Link>
            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অ্যাপ ডাউনলোড</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. MINIMAL HEADER ──────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-6 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <nav className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mb-3">
            <Link href="/" className="hover:text-white">হোম</Link>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span className="text-indigo-400 font-medium">এইচএসসি প্রশ্ন ব্যাংক</span>
          </nav>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            এইচএসসি প্রশ্ন ব্যাংক ২০২৬–২০২৭ (HSC Question Bank)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
            বিগত ১০ বছরের সকল শিক্ষা বোর্ডের অধ্যায়ভিত্তিক বোর্ড MCQ প্রশ্ন ও নির্ভুল সমাধানের জন্য নিচে আপনার বিষয়টি নির্বাচন করুন।
          </p>
        </div>
      </section>

      {/* ─── 3. STREAM TABS & SUBJECT LIST ───────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Stream Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {STREAM_TABS.map((tab) => {
            const active = selectedStream === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStream(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                  active
                    ? 'bg-indigo-500 text-white font-semibold border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clean Subject Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredSubjects.map((subj) => {
            const IconComponent = iconMap[subj.iconName] || BookOpen;

            return (
              <Link
                key={subj.id}
                href={`/question-bank/hsc/${subj.slug}`}
                className="group p-5 rounded-2xl bg-[#0D1017] hover:bg-[#11151F] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center justify-between gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:scale-105 group-hover:bg-indigo-500/15 group-hover:text-indigo-400 transition-all shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${subj.badgeColor}`}>
                        {subj.streamName}
                      </span>
                      {subj.code && (
                        <span className="text-[10px] text-neutral-500 font-mono">কোড: {subj.code}</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {subj.name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        {subj.chapters.length}টি অধ্যায়
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-400" />
                        {subj.totalQuestions.toLocaleString('bn-BD')}টি প্রশ্ন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-indigo-500 group-hover:text-white border border-white/10 group-hover:border-indigo-400 flex items-center justify-center text-neutral-400 transition-all shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── 4. BOTTOM DOWNLOAD CALLOUT ───────────────────────── */}
        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-xs text-neutral-300 mb-3">
            এইচএসসি ও অ্যাডমিশন টেস্টের আনলিমিটেড লাইভ মডেল টেস্ট দিতে
          </p>
          <Link
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 font-bold text-xs transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>গুগল প্লে স্টোর থেকে অভ্যাস অ্যাপ নামাও</span>
          </Link>
        </div>
      </main>

      {/* ─── 5. FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-neutral-500 mt-12">
        <p>© ২০২৬ অভ্যাস (Obhyash) • এইচএসসি ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার স্মার্ট প্রস্তুতি</p>
      </footer>
    </div>
  );
}

