"use client";

import React from "react";
import { ArrowLeft, X, Package, Infinity as InfinityIcon, Bot, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  primaryButtonText?: string;
  featurePill?: string;
  icon?: any;
  onUpgradeClick?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  title = "আনলিমিটেড মক টেস্ট",
  message = "মাত্র একটি সাবস্ক্রিপশনে",
  primaryButtonText = "অভ্যাস প্রিমিয়ামে আপগ্রেড করো",
  featurePill = "মক টেস্ট লিমিট শেষ",
  onUpgradeClick,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      router.push("/subscription");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200 font-['HindSiliguri',sans-serif]">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[420px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0F1117] rounded-[28px] p-5 sm:p-6 shadow-2xl border border-neutral-200/80 dark:border-white/[0.08] z-10 animate-in zoom-in-95 duration-200">
        
        {/* Top Bar: Back on left, Close on right */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#1E2230] hover:bg-neutral-200 dark:hover:bg-[#2A2F42] flex items-center justify-center text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-800 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#1E2230] hover:bg-neutral-200 dark:hover:bg-[#2A2F42] flex items-center justify-center text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Center Illustration: Pencil Card with Exclamation Badge */}
        <div className="flex flex-col items-center text-center mt-1">
          <div className="relative w-[92px] h-[92px] flex items-center justify-center mb-3">
            {/* Outer Rounded Red Card */}
            <div className="w-[82px] h-[82px] rounded-[24px] bg-gradient-to-br from-[#F87171] via-[#EF4444] to-[#DC2626] border-[3.5px] border-[#FFD5D2] shadow-xl shadow-red-500/25 flex items-center justify-center relative overflow-hidden">
              {/* Rotated Pencil Graphic */}
              <div className="rotate-[-45deg] flex items-center">
                <div className="w-2 h-5 bg-[#FB7185] rounded-l-sm" />
                <div className="w-5 h-5 bg-[#E11D48]" />
                <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[12px] border-l-[#FDE68A] relative">
                  <div className="absolute -left-[12px] -top-[4px] w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-[#1E293B]" />
                </div>
              </div>
            </div>

            {/* Alert "!" bubble at bottom-right */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFE4E6] border-[2px] border-[#BE123C] shadow-md flex items-center justify-center text-[#9F1239] font-black text-sm leading-none">
              !
            </div>
          </div>

          {/* Pill Badge: মক টেস্ট লিমিট শেষ */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FFF0F0] dark:bg-[#381519] border border-[#FFD4D4] dark:border-[#5C1D24] text-[#E11D48] text-xs font-bold mb-3">
            {featurePill}
          </div>

          {/* Main Headline */}
          <h3 className="text-2xl sm:text-[25px] font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-lg sm:text-[19px] font-extrabold text-neutral-700 dark:text-neutral-200 mt-1 mb-2.5">
            {message}
          </p>

          {/* "সাথে আরো থাকবে" with ambient pinkish glow */}
          <div className="relative w-full flex items-center justify-center my-1 py-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-100/60 dark:via-rose-950/40 to-transparent blur-xs rounded-full" />
            <span className="relative z-10 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              সাথে আরো থাকবে
            </span>
          </div>

          {/* 4 Feature Items Matching Screenshot */}
          <div className="w-full text-left space-y-3.5 mt-3 mb-6">
            {/* Feature 1: বিগত বছরসমূহের প্রশ্ন ব্যাংক */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0 text-white">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight">
                  বিগত বছরসমূহের প্রশ্ন ব্যাংক
                </h4>
                <p className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  ৫০,০০০+ প্রশ্ন ও নির্ভুল ব্যাখ্যা ডাটাবেজ
                </p>
              </div>
            </div>

            {/* Feature 2: আনলিমিটেড পরীক্ষা ও ব্যাখ্যা */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/20 flex items-center justify-center shrink-0 text-white">
                <InfinityIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight">
                  আনলিমিটেড পরীক্ষা ও ব্যাখ্যা
                </h4>
                <p className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  প্র্যাকটিসের মাধ্যমে নিজেকে পূর্ণাঙ্গ তৈরি করো...
                </p>
              </div>
            </div>

            {/* Feature 3: AI অ্যাসিস্টেন্ট ও ডাউট সলভার */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight">
                  AI অ্যাসিস্টেন্ট ও ডাউট সলভার
                </h4>
                <p className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  যেকোনো প্রশ্নের স্মার্ট ব্যাখ্যা ও সমাধান
                </p>
              </div>
            </div>

            {/* Feature 4: লাইভ উইকলি মডেল টেস্ট */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-md shadow-rose-500/20 flex flex-col items-center justify-center shrink-0 text-white p-1">
                <span className="text-[6.5px] font-black tracking-tighter leading-none">WEEKLY</span>
                <span className="text-[6px] font-bold text-amber-200 leading-none">EXAM</span>
                <span className="text-[13px] font-black leading-none mt-0.5">7</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight">
                  লাইভ উইকলি মডেল টেস্ট
                </h4>
                <p className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                  এডমিশন ও বোর্ড স্ট্যান্ডার্ড লাইভ পরীক্ষা
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA Button (Signature Obhyash Deep Emerald Gradient) */}
          <button
            onClick={handleUpgrade}
            className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-[#004633] to-[#065F46] hover:from-[#003828] hover:to-[#054F3A] text-white font-bold text-[16px] shadow-lg shadow-[#004633]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{primaryButtonText}</span>
          </button>

          {/* Secondary Button: পরে করবো */}
          <button
            onClick={onClose}
            className="mt-2.5 py-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            পরে করবো
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;
