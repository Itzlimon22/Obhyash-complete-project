'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    category: 'পরীক্ষা',
    question: 'নেগেটিভ মার্কিং কীভাবে হিসাব করা হয়?',
    answer:
      'বোর্ড এবং মেডিকেল/ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার আসল নিয়ম অনুসারে প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হয়। সঠিক উত্তরের জন্য নির্ধারিত পূর্ণমান যোগ হয়।',
  },
  {
    category: 'পরীক্ষা',
    question: 'ইন্টারনেট সংযোগ চলে গেলে কি পরীক্ষা দেওয়া যাবে?',
    answer:
      'হ্যাঁ! একবার পরীক্ষার প্রশ্নপত্র লোড হয়ে গেলে ইন্টারনেট সংযোগ বিচ্ছিন্ন হলেও তুমি নিরবচ্ছিন্নভাবে পরীক্ষা শেষ করতে পারবে। ইন্টারনেট সংযোগ পাওয়ার সাথে সাথে ফলাফল স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে যাবে।',
  },
  {
    category: 'পরীক্ষা',
    question: 'কাস্টম টেস্ট ও পূর্ণাঙ্গ মডেল টেস্টের মধ্যে পার্থক্য কী?',
    answer:
      'কাস্টম টেস্টে তুমি নিজের পছন্দমতো বিষয়, এক বা একাধিক অধ্যায় ও সময় বেছে নিয়ে পরীক্ষা দিতে পারবে। আর মডেল টেস্টে পূর্ণ সিলেবাসের উপর স্ট্যান্ডার্ড ৫০ বা ১০০ নম্বরের ফুল টেস্ট নেওয়া হয়।',
  },
  {
    category: 'পেমেন্ট',
    question: 'ফ্রি এবং প্রিমিয়ামের মধ্যে পার্থক্য কী?',
    answer:
      'ফ্রি প্ল্যানে প্রতিদিন নির্দিষ্ট সংখ্যক সাধারণ পরীক্ষা দেওয়া যায়। অন্যদিকে প্রিমিয়ামে রয়েছে আনলিমিটেড মক টেস্ট, প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা, স্মার্ট অ্যানালিটিক্স, ফর্মুলা ব্যাংক ও জাতীয় লাইভ মেধা তালিকা।',
  },
  {
    category: 'পেমেন্ট',
    question: 'পেমেন্ট করার কতক্ষণ পর প্রিমিয়াম সক্রিয় হয়?',
    answer:
      'বিকাশ, নগদ বা কার্ডের মাধ্যমে পেমেন্ট সফল হওয়ার সাথে সাথেই স্বয়ংক্রিয়ভাবে ও তাত্ক্ষণিকভাবে (Instant Activation) তোমার অ্যাকাউন্টে প্রিমিয়াম ফিচার আনলক হয়ে যাবে। কোনো অপেক্ষার প্রয়োজন নেই।',
  },
  {
    category: 'পেমেন্ট',
    question: 'কোনো অটো-রিনিউয়াল বা লুকানো চার্জ আছে কি?',
    answer:
      'না! Obhyash-এ কোনো হিডেন চার্জ বা অটো-রিনিউয়াল সিস্টেম নেই। নির্দিষ্ট মেয়াদের (যেমন: ১ মাস, ৩ মাস বা ৬ মাস) পর সাবস্ক্রিপশন শেষ হলে স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে ফিরে আসবে, অতিরিক্ত কোনো টাকা কাটা হবে না।',
  },
  {
    category: 'পেমেন্ট',
    question: 'কুপন কোড কীভাবে ব্যবহার করব?',
    answer:
      'পেমেন্ট বা সাবস্ক্রিপশন পেজে গিয়ে "কুপন আছে?" বাটনে ট্যাপ করো। এরপর চলতি অফার কুপন লিখে "কুপন যোগ করো" বাটনে ক্লিক করলেই সাথে সাথে নির্ধারিত ডিসকাউন্ট প্রযোজ্য হবে।',
  },
  {
    category: 'অ্যাকাউন্ট',
    question: 'আমি কি একাধিক ফোন বা ল্যাপটপ থেকে ব্যবহার করতে পারব?',
    answer:
      'হ্যাঁ, তুমি তোমার রেজিস্টার্ড মোবাইল নম্বর/ইমেইল দিয়ে যেকোনো স্মার্টফোন বা কম্পিউটার থেকে লগইন করতে পারবে। তবে প্ল্যাটফর্মের ফেয়ার ইউজ পলিসি অনুযায়ী আইডি অন্যের সাথে শেয়ার করা নিষিদ্ধ।',
  },
  {
    category: 'অ্যাকাউন্ট',
    question: 'ডেইলি স্ট্রিক কী এবং কীভাবে বজায় রাখব?',
    answer:
      'প্রতিদিন অন্তত ১টি পরীক্ষা বা রিভিশন সম্পন্ন করলে তোমার স্ট্রিক কাউন্ট ১ দিন করে বাড়বে। প্রতিদিনের অধ্যবসায় ধরে রাখতে স্ট্রিক অত্যন্ত কার্যকর ভূমিকা পালন করে।',
  },
  {
    category: 'অ্যাকাউন্ট',
    question: 'প্রোফাইল তথ্য বা লক্ষ্য (Target) পরিবর্তন করা যায়?',
    answer:
      'অবশ্যই! সেটিংস ➔ ব্যক্তিগত তথ্য পেজে গিয়ে যেকোনো সময় তোমার নাম, শিক্ষা প্রতিষ্ঠান, ব্যাচ ও টার্গেট (মেডিকেল/ইঞ্জিনিয়ারিং/ভার্সিটি) পরিবর্তন করতে পারবে।',
  },
];

interface FaqPanelProps {
  onNavigateComplaint?: () => void;
}

export const FaqPanel: React.FC<FaqPanelProps> = ({ onNavigateComplaint }) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = ['সব', 'পরীক্ষা', 'পেমেন্ট', 'অ্যাকাউন্ট'];

  const filteredList = FAQ_LIST.filter((item) => {
    const matchesCategory =
      selectedCategory === 'সব' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleComplaintClick = () => {
    if (onNavigateComplaint) {
      onNavigateComplaint();
    } else {
      router.push('/complaint');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Hero Search Header (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-7 rounded-[22px] bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] dark:from-[#1B2320] dark:to-[#121815] border border-[#059669]/20 dark:border-[#059669]/35 shadow-md shadow-[#059669]/10 text-center mb-5">
        <div className="w-14 h-14 rounded-full bg-[#059669]/12 dark:bg-[#059669]/25 border border-[#059669]/40 flex items-center justify-center text-[#10B981] mx-auto mb-3.5">
          <HelpCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
          কীভাবে সাহায্য করতে পারি?
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#A1A1AA] mt-1.5 leading-relaxed max-w-md mx-auto">
          প্রয়োজনীয় প্রশ্নের উত্তর বা সরাসরি সাহায্য নিতে নিচের অপশনগুলো দেখুন।
        </p>

        {/* Search Bar */}
        <div className="mt-4 relative max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedIndex(null);
            }}
            placeholder="প্রশ্ন খুঁজুন... (যেমন: ওএমআর, পেমেন্ট, রেজাল্ট)"
            className="w-full py-3 pl-10 pr-4 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#CBD5E1] dark:border-[#27272A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#71717A] focus:outline-none focus:border-[#059669] shadow-2xs font-semibold"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── 2. Quick Support Channels (1:1 with Flutter) ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5">
        <div
          onClick={handleComplaintClick}
          className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] cursor-pointer hover:border-[#059669]/40 transition-colors shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-[#0F172A] dark:text-white">
            অভিযোগ বক্স
          </h4>
          <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#A1A1AA] truncate mt-0.5">
            সমস্যার বিবরণ পাঠাও
          </p>
        </div>

        <a
          href="mailto:support@obhyash.com"
          className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] hover:border-[#3B82F6]/40 transition-colors shadow-2xs block group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Mail className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-black text-[#0F172A] dark:text-white">
            ইমেইল সাপোর্ট
          </h4>
          <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#A1A1AA] truncate mt-0.5">
            support@obhyash.com
          </p>
        </a>
      </div>

      {/* ── 3. Category Filter Chips (1:1 with Flutter) ── */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-[#475569] dark:text-[#A1A1AA] shrink-0">
          ক্যাটাগরি:
        </span>
        <div className="flex gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setExpandedIndex(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#004633] text-white border border-[#059669]'
                    : 'bg-white dark:bg-[#18181B] text-[#475569] dark:text-[#A1A1AA] border border-[#E2E8F0] dark:border-[#27272A] hover:bg-neutral-50 dark:hover:bg-[#202024]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. FAQ Accordion List (1:1 with Flutter) ── */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#18181B] rounded-[18px] border border-[#E2E8F0] dark:border-[#27272A]">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              কোনো প্রশ্ন পাওয়া যায়নি!
            </p>
          </div>
        ) : (
          filteredList.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-[16px] bg-white dark:bg-[#18181B] border transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-[#059669] shadow-xs'
                    : 'border-[#E2E8F0] dark:border-[#27272A]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#059669]/10 text-[#10B981] flex items-center justify-center font-black text-xs shrink-0">
                      ?
                    </div>
                    <span className="text-sm font-extrabold text-[#0F172A] dark:text-white leading-snug">
                      {item.question}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#10B981] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm text-[#334155] dark:text-[#D4D4D8] leading-relaxed animate-in fade-in duration-200">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FaqPanel;
