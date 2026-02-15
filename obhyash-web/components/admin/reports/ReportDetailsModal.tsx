import React, { useState } from 'react';
import {
  X,
  Check,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/portal';
import { resolveReport } from '@/services/report-service';

interface ReportDetailsModalProps {
  report: any; // We can type this strictly later
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminComment, setAdminComment] = useState('');

  if (!isOpen || !report) return null;

  const handleAction = async (action: 'Accept' | 'Reject') => {
    setIsSubmitting(true);
    try {
      await resolveReport(report.id, action, adminComment);
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2 font-serif-exam">
              <AlertCircle className="text-amber-500" size={20} />
              রিপোর্ট বিস্তারিত
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Reporter Info */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">
                  {report.reporter_name || 'Unknown User'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(report.created_at).toLocaleString('bn-BD')}
                </p>
              </div>
              <div className="ml-auto px-3 py-1 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold shadow-sm">
                ID: {report.reporter_id?.slice(0, 8)}...
              </div>
            </div>

            {/* Question Details */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
                প্রশ্ন ও সমস্যা
              </h4>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-500">
                    Question #{report.question_id}
                  </span>
                </div>
                {report.question ? (
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <p>{report.question.question}</p>
                  </div>
                ) : (
                  <p className="text-amber-500 text-sm">
                    প্রশ্নটি লোড করা যাচ্ছে না।
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 min-w-[100px]">
                    সমস্যার ধরণ:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 text-xs font-bold inline-flex items-center">
                    {report.reason}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 min-w-[100px]">
                    বিবরণ:
                  </span>
                  <p className="text-neutral-600 dark:text-neutral-400 flex-1 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    {report.description || 'কোনো বিবরণ নেই'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference Image */}
            {report.image_url && (
              <div className="mb-6">
                <h4 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
                  রেফারেন্স ছবি
                </h4>
                <div className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={report.image_url}
                    alt="Reference"
                    className="w-full h-auto max-h-[300px] object-contain bg-neutral-100 dark:bg-neutral-900"
                  />
                  <a
                    href={report.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-2 bg-white/90 text-neutral-900 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* Action Section */}
            {report.status === 'Pending' && (
              <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <div className="mb-4">
                  <label className="block text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                    অ্যাডমিন মন্তব্য (অপশনাল)
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="শিক্ষার্থীকে কোনো বার্তা দিতে চাইলে এখানে লিখুন..."
                    className="w-full h-20 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('Reject')}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-bold text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex justify-center items-center gap-2"
                  >
                    <XCircle size={18} />
                    বাতিল করুন
                  </button>
                  <button
                    onClick={() => handleAction('Accept')}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      'প্রসেসিং...'
                    ) : (
                      <>
                        <Check size={18} />
                        গ্রহণ করুন ও পুরস্কার দিন
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-neutral-400 mt-3">
                  * রিপোর্ট গ্রহণ করলে শিক্ষার্থী স্বয়ংক্রিয়ভাবে ১ দিনের
                  সাবস্ক্রিপশন বোনাস পাবে।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ReportDetailsModal;
