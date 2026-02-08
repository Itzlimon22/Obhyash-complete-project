'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { submitComplaint } from '@/services/complaint-service';
import { ComplaintType } from '@/lib/types';
import { cn } from '@/lib/utils';
// import { motion, AnimatePresence } from 'framer-motion';

const COMPLAINT_TYPES = [
  {
    id: 'Technical' as ComplaintType,
    label: 'কারিগরি সমস্যা',
    subLabel: 'Technical Issue',
    icon: Zap,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'group-hover:border-blue-500',
    description: 'অ্যাপ क्रাশ, লোডিং সমস্যা বা এরর',
  },
  {
    id: 'UX' as ComplaintType,
    label: 'ডিজাইন ও অভিজ্ঞতা',
    subLabel: 'UX / Design',
    icon: Smile,
    color:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'group-hover:border-purple-500',
    description: 'ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ',
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
    label: 'নতুন ফিচার আইডিয়া',
    subLabel: 'Feature Request',
    icon: AlertCircle,
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    borderColor: 'group-hover:border-amber-500',
    description: 'নতুন কোনো সুবিধা বা ফিচার চান?',
  },
];

export const ComplaintView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('অনুগ্রহ করে অভিযোগের ধরণ নির্বাচন করুন');
      return;
    }
    if (description.length < 10) {
      toast.error('অনুগ্রহ করে বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)');
      return;
    }

    setIsLoading(true);
    // Assuming submitComplaint is robust enough
    const result = await submitComplaint(selectedType, description);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success('আপনার বার্তা আমরা পেয়েছি! ধন্যবাদ। 🚀');
    } else {
      toast.error(
        result.error || 'কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      );
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedType(null);
    setDescription('');
  };

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
              বার্তা গৃহীত হয়েছে!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              আমাদের টিম বিষয়টি দেখছে। আপনার মতামতের জন্য ধন্যবাদ।
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold transition-colors"
          >
            ফিরে যান বা আরেকটি অভিযোগ করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-in slide-in-from-bottom-4 duration-500">
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
            'অভ্যাস' প্ল্যাটফর্মকে আরও উন্নত করতে আপনার মতামত বা অভিযোগ আমাদের
            জানান।
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Category Selection */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  ১. অভিযোগের ধরণ নির্বাচন করুন
                </h3>
              </div>

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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  ২. বিস্তারিত লিখুন
                </h3>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-3xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur-lg"></div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="আপনার সমস্যা বা পরামর্শ সম্পর্কে বিস্তারিত লিখুন..."
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
                      <span>জমা দিন</span>
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

        {/* Sidebar Info (Optional) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-6 border border-rose-100 dark:border-rose-800/20">
            <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              জরুরী প্রয়োজনে
            </h4>
            <p className="text-sm text-rose-600/80 dark:text-rose-400/80 leading-relaxed mb-4">
              আপনার যদি একাউন্ট সম্পর্কিত কোনো জটিল সমস্যা থাকে অথবা পেমেন্ট
              সংক্রান্ত কোনো বিষয় থাকে, তবে সরাসরি আমাদের মেইল করতে পারেন।
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 p-3 rounded-xl border border-rose-100 dark:border-neutral-700">
              ✉️ support@obhyash.com
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-900 dark:text-white mb-4">
              সচরাচর জিজ্ঞাসিত প্রশ্ন
            </h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li className="flex gap-2">
                <span className="text-rose-500">•</span>
                পাসওয়ার্ড ভুলে গেলে কী করব?
              </li>
              <li className="flex gap-2">
                <span className="text-rose-500">•</span>
                কিভাবে সাবস্ক্রিপশন কিনব?
              </li>
              <li className="flex gap-2">
                <span className="text-rose-500">•</span>
                পরীক্ষার ফলাফল কিভাবে দেখব?
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
