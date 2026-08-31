'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Clock,
  Send,
  Inbox,
  AlertCircle,
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
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

interface CategoryItem {
  id: FeatureCategory;
  label: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'Exam & Practice', label: 'এক্সাম ও প্র্যাকটিস' },
  { id: 'Analytics & Tracking', label: 'অ্যানালিটিক্স' },
  { id: 'Study Tools', label: 'স্টাডি টুলস' },
  { id: 'UI & Theme', label: 'ইউআই ও ডিজাইন' },
  { id: 'Other', label: 'অন্যান্য' },
];

interface StatusConfig {
  label: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
}

const STATUS_MAP: Record<FeatureRequestStatus, StatusConfig> = {
  'Under Review': {
    label: 'বিবেচনাধীন',
    bgLight: 'bg-[#FEF3C7]',
    bgDark: 'dark:bg-[#B45309]/20',
    textLight: 'text-[#B45309]',
    textDark: 'dark:text-[#FCD34D]',
  },
  Planned: {
    label: 'পরিকল্পিত',
    bgLight: 'bg-[#DBEAFE]',
    bgDark: 'dark:bg-[#1D4ED8]/20',
    textLight: 'text-[#1D4ED8]',
    textDark: 'dark:text-[#93C5FD]',
  },
  'In Progress': {
    label: 'কাজ চলছে',
    bgLight: 'bg-[#EDE9FE]',
    bgDark: 'dark:bg-[#6D28D9]/20',
    textLight: 'text-[#6D28D9]',
    textDark: 'dark:text-[#C4B5FD]',
  },
  Completed: {
    label: 'যুক্ত হয়েছে',
    bgLight: 'bg-[#DCFCE7]',
    bgDark: 'dark:bg-[#15803D]/20',
    textLight: 'text-[#15803D]',
    textDark: 'dark:text-[#86EFAC]',
  },
  Declined: {
    label: 'বাতিল',
    bgLight: 'bg-[#F3F4F6]',
    bgDark: 'dark:bg-[#4B5563]/20',
    textLight: 'text-[#4B5563]',
    textDark: 'dark:text-[#9CA3AF]',
  },
};

const UPCOMING_ROADMAP = [
  {
    title: 'AI স্মার্ট ব্যাখ্যা ও দুর্বলতা বিশ্লেষণ',
    status: 'কাজ চলছে',
    statusType: 'In Progress' as FeatureRequestStatus,
    description:
      'ভুল উত্তরের জন্য এআই ভিত্তিক তাৎক্ষণিক ব্যাখ্যা ও কনসেপ্ট রিভিশন গাইড।',
  },
  {
    title: 'লাইভ কুইজ ব্যাটল',
    status: 'পরিকল্পিত',
    statusType: 'Planned' as FeatureRequestStatus,
    description:
      'বন্ধুদের সাথে রিয়েল-টাইমে প্রতিযোগিতামূলক লাইভ কুইজ খেলার সুবিধা।',
  },
  {
    title: 'অফলাইন রিভিশন মোড',
    status: 'পরিকল্পিত',
    statusType: 'Planned' as FeatureRequestStatus,
    description:
      'ইন্টারনেট ছাড়াই সেভ করা প্র্যাকটিস সেট ও বুকমার্ক করা প্রশ্ন রিভিশন।',
  },
  {
    title: 'অডিও ব্যাখ্যা ও পডকাস্ট লার্নিং',
    status: 'বিবেচনাধীন',
    statusType: 'Under Review' as FeatureRequestStatus,
    description: 'চলাফেরার সময় বা বিশ্রামে শোনার মাধ্যমে কঠিন টপিক রিভিশন।',
  },
];

export const FeatureRequestsView: React.FC = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<0 | 1>(0); // 0 = New Request, 1 = My Requests
  const [selectedCategory, setSelectedCategory] =
    useState<FeatureCategory>('Exam & Practice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [myRequests, setMyRequests] = useState<AppFeatureRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const data = await getUserFeatureRequests();
      setMyRequests(data);
    } catch (err) {
      console.error('[FeatureRequestsView] Error fetching requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 2) {
      toast.warning('ফিচারের একটি সংক্ষিপ্ত শিরোনাম লেখো (কমপক্ষে ২ অক্ষর)');
      return;
    }
    if (trimmedDesc.length < 4) {
      toast.warning('ফিচারটির বিবরণ আরও একটু বিস্তারিত লেখো');
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitFeatureRequest(
        selectedCategory,
        trimmedTitle,
        trimmedDesc
      );
      if (result.success) {
        setIsSuccess(true);
        fetchMyRequests();
        toast.success('ফিচারের প্রস্তাব সফলভাবে জমা দেওয়া হয়েছে!');
      } else {
        toast.error(result.error || 'প্রস্তাব পাঠাতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('[FeatureRequestsView] Submit error:', err);
      toast.error('প্রস্তাব পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করো।');
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
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Sticky Segmented Top Tabs (1:1 with Flutter _buildTabItem) ── */}
      <div className="sticky top-0 z-20 py-2 -mx-2 px-2 flex justify-center bg-[#F9FAFB]/90 dark:bg-[#0F0F11]/90 backdrop-blur-md">
        <div className="w-full p-1 rounded-[12px] bg-[#E5E7EB] dark:bg-[#18181B] flex items-center gap-1 shadow-xs">
          {/* New Request Tab */}
          <button
            type="button"
            onClick={() => setSelectedTabIndex(0)}
            className={`
              flex-1 py-2.5 px-3 rounded-[9px] text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
              ${
                selectedTabIndex === 0
                  ? 'bg-white dark:bg-[#27272A] text-[#111827] dark:text-white shadow-xs font-bold'
                  : 'text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-white'
              }
            `}
          >
            <span>নতুন প্রস্তাব</span>
          </button>

          {/* My Requests Tab */}
          <button
            type="button"
            onClick={() => {
              setSelectedTabIndex(1);
              fetchMyRequests();
            }}
            className={`
              flex-1 py-2.5 px-3 rounded-[9px] text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
              ${
                selectedTabIndex === 1
                  ? 'bg-white dark:bg-[#27272A] text-[#111827] dark:text-white shadow-xs font-bold'
                  : 'text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-white'
              }
            `}
          >
            <span>
              {myRequests.length === 0
                ? 'আমার প্রস্তাব'
                : `আমার প্রস্তাব (${BanglaNameHelper.toBanglaNumeral(myRequests.length)})`}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. Success Screen (1:1 with Flutter _buildSuccessState) ── */}
      {isSuccess ? (
        <div className="my-6 bg-white dark:bg-[#18181B] rounded-[16px] p-7 sm:p-8 border border-[#E5E7EB] dark:border-[#27272A] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#ECFDF5] dark:bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto text-[#059669]">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-[#111827] dark:text-white">
              প্রস্তাব সফলভাবে জমা হয়েছে!
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
              আমাদের টিম তোমার আইডিয়াটি পর্যালোচনা করে অ্যাপে যুক্ত করার ব্যবস্থা করবে।
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-[10px] bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              আরেকটি প্রস্তাব দাও
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
                setSelectedTabIndex(1);
                fetchMyRequests();
              }}
              className="px-5 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#3F3F46] text-[#111827] dark:text-white font-bold text-sm hover:bg-neutral-50 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              আমার তালিকা
            </button>
          </div>
        </div>
      ) : selectedTabIndex === 0 ? (
        /* ── 3. New Request Form & Upcoming Roadmap (1:1 with Flutter) ── */
        <div className="space-y-6 pt-2">
          {/* Form Container */}
          <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-xs space-y-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#111827] dark:text-white">
                অ্যাপে নতুন কী দেখতে চাও?
              </h2>
              <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] mt-1">
                তোমার আইডিয়া বা ফিচারের প্রস্তাব আমাদের সাথে শেয়ার করো।
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category ChoiceChips */}
              <div>
                <label className="text-[13px] font-semibold text-[#374151] dark:text-[#A1A1AA] block mb-2">
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
                        className={`
                          px-3 py-1.5 rounded-[8px] text-[13px] font-medium border transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-[#059669] text-white border-[#059669] font-bold'
                              : 'bg-[#F3F4F6] dark:bg-[#27272A] text-[#4B5563] dark:text-[#D4D4D8] border-[#E5E7EB] dark:border-[#3F3F46] hover:border-neutral-400'
                          }
                        `}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[13px] font-semibold text-[#374151] dark:text-[#A1A1AA] block mb-1.5">
                  ফিচারের নাম / সংক্ষিপ্ত বিবরণ
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ওএমআর শীটে ভুল উত্তর দ্রুত রিভিউর সুবিধা"
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#059669] transition-colors placeholder:text-[#9CA3AF] dark:placeholder:text-[#71717A]"
                />
              </div>

              {/* Description TextArea */}
              <div>
                <label className="text-[13px] font-semibold text-[#374151] dark:text-[#A1A1AA] block mb-1.5">
                  বিস্তারিত বিবরণ
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ফিচারটি কীভাবে কাজ করবে এবং এটি কেন দরকার তা লেখো..."
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FAFAFA] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#059669] transition-colors placeholder:text-[#9CA3AF] dark:placeholder:text-[#71717A] resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11.5 rounded-[10px] bg-[#059669] hover:bg-[#047857] text-white font-bold text-base transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>জমা হচ্ছে...</span>
                ) : (
                  <span>প্রস্তাব জমা দাও</span>
                )}
              </button>
            </form>
          </div>

          {/* ── Upcoming Features (Roadmap Section) ── */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-[17px] font-bold text-[#111827] dark:text-white">
                আসন্ন ফিচারসমূহ
              </h3>
              <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">
                যেসব নতুন ফিচার নিয়ে আমরা কাজ করছি:
              </p>
            </div>

            <div className="space-y-2.5">
              {UPCOMING_ROADMAP.map((item, idx) => {
                const statusCfg = STATUS_MAP[item.statusType];

                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-[12px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#111827] dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold shrink-0 ${statusCfg.bgLight} ${statusCfg.bgDark} ${statusCfg.textLight} ${statusCfg.textDark}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── 4. My Requests List (1:1 with Flutter _buildMyRequestsList) ── */
        <div className="pt-2">
          {isLoadingRequests ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] animate-pulse space-y-2"
                >
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] text-center space-y-3 shadow-2xs">
              <h3 className="text-base font-bold text-[#111827] dark:text-white">
                কোনো প্রস্তাব পাওয়া যায়নি
              </h3>
              <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] max-w-sm mx-auto">
                তোমার কোনো ফিচারের আইডিয়া থাকলে তা লিখে আমাদের জানাতে পারো।
              </p>
              <button
                type="button"
                onClick={() => setSelectedTabIndex(0)}
                className="px-4 py-2 rounded-[8px] border border-[#059669] text-[#059669] font-bold text-[13px] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
              >
                নতুন প্রস্তাব দাও
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const statusCfg =
                  STATUS_MAP[req.status] || STATUS_MAP['Under Review'];

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xs space-y-2"
                  >
                    {/* Header Row: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-[#111827] dark:text-white">
                        {req.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold shrink-0 ${statusCfg.bgLight} ${statusCfg.bgDark} ${statusCfg.textLight} ${statusCfg.textDark}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] text-[#4B5563] dark:text-[#D4D4D8] leading-relaxed">
                      {req.description}
                    </p>

                    {/* Admin Feedback (if present) */}
                    {req.admin_feedback && (
                      <div className="p-2.5 rounded-[8px] bg-[#F3F4F6] dark:bg-[#27272A] text-xs text-[#4B5563] dark:text-[#A1A1AA] space-y-0.5">
                        <strong className="text-[#111827] dark:text-white font-bold">
                          এডমিন ফিডব্যাক:{' '}
                        </strong>
                        <span>{req.admin_feedback}</span>
                      </div>
                    )}

                    {/* Footer: Category & Date */}
                    <div className="text-xs text-[#9CA3AF] dark:text-[#71717A] pt-1">
                      {req.category} •{' '}
                      {new Date(req.created_at).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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

export default FeatureRequestsView;
