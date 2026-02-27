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
}

export default function SocialShare({ url, title }: SocialShareProps) {
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
    'w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:-translate-y-1 shadow-sm';

  return (
    <div className="pt-8 mt-10 border-t border-slate-100 dark:border-slate-800">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 font-anek">
        শেয়ার করুন
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333] text-[#1877F2] hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] group`}
          aria-label="Share on Facebook"
        >
          <Facebook className="w-[18px] h-[18px] transition-colors" />
        </a>

        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333] text-[#25D366] hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] group`}
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="w-[18px] h-[18px] transition-colors" />
        </a>

        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333] text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white dark:hover:bg-[#1DA1F2] group`}
          aria-label="Share on Twitter"
        >
          <Twitter className="w-[18px] h-[18px] transition-colors" />
        </a>

        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] group`}
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-[18px] h-[18px] transition-colors" />
        </a>

        <button
          onClick={handleCopyLink}
          className={`${buttonClass} bg-slate-900 border-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 dark:hover:bg-white ml-2`}
          aria-label="Copy Link"
        >
          {copied ? (
            <Check className="w-[18px] h-[18px]" />
          ) : (
            <LinkIcon className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
