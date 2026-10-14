'use client';

import { useSearchParams } from 'next/navigation';
import { HSC_SCIENCE_NOTES } from '@/data/hsc-ka-kha-notes';

const SUBJECT_NAME_MAP: Record<string, string> = {
  'physics-2nd': 'পদার্থবিজ্ঞান ২য় পত্রের',
  'chemistry-2nd': 'রসায়ন ২য় পত্রের',
  'higher-math': 'উচ্চতর গণিতের',
  'biology': 'জীববিজ্ঞানের',
};

export function AppExclusiveHeader() {
  const searchParams = useSearchParams();
  const subjectSlug = searchParams.get('subject') || '';

  const matchedSubject = HSC_SCIENCE_NOTES.find((s) => s.slug === subjectSlug);
  const subjectName = matchedSubject
    ? `${matchedSubject.titleBn} এর`
    : SUBJECT_NAME_MAP[subjectSlug] || 'বাকি সকল বিষয়ের';

  return (
    <div className="mb-4 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-4 shadow-xs">
        ✨ {subjectName} সম্পূর্ণ ক ও খ হ্যান্ডনোট এখন অভ্যাস অ্যাপে
      </div>
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight mb-5">
        পরীক্ষার আগে ক-খ রিভিশনে বইয়ের ভিড়ে সময় নষ্ট?{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          সব নোট একসাথে অফলাইনে তোমার ফোনে!
        </span>
      </h1>
    </div>
  );
}
