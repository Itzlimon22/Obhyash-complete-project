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
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
        {/* Modal / Bottom Sheet */}
        <div className="bg-white dark:bg-black w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 max-h-[50vh] sm:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-black dark:text-white leading-tight">
                  প্রশ্ন রিপোর্ট করুন
                </h3>
                <p className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
                  Question #{questionId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Report Type Selection */}
            <div className="mb-6">
              <label className="block text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-4">
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
                        flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-black transition-all duration-200 border-2 uppercase tracking-wide
                        ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                            : 'bg-black/5 dark:bg-white/5 border-transparent text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon
                        size={14}
                        className={
                          isSelected
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-black/40 dark:text-white/40'
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
                <label className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest">
                  অতিরিক্ত মন্তব্য
                </label>
                <span className="text-[10px] font-black text-black/30 dark:text-white/30">
                  {comment.length}/৫০০
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="সমস্যার বিস্তারিত এখানে লেখো..."
                className="w-full h-24 p-4 rounded-xl border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all resize-none text-sm leading-relaxed"
              />
            </div>

            {/* Reference Image Upload */}
            <div className="mb-6">
              <label className="block text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-4">
                রেফারেন্স ছবি (অপশনাল)
              </label>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2 text-black/40 dark:text-white/40">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-wide">
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
                <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-black text-white flex items-center gap-1">
                    <Check size={10} /> সংযুক্ত
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl font-black text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
                className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    অপেক্ষা করো...
                  </>
                ) : (
                  'রিপোর্ট জমা দাও'
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
