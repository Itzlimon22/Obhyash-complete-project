import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppExclusiveHeader } from '@/components/notes/AppExclusiveHeader';
import { AppMockupGrid } from '@/components/notes/AppMockupGrid';
import { PlayStoreCtaBanner } from '@/components/notes/PlayStoreCtaBanner';
import { PLAY_STORE_URL } from '@/data/hsc-ka-kha-notes';
import {
  Download,
  WifiOff,
  BookOpenCheck,
  LayoutGrid,
  ShieldAlert,
  ArrowLeft,
  Star,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'সম্পূর্ণ ক ও খ হ্যান্ডনোট ও ফর্মুলা ব্যাংক অফলাইনে পড়ুন | অভ্যাস অ্যাপ',
  description:
    'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞানের সকল বিষয়ের অধ্যায়ভিত্তিক ক ও খ হ্যান্ডনোট, ফর্মুলা ব্যাংক ও রিভিশন শিট সরাসরি অফলাইনে পড়ুন অভ্যাস (Obhyash) মোবাইল অ্যাপে।',
  alternates: {
    canonical: 'https://obhyash.com/notes/app-exclusive',
  },
  openGraph: {
    title: '📱 সব বিষয়ের ক ও খ হ্যান্ডনোট ও মাস্টার ফর্মুলা এখন তোমার ফোনে অফলাইনে!',
    description:
      'গাইড বইয়ের ভিড়ে সময় নষ্ট না করে সরাসরি অভ্যাস অ্যাপে অফলাইনে পড়ুন এইচএসসি বিজ্ঞান বিভাগের শতভাগ নির্ভুল নোটস।',
    url: 'https://obhyash.com/notes/app-exclusive',
    siteName: 'অভ্যাস (Obhyash)',
    locale: 'bn_BD',
    type: 'website',
  },
};

const VALUE_PILLARS = [
  {
    icon: WifiOff,
    title: '১০০% অফলাইন রিডিং সাপোর্ট',
    description:
      'একবার নোট ওপেন করলেই ফোনে স্বয়ংক্রিয়ভাবে সেভ হয়ে যায়। ইন্টারনেট বা ওয়াইফাই ছাড়াও যেকোনো সময় পড়া সম্ভব।',
    color: 'from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: BookOpenCheck,
    title: 'বোর্ড স্ট্যান্ডার্ড নির্ভুল ক ও খ নোটস',
    description:
      'বিগত ১০ বছরের বোর্ড প্রশ্ন এবং শীর্ষ নটর ডেম, ভিকারুননিসা ও রাজউক কলেজের টেস্ট পেপার অ্যানালিসিস করে প্রস্তুত।',
    color: 'from-blue-500/15 to-indigo-500/15 text-blue-600 dark:text-blue-400',
  },
  {
    icon: LayoutGrid,
    title: 'চ্যাপ্টার ও টপিকভিত্তিক সুবিন্যস্ত',
    description:
      'শত শত পৃষ্ঠার পিডিএফ স্ক্রল করার ঝামেলা নেই। অ্যাপে সরাসরি যে অধ্যায় বা টপিক প্রয়োজন, সেখানে এক ট্যাপেই পৌঁছানো যায়।',
    color: 'from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-400',
  },
  {
    icon: ShieldAlert,
    title: 'কোনো বিরক্তিকর বিজ্ঞাপন নেই',
    description:
      'পড়ার গভীর মনোযোগ ধরে রাখতে অ্যাপটি সম্পূর্ণ অহেতুক বিজ্ঞাপনমুক্ত এবং মসৃণ ডার্ক-মোড রিডিং এক্সপেরিয়েন্স দেয়।',
    color: 'from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400',
  },
];

export default function AppExclusiveNotesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-400">
      {/* Top Header Section */}
      <header className="relative pt-10 pb-12 sm:pt-16 sm:pb-16 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-72 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/notes/hsc-science-ka-kha"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>সকল বিষয়ের ফ্রি নোটস তালিকায় ফিরে যান</span>
            </Link>
          </div>

          {/* Dynamic Subject Heading via Suspense */}
          <Suspense
            fallback={
              <div className="mb-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-4 shadow-xs">
                  ✨ সকল বিষয়ের সম্পূর্ণ ক ও খ হ্যান্ডনোট এখন অভ্যাস অ্যাপে
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto mb-5">
                  পরীক্ষার আগে ক-খ রিভিশনে বইয়ের ভিড়ে সময় নষ্ট? সব নোট একসাথে অফলাইনে তোমার ফোনে!
                </h1>
              </div>
            }
          >
            <AppExclusiveHeader />
          </Suspense>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-center leading-relaxed mb-8">
            গাইড বই বা অগোছালো পিডিএফ খোঁজার দিন শেষ। অভ্যাস (Obhyash) অ্যাপে পাচ্ছো পদার্থ, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞানের ১ম ও ২য় পত্রের ১০০% বোর্ড স্ট্যান্ডার্ড &apos;ক ও খ&apos; হ্যান্ডনোট, ফর্মুলা শিট এবং কুইক রিভিশন নোটস—সম্পূর্ণ ফ্রিতে এবং ইন্টারনেট ছাড়াই!
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>অভ্যাস অ্যাপ ডাউনলোড করুন (Free)</span>
            </a>

            <Link
              href="/notes/hsc-science-ka-kha"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>পদার্থ ১ ও রসায়ন ১ ফ্রি ডাউনলোড</span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-5">
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">৪.৯/৫ রেটিং</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              হাজারো এইচএসসি শিক্ষার্থীর পছন্দ
            </span>
          </div>
        </div>
      </header>

      {/* Main Showcase Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Core Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {VALUE_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section Heading: Mockup Showcase */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
            অভ্যাস মোবাইল অ্যাপ এক্সপেরিয়েন্স
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            তোমার সম্পূর্ণ পড়ার অভিজ্ঞতা যেমন হবে
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ঝকঝকে এইচডি ভেক্টর কোয়ালিটি, চ্যাপ্টারভিত্তিক ফিল্টারিং এবং মাস্টার ফর্মুলা ব্যাংক।
          </p>
        </div>

        {/* 2-Per-Row S25 Mockup Grid */}
        <AppMockupGrid />

        {/* Bottom Play Store CTA Banner */}
        <PlayStoreCtaBanner
          headline="আজই প্রস্তুতি শুরু করো অভ্যাস অ্যাপের সাথে"
          subheadline="ফ্রি অ্যাকাউন্ট তৈরি করে তোমার কাঙ্ক্ষিত বিষয়ের ক-খ হ্যান্ডনোটস ও রিভিশন শিট সরাসরি সেভ করে নাও।"
        />
      </main>
    </div>
  );
}
