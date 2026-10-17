'use client';

import React, { useState } from 'react';
import { Heading, PasswordField, PrimaryButton } from '../ui';

export default function NewPassword({
  onDone,
}: {
  onDone: (pw: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [pw, setPw] = useState('');
  const [cf, setCf] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const mismatch = cf.length > 0 && cf !== pw;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6 || cf !== pw || loading) return;
    setLoading(true);
    setErr('');
    try {
      const res = await onDone(pw);
      if (!res.success) {
        setErr(res.error || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    } catch {
      setErr('পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Heading title="নতুন পাসওয়ার্ড" sub="একটি নতুন পাসওয়ার্ড সেট করো" />
      <form className="mt-8" onSubmit={handleSubmit}>
        <PasswordField
          label="নতুন পাসওয়ার্ড"
          autoFocus
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr('');
          }}
          placeholder="কমপক্ষে ৬ অক্ষর"
        />
        <PasswordField
          label="আবার লেখো"
          value={cf}
          onChange={(e) => {
            setCf(e.target.value);
            setErr('');
          }}
          placeholder="পাসওয়ার্ড নিশ্চিত করো"
          error={mismatch ? 'পাসওয়ার্ড মিলছে না' : err || undefined}
        />
        <PrimaryButton disabled={pw.length < 6 || cf !== pw} loading={loading}>
          পাসওয়ার্ড সেভ করো
        </PrimaryButton>
      </form>
    </>
  );
}
