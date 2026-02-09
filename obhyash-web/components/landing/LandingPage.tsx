import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LatexText from '@/components/student/ui/LatexText';
import {
  History,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle,
  BarChart3,
  ScanLine,
  FileText,
  Sparkles,
  Menu,
  X,
  Zap,
  Flame,
  Trophy,
  Video,
  HelpCircle,
  GraduationCap,
  Facebook,
  Youtube,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onHistoryClick: () => void;
  historyCount: number;
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

const DEMO_QUESTIONS = [
  {
    text: 'একটি কণা $v = u + at$ সূত্র মেনে চলে। যদি $u=0$ এবং $a=5 ms^{-2}$ হয়, তবে $t=4s$ এ বেগ কত?',
    options: ['10 $ms^{-1}$', '20 $ms^{-1}$', '15 $ms^{-1}$', '25 $ms^{-1}$'],
    correct: 1,
    topic: 'পদার্থবিজ্ঞান ১ম পত্র',
  },
  {
    text: 'পানির রাসায়নিক সংকেত কী?',
    options: ['$CO_2$', '$NaCl$', '$H_2O$', '$O_2$'],
    correct: 2,
    topic: 'রসায়ন ১ম পত্র',
  },
  {
    text: 'নিউটনের দ্বিতীয় সূত্র কোনটি?',
    options: ['$F = ma$', '$E = mc^2$', '$v = u + at$', '$s = vt$'],
    correct: 0,
    topic: 'পদার্থবিজ্ঞান ১ম পত্র',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin, // ✅ Log in
  isDarkMode,
  toggleTheme,
  onHistoryClick,
  historyCount,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<
    'generate' | 'omr' | 'analytics'
  >('generate');

  // --- Interactive Demo Logic ---
  const [demoQIndex, setDemoQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // ✅ Update useEffect to use the external constant
  useEffect(() => {
    if (activeDemoTab !== 'generate') return;

    const interval = setInterval(() => {
      setSelectedOpt(DEMO_QUESTIONS[demoQIndex].correct);

      setTimeout(() => {
        setDemoQIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
        setSelectedOpt(null);
      }, 1500);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeDemoTab, demoQIndex]); // Now safe!

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((t) => (t > 0 ? t - 1 : 1200)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  // --- Data Arrays ---

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    {
      title: 'বেসিক (Free)',
      price: '০',
      period: 'আজীবন',
      features: [
        'প্রতিদিন ১টি ফ্রি এক্সাম',
        'লিডারবোর্ড এক্সেস',
        'বেসিক এনালাইসিস',
        'লিমিটেড প্রশ্ন ব্যাংক',
      ],
      cta: 'বিনামূল্যে শুরু করুন',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor:
        'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
    },
    // Skeletons or initial state could go here, but starting with Basic is safe
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Dynamically import to avoid server-side issues if any
        const { getSubscriptionPlans } = await import('@/services/database');
        const plans = await getSubscriptionPlans();

        if (plans && plans.length > 0) {
          const mappedPlans = plans.map((plan) => {
            const isYearly =
              plan.name.toLowerCase().includes('year') ||
              plan.billingCycle === 'Yearly';
            const isQuarterly =
              plan.name.toLowerCase().includes('quarter') ||
              plan.billingCycle.includes('৩ মাস');
            const isMonthly =
              plan.name.toLowerCase().includes('month') ||
              plan.billingCycle === 'Monthly' ||
              plan.billingCycle === '/মাস';
            const isFree = plan.price === 0;

            let buttonColor =
              'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700';
            let color = 'border-neutral-200 dark:border-neutral-800';

            if (isMonthly) {
              buttonColor =
                'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30';
              color = 'border-indigo-500 ring-2 ring-indigo-500/20';
            } else if (isQuarterly) {
              buttonColor =
                'bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:from-rose-700 hover:to-orange-700 shadow-lg shadow-rose-500/30';
              color = 'border-rose-500';
            } else if (plan.price > 0) {
              // Fallback for other paid plans
              buttonColor = 'bg-indigo-600 text-white hover:bg-indigo-700';
              color = 'border-indigo-500';
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
              features: plan.features,
              cta: isFree ? 'বিনামূল্যে শুরু করুন' : 'সাবস্ক্রাইব করুন',
              highlight: plan.isPopular,
              color: color,
              buttonColor: buttonColor,
            };
          });
          setPricingPlans(mappedPlans);
        }
      } catch (error) {
        console.error('Failed to load plans', error);
      }
    };
    fetchPlans();
  }, []);

  const testimonials = [
    {
      name: 'সাদিয়া আফরিন',
      role: 'মেডিকেল ভর্তি পরীক্ষার্থী',
      text: 'OMR শিট পূরণ করে সাথে সাথে রেজাল্ট পাওয়ার ফিচারটি অসাধারণ। কোচিং-এর ভিড় এড়িয়ে বাসায় বসেই এখন নিজেকে যাচাই করতে পারছি।',
      initial: 'S',
      color: 'bg-emerald-500',
    },
    {
      name: 'তানভীর আহমেদ',
      role: 'HSC পরীক্ষার্থী (Science)',
      text: 'Obhyash-এর AI জেনারেটেড প্রশ্নগুলো বইয়ের টপিক অনুযায়ী হয়, যা আমার রিভিশনের জন্য খুব উপকারে এসেছে। এক্সপ্ল্যানেশনগুলোও খুব স্পষ্ট।',
      initial: 'T',
      color: 'bg-rose-500',
    },
    {
      name: 'রাফসান জামান',
      role: 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থী',
      text: 'Analytics ড্যাশবোর্ড দেখে আমি বুঝতে পেরেছি ফিজিক্সের কোন চ্যাপ্টারে আমার দুর্বলতা আছে। এখন সেই অনুযায়ী প্রস্তুতি নিচ্ছি।',
      initial: 'R',
      color: 'bg-indigo-500',
    },
  ];

  const faqs = [
    {
      q: 'Obhyash অ্যাপটি কি সম্পূর্ণ ফ্রি?',
      a: "আমাদের একটি 'বেসিক' প্ল্যান আছে যা সম্পূর্ণ ফ্রি। তবে আনলিমিটেড এক্সাম এবং অ্যাডভান্সড ফিচারগুলোর জন্য প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন।",
    },
    {
      q: 'OMR স্ক্যান ফিচারটি কিভাবে কাজ করে?',
      a: 'আপনি যেকোনো সাধারণ কাগজে পরীক্ষা দিয়ে আমাদের অ্যাপের মাধ্যমে ছবি তুললেই আমাদের AI সিস্টেম তা যাচাই করে ফলাফল জানিয়ে দিবে।',
    },
    {
      q: 'পেমেন্ট পদ্ধতি কি কি?',
      a: 'বর্তমানে আমরা বিকাশ, নগদ এবং রকেটের মাধ্যমে পেমেন্ট গ্রহণ করছি। খুব শীঘ্রই কার্ড পেমেন্ট যুক্ত করা হবে।',
    },
    {
      q: 'আমি কি মোবাইল থেকে পরীক্ষা দিতে পারবো?',
      a: 'হ্যাঁ, Obhyash সম্পূর্ণ মোবাইল-ফ্রেন্ডলি। আপনি যেকোনো স্মার্টফোন, ট্যাবলেট বা কম্পিউটার থেকে এটি ব্যবহার করতে পারবেন।',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors font-sans selection:bg-rose-500/20">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-red-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onGetStarted}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start justify-center -space-y-1 select-none">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] leading-none mb-0.5 font-sans">
                OBHYASH
              </span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 font-serif-exam leading-none pb-1">
                অভ্যাস
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() =>
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-2 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              ফিচার
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-2 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              প্রাইসিং
            </button>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

            {historyCount > 0 && (
              <button
                onClick={onHistoryClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors rounded-full"
              >
                <History className="w-3.5 h-3.5" />
                <span>ইতিহাস ({historyCount})</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* 2. Added Login Button */}
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              লগইন
            </button>

            {/* 3. Updated Register/Get Started Button */}
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
            >
              শুরু করুন
            </button>
          </div>

          {/* Mobile Navigation - Direct Buttons */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              {isDarkMode ? (
                <Sun className="w-4.5 h-4.5" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onLogin}
                className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pr-1"
              >
                লগইন
              </button>
              <button
                onClick={onGetStarted}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-md shadow-indigo-500/20"
              >
                রেজিস্ট্রেশন
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              এক সাবস্ক্রিপশনেই সব ফিচার
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.25]">
              আপনার প্রস্তুতি হোক <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-600">
                স্মার্ট ও নির্ভুল
              </span>
            </h1>

            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              আনলিমিটেড প্রশ্নে ইচ্ছেমতো পরীক্ষা,{' '}
              <span className="text-indigo-600 dark:text-indigo-400">
                OMR Upload
              </span>{' '}
              এবং নিজের অগ্রগতি যাচাই করুন এক নিমিষেই। একাডেমিক এবং অ্যাডমিশন
              প্রস্তুতির সেরা সঙ্গী।
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white rounded-xl font-bold text-base shadow-xl shadow-indigo-500/30 transition-all hover:-tranneutral-y-1 flex items-center justify-center gap-2"
              >
                নতুন পরীক্ষা দিন
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-base hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
              >
                ফিচারগুলো দেখুন
              </button>
            </div>
          </div>

          {/* Right Interactive Demo */}
          <div className="lg:w-1/2 w-full perspective-1000">
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-red-100 dark:border-neutral-800 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 overflow-hidden transform rotate-y-2 hover:rotate-y-0 transition-transform duration-500">
              {/* Fake Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 text-[10px] font-bold">
                  <button
                    onClick={() => setActiveDemoTab('generate')}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${activeDemoTab === 'generate' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
                  >
                    <FileText className="w-3 h-3" /> কাস্টম
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('omr')}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${activeDemoTab === 'omr' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
                  >
                    <ScanLine className="w-3 h-3" /> OMR
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('analytics')}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${activeDemoTab === 'analytics' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
                  >
                    <BarChart3 className="w-3 h-3" /> এনালাইসিস
                  </button>
                </div>
              </div>

              {/* Demo Content Area */}
              <div className="p-6 min-h-[380px] flex flex-col relative">
                {/* 1. Generate Question Demo (Auto-playing) */}
                {activeDemoTab === 'generate' && (
                  <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                    <div className="flex justify-between items-center mb-2 border-b pb-2 border-neutral-100 dark:border-neutral-800">
                      <span className="font-bold text-neutral-800 dark:text-white flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                        {DEMO_QUESTIONS[demoQIndex].topic}
                      </span>
                      <span className="px-2 py-0.5 bg-red-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-mono font-bold rounded border border-red-100 dark:border-neutral-700">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <h3 className="font-serif-exam text-lg text-neutral-900 dark:text-neutral-200 mb-4">
                      <LatexText text={DEMO_QUESTIONS[demoQIndex].text} />
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {DEMO_QUESTIONS[demoQIndex].options.map((opt, i) => (
                        <div
                          key={i}
                          className={`px-4 py-2.5 rounded-xl border flex items-center transition-all duration-300 text-sm ${
                            selectedOpt === i
                              ? 'bg-red-50 dark:bg-rose-900/20 border-rose-600 text-rose-700 dark:text-rose-300 scale-[1.02]'
                              : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <LatexText text={opt} />
                          {selectedOpt === i && (
                            <CheckCircle className="w-4 h-4 text-rose-600 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. OMR Demo */}
                {activeDemoTab === 'omr' && (
                  <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full pt-4">
                    <div className="relative w-48 h-64 bg-white border border-neutral-300 rounded shadow-md p-4 flex flex-col gap-3">
                      {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div
                          key={row}
                          className="flex justify-between items-center opacity-60"
                        >
                          <div className="w-4 h-4 bg-neutral-200 rounded-full"></div>
                          <div className="w-4 h-4 bg-neutral-800 rounded-full"></div>
                          <div className="w-4 h-4 bg-neutral-200 rounded-full"></div>
                          <div className="w-4 h-4 bg-neutral-200 rounded-full"></div>
                        </div>
                      ))}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 shadow-[0_0_15px_rgba(200,16,46,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                      <Zap className="w-4 h-4 animate-pulse" />
                      উত্তরপত্র যাচাই চলছে...
                    </div>
                  </div>
                )}

                {/* 3. Analytics Demo */}
                {activeDemoTab === 'analytics' && (
                  <div className="animate-in fade-in zoom-in duration-300 pt-4 w-full">
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                          গড় স্কোর
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          ৮২%
                        </div>
                      </div>
                      <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          পরীক্ষা
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          ১৪
                        </div>
                      </div>
                    </div>
                    <div className="h-40 flex items-end justify-between gap-2 px-2 pb-4">
                      {[30, 45, 35, 60, 55, 75, 85].map((h, i) => (
                        <div
                          key={i}
                          className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-t-lg relative group h-full flex flex-col justify-end"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 to-rose-500 rounded-t-lg transition-all duration-500"
                            style={{ height: `${h}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Banner */}
      <section className="py-10 border-y border-indigo-50 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-neutral-200 dark:divide-neutral-800">
            <div className="space-y-1">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                ১০,০০০+
              </h3>
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                শিক্ষার্থী
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">
                ৫০০+
              </h3>
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                মডেল টেস্ট
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                ১ লক্ষ+
              </h3>
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                প্রশ্ন সমাধান
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                ২৪/৭
              </h3>
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                AI মেন্টর
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid - Why Obhyash? */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 lg:px-6">
        <div className="mb-16 text-center">
          <span className="text-rose-600 dark:text-rose-400 font-bold tracking-wider uppercase text-sm">
            কেন আমরা সেরা?
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white mt-2">
            আপনার প্রস্তুতিকে দিন <br className="hidden md:block" />
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">নতুন মাত্রা</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 dark:bg-rose-900/50 -z-0 rounded-full"></span>
            </span>
          </h2>
        </div>

        {/* Current Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Smart Analytics */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              স্মার্ট এনালাইসিস
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              প্রতিটি পরীক্ষার পর দেখুন আপনার সবল ও দুর্বল দিকগুলো। গ্রাফ এবং
              চার্টের মাধ্যমে নিজের অগ্রগতি নিজেই যাচাই করুন।
            </p>
          </div>

          {/* OMR Scanning */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ScanLine className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              OMR স্ক্যানিং
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              বাসায় বসে খাতায় পরীক্ষা দিয়ে অ্যাপ দিয়ে ছবি তুলুন। নিমিষেই পেয়ে
              যাবেন নির্ভুল ফলাফল ও বিস্তারিত সমাধান।
            </p>
          </div>

          {/* AI Question Generator */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              AI প্রশ্ন জেনারেটর
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              আপনার সিলেবাস অনুযায়ী যেকোনো বিষয়ের উপর আনলিমিটেড কাস্টম
              প্রশ্নপত্র তৈরি করুন এক ক্লিকেই।
            </p>
          </div>

          {/* Leaderboard */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-yellow-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              লিডারবোর্ড
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              সারা দেশের শিক্ষার্থীদের সাথে মেধা তালিকায় নিজের অবস্থান যাচাই
              করুন এবং নিজেকে এগিয়ে রাখুন।
            </p>
          </div>

          {/* Exam History */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <History className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              এক্সাম হিস্ট্রি
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              আপনার পুরনো সব এক্সাম এবং ভুলগুলোর বিস্তারিত সমাধান দেখুন যেকোনো
              সময়।
            </p>
          </div>

          {/* Dark Mode */}
          <div className="group p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-neutral-500/10 hover:-tranneutral-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Moon className="w-7 h-7 text-neutral-600 dark:text-neutral-300" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              ডার্ক মোড
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              দিন বা রাত, চোখের আরামের জন্য ব্যবহার করুন আমাদের কাস্টমাইজেবল
              ডার্ক থিম।
            </p>
          </div>
        </div>

        {/* Future Features (Coming Soon) */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-200 dark:border-rose-800 animate-pulse">
              🚀 আসছে শীঘ্রই (Coming Soon)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
            {/* Live Model Test */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  লাইভ মডেল টেস্ট
                </h3>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                একই সময়ে হাজারো শিক্ষার্থীর সাথে রিয়েল-টাইম পরীক্ষা।
              </p>
            </div>

            {/* Doubt Solve */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl text-purple-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  ডাউট সলভ
                </h3>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                এক্সপার্ট মেন্টরদের কাছ থেকে কঠিন প্রশ্নের সমাধান।
              </p>
            </div>

            {/* Varsity Predictor */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  ভার্সিটি প্রেডিক্টর
                </h3>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                আপনার স্কোর অনুযায়ী চান্স পাওয়ার সম্ভাবনা যাচাই।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works - Workflow */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white">
              কিভাবে শুরু করবেন?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 max-w-2xl mx-auto">
              খুব সহজেই মাত্র ৩টি ধাপে নিজেকে যাচাই করুন
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-indigo-600">১</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                অ্যাকাউন্ট খুলুন
              </h3>
              <p className="text-neutral-500 text-sm max-w-xs px-4">
                গুগল বা ইমেইল দিয়ে মাত্র ১০ সেকেন্ডে ফ্রি রেজিস্ট্রেশন করুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-rose-100 dark:border-rose-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-rose-600">২</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                পরীক্ষা দিন
              </h3>
              <p className="text-neutral-500 text-sm max-w-xs px-4">
                অ্যাপে বা খাতায় পরীক্ষা দিয়ে সাথে সাথেই উত্তরপত্র আপলোড করুন।
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-emerald-600">৩</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                ফলাফল দেখুন
              </h3>
              <p className="text-neutral-500 text-sm max-w-xs px-4">
                AI জেনারেটেড রিপোর্ট দেখে নিজের দুর্বলতাগুলো কাটিয়ে উঠুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-red-100 dark:border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              আপনার পছন্দের প্ল্যানটি বেছে নিন
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান।
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white dark:bg-neutral-900 rounded-2xl p-8 border transition-transform hover:-tranneutral-y-2 ${plan.color} ${plan.highlight ? 'shadow-2xl shadow-indigo-500/10 scale-105 z-10' : 'shadow-lg'}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -tranneutral-x-1/2 -tranneutral-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  {plan.title}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                    ৳{plan.price}
                  </span>
                  <span className="text-neutral-500 text-sm">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {(plan.features || []).map((feature: string, f: number) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.buttonColor}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-rose-50/50 dark:bg-neutral-900/30 border-y border-red-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white font-serif-exam">
              শিক্ষার্থীরা যা বলছে
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              দেশের বিভিন্ন প্রান্ত থেকে হাজারো শিক্ষার্থী Obhyash ব্যবহার করছে
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-red-100 dark:border-neutral-800 shadow-sm relative hover:-tranneutral-y-1 transition-transform duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${item.color} shadow-md`}
                  >
                    {item.initial}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white text-lg">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                      {item.role}
                    </div>
                  </div>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-2 font-medium leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
          </h2>
        </div>
        <div className="grid gap-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-red-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2 flex items-start gap-3">
                <span className="text-indigo-500 text-xl leading-none">Q.</span>
                {faq.q}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 pl-7 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-900 pt-20 pb-10 border-t border-rose-100 dark:border-neutral-800 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-serif-exam tracking-tight">
                  অভ্যাস
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                বাংলাদেশের সবচেয়ে আধুনিক AI-ভিত্তিক এক্সাম প্ল্যাটফর্ম। আপনার
                প্রস্তুতিকে আরও সহজ ও কার্যকর করতে আমরা অঙ্গীকারবদ্ধ।
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-6">
                দ্রুত লিংক
              </h4>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
                <li>
                  <button
                    onClick={onGetStarted}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    প্রাইসিং
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    ব্লগ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal / Resources */}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-6">
                রিসোর্স ও পলিসি
              </h4>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    ব্যবহারের শর্তাবলী (Terms)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    গোপনীয়তা নীতি (Privacy)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    রিফান্ড পলিসি
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-6">
                যোগাযোগ
              </h4>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    লেভেল ৪, উত্তরা সেক্টর ১৩, <br /> ঢাকা-১২৩০, বাংলাদেশ
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>+৮৮০ ১৭০০-০০০০০০</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>support@obhyash.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center md:text-left">
              © {new Date().getFullYear()} Obhyash Platform. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-500">
              <span className="flex items-center gap-1">
                Made with{' '}
                <span className="text-rose-500 animate-pulse">❤️</span> in
                Bangladesh
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
