'use client';

import React, { useState } from 'react';
import { BackButton, Heading } from '../ui';

const levels = ['এইচএসসি', 'এসএসসি'];
const groups = ['বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক'];

const icons: Record<string, string> = {
  'এসএসসি': 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z',
  'এইচএসসি': 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6',
  'বিজ্ঞান': 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9',
  'ব্যবসায় শিক্ষা': 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  'মানবিক': 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
};

export default function Academic({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (a: { level: string; group: string }) => void;
}) {
  const [level, setLevel] = useState('');
  const [group, setGroup] = useState('');

  const pick = (l: string) => {
    setLevel(l);
    setGroup('');
  };

  const pickGroup = (g: string) => {
    setGroup(g);
    setTimeout(() => onDone({ level, group: g }), 250);
  };

  const Option = ({
    label,
    active,
    onClick,
    size,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
    size: 'lg' | 'md';
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 sm:gap-4 rounded-2xl border-2 px-4 sm:px-5 font-semibold transition-all duration-100 active:translate-y-[4px] active:shadow-none font-['Kalpurush',sans-serif] ${
        size === 'lg' ? 'h-14 sm:h-20 text-base sm:text-lg' : 'h-12 sm:h-16 text-sm sm:text-base'
      } ${
        active
          ? 'border-[#ef4136]/70 bg-[#8b1e3f]/20 text-white shadow-[0_4px_0_#4f0f22] sm:shadow-[0_5px_0_#4f0f22]'
          : 'border-white/10 bg-[#16181e] text-zinc-200 shadow-[0_4px_0_#0b0c10] sm:shadow-[0_5px_0_#0b0c10] hover:bg-[#1c1f26]'
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-xl transition-colors ${
          size === 'lg' ? 'h-9 w-9 sm:h-11 sm:w-11' : 'h-8 w-8 sm:h-9 sm:w-9'
        } ${active ? 'bg-[#8b1e3f] text-white' : 'bg-white/5 text-zinc-400'}`}
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={icons[label]} />
        </svg>
      </span>
      <span className="flex-1 text-left">{label}</span>
      {active && (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#ef4136]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </button>
  );

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="কী নিয়ে অভ্যাস করতে চাও?" />
      <div className="mt-4 sm:mt-8 grid grid-cols-1 gap-2.5 sm:gap-4">
        {levels.map((l) => (
          <Option key={l} label={l} size="lg" active={level === l} onClick={() => pick(l)} />
        ))}
      </div>
      {level && (
        <div key={level} className="animate-step">
          <p className="mb-2 mt-4 sm:mt-6 text-xs sm:text-sm font-medium text-zinc-300 font-['Kalpurush',sans-serif]">বিভাগ</p>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
            {groups.map((g) => (
              <Option key={g} label={g} size="md" active={group === g} onClick={() => pickGroup(g)} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
