'use client';

import React, { useState } from 'react';
import { Heading, PrimaryButton } from '../ui';

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const normalizeToEn = (str: string) => {
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.split(bnDigits[i]).join(i.toString());
  }
  return res.trim();
};

export const isPhone = (v: string) => {
  const norm = normalizeToEn(v).replace(/\D/g, '');
  return /^01\d{9}$/.test(norm) || /^1\d{9}$/.test(norm) || /^8801\d{9}$/.test(norm);
};

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(normalizeToEn(v));

export default function Identify({
  initial,
  onNext,
  onGoogleLogin,
}: {
  initial: string;
  onNext: (id: string) => Promise<void>;
  onGoogleLogin?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const valid = isPhone(value) || isEmail(value);
  const showErr = touched && value.length > 0 && !valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    try {
      await onNext(normalizeToEn(value));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Heading title="রেজিস্ট্রেশন / লগ ইন" />
      <form className="mt-4 sm:mt-6" onSubmit={handleSubmit}>
        <label htmlFor="id" className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-zinc-300 font-['Kalpurush',sans-serif]">
          মোবাইল নম্বর বা ইমেইল
        </label>
        <div className="group relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-[#ef4136]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          <input
            id="id"
            autoFocus
            value={value}
            onBlur={() => setTouched(true)}
            onChange={(e) => setValue(e.target.value)}
            placeholder="01XXXXXXXXX অথবা example@mail.com"
            className={`h-12 sm:h-14 w-full rounded-2xl border bg-black/40 pl-11 sm:pl-12 pr-4 text-base sm:text-lg text-white outline-none transition placeholder:text-zinc-600 focus:ring-4 focus:ring-[#ef4136]/15 font-['Kalpurush',sans-serif] ${showErr ? 'border-[#ef4136]/70' : 'border-white/10 focus:border-[#ef4136]/60'}`}
          />
        </div>
        {showErr && (
          <p className="mt-1.5 text-xs sm:text-sm text-[#ff6b6b] font-['Kalpurush',sans-serif]">
            সঠিক মোবাইল নম্বর (০১ দিয়ে শুরু, ১১ সংখ্যা) বা ইমেইল দাও
          </p>
        )}
        <PrimaryButton disabled={!valid} loading={loading}>
          এগিয়ে যাও
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </PrimaryButton>
      </form>

      <div className="my-3.5 sm:my-6 flex items-center gap-4 text-xs text-zinc-500 font-['Kalpurush',sans-serif]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        অথবা
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      <button
        type="button"
        onClick={onGoogleLogin}
        className="mx-auto flex h-10 sm:h-11 items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-[#16181e] px-5 text-xs sm:text-sm font-medium text-white shadow-[0_3px_0_#0b0c10] sm:shadow-[0_4px_0_#0b0c10] transition-all duration-100 hover:bg-[#1c1f26] active:translate-y-[3px] active:shadow-none font-['Kalpurush',sans-serif]"
      >
        <svg className="h-4 w-4" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Google দিয়ে চালিয়ে যাও
      </button>
    </>
  );
}
