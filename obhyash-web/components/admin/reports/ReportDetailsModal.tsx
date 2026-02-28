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
import Portal from '@/components/ui/portal';
import { resolveReport } from '@/services/report-service';
import { Report, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/services/user-service';

interface ReportDetailsModalProps {
  report: Report;
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
  const [reporterProfile, setReporterProfile] = useState<UserProfile | null>(
    null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  React.useEffect(() => {
    if (isOpen && report?.reporter_id) {
      const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const profile = await getUserProfile(report.reporter_id as string);
          setReporterProfile(profile);
        } catch (error) {
          console.error('Error fetching reporter profile:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, report?.reporter_id]);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('bn-BD');
    } catch {
      return dateString;
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-black w-full max-w-2xl rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              রিপোর্ট বিস্তারিত
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/50 dark:text-white/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Reporter Info */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0"
                  style={{
                    backgroundColor: reporterProfile?.avatarColor || '#065f46',
                  }}
                >
                  {reporterProfile?.avatarUrl ? (
                    <img
                      src={reporterProfile.avatarUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={22} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-black text-black dark:text-white truncate">
                      {reporterProfile?.name || report.reporter_name}
                    </p>
                    {report.reporter_id && (
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px] font-bold text-black/40 dark:text-white/40 border border-black/5 dark:border-white/5 tabular-nums">
                        ID: {report.reporter_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    <p className="text-[11px] text-black/50 dark:text-white/50 flex items-center gap-1 font-bold">
                      <Calendar size={12} className="shrink-0" />
                      {formatDate(report.created_at)}
                    </p>
                    {reporterProfile?.email && (
                      <p className="text-[11px] text-black/50 dark:text-white/50 flex items-center gap-1 font-bold">
                        <MessageSquare size={12} className="shrink-0" />
                        {reporterProfile.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {reporterProfile?.phone && (
                <div className="sm:pl-4 sm:border-l border-emerald-200 dark:border-emerald-800 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600/50 dark:text-emerald-400/50 mb-0.5">
                    Phone
                  </p>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {reporterProfile.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Question Details */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">
                প্রশ্ন ও সমস্যা
              </h4>
              <div className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest">
                    Question #{String(report.question_id).slice(0, 8)}
                  </span>
                </div>
                {report.question ? (
                  <p className="text-sm text-black dark:text-white font-medium leading-relaxed">
                    {report.question.question}
                  </p>
                ) : (
                  <p className="text-red-500 text-sm font-bold">
                    প্রশ্নটি লোড করা যাচ্ছে না।
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 text-sm items-center">
                  <span className="font-black text-black/60 dark:text-white/60 uppercase tracking-wide text-xs min-w-[100px]">
                    সমস্যার ধরণ
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-black inline-flex items-center">
                    {report.reason}
                  </span>
                </div>
                {report.description && (
                  <div className="flex gap-2 text-sm">
                    <span className="font-black text-black/60 dark:text-white/60 uppercase tracking-wide text-xs min-w-[100px] mt-1">
                      বিবরণ
                    </span>
                    <div className="w-full flex-1 flex items-start gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-black/5 dark:border-white/5">
                      <MessageSquare
                        size={14}
                        className="text-black/30 dark:text-white/30 mt-0.5 shrink-0"
                      />
                      <p className="text-black/80 dark:text-white/80 text-sm">
                        {report.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Image */}
            {report.image_url && (
              <div className="mb-6">
                <h4 className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ExternalLink size={14} />
                  রেফারেন্স ছবি
                </h4>
                <div className="relative group rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 min-h-[100px] flex items-center justify-center">
                  <img
                    src={report.image_url}
                    alt="Reference"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/600x400?text=Image+Not+Found';
                    }}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 bg-black/60 rounded-full backdrop-blur-md">
                      ট্যাপ করে বড় করে দেখো
                    </span>
                  </div>
                  <a
                    href={report.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/80 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* Action Section */}
            {report.status === 'Pending' && (
              <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="mb-4">
                  <label className="block text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2">
                    অ্যাডমিন মন্তব্য (অপশনাল)
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="শিক্ষার্থীকে কোনো বার্তা দিতে চাইলে এখানে লেখো..."
                    className="w-full h-20 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm focus:outline-none focus:border-emerald-700 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('Reject')}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-black text-red-600 dark:text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex justify-center items-center gap-2 uppercase tracking-wider text-sm"
                  >
                    <XCircle size={18} />
                    বাতিল
                  </button>
                  <button
                    onClick={() => handleAction('Accept')}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 uppercase tracking-wider text-sm"
                  >
                    {isSubmitting ? (
                      'প্রসেসিং...'
                    ) : (
                      <>
                        <Check size={18} />
                        গ্রহণ করো ও পুরস্কার দাও
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-black/40 dark:text-white/40 font-bold mt-3 uppercase tracking-wide">
                  * রিপোর্ট গ্রহণ করলে শিক্ষার্থী স্বয়ংক্রিয়ভাবে ১ দিনের
                  সাবস্ক্রিপশন বোনাস পাবে।
                </p>
              </div>
            )}

            {/* Resolved/Ignored state display */}
            {report.status !== 'Pending' && (
              <div className="mt-6 p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  {report.status === 'Resolved' ? (
                    <Check size={16} className="text-emerald-700" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  <span className="font-black text-sm text-black dark:text-white uppercase tracking-wide">
                    {report.status === 'Resolved'
                      ? 'সমাধান হয়েছে'
                      : 'উপেক্ষা করা হয়েছে'}
                  </span>
                </div>
                {report.admin_comment && (
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {report.admin_comment}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ReportDetailsModal;
