'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const BASE_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

export interface AppInstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  featureBadge?: string;
  utmContent?: string;
  level?: 'HSC' | 'SSC' | string;
}

export default function AppInstallPromptModal({
  isOpen,
  onClose,
  title,
  utmContent = 'demo_modal',
  level = 'General',
}: AppInstallPromptModalProps) {
  if (!isOpen) return null;

  const referrer = encodeURIComponent(
    `utm_source=demo_exam&utm_medium=gate&utm_campaign=mock_demo&utm_content=${utmContent}`
  );
  const playStoreUrl = `${BASE_PLAY_STORE_URL}&referrer=${referrer}`;

  const handleInstallClick = () => {
    trackBlogConversion({
      eventType: 'app_download',
      sourceSlug: 'demo_exam',
      sourceCategory: level,
      buttonLocation: 'demo_gate_modal',
    });
  };

  const handleRegisterClick = () => {
    trackBlogConversion({
      eventType: 'signup_click',
      sourceSlug: 'demo_exam',
      sourceCategory: level,
      buttonLocation: 'demo_gate_modal',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#141416] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center Aligned Clean Heading */}
        <h3 className="text-xl sm:text-2xl font-black text-center text-slate-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-snug mt-3 mb-6 px-4">
          {title}
        </h3>

        {/* Action Buttons: Left (Red: রেজিস্টার করো) & Right (Deep Cyan: অ্যাপ ইনস্টল করো) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link
            href="/signup"
            onClick={handleRegisterClick}
            className="flex items-center justify-center py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm sm:text-base font-['Anek_Bangla',sans-serif] shadow-md hover:shadow-lg transition-all text-center cursor-pointer"
          >
            রেজিস্টার করো
          </Link>

          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInstallClick}
            className="flex items-center justify-center py-3 px-3 rounded-xl bg-[#0e7490] hover:bg-[#155e75] active:bg-[#164e63] text-white font-bold text-sm sm:text-base font-['Anek_Bangla',sans-serif] shadow-md hover:shadow-lg transition-all text-center cursor-pointer"
          >
            অ্যাপ ইনস্টল করো
          </a>
        </div>
      </div>
    </div>
  );
}

