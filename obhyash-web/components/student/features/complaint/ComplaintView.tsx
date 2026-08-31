'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send,
  ClipboardList,
  Zap,
  Smile,
  Bug,
  AlertCircle,
  Clock,
  RefreshCcw,
  CheckCheck,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Inbox,
  CheckCircle2,
  Check,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  submitComplaint,
  getUserComplaints,
} from '@/services/complaint-service';
import { ComplaintType, AppComplaint, ComplaintStatus } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

interface ComplaintTypeConfig {
  id: ComplaintType;
  label: string;
  subLabel: string;
  icon: React.ElementType;
  bgLight: string;
  bgDark: string;
  iconColorLight: string;
  iconColorDark: string;
  description: string;
}

const COMPLAINT_TYPES: ComplaintTypeConfig[] = [
  {
    id: 'Technical',
    label: 'কারিগরি সমস্যা',
    subLabel: 'Technical Issue',
    icon: Zap,
    bgLight: 'bg-[#ECFDF5]',
    bgDark: 'dark:bg-[#059669]/20',
    iconColorLight: 'text-[#059669]',
    iconColorDark: 'dark:text-[#34D399]',
    description: 'অ্যাপ ক্র্যাশ, লোডিং সমস্যা বা এরর',
  },
  {
    id: 'UX',
    label: 'ডিজাইন ও অভিজ্ঞতা',
    subLabel: 'UX / Design',
    icon: Smile,
    bgLight: 'bg-[#EFF6FF]',
    bgDark: 'dark:bg-[#2563EB]/20',
    iconColorLight: 'text-[#2563EB]',
    iconColorDark: 'dark:text-[#60A5FA]',
    description: 'ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ',
  },
  {
    id: 'Bug',
    label: 'বাগ রিপোর্ট',
    subLabel: 'Bug Report',
    icon: Bug,
    bgLight: 'bg-[#FEF2F2]',
    bgDark: 'dark:bg-[#DC2626]/20',
    iconColorLight: 'text-[#DC2626]',
    iconColorDark: 'dark:text-[#F87171]',
    description: 'কোনো ফিচার ঠিকমতো কাজ করছে না',
  },
  {
    id: 'Other',
    label: 'নতুন ফিচার প্রস্তাব',
    subLabel: 'Feature Request',
    icon: AlertCircle,
    bgLight: 'bg-[#FFFBEB]',
    bgDark: 'dark:bg-[#D97706]/20',
    iconColorLight: 'text-[#D97706]',
    iconColorDark: 'dark:text-[#FBBF24]',
    description: 'নতুন কোনো সুবিধা বা ফিচার যোগ করার আইডিয়া',
  },
];

const STATUS_CONFIG: Record<
  ComplaintStatus,
  {
    label: string;
    icon: React.ElementType;
    bgLight: string;
    bgDark: string;
    textColor: string;
  }
> = {
  Pending: {
    label: 'অপেক্ষমাণ',
    icon: Clock,
    bgLight: 'bg-[#FEF3C7]',
    bgDark: 'dark:bg-[#78350F]/30',
    textColor: 'text-[#D97706]',
  },
  'In Progress': {
    label: 'প্রক্রিয়াধীন',
    icon: RefreshCcw,
    bgLight: 'bg-[#DBEAFE]',
    bgDark: 'dark:bg-[#1E3A8A]/30',
    textColor: 'text-[#2563EB]',
  },
  Resolved: {
    label: 'সমাধান হয়েছে',
    icon: CheckCheck,
    bgLight: 'bg-[#ECFDF5]',
    bgDark: 'dark:bg-[#064E3B]/30',
    textColor: 'text-[#059669]',
  },
  Dismissed: {
    label: 'বাতিল',
    icon: XCircle,
    bgLight: 'bg-[#F4F4F5]',
    bgDark: 'dark:bg-[#27272A]',
    textColor: 'text-[#71717A]',
  },
};

export const ComplaintView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [myComplaints, setMyComplaints] = useState<AppComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Cooldown
  const initCooldown = useCallback(() => {
    try {
      const lastSubmit = parseInt(
        localStorage.getItem('last_complaint_submit_time') || '0',
        10
      );
      const elapsedMs = Date.now() - lastSubmit;
      if (elapsedMs < 180000) {
        startCooldownTimer(Math.floor((180000 - elapsedMs) / 1000));
      }
    } catch (_) {}
  }, []);

  const startCooldownTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldownSeconds(seconds);
    timerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    initCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initCooldown]);

  const fetchMyComplaints = useCallback(async () => {
    setIsLoadingComplaints(true);
    try {
      const data = await getUserComplaints();
      setMyComplaints(data);
    } catch (err) {
      console.error('[ComplaintView] Error fetching complaints:', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  // Limits
  const pendingCount = myComplaints.filter(
    (c) => c.status === 'Pending' || c.status === 'In Progress'
  ).length;
  const dailyCount = myComplaints.filter(
    (c) =>
      Date.now() - new Date(c.created_at).getTime() < 24 * 60 * 60 * 1000
  ).length;

  const isPendingLimitReached = pendingCount >= 3;
  const isDailyLimitReached = dailyCount >= 5;
  const isBlocked =
    isPendingLimitReached || isDailyLimitReached || cooldownSeconds > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPendingLimitReached) {
      toast.warning(
        'আপনার ৩টি আবেদন বর্তমানে প্রক্রিয়াধীন আছে। নতুন বার্তা পাঠানোর পূর্বে সেগুলোর সমাধান হওয়া পর্যন্ত অপেক্ষা করুন।'
      );
      return;
    }

    if (isDailyLimitReached) {
      toast.warning(
        'আজকের জন্য আপনার আবেদনের দৈনিক সীমা (৫টি) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।'
      );
      return;
    }

    if (cooldownSeconds > 0) {
      const min = Math.floor(cooldownSeconds / 60);
      const sec = cooldownSeconds % 60;
      toast.warning(
        `পরবর্তী বার্তা পাঠানোর জন্য আর ${min} মিনিট ${sec} সেকেন্ড অপেক্ষা করুন।`
      );
      return;
    }

    if (!selectedType) {
      toast.warning('অনুগ্রহ করে মতামতের ধরণ নির্বাচন করো');
      return;
    }

    const desc = description.trim();
    if (desc.length < 15) {
      toast.warning(
        'অনুগ্রহ করে বিস্তারিত মতামত লেখো (কমপক্ষে ১৫ অক্ষর আবশ্যক)'
      );
      return;
    }
    if (desc.length > 1000) {
      toast.warning('মতামতের বিবরণ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে লেখো');
      return;
    }

    // Duplicate text check in last 7 days
    const isDuplicate = myComplaints.some(
      (c) =>
        c.description.trim().toLowerCase() === desc.toLowerCase() &&
        Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    if (isDuplicate) {
      toast.warning(
        'আপনি ইতিপূর্বে হুবহু একই বিবরণ পাঠিয়েছেন! নতুন কোনো তথ্য থাকলে তা উল্লেখ করুন।'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitComplaint(selectedType, desc);
      if (result.success) {
        try {
          localStorage.setItem(
            'last_complaint_submit_time',
            Date.now().toString()
          );
          startCooldownTimer(180);
        } catch (_) {}

        setIsSuccess(true);
        fetchMyComplaints();
        toast.success(
          'তোমার বার্তা আমরা পেয়েছি! দ্রুতই ব্যবস্থা নেওয়া হবে। 🚀'
        );
      } else {
        toast.error(result.error || 'মতামত পাঠাতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      toast.error('মতামত পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করো।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedType(null);
    setDescription('');
  };

  const charCount = description.trim().length;

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Segmented Tab Switcher (1:1 with Flutter _buildTabButton) ── */}
      <div className="p-1 rounded-[14px] bg-[#F1F5F9] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] flex items-center mb-4">
        {/* New Complaint Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`
            flex-1 py-2.5 px-3 rounded-[10px] text-xs sm:text-[13.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer
            ${
              activeTab === 'new'
                ? 'bg-white dark:bg-[#27272A] text-[#059669] dark:text-white shadow-xs font-black'
                : 'text-[#A3A3A3] hover:text-neutral-700 dark:hover:text-neutral-200'
            }
          `}
        >
          <Send className="w-4 h-4 text-[#059669]" />
          <span>নতুন অভিযোগ</span>
        </button>

        {/* My List Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('my');
            fetchMyComplaints();
          }}
          className={`
            flex-1 py-2.5 px-3 rounded-[10px] text-xs sm:text-[13.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer
            ${
              activeTab === 'my'
                ? 'bg-white dark:bg-[#27272A] text-[#059669] dark:text-white shadow-xs font-black'
                : 'text-[#A3A3A3] hover:text-neutral-700 dark:hover:text-neutral-200'
            }
          `}
        >
          <ClipboardList className="w-4 h-4 text-[#059669]" />
          <span>
            {myComplaints.length === 0
              ? 'আমার তালিকা'
              : `আমার তালিকা (${BanglaNameHelper.toBanglaNumeral(myComplaints.length)})`}
          </span>
        </button>
      </div>

      {/* ── 2. Success Screen (1:1 with Flutter _buildSuccessState) ── */}
      {isSuccess ? (
        <div className="bg-white dark:bg-[#18181B] rounded-[24px] p-7 sm:p-8 border border-[#E2E8F0] dark:border-[#27272A] text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 bg-[#ECFDF5] dark:bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto text-[#059669]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
              বার্তা গৃহীত হয়েছে!
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-md mx-auto leading-relaxed">
              আমাদের টিম বিষয়টি গুরুত্ব সহকারে দেখছে। তোমার মতামতের জন্য ধন্যবাদ।
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3 px-5 rounded-[12px] border border-[#CBD5E1] dark:border-[#3F3F46] text-[#0F172A] dark:text-white font-bold text-sm hover:bg-neutral-50 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              আরেকটি পাঠাও
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
                setActiveTab('my');
                fetchMyComplaints();
              }}
              className="flex-1 py-3 px-5 rounded-[12px] bg-[#059669] text-white font-bold text-sm hover:bg-[#047857] transition-all shadow-xs cursor-pointer"
            >
              তালিকা দেখো
            </button>
          </div>
        </div>
      ) : activeTab === 'new' ? (
        /* ── 3. New Complaint Form Screen (1:1 with Flutter _buildNewComplaintForm) ── */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Anti-Spam / Rate Limit Status Alerts */}
          {isPendingLimitReached ? (
            <div className="p-3.5 rounded-[12px] bg-[#FFFBEB] dark:bg-[#451A03]/40 border border-[#FDE68A] dark:border-[#D97706]/40 flex items-center gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-[#D97706] shrink-0" />
              <p className="text-xs font-semibold text-[#92400E] dark:text-[#FDE68A] leading-snug">
                আপনার ৩টি আবেদন ইতিমধ্যে প্রক্রিয়াধীন আছে। নতুন আবেদন জমা দেওয়ার পূর্বে আগেরগুলোর সমাধানের অপেক্ষা করুন।
              </p>
            </div>
          ) : isDailyLimitReached ? (
            <div className="p-3.5 rounded-[12px] bg-[#FFFBEB] dark:bg-[#451A03]/40 border border-[#FDE68A] dark:border-[#D97706]/40 flex items-center gap-2.5">
              <ShieldAlert className="w-4.5 h-4.5 text-[#D97706] shrink-0" />
              <p className="text-xs font-semibold text-[#92400E] dark:text-[#FDE68A] leading-snug">
                আজকের জন্য আপনার আবেদনের সর্বোচ্চ সীমা (৫টি/দিন) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।
              </p>
            </div>
          ) : cooldownSeconds > 0 ? (
            <div className="p-3.5 rounded-[12px] bg-[#EEF2FF] dark:bg-[#1E1B4B]/40 border border-[#C7D2FE] dark:border-[#6366F1]/40 flex items-center gap-2.5">
              <Clock className="w-4.5 h-4.5 text-[#6366F1] shrink-0" />
              <p className="text-xs font-semibold text-[#3730A3] dark:text-[#C7D2FE] leading-snug">
                স্প্যামিং প্রতিরোধে পরবর্তী বার্তা পাঠাতে আর{' '}
                {Math.floor(cooldownSeconds / 60)}:
                {(cooldownSeconds % 60).toString().padStart(2, '0')} মিনিট অপেক্ষা
                করুন।
              </p>
            </div>
          ) : null}

          {/* Step 1: Category Selection */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-[7px] bg-[#059669] text-white font-black text-xs flex items-center justify-center shrink-0">
                ১
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white">
                সমস্যার ধরন বেছে নাও
              </h3>
            </div>

            <div className="space-y-2">
              {COMPLAINT_TYPES.map((cat) => {
                const isSelected = selectedType === cat.id;
                const Icon = cat.icon;

                return (
                  <div
                    key={cat.id}
                    onClick={() => !isBlocked && setSelectedType(cat.id)}
                    className={`
                      relative rounded-[14px] border transition-all cursor-pointer overflow-hidden flex items-center
                      ${
                        isSelected
                          ? 'border-[#059669] bg-[#F0FDF4] dark:bg-[#064E3B]/30 shadow-xs'
                          : 'border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-neutral-300'
                      }
                      ${isBlocked ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    {/* Left Accent Bar */}
                    <div
                      className={`w-1 self-stretch transition-colors ${
                        isSelected ? 'bg-[#059669]' : 'bg-transparent'
                      }`}
                    />

                    <div className="flex-1 p-3 sm:p-3.5 flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`
                          p-2 rounded-[10px] shrink-0 transition-colors
                          ${
                            isSelected
                              ? 'bg-[#059669] text-white'
                              : `${cat.bgLight} ${cat.bgDark} ${cat.iconColorLight} ${cat.iconColorDark}`
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Label + Description */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-bold truncate ${
                            isSelected
                              ? 'text-[#065F46] dark:text-white'
                              : 'text-[#111827] dark:text-white'
                          }`}
                        >
                          {cat.label}
                        </h4>
                        <p
                          className={`text-[11px] mt-0.5 truncate ${
                            isSelected
                              ? 'text-[#047857] dark:text-[#6EE7B7]'
                              : 'text-[#9CA3AF] dark:text-[#71717A]'
                          }`}
                        >
                          {cat.description}
                        </p>
                      </div>

                      {/* Checkbox circle */}
                      <div
                        className={`
                          w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                          ${
                            isSelected
                              ? 'bg-[#059669] border-[#059669] text-white'
                              : 'border-[#D1D5DB] dark:border-[#3F3F46]'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Description */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[7px] bg-[#059669] text-white font-black text-xs flex items-center justify-center shrink-0">
                  ২
                </div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  বিস্তারিত বিবরণ লেখো
                </h3>
              </div>
              <span
                className={`text-[11.5px] font-semibold ${
                  charCount === 0
                    ? 'text-[#9CA3AF] dark:text-[#71717A]'
                    : charCount < 15
                    ? 'text-[#D97706]'
                    : charCount <= 1000
                    ? 'text-[#059669]'
                    : 'text-[#EF4444]'
                }`}
              >
                {BanglaNameHelper.toBanglaNumeral(charCount)} / ১০০০ অক্ষর
              </span>
            </div>

            <div className="rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] p-3 shadow-xs">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={isBlocked}
                rows={5}
                placeholder="সমস্যাটি কীভাবে ঘটেছে বা কোথায় দেখা দিয়েছে তা লেখো (কমপক্ষে ১৫ অক্ষর)…"
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-neutral-800 dark:text-white placeholder:text-[#BBBBBB] dark:placeholder:text-[#52525B] leading-relaxed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isBlocked}
            className={`
              w-full h-13 rounded-[14px] text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer
              ${
                isBlocked
                  ? 'bg-[#E2E8F0] dark:bg-[#27272A] text-[#94A3B8] dark:text-[#71717A] cursor-not-allowed'
                  : 'bg-[#059669] hover:bg-[#047857] text-white'
              }
            `}
          >
            {isLoading ? (
              <span>জমা হচ্ছে...</span>
            ) : isBlocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  {isPendingLimitReached
                    ? 'আগের ৩টি আবেদনের সমাধানের অপেক্ষা করো'
                    : isDailyLimitReached
                    ? 'আজকের সাবমিশন সীমা পূর্ণ (৫/৫)'
                    : `অপেক্ষা করুন (${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')})`}
                </span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>সাপোর্ট টিকেট জমা দাও</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* ── 4. My Complaints List (1:1 with Flutter _buildMyComplaintsList) ── */
        <div>
          {isLoadingComplaints ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-[16px] bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] animate-pulse space-y-2.5"
                >
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="p-10 rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#F1F5F9] dark:bg-[#27272A] flex items-center justify-center mx-auto text-[#A3A3A3]">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                  কোনো অভিযোগ জমা নেই
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  তুমি এখনো কোনো অভিযোগ বা ফিডব্যাক জমা দাওনি।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="px-5 py-2.5 rounded-[12px] bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 mx-auto hover:bg-[#047857] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>নতুন অভিযোগ করো</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myComplaints.map((complaint) => {
                const typeInfo =
                  COMPLAINT_TYPES.find((t) => t.id === complaint.type) ||
                  COMPLAINT_TYPES[0];
                const statusInfo =
                  STATUS_CONFIG[complaint.status] || STATUS_CONFIG.Pending;
                const StatusIcon = statusInfo.icon;
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={complaint.id}
                    className="p-4 sm:p-5 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs space-y-3"
                  >
                    {/* Top Row: Type and Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-[10px] shrink-0 ${typeInfo.bgLight} ${typeInfo.bgDark} ${typeInfo.iconColorLight} ${typeInfo.iconColorDark}`}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white truncate">
                            {typeInfo.label}
                          </h4>
                          <span className="text-[11px] text-[#A3A3A3] block">
                            {new Date(complaint.created_at).toLocaleDateString(
                              'bn-BD',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${statusInfo.bgLight} ${statusInfo.bgDark} ${statusInfo.textColor}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-[14px] text-[#334155] dark:text-[#D4D4D8] leading-relaxed">
                      {complaint.description}
                    </p>

                    {/* Admin Feedback (if present) */}
                    {complaint.admin_feedback &&
                      complaint.admin_feedback.trim() && (
                        <div className="p-3 rounded-[12px] bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#059669]/35 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46] dark:text-[#34D399]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            <span>অ্যাডমিন উত্তর:</span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#0F172A] dark:text-[#E2E8F0] leading-relaxed">
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

export default ComplaintView;
