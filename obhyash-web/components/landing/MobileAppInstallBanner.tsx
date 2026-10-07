'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GooglePlayLogo, PLAY_STORE_URL } from './GooglePlayButton';

export const MobileAppInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not dismissed during current session
    try {
      const dismissed = sessionStorage.getItem('obhyash_app_banner_dismissed');
      if (!dismissed) {
        // Show after 1.5 seconds delay for pleasant entry
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    try {
      sessionStorage.setItem('obhyash_app_banner_dismissed', 'true');
    } catch (_) {}
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Obhyash App Download Banner"
      className="fixed bottom-3 inset-x-3 z-50 md:hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-emerald-500/30 p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-2.5">
        
        {/* Left: App Logo & Rating */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-neutral-800 shrink-0 flex items-center justify-center shadow-xs">
            <img
              src="/obhyash_logo.svg"
              alt="Obhyash App Icon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-white truncate">অভ্যাস (Obhyash)</h4>
              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ★ 4.9
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 truncate">
              Google Play Store থেকে ফ্রি ইনস্টল করুন
            </p>
          </div>
        </div>

        {/* Right: Install Button & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer select-none"
          >
            <GooglePlayLogo className="w-3.5 h-3.5" />
            <span>ইনস্টল</span>
          </a>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
};
