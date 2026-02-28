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
  HelpCircle,
} from 'lucide-react';
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
  { id: 'ভুল উত্তর', icon: X, label: 'ভুল উত্তর' },
  { id: 'প্রশ্নে ডাউট', icon: HelpCircle, label: 'প্রশ্নে ডাউট' },
  { id: 'অসম্পূর্ণ প্রশ্ন', icon: FileQuestion, label: 'অসম্পূর্ণ প্রশ্ন' },
  { id: 'অসম্পূর্ণ সলিউশন', icon: MessageSquare, label: 'অসম্পূর্ণ সলিউশন' },
  { id: 'ভুল ক্যাটাগরি', icon: Tag, label: 'ভুল ক্যাটাগরি' },
  { id: 'Other', icon: AlertCircle, label: 'অন্যান্য' },
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || questionId === null) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
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
    if (comment.length > 500) {
      toast.error('মন্তব্য ৫০০ অক্ষরের মধ্যে হতে হবে');
      return;
    }
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

      toast.success('রিপোর্ট জমা দেওয়া হয়েছে। ধন্যবাদ!');

      setComment('');
      setSelectedType('ভুল উত্তর');
      clearImage();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        {/* Modal Content */}
        <div className="bg-white dark:bg-neutral-900 w-full max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col relative">
          {/* Close Button Top Right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/5 dark:bg-white/5 text-neutral-400 hover:text-black dark:hover:text-white transition-all active:scale-95"
          >
            <X size={18} />
          </button>

          <div className="p-8 sm:p-10">
            {/* 6 Category Cards */}
            <div className="mb-8">
              <h3 className="text-xl font-black text-black dark:text-white mb-6 pr-10">
                সমস্যাটি রিপোর্ট করুন
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`
                        flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.5rem] transition-all duration-300 border-2
                        ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-lg shadow-red-500/10'
                            : 'bg-neutral-50 dark:bg-neutral-800/50 border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }
                      `}
                    >
                      <div
                        className={`p-2 rounded-xl ${isSelected ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Input Section */}
            <div className="relative group">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  মন্তব্য দিন
                </label>
                <span className="text-[10px] font-bold text-neutral-300">
                  {comment.length}/৫০০
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="সমস্যার বিস্তারিত এখানে লিখুন..."
                  className="w-full h-32 p-5 pb-12 rounded-[1.5rem] border-2 border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 transition-all resize-none text-sm leading-relaxed"
                />

                {/* Floating Action Bar inside input */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-full transition-all active:scale-90 ${imagePreview ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:text-black dark:hover:text-white'}`}
                      title="ছবি সংযুক্ত করুন"
                    >
                      {imagePreview ? (
                        <Check size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                    </button>
                    {imagePreview && (
                      <button
                        onClick={clearImage}
                        className="p-1 px-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-200 dark:border-red-800"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="py-4 rounded-[1.25rem] font-bold text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
                className="py-4 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-[1.25rem] shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'রিপোর্ট পাঠান'
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
