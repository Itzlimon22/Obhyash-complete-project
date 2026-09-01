'use client';

import React from 'react';
import {
  Flame,
  Target,
  Zap,
  Layers,
  BookOpen,
  Trophy,
  LineChart,
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface AboutUsViewProps {
  initialPolicy?: string;
}

export const AboutUsView: React.FC<AboutUsViewProps> = () => {
  const cardBgClass =
    'bg-white dark:bg-[#18181B] rounded-[18px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-4';

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Hero Branding Banner (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] dark:from-[#152922] dark:to-[#0F1A15] border border-[#059669]/20 dark:border-[#059669]/35 shadow-md shadow-[#059669]/10 text-center mb-5">
        <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#004633] to-[#059669] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#059669]/40 mb-4">
          <Flame className="w-10 h-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white leading-tight">
          Obhyash (অভ্যাস)
        </h2>
        <p className="text-sm sm:text-base font-bold text-[#10B981] mt-1">
          স্মার্ট প্রস্তুতি, নিশ্চিত সাফল্য
        </p>

        <div className="mt-3.5 inline-block px-3 py-1 rounded-full bg-white dark:bg-[#27272A] border border-[#CBD5E1] dark:border-[#3F3F46] text-xs font-bold text-[#475569] dark:text-[#A1A1AA]">
          📱 App Version: 1.0.0 (Official)
        </div>
      </div>

      {/* ── 2. 3 Stats Counter Row (1:1 with Flutter) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-center shadow-2xs">
          <span className="text-base sm:text-lg font-black text-[#3B82F6] block">
            ৫০,০০০+
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mt-0.5">
            মানসম্মত প্রশ্ন
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-center shadow-2xs">
          <span className="text-base sm:text-lg font-black text-[#10B981] block">
            বিস্তারিত
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mt-0.5">
            ব্যাখ্যা ও ট্রিকস
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-center shadow-2xs">
          <span className="text-base sm:text-lg font-black text-[#F59E0B] block">
            তাত্ক্ষণিক
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] block mt-0.5">
            মেধাতালিকা
          </span>
        </div>
      </div>

      {/* ── 3. Mission & Vision (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="p-1.5 rounded-lg bg-[#059669]/10 text-[#059669]">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
            আমাদের ভিশন ও লক্ষ্য
          </h3>
        </div>
        <p className="text-sm text-[#334155] dark:text-[#D4D4D8] leading-relaxed">
          বাংলাদেশের প্রতিটি শিক্ষার্থীর কাছে সহজ, সাশ্রয়ী ও আধুনিক পরীক্ষার পরিবেশ পৌঁছে দেওয়াই ‘অভ্যাস’-এর মূল লক্ষ্য। আমরা বিশ্বাস করি, গতানুগতিক পড়ার চেয়ে নিয়মিত সঠিক মূল্যায়ন ও স্মার্ট অনুশীলনই একজন শিক্ষার্থীকে কাঙ্ক্ষিত লক্ষ্যে পৌঁছে দেয়।
        </p>
      </div>

      {/* ── 4. Core Features Matrix (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
            অ্যাপের বিশেষত্বসমূহ
          </h3>
        </div>

        <div className="space-y-3.5">
          {[
            {
              icon: Layers,
              title: 'কাস্টম চ্যাপ্টার ও বিষয়ভিত্তিক টেস্ট',
              desc: 'পছন্দমতো এক বা একাধিক অধ্যায় ও সময় নির্ধারণ করে সাথে সাথে অনলাইন পরীক্ষা।',
            },
            {
              icon: BookOpen,
              title: 'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা',
              desc: 'ভুল উত্তরের সঠিক লজিক, শর্টকাট ট্রিকস ও সূত্রের বিস্তারিত আলোচনা।',
            },
            {
              icon: Trophy,
              title: 'লাইভ পরীক্ষা ও জাতীয় মেধা তালিকা',
              desc: 'সারাদেশের শিক্ষার্থীদের সাথে একই সাথে লাইভ মডেল টেস্টে অংশগ্রহণ ও পারসেন্টাইল র‍্যাংক।',
            },
            {
              icon: LineChart,
              title: 'স্মার্ট পারফরম্যান্স অ্যানালিটিক্স',
              desc: 'দুর্বল টপিক ট্র্যাকার ও বিষয়ভিত্তিক সফলতার প্রোগ্রেস গ্রাফ।',
            },
            {
              icon: Flame,
              title: 'ডেইলি স্ট্রিক ও ফ্ল্যাশকার্ড রিভিশন',
              desc: 'প্রতিদিনের পড়া মনে রাখার বৈজ্ঞানিক ফ্ল্যাশকার্ড ও স্ট্রিক ট্র্যাকিং।',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#059669]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Connect & Support (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white mb-3">
          আমাদের সাথে যোগাযোগ
        </h3>

        <div className="space-y-2">
          <a
            href="https://obhyash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-neutral-50 dark:bg-[#27272A] flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-[#323238] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4.5 h-4.5 text-[#059669]" />
              <div>
                <span className="text-xs font-bold text-[#0F172A] dark:text-white block">
                  অফিসিয়াল ওয়েবসাইট
                </span>
                <span className="text-xs text-[#10B981] font-semibold">
                  obhyash.com
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>

          <a
            href="mailto:support@obhyash.com"
            className="p-3 rounded-xl bg-neutral-50 dark:bg-[#27272A] flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-[#323238] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4.5 h-4.5 text-[#059669]" />
              <div>
                <span className="text-xs font-bold text-[#0F172A] dark:text-white block">
                  ইমেইল সাপোর্ট
                </span>
                <span className="text-xs text-[#10B981] font-semibold">
                  support@obhyash.com
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        </div>
      </div>

      {/* ── Copyright Footer ── */}
      <div className="text-center pt-2">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          © 2026 Obhyash Technologies. All rights reserved.
        </p>
        <p className="text-[11px] font-semibold text-[#059669] mt-0.5">
          Made with ❤️ for Bangladeshi Students
        </p>
      </div>
    </div>
  );
};

const cardContainerClass =
  'bg-white dark:bg-[#18181B] rounded-[18px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-4';

export default AboutUsView;
