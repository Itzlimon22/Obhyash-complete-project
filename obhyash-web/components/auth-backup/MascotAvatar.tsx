'use client';

import React from 'react';

interface MascotAvatarProps {
  speechText: string;
  mood?: 'thinking' | 'reading' | 'happy' | 'waving';
}

export default function MascotAvatar({ speechText, mood = 'thinking' }: MascotAvatarProps) {
  return (
    <div className="flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* 1. Speech Bubble on Top */}
      <div className="relative mb-3 sm:mb-4">
        <div className="bg-[#181a24] border border-[#2c3244] px-5 py-2 rounded-2xl shadow-lg shadow-black/40 text-center">
          <span className="text-sm sm:text-base font-bold text-white tracking-wide">
            {speechText}
          </span>
        </div>
        {/* Downward pointer triangle */}
        <div className="w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-[#2c3244] mx-auto" />
      </div>

      {/* 2. Adorable Red Mascot SVG */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shadow */}
          <ellipse cx="50" cy="94" rx="28" ry="5" fill="#000000" opacity="0.3" />

          {/* Ears */}
          <ellipse cx="28" cy="24" rx="10" ry="12" fill="#E11D48" stroke="#1E293B" strokeWidth="3" />
          <ellipse cx="28" cy="24" rx="5" ry="7" fill="#FDA4AF" />
          <ellipse cx="72" cy="24" rx="10" ry="12" fill="#E11D48" stroke="#1E293B" strokeWidth="3" />
          <ellipse cx="72" cy="24" rx="5" ry="7" fill="#FDA4AF" />

          {/* Main Body / Head (Chubby Pear Shape) */}
          <path
            d="M50 18C30 18 20 32 20 54C20 74 32 90 50 90C68 90 80 74 80 54C80 32 70 18 50 18Z"
            fill="#E11D48"
            stroke="#1E293B"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* White Belly & Cheeks */}
          <path
            d="M50 48C36 48 30 60 30 72C30 84 38 88 50 88C62 88 70 84 70 72C70 60 64 48 50 48Z"
            fill="#FFFFFF"
          />

          {/* Cheeks Blush */}
          <ellipse cx="28" cy="58" rx="5" ry="3" fill="#FDA4AF" opacity="0.7" />
          <ellipse cx="72" cy="58" rx="5" ry="3" fill="#FDA4AF" opacity="0.7" />

          {/* Big Cartoon Eyes */}
          <ellipse cx="38" cy="46" rx="6.5" ry="8.5" fill="#1E293B" />
          <circle cx="36" cy="43" r="2.5" fill="#FFFFFF" />
          <circle cx="40" cy="48" r="1.2" fill="#FFFFFF" />

          <ellipse cx="62" cy="46" rx="6.5" ry="8.5" fill="#1E293B" />
          <circle cx="60" cy="43" r="2.5" fill="#FFFFFF" />
          <circle cx="64" cy="48" r="1.2" fill="#FFFFFF" />

          {/* Cute Nose */}
          <path d="M47 53C47 51.5 53 51.5 53 53C53 55 50 56.5 50 56.5C50 56.5 47 55 47 53Z" fill="#1E293B" />

          {/* Mouth & Expressions */}
          {mood === 'thinking' ? (
            /* Wavy curious mouth */
            <path d="M46 62C48 60 52 64 55 61" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            /* Happy open smile with tongue */
            <g>
              <path d="M44 60C44 60 47 67 50 67C53 67 56 60 56 60" fill="#991B1B" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
              <path d="M47 64C48 66 52 66 53 64" fill="#FDA4AF" />
            </g>
          )}

          {/* Eyebrows */}
          {mood === 'thinking' ? (
            <g>
              <path d="M33 36C36 34 41 36 43 38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M67 38C64 35 59 34 57 36" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M33 36C36 33 41 34 43 36" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M67 36C64 34 59 33 57 36" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Paws / Hands */}
          {mood === 'thinking' ? (
            /* One paw on chin thinking */
            <g>
              <ellipse cx="32" cy="74" rx="6" ry="5" fill="#E11D48" stroke="#1E293B" strokeWidth="2.5" />
              <ellipse cx="58" cy="68" rx="7" ry="6" fill="#E11D48" stroke="#1E293B" strokeWidth="2.5" />
            </g>
          ) : mood === 'reading' ? (
            /* Open Book */
            <g transform="translate(30, 68)">
              {/* Left page */}
              <path d="M20 20C14 18 4 19 0 22V6C4 3 14 2 20 4V20Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
              {/* Right page */}
              <path d="M20 20C26 18 36 19 40 22V6C36 3 26 2 20 4V20Z" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
              {/* Spine */}
              <line x1="20" y1="4" x2="20" y2="20" stroke="#CBD5E1" strokeWidth="2" />
              {/* Paws holding book */}
              <circle cx="2" cy="14" r="4" fill="#E11D48" stroke="#1E293B" strokeWidth="1.5" />
              <circle cx="38" cy="14" r="4" fill="#E11D48" stroke="#1E293B" strokeWidth="1.5" />
            </g>
          ) : (
            /* Cheerful paws on belly */
            <g>
              <ellipse cx="34" cy="72" rx="6" ry="5" fill="#E11D48" stroke="#1E293B" strokeWidth="2.5" />
              <ellipse cx="66" cy="72" rx="6" ry="5" fill="#E11D48" stroke="#1E293B" strokeWidth="2.5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
