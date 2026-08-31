'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

interface SubjectStat {
  subject: string;
  examCount: number;
  accuracy: number;
  lastActivity: string;
}

interface SubjectsProgressSectionProps {
  subjectStats: SubjectStat[];
  onSubjectClick?: (subject: string) => void;
}

const SubjectsProgressSection: React.FC<SubjectsProgressSectionProps> = ({
  subjectStats,
  onSubjectClick,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectStat | null>(null);

  if (subjectStats.length === 0) {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] shadow-sm p-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          বিষয়ভিত্তিক দক্ষতা
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          এখনও কোনো পরীক্ষা দেওয়া হয়নি। পরীক্ষা দিলে এখানে তোমার বিষয়ভিত্তিক
          দক্ষতা দেখা যাবে।
        </p>
      </div>
    );
  }

  // Get color based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-500';
    if (accuracy >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (accuracy >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getAccuracyTextColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMasteryInfo = (accuracy: number) => {
    if (accuracy >= 80) {
      return {
        badge: 'চমৎকার দক্ষতা (Master)',
        color: 'text-emerald-600 dark:text-emerald-400',
        advice: 'এই বিষয়ে তোমার প্রস্তুতি খুব ভালো। নিয়মিত রিভিশন দাও।',
      };
    }
    if (accuracy >= 60) {
      return {
        badge: 'উন্নতি প্রয়োজন (Proficient)',
        color: 'text-blue-600 dark:text-blue-400',
        advice: 'ধারাবাহিক অনুশীলনে তুমি সহজেই আরও ভালো করতে পারবে।',
      };
    }
    return {
      badge: 'দুর্বল বিষয় (Needs Work)',
      color: 'text-red-600 dark:text-red-400',
      advice: 'এই বিষয়ের মূল কনসেপ্টগুলো আবার রিভিশন দেওয়ার পরামর্শ রইল।',
    };
  };

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] shadow-sm p-4 sm:p-6 font-['HindSiliguri',sans-serif]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
          বিষয়ভিত্তিক দক্ষতা
        </h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {subjectStats.length}টি বিষয়
        </span>
      </div>

      <div className="space-y-3">
        {subjectStats.map((stat) => (
          <div
            key={stat.subject}
            onClick={() => setSelectedSubject(stat)}
            className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#27272a] border border-neutral-200/60 dark:border-[#3f3f46]/60 transition-all duration-150 active:scale-[0.99] hover:border-neutral-300 dark:hover:border-[#52525b] cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
                  {BanglaNameHelper.formatSubject(stat.subject)}
                </span>
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 px-2 py-0.5 bg-neutral-200 dark:bg-[#3f3f46] rounded-md">
                  {stat.examCount} পরীক্ষা
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getAccuracyBgColor(stat.accuracy)} ${getAccuracyTextColor(stat.accuracy)}`}
              >
                {stat.accuracy}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-neutral-200 dark:bg-[#3f3f46] rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full ${getAccuracyColor(stat.accuracy)} transition-all duration-700`}
                style={{ width: `${stat.accuracy}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Half-Screen Subject Detail Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#18181b] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] shadow-2xl flex flex-col max-h-[50vh] overflow-hidden">
            {/* Pinned Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-[#27272a] flex items-center justify-between shrink-0">
              <h4 className="text-lg font-black text-neutral-900 dark:text-white">
                {BanglaNameHelper.formatSubject(selectedSubject.subject)}
              </h4>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-full bg-neutral-100 dark:bg-[#27272a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Below */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Mastery Banner */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#27272a] border border-neutral-200 dark:border-[#3f3f46] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-0.5">
                    গড় নির্ভুলতা (Accuracy)
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      getMasteryInfo(selectedSubject.accuracy).color
                    }`}
                  >
                    {getMasteryInfo(selectedSubject.accuracy).badge}
                  </span>
                </div>
                <span className="text-3xl font-black text-neutral-900 dark:text-white">
                  {selectedSubject.accuracy}%
                </span>
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 dark:bg-[#27272a] rounded-xl border border-neutral-200 dark:border-[#3f3f46] text-center">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                    মোট পরীক্ষা
                  </span>
                  <span className="text-lg font-black text-neutral-900 dark:text-white mt-1 block">
                    {selectedSubject.examCount}টি
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                    সর্বশেষ কার্যকলাপ
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1 block truncate">
                    {selectedSubject.lastActivity || 'আজকে'}
                  </span>
                </div>
              </div>

              {/* Actionable Guidance */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                  {getMasteryInfo(selectedSubject.accuracy).advice}
                </p>
              </div>

              <button
                onClick={() => setSelectedSubject(null)}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-white text-sm font-bold rounded-xl transition-all active:scale-95"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsProgressSection;
