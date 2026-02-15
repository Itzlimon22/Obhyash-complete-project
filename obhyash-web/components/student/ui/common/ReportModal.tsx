import React, { useState, useRef } from 'react';
import Portal from '@/components/ui/portal';
import {
  AlertCircle,
  FileQuestion,
  MessageSquare,
  Tag,
  X,
  Upload,
  Check,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitReport } from '@/services/report-service';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void; // Legacy prop, we will use internal submit
  questionId: number | string | null;
  reporterId?: string; // We'll need this
  reporterName?: string;
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
  questionId,
  reporterId = 'guest', // Fallback
  reporterName = 'Guest',
}) => {
  const [selectedType, setSelectedType] = useState<string>('অসম্পূর্ণ প্রশ্ন');
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || questionId === null) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('ফাইলের সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    try {
      await submitReport({
        questionId,
        type: selectedType,
        comment,
        imageFile: imageFile || undefined,
        reporterId,
        reporterName,
      });

      toast.success('রিপোর্ট জমা দেওয়া হয়েছে। ধন্যবাদ!');

      // Reset and close
      setComment('');
      setSelectedType('অসম্পূর্ণ প্রশ্ন');
      clearImage();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        {/* Modal / Bottom Sheet */}
        <div className="bg-white dark:bg-neutral-900 w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight font-serif-exam">
                  প্রশ্ন রিপোর্ট করুন
                </h3>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">
                  Question #{questionId}
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

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Report Type Selection */}
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
                        flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all duration-200 border-2
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

            {/* Comment Section */}
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
                className="w-full h-24 p-4 rounded-xl border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-red-500/50 transition-all resize-none text-sm leading-relaxed font-serif-exam"
              />
            </div>

            {/* Reference Image Upload */}
            <div className="mb-6">
              <label className="block text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">
                রেফারেন্স ছবি (অপশনাল)
              </label>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2 text-neutral-500">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    ছবি যুক্ত করতে ট্যাপ করুন
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                    <Check size={10} /> সংযুক্ত
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 pb-safe">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
                className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    অপেক্ষা করুন...
                  </>
                ) : (
                  'রিপোর্ট জমা দিন'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ReportModal;
