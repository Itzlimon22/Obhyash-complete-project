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

import QuestionBankHeader from './QuestionBankHeader';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dhsc_hub';

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 font-sans antialiased">
      {/* ─── 1. TOP NAV MATCHING LANDING PAGE ──────────────────── */}
      <QuestionBankHeader activeSection="hsc" />

      {/* ─── 2. HERO HEADER MATCHING LANDING PAGE ───────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <nav className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-900 transition-colors">হোম</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-indigo-700 font-semibold">এইচএসসি প্রশ্ন ব্যাংক</span>
          </nav>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-4"
            style={display}
          >
            এইচএসসি প্রশ্ন ব্যাংক{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
              ২০২৬–২০২৭
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
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
                    ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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
                className="group p-5 rounded-2xl bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-indigo-400 hover:shadow-sm transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${subj.badgeColor}`}>
                        {subj.streamName}
                      </span>
                      {subj.code && (
                        <span className="text-[10px] text-slate-500 font-mono">কোড: {subj.code}</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {subj.name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-600" />
                        {subj.chapters.length}টি অধ্যায়
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-600" />
                        {subj.totalQuestions.toLocaleString('bn-BD')}টি প্রশ্ন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 flex items-center justify-center text-slate-400 transition-all shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── 4. BOTTOM DOWNLOAD CALLOUT ───────────────────────── */}
        <div className="mt-12 p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
          <p className="text-xs text-slate-600 mb-3 font-medium">
            এইচএসসি ও অ্যাডমিশন টেস্টের আনলিমিটেড লাইভ মডেল টেস্ট দিতে
          </p>
          <Link
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>গুগল প্লে স্টোর থেকে অভ্যাস অ্যাপ নামাও</span>
          </Link>
        </div>
      </main>

      {/* ─── 5. FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© ২০২৬ অভ্যাস (Obhyash) • এইচএসসি ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার স্মার্ট প্রস্তুতি</p>
      </footer>
    </div>
  );
}

