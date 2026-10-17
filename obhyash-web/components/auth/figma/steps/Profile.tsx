'use client';

import React, { useState } from 'react';
import { BackButton, Heading } from '../ui';
import { isPhone } from './Identify';

export default function Profile({
  id,
  onBack,
  onEditId,
  onDone,
}: {
  id: string;
  onBack: () => void;
  onEditId?: () => void;
  onDone: (data: { password: string; secondaryId: string }) => Promise<{ success: boolean; error?: string }>;
}) {
  const isInitialPhone = isPhone(id);

  const [secondaryId, setSecondaryId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    const cleanSec = secondaryId.trim();
    if (!cleanSec) {
      setErr(isInitialPhone ? 'ইমেইল অ্যাড্রেস (Gmail) প্রদান করা বাধ্যতামূলক' : 'মোবাইল নম্বর প্রদান করা বাধ্যতামূলক');
      return;
    }

    if (isInitialPhone) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanSec)) {
        setErr('সঠিক ইমেইল অ্যাড্রেস লিখো (যেমন: student@gmail.com)');
        return;
      }
    } else {
      const cleanDigits = cleanSec.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setErr('সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও');
        return;
      }
    }

    if (!password) {
      setErr('পাসওয়ার্ড লিখো');
      return;
    }
    if (password.length < 6) {
      setErr('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      setErr('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }

    setLoading(true);
    try {
      const res = await onDone({ password, secondaryId: cleanSec });
      if (!res.success) {
        setErr(res.error || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।');
      }
    } catch {
      setErr('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="একটি পাসওয়ার্ড সেট করো" />

      <form className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3.5 font-['Kalpurush',sans-serif]" onSubmit={handleSubmit}>
        {/* Identifier Display */}
        <div className="flex h-12 sm:h-14 items-center rounded-2xl border border-white/10 bg-[#14161f] px-4 sm:px-5 shadow-[0_3px_0_#0c0e15] sm:shadow-[0_4px_0_#0c0e15]">
          <div className="flex items-center gap-2 text-sm sm:text-base text-zinc-300">
            <span className="text-zinc-500 font-medium">
              {isInitialPhone ? 'মোবাইল:' : 'ইমেইল:'}
            </span>
            <span className="font-bold text-white tracking-wide">{id}</span>
          </div>
        </div>

        {/* Secondary Identifier Input */}
        <div>
          <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-zinc-300">
            {isInitialPhone ? 'ইমেইল অ্যাড্রেস (Gmail)' : 'মোবাইল নম্বর'}
          </label>
          <input
            type={isInitialPhone ? 'email' : 'tel'}
            required
            value={secondaryId}
            onChange={(e) => {
              setSecondaryId(e.target.value);
              setErr('');
            }}
            placeholder={isInitialPhone ? 'student@gmail.com' : '01XXXXXXXXX'}
            className="h-12 sm:h-14 w-full rounded-2xl border border-white/10 bg-[#14161f] px-4 sm:px-5 text-sm sm:text-base text-white outline-none transition placeholder:text-zinc-600 shadow-[0_3px_0_#0c0e15] sm:shadow-[0_4px_0_#0c0e15] focus:border-[#10b981]/70 focus:ring-4 focus:ring-[#10b981]/15"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-zinc-300">
            পাসওয়ার্ড
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErr('');
              }}
              placeholder="পাসওয়ার্ড লিখো (কমপক্ষে ৬ অক্ষর)"
              className="h-12 sm:h-14 w-full rounded-2xl border border-white/10 bg-[#14161f] pl-4 sm:pl-5 pr-12 text-sm sm:text-base text-white outline-none transition placeholder:text-zinc-600 shadow-[0_3px_0_#0c0e15] sm:shadow-[0_4px_0_#0c0e15] focus:border-[#10b981]/70 focus:ring-4 focus:ring-[#10b981]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-zinc-300">
            পাসওয়ার্ড নিশ্চিত করো
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErr('');
            }}
            placeholder="পাসওয়ার্ড পুনরায় লিখো"
            className="h-12 sm:h-14 w-full rounded-2xl border border-white/10 bg-[#14161f] px-4 sm:px-5 text-sm sm:text-base text-white outline-none transition placeholder:text-zinc-600 shadow-[0_3px_0_#0c0e15] sm:shadow-[0_4px_0_#0c0e15] focus:border-[#10b981]/70 focus:ring-4 focus:ring-[#10b981]/15"
          />
        </div>

        {err && (
          <p className="pt-0.5 text-center text-xs sm:text-sm font-medium text-[#ff6b6b]">
            {err}
          </p>
        )}

        {/* Submit Button */}
        <div className="pt-1 sm:pt-2">
          <button
            type="submit"
            disabled={loading || password.length < 6 || !secondaryId.trim()}
            className="flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#084838] hover:bg-[#0a5845] text-sm sm:text-base font-bold text-white border border-[#10b981]/30 shadow-[0_4px_0_#04261e] sm:shadow-[0_5px_0_#04261e] transition-all duration-100 active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#1a202c] disabled:text-zinc-500 disabled:shadow-[0_4px_0_#10141c] disabled:border-transparent"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'রেজিস্ট্রেশন সম্পন্ন করো'
            )}
          </button>
        </div>
      </form>
    </>
  );
}
