import React, { useState, useRef, useEffect, useCallback } from 'react';
import Portal from '@/components/ui/portal';
import {
  AlertCircle,
  FileQuestion,
  MessageSquare,
  Tag,
  X,
  ImagePlus,
  HelpCircle,
  Flag,
  CheckCircle2,
  Trash2,
  ChevronRight,
  BookX,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitReport } from '@/services/report-service';
import { uploadReportImage } from '@/services/storage-service';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: unknown) => void;
  questionId: number | string | null;
  reporterId?: string;
  reporterName?: string;
}

const REPORT_TYPES = [
  {
    id: 'ভুল উত্তর',
    icon: BookX,
    label: 'ভুল উত্তর',
    desc: 'সঠিক উত্তর চিহ্নিত নেই',
    color: 'red',
  },
  {
    id: 'প্রশ্নে ডাউট',
    icon: HelpCircle,
    label: 'প্রশ্নে ডাউট',
    desc: 'প্রশ্নটি বিভ্রান্তিকর',
    color: 'amber',
  },
  {
    id: 'অসম্পূর্ণ প্রশ্ন',
    icon: FileQuestion,
    label: 'অসম্পূর্ণ প্রশ্ন',
    desc: 'প্রশ্নের অংশ অনুপস্থিত',
    color: 'orange',
  },
  {
    id: 'অসম্পূর্ণ সলিউশন',
    icon: MessageSquare,
    label: 'অসম্পূর্ণ সলিউশন',
    desc: 'ব্যাখ্যা অস্পষ্ট বা নেই',
    color: 'violet',
  },
  {
    id: 'ভুল ক্যাটাগরি',
    icon: Tag,
    label: 'ভুল ক্যাটাগরি',
    desc: 'বিষয় বা অধ্যায় ভুল',
    color: 'sky',
  },
  {
    id: 'Other',
    icon: AlertCircle,
    label: 'অন্যান্য',
    desc: 'অন্য কোনো সমস্যা',
    color: 'neutral',
  },
];

const COLOR_MAP: Record<string, { card: string; icon: string; dot: string }> = {
  red: {
    card: 'bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-500 ring-1 ring-red-300 dark:ring-red-700',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  amber: {
    card: 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 ring-1 ring-amber-300 dark:ring-amber-700',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  orange: {
    card: 'bg-orange-50 dark:bg-orange-950/40 border-orange-400 dark:border-orange-500 ring-1 ring-orange-300 dark:ring-orange-700',
    icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  violet: {
    card: 'bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-700',
    icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  sky: {
    card: 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 ring-1 ring-sky-300 dark:ring-sky-700',
    icon: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  neutral: {
    card: 'bg-neutral-100 dark:bg-neutral-800/60 border-neutral-400 dark:border-neutral-500 ring-1 ring-neutral-300 dark:ring-neutral-600',
    icon: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400',
    dot: 'bg-neutral-500',
  },
};

const CHAR_LIMIT = 500;

type UploadPhase = 'idle' | 'uploading_image' | 'saving';

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  questionId,
  reporterId = 'guest',
  reporterName = 'Guest',
}) => {
  const [selectedType, setSelectedType] = useState<string>('ভুল উত্তর');
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a ref to the current blob URL so we can revoke it on cleanup
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  // Reset state when dialog opens; revoke any stale blob URL first
  useEffect(() => {
    if (isOpen) {
      revokePreview();
      setSelectedType('ভুল উত্তর');
      setComment('');
      setImageFile(null);
      setImagePreview(null);
      setUploadPhase('idle');
      setSubmitted(false);
    }
  }, [isOpen, revokePreview]);

  // Revoke blob URL when modal is unmounted
  useEffect(() => () => revokePreview(), [revokePreview]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uploadPhase === 'idle') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, uploadPhase, onClose]);

  if (!isOpen || questionId === null) return null;

  const isSubmitting = uploadPhase !== 'idle';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(
        'শুধুমাত্র ছবি ফাইল (.jpg, .png, .webp ...) সংযুক্ত করা যাবে',
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ফাইলের সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না');
      return;
    }
    revokePreview();
    const blobUrl = URL.createObjectURL(file);
    previewUrlRef.current = blobUrl;
    setImageFile(file);
    setImagePreview(blobUrl);
  };

  const clearImage = () => {
    revokePreview();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedType || isSubmitting) return;
    if (comment.length > CHAR_LIMIT) {
      toast.error(`মন্তব্য ${CHAR_LIMIT} অক্ষরের মধ্যে হতে হবে`);
      return;
    }

    let resolvedImageUrl: string | undefined;

    try {
      // ── Phase 1: Upload image to R2 ───────────────────────────────────────
      if (imageFile) {
        setUploadPhase('uploading_image');
        const { url } = await uploadReportImage(imageFile);
        resolvedImageUrl = url;
      }

      // ── Phase 2: Save report to Supabase ──────────────────────────────────
      setUploadPhase('saving');
      await submitReport({
        questionId,
        type: selectedType,
        comment,
        imageUrl: resolvedImageUrl,
        reporterId,
        reporterName,
      });

      setSubmitted(true);
      setTimeout(() => onClose(), 1800);
    } catch (error) {
      console.error(error);
      if (resolvedImageUrl === undefined && imageFile) {
        toast.error('ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করো।');
      } else {
        toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
      }
    } finally {
      setUploadPhase('idle');
    }
  };

  const charPct = Math.min((comment.length / CHAR_LIMIT) * 100, 100);
  const charColor =
    charPct > 90
      ? 'text-red-500'
      : charPct > 70
        ? 'text-amber-500'
        : 'text-neutral-400 dark:text-neutral-500';

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Sheet / Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="প্রশ্ন রিপোর্ট করুন"
        className={[
          'fixed z-[9999] w-full',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0',
          // Desktop: centered
          'sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6',
        ].join(' ')}
      >
        <div
          className={[
            'relative flex flex-col',
            'bg-white dark:bg-neutral-900',
            // Mobile: top-rounded sheet
            'rounded-t-3xl',
            // Desktop: fully rounded card
            'sm:rounded-2xl',
            'w-full sm:max-w-lg',
            'max-h-[92dvh] sm:max-h-[88dvh]',
            'shadow-[0_-4px_40px_rgba(0,0,0,0.18)] sm:shadow-2xl',
            'border border-black/[0.06] dark:border-white/[0.06]',
            'overflow-hidden',
            'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 ease-out',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Mobile drag handle ────────────────────────────────── */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="shrink-0 px-5 sm:px-6 pt-3 sm:pt-5 pb-4 sm:pb-5 flex items-start gap-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Flag size={15} className="text-red-500 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                  সমস্যা রিপোর্ট করুন
                </h2>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                প্রশ্ন নং&nbsp;
                <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                  #{String(questionId).slice(0, 8)}
                </span>
                &nbsp;— সমস্যার ধরন বেছে নিন
              </p>
            </div>
            <button
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="shrink-0 p-2 -mr-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              aria-label="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {submitted ? (
              /* ── Success state ─────────── */
              <div className="flex flex-col items-center justify-center gap-4 py-14 px-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-neutral-800 dark:text-white mb-1">
                    রিপোর্ট জমা হয়েছে!
                  </p>
                  <p className="text-sm text-neutral-500">
                    আপনার মতামত আমাদের কাছে পৌঁছেছে। ধন্যবাদ।
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-5">
                {/* ── Report type grid ──── */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 mb-3">
                    সমস্যার ধরন
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {REPORT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;
                      const colors = COLOR_MAP[type.color];
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={[
                            'relative flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.97]',
                            isSelected
                              ? colors.card
                              : 'bg-neutral-50 dark:bg-neutral-800/40 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          ].join(' ')}
                        >
                          {/* Icon */}
                          <div
                            className={[
                              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                              isSelected
                                ? colors.icon
                                : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-400 dark:text-neutral-500',
                            ].join(' ')}
                          >
                            <Icon size={15} />
                          </div>
                          {/* Text */}
                          <div className="min-w-0">
                            <p
                              className={[
                                'text-[11px] font-bold leading-tight truncate',
                                isSelected
                                  ? 'text-neutral-800 dark:text-neutral-100'
                                  : 'text-neutral-600 dark:text-neutral-400',
                              ].join(' ')}
                            >
                              {type.label}
                            </p>
                            <p className="text-[9px] text-neutral-400 dark:text-neutral-600 leading-tight mt-0.5 truncate">
                              {type.desc}
                            </p>
                          </div>
                          {/* Selected dot */}
                          {isSelected && (
                            <span
                              className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${colors.dot}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── Comment section ────── */}
                <section>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
                      বিস্তারিত মন্তব্য{' '}
                      <span className="normal-case font-normal tracking-normal text-neutral-300 dark:text-neutral-600">
                        (ঐচ্ছিক)
                      </span>
                    </p>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${charColor}`}
                    >
                      {comment.length}/{CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value.slice(0, CHAR_LIMIT))
                    }
                    placeholder="সমস্যার বিস্তারিত বিবরণ এখানে লিখুন..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400/50 dark:focus:ring-red-500/30 dark:focus:border-red-500/40 transition-all resize-none leading-relaxed"
                  />
                </section>

                {/* ── Image attach ────────── */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 mb-2">
                    স্ক্রিনশট{' '}
                    <span className="normal-case font-normal tracking-normal text-neutral-300 dark:text-neutral-600">
                      (ঐচ্ছিক · সর্বোচ্চ ৫ MB)
                    </span>
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="সংযুক্ত স্ক্রিনশট"
                        className="w-full max-h-40 object-cover"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all active:scale-95"
                        aria-label="ছবি সরান"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-[10px] text-neutral-500 truncate">
                          {imageFile?.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600 hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-all group active:scale-[0.99]"
                    >
                      <ImagePlus size={18} className="shrink-0" />
                      <span className="text-xs font-medium">
                        ছবি যুক্ত করুন
                      </span>
                      <ChevronRight
                        size={14}
                        className="ml-auto opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          {!submitted && (
            <div className="shrink-0 px-5 sm:px-6 py-4 sm:py-5 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
              <button
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-40"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {uploadPhase === 'uploading_image'
                        ? 'ছবি আপলোড হচ্ছে...'
                        : 'সংরক্ষণ হচ্ছে...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Flag size={14} />
                    <span>রিপোর্ট পাঠান</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bottom safe-area padding on mobile */}
          <div className="sm:hidden h-[env(safe-area-inset-bottom)] shrink-0" />
        </div>
      </div>
    </Portal>
  );
};

export default ReportModal;
