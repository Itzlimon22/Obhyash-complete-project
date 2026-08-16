'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  FileQuestion,
  AlertTriangle,
  Radio,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface ActionAlertsProps {
  pendingQuestions: number;
  pendingReports: number;
  pendingComplaints: number;
  activeLiveExams: number;
}

export function ActionAlertsHub({
  pendingQuestions = 0,
  pendingReports = 0,
  pendingComplaints = 0,
  activeLiveExams = 0,
}: ActionAlertsProps) {
  const alerts = [
    {
      title: 'টিচারদের পাঠানো নতুন প্রশ্ন অনুমোদন',
      count: pendingQuestions,
      desc: 'নতুন প্রশ্নগুলো রিভিউ করে ভেরিফাই ও পাবলিশ করুন',
      icon: FileQuestion,
      color: 'amber',
      href: '/admin/question-management',
      show: pendingQuestions > 0,
    },
    {
      title: 'শিক্ষার্থীদের প্রশ্নের ভুল রিপোর্ট',
      count: pendingReports,
      desc: 'শিক্ষার্থীদের রিপোর্টেড প্রশ্নের উত্তর ও ব্যাখ্যা সংশোধন করুন',
      icon: AlertTriangle,
      color: 'rose',
      href: '/admin/reports',
      show: pendingReports > 0,
    },
    {
      title: 'শিক্ষার্থী অভিযোগ ও সহায়তা টিকিট',
      count: pendingComplaints,
      desc: 'অমীমাংসিত সহায়তা বার্তা ও অভিযোগ দ্রুত সমাধান করুন',
      icon: MessageSquare,
      color: 'blue',
      href: '/admin/complaints',
      show: pendingComplaints > 0,
    },
    {
      title: 'লাইভ পরীক্ষা চলমান রয়েছে',
      count: activeLiveExams,
      desc: 'রিয়েল-টাইম লিডারবোর্ড ও পরীক্ষার্থীদের মনিটর করুন',
      icon: Radio,
      color: 'emerald',
      href: '/admin/live-exams',
      show: activeLiveExams > 0,
    },
  ].filter((a) => a.show);

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              সকল জরুরি অ্যাকশন সম্পন্ন! (All Clear)
            </h4>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              কোনো পেন্ডিং প্রশ্ন, অভিযোগ বা অমীমাংসিত রিপোর্ট নেই।
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          ১০০% রেজলভড
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-amber-500" />
          <span>অ্যাকশন আবশ্যক হাব (Action Required - {alerts.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {alerts.map((alert, idx) => {
          const Icon = alert.icon;
          return (
            <Link
              key={idx}
              href={alert.href}
              className="p-4 rounded-xl border bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      alert.color === 'rose'
                        ? 'bg-rose-500/10 text-rose-500'
                        : alert.color === 'amber'
                          ? 'bg-amber-500/10 text-amber-500'
                          : alert.color === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${
                      alert.color === 'rose'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : alert.color === 'amber'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {alert.count} Pending
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                  {alert.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-zinc-800/50 flex items-center justify-between text-[11px] font-bold text-neutral-400 group-hover:text-emerald-600 transition-colors">
                <span>সমাধান করুন</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
