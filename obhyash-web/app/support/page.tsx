'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo, Heading, PrimaryButton, BackButton } from '@/components/auth/figma/ui';
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
    <div className="min-h-screen bg-[#07080b] text-zinc-100 font-['Kalpurush',sans-serif]">
      <BackButton onClick={() => router.push('/auth/login')} />
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
        <Logo />

        <div className="mt-8 sm:mt-10 w-full animate-step">
          {submittedTicket ? (
            /* SUCCESS STATE */
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>

              <Heading
                title="রিকোয়েস্ট জমা হয়েছে!"
                sub="আমাদের টিম দ্রুত তোমার ফোন নম্বরে যোগাযোগ করবে।"
              />

              {/* Ticket Info Box */}
              <div className="p-5 rounded-2xl bg-[#14161f] border border-white/10 text-left space-y-3 shadow-[0_4px_0_#0c0e15]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">রেফারেন্স আইডি:</span>
                  <span className="font-mono font-bold text-[#10b981]">
                    #{submittedTicket.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">ক্যাটাগরি:</span>
                  <span className="font-medium text-white">{issueType}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <a
                  href={submittedTicket.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#084838] hover:bg-[#0a5845] font-bold text-white border border-[#10b981]/30 shadow-[0_5px_0_#04261e] transition-all duration-100 active:translate-y-[5px] active:shadow-none text-base"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>সরাসরি WhatsApp-এ কথা বলো</span>
                </a>

                <Link
                  href="/auth/login"
                  className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-[#16181e] font-semibold text-zinc-300 shadow-[0_4px_0_#0b0c10] transition-all duration-100 hover:bg-[#1c1f26] hover:text-white active:translate-y-[4px] active:shadow-none text-sm"
                >
                  লগইন পেজে ফিরে যাও
                </Link>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <>
              <Heading
                title="সাপোর্টে যোগাযোগ"
                sub="কোনো সমস্যা হলে নিচে জানাও, আমাদের টিম দ্রুত সমাধান করবে"
              />

              <form onSubmit={handleSubmit} className="mt-8 space-y-4 font-['Kalpurush',sans-serif]">
                {/* 1. সমস্যার ক্যাটাগরি */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    সমস্যার ক্যাটাগরি
                  </label>
                  <div className="relative">
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-black/40 px-5 pr-10 text-base text-white outline-none transition focus:border-[#ef4136]/60 focus:ring-4 focus:ring-[#ef4136]/15 font-['Kalpurush',sans-serif] cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#14161f] text-zinc-500">
                        ক্যাটাগরি নির্বাচন করো
                      </option>
                      {ISSUE_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-[#14161f] text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24"
                      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* 2. তোমার ফোন নাম্বার */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    তোমার ফোন নাম্বার
                  </label>
                  <div className="group relative">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-[#ef4136]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="০১XXXXXXXXX"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ef4136]/60 focus:ring-4 focus:ring-[#ef4136]/15 font-['Kalpurush',sans-serif]"
                    />
                  </div>
                </div>

                {/* 3. তোমার সমস্যা */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    তোমার সমস্যা বিস্তারিত লিখো
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="এখানে তোমার সমস্যা বিস্তারিত লিখে পাঠাও (কমপক্ষে ২০ অক্ষর)..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ef4136]/60 focus:ring-4 focus:ring-[#ef4136]/15 font-['Kalpurush',sans-serif] resize-none"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    কমপক্ষে ২০ অক্ষর লিখতে হবে
                  </p>
                </div>

                {/* 4. ছবি / স্ক্রিনশট (ঐচ্ছিক) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    ছবি / স্ক্রিনশট আপলোড (ঐচ্ছিক)
                  </label>
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
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16181e] px-4 text-sm font-medium text-zinc-300 shadow-[0_4px_0_#0b0c10] transition-all duration-100 hover:bg-[#1c1f26] hover:text-white active:translate-y-[4px] active:shadow-none"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>
                      {selectedFile ? `সিলেক্টেড: ${selectedFile.name}` : 'ছবি বা স্ক্রিনশট সংযুক্ত করো'}
                    </span>
                    {selectedFile && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="ml-2 rounded-full p-1 hover:bg-white/10"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <PrimaryButton loading={isSubmitting} disabled={!isFormValid}>
                    সাপোর্ট রিকোয়েস্ট পাঠাও
                  </PrimaryButton>
                </div>
              </form>
            </>
          )}
        </div>

        <nav className="mt-12 flex items-center gap-3 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-300">
            গোপনীয়তা নীতি
          </Link>
          <span>·</span>
          <Link href="/terms-and-conditions" className="hover:text-zinc-300">
            শর্তাবলী
          </Link>
          <span>·</span>
          <Link href="/about-us#faq" className="hover:text-zinc-300">
            সহায়তা
          </Link>
        </nav>
      </main>
    </div>
  );
}
