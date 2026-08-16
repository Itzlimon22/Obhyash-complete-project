'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  Mail,
} from 'lucide-react';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = ['সব', 'পরীক্ষা', 'পেমেন্ট', 'অ্যাকাউন্ট'];

  const faqs = [
    {
      category: 'পরীক্ষা',
      question: 'স্মার্ট ওএমআর (OMR) স্ক্যানার কীভাবে কাজ করে?',
      answer:
        'Obhyash ওএমআর শিট প্রিন্ট করে সাধারণ বলপেন দিয়ে বৃত্ত ভরাট করো। এরপর অ্যাপের ওএমআর স্ক্যানার দিয়ে শিটের ছবি তুললেই ১-২ সেকেন্ডে প্রতিটি বৃত্ত নির্ভুলভাবে মূল্যায়ন করে বিস্তারিত মার্কস ও র‍্যাংক জানিয়ে দেওয়া হবে।',
    },
    {
      category: 'পরীক্ষা',
      question: 'নেগেটিভ মার্কিং কীভাবে হিসাব করা হয়?',
      answer:
        'বোর্ড এবং মেডিকেল/ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার আসল নিয়ম অনুসারে প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হয়। সঠিক উত্তরের জন্য নির্ধারিত পূর্ণমান যোগ হয়।',
    },
    {
      category: 'পরীক্ষা',
      question: 'ইন্টারনেট ছাড়া কি অফলাইনে পরীক্ষা দেওয়া যায়?',
      answer:
        'হ্যাঁ! একবার পরীক্ষার প্রশ্নপত্র লোড হয়ে গেলে ইন্টারনেট সংযোগ বিচ্ছিন্ন হলেও তুমি নিরবচ্ছিন্নভাবে পরীক্ষা শেষ করতে পারবে। ইন্টারনেট পাওয়ার সাথে সাথে ফলাফল স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়ে যাবে।',
    },
    {
      category: 'পেমেন্ট',
      question: 'ফ্রি এবং প্রিমিয়ামের মধ্যে পার্থক্য কী?',
      answer:
        'ফ্রি প্ল্যানে প্রতিদিন নির্দিষ্ট সংখ্যক পরীক্ষা ও বেসিক ফিচার ব্যবহার করা যায়। অন্যদিকে প্রিমিয়ামে রয়েছে আনলিমিটেড মক টেস্ট, সীমাহীন ওএমআর স্ক্যানিং, AI বিস্তারিত ব্যাখ্যা ও ন্যাশনাল লিডারবোর্ড র‍্যাংকিং।',
    },
    {
      category: 'পেমেন্ট',
      question: 'পেমেন্ট করার কতক্ষণ পর প্রিমিয়াম সক্রিয় হয়?',
      answer:
        'বিকাশ বা নগদ নম্বর থেকে টাকা পাঠানোর পর সঠিক Transaction ID (TrxID) অ্যাপে সাবমিট করলে আমাদের অ্যাডমিন প্যানেল দ্রুততম সময়ে ভেরিফাই করে সাবস্ক্রিপশন সক্রিয় করে দেয়।',
    },
    {
      category: 'পেমেন্ট',
      question: 'কোনো অটো-রিনিউয়াল বা গোপন চার্জ আছে কি?',
      answer:
        'না! Obhyash-এ কোনো হিডেন চার্জ বা অটো-রিনিউয়াল সিস্টেম নেই। নির্দিষ্ট মেয়াদের (৩০ দিন / ৯০ দিন) পর সাবস্ক্রিপশন শেষ হলে স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে।',
    },
    {
      category: 'অ্যাকাউন্ট',
      question: 'আমি কি একাধিক ফোন বা ল্যাপটপ থেকে ব্যবহার করতে পারব?',
      answer:
        'হ্যাঁ, তুমি তোমার রেজিস্টার্ড ফোন নম্বর/ইমেইল দিয়ে যেকোনো ডিভাইস থেকে লগইন করতে পারবে। তবে প্ল্যাটফর্মের ফেয়ার ইউজ পলিসি অনুযায়ী আইডি অন্যের সাথে শেয়ার করা সম্পূর্ণ নিষিদ্ধ।',
    },
    {
      category: 'অ্যাকাউন্ট',
      question: 'প্রোফাইল তথ্য বা লক্ষ্য (Target) পরিবর্তন করা যায়?',
      answer:
        'অবশ্যই! সেটিংস ➔ ব্যক্তিগত তথ্য পেজে গিয়ে যেকোনো সময় তোমার নাম, শিক্ষা প্রতিষ্ঠান, ব্যাচ ও টার্গেট (মেডিকেল/ইঞ্জিনিয়ারিং/ভার্সিটি) পরিবর্তন করতে পারবে।',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'সব' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] font-sans selection:bg-emerald-500/20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 dark:bg-[#09090B]/80 border-b border-slate-200 dark:border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-serif-exam">
              Obhyash (অভ্যাস)
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম-এ ফিরে যাও
          </Link>
        </div>
      </header>

      {/* Hero with Search */}
      <section className="relative py-16 bg-white dark:bg-[#121215] border-b border-slate-200 dark:border-[#27272A]">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl border border-emerald-500/20">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 font-serif-exam">
            কীভাবে সাহায্য করতে পারি?
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            প্রয়োজনীয় প্রশ্নের উত্তর বা সরাসরি সাহায্য নিতে নিচের অপশনগুলো দেখুন।
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="প্রশ্ন খুঁজুন... (যেমন: ওএমআর, পেমেন্ট, রেজাল্ট)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] shadow-lg shadow-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white text-sm md:text-base"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Quick Support Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <Link
              href="/complaint"
              className="p-5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-emerald-500/40 hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  অভিযোগ ও মতামত
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  অ্যাপ সংক্রান্ত সমস্যা বা মতামত পাঠাও
                </p>
              </div>
            </Link>

            <a
              href="mailto:support@obhyash.com"
              className="p-5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-emerald-500/40 hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  ইমেইল সাপোর্ট
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  support@obhyash.com
                </p>
              </div>
            </a>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">
              ক্যাটাগরি:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOpenIndex(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-slate-400 hover:border-emerald-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    openIndex === idx
                      ? 'bg-white dark:bg-[#18181B] border-emerald-500/40 shadow-sm'
                      : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] hover:border-emerald-500/30'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span
                      className={`font-bold text-base md:text-lg ${
                        openIndex === idx
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {faq.question}
                    </span>
                    {openIndex === idx ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                  <div
                    className={`px-5 overflow-hidden transition-all duration-200 ease-in-out ${
                      openIndex === idx
                        ? 'max-h-96 pb-5 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-[#27272A] pt-4 text-sm md:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A]">
                <p className="text-slate-500 text-sm">
                  কোনো প্রশ্ন খুঁজে পাওয়া যায়নি।
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#121215] py-8 border-t border-slate-200 dark:border-[#27272A] text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Obhyash Platform. All rights reserved.
      </footer>
    </div>
  );
}
