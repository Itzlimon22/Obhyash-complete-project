'use client';

import React, { useState } from 'react';
import {
  X,
  Radio,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { LiveExam } from '@/lib/types';

interface Props {
  exam: LiveExam | null;
  onSave: (data: Partial<LiveExam>) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'hsc', label: 'HSC Science (এইচএসসি বিজ্ঞান)' },
  { id: 'medical', label: 'Medical Admission (ডিএমসি / মেডিকেল)' },
  { id: 'engineering', label: 'Engineering Admission (বুয়েট / ইঞ্জিনিয়ারিং)' },
  { id: 'varsity_a', label: 'Varsity A-Unit (ঢাবি ক / জিএসটি)' },
  { id: 'ssc', label: 'SSC (এসএসসি)' },
  { id: 'all', label: 'All Categories (সকল শিক্ষার্থী)' },
];

export default function LiveExamFormModal({ exam, onSave, onClose }: Props) {
  const getDefaultStartTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = (startStr: string, durationMins: number) => {
    const start = new Date(startStr || new Date());
    const end = new Date(start.getTime() + (durationMins + 60) * 60000); // 1-hour window
    return end.toISOString().slice(0, 16);
  };

  const initialStart = exam?.start_time
    ? new Date(exam.start_time).toISOString().slice(0, 16)
    : getDefaultStartTime();

  const [formData, setFormData] = useState<Partial<LiveExam>>({
    title: exam?.title || '',
    category: exam?.category || 'hsc',
    description: exam?.description || '',
    start_time: initialStart,
    end_time: exam?.end_time
      ? new Date(exam.end_time).toISOString().slice(0, 16)
      : getDefaultEndTime(initialStart, exam?.duration_minutes || 30),
    duration_minutes: exam?.duration_minutes || 30,
    total_marks: exam?.total_marks || 25,
    negative_marking:
      exam?.negative_marking !== undefined ? exam.negative_marking : 0.25,
    status: exam?.status || 'published',
    is_leaderboard_published:
      exam?.is_leaderboard_published !== undefined
        ? exam.is_leaderboard_published
        : true,
  });

  const handleStartChange = (startVal: string) => {
    setFormData((prev) => ({
      ...prev,
      start_time: startVal,
      end_time: getDefaultEndTime(startVal, prev.duration_minutes || 30),
    }));
  };

  const handleDurationPreset = (mins: number) => {
    setFormData((prev) => ({
      ...prev,
      duration_minutes: mins,
      total_marks: mins, // default 1 mark per minute
      end_time: getDefaultEndTime(prev.start_time || initialStart, mins),
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        start_time: new Date(formData.start_time as string).toISOString(),
        end_time: new Date(formData.end_time as string).toISOString(),
      });
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-zinc-800 flex justify-between items-center bg-neutral-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                {exam ? 'লাইভ পরীক্ষা সম্পাদনা' : 'নতুন লাইভ পরীক্ষা তৈরি'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-zinc-400">
                লাইভ শিডিউল, নেগেটিভ মার্কিং ও প্রকাশনা সেটিংস
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-5"
        >
          {/* Exam Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              পরীক্ষার নাম (Exam Title) *
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
              placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র - গতিবিদ্যা মেগা লাইভ টেস্ট"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              ক্যাটাগরি / টার্গেট ট্র্যাক (Target Category) *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold outline-none text-neutral-900 dark:text-white"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Syllabus & Chapters (For Routine & Students) */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                পরীক্ষার সিলেবাস ও অধ্যায়সমূহ (Syllabus for Routine) *
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                কমা (,) দিয়ে আলাদা করুন
              </span>
            </div>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
              rows={3}
              placeholder="যেমন: অধ্যায় ১: ভেক্টর, অধ্যায় ৩: গতিবিদ্যা, অধ্যায় ৪: নিউটনিয়ান বলবিদ্যা"
            />
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
              💡 এই অধ্যায়গুলো অ্যাপের <strong>রুটিন ও সিলেবাস</strong> মডালে এবং শিক্ষার্থীদের প্রস্তুতির জন্য ট্যাগে প্রদর্শিত হবে।
            </p>
          </div>

          {/* Duration Presets & Marks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800">
            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-600 dark:text-zinc-400 flex items-center gap-1">
                <Clock size={13} /> সময়সীমা (মিনিট)
              </label>
              <input
                required
                type="number"
                min="5"
                max="180"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: Number(e.target.value),
                  })
                }
                className="w-full bg-white dark:bg-zinc-850 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white"
              />
              <div className="flex gap-1 pt-1">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleDurationPreset(m)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-emerald-500 hover:text-white transition"
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Total Marks */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-600 dark:text-zinc-400 flex items-center gap-1">
                <Award size={13} /> মোট নম্বর / পূর্ণমান
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.total_marks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_marks: Number(e.target.value),
                  })
                }
                className="w-full bg-white dark:bg-zinc-850 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white"
              />
              <p className="text-[10px] text-neutral-400 dark:text-zinc-500">
                বিল্ডারে প্রশ্ন যোগ করার পর পূর্ণমান সরাসরি সিঙ্ক করা যাবে
              </p>
            </div>

            {/* Negative Marking */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-600 dark:text-zinc-400 flex items-center gap-1">
                <AlertTriangle size={13} /> নেগেটিভ মার্ক
              </label>
              <select
                value={formData.negative_marking}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    negative_marking: Number(e.target.value),
                  })
                }
                className="w-full bg-white dark:bg-zinc-850 border border-neutral-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-900 dark:text-white outline-none"
              >
                <option value={0}>0.00 (কোনো পেনাল্টি নেই)</option>
                <option value={0.25}>-0.25 (স্ট্যান্ডার্ড ২৫%)</option>
                <option value={0.5}>-0.50 (৫০% নেগেটিভ)</option>
              </select>
            </div>
          </div>

          {/* Schedule Window (Start & End Time) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar size={13} /> শুরুর সময় (Start Time) *
              </label>
              <input
                required
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-neutral-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar size={13} /> সমাপ্তির সময় (End Time) *
              </label>
              <input
                required
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              প্রকাশনা স্থিতি (Publication Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'published', label: '🚀 Published (লাইভ)', desc: 'অ্যাপ ও ওয়েবে দৃশ্যমান' },
                { id: 'draft', label: '📝 Draft (খসড়া)', desc: 'প্রশ্ন গোছানোর জন্য' },
                { id: 'archived', label: '📦 Archived (আর্কাইভ)', desc: 'সমাপ্ত পরীক্ষা' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, status: st.id as any })
                  }
                  className={`p-3 rounded-xl border text-left transition ${
                    formData.status === st.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-neutral-50 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-xs font-bold">{st.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {st.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Visibility Control */}
          <div className="p-3.5 bg-neutral-50 dark:bg-zinc-900/60 rounded-2xl border border-neutral-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>📢</span>
                <span>শিক্ষার্থীদের জন্য মেধা তালিকা উন্মুক্ত রাখুন (Publish Leaderboard)</span>
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5">
                সক্রিয় থাকলে শিক্ষার্থীরা তাদের র‍্যাংক ও মেধা তালিকা দেখতে পাবে
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.is_leaderboard_published !== false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_leaderboard_published: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Save size={15} className={isSubmitting ? 'animate-spin' : ''} />
              <span>
                {isSubmitting
                  ? 'সংরক্ষণ হচ্ছে...'
                  : exam
                    ? 'আপডেট সংরক্ষণ করুন'
                    : 'লাইভ এক্সাম তৈরি করুন'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
