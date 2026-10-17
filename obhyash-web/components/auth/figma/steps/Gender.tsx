'use client';

import React, { useState } from 'react';
import { BackButton, Heading } from '../ui';

type G = 'male' | 'female';

function Avatar({ g }: { g: G }) {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10">
      <circle cx="20" cy="20" r="20" fill="#23252d" />
      <path
        d={g === 'male' ? 'M8 40c0-7 5-11 12-11s12 4 12 11z' : 'M8 40c0-7 5-11 12-11s12 4 12 11z'}
        fill={g === 'male' ? '#3b5b8c' : '#2f7d63'}
      />
      <circle cx="20" cy="18" r="7" fill="#e8b48f" />
      {g === 'male' ? (
        <path d="M12.5 17c0-5 3.5-8 7.5-8s7.5 2.5 7.5 7c-2-2-5-3-8-3s-5 1.5-7 4z" fill="#1b1d24" />
      ) : (
        <>
          <path d="M12.5 19c0-6 3.5-9 7.5-9s7.5 3 7.5 9c-1-3-4-5-7.5-5s-6.5 2-7.5 5z" fill="#1b1d24" />
          <circle cx="27" cy="9.5" r="3.2" fill="#1b1d24" />
        </>
      )}
    </svg>
  );
}

export default function Gender({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (g: G) => void;
}) {
  const [sel, setSel] = useState<G | null>(null);

  const pick = (g: G) => {
    setSel(g);
    setTimeout(() => onDone(g), 250);
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="তুমি একজন" />
      <div className="mt-14 grid grid-cols-1 gap-4">
        {([
          ['male', 'ছেলে'],
          ['female', 'মেয়ে'],
        ] as const).map(([g, label]) => {
          const active = sel === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => pick(g)}
              className={`flex h-20 items-center justify-center gap-4 rounded-2xl border-2 text-lg font-semibold transition-all duration-100 active:translate-y-[5px] active:shadow-none font-['Kalpurush',sans-serif] ${
                active
                  ? 'border-[#ef4136]/70 bg-[#8b1e3f]/20 text-white shadow-[0_5px_0_#4f0f22]'
                  : 'border-white/10 bg-[#16181e] text-zinc-200 shadow-[0_5px_0_#0b0c10] hover:bg-[#1c1f26]'
              }`}
            >
              <Avatar g={g} />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
