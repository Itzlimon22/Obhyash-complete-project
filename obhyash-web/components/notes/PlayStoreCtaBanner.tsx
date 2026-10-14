'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PLAY_STORE_URL } from '@/data/hsc-ka-kha-notes';
import { Download, Star, ShieldCheck, Zap } from 'lucide-react';

interface PlayStoreCtaBannerProps {
  headline?: string;
  subheadline?: string;
}

export function PlayStoreCtaBanner({
  headline = 'সম্পূর্ণ ক-খ নোট ও ফর্মুলা ব্যাংক পড়তে অভ্যাস অ্যাপ ইনস্টল করুন',
  subheadline = 'গাইড বইয়ের ভিড়ে সময় নষ্ট না করে সরাসরি তোমার ফোনে অফলাইনে পড়ুন সকল বিষয়ের বোর্ড স্ট্যান্ডার্ড নোটস।',
}: PlayStoreCtaBannerProps) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Hero / Inline CTA Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-7 sm:p-10 border border-indigo-700/40 shadow-2xl overflow-hidden my-10">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 mb-4">
            <Zap className="w-3.5 h-3.5" />
            ১০০% ফ্রি অফলাইন এক্সেস
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            {headline}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-2xl">
            {subheadline}
          </p>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-base flex items-center gap-3 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>অভ্যাস অ্যাপ ডাউনলোড করুন (Free)</span>
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-300">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold text-white ml-1">৪.৯/৫</span>
            </div>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              হাজারো এইচএসসি শিক্ষার্থীর পছন্দ
            </span>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Download Bar */}
      {showSticky && (
        <aside
          aria-label="App download prompt"
          className="fixed bottom-0 inset-x-0 z-50 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 md:hidden transition-all animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs bg-emerald-500 shrink-0">
              <Image
                src="/app_logo.png"
                alt="Obhyash App Logo"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                অভ্যাস - HSC ও Admission
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                সব নোটস অফলাইনে ফ্রিতে পড়ুন
              </p>
            </div>
          </div>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shrink-0 shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
          >
            ইনস্টল করুন
          </a>
        </aside>
      )}
    </>
  );
}
