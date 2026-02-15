import React, { useEffect, useState } from 'react';
import { getUserReports } from '@/services/report-service';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface StudentReportViewProps {
  user: UserProfile;
}

const StudentReportView: React.FC<StudentReportViewProps> = ({ user }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (user?.id) {
        setLoading(true);
        const data = await getUserReports(user.id);
        setReports(data || []);
        setLoading(false);
      }
    };
    fetchReports();
  }, [user?.id]);

  const toggleExpand = (id: string) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock size={12} /> অপেক্ষমান
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} /> গৃহীত
          </span>
        );
      case 'Ignored':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle size={12} /> বাতিল
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-500">রিপোর্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-serif-exam">
          আমার রিপোর্টসমূহ
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          আপনার পাঠানো সব রিপোর্ট এবং তাদের বর্তমান অবস্থা এখানে দেখতে পাবেন।
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            কোনো রিপোর্ট পাওয়া যায়নি
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            আপনি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করেননি।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              {/* Card Header */}
              <div
                className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-900"
                onClick={() => toggleExpand(report.id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700 shadow-sm text-neutral-500">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        প্রশ্ন #{report.question_id}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-1">
                      কারণ: {report.reason}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(report.created_at).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1">
                  {expandedReport === report.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedReport === report.id && (
                <div className="p-4 md:p-6 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                          আপনার মন্তব্য
                        </h4>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-100 dark:border-neutral-700">
                          {report.description || 'কোনো বিবরণ নেই'}
                        </p>
                      </div>

                      {report.question && (
                        <div>
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            প্রশ্ন
                          </h4>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {report.question.question}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {report.image_url && (
                        <div>
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            রেফারেন্স ছবি
                          </h4>
                          <a
                            href={report.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700"
                          >
                            <img
                              src={report.image_url}
                              alt="Reference"
                              className="w-full h-32 object-cover bg-neutral-100 dark:bg-neutral-800"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ExternalLink className="text-white" size={20} />
                            </div>
                          </a>
                        </div>
                      )}

                      {report.admin_comment && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle size={14} /> অ্যাডমিন ফিডব্যাক
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {report.admin_comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentReportView;
