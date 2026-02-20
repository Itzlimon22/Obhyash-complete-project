import React from 'react';
import { ExamDetails } from '@/lib/types';
import {
  Clock,
  HelpCircle,
  BookOpen,
  Award,
  AlertTriangle,
  ChevronRight,
  Play,
  XCircle,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

interface InstructionsViewProps {
  details: ExamDetails;
  onStart: () => void;
  onBack: () => void;
}

const InstructionsView: React.FC<InstructionsViewProps> = ({
  details,
  onStart,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 transition-colors animate-in fade-in duration-500">
      <div className="max-w-4xl w-full bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <BookOpen className="w-64 h-64 text-neutral-900 dark:text-white" />
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="relative bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 p-8 md:p-10">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
              পরীক্ষার নির্দেশাবলী
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 relative z-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {/* Subject */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  বিষয়
                </span>
              </div>
              <div
                className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white truncate"
                title={details.subjectLabel || details.subject}
              >
                {details.subjectLabel || details.subject}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  সময়
                </span>
              </div>
              <div className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                {details.durationMinutes} মিনিট
              </div>
            </div>

            {/* Questions */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  প্রশ্ন
                </span>
              </div>
              <div className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                {details.totalQuestions} টি
              </div>
            </div>

            {/* Marks */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  নম্বর
                </span>
              </div>
              <div className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                {details.totalMarks}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              নিয়মাবলী ও টিপস
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl shadow-sm h-fit text-emerald-500">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                    টাইমার শুরু
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    "পরীক্ষা শুরু করুন" বাটনে ক্লিক করার সাথে সাথে টাইমার গণনা
                    শুরু হবে।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl shadow-sm h-fit text-orange-500">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                    বুকমার্ক ফিচার
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    কঠিন প্রশ্নগুলো পরবর্তীতে দেখার জন্য আপনি বুকমার্ক করে রাখতে
                    পারেন।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl shadow-sm h-fit text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                    সতর্কতা
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    পরীক্ষা চলাকালীন রিফ্রেশ বা উইন্ডো বন্ধ করবেন না, এতে
                    প্রোগ্রেস হারাতে পারেন।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl shadow-sm h-fit text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                    সমাপ্তি
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    উত্তর দেওয়া শেষে "জমা দিন" ক্লিক করুন। সময় শেষ হলে অটোমেটিক
                    জমা হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-4 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all hover:shadow-sm text-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              ফিরে যান
            </button>
            <button
              onClick={onStart}
              className="w-full sm:w-auto flex-1 px-8 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 text-sm active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              সব প্রস্তুতি শেষ। শুরু করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsView;
