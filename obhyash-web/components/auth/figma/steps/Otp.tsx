'use client';

import React, { useEffect, useState } from 'react';
import { BackButton, Heading, IdChip, OtpInput, PrimaryButton, toBn, useCountdown } from '../ui';

export default function Otp({
  id,
  title,
  onBack,
  onDone,
  onResend,
}: {
  id: string;
  title: string;
  onBack: () => void;
  onDone: (code: string) => Promise<{ success: boolean; error?: string }>;
  onResend?: () => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [t, reset] = useCountdown(60);
  const complete = /^\d{6}$/.test(code.trim());
  const isEmail = id.includes('@');

  const verify = async () => {
    if (loading || !complete) return;
    setLoading(true);
    setErr('');
    try {
      const res = await onDone(code.trim());
      if (!res.success) {
        setErr(res.error || 'কোডটি সঠিক নয়। আবার চেষ্টা করো।');
        setCode('');
        setResetKey((k) => k + 1);
      }
    } catch {
      setErr('কোড যাচাই করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complete) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const handleResend = async () => {
    reset();
    setCode('');
    setErr('');
    setResetKey((k) => k + 1);
    if (onResend) {
      await onResend();
    }
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading
        title={title}
        sub={
          isEmail
            ? 'এই ইমেইলে একটি ৬ সংখ্যার কোড পাঠানো হয়েছে'
            : 'এই নম্বরে SMS-এ একটি ৬ সংখ্যার কোড পাঠানো হয়েছে'
        }
      />
      <IdChip id={id} onEdit={onBack} />
      <form
        className="mt-4 sm:mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setErr('');
          }}
          error={!!err}
          resetKey={resetKey}
        />
        {err && <p className="mt-2 text-center text-xs sm:text-sm text-[#ff6b6b] font-['Kalpurush',sans-serif]">{err}</p>}
        <PrimaryButton disabled={!complete} loading={loading}>
          যাচাই করো
        </PrimaryButton>
      </form>
      <p className="mt-3.5 sm:mt-6 text-center text-xs sm:text-sm text-zinc-400 font-['Kalpurush',sans-serif]">
        কোড পাওনি?{' '}
        {t > 0 ? (
          <span className="text-zinc-500">{toBn(t)} সেকেন্ড পর আবার পাঠাও</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-[#ef4136] hover:underline"
          >
            আবার পাঠাও
          </button>
        )}
      </p>
    </>
  );
}
