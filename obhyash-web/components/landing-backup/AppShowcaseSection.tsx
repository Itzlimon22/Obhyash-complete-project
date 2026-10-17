'use client';

import React from 'react';
import {
  Smartphone,
  Star,
  CheckCircle2,
  Sparkles,
  Zap,
  Download,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { GooglePlayButton, PLAY_STORE_URL } from './GooglePlayButton';

export const AppShowcaseSection: React.FC = () => {
  return (
    <section
      id="app-download"
      className="relative py-16 sm:py-24 md:py-28 overflow-hidden z-10"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-[#0f1714] to-[#070b09] border border-emerald-500/25 p-6 sm:p-10 md:p-14 lg:p-16 shadow-2xl shadow-emerald-950/40 overflow-hidden">
          
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* ── LEFT: Content & Badges ── */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Live Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>গুগল প্লে স্টোরে এখন এভেইলেবল • Android App</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-400/20 text-white text-[10px] font-black">
                  NEW
                </span>
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  পকেটে রাখো সম্পূর্ণ প্রশ্নব্যাংক <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                    Obhyash Mobile App
                  </span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  যেকোনো সময়, যেকোনো জায়গায় রিয়েল টাইমার দিয়ে মডেল টেস্ট দাও। মূল পাঠ্যবই রেফারেন্সসহ নিখুঁত সমাধান এবং অফলাইন সূত্র রিভিশন করো সম্পূর্ণ ফ্রিতে।
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">রিয়েল এক্সাম টাইমার</h4>
                    <p className="text-[11px] text-neutral-400">পরীক্ষার হলের নিখুঁত চাপ ও টাইম ম্যানেজমেন্ট</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">২,০০,০০০+ প্রশ্নব্যাংক</h4>
                    <p className="text-[11px] text-neutral-400">HSC, ভার্সিটি ও মেডিকেল ভর্তি প্রশ্ন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">স্মার্ট মিস্টেক নোটবুক</h4>
                    <p className="text-[11px] text-neutral-400">ভুল প্রশ্নগুলো অটোমেটিক সেভ ও রিভিশন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">১০০% ফ্রি প্র্যাকটিস</h4>
                    <p className="text-[11px] text-neutral-400">অযাচিত অ্যাড ছাড়া বাধাহীন স্টাডি এক্সপেরিয়েন্স</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Desktop QR Code */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
                <GooglePlayButton variant="hero" />

                {/* Rating Badge */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-black text-white">৪.৯ / ৫.০ রেটিং</div>
                    <div className="text-[10px] text-neutral-400">Google Play Store Reviews</div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Realistic Mobile Phone Mockup ── */}
            <div className="lg:col-span-5 flex justify-center relative">
              
              {/* Outer Decorative Rings */}
              <div className="absolute inset-0 -m-8 rounded-full border border-emerald-500/15 animate-pulse pointer-events-none" />

              {/* Phone Frame */}
              <div className="w-[280px] sm:w-[310px] rounded-[42px] p-3 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black border-2 border-neutral-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] relative">
                
                {/* Speaker Grill & Camera Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-neutral-900 mr-2" />
                  <div className="w-8 h-1 rounded-full bg-neutral-800" />
                </div>

                {/* Inner Screen */}
                <div className="w-full bg-[#0d0f12] rounded-[34px] p-4 pt-10 text-left space-y-3.5 overflow-hidden border border-neutral-800/60 font-sans">
                  
                  {/* Mock App Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-black text-white">অভ্যাস (Obhyash)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      ● LIVE EXAM
                    </span>
                  </div>

                  {/* Mock Timer & Progress */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px]">
                    <span className="text-neutral-400">সময় বাকি: <strong className="text-emerald-400 font-mono">18:45</strong></span>
                    <span className="text-neutral-400">প্রশ্ন: <strong className="text-white font-mono">14/25</strong></span>
                  </div>

                  {/* Mock Question Card */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="font-bold text-emerald-400">পদার্থবিজ্ঞান ১ম পত্র</span>
                      <span>DU-A 2023</span>
                    </div>
                    <p className="text-xs font-bold text-white leading-snug">
                      একটি তরঙ্গের দুটি বিন্দুর মধ্যে পথ পার্থক্য $\lambda/4$ হলে দশা পার্থক্য কত?
                    </p>

                    {/* Options */}
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700/60 text-[11px] text-neutral-300 flex items-center justify-between">
                        <span>ক) $\pi$</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-[11px] text-emerald-300 font-bold flex items-center justify-between shadow-xs">
                        <span>খ) $\pi / 2$</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700/60 text-[11px] text-neutral-300 flex items-center justify-between">
                        <span>গ) $2\pi$</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Streak Pill */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/30 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <span className="font-bold text-white">টানা ৭ দিনের স্টাডি স্ট্রিক!</span>
                    </div>
                    <span className="text-emerald-400 font-black">+150 XP</span>
                  </div>

                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 px-3.5 py-2 rounded-2xl bg-[#0c1410] border border-emerald-500/40 shadow-xl flex items-center gap-2 text-left z-20 backdrop-blur-md">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-white">Google Play Verified</div>
                  <div className="text-[9px] text-emerald-400 font-medium">Safe & Virus Free</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
