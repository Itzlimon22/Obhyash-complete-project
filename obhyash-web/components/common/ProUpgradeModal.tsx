"use client";

import React from "react";
import { Crown, Zap, X, CalendarCheck, LucideIcon } from "lucide-react";
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
      <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-[24px] p-6 shadow-2xl border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in slide-in-from-bottom-6 duration-300">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-[#3A3A3C] rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2C2C2E] transition"
        >
          <X size={18} />
        </button>

        {/* Icon & Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004633] to-[#059669] flex items-center justify-center shadow-md shadow-emerald-700/20 mb-3">
            <Icon className="w-7 h-7 text-white" />
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#12544F]/10 dark:bg-[#12544F]/20 border border-[#12544F]/30 text-[#12544F] dark:text-[#2DD4BF] text-xs font-bold font-['Anek_Bangla',sans-serif] mb-2">
            {featurePill}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] mb-1.5">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-['HindSiliguri',sans-serif] leading-relaxed mb-5">
            {message}
          </p>

          {/* Mini Pricing Cards Preview */}
          <div className="w-full grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-[#252528] p-2.5 rounded-2xl border border-neutral-200/80 dark:border-[#323236] mb-5">
            <div className="p-2 rounded-xl border border-neutral-200 dark:border-[#323236] bg-white dark:bg-[#1C1C1E] text-center">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-['Anek_Bangla',sans-serif] block">১ মাস</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] block my-0.5">৳১৪৯</span>
              <span className="text-[10px] text-neutral-400 font-['HindSiliguri',sans-serif] block">স্টার্টার</span>
            </div>

            <div className="p-2 rounded-xl border-2 border-[#12544F] bg-[#12544F]/5 dark:bg-[#092328] text-center relative shadow-xs">
              <span className="text-[11px] text-[#12544F] dark:text-[#2DD4BF] font-bold font-['Anek_Bangla',sans-serif] block">৩ মাস</span>
              <span className="text-sm font-bold text-[#12544F] dark:text-[#2DD4BF] font-['Anek_Bangla',sans-serif] block my-0.5">৳৩৪৯</span>
              <span className="text-[10px] text-[#12544F] dark:text-[#2DD4BF] font-bold font-['HindSiliguri',sans-serif] block">জনপ্রিয় 🔥</span>
            </div>

            <div className="p-2 rounded-xl border border-neutral-200 dark:border-[#323236] bg-white dark:bg-[#1C1C1E] text-center">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-['Anek_Bangla',sans-serif] block">৬ মাস</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] block my-0.5">৳৫৯৯</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-['HindSiliguri',sans-serif] block">৫০% ছাড় 👑</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleUpgrade}
            className="w-full h-[48px] rounded-xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-[15px] font-['Anek_Bangla',sans-serif] shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap size={16} />
            <span>প্রো প্ল্যানগুলো দেখো</span>
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-['Anek_Bangla',sans-serif] transition cursor-pointer"
          >
            পরে করব
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;
