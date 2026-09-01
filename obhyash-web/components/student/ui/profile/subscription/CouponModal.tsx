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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                কুপন কোড প্রয়োগ করো
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                বিশেষ ছাড় উপভোগ করতে কুপন কোড দাও
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {appliedCoupon ? (
            /* Active coupon display */
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    {appliedCoupon.code}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  সক্রিয়
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {appliedCoupon.description}
              </p>
              <button
                onClick={handleRemove}
                className="w-full py-2 bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold transition-colors"
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
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  কুপন কোড (Coupon Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="যেমন: PIONEER"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono uppercase font-bold text-sm placeholder:normal-case placeholder:font-normal placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mt-2">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              {/* Promo recommendation hint */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-amber-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                    অফার কোড: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">PIONEER</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInputCode('PIONEER');
                    handleApply('PIONEER');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                >
                  প্রয়োগ করো
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
