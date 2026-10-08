'use client';

import React from 'react';
import { X, Sparkles, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

const BASE_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

function GooglePlayStoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
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
}

export interface AppInstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  featureBadge?: string;
  utmContent?: string;
}

export default function AppInstallPromptModal({
  isOpen,
  onClose,
  title,
  message,
  featureBadge = 'অ্যাপ ফিচার',
  utmContent = 'demo_modal',
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
      buttonLocation: 'quick_action',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121214] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon / Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-hind">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {featureBadge}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-hind">
            Obhyash App
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-anek leading-snug mb-2.5">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 font-hind leading-relaxed mb-6">
          {message}
        </p>

        {/* Action Button */}
        <a
          href={playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#065f46] hover:bg-[#047857] active:bg-[#022c22] text-white font-anek font-bold text-base shadow-md hover:shadow-lg transition-all group"
        >
          <GooglePlayStoreIcon className="w-5 h-5 shrink-0" />
          <span>Play Store থেকে অ্যাপ ইনস্টল করুন</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Trust Footnote */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-hind">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Google Play ভেরিফাইড
          </span>
          <span>•</span>
          <span>ফ্রি আনলিমিটেড প্র্যাকটিস</span>
        </div>
      </div>
    </div>
  );
}
