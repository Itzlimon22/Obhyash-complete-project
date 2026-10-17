'use client';

import React, { useState } from 'react';
import { BackButton, Heading, IdChip, PasswordField, PrimaryButton } from '../ui';

export default function Password({
  id,
  onBack,
  onForgot,
  onDone,
}: {
  id: string;
  onBack: () => void;
  onForgot: () => void;
  onDone: (password: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [tries, setTries] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6 || loading) return;

    setLoading(true);
    setErr('');
    try {
      const res = await onDone(pw);
      if (!res.success) {
        setTries((prev) => prev + 1);
        setErr(res.error || 'পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করো।');
      }
    } catch {
      setErr('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="আবার স্বাগতম!" sub="তোমার পাসওয়ার্ড দিয়ে লগ ইন করো" />
      <IdChip id={id} onEdit={onBack} />
      <form className="mt-8" onSubmit={handleSubmit}>
        <PasswordField
          label="পাসওয়ার্ড"
          autoFocus
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr('');
          }}
          placeholder="••••••••"
          error={err}
        />
        <div className="-mt-1 flex justify-end">
          <button
            type="button"
            onClick={onForgot}
            className={`text-sm transition hover:underline font-['Kalpurush',sans-serif] ${
              tries >= 2 ? 'font-semibold text-[#ef4136]' : 'text-zinc-400'
            }`}
          >
            পাসওয়ার্ড ভুলে গেছো?
          </button>
        </div>
        <PrimaryButton disabled={pw.length < 6} loading={loading}>
          লগ ইন
        </PrimaryButton>
      </form>
    </>
  );
}
