'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Save,
  Sparkles,
  Zap,
  CheckCircle2,
  Edit3,
  Phone,
  School,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathRenderer } from '@/components/common/MathRenderer';
import { resolveImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface ReportInspectorDrawerProps {
  report: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReportInspectorDrawer({
  report,
  isOpen,
  onClose,
  onUpdate,
}: ReportInspectorDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminComment, setAdminComment] = useState('');

  // Inline Question Editing State
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(0);
  const [explanationText, setExplanationText] = useState<string>('');
  const [questionStem, setQuestionStem] = useState<string>('');

  useEffect(() => {
    if (report && report.question) {
      const q = report.question;
      const initialCorrect =
        Array.isArray(q.correct_answer_indices) && q.correct_answer_indices.length > 0
          ? q.correct_answer_indices[0]
          : q.correctAnswerIndex ?? 0;
      setSelectedCorrectIndex(initialCorrect);
      setExplanationText(q.explanation || '');
      setQuestionStem(q.question || '');
      setAdminComment(report.admin_comment || 'ত্রুটি সংশোধন করা হয়েছে। সহযোগিতার জন্য ধন্যবাদ!');
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const reporter = report.reporter || {};
  const question = report.question;
  const isPending = report.status === 'Pending';

  // 1. Fix Question and Accept Report
  const handleFixAndResolve = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fix_and_resolve',
          reportId: report.id,
          questionFix: question
            ? {
                questionId: question.id,
                correctAnswerIndex: selectedCorrectIndex,
                explanation: explanationText,
                questionText: questionStem,
              }
            : undefined,
          adminComment,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          'প্রশ্ন সংশোধন করা হয়েছে এবং শিক্ষার্থীকে ১ দিনের প্রো রিওয়ার্ড দেওয়া হয়েছে! 🎉',
        );
        onUpdate();
        onClose();
      } else {
        toast.error(json.error || 'Failed to resolve report');
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Reject / Dismiss Report
  const handleDismiss = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          reportId: report.id,
          resolution: 'Reject',
          adminComment: adminComment || 'রিপোর্টটি ভ্যালিড নয় বলে বাতিল করা হয়েছে।',
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.info('রিপোর্টটি বাতিল (Dismiss) করা হয়েছে।');
        onUpdate();
        onClose();
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionLabels = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-[#121215] border-l border-neutral-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* ── Drawer Header ── */}
        <div className="p-5 border-b border-neutral-200 dark:border-zinc-800/80 flex items-center justify-between bg-neutral-50/80 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-neutral-900 dark:text-white">
                  রিপোর্ট বিস্তারিত ও ইনলাইন সমাধান
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    report.status === 'Pending'
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60'
                      : report.status === 'Resolved'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/60'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-zinc-400">
                রিপোর্ট আইডি: #{String(report.id).slice(0, 8)} •{' '}
                {new Date(report.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Drawer Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Reporter & Issue Card */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{
                    backgroundColor: reporter.avatar_color || '#059669',
                  }}
                >
                  {reporter.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900 dark:text-white">
                    {reporter.name || report.reporter_name || 'শিক্ষার্থী'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    <School size={12} />
                    <span>{reporter.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}</span>
                  </p>
                </div>
              </div>

              {reporter.phone && (
                <span className="text-xs font-mono font-semibold text-neutral-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-zinc-700">
                  {reporter.phone}
                </span>
              )}
            </div>

            {/* Reason & Comments */}
            <div className="pt-2 border-t border-neutral-200/60 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase">
                  সমস্যার ধরণ:
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                  {report.reason}
                </span>
              </div>

              {report.description && (
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-850 border border-neutral-200/60 dark:border-zinc-800 text-xs text-neutral-800 dark:text-zinc-200">
                  <p className="font-bold text-[10px] text-neutral-400 uppercase mb-0.5">
                    শিক্ষার্থীর মতামত:
                  </p>
                  <p className="leading-relaxed">{report.description}</p>
                </div>
              )}
            </div>

            {/* Reference Image Attachment */}
            {report.image_url && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-neutral-500 uppercase mb-1.5 flex items-center gap-1">
                  <ExternalLink size={12} /> রেফারেন্স স্ক্রিনশট:
                </p>
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-700 bg-black/5 dark:bg-black/40 max-h-48 flex items-center justify-center">
                  <img
                    src={resolveImageUrl(report.image_url) ?? ''}
                    alt="Reference"
                    className="max-h-48 object-contain"
                  />
                  <a
                    href={resolveImageUrl(report.image_url) ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-black transition"
                  >
                    <ExternalLink size={12} />
                    <span>বড় করে দেখুন</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Question Inspector & Quick Fix Panel ── */}
          {question ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 size={14} className="text-emerald-500" />
                  <span>প্রশ্ন ও সরাসরি উত্তর সংশোধন (Instant Fix)</span>
                </h3>
                <Link
                  href={`/admin/questions/new?edit=${question.id}`}
                  target="_blank"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <span>ফুল বিল্ডারে খুলুন</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Question Stem */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800 space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase">
                  প্রশ্নের বক্তব্য (KaTeX Rendered):
                </label>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                  <MathRenderer text={questionStem} />
                </div>
              </div>

              {/* Options Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase flex items-center justify-between">
                  <span>বিকল্প উত্তরসমূহ (সঠিক উত্তরে ক্লিক করুন):</span>
                  <span className="text-emerald-600 text-[10px]">
                    ✓ সবুজ রঙেরটি বর্তমান সঠিক উত্তর
                  </span>
                </label>

                <div className="space-y-2">
                  {(question.options || []).map((opt: string, idx: number) => {
                    const isSelected = selectedCorrectIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCorrectIndex(idx)}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-300 hover:border-emerald-500/40'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500'
                          }`}
                        >
                          {optionLabels[idx] || idx + 1}
                        </span>

                        <div className="flex-1 text-xs font-medium pt-0.5">
                          <MathRenderer text={opt} />
                        </div>

                        {isSelected && (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 shrink-0 mt-0.5"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase">
                  ব্যাখ্যা ও সমাধান (Explanation):
                </label>
                <textarea
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                  placeholder="সঠিক সমাধান বা ব্যাখ্যা এখানে লিখুন..."
                />
              </div>

              {/* Admin Comment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase">
                  শিক্ষার্থীকে পাঠানো বার্তা (Admin Feedback):
                </label>
                <input
                  type="text"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                  placeholder="যেমন: ত্রুটি সংশোধন করা হয়েছে। সহযোগিতার জন্য ধন্যবাদ!"
                />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-rose-500 text-xs bg-rose-50 dark:bg-rose-950/20 rounded-2xl">
              প্রশ্নটি ডাটাবেজ থেকে মুছে ফেলা হয়েছে অথবা পাওয়া যায়নি।
            </div>
          )}
        </div>

        {/* ── Drawer Footer ── */}
        <div className="p-4 border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 transition"
          >
            বন্ধ করুন
          </button>

          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>রিপোর্ট বাতিল (Dismiss)</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFixAndResolve}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>সংশোধন ও সমাধান করুন</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-neutral-500">
              এই রিপোর্টটি ইতিমধ্যেই {report.status === 'Resolved' ? 'সমাধান' : 'বাতিল'} করা হয়েছে।
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
