'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  FileQuestion,
  Wrench,
  MessageCircle,
} from 'lucide-react';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const faqs = [
    {
      category: 'General',
      question: 'Obhyash অ্যাপটি কি সম্পূর্ণ ফ্রি?',
      answer:
        "আমাদের একটি 'বেসিক' প্ল্যাও আছে যা সম্পূর্ণ ফ্রি। এর মাধ্যমে আপনি প্রতিদিন ১টি পরীক্ষা দিতে পারবেন এবং বেসিক ফিচারগুলো ব্যবহার করতে পারবেন। তবে আনলিমিটেড এক্সাম, OMR স্ক্যাও এবং অ্যাডভান্সড এনালাইসিসের জন্য প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন।",
    },
    {
      category: 'Exam',
      question: 'OMR স্ক্যাও ফিচারটি কিভাবে কাজ করে?',
      answer:
        'খুবই সহজ! প্রথমে আপনি অ্যাপ থেকে প্রশ্ন দেখে বা প্রশ্নপত্র ডাউনলোড করে খাতায় পরীক্ষা দিন। এরপর অ্যাপের "OMR Scan" অপশনে গিয়ে আপনার উত্তরপত্রের ছবি তোলো। আমাদের AI মাত্র কয়েক সেকেন্ডে আপনার খাতা যাচাই করে নির্ভুল ফলাফল এবং বিস্তারিত সমাধান দেখিয়ে দিবে।',
    },
    {
      category: 'Account',
      question: 'আমি কি একাধিক ডিভাইস থেকে ব্যবহার করতে পারবো?',
      answer:
        'হ্যাঁ, আপনি একই একাউন্ট দিয়ে মোবাইল, ট্যাবলেট বা ল্যাপটপ - যেকোনো ডিভাইস থেকে লগইন করতে পারবেন। আপনার সব ডাটা সব ডিভাইসে সিঙ্ক করা থাকবে।',
    },
    {
      category: 'Payment',
      question: 'পেমেন্ট পদ্ধতি কি কি?',
      answer:
        'বর্তমানে আমরা বিকাশ (bKash), নগদ (Nagad) এবং রকেটের (Rocket) মাধ্যমে পেমেন্ট গ্রহণ করছি। অ্যাপের সাবস্ক্রিপশন পেজ থেকে সরাসরি পেমেন্ট করা যাবে।',
    },
    {
      category: 'Exam',
      question: 'প্রশ্নগুলো কি সিলেবাস অনুযায়ী তৈরি?',
      answer:
        'অবশ্যই! আমাদের সব প্রশ্ন সর্বশেষ NCTB সিলেবাস এবং বোর্ড পরীক্ষার মানবন্টন অনুযায়ী তৈরি করা হয়েছে। আমাদের এক্সপার্ট টিচার প্যাওেল এবং AI প্রতিনিয়ত প্রশ্ন ব্যাংক আপডেট করে।',
    },
    {
      category: 'Payment',
      question: 'সাবস্ক্রিপশন কি ক্যাও্সেল করা যায়?',
      answer:
        'Obhyash এ অটো-রিনিউয়াল সিস্টেম নেই, তাই সাবস্ক্রিপশন ক্যাও্সেল করার ঝামেলা নেই। মেয়াদ শেষ হলে আপনার প্যাকেজ স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যাওে চলে আসবে, যতক্ষণ না আপনি পুনরায় রিনিউ করছেন।',
    },
    {
      category: 'Tech',
      question: 'অ্যাপ কাজ না করলে বা সমস্যা হলে কি করবো?',
      answer:
        'যেকোনো টেকনিক্যাল সমস্যায় আমাদের অ্যাপের "হেল্প" অপশন থেকে রিপোর্ট করতে পারেন। অথবা সরাসরি আমাদের সাপোর্ট ইমেইলে (support@obhyash.com) স্ক্রিনশটসহ মেইল করো।',
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-red-500/20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-red-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-serif-exam">
              অভ্যাস
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম-এ ফিরে যাও
          </Link>
        </div>
      </header>

      {/* Hero with Search */}
      <section className="relative py-20 bg-white dark:bg-slate-900 border-b border-red-100 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] dark:opacity-[0.1]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            আমরা কীভাবে সাহায্য করতে পারি?
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="আপনার প্রশ্ন লেখো... (যেমন: পেমেন্ট, লগইন)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-red-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-red-500/5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Categories Row (Visual Only) */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { label: 'একাউন্ট', icon: User },
              { label: 'এক্সাম', icon: FileQuestion },
              { label: 'পেমেন্ট', icon: CreditCard },
              { label: 'টেকনিক্যাল', icon: Wrench },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-bold text-slate-600 dark:text-slate-400 select-none cursor-default"
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                    openIndex === idx
                      ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 shadow-lg shadow-red-500/5'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span
                      className={`font-bold text-lg ${
                        openIndex === idx
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {faq.question}
                    </span>
                    {openIndex === idx ? (
                      <ChevronUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === idx
                        ? 'max-h-96 pb-6 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  কোনো প্রশ্ন খুঁজে পাওয়া যায়নি। অন্য কিছু লিখে খুঁজুন।
                </p>
              </div>
            )}
          </div>

          <div className="mt-16 bg-gradient-to-r from-red-600 to-red-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl shadow-red-500/30 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">আরও প্রশ্ন আছে?</h3>
              <p className="mb-6 text-red-100 max-w-lg mx-auto">
                আপনার প্রশ্নের উত্তর এখানে না পেলে আমাদের সাপোর্ট টিমের সাথে
                সরাসরি কথা বলুন।
              </p>
              <a
                href="mailto:support@obhyash.com"
                className="inline-flex px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
              >
                আমাদের মেইল করো
              </a>
            </div>
            {/* Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-8 border-t border-red-100 dark:border-slate-800 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Obhyash Platform. All rights reserved.
      </footer>
    </div>
  );
}
