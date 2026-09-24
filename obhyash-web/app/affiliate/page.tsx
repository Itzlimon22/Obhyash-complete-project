'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Wallet,
  Share2,
  Users,
  CheckCircle2,
  Sparkles,
  Zap,
  ChevronDown,
  ShieldCheck,
  Gift,
  BarChart3,
  ExternalLink,
  Laptop,
  Check,
  BadgePercent,
  GraduationCap,
  Award,
} from 'lucide-react';

export default function AffiliatePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    { value: '১,২০০+', label: 'সক্রিয় পার্টনার' },
    { value: '৩৫% পর্যন্ত', label: 'ইনস্ট্যান্ট কমিশন' },
    { value: '৮,৫০০+ ৳', label: 'গড় মাসিক আয়' },
  ];

  const features = [
    {
      title: 'সহজ ও দ্রুত অনবোর্ডিং',
      desc: 'কোনো ফি বা জটিলতা ছাড়াই মাত্র ৩০ সেকেন্ডে অ্যাকাউন্ট চালু করে পেয়ে যান আপনার ব্যক্তিগত প্রোমো কোড ও সেলস ড্যাশবোর্ড।',
      icon: Users,
    },
    {
      title: 'রেডিমেড প্রমোশনাল সাপোর্ট',
      desc: 'মার্কেটিং নিয়ে দুশ্চিন্তা নেই—আমরা নিয়মিত আকর্ষণীয় ব্যানার, স্টাডি গাইড ও কন্টেন্ট সরবরাহ করি যা সহজেই শেয়ার করতে পারবেন।',
      icon: Sparkles,
    },
    {
      title: 'উভয় পক্ষের নিশ্চিত লাভ',
      desc: 'আপনার স্পেশাল কুপন কোড ব্যবহার করে সহপাঠীরা পাবে ইনস্ট্যান্ট ডিসকাউন্ট, আর প্রতি সফল এনরোলমেন্টে আপনার অ্যাকাউন্টে জমা হবে ক্যাশ কমিশন।',
      icon: BadgePercent,
    },
    {
      title: 'স্বচ্ছ ট্র্যাকিং ও দ্রুত পে-আউট',
      desc: 'লাইভ ড্যাশবোর্ডে রিয়েল-টাইম ক্লিক ও সেলস মনিটর করুন এবং বিকাশ, নগদ কিংবা রকেটে যেকোনো সময় সরাসরি টাকা তুলে নিন।',
      icon: BarChart3,
    },
  ];

  const targetAudiences = [
    {
      title: 'কলেজ ও বিশ্ববিদ্যালয় শিক্ষার্থী',
      desc: 'পড়াশোনার ক্ষতি না করে অবসর সময়ে বন্ধুদের গাইড করে নিজের পকেটমানি নিশ্চিত করুন।',
      icon: GraduationCap,
    },
    {
      title: 'ক্যাম্পাস অ্যাম্বাসেডর ও প্রতিনিধি',
      desc: 'নিজ কলেজ বা ভার্সিটিতে শিক্ষার্থীদের স্মার্ট প্র্যাকটিস টুল ব্যবহারের সুযোগ করে দিয়ে নেটওয়ার্ক বাড়ান।',
      icon: Award,
    },
    {
      title: 'স্টাডি গ্রুপ ও কমিউনিটি লিডার',
      desc: 'ফেসবুক বা মেসেঞ্জার স্টাডি গ্রুপের মেম্বারদের জন্য স্পেশাল ছাড় এনে দিন এবং গ্রুপ থেকেই আর্ন করুন।',
      icon: Share2,
    },
    {
      title: 'এডুকেশনাল মেন্টর ও সিনিয়র',
      desc: 'জুনিয়রদের সঠিক প্রস্তুতিতে সাহায্য করে তাদের সাফল্য নিশ্চিত করার পাশাপাশি আয় বৃদ্ধি করুন।',
      icon: ShieldCheck,
    },
  ];

  const steps = [
    {
      num: '০১',
      title: 'অ্যাকাউন্ট অ্যাক্টিভ করুন',
      desc: 'সম্পূর্ণ বিনামূল্যে সাইন আপ করে আপনার এক্সক্লুসিভ প্রোমো কুপন ও ইউনিক ট্র্যাকিং লিংক সংগ্রহ করুন।',
    },
    {
      num: '০২',
      title: 'সহপাঠী ও গ্রুপে শেয়ার করুন',
      desc: 'এইচএসসি ও ভর্তি পরীক্ষার্থী বন্ধুদের মাঝে অভ্যাসের কোয়ালিটি প্রশ্নব্যাংক ও লাইভ এক্সামের সুবিধাগুলো তুলে ধরুন।',
    },
    {
      num: '০৩',
      title: 'ইনস্ট্যান্ট কমিশন বুঝে নিন',
      desc: 'আপনার কোড বা লিংকে যেকোনো সাবস্ক্রিপশন সম্পন্ন হলেই সাথে সাথে আপনার ওয়ালেটে কমিশন ক্রেডিট হয়ে যাবে।',
    },
  ];

  const faqs = [
    {
      q: 'কে কে অভ্যাস পার্টনার প্রোগ্রামে যুক্ত হতে পারবে?',
      a: 'যেকোনো কলেজ বা বিশ্ববিদ্যালয়ের শিক্ষার্থী, ক্যাম্পাস অ্যাম্বাসেডর, স্টাডি গ্রুপের অ্যাডমিন কিংবা শিক্ষানুরাগী যে কেউ সম্পূর্ণ বিনামূল্যে যুক্ত হতে পারবেন। কোনো পূর্ব অভিজ্ঞতার প্রয়োজন নেই।',
    },
    {
      q: 'কমিশন কীভাবে নির্ধারিত হয় এবং কতদিন পর্যন্ত পাওয়া যাবে?',
      a: 'প্রতিটি সফল প্রিমিয়াম প্ল্যান ও টেস্ট প্যাক বিক্রয়ে সর্বোচ্চ ৩৫% পর্যন্ত আকর্ষণীয় সরাসরি ক্যাশ কমিশন দেওয়া হয়। আপনার রেফার করা শিক্ষার্থী পরবর্তীতে প্ল্যান রিনিউ করলেও নিয়মিত কমিশনের সুযোগ থাকে।',
    },
    {
      q: 'আয়ের টাকা কীভাবে এবং কত দ্রুত উইথড্র করা যায়?',
      a: 'আপনার অ্যাকাউন্টে নির্ধারিত ন্যূনতম ব্যালেন্স হলেই বিকাশ, নগদ কিংবা রকেটে তাৎক্ষণিক উইথড্র রিকোয়েস্ট করতে পারবেন। সাধারণত ২৪ ঘণ্টার মধ্যে পে-আউট সম্পন্ন করা হয়।',
    },
    {
      q: 'প্রচার করার জন্য কি কোনো অফিসিয়াল ম্যাটেরিয়াল দেওয়া হবে?',
      a: 'হ্যাঁ, আমাদের পার্টনার কমিউনিটিতে নিয়মিত হাই-কোয়ালিটি সোশ্যাল মিডিয়া পোস্টার, স্টাডি প্ল্যানার, শর্ট ভিডিও এবং শিক্ষার্থীদের আকৃষ্ট করার মতো প্রমোশনাল কন্টেন্ট সরবরাহ করা হয়।',
    },
    {
      q: 'আমার রেফারেল পারফরম্যান্স কীভাবে মনিটর করব?',
      a: 'লগইন করলেই আপনি একটি রিয়েল-টাইম ইন্টারেক্টিভ ড্যাশবোর্ড পাবেন, যেখানে মোট ক্লিক, রেজিস্ট্রেশন সংখ্যা, সফল সেলস এবং জমাকৃত ব্যালেন্স পুঙ্খানুপুঙ্খ দেখতে পারবেন।',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* ── Hero Section (No Navbar/Header) ── */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-14 sm:pb-28 border-b border-zinc-800/50">
        {/* Subtle glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar inside page (Badge + Register Button) */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>অভ্যাস পার্টনার নেটওয়ার্ক • স্টুডেন্ট ও ক্যাম্পাস পার্টনারশিপ</span>
            </div>

            <Link
              href="/affiliate/auth/register"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              রেজিস্ট্রেশন
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18]">
                পড়াশোনার পাশাপাশি স্বাবলম্বী হোন,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
                  ঘরে বসেই নিশ্চিত করুন
                </span>{' '}
                নিয়মিত আয়
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                সহপাঠীদের পড়াশোনায় সহায়তা করার পাশাপাশি অভ্যাসের প্রিমিয়াম এক্সাম ও প্র্যাকটিস প্যাক রেফার করে প্রতি বিক্রয়ে অর্জন করুন ২৫% থেকে ৩৫% পর্যন্ত সরাসরি ক্যাশ কমিশন!
              </p>

              {/* Stats Cards Row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="w-32 sm:w-36 p-4 rounded-2xl bg-[#0F1218]/90 border border-zinc-800/80 shadow-md text-left transition-all hover:border-emerald-500/40"
                  >
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button Row */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/affiliate/auth/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm sm:text-base transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>রেজিস্ট্রেশন করুন</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/70 text-slate-300 hover:text-white text-sm font-semibold transition-all"
                >
                  কার্যপদ্ধতি দেখুন
                </a>
              </div>
            </div>

            {/* Right Visual Dashboard Mockup Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#111622] to-[#0A0D14] border border-zinc-800/90 shadow-2xl">
                {/* Floating Badge */}
                <div className="absolute -top-3.5 -right-3.5 px-3 py-1 rounded-full bg-emerald-500 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg">
                  ৩৫% ইনস্ট্যান্ট শেয়ার
                </div>

                <div className="space-y-6">
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">উপার্জিত মোট ব্যালেন্স</div>
                        <div className="text-xl font-extrabold text-white">৳ ১৪,২০০.০০</div>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      সক্রিয় পার্টনার
                    </span>
                  </div>

                  {/* Performance Indicators */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5 text-teal-400" />
                        লিংক ভিজিটর
                      </span>
                      <span className="font-bold text-white">৪,১২০ জন</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        সফল সাবস্ক্রিপশন
                      </span>
                      <span className="font-bold text-white">৩১২ জন</span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
                      <span className="text-slate-400 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        সফলতা হার
                      </span>
                      <span className="font-bold text-emerald-400">৮.৪% (টপ টিয়ার)</span>
                    </div>
                  </div>

                  {/* Quick Referral Link Box */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                      <span>আপনার এক্সক্লুসিভ কোড</span>
                      <span className="text-emerald-400 font-semibold">১৫% ফ্রেন্ড ডিসকাউন্ট</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-300">
                      <span className="truncate">obhyash.com/join?code=PARTNER_PRO</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 ml-2">
                        কপি লিংক
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Feature Cards Section (Rewritten in Unique Obhyash Voice) ── */}
      <section className="py-16 sm:py-24 bg-[#0A0D14]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              কেন অভ্যাসের সাথে কাজ করবেন?
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              স্বচ্ছ ও আধুনিক পার্টনারশিপ সিস্টেম—যেখানে আপনার প্রতিটি প্রচেষ্টার সঠিক মূল্যায়ন নিশ্চিত।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-zinc-800/90 hover:border-emerald-500/40 transition-all duration-300 shadow-xl group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight pt-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Target Audience Section ── */}
      <section className="py-16 sm:py-24 border-t border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              উপযুক্ত সুযোগ
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              কাদের জন্য এই পার্টনারশিপ সবচেয়ে কার্যকর?
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              আপনি শিক্ষার্থী হোন বা কন্টেন্ট ক্রিয়েটর—আমাদের প্রোগ্রাম সবার জন্য উন্মুক্ত
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudiences.map((audience, idx) => {
              const Icon = audience.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-[#0D1017] border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {audience.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {audience.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3 Simple Steps ── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#0A0D14]/70 border-t border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              কার্যপদ্ধতি
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              কীভাবে শুরু করবেন?
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              মাত্র ৩টি সহজ ধাপে শুরু হতে পারে আপনার সম্মানজনক ইনকামের পথচলা
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative p-6 sm:p-8 rounded-3xl bg-[#0D1017] border border-zinc-800/80 space-y-4 hover:border-emerald-500/30 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-emerald-500/30 font-mono">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-16 sm:py-24 border-t border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <p className="text-sm text-slate-400">
              পার্টনারশিপ প্রোগ্রাম সম্পর্কিত সাধারণ প্রশ্নের উত্তর
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0F131C] border border-zinc-800/90 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="font-bold text-sm sm:text-base text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-1 text-sm text-slate-400 leading-relaxed border-t border-zinc-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom Call To Action ── */}
      <section className="py-16 sm:py-24 border-t border-zinc-800/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            আজই যুক্ত হোন আমাদের পার্টনার কমিউনিটিতে
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            কোনো আগাম খরচের প্রয়োজন নেই। স্মার্টফোনের মাধ্যমেই সহপাঠীদের সাথে কোয়ালিটি রিসোর্স শেয়ার করুন এবং আপনার নিয়মিত বাড়তি ইনকাম নিশ্চিত করুন।
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/affiliate/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm sm:text-base transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95"
            >
              রেজিস্ট্রেশন করে শুরু করুন
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
