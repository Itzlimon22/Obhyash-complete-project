'use client';

import React, { useState } from 'react';
import { Tag, X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCouponDiscount, AppliedCoupon } from '@/lib/utils/coupon-system';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  appliedCoupon: AppliedCoupon | null;
  samplePrice?: number;
  onApplyCoupon: (couponCode: string) => boolean;
  onRemoveCoupon: () => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  appliedCoupon,
  samplePrice = 149,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApply = (codeToApply?: string) => {
    const code = (codeToApply || inputCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg('কুপন কোড লিখুন');
      return;
    }

    setErrorMsg('');
    const success = onApplyCoupon(code);
    if (success) {
      toast.success(`🎉 '${code}' কুপন সফলভাবে প্রয়োগ করা হয়েছে!`);
      onClose();
    } else {
      setErrorMsg('অকার্যকর কুপন কোড! অনুগ্রহ করে সঠিক কোড দিন।');
      toast.error('ভুল কুপন কোড!');
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setInputCode('');
    setErrorMsg('');
    toast.info('কুপন মুছে ফেলা হয়েছে');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-t-[28px] sm:rounded-[24px] border border-neutral-200/80 dark:border-[#2C2C2E] shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-4 duration-300">
        {/* Mobile handle bar */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-[#3A3A3C] rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2C2C2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-emerald-50 dark:bg-[#052E1B] border border-emerald-200 dark:border-[#16A34A]/40 flex items-center justify-center text-[#16A34A] dark:text-[#4ADE80] shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                কুপন কোড প্রয়োগ করো
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                বিশেষ ছাড় উপভোগ করতে কুপন কোড দাও
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2C2C2E] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {appliedCoupon ? (
            /* Active coupon display */
            <div className="p-4 rounded-[16px] bg-emerald-50/80 dark:bg-[#052E1B]/60 border border-emerald-200 dark:border-[#16A34A]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                  <span className="font-mono font-bold text-sm text-[#004633] dark:text-[#4ADE80] tracking-wider">
                    {appliedCoupon.code}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#16A34A] text-white font-['Anek_Bangla',sans-serif]">
                  সক্রিয়
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-['HindSiliguri',sans-serif]">
                {appliedCoupon.description}
              </p>
              <button
                onClick={handleRemove}
                className="w-full py-2 bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-[14px] text-xs font-bold font-['Anek_Bangla',sans-serif] transition-colors"
              >
                কুপন বাতিল / রিমুভ করো
              </button>
            </div>
          ) : (
            /* Input Form */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApply();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif] mb-1.5">
                  কুপন কোড (Coupon Code)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <Tag size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="যেমন: PIONEER"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] dark:bg-[#27272A] border border-neutral-200 dark:border-[#3A3A3C] rounded-[14px] text-neutral-900 dark:text-white font-mono uppercase font-bold text-sm placeholder:normal-case placeholder:font-normal placeholder:text-neutral-400 focus:outline-none focus:border-[#12544F] focus:ring-1 focus:ring-[#12544F] transition-all"
                  />
                  {inputCode && (
                    <button
                      type="button"
                      onClick={() => setInputCode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {errorMsg && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mt-2 font-['HindSiliguri',sans-serif]">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              {/* Promo recommendation hint */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                  <Tag size={13} className="text-amber-500 shrink-0" />
                  <span>চলতি অফার কুপন: </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode('PIONEER');
                      setErrorMsg('');
                    }}
                    className="font-mono text-xs font-bold text-[#12544F] dark:text-[#4ADE80] underline tracking-wider hover:opacity-80"
                  >
                    PIONEER
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInputCode('PIONEER');
                    handleApply('PIONEER');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#12544F] dark:text-[#2DD4BF] bg-[#12544F]/10 dark:bg-[#12544F]/20 hover:bg-[#12544F]/15 rounded-lg transition-colors font-['Anek_Bangla',sans-serif]"
                >
                  প্রয়োগ করো
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full h-[48px] rounded-xl bg-[#12544F] hover:bg-[#0E423E] active:scale-[0.98] disabled:opacity-50 text-white font-bold text-[15px] font-['Anek_Bangla',sans-serif] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>কুপন যোগ করো</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
