'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Search,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Download,
  PlayCircle,
  BookOpen,
  ShieldCheck,
  X,
  GraduationCap,
  Timer,
  Award,
  HelpCircle,
} from 'lucide-react';
import QuestionBankHeader from './QuestionBankHeader';
import Footer from '@/components/landing/Footer';
import { SubjectColorfulIcon } from './SubjectIcons';

const display = { fontFamily: "var(--font-inter), var(--font-hind), 'Hind Siliguri', sans-serif" };

export interface SubjectChapter {
  id: string;
  slug: string;
  name: string;
  count: number;
}

export interface SubjectDetailData {
  id: string;
  slug: string;
  name: string;
  stream: string;
  streamName: string;
  totalQuestions: number;
  totalChapters: number;
  description: string;
  iconName: string;
  blogSlug?: string;
  chapters: SubjectChapter[];
}

export interface SiblingSubject {
  slug: string;
  name: string;
  streamName: string;
  totalQuestions: number;
  iconName: string;
}

interface SubjectDetailClientProps {
  level: 'hsc' | 'ssc';
  subject: SubjectDetailData;
  siblings?: SiblingSubject[];
}

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dsubject_detail_page';

export default function SubjectDetailClient({
  level,
  subject,
  siblings = [],
}: SubjectDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const levelBangla = level === 'hsc' ? 'এইচএসসি' : 'এসএসসি';
  const hubUrl = `/question-bank/${level}`;

  // Filter chapters by live query
  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subject.chapters;
    return subject.chapters.filter((ch) =>
      ch.name.toLowerCase().includes(q)
    );
  }, [subject.chapters, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 selection:bg-slate-200 font-sans antialiased">
      {/* ─── 1. NAVBAR MATCHING LANDING PAGE ───────────────────── */}
      <QuestionBankHeader activeSection={level} />

      {/* ─── 2. HUMAN-CRAFTED EDITORIAL HERO BANNER ────────────── */}
      <header className="border-b border-slate-200/80 bg-white pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 overflow-x-auto scrollbar-none">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link href={hubUrl} className="hover:text-slate-900 transition-colors">
              {levelBangla} প্রশ্ন ব্যাংক
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold">{subject.name}</span>
          </nav>

          {/* Hero Grid: Icon + Title + Quick Model Test CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Colorful Subject Vector Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center p-3 shrink-0 shadow-xs">
                <SubjectColorfulIcon
                  name={subject.iconName + ' ' + subject.slug}
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {subject.streamName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {levelBangla} পরীক্ষা ২০২৬–২০২৭
                  </span>
                </div>

                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight"
                  style={display}
                >
                  {levelBangla} {subject.name} প্রশ্ন ব্যাংক
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                  {subject.description} বিগত ১০ বছরের সকল শিক্ষা বোর্ডের অধ্যায়ভিত্তিক বোর্ড MCQ প্রশ্ন ও নির্ভুল সমাধান।
                </p>
              </div>
            </div>

            {/* Quick Hero Test Action */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0 pt-2 md:pt-0">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ফ্রি মডেল টেস্ট দিন</span>
              </Link>
              {subject.blogSlug && (
                <Link
                  href={`/blog/${subject.blogSlug}`}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>বোর্ড সমাধান গাইড →</span>
                </Link>
              )}
            </div>
          </div>

          {/* Academic Trust & Metrics Strip */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>মোট <strong className="text-slate-900">{subject.chapters.length}টি</strong> অধ্যায়</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>মোট <strong className="text-slate-900">{subject.totalQuestions.toLocaleString('bn-BD')}টি</strong> বোর্ড প্রশ্ন</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>বিগত ১০ বছরের বোর্ড যাচাইকৃত</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>১০০% বিস্তারিত সমাধান ও শর্টকাট</span>
            </span>
          </div>
        </div>
      </header>

      {/* ─── 3. MAIN WORKSPACE (2-COLUMN BALANCED LAYOUT) ────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: CHAPTERS & SEARCH (8 cols) ─────────── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Counter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900" style={display}>
                  অধ্যায়ভিত্তিক বোর্ড প্রশ্ন ও সমাধান
                </h2>
                <p className="text-[11px] text-slate-500">
                  যেকোনো অধ্যায়ে ক্লিক করে বিগত বছরের প্রশ্ন ও ব্যাখ্যা অনুশীলন করুন
                </p>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="অধ্যায় খুঁজুন..."
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chapters List */}
            {filteredChapters.length > 0 ? (
              <div className="space-y-2.5">
                {filteredChapters.map((ch, idx) => {
                  const originalIndex = subject.chapters.findIndex((c) => c.id === ch.id);
                  const displayIndex = (originalIndex >= 0 ? originalIndex + 1 : idx + 1).toLocaleString('bn-BD');

                  return (
                    <Link
                      key={ch.id}
                      href={`/question-bank/${level}/${subject.slug}/${ch.slug}`}
                      className="group p-4 rounded-2xl bg-white hover:bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-4 shadow-xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Distinctive Chapter Number Pill */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                          {displayIndex}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors truncate">
                            {ch.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">
                              {ch.count.toLocaleString('bn-BD')}টি বোর্ড প্রশ্ন
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">ব্যাখ্যা ও শর্টকাট সমাধান</span>
                          </div>
                        </div>
                      </div>

                      {/* Editorial Action */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 group-hover:text-slate-900 shrink-0">
                        <span className="hidden sm:inline">প্রশ্ন দেখুন</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  &ldquo;{searchQuery}&rdquo; দিয়ে কোনো অধ্যায় খুঁজে পাওয়া যায়নি
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-slate-900 font-bold underline underline-offset-4"
                >
                  সব অধ্যায় দেখুন
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: STICKY ACADEMIC COMPANION (4 cols) ─ */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            {/* 1. Interactive Model Test Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <Timer className="w-3 h-3" />
                  <span>লাইভ টেস্ট</span>
                </span>
                <span className="text-[11px] text-slate-400">পরীক্ষা ২০২৬ উপযোগী</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5" style={display}>
                সম্পূর্ণ {subject.name} বিষয়ের উপর ফ্রি মডেল টেস্ট
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                টাইমার, নেগেটিভ মার্কিং ও স্বয়ংক্রিয় লিডারবোর্ড সহ পূর্ণাঙ্গ পরীক্ষার অভিজ্ঞতা নাও সম্পূর্ণ ফ্রিতে।
              </p>

              <div className="space-y-2 mb-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>২৫টি বোর্ড স্ট্যান্ডার্ড MCQ প্রশ্ন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>তাৎক্ষণিক ফলাফল ও বিস্তারিত ব্যাখ্যা</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>সারাদেশের পরীক্ষার্থীদের সাথে লাইভ র‍্যাংক</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>অ্যাপে মডেল টেস্ট দিন</span>
                </Link>
                <Link
                  href={`/demo?subject=${subject.id}`}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>ওয়েব ডেমো টেস্ট</span>
                </Link>
              </div>
            </div>

            {/* 2. Board Standard Trust Box */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Award className="w-4 h-4 text-amber-500" />
                <span>বোর্ড প্রশ্ন সংকলন মানদণ্ড</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ঢাকা, চট্টগ্রাম, রাজশাহী, যশোর, কুমিল্লা, বরিশাল, সিলেট, দিনাজপুর ও ময়মনসিংহ শিক্ষা বোর্ডের বিগত ১০ বছরের সকল MCQ নির্ভুল উত্তরমালা ও সহজ ব্যাখ্যা সহ সাজানো।
              </p>
            </div>

            {/* 3. Sibling Stream Subjects (Quick Navigation) */}
            {siblings.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900">
                    {subject.streamName}-এর অন্যান্য বিষয়
                  </h4>
                  <Link
                    href={hubUrl}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-medium"
                  >
                    সব দেখুন →
                  </Link>
                </div>

                <div className="space-y-2">
                  {siblings.slice(0, 4).map((sib) => (
                    <Link
                      key={sib.slug}
                      href={`/question-bank/${level}/${sib.slug}`}
                      className="group p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center p-1 shrink-0">
                          <SubjectColorfulIcon
                            name={sib.iconName + ' ' + sib.slug}
                            className="w-4 h-4"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 truncate">
                          {sib.name}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ─── 4. OFFICIAL LANDING FOOTER (LIGHT THEME) ─────────── */}
      <Footer theme="light" />
    </div>
  );
}

