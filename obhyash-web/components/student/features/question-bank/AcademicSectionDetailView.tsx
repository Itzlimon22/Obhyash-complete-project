'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ListFilter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileQuestion,
  Lightbulb,
  FileText,
  Flag,
} from 'lucide-react';
import { hscSubjects } from '@/lib/data/hsc';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import type { Question } from '@/lib/types';

interface AcademicSectionDetailViewProps {
  subject: {
    id: string;
    name: string;
    paper: string;
    count?: number;
  };
  section: {
    id: string;
    title: string;
    subtitle: string;
    gradient: string;
    svgIcon: string;
    count: number;
  };
  onBack: () => void;
}

export default function AcademicSectionDetailView({
  subject,
  section,
  onBack,
}: AcademicSectionDetailViewProps) {
  // Find chapters from HSC syllabus store
  const matchedSubject = useMemo(() => {
    const rawId = subject.id.toLowerCase();
    const cleanId = rawId.replace('hsc_', '').replace('ssc_', '');
    return hscSubjects.find(
      (s) =>
        s.id.toLowerCase() === rawId ||
        s.id.toLowerCase().includes(cleanId) ||
        s.name.includes(subject.name)
    );
  }, [subject]);

  const chapters = useMemo(() => {
    if (matchedSubject && matchedSubject.chapters) {
      return matchedSubject.chapters;
    }
    return [
      { id: 'ch01', name: '১ম অধ্যায়: মৌলিক ধারণা ও পরিমাপ', topics: [] },
      { id: 'ch02', name: '২য় অধ্যায়: ভেক্টর ও রাশি', topics: [] },
      { id: 'ch03', name: '৩য় অধ্যায়: গতিবিদ্যা ও সূত্রাবলী', topics: [] },
      { id: 'ch04', name: '৪র্থ অধ্যায়: নিউটনিয়ান বলবিদ্যা', topics: [] },
      { id: 'ch05', name: '৫ম অধ্যায়: কাজ, শক্তি ও ক্ষমতা', topics: [] },
    ];
  }, [matchedSubject]);

  // Selected filters
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');

  // Interactive Question State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());

  // Current chapter's topics
  const currentChapter = useMemo(() => {
    if (selectedChapterId === 'all') return null;
    return chapters.find((c) => c.id === selectedChapterId) || null;
  }, [chapters, selectedChapterId]);

  const topics = useMemo(() => {
    if (!currentChapter || !currentChapter.topics) return [];
    return currentChapter.topics;
  }, [currentChapter]);

  const paperClean = subject.paper ? subject.paper.split(' ')[0] : '';
  const displayTitle = paperClean ? `${subject.name} ${paperClean}` : subject.name;

  // Curated Questions for the active selection
  const questions: any[] = useMemo(() => {
    const chapterName = currentChapter ? currentChapter.name : 'সকল অধ্যায়';
    const topicObj = topics.find((t) => t.id === selectedTopicId);
    const topicSnippet = topicObj ? ` [${topicObj.name}]` : '';

    if (section.id === 'cq') {
      return [
        {
          id: `cq_1`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} সংশ্লিষ্ট একটি ব্যবহারিক পরীক্ষায় সংগৃহীত তথ্যাদি থেকে গতি ও শক্তির তুলনামূলক পরিবর্তন ছকভুক্ত করা হলো।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 10,
          explanation:
            '(ক) জ্ঞানমূলক উত্তর: পাঠ্যবই অনুযায়ী সূত্র ও সংজ্ঞা সুস্পষ্টভাবে সংজ্ঞায়িত।\n\n(খ) অনুধাবনমূলক ব্যাখ্যা: কারণ ও প্রভাবের সম্পর্ক যুক্তিসহ তুলে ধরতে হবে।\n\n(গ) প্রয়োগমূলক সমাধান: সমীকরণ অনুযায়ী প্রয়োজনীয় মান নির্ণয় করা হয়েছে। মান: ১০.৫ একক।\n\n(ঘ) উচ্চতর দক্ষতা: উদ্দীপকের শর্ত সাপেক্ষে গাণিতিক ও তুলনামূলক বিশ্লেষণ নিখুঁতভাবে প্রমাণিত।',
          examHistory: [{ institute: 'ঢাকা বোর্ড', year: 2023 }],
          institutes: ['ঢাকা বোর্ড'],
          years: [2023],
          difficulty: 'medium',
        },
        {
          id: `cq_2`,
          subject: displayTitle,
          chapter: chapterName,
          question: `পরীক্ষাগারে ${chapterName} সম্পর্কিত পরীক্ষণ সম্পন্নকালে পর্যবেক্ষণ থেকে প্রাপ্ত ফলাফল বিশ্লেষণ করা হলো।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 10,
          explanation:
            '(ক) মৌলিক রাশি/সংজ্ঞা যথাযথভাবে লেখা হয়েছে।\n(খ) বৈজ্ঞানিক নীতির ভিত্তিতে ব্যাখ্যাকরণ।\n(গ) প্রদত্ত সমীকরণ ব্যবহার করে সমাধান সম্পন্ন হয়েছে।\n(ঘ) বাস্তব পরিবেশের সাথে তত্ত্বের যথার্থতা বিশ্লেষণ।',
          examHistory: [{ institute: 'চট্টগ্রাম বোর্ড', year: 2023 }],
          institutes: ['চট্টগ্রাম বোর্ড'],
          years: [2023],
          difficulty: 'medium',
        },
      ];
    } else if (section.id === 'ka_bhandar') {
      return [
        {
          id: `ka_1`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} অধ্যায়ের মূল ভিত্তি বা মৌলিক নীতিটির সংজ্ঞা দাও।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 1,
          explanation:
            'উত্তর: পাঠ্যবই অনুযায়ী—যে প্রাকৃতিক নিয়মের অধীনে উক্ত প্রক্রিয়াটি অপরিবর্তিত থাকে এবং নির্দিষ্ট শর্তাধীনে কার্যকারিতা প্রদর্শন করে, তাকেই উক্ত মূল নীতি বলা হয়।',
          examHistory: [{ institute: 'ঢাকা বোর্ড', year: 2023 }],
          institutes: ['ঢাকা বোর্ড'],
          years: [2023],
          difficulty: 'easy',
        },
        {
          id: `ka_2`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} সম্পর্কিত প্রধান একক বা ধ্রুবকের মান কত?${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 1,
          explanation:
            'উত্তর: এস.আই (SI) পদ্ধতিতে এর প্রমিত একক এবং ধ্রুবকটির আন্তর্জাতিক মান নির্ধারিত সূত্রে সংজ্ঞায়িত।',
          examHistory: [{ institute: 'রাজশাহী বোর্ড', year: 2022 }],
          institutes: ['রাজশাহী বোর্ড'],
          years: [2022],
          difficulty: 'easy',
        },
        {
          id: `ka_3`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} অধ্যায়ে উল্লেখিত প্রধান সূত্রটি বিবৃতি করো।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 1,
          explanation:
            'উত্তর: নির্দিষ্ট তাপমাত্রা ও চাপে কোনো নির্দিষ্ট ব্যবস্থার ফলাফল সর্বদা তার কার্যকরী প্রভাবকের সমানুপাতিক।',
          examHistory: [{ institute: 'যশোর বোর্ড', year: 2023 }],
          institutes: ['যশোর বোর্ড'],
          years: [2023],
          difficulty: 'easy',
        },
      ];
    } else if (section.id === 'kha_bhandar') {
      return [
        {
          id: `kha_1`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} অধ্যায়ের ঘটনাটি দৈনন্দিন জীবনে কীভাবে কার্যকর ব্যাখ্যা করো।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 2,
          explanation:
            'মূল বক্তব্য: এটি মূলত পারস্পরিক মিথস্ক্রিয়া এবং শক্তির রূপান্তরের ফলেই সংঘটিত হয়।\n\nব্যাখ্যা: কারণ যখন বাহ্যিক প্রভাবক কাজ করে, তখন অভ্যন্তরীণ প্রতিরোধ বল বিপরীতমুখী প্রতিক্রিয়া সৃষ্টি করে সাম্যাবস্থা রক্ষা করে।',
          examHistory: [{ institute: 'ঢাকা বোর্ড', year: 2023 }],
          institutes: ['ঢাকা বোর্ড'],
          years: [2023],
          difficulty: 'medium',
        },
        {
          id: `kha_2`,
          subject: displayTitle,
          chapter: chapterName,
          question: `উষ্ণতা বৃদ্ধিতে ${chapterName} সংশ্লিষ্ট মানটির পরিবর্তন ঘটে কেন? ব্যাখ্যা করো।${topicSnippet}`,
          options: [],
          correctAnswerIndex: 0,
          points: 2,
          explanation:
            'মূল বক্তব্য: তাপশক্তি বৃদ্ধির সাথে সাথে কণাগুলোর গতিশক্তি বৃদ্ধি পায়।\n\nব্যাখ্যা: তাপমাত্রা বৃদ্ধি পেলে আন্তঃআণবিক আকর্ষণ বল হ্রাস পায় এবং কণাগুলোর স্পন্দন বৃদ্ধি পেয়ে সামগ্রিক রোধ বা ঘনত্ব হ্রাস পায়।',
          examHistory: [{ institute: 'দিনাজপুর বোর্ড', year: 2022 }],
          institutes: ['দিনাজপুর বোর্ড'],
          years: [2022],
          difficulty: 'medium',
        },
      ];
    } else {
      // MCQ
      return [
        {
          id: `mcq_1`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} সম্পর্কিত নিচের কোন বিবৃতিটি সঠিক?${topicSnippet}`,
          options: [
            'এটি একটি মৌলিক ভেক্টর রাশি',
            'এর মান সর্বদা ধনাত্মক ও অপরিবর্তনীয়',
            'প্রযুক্ত বলের সাথে এর সম্পর্ক সরলরেখিক',
            'উপরের সবগুলোই সঠিক',
          ],
          correctAnswerIndex: 2,
          points: 1,
          explanation:
            'সঠিক উত্তর (গ)। কারণ পাঠ্যবই অনুযায়ী বলের প্রয়োগে নির্দিষ্ট শর্ত সাপেক্ষে সম্পর্কটি সরাসরি সরলরেখিক বৃদ্ধি নির্দেশ করে।',
          examHistory: [{ institute: 'ঢাকা বোর্ড', year: 2023 }],
          institutes: ['ঢাকা বোর্ড'],
          years: [2023],
          difficulty: 'medium',
        },
        {
          id: `mcq_2`,
          subject: displayTitle,
          chapter: chapterName,
          question: `${chapterName} অধ্যায়ে এস.আই (SI) একক নিচের কোনটি?${topicSnippet}`,
          options: [
            'kg m s⁻¹',
            'N m⁻²',
            'J s⁻¹',
            'W m⁻¹ K⁻¹',
          ],
          correctAnswerIndex: 1,
          points: 1,
          explanation:
            'সঠিক উত্তর (খ)। প্রতি একক ক্ষেত্রফলে লম্বভাবে প্রযুক্ত বলের জন্য প্রমিত এস.আই একক হলো N m⁻² (প্যাসকেল)।',
          examHistory: [{ institute: 'বুয়েট', year: 2022 }],
          institutes: ['বুয়েট'],
          years: [2022],
          difficulty: 'medium',
        },
      ];
    }
  }, [displayTitle, section.id, currentChapter, topics, selectedTopicId]);

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#101012] font-['HindSiliguri',sans-serif] select-none pb-24">
      {/* ── Top Header ── */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-md px-4 py-3 sm:py-4 flex items-center border-b border-neutral-200 dark:border-[#27272A] shadow-xs relative">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer active:scale-95 shadow-xs shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="stroke-[2.5]" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-xl text-neutral-900 dark:text-white tracking-tight">
            {displayTitle} - {section.title}
          </h1>
        </div>
      </div>

      {/* ── Sticky Filter Dropdowns Bar ── */}
      <div className="sticky top-[61px] sm:top-[73px] z-30 bg-white dark:bg-[#000000] px-4 py-2.5 border-b border-neutral-100 dark:border-[#27272A] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Chapter Filter Dropdown */}
          <div className="relative flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center absolute left-2 pointer-events-none ${
              selectedChapterId !== 'all'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }`}>
              <BookOpen size={13} />
            </div>
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setSelectedTopicId('all');
              }}
              className={`w-full pl-11 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-full border appearance-none cursor-pointer transition ${
                selectedChapterId !== 'all'
                  ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#141416] text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <option value="all">সকল অধ্যায়</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  অধ্যায়: {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-neutral-400 pointer-events-none" />
          </div>

          {/* Topic Filter Dropdown */}
          <div className="relative flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center absolute left-2 pointer-events-none ${
              selectedTopicId !== 'all'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }`}>
              <ListFilter size={13} />
            </div>
            <select
              value={selectedTopicId}
              disabled={selectedChapterId === 'all' || topics.length === 0}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className={`w-full pl-11 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-full border appearance-none cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedTopicId !== 'all'
                  ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#141416] text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <option value="all">সকল টপিক</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  টপিক: {t.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Questions List Content ── */}
      <div className="px-4 py-4 sm:py-6 space-y-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-[#1E1E22] flex items-center justify-center mb-3">
              <FileQuestion size={28} className="text-neutral-400" />
            </div>
            <h3 className="font-['Anek_Bangla',sans-serif] font-bold text-lg text-neutral-800 dark:text-neutral-200 mb-1">
              কোনো প্রশ্ন পাওয়া যায়নি
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mb-4">
              নির্বাচিত অধ্যায় বা টপিকে এই মুহূর্তে কোনো প্রশ্ন নেই। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedChapterId('all');
                setSelectedTopicId('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <RotateCcw size={13} />
              সকল প্রশ্ন দেখুন
            </button>
          </div>
        ) : (
          questions.map((q, idx) => {
            if (section.id === 'mcq') {
              const isAnswered = userAnswers[q.id] !== undefined;
              return (
                <div key={q.id}>
                  <QuestionCard
                    question={q as Question}
                    serialNumber={idx + 1}
                    selectedOptionIndex={userAnswers[q.id]}
                    showFeedback={isAnswered}
                    showAnswer={false}
                    readOnly={isAnswered}
                    hideMetadata={false}
                    onSelectOption={(optIdx) => {
                      setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                    }}
                  />
                </div>
              );
            } else if (section.id === 'cq') {
              const isExpanded = expandedSolutions.has(q.id);
              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200 dark:border-[#27272A] shadow-xs overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-[#27272A]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 font-['Anek_Bangla',sans-serif] font-bold text-xs text-neutral-800 dark:text-neutral-200">
                        {idx + 1} নং সৃজনশীল প্রশ্ন
                      </span>
                      {q.examHistory && q.examHistory.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
                          {q.examHistory[0].institute} &apos;{q.examHistory[0].year.toString().slice(-2)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">পূর্ণমান: ১০</span>
                  </div>

                  {/* Stem / Stimulus */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                      <FileText size={14} />
                      উদ্দীপক:
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E22] border border-neutral-200 dark:border-[#2E2E33] text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 font-medium">
                      {q.question}
                    </div>

                    {/* Sub Questions */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
                        <span>(ক) জ্ঞানমূলক প্রশ্ন</span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">১ নম্বর</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
                        <span>(খ) অনুধাবনমূলক প্রশ্ন</span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">২ নম্বর</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
                        <span>(গ) প্রয়োগমূলক গাণিতিক সমস্যা</span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">৩ নম্বর</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
                        <span>(ঘ) উচ্চতর দক্ষতামূলক বিশ্লেষণ</span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">৪ নম্বর</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Solution Button */}
                  <button
                    type="button"
                    onClick={() => toggleSolution(q.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-neutral-50 dark:bg-[#1E1E22] border-t border-neutral-100 dark:border-[#27272A] text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={14} />
                      {isExpanded ? 'সমাধান লুকান' : 'পূর্ণাঙ্গ উত্তর ও সমাধান দেখুন'}
                    </div>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-[#FAF7F2] dark:bg-[#141416] text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line border-t border-neutral-200 dark:border-[#27272A]">
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            } else {
              // ক প্রশ্নাবলী ও খ প্রশ্নাবলী
              const isKa = section.id === 'ka_bhandar';
              const isExpanded = expandedSolutions.has(q.id);

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200 dark:border-[#27272A] shadow-xs overflow-hidden"
                >
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-100 dark:border-[#27272A]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isKa
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isKa ? `${idx + 1}. জ্ঞানমূলক প্রশ্ন` : `${idx + 1}. অনুধাবনমূলক প্রশ্ন`}
                      </span>
                      {q.examHistory && q.examHistory.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800">
                          {q.examHistory[0].institute} &apos;{q.examHistory[0].year.toString().slice(-2)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                      title="রিপোর্ট করুন"
                    >
                      <Flag size={13} />
                    </button>
                  </div>

                  <div className="p-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {q.question}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSolution(q.id)}
                    className="w-full px-4 py-2 flex items-center justify-between bg-neutral-50 dark:bg-[#1E1E22] border-t border-neutral-100 dark:border-[#27272A] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <Lightbulb
                        size={14}
                        className={isKa ? 'text-blue-600' : 'text-emerald-600'}
                      />
                      <span>{isExpanded ? 'উত্তর সংক্ষেপ করুন' : 'উত্তর ও ব্যাখ্যা দেখুন'}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-[#FAF7F2] dark:bg-[#141416] text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line border-t border-neutral-200 dark:border-[#27272A]">
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
