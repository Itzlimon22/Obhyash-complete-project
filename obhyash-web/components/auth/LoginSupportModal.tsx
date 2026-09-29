'use client';

import React, { useState } from 'react';
import { X, Send, MessageCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ISSUE_OPTIONS = [
  'লগইন করতে পারছি না',
  'ওটিপি কোড পাচ্ছি না',
  'পাসওয়ার্ড রিসেট সমস্যা',
  'পেমেন্ট করেছি কিন্তু একাউন্ট চালু হয়নি',
  'নতুন অ্যাকাউন্ট তৈরি সমস্যা',
  'অন্যান্য সমস্যা',
];

export default function LoginSupportModal({ isOpen, onClose }: LoginSupportModalProps) {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [issueType, setIssueType] = useState(ISSUE_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    ticketId: string;
    whatsappUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('অনুগ্রহ করে তোমার নাম লিখুন');
      return;
    }
    if (!contactInfo.trim()) {
      toast.error('মোবাইল নম্বর বা ইমেইল প্রদান করুন');
      return;
    }
    if (!description.trim()) {
      toast.error('সমস্যার বিবরণ লিখুন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          issueType,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'অনুরোধটি পাঠানো যায়নি');
      }

      setSubmittedData({
        ticketId: data.ticketId,
        whatsappUrl: data.whatsappUrl,
      });
      toast.success('অনুরোধ সফলভাবে পাঠানো হয়েছে!');
    } catch (err: any) {
      toast.error(err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedData(null);
    setName('');
    setContactInfo('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-[#006A4E] dark:text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                সহায়তা ও সাপোর্ট
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                আমাদের সাপোর্ট টিম সবসময় তোমাকে সহায়তা করতে প্রস্তুত
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submittedData ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  অনুরোধ সফলভাবে গৃহীত হয়েছে!
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  টিকিট নম্বর: <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">#{submittedData.ticketId.slice(0, 8)}</span>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  আমাদের সাপোর্ট টিম খুব শীঘ্রই তোমার দেওয়া নম্বরে যোগাযোগ করবে।
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <a
                  href={submittedData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl shadow-sm transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  সরাসরি WhatsApp-এ কথা বলুন
                </a>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  তোমার নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="পূর্ণ নাম লিখুন"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-[#006A4E] dark:focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  মোবাইল নম্বর বা ইমেইল <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="01XXXXXXXXX বা example@gmail.com"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-[#006A4E] dark:focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  সমস্যার ধরন
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-[#006A4E] dark:focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  {ISSUE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  সমস্যার বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="তোমার সমস্যাটি সংক্ষেপে লেখো..."
                  required
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-[#006A4E] dark:focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#006A4E] hover:bg-[#005a42] text-white font-bold rounded-2xl shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    অনুরোধ জমা দিন
                  </>
                )}
              </button>

              <div className="pt-1 text-center">
                <a
                  href="https://wa.me/8801409583992"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  জরুরি হলে সরাসরি WhatsApp-এ বার্তা দিন
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
