'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Settings,
  AlertCircle,
  Zap,
  Bug,
  Smile,
  Send,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Clock,
  CheckCheck,
  XCircle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';
import { submitComplaint, getComplaints } from '@/services/complaint-service';
import { ComplaintType, AppComplaint, ComplaintStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const COMPLAINT_TYPES = [
  {
    id: 'Technical' as ComplaintType,
    label: 'কারিগরি সমস্যা',
    subLabel: 'Technical Issue',
    icon: Zap,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'group-hover:border-blue-500',
    description: 'অ্যাপ ক্র্যাশ, লোডিং সমস্যা বা এরর',
  },
  {
    id: 'UX' as ComplaintType,
    label: 'ডিজাইন ও অভিজ্ঞতা',
    subLabel: 'UX / Design',
    icon: Smile,
    color:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'group-hover:border-purple-500',
    description: 'ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ',
  },
  {
    id: 'Bug' as ComplaintType,
    label: 'বাগ রিপোর্ট',
    subLabel: 'Bug Report',
    icon: Bug,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    borderColor: 'group-hover:border-rose-500',
    description: 'কোনো ফিচার ঠিকমতো কাজ করছে না',
  },
  {
    id: 'Feature Request' as ComplaintType,
    label: 'নতুন ফিচার আইডিয়া',
    subLabel: 'Feature Request',
    icon: AlertCircle,
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    borderColor: 'group-hover:border-amber-500',
    description: 'নতুন কোনো সুবিধা বা ফিচার চান?',
  },
];

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  Pending: {
    label: 'অপেক্ষমাণ',
    icon: Clock,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20',
  },
  'In Progress': {
    label: 'প্রক্রিয়াধীন',
    icon: RefreshCcw,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
  },
  Resolved: {
    label: 'সমাধান হয়েছে',
    icon: CheckCheck,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20',
  },
  Dismissed: {
    label: 'বাতিল',
    icon: XCircle,
    color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
  },
};

export const ComplaintView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
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
      const data = await getComplaints(false);
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

  const handleRefreshComplaints = async () => {
    setIsLoadingComplaints(true);
    const data = await getComplaints(false);
    setMyComplaints(data);
    setIsLoadingComplaints(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('অনুগ্রহ করে অভিযোগের ধরণ নির্বাচন করো');
      return;
    }
    if (description.length < 10) {
      toast.error('অনুগ্রহ করে বিস্তারিত লেখো (কমপক্ষে ১০ অক্ষর)');
      return;
    }
    if (description.length > 1000) {
      toast.error('অভিযোগ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে হতে হবে');
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitComplaint(selectedType, description);
      if (result.success) {
        setIsSuccess(true);
        toast.success('আপনার বার্তা আমরা পেয়েছি! ধন্যবাদ। 🚀');
      } else {
        // If result.success is false, it's an application-level error returned by the service
        toast.error(
          result.error || 'কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করো।',
        );
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedType(null);
    setDescription('');
  };

  // --- Render Success State ---
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="relative mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <div className="absolute inset-0 bg-emerald-400 opacity-20 rounded-full animate-ping"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white">
              বার্তা গৃহীত হয়েছে!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              আমাদের টিম বিষয়টি দেখছে। আপনার মতামতের জন্য ধন্যবাদ।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold transition-colors"
            >
              আরেকটি অভিযোগ করুন
            </button>
            <button
              onClick={() => {
                handleReset();
                setActiveTab('my');
              }}
              className="flex-1 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
            >
              আমার অভিযোগ দেখো
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all',
            activeTab === 'new'
              ? 'bg-white dark:bg-neutral-900 text-rose-600 shadow-md'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}
        >
          <Send size={16} />
          নতুন অভিযোগ
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all',
            activeTab === 'my'
              ? 'bg-white dark:bg-neutral-900 text-rose-600 shadow-md'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}
        >
          <ClipboardList size={16} />
          আমার অভিযোগ
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' ? (
        <>
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20">
            <div className="absolute top-0 right-0 p-12 opacity-10 transform rotate-12 pointer-events-none">
              <MessageSquare size={200} />
            </div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-2">
                <Settings size={12} className="animate-spin-slow" />
                ফিডব্যাক সেন্টার
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                কিছু বলতে চান? <br />
                <span className="text-indigo-200">আমরা শুনছি।</span>
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                &apos;অভ্যাস&apos; প্ল্যাটফর্মকে আরও উন্নত করতে আপনার মতামত বা
                অভিযোগ আমাদের জানান।
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Category Selection */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    ১. অভিযোগের ধরণ নির্বাচন করো
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {COMPLAINT_TYPES.map((type) => {
                      const isSelected = selectedType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={cn(
                            'group relative p-5 rounded-2xl text-left transition-all duration-300 border-2',
                            isSelected
                              ? 'border-rose-500 bg-white dark:bg-neutral-800 shadow-xl shadow-rose-500/10 scale-[1.02]'
                              : 'border-transparent bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm hover:shadow-md',
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                'p-3 rounded-xl shrink-0 transition-colors',
                                type.color,
                              )}
                            >
                              <type.icon size={24} />
                            </div>
                            <div>
                              <h4
                                className={cn(
                                  'font-bold text-base transition-colors',
                                  isSelected
                                    ? 'text-rose-600'
                                    : 'text-neutral-900 dark:text-white',
                                )}
                              >
                                {type.label}
                              </h4>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                {type.subLabel}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                {type.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-4 right-4 text-rose-500 animate-in zoom-in">
                              <CheckCircle2
                                size={20}
                                fill="currentColor"
                                className="text-white"
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    ২. বিস্তারিত লেখো
                  </h3>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-3xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur-lg"></div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="আপনার সমস্যা বা পরামর্শ সম্পর্কে বিস্তারিত লেখো..."
                      className="relative w-full min-h-[200px] p-6 rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-base leading-relaxed focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 transition-all resize-none shadow-sm placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full sm:w-auto overflow-hidden bg-neutral-900 dark:bg-rose-600 text-white font-bold py-4 px-10 rounded-xl shadow-xl shadow-neutral-900/10 hover:shadow-neutral-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>জমা দাও</span>
                          <Send
                            size={18}
                            className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                          />
                        </>
                      )}
                    </div>
                  </button>
                  <p className="mt-4 text-sm text-neutral-400">
                    আপনার ফিডব্যাক আমাদের জন্য অত্যন্ত গুরুত্বপূর্ণ ❤️
                  </p>
                </div>
              </form>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-6 border border-rose-100 dark:border-rose-800/20">
                <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2">
                  <AlertCircle size={18} />
                  জরুরী প্রয়োজনে
                </h4>
                <p className="text-sm text-rose-600/80 dark:text-rose-400/80 leading-relaxed mb-4">
                  আপনার যদি একাউন্ট সম্পর্কিত কোনো জটিল সমস্যা থাকে অথবা পেমেন্ট
                  সংক্রান্ত কোনো বিষয় থাকে, তবে সরাসরি আমাদের মেইল করতে পারেন।
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 p-3 rounded-xl border border-rose-100 dark:border-neutral-700">
                  ✉️ support@obhyash.com
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* My Complaints Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              আমার অভিযোগসমূহ
            </h2>
            <button
              onClick={handleRefreshComplaints}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-bold transition-colors"
            >
              <RefreshCcw
                size={16}
                className={isLoadingComplaints ? 'animate-spin' : ''}
              />
              রিফ্রেশ
            </button>
          </div>

          {isLoadingComplaints ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-rose-500" size={40} />
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800">
              <ClipboardList
                size={64}
                className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4"
              />
              <h3 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                কোনো অভিযোগ নেই
              </h3>
              <p className="text-neutral-500">
                আপনি এখনো কোনো অভিযোগ বা পরামর্শ জমা দেননি।
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-6 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
              >
                নতুন অভিযোগ করুন
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myComplaints.map((complaint) => {
                const statusInfo = STATUS_CONFIG[complaint.status];
                const StatusIcon = statusInfo.icon;
                const typeInfo = COMPLAINT_TYPES.find(
                  (t) => t.id === complaint.type,
                );

                return (
                  <div
                    key={complaint.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            typeInfo?.color ||
                              'bg-neutral-100 text-neutral-500',
                          )}
                        >
                          {typeInfo?.icon ? (
                            <typeInfo.icon size={18} />
                          ) : (
                            <MessageSquare size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {typeInfo?.label || complaint.type}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {new Date(complaint.created_at).toLocaleDateString(
                              'bn-BD',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold',
                          statusInfo.color,
                        )}
                      >
                        <StatusIcon size={14} />
                        {statusInfo.label}
                      </div>
                    </div>

                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-3">
                      {complaint.description}
                    </p>

                    {complaint.admin_feedback && (
                      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/20">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                          <CheckCheck size={14} />
                          অ্যাডমিন এর মন্তব্য
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 leading-relaxed">
                          {complaint.admin_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
