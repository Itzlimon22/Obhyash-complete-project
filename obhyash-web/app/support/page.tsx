'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ChevronDown,
  FileUp,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/providers/ThemeProvider';

const ISSUE_TYPES = [
  'লগইন হচ্ছে না (Login Issue)',
  'ওটিপি কোড পাচ্ছি না (OTP Issue)',
  'পাসওয়ার্ড ভুলে গেছি / রিসেট হচ্ছে না',
  'নতুন অ্যাকাউন্ট খুলতে সমস্যা (Registration Issue)',
  'পেমেন্ট বা সাবস্ক্রিপশন সমস্যা',
  'অন্যান্য সমস্যা',
];

export default function SupportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [phone, setPhone] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    whatsappUrl: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issueType) {
      toast.error('দয়া করে সমস্যার ক্যাটাগরি নির্বাচন করো');
      return;
    }

    if (!phone.trim()) {
      toast.error('তোমার ফোন নাম্বার উল্লেখ করা আবশ্যক');
      return;
    }

    if (!description.trim()) {
      toast.error('তোমার সমস্যা লিখে পাঠাও');
      return;
    }

    if (description.trim().length < 20) {
      toast.error('সমস্যাটি কমপক্ষে ২০ অক্ষরে বিস্তারিত লিখুন');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student',
          contactInfo: phone.trim(),
          issueType,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'অনুরোধটি পাঠানো সম্ভব হয়নি');
      }

      setSubmittedTicket({
        id: data.ticketId,
        whatsappUrl: data.whatsappUrl,
      });
      toast.success('সাপোর্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'সার্ভারে সংযোগ করা যায়নি। দয়া করে আবার চেষ্টা করুন।';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(
    issueType && phone.trim() && description.trim().length >= 20,
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#07080a] md:bg-neutral-50 md:dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 flex flex-col font-bengali">
      {/* Top Header - Navigation matching Flutter Screenshot 2 */}
      <header className="w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto px-5 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 -ml-1 text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          title="ফিরে যান"
        >
          <ArrowLeft size={24} className="stroke-[2.5]" />
        </button>

        <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white text-center flex-1 pr-6">
          সাপোর্টে যোগাযোগ
        </h1>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={theme === 'dark' ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content - Flutter full-bleed on mobile, Centered Card on desktop */}
      <main className="flex-1 w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto px-5 sm:px-6 py-4 sm:py-8 flex items-center justify-center">
        <div className="w-full md:bg-white md:dark:bg-[#111216] md:border md:border-neutral-200/90 md:dark:border-neutral-800/80 md:rounded-3xl sm:p-2 md:p-8 md:shadow-xl md:shadow-neutral-200/40 md:dark:shadow-none space-y-6 transition-colors">
          {submittedTicket ? (
            /* SUCCESS STATE */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
                  রিকোয়েস্ট জমা হয়েছে!
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  আমাদের টিম দ্রুত তোমার ফোন নম্বরে যোগাযোগ করবে।
                </p>
              </div>

              {/* Ticket Info Box */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 text-left space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">রেফারেন্স আইডি:</span>
                  <span className="font-mono font-extrabold text-neutral-900 dark:text-white">
                    #{submittedTicket.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">ক্যাটাগরি:</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {issueType}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <a
                  href={submittedTicket.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageCircle size={20} />
                  <span>সরাসরি WhatsApp-এ কথা বলুন</span>
                </a>

                <Link
                  href="/login"
                  className="w-full h-12 px-4 rounded-2xl bg-neutral-100 dark:bg-[#16171d] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center transition-colors"
                >
                  লগইন পেজে ফিরে যান
                </Link>
              </div>
            </div>
          ) : (
            /* FORM STATE MATCHING FLUTTER SCREENSHOT 2 */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. সমস্যার ক্যাটাগরি */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
                  সমস্যার ক্যাটাগরি
                </label>
                <div className="relative">
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 sm:py-4 rounded-2xl bg-[#f3f4f6] dark:bg-[#16171d] border-0 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="dark:bg-[#16171d]">
                      ক্যাটাগরি নির্বাচন করো
                    </option>
                    {ISSUE_TYPES.map((type) => (
                      <option key={type} value={type} className="dark:bg-[#16171d]">
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-400 pointer-events-none stroke-[2.5]"
                  />
                </div>
              </div>

              {/* 2. তোমার ফোন নাম্বার */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
                  তোমার ফোন নাম্বার
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="০১XXXXXXXXX"
                  className="w-full px-4 py-3.5 sm:py-4 rounded-2xl bg-[#f3f4f6] dark:bg-[#16171d] border-0 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 transition-all font-mono"
                />
              </div>

              {/* 3. তোমার সমস্যা */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
                  তোমার সমস্যা
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="এখানে লিখে পাঠাও"
                  className="w-full px-4 py-3.5 sm:py-4 rounded-2xl bg-[#f3f4f6] dark:bg-[#16171d] border-0 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 transition-all resize-none"
                />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  কমপক্ষে ২০ অক্ষর লিখতে হবে
                </p>
              </div>

              {/* 4. ছবি / ভিডিও আপলোড করো - Flutter screenshot mint button */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
                  ছবি / ভিডিও আপলোড করো
                </label>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#e8fbf3] dark:bg-emerald-950/40 border border-[#a3e9cc] dark:border-emerald-800/60 text-[#006A4E] dark:text-emerald-400 text-xs sm:text-sm font-bold hover:bg-[#d8f8ea] dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                  >
                    <FileUp size={18} />
                    <span>
                      {selectedFile
                        ? `সিলেক্টেড: ${selectedFile.name}`
                        : 'পিকচার / ভিডিও আপলোড করো'}
                    </span>
                    {selectedFile && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full"
                      >
                        <X size={14} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button matching Flutter Screenshot 2 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isFormValid
                      ? 'bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white cursor-pointer'
                      : 'bg-[#f3f4f6] dark:bg-[#16171d] text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সাপোর্ট রিকোয়েস্ট পাঠাও</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
