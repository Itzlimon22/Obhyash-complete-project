import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  FileText,
  Layers,
  ArrowRight,
  PlayCircle,
  Download,
  Award,
  Sparkles,
} from "lucide-react";
import {
  getSubjectBySlug,
  SSC_SUBJECTS,
} from "@/lib/data/ssc-question-bank-data";
import QuestionBankHeader from "@/components/question-bank/QuestionBankHeader";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };

interface PageProps {
  params: Promise<{
    subject: string;
  }>;
}

export const dynamic = "force-static";
export const revalidate = false;

export function generateStaticParams() {
  return SSC_SUBJECTS.map((subj) => ({
    subject: subj.slug,
  }));
}

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_question_bank%26utm_medium%3Dsubject_page";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { subject } = await params;
  const subj = getSubjectBySlug(subject);
  if (!subj) return { title: "বিষয় খুঁজে পাওয়া যায়নি | অভ্যাস" };

  const title = `এসএসসি ${subj.name} প্রশ্ন ব্যাংক ২০২৬ (SSC ${subj.name} Question Bank) | অধ্যায়ভিত্তিক MCQ ও সমাধান`;
  const description = `এসএসসি ${subj.name} বিষয়ের সকল অধ্যায়ের বিগত ১০ বছরের বোর্ড MCQ প্রশ্ন, সমাধান ও ফ্রি মডেল টেস্ট। মোট ${subj.totalQuestions.toLocaleString("bn-BD")}টি প্রশ্ন ও ${subj.totalChapters}টি অধ্যায়।`;
  const canonicalUrl = `https://obhyash.com/question-bank/ssc/${subject}`;

  return {
    title,
    description,
    keywords: [
      `ssc ${subj.slug} question bank`,
      `এসএসসি ${subj.name} প্রশ্ন ব্যাংক ২০২৬`,
      `ssc ${subj.name} board question solution`,
      `ssc ${subj.slug} chapterwise mcq`,
      "obhyash question bank",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Obhyash (অভ্যাস)",
      locale: "bn_BD",
      type: "website",
      images: [
        {
          url: "https://obhyash.com/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://obhyash.com/og-image.png"],
    },
  };
}

export default async function SscSubjectPage({ params }: PageProps) {
  const { subject } = await params;
  const subj = getSubjectBySlug(subject);

  if (!subj) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100 font-sans antialiased">
      {/* ─── 1. NAVBAR MATCHING LANDING PAGE ───────────────────── */}
      <QuestionBankHeader activeSection="ssc" />

      {/* ─── 2. HERO HEADER ────────────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 overflow-x-auto scrollbar-none">
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
            <span className="text-emerald-700 font-medium">{subj.name}</span>
          </nav>

          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${subj.badgeColor}`}
            >
              {subj.streamName}
            </span>
            {subj.code && (
              <span className="text-[10px] text-slate-500 font-mono">
                বিষয় কোড: {subj.code}
              </span>
            )}
          </div>

          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-3"
            style={display}
          >
            এসএসসি {subj.name} প্রশ্ন ব্যাংক{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              ২০২৬
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            {subj.description} সকল অধ্যায়ের বিগত ১০ বছরের বোর্ড প্রশ্ন ও নির্ভুল
            সমাধান নিচে তালিকাভুক্ত করা হয়েছে।
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>
                মোট{" "}
                <strong className="text-slate-900">
                  {subj.totalQuestions.toLocaleString("bn-BD")}টি
                </strong>{" "}
                বোর্ড প্রশ্ন
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>
                মোট{" "}
                <strong className="text-slate-900">
                  {subj.chapters.length.toLocaleString("bn-BD")}টি
                </strong>{" "}
                অধ্যায়
              </span>
            </div>
            {subj.blogSlug && (
              <>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <Link
                  href={`/blog/${subj.blogSlug}`}
                  className="text-amber-700 hover:underline flex items-center gap-1 font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>সকল বোর্ড সমাধান গাইড →</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. CHAPTERS LIST ──────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            অধ্যায় তালিকা (Syllabus Chapters)
          </h2>
          <span className="text-xs text-slate-500">
            {subj.chapters.length}টি অধ্যায়
          </span>
        </div>

        <div className="space-y-3">
          {subj.chapters.map((ch, idx) => (
            <Link
              key={ch.id}
              href={`/question-bank/ssc/${subj.slug}/${ch.slug}`}
              className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-sm transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {(idx + 1).toLocaleString("bn-BD")}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {ch.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ch.count.toLocaleString("bn-BD")}টি বিগত বছরের বোর্ড MCQ
                    প্রশ্ন ও ব্যাখ্যা
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium shrink-0">
                <span className="hidden sm:inline">প্রশ্ন ও সমাধান দেখুন</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* ─── 4. BOTTOM ACTION CTA ─────────────────────────────── */}
        <div className="mt-12 p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            সম্পূর্ণ {subj.name} বিষয়ের উপর ফ্রি মডেল টেস্ট দাও
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mb-5 leading-relaxed">
            টাইমার ও স্বয়ংক্রিয় লিডারবোর্ড সহ পূর্ণাঙ্গ পরীক্ষার অভিজ্ঞতা নাও
            সম্পূর্ণ ফ্রিতে।
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>অ্যাপে মডেল টেস্ট দিন</span>
            </Link>
            <Link
              href={`/demo?subject=${subj.id}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>ওয়েব ডেমো টেস্ট</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
