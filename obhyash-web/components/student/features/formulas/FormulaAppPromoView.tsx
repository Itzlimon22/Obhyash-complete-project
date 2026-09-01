"use client";

import React from "react";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Zap,
  WifiOff,
  Search,
  ArrowLeft,
  Share2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── App Download Links (Configure easily whenever ready) ────────────────────
export const GOOGLE_PLAY_STORE_URL: string = "https://play.google.com/store/apps/details?id=com.obhyash.app";
export const DIRECT_APK_DOWNLOAD_URL: string = "#"; // Replace with actual .apk file URL when available

interface FormulaAppPromoViewProps {
  onBack?: () => void;
}

export const FormulaAppPromoView: React.FC<FormulaAppPromoViewProps> = ({ onBack }) => {
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("লিংক কপি করা হয়েছে!");
    }
  };

  const handleDownloadClick = (type: "playstore" | "apk") => {
    if (type === "playstore") {
      if (GOOGLE_PLAY_STORE_URL && GOOGLE_PLAY_STORE_URL !== "#") {
        window.open(GOOGLE_PLAY_STORE_URL, "_blank");
      } else {
        toast.info("গুগল প্লে স্টোর লিংক শীঘ্রই আসছে!");
      }
    } else {
      if (DIRECT_APK_DOWNLOAD_URL && DIRECT_APK_DOWNLOAD_URL !== "#") {
        window.open(DIRECT_APK_DOWNLOAD_URL, "_blank");
      } else {
        toast.info("সরাসরি APK ডাউনলোড লিংক শীঘ্রই যুক্ত করা হবে!");
      }
    }
  };

  const features = [
    {
      icon: WifiOff,
      title: "সম্পূর্ণ অফলাইন সুবিধা",
      desc: "একবার লোড হলে ইন্টারনেট কানেকশন ছাড়াও সব সূত্র পড়া ও রিভিশন দেওয়া যায়।",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      icon: BookOpen,
      title: "এইচএসসি ও ভর্তি পরীক্ষার সকল বিষয়",
      desc: "পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত এবং আইসিটির চ্যাপ্টারভিত্তিক সাজানো সূত্রাবলি।",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
    },
    {
      icon: Zap,
      title: "কুইক রিভিশন কার্ড",
      desc: "পরীক্ষার আগের রাতে বা সকালে মাত্র ১০ মিনিটে পুরো বই রিভিশনের স্মার্ট ফ্ল্যাশ ভিউ।",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
    },
    {
      icon: Search,
      title: "ইনস্ট্যান্ট সার্চ ও শর্টকাট",
      desc: "যেকোনো টপিক বা সূত্রের নাম লিখে সার্চ করলেই তাৎক্ষণিক সমাধান ও শর্টকাট ট্রিকস।",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40",
    },
  ];

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-1 sm:px-3 py-2 sm:py-4 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── Main Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-[#18181B] dark:via-[#13201B] dark:to-[#0F1714] border border-emerald-100 dark:border-emerald-900/40 p-6 sm:p-8 md:p-10 shadow-lg shadow-emerald-950/5 mb-6 sm:mb-8">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-400/10 dark:bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
          {/* Left content */}
          <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-xs">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>শুধুমাত্র মোবাইল অ্যাপে উপলব্ধ</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 dark:text-white leading-tight tracking-tight">
              ফর্মুলা ও শর্টকাট শিট এক ক্লিকে
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed">
              এইচএসসি ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত এবং আইসিটির সকল সূত্র অফলাইনে দেখতে এবং রিভিশন দিতে আজই <strong>অভ্যাস (Obhyash)</strong> অ্যাপ ইনস্টল করো।
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {/* Play Store Button */}
              <button
                type="button"
                onClick={() => handleDownloadClick("playstore")}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#004633] hover:bg-[#003728] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer"
              >
                <Smartphone size={20} />
                <div className="text-left">
                  <span className="text-[10px] font-medium opacity-80 block leading-none">
                    GET IT ON
                  </span>
                  <span className="text-xs sm:text-sm font-black leading-tight">
                    Google Play Store
                  </span>
                </div>
              </button>

              {/* Direct APK Button */}
              <button
                type="button"
                onClick={() => handleDownloadClick("apk")}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-[#202024] hover:bg-neutral-50 dark:hover:bg-[#27272C] text-neutral-800 dark:text-white border border-neutral-200 dark:border-[#333338] font-bold text-sm sm:text-base shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download size={18} className="text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-none">
                    সরাসরি ইনস্টল
                  </span>
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    Download APK
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Visual Icon Preview */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-2xl shadow-emerald-600/30 shrink-0">
            <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#18181B] flex flex-col items-center justify-center p-4 text-center gap-2 border border-white/20">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#004633] dark:text-emerald-400">
                <BookOpen size={32} />
              </div>
              <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">
                অভ্যাস মোবাইল অ্যাপ
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                Formula Bank & Exam Prep
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Highlights Grid ── */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mb-4">
          অ্যাপে যা যা সুবিধা পাবে:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-xs flex items-start gap-3.5"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${feat.bg} ${feat.color}`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Notice / Share Box ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100 dark:bg-[#1C1C20] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
            বন্ধুদের সাথে শেয়ার করো
          </h4>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
            যাতে তারাও মোবাইল অ্যাপ ডাউনলোড করে সহজেই সকল ফর্মুলা রিভিশন দিতে পারে।
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#27272A] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Share2 size={14} />
          <span>লিংক কপি করো</span>
        </button>
      </div>
    </div>
  );
};

export default FormulaAppPromoView;
