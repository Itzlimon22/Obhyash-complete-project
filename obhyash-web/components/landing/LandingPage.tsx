import Link from 'next/link';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GooglePlayButton } from './GooglePlayButton';
import { MobileAppInstallBanner } from './MobileAppInstallBanner';
import {
  User,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  ScanLine,
  History,
  Trophy,
  Swords,
  HelpCircle,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  CheckCircle2,
  Check,
  Download,
  Printer,
  CheckCheck,
  Smartphone,
  Laptop,
  RefreshCw,
  Menu,
  X,
  Flame,
  Facebook,
  Youtube,
  Target,
  Star,
  XCircle,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

interface PricingPlan {
  title: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  color: string;
  buttonColor: string;
  highlight?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin, // ✅ Log in
  isDarkMode,
  toggleTheme,
}) => {
  const marqueeRef = useRef<HTMLDivElement>(null);

  // --- Data Arrays ---

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    {
      title: 'ফ্রি',
      price: '০',
      period: '/চিরকাল',
      features: [
        'দৈনিক ২টি ফ্রি এক্সাম',
        'বেসিক অ্যানালিটিক্স',
        'সর্বোচ্চ ২৫টি বুকমার্ক',
        'ডেইলি স্ট্রাইক ও লিডারবোর্ড',
      ],
      cta: 'প্ল্যান নিন',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor: '',
    },
    {
      title: '১ মাস',
      price: '১৪৯',
      period: '/মাস',
      features: [
        'আনলিমিটেড এক্সাম',
        'বইয়ের রেফারেন্স সহ সমাধান',
        '২-কলাম প্রশ্ন ও উত্তরপত্র PDF',
        '৩-মেট্রিক অ্যানালাইসিস',
      ],
      cta: 'প্ল্যান নিন',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor: '',
    },
    {
      title: '৩ মাস',
      price: '২৯৯',
      period: '/৩ মাস',
      features: [
        'সব পেইড ফিচার আনলক',
        'বইয়ের রেফারেন্স সহ ব্যাখ্যা',
        'আনলিমিটেড অফলাইন PDF',
        '৪০% সেভ',
      ],
      cta: 'প্ল্যান নিন',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor: '',
    },
    {
      title: '৬ মাস',
      price: '৫৯৯',
      period: '/৬ মাস',
      highlight: true,
      features: [
        'সব পেইড ফিচার আনলক',
        'এইচএসসি ও এডমিশন প্রস্তুতি',
        'আনলিমিটেড বুকমার্ক ও রিভিশন',
        '৪৬% সেভ',
      ],
      cta: 'এই প্ল্যান নিন',
      color: 'border-[#22c55e]',
      buttonColor: '',
    },
    {
      title: '১২ মাস',
      price: '৯৯৯',
      period: '/বছর',
      features: [
        'সব পেইড ফিচার আনলক',
        'ফুল ইয়ার কমপ্লিট এক্সেস',
        'আনলিমিটেড অফলাইন PDF প্রিন্ট',
        '৫৮% সেভ',
      ],
      cta: 'প্ল্যান নিন',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor: '',
    },
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { getSubscriptionPlans } = await import('@/services/database');
        const plans = await getSubscriptionPlans();

        if (plans && plans.length > 0) {
          const mappedPlans = plans.map((plan) => {
            const days = plan.duration_days || 0;
            const isYearly =
              plan.name.toLowerCase().includes('year') ||
              plan.billingCycle === 'Yearly' ||
              days >= 180;
            const isQuarterly =
              plan.name.toLowerCase().includes('quarter') ||
              plan.billingCycle.includes('৩ মাস') ||
              (days >= 80 && days <= 120);
            const isMonthly =
              plan.name.toLowerCase().includes('month') ||
              plan.billingCycle === 'Monthly' ||
              plan.billingCycle === '/মাস' ||
              (days >= 28 && days <= 60);
            const isFree = plan.price === 0;

            let buttonColor =
              'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700';
            let color = 'border-neutral-200 dark:border-neutral-800';

            let dynamicFeatures = plan.features || [];
            if (!dynamicFeatures || dynamicFeatures.length === 0) {
              if (isFree) {
                dynamicFeatures = [
                  'দৈনিক ২টি প্র্যাকটিস এক্সাম',
                  'সর্বোচ্চ ২৫টি বুকমার্ক সংরক্ষণ',
                  'বেসিক ফলাফল স্কোরকার্ড',
                  'ডেইলি স্ট্রাইক ও লিডারবোর্ড',
                ];
              } else if (isMonthly) {
                dynamicFeatures = [
                  'সীমাহীন আনলিমিটেড এক্সাম',
                  'বইয়ের রেফারেন্স সহ বিস্তারিত সমাধান',
                  '২-কলাম প্রশ্ন ও উত্তরপত্র PDF প্রিন্ট',
                  '৩-মেট্রিক অ্যানালাইসিস ও নেগেটিভ হিসাব',
                ];
              } else if (isQuarterly || plan.isPopular) {
                dynamicFeatures = [
                  'সব প্রো ফিচার ৩ মাস আনলিমিটেড',
                  'বইয়ের রেফারেন্স সহ সম্পূর্ণ ব্যাখ্যা',
                  'আনলিমিটেড অফলাইন PDF ডাউনলোড',
                  '১০০% বিজ্ঞাপনমুক্ত পরিবেশ',
                ];
              } else {
                dynamicFeatures = [
                  'সব প্রো ফিচার ৬ মাস আনলিমিটেড',
                  'এইচএসসি ও পূর্ণাঙ্গ এডমিশন প্রস্তুতি',
                  'বইয়ের রেফারেন্স সহ ব্যাখ্যা PDF',
                  '১০০% বিজ্ঞাপনমুক্ত অভিজ্ঞতা',
                ];
              }
            }

            if (isMonthly) {
              buttonColor =
                'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30';
              color = 'border-emerald-500 ring-2 ring-emerald-500/20';
            } else if (isQuarterly || plan.isPopular) {
              buttonColor =
                'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/30';
              color = 'border-emerald-600 ring-2 ring-emerald-600/30';
            } else if (plan.price > 0) {
              buttonColor = 'bg-emerald-600 text-white hover:bg-emerald-700';
              color = 'border-emerald-500';
            }

            return {
              title: plan.name,
              price: plan.price.toString(),
              period:
                plan.billingCycle === 'Yearly'
                  ? '/বছর'
                  : plan.billingCycle === 'Monthly'
                    ? '/মাস'
                    : plan.billingCycle === 'Quarterly'
                      ? '/৩ মাস'
                      : plan.billingCycle,
              features: dynamicFeatures,
              cta: isFree ? 'বিনামূল্যে শুরু করো' : 'প্ল্যানটি বেছে নাও',
              highlight: plan.isPopular,
              color: color,
              buttonColor: buttonColor,
            };
          });
          setPricingPlans(mappedPlans);
        }
      } catch {
        // Silently use predefined plans so no console error is logged
      }
    };
    fetchPlans();
  }, []);

  const testimonials = [
    {
      name: 'আবরার মাহির',
      college: 'নটর ডেম কলেজ (NDC)',
      target: 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি',
      batch: 'HSC ’25',
      text: 'ভারী গাইড বই নিয়ে ঘণ্টার পর ঘণ্টা বসার চেয়ে অভ্যাসের চ্যাপ্টারওয়াইজ স্পিড টেস্ট অনেক বেশি কাজে দিয়েছে। বিশেষ করে ফিজিক্স আর হায়ার ম্যাথের নির্ভুল ব্যাখ্যা এবং ক্যালকুলেশন ট্রিকসগুলো পরীক্ষার হলে আমার কনফিডেন্স দ্বিগুণ করে দিয়েছে!',
      rating: 5,
      avatarBg: 'from-blue-600 to-indigo-700',
      initial: 'আ',
      verified: true,
    },
    {
      name: 'নুসরাত জাহান মীম',
      college: 'হলিক্রস কলেজ (HCC)',
      target: 'মেডিকেল ভর্তি পরীক্ষা (MAT)',
      batch: 'HSC ’25',
      text: 'মেডিকেলের জন্য টাইমিং আর নেগেটিভ মার্কিং নিয়ন্ত্রণ সবচেয়ে চ্যালেঞ্জিং। অভ্যাসে অপশন লক সিস্টেম আর এক্সাম হলের মতো টাইমার থাকায় আমার সিলি মিসটেক প্রায় শূন্যে নেমে এসেছে। বায়োলজির রেফারেন্সগুলো হুবহু মূল টেক্সটবইয়ের!',
      rating: 5,
      avatarBg: 'from-rose-600 to-pink-700',
      initial: 'নু',
      verified: true,
    },
    {
      name: 'তৌহিদুল ইসলাম',
      college: 'ঢাকা কলেজ',
      target: 'HSC বোর্ড ও ঢাবি "ক" ইউনিট',
      batch: 'HSC ’25',
      text: 'টেস্ট পরীক্ষার আগে রিভিশনের জন্য "মিস্টেক নোটবুক" ফিচারটা জাস্ট লাইফসেভার ছিল! যেসব প্রশ্ন আগে ভুল করতাম, সেগুলো আলাদা করে স্পেশাল টেস্ট দিতে পেরে দুর্বল চ্যাপ্টারগুলো খুব দ্রুত কভার হয়ে গেছে।',
      rating: 5,
      avatarBg: 'from-emerald-600 to-teal-700',
      initial: 'তৌ',
      verified: true,
    },
    {
      name: 'মেহজাবিন চৌধুরী',
      college: 'ভিকারুননিসা নূন কলেজ',
      target: 'মেডিকেল ও ডেন্টাল প্রস্তুতি',
      batch: 'HSC ’24',
      text: 'বাজারের গাইড বইগুলোতে প্রচুর ভুল উত্তর থাকে, যা নিয়ে সবসময় টেনশনে থাকতাম। অভ্যাসের প্রতিটা সলিউশনে এনসিটিবি অনুমোদিত বইয়ের পৃষ্ঠা নম্বর সহ নিখুঁত প্রমাণ দেওয়া থাকে, তাই চোখ বন্ধ করে ভরসা করা যায়।',
      rating: 5,
      avatarBg: 'from-purple-600 to-violet-700',
      initial: 'মে',
      verified: true,
    },
    {
      name: 'ফারহান সাদিক',
      college: 'রাজউক উত্তরা মডেল কলেজ',
      target: 'ইঞ্জিনিয়ারিং ও আইইউটি',
      batch: 'HSC ’25',
      text: 'কোচিংয়ের দীর্ঘ ট্রাফিক জ্যাম এড়িয়ে ঘরে বসেই ডেইলি অধ্যায় শেষ করে এখানে স্পিড টেস্ট দেই। সাবমিট করার সাথে সাথে ইনস্ট্যান্ট লিডারবোর্ড র‍্যাঙ্ক ও পার্সেন্টাইল দেখে প্রস্তুতি কোন লেভেলে আছে স্পষ্ট বোঝা যায়।',
      rating: 5,
      avatarBg: 'from-amber-600 to-orange-700',
      initial: 'ফা',
      verified: true,
    },
    {
      name: 'সাদিয়া তাসনিম',
      college: 'চট্টগ্রাম কলেজ',
      target: 'HSC বোর্ড পরীক্ষা (বিজ্ঞান)',
      batch: 'HSC ’25',
      text: 'বিগত ২০ বছরের সব শিক্ষা বোর্ডের প্রশ্ন এক জায়গায় সুন্দরভাবে অধ্যায় ও টপিক অনুযায়ী সাজানো। টেস্ট পেপারের প্রতিটি সৃজনশীল বহুনির্বাচনী প্র্যাকটিস করার জন্য এর চেয়ে গোছানো সিস্টেম আর পাইনি!',
      rating: 5,
      avatarBg: 'from-teal-600 to-emerald-700',
      initial: 'সা',
      verified: true,
    },
  ];

  return (
    <div className="dark min-h-screen w-full min-w-0 overflow-x-hidden bg-black text-neutral-100 font-sans selection:bg-red-500/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/80 border-b border-neutral-800/80 shadow-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Obhyash Home"
            className="flex items-center group"
          >
            <img
              src="/obhyash_full_logo_dark.svg"
              alt="অভ্যাস"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() =>
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-2 text-sm font-medium hover:text-emerald-400 cursor-pointer"
            >
              ফিচার
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-2 text-sm font-medium hover:text-emerald-400 cursor-pointer"
            >
              প্রাইসিং
            </button>
            <Link
              href="/blog"
              className="px-3 py-2 text-sm font-medium hover:text-emerald-400 cursor-pointer"
            >
              ব্লগ
            </Link>

            <GooglePlayButton variant="navbar" />

            <button
              onClick={onLogin}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              লগইন / রেজিস্ট্রেশন
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <GooglePlayButton variant="navbar" />
            <button
              onClick={onLogin}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              লগইন
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-14 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28 z-10">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 flex flex-col items-center text-center">
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 animate-fade-in-up flex flex-col items-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              ভুল থেকেই শুরু হোক <br />
              <span className="text-red-500">
                নিখুঁত প্রস্তুতি
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
              ২,০০,০০০+ অধ্যায়ভিত্তিক ও বিগত বছরের প্রশ্নব্যাংক, রিয়েল টাইমার এক্সাম, একবার ক্লিকেই অপশন লকিং, মূল পাঠ্যবইয়ের প্রমাণসহ নিখুঁত সমাধান এবং অফলাইন PDF ডাউনলোড—সবকিছু এক প্ল্যাটফর্মে।
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 justify-center pt-2">
              <button
                onClick={onGetStarted}
                className="flex-1 sm:flex-initial px-5 sm:px-7 py-3 sm:py-3.5 bg-[#12544F] hover:brightness-105 text-white rounded-[14px] font-bold text-sm sm:text-base shadow-[0_4.5px_0_#092328] active:shadow-[0_1px_0_#092328] active:translate-y-[3.5px] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>শুরু করো</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/demo"
                className="flex-1 sm:flex-initial px-5 sm:px-7 py-3 sm:py-3.5 bg-[#262626] hover:bg-[#323232] border border-white/[0.12] text-white rounded-[14px] font-bold text-sm sm:text-base shadow-[0_4.5px_0_#141414] active:shadow-[0_1px_0_#141414] active:translate-y-[3.5px] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer select-none"
              >
                <Flame className="w-4 h-4 text-neutral-300" />
                <span>ডেমো পরীক্ষা দাও</span>
              </Link>

              <GooglePlayButton variant="hero" />
            </div>

            {/* Play Store Live Trust Indicator */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 text-xs sm:text-sm text-neutral-400">
              <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm">
                <span>★★★★★</span>
                <span className="font-black text-white">৪.৯</span>
              </div>
              <span className="text-neutral-600 dark:text-neutral-500">•</span>
              <span className="text-neutral-300 font-medium">Google Play Store App</span>
              <span className="text-neutral-600 dark:text-neutral-500 hidden sm:inline">•</span>
              <span className="text-emerald-400 font-semibold hidden sm:inline">১০০% ফ্রি প্র্যাকটিস</span>
            </div>
          </div>
        </div>
      </section>



      {/* 2. Stats Banner */}
      <section className="py-6 sm:py-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {/* 1. Active Students */}
            <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0c0c0e] border border-neutral-800/90 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                ৫০০+
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-400 mt-1">
                সক্রিয় শিক্ষার্থী
              </p>
            </div>

            {/* 2. Model Tests */}
            <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0c0c0e] border border-neutral-800/90 shadow-sm hover:shadow-md hover:border-red-500/40 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-red-400 tracking-tight">
                ১,৫০০+
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-400 mt-1">
                মডেল টেস্ট
              </p>
            </div>

            {/* 3. Questions & Solutions */}
            <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0c0c0e] border border-neutral-800/90 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                ২,০০,০০০+
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-400 mt-1">
                প্রশ্ন ও নির্ভুল সমাধান
              </p>
            </div>

            {/* 4. Subject & Board Prep */}
            <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0c0c0e] border border-neutral-800/90 shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-950/50 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-teal-400 tracking-tight">
                ১২+
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-400 mt-1">
                বিষয় ও বোর্ড প্রস্তুতি
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid - Why Obhyash? */}
      <section
        id="features"
        className="py-10 sm:py-16 md:py-24 bg-black max-w-full px-0"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-0">
          <div className="mb-6 sm:mb-10 md:mb-16 text-center">
            <span className="text-red-400 font-bold tracking-wider uppercase text-xs sm:text-sm">
              কেন আমরা সেরা?
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1">
              তোমার প্রস্তুতিকে দাও <br className="hidden md:block" />
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">
                  নতুন মাত্রা
                </span>
              </span>
            </h2>
          </div>

          {/* Current Features - Mobile Scroll Snap / Desktop Grid */}
          <div className="relative">
            {/* Mobile Scroll Hint */}
            <div className="md:hidden flex justify-end mb-2 text-xs text-neutral-400 font-medium animate-pulse">
              ডানে স্ক্রল করো <ArrowRight className="w-3 h-3 ml-1" />
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:pb-0 md:mx-0 md:px-0 no-scrollbar">
              {/* 1. Real Exam & Option Locking */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Screen Bezel */}
                      <rect x="28" y="24" width="104" height="62" rx="8" stroke="#1E293B" strokeWidth="4" fill="#F8FAFC" />
                      
                      {/* Laptop Base */}
                      <path d="M14 88C14 86 15.6 84 18 84H142C144.4 84 146 86 146 88V91C146 94.3 143.3 97 140 97H20C16.7 97 14 94.3 14 91V88Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
                      <path d="M68 84H92" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Header mini bar with clock */}
                      <rect x="36" y="30" width="88" height="8" rx="4" fill="#E2E8F0" />
                      <circle cx="42" cy="34" r="2" fill="#10B981" />
                      <rect x="94" y="31.5" width="26" height="5" rx="2.5" fill="#10B981" opacity="0.3" />

                      {/* Option A (unselected) */}
                      <rect x="36" y="44" width="88" height="15" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
                      <circle cx="44" cy="51.5" r="3.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
                      <line x1="52" y1="51.5" x2="84" y2="51.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

                      {/* Option B (Locked & Selected) */}
                      <g style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '80px 68px' }}>
                        <rect x="36" y="63" width="88" height="17" rx="4" fill="#10B981" stroke="#1E293B" strokeWidth="2.5" />
                        <circle cx="44" cy="71.5" r="4" fill="white" />
                        <path d="M42 71.5L43.5 73L46 70" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="52" y1="71.5" x2="80" y2="71.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        
                        {/* Lock badge on right */}
                        <rect x="94" y="66" width="24" height="11" rx="3" fill="#047857" stroke="#1E293B" strokeWidth="1.5" />
                        <path d="M102 66V64C102 62.5 103 61.5 104.5 61.5C106 61.5 107 62.5 107 64V66" stroke="#1E293B" strokeWidth="1.5" />
                        <circle cx="104.5" cy="71.5" r="1.5" fill="white" />
                      </g>

                      {/* Floating Sparkle */}
                      <g style={{ animation: 'sparkleBurst 2s ease-in-out infinite', transformOrigin: '124px 28px' }}>
                        <path d="M124 23L125 27L129 28L125 29L124 33L123 29L119 28L123 27Z" fill="#F59E0B" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    রিয়েল এক্সাম ও অপশন লকিং
                  </h3>
                </div>
              </div>

              {/* 2. Textbook Solutions & References */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Open Textbook base */}
                      <g transform="translate(20, 26)">
                        {/* Left Page */}
                        <path d="M60 76C42 72 20 74 6 78V16C20 12 42 10 60 14V76Z" fill="#FFF" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" />
                        {/* Right Page */}
                        <path d="M60 76C78 72 100 74 114 78V16C100 12 78 10 60 14V76Z" fill="#FAF5FF" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" />
                        
                        {/* Spine Center */}
                        <line x1="60" y1="14" x2="60" y2="76" stroke="#CBD5E1" strokeWidth="3" />

                        {/* Left page text lines */}
                        <line x1="16" y1="26" x2="48" y2="24" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="16" y1="36" x2="52" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="16" y1="46" x2="44" y2="44" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                        {/* Little chemistry/physics diagram on left */}
                        <circle cx="26" cy="60" r="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
                        <circle cx="44" cy="58" r="3.5" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
                        <line x1="31" y1="59.5" x2="40.5" y2="58.5" stroke="#1E293B" strokeWidth="1.5" />

                        {/* Right page solution highlight box */}
                        <rect x="68" y="22" width="38" height="24" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
                        <line x1="72" y1="29" x2="100" y2="29" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                        <line x1="72" y1="37" x2="94" y2="37" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="54" x2="104" y2="54" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="62" x2="96" y2="62" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Floating Ribbon Bookmark */}
                      <path d="M76 22V48L80 44L84 48V22" fill="#EF4444" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />

                      {/* Floating Verified Seal Badge with Float Animation */}
                      <g style={{ animation: 'floatAvatar 3s ease-in-out infinite', transformOrigin: '122px 28px' }}>
                        <circle cx="122" cy="28" r="14" fill="#10B981" stroke="#1E293B" strokeWidth="3" />
                        <path d="M116 28L120 32L128 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    প্রমাণসহ বিস্তারিত সমাধান
                  </h3>
                </div>
              </div>

              {/* 3. Question Paper & Result PDF Downloads */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Back Shadow Paper */}
                      <rect x="52" y="16" width="60" height="76" rx="5" fill="#E2E8F0" stroke="#1E293B" strokeWidth="3" transform="rotate(4 82 54)" />

                      {/* Front Main Document Sheet */}
                      <rect x="44" y="14" width="64" height="80" rx="5" fill="white" stroke="#1E293B" strokeWidth="3.5" />
                      
                      {/* PDF Red Corner Badge */}
                      <rect x="44" y="14" width="26" height="12" rx="3" fill="#EF4444" stroke="#1E293B" strokeWidth="2" />
                      <text x="57" y="23" fill="white" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PDF</text>

                      {/* 2-Column Question Layout Lines */}
                      {/* Column 1 */}
                      <line x1="52" y1="34" x2="70" y2="34" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                      <line x1="52" y1="40" x2="68" y2="40" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="52" y1="46" x2="66" y2="46" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                      
                      {/* Divider Line */}
                      <line x1="75" y1="32" x2="75" y2="76" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="2 2" />

                      {/* Column 2 */}
                      <line x1="80" y1="34" x2="98" y2="34" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                      <line x1="80" y1="40" x2="96" y2="40" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="80" y1="46" x2="92" y2="46" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

                      {/* Floating Animated Download Badge */}
                      <g style={{ animation: 'bounceDown 2s ease-in-out infinite', transformOrigin: '80px 76px' }}>
                        <circle cx="80" cy="76" r="15" fill="#10B981" stroke="#1E293B" strokeWidth="3" />
                        <path d="M80 69V81M75 77L80 82L85 77" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    অফলাইন PDF ডাউনলোড
                  </h3>
                </div>
              </div>

              {/* 4. Live Model Test */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Screen Bezel */}
                      <rect x="24" y="24" width="112" height="64" rx="8" stroke="#1E293B" strokeWidth="4" fill="#0F172A" />
                      
                      {/* Laptop Base */}
                      <path d="M14 90C14 88 15.6 86 18 86H142C144.4 86 146 88 146 90V93C146 96.3 143.3 99 140 99H20C16.7 99 14 96.3 14 93V90Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />

                      {/* LIVE Red Pulsing Badge */}
                      <rect x="34" y="32" width="34" height="13" rx="4" fill="#EF4444" stroke="#1E293B" strokeWidth="1.5" />
                      <circle cx="41" cy="38.5" r="2.5" fill="white" style={{ animation: 'dotPulse 1.2s ease-in-out infinite' }} />
                      <text x="56" y="41.5" fill="white" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">LIVE</text>

                      {/* Live Wave Radar Signals */}
                      <g style={{ animation: 'sparkleBurst 2.5s ease-in-out infinite', transformOrigin: '120px 38px' }}>
                        <path d="M112 38C112 34 116 32 120 32C124 32 128 34 128 38" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <path d="M108 38C108 30 114 27 120 27C126 27 132 30 132 38" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" fill="none" />
                      </g>

                      {/* Podium Rankings (3 Avatars) */}
                      {/* Rank 2 (Left) */}
                      <rect x="42" y="60" width="22" height="20" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
                      <circle cx="53" cy="52" r="6" fill="#94A3B8" stroke="#1E293B" strokeWidth="2" />
                      <text x="53" y="73" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2</text>

                      {/* Rank 1 (Center - Elevated with Crown) */}
                      <g style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '80px 52px' }}>
                        <rect x="69" y="52" width="22" height="28" rx="3" fill="#047857" stroke="#1E293B" strokeWidth="2" />
                        <circle cx="80" cy="43" r="7" fill="#10B981" stroke="#1E293B" strokeWidth="2" />
                        {/* Crown */}
                        <path d="M75 34L77 37L80 33L83 37L85 34V38H75V34Z" fill="#F59E0B" stroke="#1E293B" strokeWidth="1.5" />
                        <text x="80" y="68" fill="white" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">1</text>
                      </g>

                      {/* Rank 3 (Right) */}
                      <rect x="96" y="64" width="22" height="16" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
                      <circle cx="107" cy="56" r="6" fill="#B45309" stroke="#1E293B" strokeWidth="2" />
                      <text x="107" y="76" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">3</text>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2">
                    <span>লাইভ মডেল টেস্ট</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 text-[10px] font-extrabold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Live
                    </span>
                  </h3>
                </div>
              </div>

              {/* 5. Daily Streak & Leaderboard */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Shield / Calendar Base */}
                      <rect x="42" y="18" width="76" height="82" rx="14" fill="#FFFBEB" stroke="#1E293B" strokeWidth="3.5" />
                      
                      {/* Calendar Header */}
                      <path d="M42 32C42 24.268 48.268 18 56 18H104C111.732 18 118 24.268 118 32V34H42V32Z" fill="#EF4444" stroke="#1E293B" strokeWidth="3.5" />
                      <circle cx="60" cy="26" r="3" fill="white" />
                      <circle cx="100" cy="26" r="3" fill="white" />

                      {/* Center Flame Icon with Dancing Animation */}
                      <g style={{ animation: 'popCard 2s ease-in-out infinite', transformOrigin: '80px 60px' }}>
                        {/* Outer Flame (Orange) */}
                        <path d="M80 42C74 50 68 56 68 66C68 74 73 80 80 80C87 80 92 74 92 66C92 56 86 50 80 42Z" fill="#F97316" stroke="#1E293B" strokeWidth="3" strokeLinejoin="round" />
                        {/* Inner Core Flame (Yellow) */}
                        <path d="M80 54C76 60 73 63 73 69C73 74 76 77 80 77C84 77 87 74 87 69C87 63 84 60 80 54Z" fill="#FDE047" />
                      </g>

                      {/* Streak Badge Pill */}
                      <g style={{ animation: 'floatAvatar 2.8s ease-in-out infinite', transformOrigin: '80px 92px' }}>
                        <rect x="50" y="84" width="60" height="17" rx="8.5" fill="#1E293B" />
                        <circle cx="60" cy="92.5" r="3" fill="#F59E0B" />
                        <text x="83" y="96" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">৭ দিনের স্ট্রিক</text>
                      </g>

                      {/* Floating XP star */}
                      <g style={{ animation: 'sparkleBurst 2.2s ease-in-out infinite', transformOrigin: '118px 24px' }}>
                        <circle cx="118" cy="24" r="10" fill="#F59E0B" stroke="#1E293B" strokeWidth="2.5" />
                        <text x="118" y="27.5" fill="white" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">XP</text>
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    ডেইলি স্ট্রাইক ও লিডারবোর্ড
                  </h3>
                </div>
              </div>

              {/* 6. Spaced Repetition Revision */}
              <div className="min-w-[80vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Spiral Mistake Notebook */}
                      <rect x="36" y="20" width="88" height="78" rx="7" fill="white" stroke="#1E293B" strokeWidth="3.5" />

                      {/* Spiral Rings on Left */}
                      {[28, 38, 48, 58, 68, 78, 88].map((y, idx) => (
                        <rect key={idx} x="32" y={y} width="9" height="4" rx="2" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
                      ))}

                      {/* Left: Red Error Box with ✕ */}
                      <g transform="translate(48, 32)">
                        <rect width="28" height="28" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                        <path d="M9 9L19 19M19 9L9 19" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="4" y1="36" x2="24" y2="36" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Curved Transform Arrow in Middle */}
                      <g style={{ animation: 'tapFinger 2.2s ease-in-out infinite', transformOrigin: '87px 46px' }}>
                        <path d="M80 46H94M90 41L95 46L90 51" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </g>

                      {/* Right: Green Success Box with ✓ */}
                      <g transform="translate(98, 32)" style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '112px 46px' }}>
                        <rect width="28" height="28" rx="6" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
                        <path d="M7 14L12 19L21 9" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="4" y1="36" x2="24" y2="36" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Bottom Notebook Revision Badge */}
                      <rect x="52" y="74" width="60" height="14" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
                      <circle cx="60" cy="81" r="3" fill="#10B981" />
                      <text x="83" y="84" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">স্মার্ট নোটবুক</text>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    ভুল প্রশ্নের স্মার্ট রিভিশন
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Future Features (Coming Soon) */}
          <div className="mt-10 sm:mt-16">
            <div className="text-center mb-6 sm:mb-10">
              <span className="inline-block px-3.5 py-1.5 rounded-full bg-red-900/30 text-red-400 text-xs sm:text-sm font-bold border border-red-800 animate-pulse">
                🚀 আসছে শীঘ্রই (Coming Soon)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* 1. Quiz Battle (Battle) */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Battle Arena Platform */}
                      <ellipse cx="80" cy="98" rx="66" ry="14" fill="#F1F5F9" stroke="#1E293B" strokeWidth="3" />
                      
                      {/* Player 1 (Blue) Avatar - Left */}
                      <g style={{ animation: 'floatAvatar 2.6s ease-in-out infinite', transformOrigin: '38px 60px' }}>
                        {/* Body Shield / Armor */}
                        <path d="M26 68C26 58 38 56 38 56C38 56 50 58 50 68V80H26V68Z" fill="#3B82F6" stroke="#1E293B" strokeWidth="3" strokeLinejoin="round" />
                        {/* Head Helmet */}
                        <circle cx="38" cy="46" r="13" fill="#60A5FA" stroke="#1E293B" strokeWidth="3" />
                        <rect x="31" y="44" width="14" height="4.5" rx="2" fill="#1E293B" />
                        {/* Health Bar (Green) */}
                        <rect x="22" y="24" width="32" height="6.5" rx="3" fill="#1E293B" />
                        <rect x="23.5" y="25.5" width="22" height="3.5" rx="1.75" fill="#10B981" />
                      </g>

                      {/* Player 2 (Red) Avatar - Right */}
                      <g style={{ animation: 'floatAvatar 2.6s ease-in-out infinite 1.3s', transformOrigin: '122px 60px' }}>
                        {/* Body Shield / Armor */}
                        <path d="M110 68C110 58 122 56 122 56C122 56 134 58 134 68V80H110V68Z" fill="#EF4444" stroke="#1E293B" strokeWidth="3" strokeLinejoin="round" />
                        {/* Head Helmet */}
                        <circle cx="122" cy="46" r="13" fill="#F87171" stroke="#1E293B" strokeWidth="3" />
                        <rect x="115" y="44" width="14" height="4.5" rx="2" fill="#1E293B" />
                        {/* Health Bar (Orange) */}
                        <rect x="106" y="24" width="32" height="6.5" rx="3" fill="#1E293B" />
                        <rect x="107.5" y="25.5" width="16" height="3.5" rx="1.75" fill="#F59E0B" />
                      </g>

                      {/* Crossed Swords in Center with Clash */}
                      <g style={{ animation: 'popCard 2s ease-in-out infinite', transformOrigin: '80px 56px' }}>
                        {/* Sword 1: Left to Top Right */}
                        <path d="M60 76L96 36" stroke="#94A3B8" strokeWidth="5.5" strokeLinecap="round" />
                        <path d="M60 76L96 36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                        {/* Hilt */}
                        <path d="M56 72L64 80" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="58" cy="78" r="3" fill="#B45309" stroke="#1E293B" strokeWidth="1.5" />

                        {/* Sword 2: Right to Top Left */}
                        <path d="M100 76L64 36" stroke="#94A3B8" strokeWidth="5.5" strokeLinecap="round" />
                        <path d="M100 76L64 36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                        {/* Hilt */}
                        <path d="M104 72L96 80" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="102" cy="78" r="3" fill="#B45309" stroke="#1E293B" strokeWidth="1.5" />
                      </g>

                      {/* Clash Spark Burst at intersection */}
                      <g style={{ animation: 'sparkleBurst 1.6s ease-in-out infinite', transformOrigin: '80px 56px' }}>
                        <path d="M80 44L83 53L92 56L83 59L80 68L77 59L68 56L77 53Z" fill="#FBBF24" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
                        <circle cx="80" cy="56" r="3" fill="#FFF" />
                      </g>

                      {/* Center "VS" Badge */}
                      <g style={{ animation: 'popCard 2.2s ease-in-out infinite', transformOrigin: '80px 88px' }}>
                        <rect x="67" y="79" width="26" height="18" rx="9" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                        <text x="80" y="92" fill="#FBBF24" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">VS</text>
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center justify-between">
                    <span>কুইজ ব্যাটল (Battle)</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-[10px] font-extrabold uppercase">
                      Soon
                    </span>
                  </h3>
                </div>
              </div>

              {/* 2. Doubt Solve */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Base Notepad / Screen */}
                      <rect x="28" y="20" width="104" height="82" rx="12" fill="#F8FAFC" stroke="#1E293B" strokeWidth="3.5" />
                      
                      {/* Question Bubble (Student - Top Left) */}
                      <g style={{ animation: 'floatAvatar 2.8s ease-in-out infinite', transformOrigin: '48px 40px' }}>
                        <path d="M36 32H74C78.4 32 82 35.6 82 40V52C82 56.4 78.4 60 74 60H46L36 67V40C36 35.6 39.6 32 36 32Z" fill="#FEE2E2" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
                        {/* Question mark & lines */}
                        <circle cx="48" cy="46" r="6" fill="#EF4444" />
                        <text x="48" y="50" fill="white" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">?</text>
                        <line x1="58" y1="42" x2="72" y2="42" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                        <line x1="58" y1="48" x2="68" y2="48" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Smart Solution Bulb in Center Top */}
                      <g style={{ animation: 'sparkleBurst 2.2s ease-in-out infinite', transformOrigin: '80px 22px' }}>
                        {/* Glow background */}
                        <circle cx="80" cy="22" r="14" fill="#FEF3C7" />
                        {/* Bulb glass */}
                        <path d="M74 20C74 16.7 76.7 14 80 14C83.3 14 86 16.7 86 20C86 22 84.5 24 83.5 25.5V28H76.5V25.5C75.5 24 74 22 74 20Z" fill="#F59E0B" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
                        {/* Screw base */}
                        <rect x="77" y="28" width="6" height="3" rx="1" fill="#64748B" stroke="#1E293B" strokeWidth="1" />
                        {/* Rays */}
                        <line x1="80" y1="8" x2="80" y2="11" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <line x1="90" y1="12" x2="88" y2="15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <line x1="70" y1="12" x2="72" y2="15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Answer Bubble (Mentor - Bottom Right) */}
                      <g style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '104px 72px' }}>
                        <path d="M84 56H122C126.4 56 130 59.6 130 64V80C130 84.4 126.4 88 122 88H118L112 95V88H84C79.6 88 76 84.4 76 80V64C76 59.6 79.6 56 84 56Z" fill="#D1FAE5" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
                        {/* Verified Check Circle */}
                        <circle cx="88" cy="72" r="6.5" fill="#10B981" stroke="#1E293B" strokeWidth="1.5" />
                        <path d="M85 72L87 74.5L91.5 69.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Solution text lines */}
                        <line x1="98" y1="68" x2="120" y2="68" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                        <line x1="98" y1="75" x2="114" y2="75" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                      </g>

                      {/* Floating 24/7 Support Pill */}
                      <g style={{ animation: 'floatAvatar 3s ease-in-out infinite', transformOrigin: '50px 88px' }}>
                        <rect x="34" y="80" width="38" height="15" rx="7.5" fill="#1E293B" />
                        <circle cx="42" cy="87.5" r="3" fill="#10B981" style={{ animation: 'dotPulse 1.2s ease-in-out infinite' }} />
                        <text x="56" y="90.5" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">২৪/৭ লাইভ</text>
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center justify-between">
                    <span>ডাউট সলভ</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-extrabold uppercase">
                      Soon
                    </span>
                  </h3>
                </div>
              </div>

              {/* 3. Varsity Predictor */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Target Probability Gauge Arc (Speedometer) */}
                      <path d="M40 86A46 46 0 0 1 120 86" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" fill="none" />
                      <path d="M40 86A46 46 0 0 1 114 62" stroke="#10B981" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="130" strokeDashoffset="20" />

                      {/* University Gate / Pillars in center backdrop */}
                      <rect x="64" y="62" width="6" height="26" rx="2" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.5" />
                      <rect x="90" y="62" width="6" height="26" rx="2" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.5" />
                      <rect x="60" y="58" width="40" height="5" rx="2" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />

                      {/* Graduation Cap (Mortarboard) - Floating on Top */}
                      <g style={{ animation: 'floatAvatar 2.6s ease-in-out infinite', transformOrigin: '80px 36px' }}>
                        {/* Cap Skull cap */}
                        <path d="M68 34C68 38 73 41 80 41C87 41 92 38 92 34V39C92 42 87 45 80 45C73 45 68 42 68 39V34Z" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                        {/* Diamond Board */}
                        <path d="M80 18L106 28L80 38L54 28L80 18Z" fill="#1E293B" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
                        <circle cx="80" cy="28" r="3" fill="#F59E0B" />
                        {/* Tassel */}
                        <path d="M80 28L100 36V46" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="100" cy="47" r="2.5" fill="#F59E0B" />
                      </g>

                      {/* Gauge Needle pointing towards High Chance (95%) */}
                      <g style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '80px 86px' }}>
                        <circle cx="80" cy="86" r="6" fill="#1E293B" />
                        <circle cx="80" cy="86" r="3" fill="#FFFFFF" />
                        <line x1="80" y1="86" x2="108" y2="60" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                      </g>

                      {/* Prediction Success Pill: "৯৫% চান্স" */}
                      <g style={{ animation: 'popCard 2s ease-in-out infinite', transformOrigin: '80px 98px' }}>
                        <rect x="46" y="88" width="68" height="20" rx="10" fill="#047857" stroke="#1E293B" strokeWidth="2" />
                        <circle cx="56" cy="98" r="3" fill="#10B981" style={{ animation: 'dotPulse 1.2s ease-in-out infinite' }} />
                        <text x="82" y="102" fill="white" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">৯৫% চান্স</text>
                      </g>

                      {/* Floating Sparkles */}
                      <g style={{ animation: 'sparkleBurst 2.4s ease-in-out infinite', transformOrigin: '124px 28px' }}>
                        <path d="M124 22L125.5 26.5L130 28L125.5 29.5L124 34L122.5 29.5L118 28L122.5 26.5Z" fill="#F59E0B" />
                      </g>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center justify-between">
                    <span>ভার্সিটি প্রেডিক্টর</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-extrabold uppercase">
                      Soon
                    </span>
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works - Workflow */}
      <section className="py-10 sm:py-16 md:py-24 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              শুরু করা খুবই সহজ
            </h2>
            <p className="text-xs sm:text-base text-neutral-400 font-medium">
              মাত্র ৩ ধাপে প্র্যাকটিস শুরু।
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#0d0e12] p-3 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
              {/* Card 1: ফ্রি অ্যাকাউন্ট খুলুন */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-neutral-500">
                      ধাপ 1
                    </span>
                  </div>

                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    {/* SVG Illustration 1: Laptop with User Avatar & Password dots */}
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Screen Bezel */}
                      <rect x="28" y="24" width="104" height="62" rx="8" stroke="#1E293B" strokeWidth="4" fill="#F8FAFC" />
                      
                      {/* Laptop Base */}
                      <path d="M14 88C14 86 15.6 84 18 84H142C144.4 84 146 86 146 88V91C146 94.3 143.3 97 140 97H20C16.7 97 14 94.3 14 91V88Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
                      <path d="M68 84H92" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Password Input Pill */}
                      <rect x="44" y="52" width="72" height="20" rx="10" fill="#F43F5E" stroke="#1E293B" strokeWidth="3" />
                      {/* Password Dots */}
                      <circle cx="68" cy="62" r="3.5" fill="white" style={{ animation: 'dotPulse 1.6s ease-in-out infinite', animationDelay: '0s' }} />
                      <circle cx="80" cy="62" r="3.5" fill="white" style={{ animation: 'dotPulse 1.6s ease-in-out infinite', animationDelay: '0.25s' }} />
                      <circle cx="92" cy="62" r="3.5" fill="white" style={{ animation: 'dotPulse 1.6s ease-in-out infinite', animationDelay: '0.5s' }} />

                      {/* Top Floating Avatar Badge */}
                      <g style={{ animation: 'floatAvatar 3s ease-in-out infinite', transformOrigin: '80px 24px' }}>
                        <circle cx="80" cy="24" r="16" fill="#10B981" stroke="#1E293B" strokeWidth="4" />
                        <circle cx="80" cy="19" r="5" fill="white" stroke="#1E293B" strokeWidth="2.5" />
                        <path d="M72 31C72 26.5 75.5 25 80 25C84.5 25 88 26.5 88 31" fill="white" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1">
                    ফ্রি অ্যাকাউন্ট খুলুন
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400">
                    Google দিয়ে এক ক্লিকে শুরু।
                  </p>
                </div>
              </div>

              {/* Card 2: বিষয় বেছে নিন */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-400">
                      ধাপ 2
                    </span>
                  </div>

                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    {/* SVG Illustration 2: 3 Subject Cards with Pointing Hand */}
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Left Green Card */}
                      <g transform="translate(26, 26)">
                        <rect width="28" height="40" rx="5" fill="#10B981" stroke="#1E293B" strokeWidth="3.5" />
                        <line x1="7" y1="13" x2="21" y2="13" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="7" y1="21" x2="21" y2="21" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </g>

                      {/* Right Purple Card */}
                      <g transform="translate(106, 26)">
                        <rect width="28" height="40" rx="5" fill="#6366F1" stroke="#1E293B" strokeWidth="3.5" />
                        <line x1="7" y1="13" x2="21" y2="13" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="7" y1="21" x2="21" y2="21" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </g>

                      {/* Center Orange Card (Active) */}
                      <g style={{ animation: 'popCard 2.4s ease-in-out infinite', transformOrigin: '80px 45px' }}>
                        <rect x="66" y="22" width="28" height="44" rx="5" fill="#F59E0B" stroke="#1E293B" strokeWidth="3.5" />
                        <line x1="73" y1="35" x2="87" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="73" y1="45" x2="87" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        {/* Ripple circle under tap point */}
                        <circle cx="80" cy="58" r="9" fill="#FBBF24" opacity="0.4" style={{ animation: 'rippleTouch 2.4s ease-out infinite' }} />
                      </g>

                      {/* Pointing Hand Cursor */}
                      <g style={{ animation: 'tapFinger 2.4s ease-in-out infinite', transformOrigin: '80px 75px' }}>
                        <path d="M73 105V88C73 88 73 84 77 84C81 84 81 88 81 88V105" fill="#FED7AA" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" />
                        <path d="M77 85V54C77 51.5 81 51.5 81 54V76" fill="#FED7AA" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
                        <path d="M81 72C84 72 86 74 86 77C86 80 84 82 81 82" fill="#FED7AA" stroke="#1E293B" strokeWidth="3.5" />
                        <path d="M81 80C85 80 87 82 87 85C87 88 84 89 81 89" fill="#FED7AA" stroke="#1E293B" strokeWidth="3.5" />
                        <path d="M73 76C70 76 68 78 68 81C68 84 71 86 74 86" fill="#FED7AA" stroke="#1E293B" strokeWidth="3.5" />
                      </g>
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1">
                    বিষয় বেছে নিন
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400">
                    সিলেবাস অনুযায়ী সাবজেক্ট সিলেক্ট।
                  </p>
                </div>
              </div>

              {/* Card 3: প্র্যাকটিস শুরু করুন */}
              <div className="bg-[#18191f] border border-neutral-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-lg group">
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-400">
                      ধাপ 3
                    </span>
                  </div>

                  <div className="w-full h-36 sm:h-44 md:h-48 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner p-3 sm:p-4 mb-3.5 sm:mb-5 border border-neutral-100">
                    {/* SVG Illustration 3: Test with clicking cursor & sparks */}
                    <svg viewBox="0 0 160 120" className="w-32 h-24 sm:w-36 sm:h-28 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Laptop Screen Bezel */}
                      <rect x="28" y="24" width="104" height="62" rx="8" stroke="#1E293B" strokeWidth="4" fill="#F8FAFC" />
                      
                      {/* Laptop Base */}
                      <path d="M14 88C14 86 15.6 84 18 84H142C144.4 84 146 86 146 88V91C146 94.3 143.3 97 140 97H20C16.7 97 14 94.3 14 91V88Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
                      <path d="M68 84H92" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Clipboard / Test Form */}
                      <rect x="52" y="14" width="56" height="64" rx="5" fill="white" stroke="#1E293B" strokeWidth="3.5" />
                      <rect x="68" y="10" width="24" height="8" rx="3" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2.5" />
                      <circle cx="80" cy="14" r="1.5" fill="#1E293B" />

                      {/* Question Line */}
                      <line x1="60" y1="28" x2="100" y2="28" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

                      {/* Option A (Active Green) */}
                      <rect x="58" y="36" width="44" height="12" rx="4" fill="#10B981" stroke="#1E293B" strokeWidth="2" />
                      <path d="M63 42L66 45L72 39" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="76" y1="42" x2="96" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />

                      {/* Option B */}
                      <rect x="58" y="52" width="44" height="12" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
                      <circle cx="66" cy="58" r="3" stroke="#94A3B8" strokeWidth="1.5" />
                      <line x1="74" y1="58" x2="94" y2="58" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

                      {/* Feedback Sparkles */}
                      <g style={{ animation: 'sparkleBurst 2.4s ease-in-out infinite', transformOrigin: '52px 42px' }}>
                        <path d="M52 38L53.5 41.5L57 43L53.5 44.5L52 48L50.5 44.5L47 43L50.5 41.5L52 38Z" fill="#F59E0B" />
                      </g>
                      <g style={{ animation: 'sparkleBurst 2.4s ease-in-out infinite', animationDelay: '0.4s', transformOrigin: '48px 54px' }}>
                        <path d="M48 50L49.2 52.8L52 54L49.2 55.2L48 58L46.8 55.2L44 54L46.8 52.8L48 50Z" fill="#FBBF24" />
                      </g>

                      {/* Cursor Clicking Option */}
                      <g style={{ animation: 'clickCursor 2.4s ease-in-out infinite', transformOrigin: '82px 48px' }}>
                        <path d="M82 46L94 62L87 62.5L91 71L87 73L83 64.5L77 68L82 46Z" fill="#2563EB" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1">
                    প্র্যাকটিস শুরু করুন
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400">
                    প্রশ্ন সলভ করে সাথে সাথে ফিডব্যাক।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 sm:py-16 md:py-24 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-8 sm:mb-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white">
              শিক্ষার্থীদের সাফল্যের অভিজ্ঞতা
            </h2>
          </div>
        </div>

        {/* 1 Row Auto Sliding Marquee */}
        <div className="relative w-full overflow-hidden">
          {/* Edge Fade Gradients */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />

          <div className="flex w-max gap-4 sm:gap-6 animate-marquee-horizontal hover:[animation-play-state:paused] py-2">
            {[...testimonials, ...testimonials].map((item, idx) => (
              <div
                key={idx}
                className="w-[300px] sm:w-[380px] shrink-0 bg-[#111216] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group select-none"
              >
                <div>
                  {/* Top Bar: Stars + Verified Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {item.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>ভেরিফাইড শিক্ষার্থী</span>
                      </span>
                    )}
                  </div>

                  {/* Student Review Quote */}
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 font-normal">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-3 sm:pt-4 border-t border-neutral-800/70 flex items-center gap-2.5 sm:gap-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${item.avatarBg} flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-xs shrink-0`}
                  >
                    {item.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <p className="font-bold text-white text-xs sm:text-sm truncate">
                        {item.name}
                      </p>
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0">
                        {item.batch}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
                      <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 truncate">
                        {item.college}
                      </span>
                      <span className="text-neutral-700">•</span>
                      <span className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
                        {item.target}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Social Proof Highlight */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-8 sm:mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-neutral-900/60 border border-neutral-800 text-[11px] sm:text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              ৯৮% শিক্ষার্থী
            </span>
            <span>জানিয়েছেন অভ্যাসের মাধ্যমে নিয়মিত প্র্যাকটিস তাদের পরীক্ষায় সিলি মিসটেক ও ভুল দাগানোর প্রবণতা কমিয়েছে</span>
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-10 sm:py-16 md:py-24 bg-black"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              তোমার প্রস্তুতির সেরা প্ল্যানটি{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                বেছে নাও
              </span>
            </h2>
          </div>

          {/* Pricing Cards - Single Row Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr gap-3 sm:gap-3.5 xl:gap-4 items-stretch mb-8 sm:mb-12 md:mb-16">
            {pricingPlans.map((plan, i) => {
              const isPopular = Boolean(plan.highlight);
              return (
                <div
                  key={i}
                  className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                    isPopular
                      ? 'bg-[#18181b] border-2 border-[#22c55e] shadow-xl shadow-emerald-500/10 z-10'
                      : 'bg-[#18181b] border border-neutral-800/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Floating Badge on Top Border */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#22c55e] text-black font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md whitespace-nowrap">
                      মোস্ট পপুলার
                    </div>
                  )}

                  <div>
                    {/* Plan Title */}
                    <div className="mb-1.5 sm:mb-2">
                      <span
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isPopular
                            ? 'text-[#22c55e]'
                            : 'text-neutral-400'
                        }`}
                      >
                        {plan.title}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                        ৳{plan.price}
                      </span>
                    </div>

                    {/* Period Subtitle */}
                    <p className="text-[11px] sm:text-xs font-semibold text-neutral-400 mt-0.5 sm:mt-1 mb-3.5 sm:mb-6">
                      {plan.period}
                    </p>

                    {/* Feature List */}
                    <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-8">
                      {(plan.features || []).map((feature: string, f: number) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs sm:text-sm text-neutral-300 font-medium leading-snug"
                        >
                          <Check
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 ${
                              isPopular
                                ? 'text-[#22c55e]'
                                : 'text-sky-400'
                            }`}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-center ${
                      isPopular
                        ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black font-black shadow-lg shadow-emerald-500/25 active:scale-95'
                        : 'bg-[#27272a] hover:bg-[#323236] text-neutral-200 border border-neutral-700/60 font-bold active:scale-95'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-black pt-10 sm:pt-14 md:pt-20 pb-8 sm:pb-10 font-sans border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-16">
            {/* Brand Column */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-[#071500] shadow-md shadow-emerald-950/25">
                  <img
                    src="/obhyash_logo.svg"
                    alt="Obhyash Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  অভ্যাস
                </span>
              </div>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                HSC, ইঞ্জিনিয়ারিং, মেডিকেল ও ভার্সিটি ভর্তি পরীক্ষার জন্য বাংলাদেশের সবচেয়ে দ্রুত ও আধুনিক অনলাইন এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম।
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a
                  href="https://www.facebook.com/share/18779ur8WD/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Obhyash Facebook Page"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-all border border-neutral-800"
                >
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@obhyash"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Obhyash YouTube Channel"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-all border border-neutral-800"
                >
                  <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="https://wa.me/8801409583992"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Obhyash WhatsApp Support"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-green-900/30 hover:text-green-400 transition-all border border-neutral-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>

              {/* Play Store Badge */}
              <div className="pt-1">
                <GooglePlayButton variant="footer" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-3 sm:mb-6 text-sm sm:text-base">
                দ্রুত লিংক
              </h3>
              <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm text-neutral-400">
                <li>
                  <button
                    onClick={onGetStarted}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    হোম
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById('features')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:text-emerald-400 transition-colors"
                  >
                    ফিচারসমূহ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById('pricing')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:text-emerald-400 transition-colors"
                  >
                    প্রাইসিং
                  </button>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    ব্লগ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal / Resources */}
            <div>
              <h3 className="font-bold text-white mb-3 sm:mb-6 text-sm sm:text-base">
                রিসোর্স ও পলিসি
              </h3>
              <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm text-neutral-400">
                <li>
                  <Link
                    href="/about-us"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    আমাদের সম্পর্কে (About Us)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    গোপনীয়তা নীতি (Privacy Policy)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-and-conditions"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    ব্যবহারের শর্তাবলী (Terms & Conditions)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    রিফান্ড পলিসি (Refund Policy)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/referral-program"
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-semibold text-emerald-400"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    রেফারেল প্রোগ্রাম 🎁
                  </Link>
                </li>
                <li>
                  <Link
                    href="/affiliate"
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-semibold text-emerald-400"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    অ্যাফিলিয়েট প্রোগ্রাম (Affiliate) 💼
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-white mb-3 sm:mb-6 text-sm sm:text-base">
                যোগাযোগ
              </h3>
              <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm text-neutral-400">
                <li className="flex items-start gap-2.5 sm:gap-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    লেভেল ৪, উত্তরা সেক্টর ১৩, <br /> ঢাকা-১২৩০, বাংলাদেশ
                  </span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                  <span>+880 1409-583992</span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                  <span>support@obhyash.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-5 sm:pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs sm:text-sm text-neutral-500">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Obhyash Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1 text-neutral-400">
                অভ্যাসে শুরু{' '}
                <span className="text-emerald-400 animate-pulse">✒️</span>
                সাফল্যে শেষ
              </span>
            </div>
          </div>
        </div>
      </footer>


      <style>{`
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes floatAvatar {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes tapFinger {
          0%, 100% { transform: translateY(5px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes popCard {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.06); }
        }
        @keyframes rippleTouch {
          0% { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes clickCursor {
          0%, 100% { transform: translate(3px, 3px); }
          50% { transform: translate(0px, 0px) scale(0.92); }
        }
        @keyframes sparkleBurst {
          0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0.2; }
          50% { transform: scale(1.25) rotate(25deg); opacity: 1; }
        }
        @keyframes flowBeam {
          0% { transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(350%); opacity: 0; }
        }
        @keyframes pulseGlowEmerald {
          0%, 100% {
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 32px rgba(16, 185, 129, 0.65), 0 0 45px rgba(16, 185, 129, 0.3), inset 0 0 16px rgba(16, 185, 129, 0.3);
            border-color: rgba(16, 185, 129, 1);
          }
        }
        @keyframes pulseGlowRed {
          0%, 100% {
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.6);
          }
          50% {
            box-shadow: 0 0 32px rgba(239, 68, 68, 0.65), 0 0 45px rgba(239, 68, 68, 0.3), inset 0 0 16px rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 1);
          }
        }
        @keyframes rippleSonar {
          0% {
            transform: scale(0.9);
            opacity: 0.85;
          }
          100% {
            transform: scale(1.65);
            opacity: 0;
          }
        }
      `}</style>

      {/* ── MOBILE SMART APP INSTALL BANNER ── */}
      <MobileAppInstallBanner />
    </div>
  );
};

export default LandingPage;
