"use client";

import React from "react";
import { SubscriptionPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Crown, Sparkles, Zap, Tag, X } from "lucide-react";
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
  let badgeClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white";
  let containerBorder = "bg-neutral-200 dark:bg-neutral-800 hover:border-indigo-500/50";
  let accentIconBg = "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400";
  let monthlyText = "৩০ দিন ফুল অ্যাক্সেস • এককালীন পেমেন্ট";
  let buttonClasses = "bg-[#004633] hover:bg-[#003627] text-white shadow-emerald-950/20";

  if (isMasterPro) {
    badgeText = "মেগা সেভার 👑 ৫০% সাশ্রয়";
    badgeClasses = "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-neutral-950 font-black";
    containerBorder = "bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 shadow-2xl shadow-amber-500/20";
    accentIconBg = "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400";
    monthlyText = "প্রতি মাসে মাত্র ৳৯৯ • সেরা লং-টার্ম ভ্যালু!";
    buttonClasses = "bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-black shadow-amber-500/30 hover:brightness-105";
  } else if (isTopRankers) {
    badgeText = "জনপ্রিয় 🌟 ৪১% সাশ্রয়";
    badgeClasses = "bg-gradient-to-r from-[#004633] via-emerald-600 to-teal-600 text-white font-black";
    containerBorder = "bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 shadow-2xl shadow-emerald-500/20";
    accentIconBg = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400";
    monthlyText = "প্রতি মাসে মাত্র ৳১১৬ • সিজন স্পেশাল!";
    buttonClasses = "bg-[#004633] hover:bg-[#003627] text-white shadow-emerald-900/30";
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
        "relative rounded-3xl p-1 font-['HindSiliguri']",
        containerBorder,
        "flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
      )}
    >
      <div
        className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg z-20 whitespace-nowrap",
          badgeClasses
        )}
      >
        {badgeText}
      </div>

      <div className="bg-white dark:bg-[#18181B] rounded-[22px] h-full flex flex-col overflow-hidden relative border border-neutral-200/50 dark:border-neutral-800">
        <div className="p-5 sm:p-7 flex-1 flex flex-col items-center text-center relative z-10">
          <div
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 text-xl sm:text-2xl shadow-sm",
              accentIconBg
            )}
          >
            {isMasterPro ? (
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            ) : isTopRankers ? (
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            ) : (
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-neutral-800 dark:text-neutral-200 tracking-wide mb-2">
            {plan.name}
          </h3>

          {/* Pricing Display */}
          <div className="flex flex-col items-center justify-center mb-1">
            {hasDiscount && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 line-through font-bold mb-0.5">
                <span>মূল্য: ৳{BanglaNameHelper.toBanglaNumeral(plan.price)}</span>
              </div>
            )}
            <div className="flex items-start justify-center gap-1 relative">
              <span className="text-2xl sm:text-3xl font-black text-neutral-400 mt-1 sm:mt-2">
                ৳
              </span>
              <span
                className={cn(
                  "text-4xl sm:text-5xl font-black tracking-tighter tabular-nums",
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

          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-5 sm:mb-6">
            {monthlyText}
          </p>

          <ul className="space-y-2.5 sm:space-y-3 w-full text-left mb-6 sm:mb-8 flex-1">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300"
              >
                <div
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    accentIconBg
                  )}
                >
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={3} />
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
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                    <Tag size={12} className="text-emerald-500 shrink-0" />
                    <span>{discountInfo.code} কুপন যুক্ত (৳{BanglaNameHelper.toBanglaNumeral(discountInfo.discountAmount)} ছাড়)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCoupon?.();
                      }}
                      className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded text-neutral-500 hover:text-red-600 transition-colors"
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
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-colors hover:underline"
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
                "w-full py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-95",
                isCurrent
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-default"
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
