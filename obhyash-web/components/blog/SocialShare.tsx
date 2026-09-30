'use client';

import { useState } from 'react';
import {
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
  url: string;
  title: string;
  compact?: boolean;
}

export default function SocialShare({ url, title, compact }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('আর্টিকেলের লিংক কপি করা হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('লিংক কপি করতে সমস্যা হয়েছে।');
    }
  };

  const buttonClass =
    'w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] text-slate-600 dark:text-slate-300 hover:text-[#059669] dark:hover:text-[#34d399] hover:border-[#059669]/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors shadow-xs';

  const icons = (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on Facebook"
        title="ফেসবুকে শেয়ার করুন"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on WhatsApp"
        title="হোয়াটসঅ্যাপে শেয়ার করুন"
      >
        <MessageCircle className="w-4 h-4" />
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on X"
        title="X (Twitter)-এ শেয়ার করুন"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <button
        onClick={handleCopyLink}
        className={`${buttonClass} ${copied ? 'text-emerald-600 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : ''}`}
        aria-label="Copy Link"
        title="লিংক কপি করুন"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <LinkIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  if (compact) return icons;

  return (
    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 font-anek">
        শেয়ার করো
      </p>
      {icons}
    </div>
  );
}
