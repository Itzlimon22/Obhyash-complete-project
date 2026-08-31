"use client";

import React from "react";
import { Crown, Sparkles, X, CalendarCheck, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  featurePill?: string;
  icon?: LucideIcon;
  onUpgradeClick?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  title = "প্রো সাবস্ক্রিপশন প্রয়োজন 👑",
  message = "আনলিমিটেড এক্সাম, KaTeX ব্যাখ্যা ও পূর্ণাঙ্গ প্রশ্ন ব্যাংক পেতে প্রো সাবস্ক্রিপশন নাও।",
  featurePill = "প্রো ফিচার",
  icon: Icon = Crown,
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
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#13151F] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-[#2E334D] z-10 animate-in slide-in-from-bottom-6 duration-300">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X size={18} />
        </button>

        {/* Icon & Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-3.5">
            <Icon className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold font-['HindSiliguri'] mb-2.5">
            {featurePill}
          </div>

          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white font-['HindSiliguri'] mb-2">
            {title}
          </h3>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-['HindSiliguri'] leading-relaxed mb-5">
            {message}
          </p>

          {/* Mini Pricing Cards Preview */}
          <div className="w-full grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-[#1C1E2D] p-3 rounded-2xl border border-neutral-200 dark:border-[#2E334D] mb-6">
            <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-[#151722] text-center">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri'] block">১ মাস</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-['HindSiliguri'] block my-0.5">৳১৪৯</span>
              <span className="text-[9px] text-neutral-400 font-['HindSiliguri'] block">স্টার্টার</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-center relative shadow-sm">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold font-['HindSiliguri'] block">৩ মাস</span>
              <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-['HindSiliguri'] block my-0.5">৳৩৪৯</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-['HindSiliguri'] block">জনপ্রিয় 🔥</span>
            </div>

            <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-[#151722] text-center">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri'] block">৬ মাস</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-['HindSiliguri'] block my-0.5">৳৫৯৯</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-['HindSiliguri'] block">৫০% ছাড় 👑</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base font-['HindSiliguri'] shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
          >
            <Sparkles size={18} />
            <span>প্রো প্ল্যানগুলো দেখো</span>
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-['HindSiliguri'] transition"
          >
            পরে করব
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;
