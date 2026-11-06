"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  X,
  Check,
  Copy,
  GraduationCap,
} from "lucide-react";
import {
  ChapterDetails,
  ChapterMcqQuestion,
} from "@/lib/data/ssc-chapter-questions";
import { SscSubject } from "@/lib/data/ssc-question-bank-data";
import QuestionBankHeader from "./QuestionBankHeader";
import Footer from "@/components/landing/Footer";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dchapter_page";

interface SscChapterQuestionsClientProps {
  chapterData: ChapterDetails;
  subjectData: SscSubject;
}

const OPTION_PREFIXES = ["ক", "খ", "গ", "ঘ"];

export default function SscChapterQuestionsClient({
  chapterData,
  subjectData,
}: SscChapterQuestionsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("locked_explanation");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleOpenLock = (qNumber: number) => {
    setModalSource(`question_${qNumber}_lock`);
    setIsModalOpen(true);
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 selection:bg-slate-200 font-sans antialiased">
      {/* ─── 1. TOP NAVBAR MATCHING LANDING PAGE ──────────────────── */}
      <QuestionBankHeader activeSection="ssc" />

      {/* ─── 2. BREADCRUMBS & CHAPTER HEADER ─────────────────────── */}
      <div className="border-b border-slate-200/70 bg-white py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb path */}
          <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 mb-4 overflow-x-auto scrollbar-none pb-1">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              হোম
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <Link
              href="/question-bank/ssc"
              className="hover:text-slate-900 transition-colors"
            >
              এসএসসি প্রশ্ন ব্যাংক
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <Link
              href={`/question-bank/ssc/${subjectData.slug}`}
              className="hover:text-slate-900 transition-colors"
            >
              {subjectData.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-medium whitespace-nowrap">
              {chapterData.chapterNameBangla}
            </span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              অধ্যায় {chapterData.chapterNumber.toLocaleString("bn-BD")}
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {subjectData.name} ({chapterData.subjectEnglish})
            </span>
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {chapterData.totalQuestionsInDb.toLocaleString("bn-BD")}টি প্রশ্ন ডাটাবেজে
            </span>
          </div>

          {/* Main Title (Tri-Lingual SEO Optimized) */}
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-3"
            style={display}
          >
            {chapterData.chapterNameBangla} — এসএসসি {subjectData.name} বোর্ড MCQ প্রশ্ন ও সমাধান
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            {chapterData.summary}
          </p>

          {/* Banglish & English keywords for SEO Indexing */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pt-3 border-t border-slate-100">
            <span className="text-slate-600 font-medium">
              সম্পর্কিত অনুসন্ধান:
            </span>
            {chapterData.banglishKeywords.map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/70"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3. QUESTIONS LIST (EDITORIAL CLEAN DESIGN) ─────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner Alert: Academic Notice */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              <strong className="text-slate-900 font-semibold">বোর্ড প্রশ্ন ও উত্তরমালা:</strong> প্রথম ৩টি প্রশ্নের পূর্ণাঙ্গ সমাধান উন্মুক্ত।
            </span>
          </div>
          <Link
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-900 hover:text-emerald-700 underline underline-offset-4 inline-flex items-center gap-1 shrink-0"
          >
            <span>সকল প্রশ্ন অনুশীলন করুন ({chapterData.totalQuestionsInDb.toLocaleString("bn-BD")}টি)</span>
            <span>→</span>
          </Link>
        </div>

        {/* Questions Cards */}
        <div className="space-y-6">
          {chapterData.questions.map((q) => {
            const correctLetter = OPTION_PREFIXES[q.correctIndex] || "ক";
            const correctText = q.options[q.correctIndex] || "";

            return (
              <article
                key={q.id}
                className="rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 p-5 sm:p-6 transition-all duration-200 shadow-xs"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {q.number.toLocaleString("bn-BD")}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed" style={display}>
                      {q.question}
                    </h2>
                  </div>
                  {q.boardTag && (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                      {q.boardTag}
                    </span>
                  )}
                </div>

                {/* 4 Options Grid (2x2 Modern Exam Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctIndex;
                    const prefix = OPTION_PREFIXES[optIdx];
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${
                          isCorrect
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {prefix}
                        </span>
                        <span className="leading-snug pt-0.5">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Solution Accordion & Explanation */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        সঠিক উত্তর: ({correctLetter}) {correctText}
                      </span>
                    </div>

                    {q.isLocked && (
                      <span className="text-[11px] font-medium text-slate-400">
                        ব্যাখ্যা সংরক্ষিত
                      </span>
                    )}
                  </div>

                  {!q.isLocked ? (
                    /* Free Unlocked Explanation */
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <span className="h-3 w-1 rounded-full bg-emerald-600" />
                        <span>ব্যাখ্যা ও বিশ্লেষণ</span>
                      </div>
                      <p className="whitespace-pre-line text-slate-700 leading-relaxed font-normal">
                        {q.explanation}
                      </p>
                      {q.shortcutTip && (
                        <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-700 font-medium flex items-start gap-1.5 bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="font-bold text-slate-900 shrink-0">পরীক্ষার টেকনিক:</span>
                          <span>{q.shortcutTip.replace(/^💡\s*/, '').replace(/^(শর্টকাট|টিপস|পরীক্ষার টেকনিক|মাস্টার ট্রিক|শর্টকাট টিপস):\s*/, '')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Locked Explanation */
                    <div
                      onClick={() => handleOpenLock(q.number)}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer group hover:border-slate-300 transition-all select-none"
                    >
                      <div className="filter blur-[4px] opacity-30 text-xs text-slate-500">
                        {q.explanation}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[2px] p-2">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs group-hover:bg-slate-800 transition-all">
                          <Lock className="w-3.5 h-3.5" />
                          <span>সম্পূর্ণ ব্যাখ্যা দেখতে অ্যাপে খুলুন</span>
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
        <section className="mt-12 rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 mx-auto mb-4 shadow-xs">
              <Award className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              এই অধ্যায়ের সম্পূর্ণ{" "}
              {chapterData.totalQuestionsInDb.toLocaleString("bn-BD")}টি বোর্ড
              প্রশ্ন অনুশীলন করো
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              বিগত ১০ বছরের সকল বোর্ড প্রশ্ন, টেস্ট পরীক্ষার স্পেশাল প্রশ্নাবলী,
              ইনস্ট্যান্ট লিডারবোর্ড এবং দুর্বলতা অ্যানালাইসিস পেতে এখনই অভ্যাস
              মোবাইল অ্যাপ ইনস্টল করুন অথবা ওয়েবে অ্যাকাউন্ট খুলুন।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Google Play থেকে অ্যাপ নামাও</span>
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>ওয়েবে ফ্রি অ্যাকাউন্ট খুলুন</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 5. PREV / NEXT CHAPTER NAVIGATION ────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          {chapterData.prevChapterSlug ? (
            <Link
              href={`/question-bank/ssc/${subjectData.slug}/${chapterData.prevChapterSlug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী অধ্যায়</span>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/question-bank/ssc/${subjectData.slug}`}
            className="text-xs text-slate-700 font-medium hover:text-slate-900 hover:underline"
          >
            {subjectData.name} এর সকল অধ্যায়
          </Link>

          {chapterData.nextChapterSlug ? (
            <Link
              href={`/question-bank/ssc/${subjectData.slug}/${chapterData.nextChapterSlug}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>পরবর্তী অধ্যায়</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>

      {/* ─── 6. OFFICIAL LANDING FOOTER ───────────────────────── */}
      <Footer theme="light" />

      {/* ─── 7. INTERACTIVE REGISTRATION GATE MODAL ─────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              সম্পূর্ণ ব্যাখ্যা ও শর্টকাট আনলক করুন
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              অভ্যাস অ্যাপে রয়েছে সকল বোর্ড প্রশ্নের নির্ভুল শর্টকাট টেকনিক,
              স্মার্ট মিস্টেক নোটবুক এবং ফ্রি লাইভ টেস্ট।
            </p>

            <div className="space-y-3">
              <Link
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Google Play থেকে অ্যাপ ডাউনলোড করুন</span>
              </Link>

              <Link
                href="/auth/register"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>ওয়েবে ফ্রি অ্যাকাউন্ট তৈরি করুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 mt-4">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href="/auth/login"
                className="text-slate-900 font-semibold hover:underline"
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
