import React, { useState, useEffect } from 'react';
import Portal from '@/components/ui/portal';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitReport } from '@/services/report-service';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: unknown) => void;
  questionId: number | string | null;
  reporterId?: string;
  reporterName?: string;
}

const REPORT_TYPES = [
  { id: 'ভুল উত্তর', label: 'ভুল উত্তর' },
  { id: 'প্রশ্নে ডাউট', label: 'প্রশ্নে ডাউট' },
  { id: 'অসম্পূর্ণ প্রশ্ন', label: 'অসম্পূর্ণ প্রশ্ন' },
  { id: 'অসম্পূর্ণ সলিউশন', label: 'অসম্পূর্ণ সলিউশন' },
  { id: 'ভুল ক্যাটাগরি', label: 'ভুল ক্যাটাগরি' },
  { id: 'Other', label: 'অন্যান্য' },
];

const CHAR_LIMIT = 500;
type UploadPhase = 'idle' | 'saving';

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  questionId,
  reporterId = 'guest',
  reporterName = 'Guest',
}) => {
  const [selectedType, setSelectedType] = useState<string>('ভুল উত্তর');
  const [comment, setComment] = useState('');
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType('ভুল উত্তর');
      setComment('');
      setUploadPhase('idle');
      setSubmitted(false);
    }
  }, [isOpen]);

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

  const handleSubmit = async () => {
    if (!selectedType || isSubmitting) return;
    if (comment.length > CHAR_LIMIT) {
      toast.error(`মন্তব্য ${CHAR_LIMIT} অক্ষরের মধ্যে হতে হবে`);
      return;
    }

    try {
      setUploadPhase('saving');
      await submitReport({
        questionId,
        type: selectedType,
        comment,
        reporterId,
        reporterName,
      });

      setSubmitted(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error(error);
      toast.error('রিপোর্ট পাঠাতে সমস্যা হয়েছে');
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
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="রিপোর্ট"
        className="fixed z-[9999] w-full bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6"
      >
        <div
          className="relative flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80dvh] sm:max-h-auto shadow-[0_-4px_40px_rgba(0,0,0,0.18)] sm:shadow-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>

          {/* Header */}
          <div className="shrink-0 px-4 sm:px-5 pt-2 sm:pt-4 pb-3 flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <Flag size={16} className="text-red-600 shrink-0" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex-1">
              রিপোর্ট
            </h2>
            <button
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
              aria-label="বন্ধ"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white text-center">
                  ধন্যবাদ!
                </p>
              </div>
            ) : (
              <div className="px-4 sm:px-5 py-3.5 space-y-3.5">
                {/* Problem Type */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    সমস্যা
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {REPORT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedType === type.id
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      মন্তব্য
                    </label>
                    <span className={`text-[10px] font-medium tabular-nums ${charColor}`}>
                      {comment.length}/{CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value.slice(0, CHAR_LIMIT))
                    }
                    placeholder="লেখো..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400/50 dark:focus:ring-red-500/30 dark:focus:border-red-500/40 transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!submitted && (
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
              <button
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg font-medium text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[1.5] py-2.5 rounded-lg font-bold text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    পাঠানো...
                  </>
                ) : (
                  <>
                    <Flag size={12} />
                    পাঠাও
                  </>
                )}
              </button>
            </div>
          )}

          {/* Safe area */}
          <div className="sm:hidden h-[env(safe-area-inset-bottom)] shrink-0" />
        </div>
      </div>
    </Portal>
  );
};

export default ReportModal;
