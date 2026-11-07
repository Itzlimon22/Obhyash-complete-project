'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Layers,
  FileText,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Download,
  GraduationCap,
  FlaskConical,
  Briefcase,
  Landmark,
  X,
} from 'lucide-react';
import { HSC_SUBJECTS, HscSubject } from '@/lib/data/hsc-question-bank-data';
import QuestionBankHeader from './QuestionBankHeader';
import Footer from '@/components/landing/Footer';
import { SubjectColorfulIcon } from './SubjectIcons';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dhsc_hub';

const display = { fontFamily: "var(--font-inter), var(--font-hind), 'Hind Siliguri', sans-serif" };

type StreamFilter = 'all' | 'science' | 'general' | 'business' | 'humanities';

interface StreamMeta {
  id: StreamFilter;
  label: string;
  banglaTitle: string;
  icon: React.ElementType;
  desc: string;
  color: string;
}

const STREAMS: StreamMeta[] = [
  {
    id: 'science',
    label: 'বিজ্ঞান বিভাগ',
    banglaTitle: 'বিজ্ঞান বিভাগ (Science Group)',
    icon: FlaskConical,
    desc: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞান',
    color: 'emerald',
  },
  {
    id: 'general',
    label: 'আবশ্যিক বিষয়',
    banglaTitle: 'আবশ্যিক বিষয় (Compulsory Subjects)',
    icon: BookOpen,
    desc: 'বাংলা, ইংরেজি এবং তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    color: 'blue',
  },
  {
    id: 'business',
    label: 'ব্যবসায় শিক্ষা',
    banglaTitle: 'ব্যবসায় শিক্ষা বিভাগ (Business Studies)',
    icon: Briefcase,
    desc: 'হিসাববিজ্ঞান এবং ফিন্যান্স, ব্যাংকিং ও বিমা',
    color: 'amber',
  },
  {
    id: 'humanities',
    label: 'মানবিক বিভাগ',
    banglaTitle: 'মানবিক বিভাগ (Humanities)',
    icon: Landmark,
    desc: 'অর্থনীতি এবং পৌরনীতি ও সুশাসন',
    color: 'rose',
  },
];

export default function HscQuestionBankClient() {
  const [selectedStream, setSelectedStream] = useState<StreamFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered by stream or search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return HSC_SUBJECTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.streamName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Grouped by streams when browsing
  const streamGroups = useMemo(() => {
    return STREAMS.map((str) => ({
      ...str,
      subjects: HSC_SUBJECTS.filter((s) => s.stream === str.id),
    })).filter((group) => {
      if (selectedStream === 'all') return true;
      return group.id === selectedStream;
    });
  }, [selectedStream]);

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 selection:bg-slate-200 font-sans antialiased">
      {/* ─── 1. TOP NAVBAR MATCHING LANDING PAGE ──────────────────── */}
      <QuestionBankHeader activeSection="hsc" />

      {/* ─── 2. EDITORIAL HERO WITH AUTHENTIC TRUST STRIP ─────────── */}
      <header className="border-b border-slate-200/80 bg-white pt-10 pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb path */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              হোম
            </Link>
            <span className="text-slate-400">›</span>
            <span className="text-slate-600">প্রশ্ন ব্যাংক</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-900 font-semibold">এইচএসসি ২০২৬–২০২৭</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3 border border-slate-200">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>উচ্চ মাধ্যমিক সার্টিফিকেট (HSC) প্রস্তুতি</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]"
                style={display}
              >
                এইচএসসি প্রশ্ন ব্যাংক ২০২৬–২০২৭
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                বিগত ১০ বছরের ঢাকা, চট্টগ্রাম, রাজশাহী সহ সকল শিক্ষা বোর্ডের অধ্যায়ভিত্তিক পূর্ণাঙ্গ MCQ প্রশ্ন, নির্ভুল সমাধান ও শর্টকাট টেকনিক।
              </p>
            </div>

            {/* Quick Live Stats Pill Box */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shrink-0">
              <div>
                <div className="text-2xl font-black text-slate-900">২,১০,০০০+</div>
                <div className="text-[11px] text-slate-500 font-medium">মোট বোর্ড MCQ প্রশ্ন</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-2xl font-black text-slate-900">১৭টি</div>
                <div className="text-[11px] text-slate-500 font-medium">এইচএসসি পূর্ণাঙ্গ বিষয়</div>
              </div>
            </div>
          </div>

          {/* Authentic Bangladeshi Academic Trust Bar */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>৯টি সাধারণ ও মাদ্রাসা বোর্ড</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>বিগত ১০ বছরের প্রশ্ন (২০১৫–২০২৫)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>১০০% নির্ভুল সমাধান ও ব্যাখ্যা</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>টাইমার সহ ফ্রি ওএমআর প্র্যাকটিস</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── 3. INTERACTIVE SEARCH & STREAM CONTROLS ──────────────── */}
      <section className="sticky top-[61px] z-30 bg-[#FBFBFC]/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Stream Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => {
                setSelectedStream('all');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedStream === 'all' && !searchQuery
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              সকল বিষয় (১৭)
            </button>
            {STREAMS.map((s) => {
              const active = selectedStream === s.id && !searchQuery;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStream(s.id);
                    setSearchQuery('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Quick Real-Time Subject Search Bar */}
          <div className="relative min-w-[240px] sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="যেকোনো বিষয় খুঁজুন..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4. SUBJECT DOSSIER LIST (ORGANIZED BY STREAM) ─────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* If Search is Active */}
        {searchResults !== null ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">
                অনুসন্ধানের ফলাফল: &ldquo;{searchQuery}&rdquo; ({searchResults.length}টি বিষয় পাওয়া গেছে)
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                সব বিষয় দেখুন
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">কোনো বিষয় খুঁজে পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  বানান সঠিক আছে কি না যাচাই করুন অথবা ওপরের ফিল্টার থেকে বিভাগ নির্বাচন করুন।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((subj) => (
                  <SubjectCard key={subj.id} subj={subj} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Structured Stream Layout */
          <div className="space-y-12">
            {streamGroups.map((group) => (
              <section key={group.id} className="scroll-mt-32">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                        {group.banglaTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{group.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {group.subjects.length}টি বিষয়
                  </span>
                </div>

                {/* Grid of Subjects in this Stream */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.subjects.map((subj) => (
                    <SubjectCard key={subj.id} subj={subj} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ─── 5. AUTHENTIC PREP CALLOUT BANNER ───────────────────── */}
        <section className="mt-16 rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mx-auto mb-4 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              অভ্যাস অ্যাপে আনলিমিটেড লাইভ মডেল টেস্ট দাও
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              অধ্যায়ভিত্তিক ফ্রি প্র্যাকটিস ছাড়াও নিয়মিত দেশব্যাপী লাইভ মডেল টেস্ট, ইনস্ট্যান্ট মেরিটের ফলাফল এবং স্মার্ট মিস্টেক নোটবুক ব্যবহারের জন্য অ্যাপটি ইনস্টল করো।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Google Play থেকে ডাউনলোড করুন</span>
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>ওয়েবে ফ্রি অ্যাকাউন্ট তৈরি করুন</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 6. OFFICIAL LANDING FOOTER (LIGHT THEME) ─────────────── */}
      <Footer theme="light" />
    </div>
  );
}

// ─── Human-Crafted Subject Dossier Card ──────────────────────────
function SubjectCard({ subj }: { subj: HscSubject }) {
  return (
    <Link
      href={`/question-bank/hsc/${subj.slug}`}
      className="group relative p-5 rounded-2xl bg-white hover:bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
    >
      <div>
        {/* Top Meta Line: Colorful Icon + Stream Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-2.5 group-hover:scale-105 group-hover:bg-white group-hover:shadow-xs transition-all shrink-0">
              <SubjectColorfulIcon name={subj.iconName + ' ' + subj.slug} className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {subj.streamName}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors mt-1">
                {subj.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Short Content Excerpt / Chapter Preview */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 pl-0.5">
          {subj.description}
        </p>
      </div>

      {/* Card Footer: Structured Metrics + Editorial CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {subj.chapters.length}টি অধ্যায়
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {subj.totalQuestions.toLocaleString('bn-BD')}টি প্রশ্ন
          </span>
        </div>

        {/* Clean Editorial Action Link */}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 group-hover:translate-x-0.5 transition-transform">
          <span>প্রশ্নসমূহ</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900" />
        </span>
      </div>
    </Link>
  );
}
