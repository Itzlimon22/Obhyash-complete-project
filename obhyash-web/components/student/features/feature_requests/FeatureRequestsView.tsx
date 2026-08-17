'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Clock,
  CheckCheck,
  XCircle,
  RefreshCcw,
  BookOpen,
  Zap,
  BarChart3,
  Palette,
  Layers,
  Compass,
  Flame,
  Volume2,
  Smartphone,
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

const CATEGORIES = [
  {
    id: 'Exam & Practice' as FeatureCategory,
    label: 'এক্সাম ও প্র্যাকটিস',
    subLabel: 'Exam & Practice Mode',
    icon: Zap,
    color:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    description: 'নতুন এক্সাম ফরম্যাট, টাইমার বা প্র্যাকটিস টুলস',
  },
  {
    id: 'Analytics & Tracking' as FeatureCategory,
    label: 'অ্যানালিটিক্স ও ট্র্যাকিং',
    subLabel: 'Analytics & Insights',
    icon: BarChart3,
    color:
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'স্কোর গ্রাফ, দুর্বলতা ট্র্যাকিং ও প্রগ্রেস রিপোর্ট',
  },
  {
    id: 'Study Tools' as FeatureCategory,
    label: 'স্টাডি টুলস ও মোড',
    subLabel: 'Smart Study Tools',
    icon: BookOpen,
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'ফ্ল্যাশকার্ড, ফর্মুলা শিট বা নোট নেওয়ার সুবিধা',
  },
  {
    id: 'UI & Theme' as FeatureCategory,
    label: 'ইন্টারফেস ও থিম',
    subLabel: 'UI & Customization',
    icon: Palette,
    color:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'ডিজাইন পরিবর্তন, ফন্ট সাইজ বা কাস্টম কালার থিম',
  },
  {
    id: 'Other' as FeatureCategory,
    label: 'অন্যান্য আইডিয়া',
    subLabel: 'Other Cool Ideas',
    icon: Layers,
    color:
      'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    description: 'তোমার মাথায় থাকা যেকোনো দারুণ নতুন আইডিয়া',
  },
];

const STATUS_CONFIG: Record<
  FeatureRequestStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  'Under Review': {
    label: 'বিবেচনাধীন',
    icon: Clock,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  },
  Planned: {
    label: 'পরিকল্পিত',
    icon: Compass,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  'In Progress': {
    label: 'কাজ চলছে',
    icon: RefreshCcw,
    color:
      'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  Completed: {
    label: 'যুক্ত হয়েছে',
    icon: CheckCheck,
    color:
      'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  Declined: {
    label: 'বাতিল',
    icon: XCircle,
    color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

const UPCOMING_ROADMAP = [
  {
    title: 'AI স্মার্ট ব্যাখ্যা ও দুর্বলতা বিশ্লেষণ',
    category: 'AI Powered',
    status: 'কাজ চলছে',
    statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Sparkles,
    description: 'প্রতিটি ভুল উত্তরের জন্য এআই ভিত্তিক স্টেপ-বাই-স্টেপ সমাধান ও ব্যক্তিগত গাইডেন্স।',
  },
  {
    title: 'লাইভ ১v১ কুইজ ব্যাটল ও মাল্টিপ্লেয়ার',
    category: 'Gamification',
    status: 'পরিকল্পিত',
    statusColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Flame,
    description: 'বন্ধুদের সাথে সরাসরি রিয়েল-টাইমে লাইভ চ্যালেঞ্জ এবং দ্রুত উত্তর দেওয়ার প্রতিযোগিতা।',
  },
  {
    title: 'অফলাইন রিভিশন মোড',
    category: 'Offline Tool',
    status: 'পরিকল্পিত',
    statusColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Smartphone,
    description: 'ইন্টারনেট কানেকশন ছাড়াই সেভ করা প্র্যাকটিস সেট ও বুকমার্কড প্রশ্ন ঝালাইয়ের সুবিধা।',
  },
  {
    title: 'অডিও ব্যাখ্যা ও পডকাস্ট লার্নিং',
    category: 'Audio Prep',
    status: 'বিবেচনাধীন',
    statusColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Volume2,
    description: 'চলাফেরার সময় বা বিশ্রামের সময় সহজে শোনার মাধ্যমে কঠিন টপিক রিভিশন।',
  },
];

export const FeatureRequestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [selectedCategory, setSelectedCategory] =
    useState<FeatureCategory | null>(null);
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

  const handleRefresh = async () => {
    setIsLoadingRequests(true);
    const data = await getUserFeatureRequests();
    setMyRequests(data);
    setIsLoadingRequests(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      toast.error('অনুগ্রহ করে ফিচারের ক্যাটাগরি নির্বাচন করো');
      return;
    }
    if (title.trim().length < 4) {
      toast.error('ফিচারের একটি সংক্ষিপ্ত শিরোনাম লেখো (কমপক্ষে ৪ অক্ষর)');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('অনুগ্রহ করে ফিচারের বিস্তারিত বিবরণ লেখো (কমপক্ষে ১০ অক্ষর)');
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
        toast.success('তোমার চমৎকার প্রস্তাবের জন্য ধন্যবাদ! 🚀');
        setTitle('');
        setDescription('');
        setSelectedCategory(null);
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
    setSelectedCategory(null);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* ── Segmented Navigation ── */}
      <div className="flex justify-center">
        <div className="bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl flex items-center gap-1 border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeTab === 'new'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <Sparkles className="w-4 h-4" />
            নতুন ফিচার প্রস্তাব
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeTab === 'my'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <ClipboardList className="w-4 h-4" />
            আমার প্রস্তাবসমূহ {myRequests.length > 0 && `(${myRequests.length})`}
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        isSuccess ? (
          /* Success Screen */
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
                প্রস্তাব গৃহীত হয়েছে!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm">
                আমাদের টিম তোমার প্রস্তাবটি বিবেচনা করছে। ‘অভ্যাস’ কে সেরা প্ল্যাটফর্ম বানাতে তোমার প্রতিটি আইডিয়া অনেক মূল্যবান।
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm transition-colors"
              >
                আরেকটি প্রস্তাব দাও
              </button>
              <button
                onClick={() => {
                  handleReset();
                  setActiveTab('my');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-sm transition-colors shadow-sm"
              >
                আমার তালিকা দেখো
              </button>
            </div>
          </div>
        ) : (
          /* Form Area */
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-8 shadow-lg shadow-emerald-900/10 relative overflow-hidden">
              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-emerald-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  ফিচার রিকোয়েস্ট ও আইডিয়া বক্স
                </div>
                <h1 className="text-3xl font-black tracking-tight leading-tight">
                  কিছু নতুন দেখতে চাও?<br />আমরা শুনছি।
                </h1>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                  তোমার পড়াশোনাকে আরও আনন্দদায়ক ও কার্যকর করতে কী কী ফিচার যুক্ত করলে ভালো হয়? তোমার আইডিয়া শেয়ার করো!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category Picker */}
              <div className="space-y-4">
                <label className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>১. ফিচারের ক্যাটাগরি নির্বাচন করো</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700',
                        )}
                      >
                        <div
                          className={cn(
                            'p-3 rounded-xl flex-shrink-0',
                            cat.color,
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className={cn(
                                'font-bold text-sm md:text-base',
                                isSelected
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-neutral-900 dark:text-white',
                              )}
                            >
                              {cat.label}
                            </h3>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-lg font-bold text-neutral-900 dark:text-white">
                  ২. ফিচারের শিরোনাম
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ডার্ক মোডে কাস্টম ফন্ট সাইজ বা বুকমার্ক ফিল্টার..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-lg font-bold text-neutral-900 dark:text-white">
                  ৩. বিস্তারিত বিবরণ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="ফিচারটি কীভাবে কাজ করবে এবং এটি কেন দরকার তা সংক্ষেপে বর্ণনা করো (কমপক্ষে ১০ অক্ষর)..."
                  className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    প্রস্তাব জমা দাও
                  </>
                )}
              </button>
            </form>
          </div>
        )
      ) : (
        /* My Requests List */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              তোমার পাঠানো প্রস্তাবসমূহ
            </h2>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RefreshCcw
                className={cn('w-4 h-4', isLoadingRequests && 'animate-spin')}
              />
            </button>
          </div>

          {isLoadingRequests ? (
            <div className="py-20 text-center text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  কোনো ফিচার প্রস্তাব জমা নেই
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  তোমার মাথায় কোনো আইডিয়া থাকলে এখনই সাবমিট করতে পারো।
                </p>
              </div>
              <button
                onClick={() => setActiveTab('new')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                নতুন প্রস্তাব পাঠাও
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {myRequests.map((req) => {
                const statusInfo =
                  STATUS_CONFIG[req.status] || STATUS_CONFIG['Under Review'];
                const StatusIcon = statusInfo.icon;
                const catInfo = CATEGORIES.find((c) => c.id === req.category);

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full">
                            {catInfo?.label || req.category}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {new Date(req.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1.5">
                          {req.title}
                        </h3>
                      </div>
                      <div
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 flex-shrink-0',
                          statusInfo.color,
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </div>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {req.description}
                    </p>

                    {req.admin_feedback && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          অ্যাডমিন মতামত:
                        </div>
                        <p>{req.admin_feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Upcoming Roadmap Section (Bottom Section) ── */}
      <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              আমাদের পরিকল্পনা
            </div>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
              ভবিষ্যতের আসন্ন ফিচারসমূহ (Upcoming Features)
            </h2>
            <p className="text-neutral-500 text-sm mt-0.5">
              তোমাদের প্রস্তুতির অভিজ্ঞতাকে অনন্য করতে যে ফিচারগুলোর উপর আমরা দ্রুত কাজ করছি
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UPCOMING_ROADMAP.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      item.statusColor,
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
