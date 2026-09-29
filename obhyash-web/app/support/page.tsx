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

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-bengali">
      {/* Top Header - Flat Navigation */}
      <header className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 text-neutral-800 hover:text-neutral-600 transition-colors"
          title="ফিরে যান"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-neutral-900 text-center flex-1">
          সাপোর্টে যোগাযোগ
        </h1>

        <div className="w-6" />
      </header>

      {/* Main Content - Flat to Screen, No Outer Card */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-4">
        {submittedTicket ? (
          /* SUCCESS STATE - Flat */
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-900">
                রিকোয়েস্ট জমা হয়েছে!
              </h2>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                আমাদের টিম দ্রুত তোমার ফোন নম্বরে যোগাযোগ করবে।
              </p>
            </div>

            {/* Ticket Info Flat Box */}
            <div className="p-5 rounded-2xl bg-neutral-100 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">রেফারেন্স আইডি:</span>
                <span className="font-mono font-extrabold text-neutral-900">
                  #{submittedTicket.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">ক্যাটাগরি:</span>
                <span className="font-medium text-neutral-800">
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
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={18} />
                <span>সরাসরি WhatsApp-এ কথা বলুন</span>
              </a>

              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center transition-colors"
              >
                লগইন পেজে ফিরে যান
              </Link>
            </div>
          </div>
        ) : (
          /* FORM STATE - Flat to Screen */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. সমস্যার ক্যাটাগরি */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900">
                সমস্যার ক্যাটাগরি
              </label>
              <div className="relative">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full appearance-none px-4 py-3.5 rounded-xl bg-neutral-100 text-sm text-neutral-900 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>
                    ক্যাটাগরি নির্বাচন করো
                  </option>
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
              </div>
            </div>

            {/* 2. তোমার ফোন নাম্বার */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900">
                তোমার ফোন নাম্বার
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
                className="w-full px-4 py-3.5 rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all"
              />
            </div>

            {/* 3. তোমার সমস্যা */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900">
                তোমার সমস্যা
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="এখানে লিখে পাঠাও"
                className="w-full px-4 py-3.5 rounded-2xl bg-neutral-100 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all resize-none"
              />
              <p className="text-xs text-neutral-400">
                কমপক্ষে ২০ অক্ষর লিখতে হবে
              </p>
            </div>

            {/* 4. ছবি / ভিডিও আপলোড করো */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-900">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/70 transition-all"
                >
                  <FileUp size={16} />
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
                      className="ml-1 p-0.5 hover:bg-emerald-200 rounded-full"
                    >
                      <X size={13} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 6. Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
