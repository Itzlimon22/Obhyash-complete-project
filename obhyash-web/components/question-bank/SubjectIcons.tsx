'use client';

import React from 'react';

interface SubjectIconProps {
  name: string;
  className?: string;
}

export function SubjectColorfulIcon({ name, className = 'w-7 h-7' }: SubjectIconProps) {
  const n = name.toLowerCase();

  // 1. Physics (পদার্থবিজ্ঞান) — Colorful Quantum Atom
  if (n.includes('atom') || n.includes('physic')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <circle cx="24" cy="24" r="5" fill="url(#phys_nucleus)" />
        <ellipse
          cx="24"
          cy="24"
          rx="20"
          ry="7.5"
          stroke="url(#phys_orbit1)"
          strokeWidth="2.4"
          transform="rotate(-30 24 24)"
          strokeDasharray="100"
        />
        <ellipse
          cx="24"
          cy="24"
          rx="20"
          ry="7.5"
          stroke="url(#phys_orbit2)"
          strokeWidth="2.4"
          transform="rotate(30 24 24)"
        />
        <ellipse
          cx="24"
          cy="24"
          rx="20"
          ry="7.5"
          stroke="url(#phys_orbit3)"
          strokeWidth="2.4"
          transform="rotate(90 24 24)"
        />
        <circle cx="10" cy="16" r="2.5" fill="#38BDF8" />
        <circle cx="38" cy="32" r="2.5" fill="#F59E0B" />
        <circle cx="24" cy="4" r="2.5" fill="#EC4899" />
        <defs>
          <linearGradient id="phys_nucleus" x1="19" y1="19" x2="29" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="phys_orbit1" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="phys_orbit2" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="phys_orbit3" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 2. Chemistry (রসায়ন) — Vibrant Laboratory Conical Flask
  if (n.includes('flask') || n.includes('chem')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path
          d="M20 6h8v6l9 17.5c2 3.8-.7 8.5-5 8.5H16c-4.3 0-7-4.7-5-8.5L20 12V6z"
          fill="url(#chem_glass)"
          stroke="#0D9488"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 32c3-1.5 6 1 10.5 0s7.5-1.5 10.5 0l2.5 5c1 2-.5 4.5-2.5 4.5H14c-2 0-3.5-2.5-2.5-4.5l2-5z"
          fill="url(#chem_liquid)"
        />
        <circle cx="20" cy="35" r="2" fill="#A7F3D0" opacity="0.9" />
        <circle cx="26" cy="30" r="1.5" fill="#A7F3D0" opacity="0.9" />
        <circle cx="28" cy="36" r="2.2" fill="#FFFFFF" opacity="0.8" />
        <rect x="18" y="4" width="12" height="3" rx="1.5" fill="#0F766E" />
        <path d="M22 15l-1 2m3-2l-1 2" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="chem_glass" x1="24" y1="6" x2="24" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#CCFBF1" stopOpacity="0.6" />
            <stop offset="1" stopColor="#99F6E4" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="chem_liquid" x1="12" y1="30" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 3. Biology (জীববিজ্ঞান) — Colorful DNA Double Helix
  if (n.includes('dna') || n.includes('bio')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path
          d="M14 6C14 18 34 18 34 30C34 42 14 42 14 42"
          stroke="url(#dna_strand1)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M34 6C34 18 14 18 14 30C14 42 34 42 34 42"
          stroke="url(#dna_strand2)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Rungs */}
        <line x1="16" y1="10" x2="32" y2="10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="19" y1="16" x2="29" y2="16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="19" y1="32" x2="29" y2="32" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="38" x2="32" y2="38" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="6" r="3" fill="#10B981" />
        <circle cx="34" cy="6" r="3" fill="#3B82F6" />
        <circle cx="34" cy="42" r="3" fill="#8B5CF6" />
        <circle cx="14" cy="42" r="3" fill="#F59E0B" />
        <defs>
          <linearGradient id="dna_strand1" x1="14" y1="6" x2="34" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="0.5" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="dna_strand2" x1="34" y1="6" x2="14" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="0.5" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 4. Mathematics (উচ্চতর গণিত / সাধারণ গণিত) — Colorful Calculator & Math Symbols
  if (n.includes('calculator') || n.includes('math')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="8" y="6" width="32" height="36" rx="8" fill="url(#math_bg)" stroke="#6366F1" strokeWidth="2" />
        <rect x="13" y="11" width="22" height="8" rx="3" fill="#1E1B4B" />
        <text x="31" y="17" fill="#38BDF8" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="end">π = 3.14</text>
        {/* Buttons */}
        <circle cx="16" cy="25" r="3" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" />
        <text x="16" y="27" fill="#4338CA" fontSize="6" fontWeight="bold" textAnchor="middle">+</text>
        <circle cx="24" cy="25" r="3" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" />
        <text x="24" y="27" fill="#4338CA" fontSize="6" fontWeight="bold" textAnchor="middle">−</text>
        <circle cx="32" cy="25" r="3" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" />
        <text x="32" y="27" fill="#4338CA" fontSize="6" fontWeight="bold" textAnchor="middle">×</text>
        <circle cx="16" cy="34" r="3" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" />
        <text x="16" y="36" fill="#4338CA" fontSize="6" fontWeight="bold" textAnchor="middle">÷</text>
        <circle cx="24" cy="34" r="3" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" />
        <text x="24" y="36" fill="#4338CA" fontSize="6" fontWeight="bold" textAnchor="middle">√</text>
        <circle cx="32" cy="34" r="3" fill="#F59E0B" />
        <text x="32" y="36" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">=</text>
        <defs>
          <linearGradient id="math_bg" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 5. ICT (তথ্য ও যোগাযোগ প্রযুক্তি) — Glowing Microchip & Circuit
  if (n.includes('cpu') || n.includes('ict')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="12" y="12" width="24" height="24" rx="5" fill="url(#ict_core)" stroke="#0284C7" strokeWidth="2" />
        {/* Pins */}
        <path d="M17 6v6m7-6v6m7-6v6M17 36v6m7-6v6m7-6v6M6 17h6m-6 7h6m-6 7h6M36 17h6m-6 7h6m-6 7h6" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="6" fill="#0284C7" />
        <path d="M21 24h6m-3-3v6" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.5" fill="#38BDF8" />
        <circle cx="32" cy="32" r="1.5" fill="#38BDF8" />
        <defs>
          <linearGradient id="ict_core" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 6. Bangla (বাংলা) — Classic Open Book & Quill
  if (n.includes('book') || n.includes('bangla')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path
          d="M8 35c6-2 14-2 16 2 2-4 10-4 16-2V13c-6-2-14-2-16 2-2-4-10-4-16-2v22z"
          fill="url(#book_pages)"
          stroke="#059669"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M24 15v22" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        {/* Red seal / Sun of Bangladesh */}
        <circle cx="16" cy="23" r="4.5" fill="#EF4444" opacity="0.95" />
        {/* Ink lines */}
        <path d="M28 20h8m-8 5h6m-8 5h7" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M34 6l6 6-12 12-4-1 1-4 9-13z"
          fill="url(#quill_grad)"
        />
        <defs>
          <linearGradient id="book_pages" x1="8" y1="13" x2="40" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ECFDF5" />
            <stop offset="1" stopColor="#D1FAE5" />
          </linearGradient>
          <linearGradient id="quill_grad" x1="28" y1="6" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 7. English (ইংরেজি) — World Globe with English Letters
  if (n.includes('lang') || n.includes('english') || n.includes('spell')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <circle cx="24" cy="24" r="18" fill="url(#eng_globe)" stroke="#2563EB" strokeWidth="2" />
        <path d="M6 24h36M24 6c5 6 7.5 12 7.5 18s-2.5 12-7.5 18c-5-6-7.5-12-7.5-18S19 12 24 6z" stroke="#93C5FD" strokeWidth="1.8" />
        {/* English Badge */}
        <rect x="23" y="21" width="18" height="18" rx="4" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="32" y="33" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">EN</text>
        <defs>
          <linearGradient id="eng_globe" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DBEAFE" />
            <stop offset="1" stopColor="#93C5FD" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 8. Accounting (হিসাববিজ্ঞান) — Financial Ledger & Coins
  if (n.includes('receipt') || n.includes('account')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="10" y="8" width="28" height="34" rx="4" fill="url(#acc_paper)" stroke="#10B981" strokeWidth="2" />
        <line x1="16" y1="16" x2="32" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="22" x2="26" y2="22" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="28" x2="28" y2="28" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="32" r="8" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
        <text x="30" y="36" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">৳</text>
        <defs>
          <linearGradient id="acc_paper" x1="10" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#ECFDF5" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 9. Finance & Banking (ফিন্যান্স ও ব্যাংকিং) — Bank Pillars & Upward Arrow
  if (n.includes('landmark') || n.includes('finance') || n.includes('bank')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <path d="M6 16L24 6l18 10v3H6v-3z" fill="#D97706" stroke="#B45309" strokeWidth="1.5" />
        <rect x="9" y="19" width="30" height="2" fill="#B45309" />
        {/* Pillars */}
        <rect x="11" y="21" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="19" y="21" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="25" y="21" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="33" y="21" width="4" height="15" rx="1" fill="#F59E0B" />
        <rect x="6" y="36" width="36" height="4" rx="1.5" fill="#78350F" />
        {/* Rising chart line */}
        <path d="M26 30l5-5 7 3 4-8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="20" r="2.5" fill="#10B981" />
      </svg>
    );
  }

  // 10. Economics (অর্থনীতি) — Growth Chart & Market Trends
  if (n.includes('economic') || n.includes('compass')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#econ_bg)" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="12" y1="36" x2="38" y2="36" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="12" x2="12" y2="36" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 32l8-10 6 5 10-14" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="16" y="26" width="4" height="10" rx="1" fill="#38BDF8" opacity="0.8" />
        <rect x="24" y="22" width="4" height="14" rx="1" fill="#818CF8" opacity="0.8" />
        <rect x="32" y="16" width="4" height="20" rx="1" fill="#10B981" opacity="0.8" />
        <circle cx="38" cy="13" r="3" fill="#EF4444" />
        <defs>
          <linearGradient id="econ_bg" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 11. Geography & Environment (ভূগোল ও পরিবেশ) — Planet Earth
  if (n.includes('globe') || n.includes('geography')) {
    return (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <circle cx="24" cy="24" r="18" fill="url(#geo_ocean)" stroke="#0284C7" strokeWidth="2" />
        {/* Green Continents */}
        <path
          d="M14 16c2-4 6-2 7 1s4 4 1 6-7 0-8-7zM28 14c3-2 8 0 7 4s-4 4-7 3-1-5 0-7zM16 28c4 1 6 5 4 8s-6 2-7-1 1-6 3-7zM28 26c4-1 8 3 8 7s-4 5-8 3-2-8 0-10z"
          fill="#10B981"
        />
        <circle cx="36" cy="12" r="3" fill="#F59E0B" opacity="0.9" />
        <defs>
          <linearGradient id="geo_ocean" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 12. Default / General (মানবিক / অন্যান্য বিষয়) — Academic Cap & Star
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <path d="M24 8L6 18l18 10 18-10L24 8z" fill="url(#grad_cap)" stroke="#4338CA" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 21.5v9c0 4 5.4 7.5 12 7.5s12-3.5 12-7.5v-9" stroke="#6366F1" strokeWidth="2.5" fill="#EEF2FF" />
      <path d="M38 19v13m0 0l-2 3m2-3l2 3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="18" r="2" fill="#F59E0B" />
      <defs>
        <linearGradient id="grad_cap" x1="6" y1="8" x2="42" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#312E81" />
        </linearGradient>
      </defs>
    </svg>
  );
}

