'use client';

import React from 'react';
import Link from 'next/link';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

// Authentic Google Play Store SVG with official 4-quadrant colors
export const GooglePlayLogo = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.609 1.814L13.793 12 3.61 22.186A2.37 2.37 0 0 1 3 20.5V3.5c0-.653.228-1.25.609-1.686z"
      fill="#00E676"
    />
    <path
      d="M17.228 8.565L5.05 1.733A2.348 2.348 0 0 0 3.61 1.814L13.793 12l3.435-3.435z"
      fill="#FFD600"
    />
    <path
      d="M3.609 22.186c.433.155.932.124 1.44-.162l12.179-6.832L13.793 12 3.61 22.186z"
      fill="#FF1744"
    />
    <path
      d="M20.893 10.627l-3.665-2.062L13.793 12l3.435 3.435 3.665-2.062a1.58 1.58 0 0 0 0-2.746z"
      fill="#00B0FF"
    />
  </svg>
);

interface GooglePlayButtonProps {
  variant?: 'hero' | 'navbar' | 'footer' | 'pill' | 'card';
  className?: string;
  onClick?: () => void;
}

export const GooglePlayButton: React.FC<GooglePlayButtonProps> = ({
  variant = 'hero',
  className = '',
  onClick,
}) => {
  // ── 1. NAVBAR COMPACT PILL ──
  if (variant === 'navbar') {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label="Download Obhyash App on Google Play Store"
        className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-emerald-500/50 shadow-sm transition-all duration-200 text-xs font-bold text-neutral-200 hover:text-white cursor-pointer select-none ${className}`}
      >
        <GooglePlayLogo className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline">Google Play</span>
        <span className="inline sm:hidden">অ্যাপ</span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          ★ 4.9
        </span>
      </a>
    );
  }

  // ── 2. FOOTER BUTTON ──
  if (variant === 'footer') {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label="Download Obhyash Android App on Google Play"
        className={`group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/40 text-neutral-200 hover:text-white transition-all shadow-sm duration-200 cursor-pointer ${className}`}
      >
        <GooglePlayLogo className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105" />
        <div className="text-left leading-tight">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-medium">
            GET IT ON
          </span>
          <span className="text-xs sm:text-sm font-bold text-white block tracking-tight">
            Google Play
          </span>
        </div>
      </a>
    );
  }

  // ── 3. HERO PREMIUM TACTILE BUTTON ──
  if (variant === 'hero') {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label="Get Obhyash App on Google Play Store"
        className={`group relative inline-flex items-center gap-3 px-5 sm:px-6 py-3 rounded-[14px] bg-[#0d1512] hover:bg-[#111e19] border border-emerald-500/30 hover:border-emerald-400/60 text-white font-bold text-xs sm:text-base shadow-[0_4.5px_0_#06231c] active:shadow-[0_1px_0_#06231c] active:translate-y-[3.5px] transition-all duration-200 cursor-pointer select-none overflow-hidden ${className}`}
      >
        {/* Subtle corner sheen */}
        <span className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-400/20 transition-all pointer-events-none" />

        <div className="p-1 rounded-lg bg-neutral-900/80 border border-neutral-700/60 shrink-0">
          <GooglePlayLogo className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
        </div>

        <div className="text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 tracking-wide">
              GET IT ON
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Free App
            </span>
          </div>
          <span className="text-sm sm:text-base font-black text-white tracking-tight">
            Google Play
          </span>
        </div>
      </a>
    );
  }

  // ── 4. PILL / DEFAULT ──
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label="Google Play Store App"
      className={`group inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white transition-all ${className}`}
    >
      <GooglePlayLogo className="w-5 h-5 shrink-0" />
      <div className="text-left leading-tight">
        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">
          Download On
        </span>
        <span className="text-xs font-bold block">Google Play</span>
      </div>
    </a>
  );
};
