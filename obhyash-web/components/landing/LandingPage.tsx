import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  User,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  FileText,
  ScanLine,
  BarChart3,
  History,
  Trophy,
  Zap,
  Video,
  HelpCircle,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  CheckCircle2,
  Check,
  Crown,
  Bookmark,
  Flag,
  Lock,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  CheckCheck,
  Smartphone,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Menu,
  X,
  Flame,
  Facebook,
  Youtube,
  RotateCcw,
  Target,
  CalendarDays,
  Star,
  XCircle,
  Award,
} from 'lucide-react';

// Next.js dynamic import lazy-loads heavy components (like LaTeX/ReactMarkdown)
// This strictly separates the heavy math syntax parsing JS from the main page bundle.
const LatexText = dynamic(
  () => import('@/components/student/ui/common/LatexText'),
  {
    ssr: false,
    loading: () => (
      <div className="h-4 w-3/4 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded"></div>
    ),
  },
);

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
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
    number: '০১',
    text: 'একটি কণা $v = u + at$ সূত্র মেনে চলে। যদি $u = 0$ এবং $a = 5 \\text{ ms}^{-2}$ হয়, তবে $t = 4\\text{ s}$ এ কণাটির বেগ কত হবে?',
    options: ['10 ms⁻¹', '20 ms⁻¹', '15 ms⁻¹', '25 ms⁻¹'],
    correct: 1,
    subject: 'পদার্থবিজ্ঞান ১ম পত্র',
    chapter: 'গতিবিদ্যা',
    source: 'CU-18',
    explanation: 'আমরা জানি, $v = u + at$\nযেহেতু $u = 0, a = 5 \\text{ ms}^{-2}, t = 4\\text{ s}$\nসুতরাং, $v = 0 + (5 \\times 4) = 20\\text{ ms}^{-1}$।\n(রেফারেন্স: ড. শাহজাহান তপন স্যার - গতিবিদ্যা)',
  },
  {
    number: '০২',
    text: 'নিচের কোন অরবিটালটির শক্তি সবচেয়ে কম?',
    options: ['4s', '3d', '4p', '4f'],
    correct: 0,
    subject: 'রসায়ন ১ম পত্র',
    chapter: 'গুণগত রসায়ন',
    source: 'DU-A-21',
    explanation: 'আউফবাউ নীতি অনুযায়ী $(n+l)$ এর মান যার কম তার শক্তি কম। 4s এর জন্য $n+l = 4+0 = 4$, যা 3d (৫) অপেক্ষা কম।\n(রেফারেন্স: হাজারী ও নাগ স্যার - গুণগত রসায়ন)',
  },
  {
    number: '০৩',
    text: '$\\lim_{x \\to 0} \\frac{\\sin 5x}{x}$ এর মান কত?',
    options: ['0', '1', '5', 'অসংজ্ঞায়িত'],
    correct: 2,
    subject: 'উচ্চতর গণিত ১ম পত্র',
    chapter: 'অন্তরীকরণ',
    source: 'BUET-19',
    explanation: 'মৌলিক সূত্রানুযায়ী $\\lim_{x \\to 0} \\frac{\\sin ax}{x} = a$। এখানে $a = 5$, অতএব মান 5।\n(রেফারেন্স: এস ইউ আহাম্মদ স্যার - অন্তরীকরণ)',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin, // ✅ Log in
  isDarkMode,
  toggleTheme,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<
    'generate' | 'analytics'
  >('generate');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // --- Interactive Demo Logic ---
  const [demoQIndex, setDemoQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(592);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Auto-play demo cycle (Question -> Option Lock -> Warm Book Explanation -> Next Question)
  useEffect(() => {
    if (activeDemoTab !== 'generate') return;

    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    // Step 1: Select/Lock option after 1.5s
    timer1 = setTimeout(() => {
      setSelectedOpt(DEMO_QUESTIONS[demoQIndex].correct);

      // Step 2: Reveal warm book explanation after 1s of locking
      timer2 = setTimeout(() => {
        setShowExplanation(true);

        // Step 3: Transition to next question after 3.5s
        timer3 = setTimeout(() => {
          setDemoQIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
          setSelectedOpt(null);
          setShowExplanation(false);
          setIsBookmarked(false);
        }, 3500);
      }, 1000);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [activeDemoTab, demoQIndex]);

  const marqueeRef = useRef<HTMLDivElement>(null);

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

  const examCountdowns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = (d: Date) =>
      Math.max(0, Math.ceil((d.getTime() - today.getTime()) / 86400000));
    return {
      hsc2026: days(new Date('2026-04-01')),
      mbbs2026: days(new Date('2026-10-05')),
      varsity2026: days(new Date('2026-09-01')),
    };
  }, []);

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
      } catch (error) {
        console.error('Failed to load plans', error);
      }
    };
    fetchPlans();
  }, []);

  const testimonials = [
    {
      name: 'তানভীর আহমেদ',
      role: 'HSC পরীক্ষার্থী (Science)',
      text: 'অধ্যায়ভিত্তিক মডেল টেস্ট এবং প্রতিটি প্রশ্নের পাঠ্যবই ভিত্তিক রেফারেন্স ও ব্যাখ্যা আমার পরীক্ষার প্রস্তুতিকে অনেক সহজ করে দিয়েছে।',
      initial: 'T',
      color: 'bg-emerald-600',
    },
    {
      name: 'সাদিয়া আফরিন',
      role: 'মেডিকেল ভর্তি পরীক্ষার্থী',
      text: 'পরীক্ষার হলের মতো একবার অপশন ক্লিক করলেই লক হয়ে যাওয়ার সিস্টেমটা সিলি মিসটেক বা ভুল দাগানো কমানোর জন্য অসাধারণ!',
      initial: 'S',
      color: 'bg-red-500',
    },
    {
      name: 'রাফসান জামান',
      role: 'ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি পরীক্ষার্থী',
      text: 'পরীক্ষা শেষেই নেগেটিভ মার্কিংয়ের নিখুঁত হিসাব পাওয়া যায় এবং এক ক্লিকে সম্পূর্ণ প্রশ্নপত্র ও ব্যাখ্যা PDF ডাউনলোড করে অফলাইনেও রিভিশন দেওয়া যায়।',
      initial: 'R',
      color: 'bg-emerald-500',
    },
  ];

  const faqs = [
    {
      q: 'Obhyash এ কীভাবে পরীক্ষা দেওয়া যায়?',
      a: 'তুমি তোমার পছন্দমতো বিষয়, অধ্যায় ও টপিক সিলেক্ট করে পরীক্ষার সময়, প্রশ্ন সংখ্যা ও নেগেটিভ মার্কিং কাস্টমাইজ করে মুহূর্তেই পরীক্ষা শুরু করতে পারবে।',
    },
    {
      q: 'পরীক্ষার পর কি সমাধান ও PDF পাওয়া যায়?',
      a: 'হ্যাঁ! প্রতিটি পরীক্ষার সাথে সাথে নির্ভুল ফলাফল, পাঠ্যবইয়ের রেফারেন্স সহ বিস্তারিত সমাধান পাওয়া যায় এবং এক ক্লিকেই সম্পূর্ণ প্রশ্নপত্র ও সমাধান PDF ডাউনলোড করা যায়।',
    },
    {
      q: 'অপশন লকিং সিস্টেম কী?',
      a: 'আসল পরীক্ষার হলের নিয়মানুযায়ী একবার কোনো অপশন সিলেক্ট করলে তা লক হয়ে যায়, যাতে পরীক্ষার হলে অসাবধানতাবশত ভুল করার প্রবণতা দূর হয়।',
    },
    {
      q: 'মোবাইল এবং কম্পিউটার দুটি থেকেই কি ব্যবহার করা যাবে?',
      a: 'হ্যাঁ! Obhyash-এর ওয়েব পোর্টাল এবং মোবাইল অ্যাপে একই অ্যাকাউন্ট দিয়ে যেকোনো ডিভাইসে রিয়েল-টাইম সিঙ্ক সুবিধা নিয়ে প্র্যাকটিস করা যায়।',
    },
    {
      q: 'পেমেন্ট পদ্ধতি কী কী?',
      a: 'বিকাশ, নগদ ও রকেটের মাধ্যমে খুব সহজেই প্রো সাবস্ক্রিপশন নেওয়া যায়।',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors font-sans selection:bg-red-500/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onGetStarted}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start justify-center -space-y-1 select-none">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] leading-none mb-0.5 font-sans">
                OBHYASH
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none pb-1">
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
              className="px-3 py-2 text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              ফিচার
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-2 text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              প্রাইসিং
            </button>
            <Link
              href="/blog"
              className="px-3 py-2 text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              ব্লগ
            </Link>

            {/* Demo Exam Link in Desktop Header */}
            <Link
              href="/demo"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ডেমো পরীক্ষা</span>
            </Link>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

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
              className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              লগইন
            </button>

            {/* 3. Updated Register/Get Started Button */}
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              শুরু করো
            </button>
          </div>

          {/* Mobile Navigation - Direct Buttons */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/demo"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 shadow-xs"
            >
              <span>ডেমো</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLogin}
                className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                লগইন
              </button>
              <button
                onClick={onGetStarted}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-md shadow-emerald-500/20"
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
            {/* Batch & Specialization Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                HSC & SSC স্পেশাল
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                ব্যাচ '২৫ ও '২৬
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                মেডিকেল, বুয়েট ও ঢাবি এডমিশন
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 dark:text-white leading-tight">
              ভুল থেকেই শুরু হোক <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-red-600 py-2">
                নিখুঁত প্রস্তুতি
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              ২,০০,০০০+ অধ্যায়ভিত্তিক ও বিগত বছরের প্রশ্নব্যাংক, রিয়েল টাইমার এক্সাম, একবার ক্লিকেই অপশন লকিং, মূল পাঠ্যবইয়ের প্রমাণসহ নিখুঁত সমাধান এবং অফলাইন PDF ডাউনলোড—সবকিছু এক প্ল্যাটফর্মে।
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <button
                onClick={onGetStarted}
                className="sm:w-auto w-full px-6 py-3 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-[#004633]/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                বিনামূল্যে শুরু করো
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/demo"
                className="sm:w-auto w-full px-5 py-3 bg-white dark:bg-black border-2 border-[#004633]/40 dark:border-emerald-500/60 text-[#004633] dark:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
              >
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>ডেমো পরীক্ষা দাও</span>
              </Link>
            </div>

            {/* Social Proof & App Trust */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700/60 shadow-xs">
                <div className="flex text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="font-bold text-neutral-900 dark:text-white">৪.৯/৫</span>
                <span>• ২০,০০০+ শিক্ষার্থী</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ওয়েব ও অ্যান্ড্রয়েড অ্যাপ সাপোর্ট</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Demo */}
          <div className="lg:w-1/2 w-full perspective-1000">
            <div className="w-full relative bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-700/60 shadow-2xl shadow-neutral-300/40 dark:shadow-black/70 overflow-hidden transform rotate-y-2 hover:rotate-y-0 transition-transform duration-500">
              {/* Fake Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 text-[10px] font-bold">
                  <button
                    onClick={() => setActiveDemoTab('generate')}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${activeDemoTab === 'generate' ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                  >
                    <FileText className="w-3 h-3" /> কাস্টম
                  </button>
                  {/*
                  <button
                    
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${false ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                  >
                    
                  </button>
                  */}
                  <button
                    onClick={() => setActiveDemoTab('analytics')}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all ${activeDemoTab === 'analytics' ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                  >
                    <BarChart3 className="w-3 h-3" /> এনালাইসিস
                  </button>
                </div>
              </div>

              {/* Demo Content Area */}
              <div className="p-6 min-h-[380px] flex flex-col relative">
                {/* 1. Generate Question Demo (Realistic QuestionCard with Lock & Explanation) */}
                {activeDemoTab === 'generate' && (
                  <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                    {/* Question Header Bar */}
                    <div className="flex justify-between items-center border-b pb-2.5 border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>প্রশ্ন {DEMO_QUESTIONS[demoQIndex].number}</span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                          {DEMO_QUESTIONS[demoQIndex].subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{formatTime(timeLeft)}</span>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <h3 className="text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                      <LatexText text={DEMO_QUESTIONS[demoQIndex].text} />
                    </h3>

                    {/* Source Pill & Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold tracking-wide shadow-2xs">
                        <span>🏛️</span>
                        <span>{DEMO_QUESTIONS[demoQIndex].source}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsBookmarked(!isBookmarked)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isBookmarked
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-600'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid (2x2 on desktop, 1-col on mobile) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {DEMO_QUESTIONS[demoQIndex].options.map((opt, i) => {
                        const bengaliLetters = ['ক', 'খ', 'গ', 'ঘ'];
                        const isSelected = selectedOpt === i;
                        const isCorrect = DEMO_QUESTIONS[demoQIndex].correct === i;

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedOpt(i);
                              setShowExplanation(true);
                            }}
                            className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all duration-300 text-xs sm:text-sm cursor-pointer select-none ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 text-emerald-900 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500/30 font-bold scale-[1.01]'
                                : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {bengaliLetters[i]}
                            </span>
                            <span className="flex-1 truncate">
                              <LatexText text={opt} />
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 bg-emerald-100/80 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
                                <Lock className="w-2.5 h-2.5" /> লক
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Warm Book Style Explanation Preview */}
                    {showExplanation && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl overflow-hidden border border-[#E6DCBF] dark:border-neutral-800 shadow-sm mt-3">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-[#F3ECE4] dark:bg-[#1A1816] border-b border-[#E6DCBF]/70 dark:border-neutral-800">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#5C4D3C] dark:text-[#E0D5C1]">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>ব্যাখ্যা ও পাঠ্যবই রেফারেন্স</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                            সঠিক উত্তর
                          </span>
                        </div>
                        <div className="p-3 bg-[#FAF7F2] dark:bg-[#121110] text-xs text-[#42372A] dark:text-neutral-300 leading-relaxed space-y-1.5">
                          <LatexText text={DEMO_QUESTIONS[demoQIndex].explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/*
                {false && (
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
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(200,16,46,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                      <Zap className="w-4 h-4 animate-pulse" />
                      উত্তরপত্র যাচাই চলছে...
                    </div>
                  </div>
                )}
                */}

                {/* 3. Analytics Demo */}
                {activeDemoTab === 'analytics' && (
                  <div className="animate-in fade-in zoom-in duration-300 pt-2 w-full space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">
                          গড় স্কোর
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          ৭৮%
                        </div>
                      </div>
                      <div className="flex-1 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                        <div className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wide">
                          পরীক্ষা
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          ২৪
                        </div>
                      </div>
                      <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">
                          XP
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                          ১২৪০
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-1">
                      {[
                        { name: 'পদার্থবিজ্ঞান', pct: 85, good: true },
                        { name: 'রসায়ন', pct: 52, good: false },
                        { name: 'জীববিজ্ঞান', pct: 74, good: true },
                        { name: 'গণিত', pct: 91, good: true },
                      ].map((s) => (
                        <div key={s.name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                              {s.name}
                            </span>
                            <span
                              className={`text-xs font-bold ${s.good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                              {s.pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${s.good ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-200 dark:border-red-800">
                        ⚠ দুর্বল: রসায়ন
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                        ★ সেরা: গণিত
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Trust Bar */}
      <section className="py-6 bg-neutral-50/50 dark:bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>দেশের শীর্ষ কলেজ ও বিশ্ববিদ্যালয়ের শিক্ষার্থীদের আস্থার প্রতীক</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
            {[
              { name: 'নটর ডেম কলেজ', badge: 'NDC', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300' },
              { name: 'হলিক্রস কলেজ', badge: 'HCC', color: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300' },
              { name: 'সেন্ট যোসেফ উচ্চ মাধ্যমিক', badge: 'SJHEC', color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300' },
              { name: 'রাজউক উত্তরা মডেল', badge: 'RUMC', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300' },
              { name: 'ঢাকা কলেজ', badge: 'DC', color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300' },
              { name: 'ভিকারুননিসা নূন', badge: 'VNC', color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300' },
              { name: 'বুয়েট এডমিশন', badge: 'BUET', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300' },
              { name: 'মেডিকেল ভর্তি পরীক্ষা', badge: 'DMC / MAT', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300' },
              { name: 'ঢাকা বিশ্ববিদ্যালয়', badge: 'DU "KA"', color: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300' },
              { name: 'সকল শিক্ষা বোর্ড', badge: 'All Boards', color: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200' },
            ].map((inst, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 shadow-2xs ${inst.color}`}
              >
                <span className="text-[10px] font-black opacity-75 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 uppercase">
                  {inst.badge}
                </span>
                <span>{inst.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Stats Banner */}
      <section className="py-12 bg-neutral-50/50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-[#004633] dark:text-emerald-400">
                ২০,০০০+
              </h3>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 tracking-wide">
                সক্রিয় শিক্ষার্থী
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                ১,৫০০+
              </h3>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 tracking-wide">
                মডেল টেস্ট
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-[#004633] dark:text-emerald-400">
                ২,০০,০০০+
              </h3>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 tracking-wide">
                প্রশ্ন ও নির্ভুল সমাধান
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-[#004633] dark:text-emerald-400">
                ১২+
              </h3>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 tracking-wide">
                বিষয় ও বোর্ড প্রস্তুতি
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid - Why Obhyash? */}
      <section
        id="features"
        className="py-24 bg-neutral-50/50 dark:bg-black max-w-full px-0"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-0">
          <div className="mb-16 text-center">
            <span className="text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-sm">
              কেন আমরা সেরা?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1.5">
              তোমার প্রস্তুতিকে দাও <br className="hidden md:block" />
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-red-500">
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

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:pb-0 md:mx-0 md:px-0 no-scrollbar">
              {/* 1. Real Exam & Option Locking */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                  <Zap className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  রিয়েল এক্সাম ও অপশন লকিং
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  পরীক্ষার হলের মতোই একবার অপশন দাগালে লক হয়ে যাবে। সাথে থাকছে ০ মিলিসেকেন্ডে তাৎক্ষণিক খাতা জমা ও ফলাফল।
                </p>
              </div>

              {/* 2. Textbook Solutions & References */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                  <BookOpen className="w-8 h-8 md:w-7 md:h-7 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  প্রমাণসহ বিস্তারিত সমাধান
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  প্রতিটি প্রশ্নের সাথে মূল পাঠ্যবই ও সম্মানিত লেখকদের রেফারেন্স সহ পুঙ্খানুপুঙ্খ ব্যাখ্যা ও সঠিক সূত্র।
                </p>
              </div>

              {/* 3. Question Paper & Result PDF Downloads */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                  <FileText className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  অফলাইন PDF ডাউনলোড
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  অনুশীলনের পর এক ক্লিকেই সম্পূর্ণ ২-কলাম প্রশ্নপত্র এবং ব্যাখ্যা সহ উত্তরপত্র PDF প্রিন্ট বা ডাউনলোড করো।
                </p>
              </div>

              {/* 4. 3-Metric Detailed Analytics */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                  <BarChart3 className="w-8 h-8 md:w-7 md:h-7 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  সঠিকতা ও নেগেটিভ হিসাব
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  সঠিকতা (%), ব্যয়িত সময় ও নেগেটিভ মার্কিংয়ের নিখুঁত ২-কলাম টেবিল দেখে নিজের অবস্থান স্পষ্ট বোঝো।
                </p>
              </div>

              {/* 5. Daily Streak & Leaderboard */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                  <Flame className="w-8 h-8 md:w-7 md:h-7 text-red-500" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  ডেইলি স্ট্রাইক ও লিডারবোর্ড
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  পড়াশোনার ধারাবাহিকতা বজায় রাখতে ফ্লেম স্ট্রিক এবং কলেজ ও জাতীয় লিডারবোর্ডে বন্ধুদের সাথে প্রতিযোগিতা।
                </p>
              </div>

              {/* 6. Spaced Repetition Revision */}
              <div className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
                <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                  <RotateCcw className="w-8 h-8 md:w-7 md:h-7 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  ভুল প্রশ্নের স্মার্ট রিভিশন
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                  পরীক্ষায় যেসব প্রশ্ন ভুল হয়, সেগুলোকে চিহ্নিত করে বারবার অনুশীলনের মাধ্যমে দুর্বলতা চিরতরে দূর করো।
                </p>
              </div>
            </div>
          </div>

          {/* Future Features (Coming Soon) */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800 animate-pulse">
                🚀 আসছে শীঘ্রই (Coming Soon)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
              {/* Live Model Test */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
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
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
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
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white">
                    ভার্সিটি প্রেডিক্টর
                  </h3>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  তোমার স্কোর অনুযায়ী চান্স পাওয়ার সম্ভাবনা যাচাই।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Comparison: Traditional Guidebooks vs Obhyash */}
      <section className="py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              স্মার্ট প্রস্তুতি
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-950 dark:text-white">
              প্রচলিত গাইড বই বনাম <span className="text-emerald-600 dark:text-emerald-400">অভ্যাস প্ল্যাটফর্ম</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
              কেন হাজার হাজার শিক্ষার্থী ভারী গাইড বই ও ভুলে ভরা সমাধান ছেড়ে অভ্যাসের আধুনিক ডিজিটাল সিস্টেমে প্রস্তুতি নিচ্ছে?
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60">
                  <th className="py-5 px-6 font-bold text-sm text-neutral-700 dark:text-neutral-300 w-2/5">
                    ফিচার ও সুবিধার তুলনা
                  </th>
                  <th className="py-5 px-6 font-bold text-sm text-rose-600 dark:text-rose-400 w-[30%]">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 shrink-0" />
                      প্রচলিত গাইড বই / টেস্ট পেপার
                    </span>
                  </th>
                  <th className="py-5 px-6 font-bold text-sm text-emerald-600 dark:text-emerald-400 w-[30%] bg-emerald-50/60 dark:bg-emerald-950/30">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      অভ্যাস (Obhyash) প্ল্যাটফর্ম
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 text-xs sm:text-sm">
                {[
                  {
                    feature: 'প্রশ্নের পরিধি ও আপডেট',
                    desc: 'নতুন সিলেবাস ও বোর্ডের পরিবর্তন অনুসারে আপডেট',
                    trad: 'পুরোনো ছাপা সংস্করণের বই, বছরে একবার আপডেট হয়',
                    obhyash: '২,০০,০০০+ প্রশ্নব্যাংক ও প্রতিনিয়ত রিয়েল-টাইম আপডেট',
                  },
                  {
                    feature: 'সমাধানের নির্ভরযোগ্যতা',
                    desc: 'ভুল উত্তর ও রেফারেন্সের নিশ্চয়তা',
                    trad: 'প্রচুর টাইপো ও ভুল উত্তর, কোনো রেফারেন্স ছাড়াই উত্তর দেওয়া',
                    obhyash: '১০০% ভেরিফাইড ও মূল পাঠ্যবইয়ের পৃষ্ঠা রেফারেন্সসহ ব্যাখ্যা',
                  },
                  {
                    feature: 'পরীক্ষার অনুভূতি ও টাইমিং',
                    desc: 'আসল পরীক্ষার মতো টাইম ও নেগেটিভ মার্কিং হিসাব',
                    trad: 'ঘড়ি দেখে মেলাতে গিয়ে বিভ্রান্তি, নেগেটিভ মার্কিং হিসাবের ঝামেলা',
                    obhyash: 'কাউন্টডাউন টাইমার, অটো সাবমিশন ও স্বয়ংক্রিয় নেগেটিভ মার্কিং',
                  },
                  {
                    feature: 'দুর্বলতা শনাক্তকরণ (Analytics)',
                    desc: 'কোন বিষয়ে ও কোন অধ্যায়ে মার্কস কম আসছে',
                    trad: 'নিজের ভুল বিশ্লেষণ করা প্রায় অসম্ভব, কেবল আন্দাজে পড়া',
                    obhyash: '৩-মেট্রিক গ্রাফ, বিষয়ভিত্তিক নির্ভুলতা ও দুর্বল চ্যাপ্টার ট্র্যাকার',
                  },
                  {
                    feature: 'ভুল প্রশ্নের রিভিশন ও বুকমার্ক',
                    desc: 'পরীক্ষার আগের রাতে গুরুত্বপূর্ণ প্রশ্ন রিভিশন',
                    trad: 'হাজার পৃষ্ঠার দাগানো বই ও খাতার পাতা হাতড়ানো',
                    obhyash: '১ ক্লিকে বুকমার্ক ও ভুল প্রশ্নের স্বয়ংক্রিয় রিভিশন শিট তৈরি',
                  },
                  {
                    feature: 'পোর্টাবিলিটি ও অ্যাক্সেসিবিলিটি',
                    desc: 'যেকোনো জায়গায় বসে তাৎক্ষণিক পড়ার সুযোগ',
                    trad: '৫-১০ কেজির ভারী বই বহন করা অসম্ভব',
                    obhyash: 'মোবাইল বা ল্যাপটপে পকেটের ভেতর সবসময় সাথে থাকে',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-neutral-900 dark:text-white">{row.feature}</p>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{row.desc}</p>
                    </td>
                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                        <span>{row.trad}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-neutral-900 dark:text-emerald-200 font-semibold bg-emerald-50/30 dark:bg-emerald-950/15">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="text-emerald-900 dark:text-emerald-300 font-medium">{row.obhyash}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#004633]/25 transition-all active:scale-95 cursor-pointer"
            >
              আজই স্মার্ট প্রস্তুতি শুরু করো
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. How It Works - Workflow */}
      <section className="py-24 bg-neutral-50 dark:bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              কিভাবে শুরু করবেন?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm max-w-2xl mx-auto">
              খুব সহজেই মাত্র ৩টি ধাপে নিজেকে যাচাই করো
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {/* Animated Connecting Stream Line (Desktop) */}
            <div className="hidden md:block absolute top-10 sm:top-12 left-[18%] right-[18%] h-1 z-0 pointer-events-none">
              {/* Base Dashed Line */}
              <div className="w-full h-0.5 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700/80 mt-0.5" />

              {/* Energy Laser Beam Traveling across the line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
                <div
                  className="w-36 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  style={{
                    animation: 'flowBeam 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  }}
                />
              </div>

              {/* Glowing Travelling Photon Dot */}
              <div
                className="absolute top-[-3px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#10B981]"
                style={{
                  animation: 'flowBeam 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                }}
              />
            </div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5">
              <div className="relative mb-6">
                {/* Sonar Ripple Ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '0s',
                  }}
                />
                {/* Secondary Ripple */}
                <div
                  className="absolute inset-0 rounded-full border border-emerald-400/30 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '1.5s',
                  }}
                />

                {/* Main Circle */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-neutral-900 rounded-full border-3 sm:border-4 border-emerald-500 dark:border-emerald-500/80 flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-all duration-300 relative z-10"
                  style={{
                    animation: 'pulseGlowEmerald 3s ease-in-out infinite',
                    animationDelay: '0s',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                    ১
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                অ্যাকাউন্ট খোলো
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm max-w-xs px-2 leading-relaxed">
                গুগল বা ইমেইল দিয়ে মাত্র ১০ সেকেন্ডে ফ্রি রেজিস্ট্রেশন করো।
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5">
              <div className="relative mb-6">
                {/* Sonar Ripple Ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-red-500/50 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '1s',
                  }}
                />
                {/* Secondary Ripple */}
                <div
                  className="absolute inset-0 rounded-full border border-red-500/30 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '2.5s',
                  }}
                />

                {/* Main Circle */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-neutral-900 rounded-full border-3 sm:border-4 border-red-500 dark:border-red-500/80 flex items-center justify-center shadow-xl shadow-red-500/20 group-hover:scale-110 transition-all duration-300 relative z-10"
                  style={{
                    animation: 'pulseGlowRed 3s ease-in-out infinite',
                    animationDelay: '1s',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 transition-transform duration-300 group-hover:scale-110">
                    ২
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-1.5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                পরীক্ষা দাও
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm max-w-xs px-2 leading-relaxed">
                অ্যাপে বা খাতায় পরীক্ষা দিয়ে সাথে সাথেই উত্তরপত্র আপলোড করো।
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5">
              <div className="relative mb-6">
                {/* Sonar Ripple Ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '2s',
                  }}
                />
                {/* Secondary Ripple */}
                <div
                  className="absolute inset-0 rounded-full border border-emerald-400/30 pointer-events-none"
                  style={{
                    animation: 'rippleSonar 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                    animationDelay: '0.5s',
                  }}
                />

                {/* Main Circle */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-neutral-900 rounded-full border-3 sm:border-4 border-emerald-500 dark:border-emerald-500/80 flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-all duration-300 relative z-10"
                  style={{
                    animation: 'pulseGlowEmerald 3s ease-in-out infinite',
                    animationDelay: '2s',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                    ৩
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                ফলাফল দেখো
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm max-w-xs px-2 leading-relaxed">
                সঠিকতা ও নেগেটিভ মার্কিংয়ের নিখুঁত রিপোর্ট দেখে নিজের দুর্বলতাগুলো কাটিয়ে ওঠো।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Pricing Countdown CTA */}
      <section className="py-20 bg-emerald-50/30 dark:bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md">
              <CalendarDays className="w-3.5 h-3.5" />
              পরীক্ষার কাউন্টডাউন
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              পরীক্ষার আগে প্রতিটি দিন মূল্যবান
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1.5 text-xs sm:text-sm max-w-xl mx-auto text-xs sm:text-sm">
              আজই শুরু করো — দেরি হলে পস্তাবে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {/* HSC */}
            <div
              onClick={onGetStarted}
              className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-3xl p-8 text-center hover:bg-white/90 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 group-hover:bg-red-500/10 rounded-full blur-2xl transition-colors" />
              <div className="relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📚</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
                  এইচএসসি ২০২৬
                </h3>
                {examCountdowns.hsc2026 > 0 ? (
                  <>
                    <div
                      className={`text-4xl sm:text-5xl font-black mb-1 tabular-nums tracking-tighter ${
                        examCountdowns.hsc2026 <= 30
                          ? 'text-red-500 dark:text-red-400 animate-pulse'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {examCountdowns.hsc2026}
                    </div>
                    <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">দিন বাকি</p>
                    {examCountdowns.hsc2026 <= 30 && (
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-full border border-red-200 dark:border-red-500/30 animate-pulse shadow-sm">
                          সময় কমছে — এখনই শুরু করো!
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-neutral-500 text-sm">পরীক্ষা শেষ হয়েছে</p>
                )}
              </div>
            </div>

            {/* MBBS */}
            <div
              onClick={onGetStarted}
              className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-3xl p-8 text-center hover:bg-white/90 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-colors" />
              <div className="relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏥</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
                  মেডিকেল ভর্তি ২০২৬
                </h3>
                <div className="text-4xl sm:text-5xl font-black text-[#004633] dark:text-emerald-400 mb-1 tabular-nums tracking-tighter">
                  {examCountdowns.mbbs2026}
                </div>
                <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">দিন বাকি</p>
              </div>
            </div>

            {/* Varsity */}
            <div
              onClick={onGetStarted}
              className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-3xl p-8 text-center hover:bg-white/90 dark:hover:bg-white/8 hover:border-neutral-300 dark:hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-neutral-500/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-500/5 group-hover:bg-neutral-500/10 rounded-full blur-2xl transition-colors" />
              <div className="relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
                  বিশ্ববিদ্যালয় ভর্তি ২০২৬
                </h3>
                <div className="text-4xl sm:text-5xl font-black text-neutral-800 dark:text-neutral-200 mb-1 tabular-nums tracking-tighter">
                  {examCountdowns.varsity2026}
                </div>
                <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">দিন বাকি</p>
              </div>
            </div>
          </div>

          <div className="text-center relative z-10">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/20 dark:shadow-emerald-900/30 transition-all active:scale-95 group"
            >
              বিনামূল্যে শুরু করো
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-4 font-medium">
              কোনো ক্রেডিট কার্ড লাগবে না &middot; ৩০ সেকেন্ডে রেজিস্ট্রেশন
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-neutral-50 dark:bg-black"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Crown className="w-3.5 h-3.5 text-emerald-600" />
              <span>সাশ্রয়ী ও ট্রান্সপারেন্ট প্রাইসিং</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              তোমার প্রস্তুতির সেরা প্ল্যানটি{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                বেছে নাও
              </span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              কোনো লুকানো চার্জ নেই। যেকোনো সময় বিকাশ, নগদ বা কার্ড দিয়ে সহজে সাবস্ক্রাইব করো।
            </p>
          </div>

          {/* Pricing Cards - Single Row Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr gap-3.5 xl:gap-4 items-stretch mb-16">
            {pricingPlans.map((plan, i) => {
              const isPopular = Boolean(plan.highlight);
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                    isPopular
                      ? 'bg-white dark:bg-[#18181b] border-2 border-[#22c55e] dark:border-[#22c55e] shadow-xl shadow-emerald-500/10 z-10'
                      : 'bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Floating Badge on Top Border */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#22c55e] text-black font-black text-[11px] uppercase tracking-wider shadow-md whitespace-nowrap">
                      মোস্ট পপুলার
                    </div>
                  )}

                  <div>
                    {/* Plan Title */}
                    <div className="mb-2">
                      <span
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isPopular
                            ? 'text-[#22c55e]'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {plan.title}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                        ৳{plan.price}
                      </span>
                    </div>

                    {/* Period Subtitle */}
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1 mb-6">
                      {plan.period}
                    </p>

                    {/* Feature List */}
                    <ul className="space-y-3 mb-8">
                      {(plan.features || []).map((feature: string, f: number) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium leading-snug"
                        >
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPopular
                                ? 'text-[#22c55e]'
                                : 'text-sky-500 dark:text-sky-400'
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
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-center ${
                      isPopular
                        ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black font-black shadow-lg shadow-emerald-500/25 active:scale-95'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272a] dark:hover:bg-[#323236] text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700/60 font-bold active:scale-95'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Free vs Pro Detailed Comparison Table */}
          <div className="rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white text-center sm:text-left">
                ফ্রি বনাম প্রো প্যাকেজের স্পষ্ট তুলনা
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 text-center sm:text-left">
                দেখে নাও ফ্রি প্ল্যানে কী কী পাচ্ছ আর প্রো প্ল্যান কেন তোমার প্রস্তুতিকে এগিয়ে রাখবে
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50/50 dark:bg-neutral-950/40">
                    <th className="py-4 px-6">ফিচার সমূহ</th>
                    <th className="py-4 px-6 text-center">ফ্রি প্ল্যান (Free)</th>
                    <th className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50/50 dark:bg-emerald-950/20">
                      প্রো প্যাকেজ (Pro)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      দৈনিক প্র্যাকটিস ও এক্সাম
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-500">২টি / দিন</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      সীমাহীন আনলিমিটেড
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      প্রশ্নের বিস্তারিত সমাধান ও বইয়ের রেফারেন্স
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-400">❌ সীমিত</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ মূল পাঠ্যবই ও লেখক রেফারেন্স সহ
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      ২-কলাম প্রশ্নপত্র ও উত্তরপত্র PDF প্রিন্ট
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-400">❌ নেই</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ আনলিমিটেড ডাউনলোড ও অফলাইন প্রিন্ট
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      ৩-মেট্রিক অ্যানালাইসিস ও নেগেটিভ হিসাব
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-500">বেসিক স্কোর</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ সঠিকতা %, ব্যয়িত সময় ও নেগেটিভ টেবিল
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      বুকমার্ক ও ভুল প্রশ্নের রিভিশন শিট
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-500">সর্বোচ্চ ২৫টি</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ সীমাহীন সেভ ও রিভিশন
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      ডেইলি স্ট্রিক ও লিডারবোর্ড
                    </td>
                    <td className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-400">✓ সাধারণ</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ প্রো ব্যাজ ও লিডারবোর্ড অগ্রাধিকার
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                      বিজ্ঞাপনমুক্ত নিরবচ্ছিন্ন পরিবেশ
                    </td>
                    <td className="py-4 px-6 text-center text-neutral-500">স্ট্যান্ডার্ড</td>
                    <td className="py-4 px-6 text-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                      ✓ ১০০% বিজ্ঞাপনমুক্ত
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-neutral-50/80 dark:bg-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>নিরাপদ পেমেন্ট গেটওয়ে:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#E2136E] text-white shadow-2xs">
                    bKash
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#F7941D] text-white shadow-2xs">
                    Nagad
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#8B2D88] text-white shadow-2xs">
                    Rocket
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#005CA9] text-white shadow-2xs">
                    Upay
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1A1F71] text-white shadow-2xs">
                    VISA
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EB001B] text-white shadow-2xs">
                    Mastercard
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 py-3 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-xs shadow-md shadow-[#004633]/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>প্রো প্ল্যানে আপগ্রেড করো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-red-50/20 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              শিক্ষার্থীরা যা বলছে
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1.5 text-xs sm:text-sm">
              দেশের বিভিন্ন প্রান্ত থেকে হাজারো শিক্ষার্থী Obhyash ব্যবহার করছে
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900/70 p-8 rounded-3xl border border-red-100 dark:border-neutral-800/80 shadow-md hover:shadow-xl hover:shadow-red-500/5 relative hover:-translate-y-2 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${item.color} shadow-md`}
                  >
                    {item.initial}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                      {item.role}
                    </div>
                  </div>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-2 text-xs sm:text-sm leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 lg:px-6 relative">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`bg-white dark:bg-neutral-900/60 rounded-2xl border transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 shadow-sm hover:shadow-lg ${isOpen ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/10' : 'border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'}`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-start justify-between gap-4 group"
                >
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-start gap-2.5">
                    <span
                      className={`text-emerald-500 text-xl leading-none transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}
                    >
                      Q.
                    </span>
                    {faq.q}
                  </h3>
                  <div
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-emerald-500 border-emerald-500 text-white rotate-180' : 'text-neutral-400 group-hover:text-emerald-500 group-hover:border-emerald-500'}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out px-6 ${isOpen ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                >
                  <div className="pl-7 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed border-t border-neutral-50 dark:border-neutral-800/50 pt-3">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-50 dark:bg-black pt-20 pb-10 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                  অভ্যাস
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
                HSC, ইঞ্জিনিয়ারিং, মেডিকেল ও ভার্সিটি ভর্তি পরীক্ষার জন্য বাংলাদেশের সবচেয়ে দ্রুত ও আধুনিক অনলাইন এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম।
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/share/18779ur8WD/"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
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
                  href="https://wa.me/8801409583992"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
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
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    প্রাইসিং
                  </button>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    ব্লগ
                  </Link>
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
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    ব্যবহারের শর্তাবলী (Terms)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    গোপনীয়তা নীতি (Privacy)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    রিফান্ড পলিসি
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/referral-program"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-semibold"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    রেফারেল প্রোগ্রাম 🎁
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
                  <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span>
                    লেভেল ৪, উত্তরা সেক্টর ১৩, <br /> ঢাকা-১২৩০, বাংলাদেশ
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>+880 1409-583992</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>support@obhyash.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center md:text-left">
              © {new Date().getFullYear()} Obhyash Platform. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-500">
              <span className="flex items-center gap-1">
                অভ্যাসে শুরু{' '}
                <span className="text-red-500 animate-pulse">✒️</span>
                সাফল্যে শেষ
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Floating CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#004633] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            অ
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">অভ্যাস প্ল্যাটফর্ম</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">২,০০,০০০+ প্রশ্নব্যাংক • ফ্রি</p>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="px-4 py-2.5 bg-[#004633] hover:bg-[#003828] text-white rounded-xl font-bold text-xs shadow-md shadow-[#004633]/25 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>শুরু করো</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
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
    </div>
  );
};

export default LandingPage;
