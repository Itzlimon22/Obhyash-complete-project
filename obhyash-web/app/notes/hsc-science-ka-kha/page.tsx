import type { Metadata } from 'next';
import Link from 'next/link';
import { HscNotesHubClient } from '@/components/notes/HscNotesHubClient';
import { PlayStoreCtaBanner } from '@/components/notes/PlayStoreCtaBanner';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Download,
  FileCheck2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'HSC Science ক ও খ নোট PDF (সব বিষয়) | জ্ঞান ও অনুধাবনমূলক - অভ্যাস',
  description:
    'এইচএসসি বিজ্ঞান বিভাগের পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞান ১ম ও ২য় পত্রের অধ্যায়ভিত্তিক ক ও খ (জ্ঞান ও অনুধাবনমূলক) প্রশ্নের ১০০% নির্ভুল হ্যান্ডনোট ও ফ্রি PDF ডাউনলোড করুন।',
  keywords: [
    'HSC ক ও খ প্রশ্ন PDF',
    'পদার্থবিজ্ঞান ১ম পত্র ক খ নোট',
    'রসায়ন ১ম পত্র ক খ প্রশ্ন',
    'HSC Science Ka Kha Notes Free Download',
    'HSC Short Question Suggestion PDF',
    'অভ্যাস অ্যাপ',
    'Obhyash HSC Notes',
  ],
  alternates: {
    canonical: 'https://obhyash.com/notes/hsc-science-ka-kha',
  },
  openGraph: {
    title: '🔥 HSC বিজ্ঞান বিভাগের সকল বিষয়ের "ক ও খ" স্পেশাল হ্যান্ডনোট (Free PDF)!',
    description:
      'পরীক্ষায় কমন উপযোগী বোর্ড স্ট্যান্ডার্ড জ্ঞান ও অনুধাবনমূলক (ক ও খ) প্রশ্নের গোছানো উত্তরপত্র। পদার্থ ও রসায়ন ১ম পত্র সরাসরি ফ্রি ডাউনলোড করে নাও!',
    url: 'https://obhyash.com/notes/hsc-science-ka-kha',
    siteName: 'অভ্যাস (Obhyash)',
    locale: 'bn_BD',
    type: 'website',
    images: [
      {
        url: 'https://obhyash.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HSC Science Ka & Kha Notes PDF - Obhyash',
      },
    ],
  },
};

const FAQ_ITEMS = [
  {
    q: 'এই হ্যান্ডনোটগুলো কি এইচএসসি ২০২৬ ও ২০২৭ ব্যাচের পূর্ণাঙ্গ সিলেবাস অনুযায়ী তৈরি?',
    a: 'হ্যাঁ! প্রতিটি নোট জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)-এর সর্বশেষ ১০০% পূর্ণাঙ্গ সিলেবাস এবং বিগত ১০ বছরের বোর্ড পরীক্ষার প্রশ্ন বিশ্লেষণ করে অভিজ্ঞ মেন্টরদের দ্বারা প্রস্তুতকৃত।',
  },
  {
    q: 'পদার্থবিজ্ঞান ১ম পত্র ও রসায়ন ১ম পত্রের পিডিএফ কি সম্পূর্ণ ফ্রি?',
    a: 'একদম ফ্রি! কোনো সাবস্ক্রিপশন বা সাইন-আপ ছাড়াই পদার্থবিজ্ঞান ১ম পত্র ও রসায়ন ১ম পত্রের গুগল ড্রাইভ ডিরেক্ট ভিউ ও ডাউনলোড লিংক উন্মুক্ত রয়েছে।',
  },
  {
    q: 'পদার্থ ২য়, রসায়ন ২য়, গণিত ও জীববিজ্ঞানের নোট কীভাবে পড়ব?',
    a: 'বাকি ৪টি বিষয়ের সম্পূর্ণ ক-খ নোট, অধ্যায়ভিত্তিক সূত্র ব্যাংক ও রিভিশন শিট অভ্যাস মোবাইল অ্যাপে এক ক্লিকেই অফলাইনে ডাউনলোড করে কোনো ইন্টারনেট ছাড়াই পড়া যাবে।',
  },
  {
    q: 'নোটগুলোতে কি জ্ঞানমূলক ও অনুধাবনমূলক উভয় প্রশ্নই আছে?',
    a: 'হ্যাঁ, প্রতিটি অধ্যায়ের শুরুতে গুরুত্বপূর্ণ জ্ঞানমূলক (ক) সংজ্ঞা ও তথ্য এবং পরবর্তীতে পূর্ণ নম্বর নিশ্চিত করার মতো ব্যাখ্যা সহ অনুধাবনমূলক (খ) প্রশ্নোত্তর সাজানো রয়েছে।',
  },
];

export default function HscScienceNotesHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'HSC Science জ্ঞান ও অনুধাবনমূলক (ক ও খ) নোটস',
    description:
      'Chapterwise Ka and Kha question-answer notes for HSC Science students in Bangladesh.',
    itemListElement: [
      {
        '@type': 'LearningResource',
        position: 1,
        name: 'পদার্থবিজ্ঞান ১ম পত্র ক ও খ সম্পূর্ণ নোট (Physics 1st Paper)',
        educationalLevel: 'Higher Secondary (HSC)',
        learningResourceType: 'Study Guide / Handnote',
        inLanguage: 'bn-BD',
        isAccessibleForFree: true,
        url: 'https://obhyash.com/notes/hsc-science-ka-kha#physics-1st-paper',
      },
      {
        '@type': 'LearningResource',
        position: 2,
        name: 'রসায়ন ১ম পত্র ক ও খ সম্পূর্ণ নোট (Chemistry 1st Paper)',
        educationalLevel: 'Higher Secondary (HSC)',
        learningResourceType: 'Study Guide / Handnote',
        inLanguage: 'bn-BD',
        isAccessibleForFree: true,
        url: 'https://obhyash.com/notes/hsc-science-ka-kha#chemistry-1st-paper',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-400">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <header className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        {/* Glow Spheres */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-80 bg-gradient-to-tr from-emerald-500/10 via-indigo-500/10 to-teal-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              হোম
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-emerald-600 transition-colors">
              ব্লগ ও রিসোর্স
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ক ও খ নোটস
            </span>
          </nav>

          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              এইচএসসি বিজ্ঞান বিভাগ স্পেশাল রিসোর্স
            </span>
          </div>

          {/* Main H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight mb-6">
            এইচএসসি সকল বিষয়ের{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
              &apos;ক ও খ&apos; স্পেশাল হ্যান্ডনোট
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            বোর্ড পরীক্ষায় জ্ঞান ও অনুধাবনমূলক প্রশ্নের শতভাগ নির্ভুল উত্তরমালা। পদার্থবিজ্ঞান ১ম পত্র ও রসায়ন ১ম পত্র সম্পূর্ণ ফ্রিতে ডাউনলোড করুন; বাকি সকল বিষয়ের নোটস পড়ুন অভ্যাস অ্যাপে।
          </p>

          {/* Quick Value Metrics */}
          <div className="inline-grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-left shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">সিলেবাস</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">১০০% পূর্ণাঙ্গ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">প্রশ্নসংখ্যা</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">২৮০০+ প্রশ্নোত্তর</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">মান নিশ্চিত</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">১০ বছর অ্যানালিসিস</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ডাউনলোড</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">১০০% ফ্রি ড্রাইভ</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Subject Cards Hub with Live Filter */}
        <HscNotesHubClient />

        {/* Play Store CTA Banner */}
        <PlayStoreCtaBanner
          headline="বাকি সকল বিষয়ের ক-খ নোট ও ফর্মুলা ব্যাংক পড়তে অভ্যাস অ্যাপ ডাউনলোড করুন"
          subheadline="পদার্থ ২য়, রসায়ন ২য়, উচ্চতর গণিত ও জীববিজ্ঞানের সকল নোট এক ক্লিকেই অফলাইনে সেভ করে পড়ার সুবিধা।"
        />

        {/* SEO FAQ Section */}
        <section className="mt-16 sm:mt-24 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                <HelpCircle className="w-4 h-4" />
                সাধারণ জিজ্ঞাসা
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
              </h2>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs"
                >
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-2.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Q.</span>
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
