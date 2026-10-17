'use client';

import React, { useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import Link from 'next/link';

export const toBn = (s: string | number) => String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="অভ্যাস হোমপেজ"
      className={`inline-flex items-center justify-center select-none transition-transform hover:scale-105 active:scale-95 duration-200 ${className}`}
    >
      <img
        src="/obhyash_full_logo_dark.svg"
        alt="অভ্যাস"
        className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
      />
    </Link>
  );
}

export function Heading({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="text-xl sm:text-2xl font-bold font-['Kalpurush',sans-serif]">{title}</h1>
      {sub && <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-zinc-400 font-['Kalpurush',sans-serif]">{sub}</p>}
    </div>
  );
}

export function PrimaryButton({ children, loading, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className="mt-3 sm:mt-5 flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#8b1e3f] text-sm sm:text-base font-semibold text-white shadow-[0_4px_0_#4f0f22] sm:shadow-[0_5px_0_#4f0f22] transition-all duration-100 hover:bg-[#9e2549] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#22242c] disabled:text-zinc-400 disabled:shadow-[0_4px_0_#121318] disabled:active:translate-y-0 font-['Kalpurush',sans-serif]"
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; right?: ReactNode; icon?: 'user' | 'lock' };

export function Field({ label, error, right, icon, ...p }: FieldProps) {
  return (
    <div className="mb-3 sm:mb-4">
      <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-zinc-300 font-['Kalpurush',sans-serif]">{label}</label>
      <div className="group relative">
        {icon && (
          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-[#ef4136]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {icon === 'user' ? (
              <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </>
            ) : (
              <>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </>
            )}
          </svg>
        )}
        <input
          {...p}
          className={`h-12 sm:h-14 w-full rounded-2xl border bg-black/40 ${icon ? 'pl-11 sm:pl-12' : 'pl-4'} pr-4 text-base sm:text-lg text-white outline-none transition placeholder:text-zinc-600 focus:ring-4 focus:ring-[#ef4136]/15 font-['Kalpurush',sans-serif] ${right ? 'pr-16' : ''} ${error ? 'border-[#ef4136]/70' : 'border-white/10 focus:border-[#ef4136]/60'}`}
        />
        {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error && <p className="mt-1.5 text-xs sm:text-sm text-[#ff6b6b] font-['Kalpurush',sans-serif]">{error}</p>}
    </div>
  );
}

export function PasswordField(p: Omit<FieldProps, 'type' | 'right' | 'icon'>) {
  const [show, setShow] = useState(false);
  return (
    <Field
      {...p}
      icon="lock"
      type={show ? 'text' : 'password'}
      right={
        <button type="button" onClick={() => setShow(!show)} className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white font-['Kalpurush',sans-serif]">
          {show ? 'লুকাও' : 'দেখাও'}
        </button>
      }
    />
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label="পেছনে"
      className="fixed left-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#16181e] text-zinc-300 shadow-[0_4px_0_#0b0c10] transition-all duration-100 hover:bg-[#1c1f26] hover:text-white active:translate-y-[4px] active:shadow-none"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </button>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(button, document.body);
}

export function IdChip({ id, onEdit }: { id: string; onEdit: () => void }) {
  return (
    <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-['Kalpurush',sans-serif]">
      <span className="text-zinc-200">{id.includes('@') ? id : toBn(id)}</span>
      <button type="button" onClick={onEdit} className="text-[#ef4136] hover:underline">
        পরিবর্তন
      </button>
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#8b1e3f]' : 'bg-white/10'}`} />
      ))}
    </div>
  );
}

export function OtpInput({ value, onChange, error, resetKey }: { value: string; onChange: (v: string) => void; error?: boolean; resetKey?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const id = setTimeout(() => refs.current[0]?.focus(), 50);
    return () => clearTimeout(id);
  }, [resetKey]);

  const digits = value.padEnd(6, ' ').split('');
  const set = (i: number, d: string) => {
    const arr = [...digits];
    arr[i] = d || ' ';
    onChange(arr.join(''));
  };

  return (
    <div
      key={resetKey}
      className={`flex justify-center gap-2.5 ${error ? 'animate-shake' : ''}`}
      onPaste={(e) => {
        const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (t) {
          e.preventDefault();
          onChange(t.padEnd(6, ' '));
          refs.current[Math.min(t.length, 5)]?.focus();
        }
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? 6 : 1}
          value={d.trim()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw.length > 1) {
              const t = raw.slice(0, 6);
              onChange(t.padEnd(6, ' '));
              refs.current[Math.min(t.length, 5)]?.focus();
              return;
            }
            set(i, raw);
            if (raw) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim()) refs.current[i - 1]?.focus();
          }}
          className={`h-14 w-12 rounded-2xl border-2 bg-black/40 text-center text-2xl font-bold text-white caret-[#ef4136] outline-none transition focus:border-[#ef4136] focus:bg-[#ef4136]/5 focus:ring-4 focus:ring-[#ef4136]/20 sm:w-14 ${error ? 'border-[#ef4136]/70' : d.trim() ? 'border-white/25' : 'border-white/10'}`}
        />
      ))}
    </div>
  );
}

export function useCountdown(start: number) {
  const [t, setT] = useState(start);
  useEffect(() => {
    if (t <= 0) return;
    const id = setTimeout(() => setT(t - 1), 1000);
    return () => clearTimeout(id);
  }, [t]);
  return [t, () => setT(start)] as const;
}

export const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
