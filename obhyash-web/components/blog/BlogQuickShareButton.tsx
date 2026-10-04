'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BlogQuickShareButtonProps {
  title: string;
  url: string;
}

export default function BlogQuickShareButton({ title, url }: BlogQuickShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // If Web Share API is supported (Mobile browsers, Chrome, Safari)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard if user dismissed or cancelled share sheet
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('আর্টিকেলের লিংক কপি করা হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('লিংক কপি করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      aria-label="শেয়ার করুন"
      title="শেয়ার করুন"
      className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all shadow-xs"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
    </button>
  );
}
