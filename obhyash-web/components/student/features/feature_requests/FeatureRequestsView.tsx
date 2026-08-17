'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  submitFeatureRequest,
  getUserFeatureRequests,
} from '@/services/feature-request-service';
import {
  FeatureCategory,
  AppFeatureRequest,
  FeatureRequestStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORIES: { id: FeatureCategory; label: string }[] = [
  { id: 'Exam & Practice', label: 'এক্সাম ও প্র্যাকটিস' },
  { id: 'Analytics & Tracking', label: 'অ্যানালিটিক্স' },
  { id: 'Study Tools', label: 'স্টাডি টুলস' },
  { id: 'UI & Theme', label: 'ইউআই ও ডিজাইন' },
  { id: 'Other', label: 'অন্যান্য' },
];

const STATUS_CONFIG: Record<
  FeatureRequestStatus,
  { label: string; color: string }
> = {
  'Under Review': {
    label: 'বিবেচনাধীন',
    color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  },
  Planned: {
    label: 'পরিকল্পিত',
    color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  'In Progress': {
    label: 'কাজ চলছে',
    color: 'text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
  Completed: {
    label: 'যুক্ত হয়েছে',
    color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  Declined: {
    label: 'বাতিল',
    color: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

const UPCOMING_ROADMAP = [
  {
    title: 'AI স্মার্ট ব্যাখ্যা ও দুর্বলতা বিশ্লেষণ',
    status: 'কাজ চলছে',
    statusClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'ভুল উত্তরের জন্য এআই ভিত্তিক তাৎক্ষণিক ব্যাখ্যা ও কনসেপ্ট রিভিশন গাইড।',
  },
  {
    title: 'লাইভ কুইজ ব্যাটল',
    status: 'পরিকল্পিত',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'বন্ধুদের সাথে রিয়েল-টাইমে প্রতিযোগিতামূলক লাইভ কুইজ খেলার সুবিধা।',
  },
  {
    title: 'অফলাইন রিভিশন মোড',
    status: 'পরিকল্পিত',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'ইন্টারনেট ছাড়াই সেভ করা প্র্যাকটিস সেট ও বুকমার্ক করা প্রশ্ন রিভিশন।',
  },
  {
    title: 'অডিও ব্যাখ্যা ও পডকাস্ট লার্নিং',
    status: 'বিবেচনাধীন',
    statusClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'চলাফেরার সময় বা বিশ্রামে শোনার মাধ্যমে কঠিন টপিক রিভিশন।',
  },
];

export const FeatureRequestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [selectedCategory, setSelectedCategory] =
    useState<FeatureCategory>('Exam & Practice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // My Requests State
  const [myRequests, setMyRequests] = useState<AppFeatureRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    if (activeTab !== 'my') return;

    let isMounted = true;
    const fetchMyRequests = async () => {
      if (isMounted) setIsLoadingRequests(true);
      const data = await getUserFeatureRequests();
      if (isMounted) {
        setMyRequests(data);
        setIsLoadingRequests(false);
      }
    };

    void fetchMyRequests();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error('ফিচারের একটি সংক্ষিপ্ত শিরোনাম লেখো');
      return;
    }
    if (description.trim().length < 8) {
      toast.error('ফিচারটির বিবরণ একটু বিস্তারিত লেখো');
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitFeatureRequest(
        selectedCategory,
        title,
        description,
      );
      if (result.success) {
        setIsSuccess(true);
        toast.success('ফিচারের প্রস্তাব সফলভাবে জমা দেওয়া হয়েছে!');
        setTitle('');
        setDescription('');
        setSelectedCategory('Exam & Practice');
      } else {
        toast.error(result.error || 'প্রস্তাব পাঠাতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast.error('প্রস্তাব পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedCategory('Exam & Practice');
    setTitle('');
    setDescription('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ── Sticky Segmented Navigation ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md py-2 -mx-4 px-4 flex justify-center">
        <div className="bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'new'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            নতুন প্রস্তাব
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'my'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            আমার প্রস্তাব {myRequests.length > 0 && `(${myRequests.length})`}
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
                প্রস্তাব সফলভাবে জমা হয়েছে!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1.5 text-sm">
                আমাদের টিম তোমার আইডিয়াটি পর্যালোচনা করে অ্যাপে যুক্ত করার ব্যবস্থা করবে।
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm transition-colors"
              >
                আরেকটি প্রস্তাব দাও
              </button>
              <button
                onClick={() => {
                  handleReset();
                  setActiveTab('my');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white text-sm transition-colors shadow-sm"
              >
                আমার তালিকা
              </button>
            </div>
          </div>
        ) : (
          /* Form Area & Roadmap */
          <div className="space-y-8">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                  অ্যাপে নতুন কী দেখতে চাও?
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                  তোমার আইডিয়া বা ফিচারের প্রস্তাব আমাদের সাথে শেয়ার করো।
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Picker */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    ক্যাটাগরি নির্বাচন করো
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            'px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium border transition-all',
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300',
                          )}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    ফিচারের নাম / সংক্ষিপ্ত বিবরণ
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: ওএমআর শীটে ভুল উত্তর দ্রুত রিভিউর সুবিধা"
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-neutral-400"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    বিস্তারিত বিবরণ
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ফিচারটি কীভাবে কাজ করবে এবং এটি কেন দরকার তা লেখো..."
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-neutral-400 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <span>প্রস্তাব জমা দাও</span>
                  )}
                </button>
              </form>
            </div>

            {/* ── Upcoming Features (Roadmap) ── */}
            <div className="space-y-3 pt-2">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  আসন্ন ফিচারসমূহ
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  যেসব নতুন ফিচার নিয়ে আমরা কাজ করছি:
                </p>
              </div>

              <div className="space-y-2.5">
                {UPCOMING_ROADMAP.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold shrink-0',
                        item.statusClass,
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        /* My Requests List (Isolated, No Roadmap) */
        <div className="space-y-4">
          {isLoadingRequests ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 text-center border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                কোনো প্রস্তাব পাওয়া যায়নি
              </h3>
              <p className="text-neutral-500 text-sm mt-1">
                তোমার কোনো ফিচারের আইডিয়া থাকলে তা লিখে আমাদের জানাতে পারো।
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-4 px-4 py-2 rounded-lg border border-emerald-600 text-emerald-600 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                নতুন প্রস্তাব দাও
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const status = STATUS_CONFIG[req.status] || {
                  label: 'বিবেচনাধীন',
                  color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30',
                };

                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                        {req.title}
                      </h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded text-xs font-semibold shrink-0',
                          status.color,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                      {req.description}
                    </p>

                    {req.admin_feedback && (
                      <div className="bg-neutral-50 dark:bg-neutral-800/80 p-3 rounded-lg text-xs text-neutral-700 dark:text-neutral-300">
                        <strong className="text-neutral-900 dark:text-white">
                          এডমিন ফিডব্যাক:{' '}
                        </strong>
                        {req.admin_feedback}
                      </div>
                    )}

                    <div className="text-xs text-neutral-400 pt-1">
                      {req.category} • {new Date(req.created_at).toLocaleDateString('bn-BD')}
                    </div>
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
