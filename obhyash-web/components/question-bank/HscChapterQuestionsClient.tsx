'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  ArrowRight,
  Sparkles,
  Award,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { HscChapterDetails } from '@/lib/data/hsc-chapter-questions';
import { HscSubject } from '@/lib/data/hsc-question-bank-data';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dhsc_chapter_page';

interface HscChapterQuestionsClientProps {
  chapterData: HscChapterDetails;
  subjectData: HscSubject;
}

const OPTION_PREFIXES = ['ক', 'খ', 'গ', 'ঘ'];

export default function HscChapterQuestionsClient({
  chapterData,
  subjectData,
}: HscChapterQuestionsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleOpenLock = () => {
    setIsModalOpen(true);
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white selection:bg-brand-500/30 font-sans antialiased">
      {/* ─── 1. TOP NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07090E]/85 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/question-bank/hsc" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              অ
            </div>
            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              এইচএসসি প্রশ্ন ব্যাংক
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'কপি হয়েছে' : 'শেয়ার'}</span>
            </button>

            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অ্যাপ নামাও</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. BREADCRUMBS & CHAPTER HEADER ─────────────────────── */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb path */}
          <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400 mb-4 overflow-x-auto scrollbar-none pb-1">
            <Link href="/" className="hover:text-white transition-colors">হোম</Link>
            <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
            <Link href="/question-bank/hsc" className="hover:text-white transition-colors">এইচএসসি প্রশ্ন ব্যাংক</Link>
            <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
            <Link href={`/question-bank/hsc/${subjectData.slug}`} className="hover:text-white transition-colors">
              {subjectData.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
            <span className="text-indigo-400 font-medium whitespace-nowrap">{chapterData.chapterNameBangla}</span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              অধ্যায় {chapterData.chapterNumber.toLocaleString('bn-BD')}
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/10">
              {subjectData.name}
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {chapterData.totalQuestionsInDb.toLocaleString('bn-BD')}টি প্রশ্ন ডাটাবেজে
            </span>
          </div>

          {/* Main Title (Tri-Lingual SEO Optimized) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3">
            {chapterData.chapterNameBangla} — এইচএসসি {subjectData.name} বোর্ড MCQ প্রশ্ন ও সমাধান
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
            {chapterData.summary}
          </p>

          {/* Banglish & English keywords for SEO Indexing */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-500 pt-3 border-t border-white/[0.04]">
            <span className="text-neutral-400 font-medium">সম্পর্কিত অনুসন্ধান:</span>
            {chapterData.banglishKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.04]">
                #{kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3. QUESTIONS LIST (PAPER-LIKE CLEAN DESIGN) ──────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner Alert */}
        <div className="mb-8 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs text-neutral-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">নমুনা বোর্ড প্রশ্ন ও উত্তরমালা: </span>
            প্রথম ৩টি প্রশ্নের সম্পূর্ণ সমাধান নিচে উন্মুক্ত রাখা হয়েছে। বাকি প্রশ্নের বিস্তারিত ব্যাখ্যা ও আরও{' '}
            <span className="text-indigo-400 font-semibold">{chapterData.totalQuestionsInDb.toLocaleString('bn-BD')}টি</span>{' '}
            বোর্ড প্রশ্ন প্র্যাকটিস করতে ফ্রি অ্যাকাউন্ট তৈরি করুন।
          </div>
        </div>

        {/* Questions Cards */}
        <div className="space-y-6">
          {chapterData.questions.map((q) => {
            const correctLetter = OPTION_PREFIXES[q.correctIndex] || 'ক';
            const correctText = q.options[q.correctIndex] || '';

            return (
              <article
                key={q.id}
                className="rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.15] p-5 sm:p-6 transition-all duration-200 shadow-sm"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-sm sm:text-base text-indigo-400">
                      {q.number.toLocaleString('bn-BD')}.
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {q.question}
                    </h2>
                  </div>
                  {q.boardTag && (
                    <span className="text-[10px] text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                      {q.boardTag}
                    </span>
                  )}
                </div>

                {/* 4 Options */}
                <div className="space-y-2 my-4 pl-6 text-xs sm:text-sm text-neutral-300">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctIndex;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2.5 py-1 px-2 rounded-lg transition-colors ${
                          isCorrect ? 'text-indigo-300 font-medium' : 'text-neutral-300'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-neutral-500 flex items-center justify-center text-[10px] text-neutral-400 shrink-0">
                          {isCorrect ? '●' : '○'}
                        </span>
                        <span>
                          <strong className="font-semibold text-neutral-400 mr-1.5">{OPTION_PREFIXES[optIdx]})</strong>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Correct Answer Pill */}
                <div className="pt-3 pb-1 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সঠিক উত্তর: ({correctLetter}) {correctText}</span>
                  </div>

                  {q.isLocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <Lock className="w-3 h-3" />
                      <span>ব্যাখ্যা লকড</span>
                    </span>
                  )}
                </div>

                {/* Explanation Section */}
                <div className="mt-3">
                  {!q.isLocked ? (
                    /* Free Unlocked Explanation */
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed text-neutral-300 space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>বিস্তারিত ব্যাখ্যা:</span>
                      </div>
                      <p className="whitespace-pre-line text-neutral-300">{q.explanation}</p>
                      {q.shortcutTip && (
                        <div className="pt-2 border-t border-white/[0.04] text-[11px] text-amber-300/90 font-medium">
                          {q.shortcutTip}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Locked Explanation */
                    <div
                      onClick={handleOpenLock}
                      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 cursor-pointer group hover:border-indigo-500/30 transition-all select-none"
                    >
                      <div className="filter blur-[5px] opacity-40 text-xs text-neutral-400 line-clamp-2">
                        {q.explanation}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-2">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg">
                          <Lock className="w-3.5 h-3.5" />
                          <span>ব্যাখ্যা ও শর্টকাট দেখতে ক্লিক করুন</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* ─── 4. BIG BOTTOM CONVERSION GATE ────────────────────── */}
        <section className="mt-12 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-[#0B1017] to-[#080B10] border border-indigo-500/30 p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Award className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              এই অধ্যায়ের সম্পূর্ণ {chapterData.totalQuestionsInDb.toLocaleString('bn-BD')}টি বোর্ড প্রশ্ন অনুশীলন করো
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 mb-6 leading-relaxed">
              বিগত ১০ বছরের সকল বোর্ড প্রশ্ন, কলেজ টেস্ট পরীক্ষার স্পেশাল প্রশ্নাবলী, ইনস্ট্যান্ট লিডারবোর্ড এবং ভর্তি পরীক্ষা প্রস্তুতির
              জন্য এখনই অভ্যাস মোবাইল অ্যাপ ইনস্টল করুন অথবা ওয়েবে অ্যাকাউন্ট খুলুন।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Google Play থেকে অ্যাপ নামাও</span>
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/15 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>ওয়েবে ফ্রি অ্যাকাউন্ট খুলুন</span>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 5. PREV / NEXT CHAPTER NAVIGATION ────────────────── */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center justify-between gap-4">
          {chapterData.prevChapterSlug ? (
            <Link
              href={`/question-bank/hsc/${subjectData.slug}/${chapterData.prevChapterSlug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী অধ্যায়</span>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/question-bank/hsc/${subjectData.slug}`}
            className="text-xs text-indigo-400 hover:underline"
          >
            {subjectData.name} এর সকল অধ্যায়
          </Link>

          {chapterData.nextChapterSlug ? (
            <Link
              href={`/question-bank/hsc/${subjectData.slug}/${chapterData.nextChapterSlug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <span>পরবর্তী অধ্যায়</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>

      {/* ─── 6. INTERACTIVE REGISTRATION GATE MODAL ─────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md bg-[#0D1017] border border-white/15 rounded-3xl p-6 text-center shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              সম্পূর্ণ ব্যাখ্যা ও শর্টকাট আনলক করুন
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              অভ্যাস অ্যাপে রয়েছে এইচএসসি ও অ্যাডমিশন পরীক্ষার নির্ভুল শর্টকাট টেকনিক, স্মার্ট মিস্টেক নোটবুক এবং ফ্রি লাইভ টেস্ট।
            </p>

            <div className="space-y-3">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-100 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Google Play থেকে অ্যাপ ডাউনলোড করুন</span>
              </Link>

              <Link
                href="/auth/register"
                className="w-full py-3 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>ওয়েবে ফ্রি অ্যাকাউন্ট তৈরি করুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-[11px] text-neutral-500 mt-4">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:underline">
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

