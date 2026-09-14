"use client";

import React from "react";
import { SubscriptionPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Crown, Trophy, Zap, Tag, X } from "lucide-react";
import { AppliedCoupon, calculateCouponDiscount } from "@/lib/utils/coupon-system";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  onSelect: () => void;
  appliedCoupon?: AppliedCoupon | null;
  onOpenCouponModal?: () => void;
  onRemoveCoupon?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isCurrent,
  onSelect,
  appliedCoupon,
  onOpenCouponModal,
  onRemoveCoupon,
}) => {
  const isMasterPro = (plan.duration_days ?? 0) >= 180 || plan.price >= 500;
  const isTopRankers =
    ((plan.duration_days ?? 0) >= 90 && (plan.duration_days ?? 0) < 180) ||
    (plan.price >= 300 && plan.price < 500);

  let badgeText = "স্টার্টার ⚡";
  let badgeClasses = "bg-[#12544F] text-white";
  let containerBorder = "border-neutral-200/80 dark:border-white/[0.08]";
  let accentIconBg = "bg-[#12544F]/10 dark:bg-[#12544F]/25 text-[#12544F] dark:text-[#2DD4BF]";
  let monthlyText = "৩০ দিন ফুল অ্যাক্সেস • এককালীন পেমেন্ট";
  let buttonClasses = "bg-[#12544F] hover:bg-[#0E423E] active:scale-[0.98] text-white shadow-sm";

  if (isMasterPro) {
    badgeText = "মেগা সেভার 👑 ৫০% সাশ্রয়";
    badgeClasses = "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-neutral-950 font-black";
    containerBorder = "border-amber-500/40 dark:border-amber-500/40";
    accentIconBg = "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400";
    monthlyText = "প্রতি মাসে মাত্র ৳৯৯ • সেরা লং-টার্ম ভ্যালু!";
    buttonClasses = "bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-105 active:scale-[0.98] text-neutral-950 font-black shadow-sm";
  } else if (isTopRankers) {
    badgeText = "জনপ্রিয় 🌟 ৪১% সাশ্রয়";
    badgeClasses = "bg-[#12544F] text-white font-black";
    containerBorder = "border-[#12544F]/40 dark:border-[#12544F]/40";
    accentIconBg = "bg-[#12544F]/10 dark:bg-[#12544F]/25 text-[#12544F] dark:text-[#2DD4BF]";
    monthlyText = "প্রতি মাসে মাত্র ৳১১৬ • সিজন স্পেশাল!";
    buttonClasses = "bg-[#12544F] hover:bg-[#0E423E] active:scale-[0.98] text-white shadow-sm";
  }

  // Calculate dynamic price based on applied coupon
  const discountInfo =
    appliedCoupon && plan.price > 0
      ? calculateCouponDiscount(appliedCoupon.code, plan.price).appliedCoupon
      : null;

  const displayPrice = discountInfo ? discountInfo.finalPrice : plan.price;
  const hasDiscount = discountInfo && discountInfo.discountAmount > 0;

  return (
    <div
      className={cn(
        "relative rounded-[24px] p-1 font-['HindSiliguri',sans-serif] border transition-all duration-300 shadow-xs",
        containerBorder,
        "flex flex-col h-full"
      )}
    >
      <div
        className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold font-['Anek_Bangla',sans-serif] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs z-20 whitespace-nowrap",
          badgeClasses
        )}
      >
        {badgeText}
      </div>

      <div className="bg-white dark:bg-[#121212] rounded-[20px] h-full flex flex-col overflow-hidden relative border border-neutral-100 dark:border-white/[0.08]">
        <div className="p-5 sm:p-6 flex-1 flex flex-col items-center text-center relative z-10">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-xl shadow-xs",
              accentIconBg
            )}
          >
            {isMasterPro ? (
              <Crown className="w-6 h-6 text-amber-500" />
            ) : isTopRankers ? (
              <Trophy className="w-6 h-6 text-[#12544F] dark:text-[#2DD4BF]" />
            ) : (
              <Zap className="w-6 h-6 text-[#12544F] dark:text-[#2DD4BF]" />
            )}
          </div>

          <h3 className="font-['Anek_Bangla',sans-serif] text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-wide mb-2">
            {plan.name}
          </h3>

          {/* Pricing Display */}
          <div className="flex flex-col items-center justify-center mb-1">
            {hasDiscount && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 line-through font-bold mb-0.5 font-['Anek_Bangla',sans-serif]">
                <span>মূল্য: ৳{BanglaNameHelper.toBanglaNumeral(plan.price)}</span>
              </div>
            )}
            <div className="flex items-start justify-center gap-1 relative font-['Anek_Bangla',sans-serif]">
              <span className="text-2xl sm:text-3xl font-black text-neutral-400 mt-1">
                ৳
              </span>
              <span
                className={cn(
                  "text-4xl sm:text-5xl font-black tracking-tight tabular-nums",
                  hasDiscount
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-900 dark:text-white"
                )}
              >
                {BanglaNameHelper.toBanglaNumeral(displayPrice)}
              </span>
              {plan.price > 0 && (
                <span className="text-neutral-500 dark:text-neutral-400 font-bold text-xs sm:text-sm mt-auto mb-1.5 ml-1">
                  /{plan.duration_days ? `${BanglaNameHelper.toBanglaNumeral(plan.duration_days)} দিন` : plan.billingCycle === "Half-Yearly" ? "৬ মাস" : plan.billingCycle === "Quarterly" ? "৩ মাস" : "মাস"}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-5 font-['Anek_Bangla',sans-serif]">
            {monthlyText}
          </p>

          <ul className="space-y-2.5 w-full text-left mb-6 flex-1">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    accentIconBg
                  )}
                >
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto w-full pt-2">
            {/* Coupon button / badge */}
            {plan.price > 0 && !isCurrent && (
              <div className="mb-2.5 flex items-center justify-center">
                {hasDiscount && discountInfo ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-['Anek_Bangla',sans-serif]">
                    <Tag size={12} className="text-emerald-500 shrink-0" />
                    <span>{discountInfo.code} কুপন যুক্ত (৳{BanglaNameHelper.toBanglaNumeral(discountInfo.discountAmount)} ছাড়)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCoupon?.();
                      }}
                      className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="কুপন বাদ দাও"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCouponModal?.();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-[#12544F] dark:hover:text-[#2DD4BF] font-bold font-['Anek_Bangla',sans-serif] transition-colors hover:underline cursor-pointer"
                  >
                    <Tag size={12} className="text-emerald-500 shrink-0" />
                    <span>কুপন কোড আছে?</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onSelect}
              className={cn(
                "w-full h-[46px] rounded-xl font-['Anek_Bangla',sans-serif] font-bold text-[15px] tracking-[0.2px] transition-all cursor-pointer select-none",
                isCurrent
                  ? "bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-500 dark:text-neutral-400 border border-neutral-200/80 dark:border-white/[0.08] cursor-default"
                  : buttonClasses
              )}
            >
              {isCurrent ? "বর্তমান প্ল্যান" : "এই প্ল্যানটি নাও"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
