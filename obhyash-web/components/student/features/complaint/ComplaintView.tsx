'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle2,
  Cpu,
  Bug,
  HelpCircle,
  ShieldCheck,
  Send,
  LifeBuoy,
  ClipboardList,
  Inbox,
  Clock,
  RefreshCw,
  XCircle,
  FileQuestion,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitComplaint, getUserComplaints } from '@/services/complaint-service';
import { ComplaintType, AppComplaint, ComplaintStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface IssueCategory {
  id: ComplaintType;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    id: 'Technical',
    title: 'কারিগরি বা লোডিং সমস্যা',
    subtitle: 'স্লো লোডিং, অ্যাপ ক্র্যাশ বা নেটওয়ার্ক এরর',
    icon: Cpu,
  },
  {
    id: 'Bug',
    title: 'সিস্টেম বাগ বা ফাংশনাল ত্রুটি',
    subtitle: 'কোনো বাটন বা ফিচার ঠিকমতো কাজ করছে না',
    icon: Bug,
  },
  {
    id: 'UX',
    title: 'ইউআই বা ডিসপ্লে সমস্যা',
    subtitle: 'টেক্সট কেটে যাওয়া, ওভারফ্লো বা ডিজাইনে সমস্যা',
    icon: LayoutGrid,
  },
  {
    id: 'Other',
    title: 'অন্যান্য বা সাধারণ মতামত',
    subtitle: 'উপরের তালিকায় না থাকা যেকোনো সমস্যা',
    icon: HelpCircle,
  },
];

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  Pending: {
    label: 'অপেক্ষমাণ',
    color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
  },
  'In Progress': {
    label: 'প্রক্রিয়াধীন',
    color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    icon: RefreshCw,
  },
  Resolved: {
    label: 'সমাধান হয়েছে',
    color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  Dismissed: {
    label: 'বাতিল',
    color: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
    icon: XCircle,
  },
};

export const ComplaintView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [selectedType, setSelectedType] = useState<ComplaintType>('Technical');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // My Complaints State
  const [myComplaints, setMyComplaints] = useState<AppComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  useEffect(() => {
    if (activeTab !== 'my') return;

    let isMounted = true;
    const fetchMyComplaints = async () => {
      if (isMounted) setIsLoadingComplaints(true);
      const data = await getUserComplaints();
      if (isMounted) {
        setMyComplaints(data);
        setIsLoadingComplaints(false);
      }
    };

    void fetchMyComplaints();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 8) {
      toast.error('সমস্যাটি একটু বিস্তারিত লিখে জানাও');
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitComplaint(selectedType, description.trim());
      if (result.success) {
        setIsSuccess(true);
        toast.success('সাপোর্ট টিকেট সফলভাবে জমা নেওয়া হয়েছে!');
        setDescription('');
        setSelectedType('Technical');
      } else {
        toast.error(result.error || 'টিকেট পাঠাতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('টিকেট পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedType('Technical');
    setDescription('');
  };

  const filteredComplaints =
    filterStatus === 'all'
      ? myComplaints
      : myComplaints.filter((c) => c.status === filterStatus);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ── Sticky Support Navigation ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md py-2 -mx-4 px-4 flex justify-center">
        <div className="bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              activeTab === 'new'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
            অভিযোগ বা সমস্যা
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              activeTab === 'my'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <ClipboardList className="w-4 h-4" />
            আমার টিকেট {myComplaints.length > 0 && `(${myComplaints.length})`}
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        isSuccess ? (
          /* Success Screen */
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-md mx-auto space-y-5">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                সাপোর্ট টিকেট জমা সম্পন্ন হয়েছে!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1.5 text-sm">
                আমাদের টিম দ্রুত বিষয়টি পর্যালোচনা করে ব্যবস্থা নেবে এবং তুমি এখানে আপডেট দেখতে পাবে।
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm transition-colors"
              >
                আরেকটি টিকেট দাও
              </button>
              <button
                onClick={() => {
                  handleReset();
                  setActiveTab('my');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white text-sm transition-colors shadow-sm"
              >
                আমার টিকেট তালিকা
              </button>
            </div>
          </div>
        ) : (
          /* Support Ticket Form Area */
          <div className="space-y-6">
            {/* Support Desk Banner */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  অভ্যাস সাপোর্ট টিম সর্বদা পাশে আছে
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400/90 text-xs mt-0.5">
                  যেকোনো সমস্যা জানালে দ্রুত সমাধান প্রদান করা হবে।
                </p>
              </div>
            </div>

            {/* Issue Category Tiles */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                সমস্যার ধরন নির্বাচন করো
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ISSUE_CATEGORIES.map((cat) => {
                  const isSelected = selectedType === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedType(cat.id)}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 dark:text-white text-xs md:text-sm">
                          {cat.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {cat.subtitle}
                        </div>
                      </div>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-neutral-300 dark:border-neutral-600',
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Card */}
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-900 dark:text-white">
                  সমস্যার বিস্তারিত বিবরণ
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="সমস্যাটি কীভাবে ঘটেছে বা কোথায় হয়েছে তা বিস্তারিত লেখো (সম্ভব হলে পেজের নাম বা প্রশ্নের নম্বর উল্লেখ করো)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-neutral-400 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>টিকেট পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>সাপোর্ট টিকেট জমা দাও</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )
      ) : (
        /* My Tickets View */
        <div className="space-y-4">
          {isLoadingComplaints ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 text-center border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                কোনো সাপোর্ট টিকেট নেই
              </h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                অ্যাপে কোনো সমস্যার সম্মুখীন হলে নতুন টিকেট জমা দিতে পারো।
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
              >
                নতুন টিকেট তৈরি করো
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    filterStatus === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  সব ({myComplaints.length})
                </button>
                <button
                  onClick={() => setFilterStatus('Pending')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    filterStatus === 'Pending'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  অপেক্ষমাণ ({myComplaints.filter((c) => c.status === 'Pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('Resolved')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    filterStatus === 'Resolved'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  সমাধান ({myComplaints.filter((c) => c.status === 'Resolved').length})
                </button>
              </div>

              {/* Tickets Cards */}
              <div className="space-y-3">
                {filteredComplaints.map((comp) => {
                  const status = STATUS_CONFIG[comp.status] || {
                    label: 'অপেক্ষমাণ',
                    color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30',
                    icon: Clock,
                  };
                  const StatusIcon = status.icon;
                  const ticketCode = comp.id.slice(0, 6).toUpperCase();

                  return (
                    <div
                      key={comp.id}
                      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm"
                    >
                      {/* Ticket Top Header */}
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
                            #TKT-{ticketCode}
                          </span>
                          <span className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] px-2 py-0.5 rounded font-medium">
                            {comp.type}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-semibold shrink-0 flex items-center gap-1.5',
                            status.color,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      {/* Ticket Content */}
                      <div className="p-4 space-y-3">
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                          {comp.description}
                        </p>

                        {comp.admin_feedback && (
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3 rounded-lg text-xs space-y-1">
                            <strong className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              সাপোর্ট টিমের প্রতিক্রিয়া:
                            </strong>
                            <p className="text-emerald-700 dark:text-emerald-400">
                              {comp.admin_feedback}
                            </p>
                          </div>
                        )}

                        <div className="text-[11px] text-neutral-400 pt-1">
                          {new Date(comp.created_at).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
