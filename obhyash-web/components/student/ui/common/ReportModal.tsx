import React, { useState } from 'react';
import Portal from '@/components/ui/portal';
import { AlertCircle, FileQuestion, MessageSquare, Tag, X } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    questionId: number;
    type: string;
    comment: string;
  }) => void;
  questionId: number | null;
}

const REPORT_TYPES = [
  { id: 'প্রশ্নে ডাউট', icon: FileQuestion, label: 'প্রশ্নে ডাউট' },
  { id: 'অসম্পূর্ণ প্রশ্ন', icon: AlertCircle, label: 'অসম্পূর্ণ প্রশ্ন' },
  { id: 'ভুল উত্তর', icon: X, label: 'ভুল উত্তর' },
  { id: 'ভুল ক্যাটাগরি', icon: Tag, label: 'ভুল ক্যাটাগরি' },
  { id: 'অসম্পূর্ণ সলিউশন', icon: MessageSquare, label: 'অসম্পূর্ণ সলিউশন' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  questionId,
}) => {
  const [selectedType, setSelectedType] = useState<string>('অসম্পূর্ণ প্রশ্ন');
  const [comment, setComment] = useState('');

  if (!isOpen || questionId === null) return null;

  const handleSubmit = () => {
    onSubmit({ questionId, type: selectedType, comment });
    setComment('');
    setSelectedType('অসম্পূর্ণ প্রশ্ন');
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                  প্রশ্ন রিপোর্ট করো
                </h3>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">
                  Report Question #{questionId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">
                সমস্যার ধরণ নির্বাচন করুন
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`
                        flex items-center gap-2 px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-200 border-2
                        ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-sm'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }
                      `}
                    >
                      <Icon
                        size={14}
                        className={
                          isSelected
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-neutral-400'
                        }
                      />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  অতিরিক্ত মন্তব্য
                </label>
                <span className="text-[10px] font-bold text-neutral-400">
                  {comment.length}/৫০০
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="সমস্যার বিস্তারিত এখানে লিখুন..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType}
                className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                রিপোর্ট জমা দিন
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ReportModal;
