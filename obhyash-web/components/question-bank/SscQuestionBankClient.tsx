'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Binary,
  BookOpen,
  Languages,
  GraduationCap,
  SpellCheck,
  Sparkles,
  Globe2,
  Cpu,
  HeartHandshake,
  ReceiptText,
  Landmark,
  Briefcase,
  History,
  Compass,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  FileText,
  Layers,
  Award,
  Download,
  BookCheck,
  Check,
  Copy,
} from 'lucide-react';
import { SSC_SUBJECTS, SscSubject } from '@/lib/data/ssc-question-bank-data';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dssc_page';

// Map icon name to Lucide component
const iconMap: Record<string, React.ElementType> = {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Binary,
  BookOpen,
  Languages,
  GraduationCap,
  SpellCheck,
  Sparkles,
  Globe2,
  Cpu,
  HeartHandshake,
  ReceiptText,
  Landmark,
  Briefcase,
  History,
  Compass,
};

type StreamFilter = 'all' | 'science' | 'general' | 'business' | 'humanities';

const STREAM_TABS = [
  { id: 'all' as StreamFilter, label: 'সকল বিষয়', count: SSC_SUBJECTS.length },
  { id: 'science' as StreamFilter, label: 'বিজ্ঞান', count: SSC_SUBJECTS.filter((s) => s.stream === 'science').length },
  { id: 'general' as StreamFilter, label: 'আবশ্যিক ও সাধারণ', count: SSC_SUBJECTS.filter((s) => s.stream === 'general').length },
  { id: 'business' as StreamFilter, label: 'ব্যবসায় শিক্ষা', count: SSC_SUBJECTS.filter((s) => s.stream === 'business').length },
  { id: 'humanities' as StreamFilter, label: 'মানবিক বিভাগ', count: SSC_SUBJECTS.filter((s) => s.stream === 'humanities').length },
];

const FAQS = [
  {
    q: 'এসএসসি পরীক্ষার জন্য বোর্ড প্রশ্ন ও অধ্যায়ভিত্তিক প্রশ্নব্যাংক সমাধান কতটা জরুরি?',
    a: 'বিগত ৫-১০ বছরের বোর্ড পরীক্ষার প্রশ্ন বিশ্লেষণ করলে দেখা যায়, ৬০% থেকে ৮০% প্রশ্ন সরাসরি বা অনুরূপ নিয়মে কমন আসে। অধ্যায়ভিত্তিক প্রশ্নব্যাংক প্র্যাকটিস করলে শিক্ষার্থীরা বুঝতে পারে কোন টপিকগুলো থেকে বোর্ডে বারবার প্রশ্ন আসে।',
  },
  {
    q: 'অভ্যাস (Obhyash) প্রশ্ন ব্যাংকে কোন কোন শিক্ষা বোর্ডের প্রশ্ন অন্তর্ভুক্ত আছে?',
    a: 'ঢাকা, রাজশাহী, চট্টগ্রাম, কুমিল্লা, যশোর, বরিশাল, সিলেট, দিনাজপুর ও ময়মনসিংহ—বাংলাদেশের মোট ৯টি সাধারণ শিক্ষা বোর্ডের বিগত বছরগুলোর নির্ভুল ও ব্যাখ্যাসহ MCQ প্রশ্ন এই ডাটাবেজে রয়েছে।',
  },
  {
    q: 'টাইমার ও নেগেটিভ মার্কিং সহ কীভাবে প্র্যাকটিস টেস্ট দেওয়া যাবে?',
    a: 'আমাদের ওয়েবসাইটের "ফ্রি ডেমো টেস্ট" বা "লগইন" করে সরাসরি অনলাইনে পরীক্ষা দেওয়া যায়। এছাড়া অভ্যাস মোবাইল অ্যাপ ডাউনলোড করলে আনলিমিটেড লাইভ মডেল টেস্ট, ইনস্ট্যান্ট লিডারবোর্ড এবং দুর্বলতা অ্যানালাইসিস সম্পূর্ণ বিনামূল্যে পাওয়া যায়।',
  },
  {
    q: 'প্রশ্নব্যাংক ও সলিউশন কি সম্পূর্ণ বিনামূল্যে ব্যবহার করা যায়?',
    a: 'হ্যাঁ, ওয়েবসাইটের এই প্রশ্নব্যাংক ডিরেক্টরি, অধ্যায়ভিত্তিক তালিকা এবং বোর্ড প্রশ্নের ব্যাখ্যা ১০০% ফ্রি। সকল শিক্ষার্থী যেকোনো ডিভাইস থেকে কোনো ফি ছাড়াই প্র্যাকটিস করতে পারবে।',
  },
];

export default function SscQuestionBankClient() {
  const [selectedStream, setSelectedStream] = useState<StreamFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<SscSubject | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter subjects based on stream and search query
  const filteredSubjects = useMemo(() => {
    return SSC_SUBJECTS.filter((subj) => {
      const matchesStream = selectedStream === 'all' || subj.stream === selectedStream;
      if (!matchesStream) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = subj.name.toLowerCase().includes(q);
      const matchDesc = subj.description.toLowerCase().includes(q);
      const matchChapter = subj.chapters.some((c) => c.name.toLowerCase().includes(q));
      return matchName || matchDesc || matchChapter;
    });
  }, [selectedStream, searchQuery]);

  const totalQuestionsSum = useMemo(() => {
    return SSC_SUBJECTS.reduce((acc, s) => acc + s.totalQuestions, 0);
  }, []);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-brand-500/30 selection:text-white font-sans antialiased">
      {/* ─── 1. TOP NAV ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07090E]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                <span className="font-bold text-lg text-emerald-400">অ</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                অভ্যাস <span className="text-xs text-emerald-400 font-medium ml-1">প্রশ্ন ব্যাংক</span>
              </span>
              <span className="text-[10px] text-neutral-400 -mt-1 hidden sm:inline">SSC Question Bank</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <Link href="/" className="hover:text-white transition-colors">
              হোম
            </Link>
            <Link href="/question-bank/ssc" className="text-emerald-400 font-medium">
              এসএসসি প্রশ্ন ব্যাংক
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              ব্লগ ও গাইডলাইন
            </Link>
            <Link href="/demo" className="hover:text-white transition-colors">
              ফ্রি ডেমো টেস্ট
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অ্যাপ ইনস্টল</span>
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white border border-white/10 hover:border-white/20 transition-all hidden sm:inline-block"
            >
              লগইন
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────── */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 overflow-hidden border-b border-white/[0.06]">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-brand-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/10 text-emerald-300 mb-5 backdrop-blur-md">
            <BookCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>সকল শিক্ষা বোর্ডের বিগত বছরের প্রশ্ন ও ব্যাখ্যা</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            এসএসসি প্রশ্ন ব্যাংক{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              ২০২৬–২০২৭
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            অধ্যায়ভিত্তিক {totalQuestionsSum.toLocaleString('bn-BD')}+ MCQ প্রশ্ন, বিস্তারিত সমাধান ও ফ্রি মডেল টেস্ট।
            বোর্ড পরীক্ষায় নিশ্চিত A+ প্রস্তুতির জন্য বাংলাদেশের সবচেয়ে আধুনিক প্রশ্নব্যাংক প্ল্যাটফর্ম।
          </p>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-center">
              <div className="text-lg sm:text-xl font-bold text-emerald-400">৪৫,০০০+</div>
              <div className="text-xs text-neutral-400">MCQ প্রশ্নসমূহ</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-center">
              <div className="text-lg sm:text-xl font-bold text-teal-400">৯টি</div>
              <div className="text-xs text-neutral-400">সাধারণ শিক্ষা বোর্ড</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-center">
              <div className="text-lg sm:text-xl font-bold text-cyan-400">১৬টি</div>
              <div className="text-xs text-neutral-400">সকল বিভাগীয় বিষয়</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-center">
              <div className="text-lg sm:text-xl font-bold text-amber-400">১০০%</div>
              <div className="text-xs text-neutral-400">নির্ভুল উত্তরমালা</div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিষয় বা অধ্যায়ের নাম লিখে সার্চ করুন (যেমন: পদার্থবিজ্ঞান, বাস্তব সংখ্যা)..."
              className="w-full pl-12 pr-10 py-3.5 bg-white/[0.06] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-emerald-500 rounded-2xl text-sm sm:text-base text-white placeholder-neutral-400 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3.5 flex items-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── 3. STREAM TABS & MAIN CONTENT ─────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Stream Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {STREAM_TABS.map((tab) => {
            const active = selectedStream === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStream(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border ${
                  active
                    ? 'bg-emerald-500 text-black font-semibold border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm text-neutral-400">
            দেখানো হচ্ছে <span className="font-semibold text-white">{filteredSubjects.length}টি</span> বিষয়
            {searchQuery && ` ("${searchQuery}" এর জন্য)`}
          </p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'শেয়ার করুন'}</span>
          </button>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <Search className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">কোনো বিষয় বা অধ্যায় খুঁজে পাওয়া যায়নি</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
              অন্য কোনো কীওয়ার্ড দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করে দেখুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStream('all');
              }}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              সকল বিষয় রিসেট করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subj) => {
              const IconComponent = iconMap[subj.iconName] || BookOpen;
              return (
                <div
                  key={subj.id}
                  className={`group relative rounded-2xl bg-gradient-to-b ${subj.gradient} bg-[#0D1017] border border-white/[0.08] ${subj.borderHover} p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50`}
                >
                  <div>
                    {/* Header: Icon + Badge + Code */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${subj.badgeColor}`}>
                          {subj.streamName}
                        </span>
                        {subj.code && (
                          <span className="text-[10px] text-neutral-500 font-mono">কোড: {subj.code}</span>
                        )}
                      </div>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                      {subj.description}
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 text-xs text-neutral-300 mb-5 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-white">{subj.totalQuestions.toLocaleString('bn-BD')}</span>
                        <span className="text-neutral-400">প্রশ্ন</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-neutral-600" />
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-semibold text-white">{subj.totalChapters.toLocaleString('bn-BD')}টি</span>
                        <span className="text-neutral-400">অধ্যায়</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/question-bank/ssc/${subj.slug}`}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>অধ্যায় ও প্রশ্নসমূহ দেখুন</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveSubject(subj)}
                        className="py-2 px-3 rounded-lg text-[11px] font-medium text-center bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.06] transition-all flex items-center justify-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>কুইক প্রিভিউ</span>
                      </button>

                      {subj.blogSlug ? (
                        <Link
                          href={`/blog/${subj.blogSlug}`}
                          className="py-2 px-3 rounded-lg text-[11px] font-medium text-center bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.06] transition-all flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3 h-3 text-amber-400" />
                          <span>বোর্ড সমাধান</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/demo?subject=${subj.id}`}
                          className="py-2 px-3 rounded-lg text-[11px] font-medium text-center bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.06] transition-all flex items-center justify-center gap-1"
                        >
                          <PlayCircle className="w-3 h-3 text-emerald-400" />
                          <span>মডেল টেস্ট</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── 4. APP INSTALL BANNER ─────────────────────────────── */}
        <section className="mt-16 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-[#0C1217] to-[#0A0D14] border border-emerald-500/30 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>লাইভ এক্সাম ও দুর্বলতা অ্যানালাইসিস</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                মোবাইল অ্যাপে আনলিমিটেড লাইভ টেস্ট দাও
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
                অভ্যাস মোবাইল অ্যাপে রয়েছে স্মার্ট মিস্টেক নোটবুক, চ্যাপ্টারওয়াইজ রিভিশন, দেশব্যাপী লাইভ লিডারবোর্ড
                এবং সময় নিয়ন্ত্রিত রিয়েল এক্সাম সিমুলেশন।
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ফ্রি রেজিস্ট্রেশন
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> লাইভ লিডারবোর্ড
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> নেগেটিভ মার্কিং ট্র্যাকিং
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-100 font-bold text-sm transition-all flex items-center gap-3 shadow-xl hover:scale-105"
              >
                <Download className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="text-[10px] text-neutral-600 font-normal uppercase leading-none">GET IT ON</div>
                  <div className="text-sm font-bold leading-tight">Google Play</div>
                </div>
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/15 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>ওয়েবে রেজিস্টার</span>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 5. FREQUENTLY ASKED QUESTIONS (FAQ) ─────────────── */}
        <section className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              সাধারণ জিজ্ঞাসা (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              এসএসসি প্রশ্ন ব্যাংক এবং পরীক্ষা প্রস্তুতি সংক্রান্ত দরকারি উত্তর
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-white hover:text-emerald-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ─── 6. INTERACTIVE CHAPTER MODAL / DRAWER ─────────────── */}
      {activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#0E121A] border border-white/15 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeSubject.badgeColor}`}>
                    {activeSubject.streamName}
                  </span>
                  {activeSubject.code && (
                    <span className="text-[10px] text-neutral-500 font-mono">কোড: {activeSubject.code}</span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {activeSubject.name} — অধ্যায় তালিকা
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  মোট {activeSubject.chapters.length}টি অধ্যায় • {activeSubject.totalQuestions.toLocaleString('bn-BD')}টি প্রশ্ন
                </p>
              </div>

              <button
                onClick={() => setActiveSubject(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chapters List (Scrollable) */}
            <div className="overflow-y-auto py-4 space-y-2.5 pr-1 flex-1 scrollbar-thin">
              {activeSubject.chapters.map((ch, i) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0">
                      {(i + 1).toLocaleString('bn-BD')}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">{ch.name}</h4>
                      <p className="text-[11px] text-neutral-400">{ch.count.toLocaleString('bn-BD')}টি MCQ প্রশ্ন</p>
                    </div>
                  </div>

                  <Link
                    href={`/question-bank/ssc/${activeSubject.slug}/${ch.slug}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>প্রশ্ন ও সমাধান</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              {activeSubject.blogSlug ? (
                <Link
                  href={`/blog/${activeSubject.blogSlug}`}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>এই বিষয়ের সকল বোর্ড প্রশ্ন ও উত্তরপত্র পড়ুন →</span>
                </Link>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveSubject(null)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white bg-white/[0.04] border border-white/10"
                >
                  বন্ধ করুন
                </button>
                <Link
                  href={`/demo?subject=${activeSubject.id}`}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all text-center"
                >
                  সম্পূর্ণ বিষয়ের মডেল টেস্ট
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#05070A] py-10 px-4 sm:px-6 mt-20 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-neutral-400 font-medium">© ২০২৬ অভ্যাস (Obhyash) • সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              বাংলাদেশের শিক্ষার্থীদের জন্য তৈরি আধুনিক এক্সাম ও প্রশ্নব্যাংক প্ল্যাটফর্ম।
            </p>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <Link href="/privacy" className="hover:text-white">গোপনীয়তা নীতি</Link>
            <Link href="/terms" className="hover:text-white">শর্তাবলী</Link>
            <Link href="/blog" className="hover:text-white">ব্লগ</Link>
            <Link href="/about-us" className="hover:text-white">আমাদের সম্পর্কে</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

