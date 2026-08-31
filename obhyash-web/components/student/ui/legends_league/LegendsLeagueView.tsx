"use client";

import React from "react";
import {
  Crown,
  Ticket,
  GitFork,
  Swords,
  Zap,
  Trophy,
  ChevronDown,
  CheckSquare,
  BookOpen,
  Calendar,
  Clock,
  Gift,
  Award,
  CheckCircle,
} from "lucide-react";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface LegendsLeagueViewProps {
  currentUser?: UserProfile | null;
  onBack?: () => void;
}

export const LegendsLeagueView: React.FC<LegendsLeagueViewProps> = ({
  currentUser,
  onBack,
}) => {
  const userName = currentUser?.name;

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri'] pb-24 pt-3 sm:pt-5">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 flex flex-col gap-4 sm:gap-5">
        {/* ── 1. Hero Platinum Championship Card ── */}
        <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#182232] border border-[#CBD5E1] dark:border-[#334155] shadow-lg shadow-black/5 dark:shadow-black/30">
          {/* Top Tag & Crown */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] flex items-center gap-1.5 shadow-sm">
              <span className="text-xs">🏆</span>
              <span className="text-xs font-black text-[#1E293B] dark:text-[#E2E8F0]">
                সিজন ১ · আসছে শীঘ্রই
              </span>
            </div>

            <Crown size={22} className="text-[#475569] dark:text-[#E2E8F0]" />
          </div>

          {/* Title & Description */}
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white leading-tight mb-1.5 tracking-tight">
            লেজেন্ডস চ্যাম্পিয়নশিপ ২০২৬
          </h2>

          <p className="text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8] leading-relaxed mb-4">
            ১লা তারিখ সিলেবাস ঘোষণা ও প্রস্তুতি ➔ ২য় সপ্তাহ নকআউট মেধা যুদ্ধ ➔ ১৫ই তারিখ গ্র্যান্ড
            রেজাল্ট ও সেলিব্রেশন।
          </p>

          {/* 4 Highlights Timeline Row */}
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/25 border border-[#E2E8F0] dark:border-[#334155] grid grid-cols-4 divide-x divide-[#E2E8F0] dark:divide-[#334155] text-center mb-3.5">
            <div className="px-1">
              <span className="text-xs font-black text-[#0F172A] dark:text-white block">
                ১ তারিখ
              </span>
              <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                সিলেবাস
              </span>
            </div>
            <div className="px-1">
              <span className="text-xs font-black text-[#0F172A] dark:text-white block">
                ১ম সপ্তাহ
              </span>
              <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                প্রস্তুতি
              </span>
            </div>
            <div className="px-1">
              <span className="text-xs font-black text-[#0F172A] dark:text-white block">
                ২য় সপ্তাহ
              </span>
              <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                নকআউট
              </span>
            </div>
            <div className="px-1">
              <span className="text-xs font-black text-[#0F172A] dark:text-white block">
                ১৫ তারিখ
              </span>
              <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                ফলাফল
              </span>
            </div>
          </div>

          {/* Personalized CTA Pill */}
          <div className="p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] flex items-center gap-2">
            <Ticket size={16} className="text-[#475569] dark:text-[#CBD5E1] shrink-0" />
            <p className="text-xs font-bold text-[#1E293B] dark:text-[#E2E8F0] leading-snug">
              {userName
                ? `${userName}, এই মাসে নিয়মিত পরীক্ষা দিয়ে শীর্ষ ৩০-এ কোয়ালিফাই করো!`
                : "এই মাসে নিয়মিত পরীক্ষা দিয়ে শীর্ষ ৩০-এ কোয়ালিফাই করো!"}
            </p>
          </div>
        </div>

        {/* ── 2. Tournament Bracket Flow Diagram ── */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#111418] border border-[#E2E8F0] dark:border-[#1E242C] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GitFork size={18} className="text-[#F59E0B]" />
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              টুর্নামেন্ট নকআউট ব্র্যাকেট (২য় সপ্তাহ)
            </h3>
          </div>

          <div className="flex flex-col gap-1">
            {[
              {
                step: "১",
                title: "কোয়ার্টার ফাইনাল (Round 1)",
                desc: "সেরা ৩০ জন কোয়ালিফায়ারের মধ্যে প্রথম স্পেশাল মক টেস্ট।",
                qualifyText: "টপ ১৫ জন সেমিফাইনালে উত্তীর্ণ হবে",
                flowLabel: "১৫ জন সেমিফাইনালে",
                color: "#3B82F6",
                bgGradient: "from-blue-600 to-blue-500",
                icon: Swords,
              },
              {
                step: "২",
                title: "সেমিফাইনাল (Semi-Finals)",
                desc: "টপ ১৫ জনের মধ্যে হাই-ইল্ড ট্রিকি কনসেপ্ট টেস্ট।",
                qualifyText: "টপ ৫ জন গ্র্যান্ড ফিনালেতে যাবে",
                flowLabel: "৫ জন গ্র্যান্ড ফিনালেতে",
                color: "#8B5CF6",
                bgGradient: "from-purple-600 to-purple-500",
                icon: Zap,
              },
              {
                step: "৩",
                title: "গ্র্যান্ড ফিনালে (Grand Finale)",
                desc: "চূড়ান্ত ৫ জনের লড়াই—জাতীয় পর্যায়ে শ্রেষ্ঠত্বের পরীক্ষা।",
                qualifyText: "১ জন হবে ন্যাশনাল লেজেন্ডস চ্যাম্পিয়ন 👑",
                flowLabel: "১ম স্থান চ্যাম্পিয়ন",
                color: "#F59E0B",
                bgGradient: "from-amber-500 to-amber-400",
                icon: Trophy,
              },
            ].map((stage, idx, arr) => {
              const Icon = stage.icon;
              const isLast = idx === arr.length - 1;

              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-start gap-3">
                    {/* Left Node */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0 bg-gradient-to-br",
                        stage.bgGradient
                      )}
                    >
                      <Icon size={19} />
                    </div>

                    {/* Right Card */}
                    <div className="flex-1 min-w-0 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#19191D] border border-neutral-200 dark:border-[#2E2E34]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white truncate">
                          {stage.title}
                        </h4>
                        <span
                          style={{ color: stage.color, backgroundColor: `${stage.color}20` }}
                          className="px-2 py-0.5 rounded text-[10px] font-black shrink-0"
                        >
                          ধাপ {stage.step}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
                        {stage.desc}
                      </p>

                      <div
                        style={{ color: stage.color, backgroundColor: `${stage.color}15` }}
                        className="inline-flex px-2 py-0.5 rounded-lg text-xs font-black"
                      >
                        {stage.qualifyText}
                      </div>
                    </div>
                  </div>

                  {/* Connecting Flow Pipe */}
                  {!isLast && (
                    <div className="flex items-center gap-3 my-1">
                      <div className="w-10 flex flex-col items-center justify-center">
                        <div className="w-0.5 h-3 bg-neutral-300 dark:bg-neutral-700" />
                        <ChevronDown size={14} className="text-neutral-400 -my-1" />
                        <div className="w-0.5 h-3 bg-neutral-300 dark:bg-neutral-700" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                        <div className="w-2 h-0.5 bg-neutral-300 dark:bg-neutral-700" />
                        <span>এলিমিনেশন ফিল্টার ➔ {stage.flowLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Qualification & Tournament Rules (৬টি নিয়মাবলী) ── */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#111418] border border-[#E2E8F0] dark:border-[#1E242C] shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="p-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#E2E8F0]">
              <CheckSquare size={16} />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              কোয়ালিফাই ও টুর্নামেন্ট নিয়মাবলী
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {[
              {
                title: "১. মাসব্যাপী প্র্যাকটিস ও টপ ৩০ র‍্যাংক",
                desc: "মাসের ১ থেকে শেষ দিন পর্যন্ত পরীক্ষা দিয়ে মাসিক লিডারবোর্ডে লিজেন্ড লেভেলে সেরা ৩০ জনের মধ্যে অবস্থান নিশ্চিত করো।",
                icon: Trophy,
              },
              {
                title: "২. ১লা তারিখ: গোল্ডেন টিকেট ও সিলেবাস প্রকাশ",
                desc: "মাস শেষ হতেই কোয়ালিফায়ারদের প্রোফাইলে স্পেশাল গোল্ডেন টিকেট আনলক হবে এবং টুর্নামেন্টের নির্দিষ্ট সিলেবাস প্রকাশিত হবে।",
                icon: BookOpen,
              },
              {
                title: "৩. ১ম সপ্তাহ (১–৭ তারিখ): প্রস্তুতি পর্ব",
                desc: "সিলেবাস অনুযায়ী পরীক্ষার জন্য নিজেকে চূড়ান্তভাবে প্রস্তুত করার জন্য পুরো ১ সপ্তাহ ডেডিকেটেড সময় পাওয়া যাবে।",
                icon: Calendar,
              },
              {
                title: "৪. ২য় সপ্তাহ (৮–১৪ তারিখ): ৩ ধাপের নকআউট লড়াই",
                desc: "কোয়ার্টার ফাইনাল, সেমিফাইনাল ও গ্র্যান্ড ফিনালের স্পেশাল লাইভ পরীক্ষা অনুষ্ঠিত হবে (নির্দিষ্ট সময়সূচীতে একবারই সুযোগ, কোনো রি-টেক নেই)।",
                icon: Swords,
              },
              {
                title: "৫. টাইব্রেকার ও নির্ভুলতা লজিক",
                desc: "নম্বর সমান হলে কম সময় (Completion Time) ও উচ্চ নির্ভুলতার (Accuracy) ভিত্তিতে চূড়ান্ত র‍্যাংক নির্ধারিত হবে।",
                icon: Clock,
              },
              {
                title: "৬. ১৫ই তারিখ: গ্র্যান্ড রেজাল্ট ও সেলিব্রেশন",
                desc: "চূড়ান্ত ফলাফল প্রকাশ, বিজয়ীদের প্রোফাইলে সুপ্রিম ব্যাজ আনলক, নগদ প্রাইজ মানি এবং কুরিয়ারে এক্সক্লুসিভ অভ্যাস টি-শার্ট প্রেরণ।",
                icon: Gift,
              },
            ].map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#181C22] border border-[#E2E8F0] dark:border-[#242C36] flex items-start gap-2.5"
                >
                  <div className="p-1 rounded-md bg-[#E2E8F0] dark:bg-[#1E293B] text-[#475569] dark:text-[#CBD5E1] shrink-0 mt-0.5">
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white leading-tight">
                      {rule.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-[#94A3B8] leading-relaxed mt-0.5">
                      {rule.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Champion Perks & Mega Rewards ── */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#111418] border border-[#E2E8F0] dark:border-[#1E242C] shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#E2E8F0]">
                <Award size={16} />
              </div>
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                বিশেষ সম্মাননা ও পুরস্কার
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded border border-[#CBD5E1] dark:border-[#334155] text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
              সিজন ১
            </span>
          </div>

          {/* Tier 1: Grand Champions (Top 1-3) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#06281E] dark:to-[#0C1917] border border-[#86EFAC] dark:border-[#059669]/50 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#064E3B] to-[#047857] flex items-center justify-center text-lg shadow-md shadow-[#064E3B]/30 shrink-0">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    ১ম, ২য় ও ৩য় স্থান
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black">
                    গ্র্যান্ড চ্যাম্পিয়ন
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-[#94A3B8]">
                  প্রাইজ মানি + ব্র্যান্ডেড টি-শার্ট ও সুপ্রিম সম্মাননা
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#10B981]" />
                <span>💰 নগদ প্রাইজ মানি (Cash Prize)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#10B981]" />
                <span>👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#10B981]" />
                <span>🎖️ প্রোফাইলে সুপ্রিম চ্যাম্পিয়ন ব্যাজ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#10B981]" />
                <span>✨ লিডারবোর্ডে গোল্ডেন হ্যালো ফ্রেম</span>
              </div>
            </div>
          </div>

          {/* Tier 2: Top 4-5 Finalists */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#280B14] dark:to-[#180A0F] border border-[#FECDD3] dark:border-[#E11D48]/40 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#881337] to-[#BE123C] flex items-center justify-center text-lg shadow-md shadow-[#881337]/30 shrink-0">
                👕
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    ৪র্থ ও ৫ম স্থান
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                    টপ ৫ ফাইনালিস্ট
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-[#94A3B8]">
                  এক্সক্লুসিভ টি-শার্ট ও ফাইনালিস্ট মেডেল
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#F43F5E]" />
                <span>👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#F43F5E]" />
                <span>🎖️ টপ ৫ ফাইনালিস্ট প্রোফাইল ব্যাজ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#F43F5E]" />
                <span>📜 ডিজিটাল মেরিট সার্টিফিকেট</span>
              </div>
            </div>
          </div>

          {/* Tier 3: All 30 Qualifiers */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] dark:from-[#190D2E] dark:to-[#110B1E] border border-[#E9D5FF] dark:border-[#7C3AED]/40 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4C1D95] to-[#6D28D9] flex items-center justify-center text-lg shadow-md shadow-[#4C1D95]/30 shrink-0">
                🎫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    সকল ৩০ জন কোয়ালিফায়ার
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-black">
                    অংশগ্রহণকারী
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-[#94A3B8]">
                  লেজেন্ডস লিগ সিজন ১ পার্টিসিপেশন স্বীকৃতি
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#A855F7]" />
                <span>🎫 অফিসিয়াল পার্টিসিপেশন সার্টিফিকেট</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#A855F7]" />
                <span>🎖️ সিজন ১ এক্সক্লুসিভ ব্যাজ ও টাইটেল</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendsLeagueView;
