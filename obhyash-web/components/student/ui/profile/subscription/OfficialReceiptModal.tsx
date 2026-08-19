'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Loader2,
  Check,
} from 'lucide-react';
import { Invoice } from '@/lib/types';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface OfficialReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  userInstitute?: string;
}

export default function OfficialReceiptModal({
  invoice,
  onClose,
  userName = '',
  userEmail = '',
  userInstitute = '',
}: OfficialReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const shortId =
    invoice.id.length > 8
      ? invoice.id.substring(0, 8).toUpperCase()
      : invoice.id.toUpperCase();

  const displayName = userName.trim() || 'সম্মানিত শিক্ষার্থী';

  const statusLabel =
    invoice.status === 'paid' || invoice.status === 'valid'
      ? 'পরিশোধিত (PAID)'
      : invoice.status === 'pending' || invoice.status === 'checking'
        ? 'প্রক্রিয়াধীন (PENDING)'
        : 'বাতিল (REJECTED)';

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      // Capture the element at 3x pixel ratio for 300DPI print-grade resolution
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#FFFFFF',
      });

      const link = document.createElement('a');
      link.download = `obhyash_receipt_${shortId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('অফিসিয়াল রিসিট ডাউনলোড সম্পন্ন হয়েছে!');
    } catch (err) {
      console.error('Failed to download receipt', err);
      toast.error('রিসিট ডাউনলোডে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `অভ্যাস পেমেন্ট রিসিট\nইনভয়েস: #${shortId}\nপ্ল্যান: ${invoice.planName}\nতারিখ: ${invoice.date}\nপরিমাণ: ${invoice.currency} ${invoice.amount}.00\nস্ট্যাটাস: ${statusLabel}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('রিসিটের বিবরণ কপি করা হয়েছে!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                অফিসিয়াল পেমেন্ট রিসিট
              </h3>
              <p className="text-xs text-neutral-500">ইনভয়েস #{shortId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Printable Voucher Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-100 dark:bg-neutral-950/60">
          <div
            ref={receiptRef}
            className="bg-white text-neutral-900 p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6 select-text"
            style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
          >
            {/* ── 1. Branding Header ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-200 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 bg-emerald-600 text-white font-black text-lg rounded-lg leading-none tracking-wide">
                    অভ্যাস
                  </div>
                  <span className="text-xl font-black tracking-widest text-slate-900">
                    OBHYASH
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                  স্মার্ট এডুকেশন ও এক্সাম প্রিপারেশন প্ল্যাটফর্ম
                </p>
                <p className="text-[11px] text-slate-400">
                  web: obhyash.com • support@obhyash.com
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-full border border-emerald-200">
                  পেমেন্ট রিসিট (RECEIPT)
                </span>
                <p className="text-xs font-bold text-slate-800 mt-2">
                  রিসিট নং: #{shortId}
                </p>
                <p className="text-[11px] text-slate-500">
                  তারিখ: {invoice.date}
                </p>
              </div>
            </div>

            {/* ── 2. Billed To & Payment Meta ────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  গ্রাহকের বিবরণ (BILLED TO)
                </span>
                <p className="font-bold text-sm text-slate-900">{displayName}</p>
                {userEmail && <p className="text-slate-600">{userEmail}</p>}
                {userInstitute && (
                  <p className="text-slate-600">{userInstitute}</p>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  পেমেন্ট বিবরণ (PAYMENT DETAILS)
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">পেমেন্ট মেথড:</span>
                  <span className="font-semibold text-slate-800">
                    {invoice.amount === 0
                      ? 'রেফারেল রিওয়ার্ড বোনাস'
                      : invoice.paymentMethod || 'অনলাইন পেমেন্ট'}
                  </span>
                </div>
                {invoice.transactionId && invoice.transactionId !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ট্রানজেকশন ID:</span>
                    <span className="font-mono text-slate-800">
                      {invoice.transactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">স্ট্যাটাস:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                    <CheckCircle2 size={12} /> {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 3. Itemized Table ───────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-700 grid grid-cols-12 gap-2 border-b border-slate-200">
                <span className="col-span-1">নং</span>
                <span className="col-span-8">সেবার বিবরণ (Description)</span>
                <span className="col-span-3 text-right">মূল্য (Amount)</span>
              </div>
              <div className="p-4 grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-slate-500 font-medium">০১</span>
                <div className="col-span-8">
                  <p className="font-bold text-sm text-slate-900">
                    {invoice.planName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    অভ্যাস প্রিমিয়াম অ্যাক্সেস, টেস্ট সিরিজ ও লাইভ এক্সাম
                  </p>
                </div>
                <div className="col-span-3 text-right font-bold text-sm text-slate-900">
                  {invoice.currency} {invoice.amount}.00
                </div>
              </div>
            </div>

            {/* ── 4. Total Calculation ────────────────────────────────── */}
            <div className="flex justify-end">
              <div className="w-64 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span>
                    {invoice.currency} {invoice.amount}.00
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডিসকাউন্ট:</span>
                  <span>৳ 0.00</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                  <span>সর্বমোট পরিশোধ:</span>
                  <span className="text-emerald-700 text-base font-extrabold">
                    {invoice.currency} {invoice.amount}.00
                  </span>
                </div>
              </div>
            </div>

            {/* ── 5. Official Verification Stamp & Footer ─────────────── */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900">
                  পেমেন্ট নিশ্চিত ও ভেরিফাইড (VERIFIED & PAID)
                </p>
                <p className="text-[10px] text-emerald-700">
                  এটি একটি ইলেকট্রনিক জেনারেটেড অফিসিয়াল মানি রিসিট। কোনো স্বাক্ষর বা সিলমোহরের প্রয়োজন নেই।
                </p>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 pt-1">
              অভ্যাস (Obhyash) প্ল্যাটফর্ম ব্যবহার করার জন্য আপনাকে ধন্যবাদ!
            </p>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            {copied ? (
              <Check size={15} className="text-emerald-600" />
            ) : (
              <Copy size={15} />
            )}
            <span>{copied ? 'কপি হয়েছে' : 'বিবরণ কপি করুন'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            >
              <Printer size={15} />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>{downloading ? 'ডাউনলোড হচ্ছে...' : 'অফিসিয়াল রিসিট ডাউনলোড করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
