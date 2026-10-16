'use client';

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
      toast.error('সমস্যাটি কমপক্ষে ২০ অক্ষরে বিস্তারিত লিখো');
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
          : 'সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করো।';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(
    issueType && phone.trim() && description.trim().length >= 20,
  );

  return (
    <div className="min-h-screen bg-[#0d0f15] text-white flex flex-col font-sans font-bengali px-4 sm:px-6 py-6 sm:py-8 selection:bg-emerald-500/20">
      {/* Top Header - Flat on page */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pb-5 border-b border-neutral-800/80 mb-6 sm:mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/60 transition-colors cursor-pointer"
          title="ফিরে যাও"
        >
          <ArrowLeft size={20} className="stroke-[2.5]" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-neutral-100 flex-1 text-center pr-8">
          সাপোর্টে যোগাযোগ
        </h1>
      </header>

      {/* Main Flat Content - Directly on the screen, without card boundaries */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-start">
        {submittedTicket ? (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                রিকোয়েস্ট জমা হয়েছে!
              </h2>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                আমাদের টিম দ্রুত তোমার ফোন নম্বরে যোগাযোগ করবে।
              </p>
            </div>

            {/* Ticket Info Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#171a23] border border-[#262a36] text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">রেফারেন্স আইডি:</span>
                <span className="font-mono font-bold text-emerald-400">
                  #{submittedTicket.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">ক্যাটাগরি:</span>
                <span className="font-medium text-neutral-200">
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
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30"
              >
                <MessageCircle size={20} />
                <span>সরাসরি WhatsApp-এ কথা বলো</span>
              </a>

              <Link
                href="/auth/login"
                className="w-full py-3 px-4 rounded-xl bg-[#171a23] hover:bg-[#202431] border border-[#262a36] text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center transition-colors"
              >
                লগইন পেজে ফিরে যাও
              </Link>
            </div>
          </div>
        ) : (
          /* FORM STATE - Flat on screen */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. সমস্যার ক্যাটাগরি */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs sm:text-sm font-semibold text-neutral-300 block">
                সমস্যার ক্যাটাগরি
              </label>
              <div className="relative">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full appearance-none px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-sm sm:text-base font-medium text-white focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-[#171a23] text-neutral-500">
                    ক্যাটাগরি নির্বাচন করো
                  </option>
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#171a23] text-white">
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>

            {/* 2. তোমার ফোন নাম্বার */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs sm:text-sm font-semibold text-neutral-300 block">
                তোমার ফোন নাম্বার
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            {/* 3. তোমার সমস্যা */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs sm:text-sm font-semibold text-neutral-300 block">
                তোমার সমস্যা
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="এখানে তোমার সমস্যা বিস্তারিত লিখে পাঠাও..."
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
              />
              <p className="text-xs text-neutral-400">
                কমপক্ষে ২০ অক্ষর লিখতে হবে
              </p>
            </div>

            {/* 4. ছবি / ভিডিও আপলোড করো */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs sm:text-sm font-semibold text-neutral-300 block">
                ছবি / ভিডিও আপলোড করো (ঐচ্ছিক)
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171a23] hover:bg-[#202431] border border-[#262a36] text-neutral-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
                >
                  <FileUp size={16} className="text-emerald-400" />
                  <span>
                    {selectedFile
                      ? `সিলেক্টেড: ${selectedFile.name}`
                      : 'ছবি বা স্ক্রিনশট আপলোড করো'}
                  </span>
                  {selectedFile && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="ml-1 p-0.5 hover:bg-neutral-800 rounded-full"
                    >
                      <X size={14} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                  isFormValid && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-lg shadow-emerald-950/40 cursor-pointer'
                    : 'bg-[#212430] text-neutral-500 cursor-not-allowed opacity-80'
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
      </main>
    </div>
  );
}
