'use client';

import React, { useState } from 'react';
import { BackButton, Heading } from '../ui';

function CalendarIcon() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#272b38] shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <path d="M3 9h18" fill="#3b82f6" />
        <rect x="7" y="2" width="2" height="3.5" rx="1" fill="#475569" />
        <rect x="15" y="2" width="2" height="3.5" rx="1" fill="#475569" />
        <circle cx="12" cy="15" r="4" fill="#10b981" />
        <path d="M10.2 15l1.2 1.2 2.6-2.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function Batch({
  stream = 'এইচএসসি',
  onBack,
  onDone,
}: {
  stream?: string;
  onBack: () => void;
  onDone: (batch: string) => void;
}) {
  const isSSC = stream === 'এসএসসি';
  const batches = isSSC
    ? ['এসএসসি ২০২৬', 'এসএসসি ২০২৭', 'এসএসসি ২০২৮']
    : ['এইচএসসি ২০২৫', 'এইচএসসি ২০২৬', 'এইচএসসি ২০২৭', 'এইচএসসি ২০২৮'];

  const [sel, setSel] = useState<string>(batches[0]);

  const handleSelect = (b: string) => {
    setSel(b);
    setTimeout(() => {
      onDone(b);
    }, 280);
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="তোমার ব্যাচ?" />
      <div className="mt-4 sm:mt-8 grid grid-cols-1 gap-2.5 sm:gap-4 font-['Kalpurush',sans-serif]">
        {batches.map((b) => {
          const active = sel === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => handleSelect(b)}
              className={`flex h-13 sm:h-20 items-center gap-3 sm:gap-4 rounded-2xl px-4 sm:px-5 text-base sm:text-lg font-semibold transition-all duration-150 active:translate-y-[3px] sm:active:translate-y-[4px] active:shadow-none ${
                active
                  ? 'border-2 border-[#10b981] bg-[#0c241c] text-white shadow-[0_0_24px_rgba(16,185,129,0.22),0_4px_0_#071812]'
                  : 'border border-white/10 bg-[#14161f] text-zinc-200 shadow-[0_4px_0_#0c0e15] hover:bg-[#1a1d28]'
              }`}
            >
              <CalendarIcon />
              <span className="flex-1 text-left text-base sm:text-lg font-bold tracking-wide">{b}</span>
              {active && (
                <svg
                  className="h-6 w-6 text-[#10b981]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
