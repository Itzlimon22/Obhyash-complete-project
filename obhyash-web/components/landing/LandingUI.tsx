'use client';

import React, { useState, useEffect } from 'react';
import LatexText from '@/components/student/ui/LatexText';
import { CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// --- Dynamic Feature Demos ---

// --- COMPONENT 1: Interactive Exam Demo (The Widget) ---
export const ExamDemo = () => {
  const [timeLeft, setTimeLeft] = useState(1200);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [show, setShow] = useState(true);

  const questions = React.useMemo(
    () => [
      {
        text: 'নিউটনের দ্বিতীয় সূত্র কোনটি?',
        opts: ['$v = u + at$', '$F = ma$', '$E = mc^2$', '$s = vt$'],
        correct: 1,
      },
      {
        text: 'পানির রাসায়নিক সংকেত কী?',
        opts: ['$CO_2$', '$NaCl$', '$H_2O$', '$O_2$'],
        correct: 2,
      },
      {
        text: 'বৃত্তের ক্ষেত্রফল নির্ণয়ের সূত্র?',
        opts: ['$\\pi r^2$', '$2\\pi r$', '$\\frac{1}{2}bh$', '$a^2+b^2$'],
        correct: 0,
      },
    ],
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 1200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Sequence: Show -> Wait -> Select -> Wait -> Hide -> Change -> Show
    let t1: NodeJS.Timeout, t2: NodeJS.Timeout, t3: NodeJS.Timeout;

    const runSequence = () => {
      setSelectedOpt(null);
      setShow(true);

      // Select option after 1.5s
      t1 = setTimeout(() => {
        setSelectedOpt(questions[qIndex].correct);
      }, 1500);

      // Hide after 3.5s
      t2 = setTimeout(() => {
        setShow(false);
      }, 3500);

      // Change question after 4s (0.5s fade out)
      t3 = setTimeout(() => {
        setQIndex((prev) => (prev + 1) % questions.length);
      }, 4000);
    };

    runSequence();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [qIndex, questions]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  return (
    <div className="w-full bg-white dark:bg-black border border-red-100 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 p-6 shadow-2xl relative overflow-hidden group hover:border-indigo-500 dark:hover:border-indigo-900 transition-colors h-[320px] flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-rose-600"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-red-50 dark:border-neutral-800 pb-4">
        <span className="font-bold text-neutral-800 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          পদার্থবিজ্ঞান ১ম পত্র
        </span>
        <span className="px-3 py-1 bg-red-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-mono font-bold rounded-lg border border-red-100 dark:border-neutral-700">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Question Body */}
      <div
        className={`flex-1 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
      >
        <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          <LatexText text={questions[qIndex].text} />
        </h4>

        <div className="grid grid-cols-1 gap-3">
          {questions[qIndex].opts.map((opt, i) => (
            <div
              key={i}
              className={`
                            px-4 py-3 rounded-xl border flex items-center justify-center transition-all duration-300
                            ${
                              selectedOpt === i
                                ? 'bg-red-50 dark:bg-rose-900/20 border-rose-600 text-rose-700 dark:text-rose-300 shadow-sm transform scale-[1.02]'
                                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                            }
                        `}
            >
              <span className="text-sm font-medium">
                <LatexText text={opt} />
              </span>
              {selectedOpt === i && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-rose-600 ml-auto"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  isDarkMode,
  toggleTheme,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<
    'generate' | 'omr' | 'analytics'
  >('generate');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const demoQuestion = {
    id: 1,
    text: 'একটি কণা $v = u + at$ সূত্র মেনে চলে। যদি $u=0$ এবং $a=5 ms^{-2}$ হয়, তবে $t=4s$ এ বেগ কত?',
    options: ['10 $ms^{-1}$', '20 $ms^{-1}$', '15 $ms^{-1}$', '25 $ms^{-1}$'],
    correctAnswerIndex: 1,
    explanation: 'আমরা জানি, $v = u + at = 0 + 5 \\times 4 = 20 ms^{-1}$',
  };

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

  const pricingPlans = [
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
      cta: 'বিনামূল্যে শুরু করো',
      color: 'border-neutral-200 dark:border-neutral-800',
      buttonColor:
        'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
    },
    {
      title: 'মাসিক (Monthly)',
      price: '১৪৯',
      period: '/১ মাস',
      features: [
        'আনলিমিটেড এক্সাম',
        'আনলিমিটেড OMR স্ক্যান',
        'AI ব্যাখ্যাসহ সমাধান',
        'অ্যাডভান্সড এনালাইসিস',
        'বিজ্ঞাপনমুক্ত অভিজ্ঞতা',
      ],
      cta: 'সাবস্ক্রাইব করো',
      highlight: true,
      color: 'border-indigo-500 ring-2 ring-indigo-500/20',
      buttonColor:
        'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30',
    },
    {
      title: 'ত্রৈমাসিক (Quarterly)',
      price: '২৯৯',
      period: '/৩ মাস',
      features: [
        'মাসিক প্ল্যানের সব সুবিধা',
        '৩৩% সাশ্রয় (বিশাল ছাড়)',
        'অগ্রাধিকার সাপোর্ট',
        'নতুন ফিচারে আর্লি এক্সেস',
      ],
      cta: 'ব্যান্ডেল কিনুন',
      color: 'border-rose-500',
      buttonColor:
        'bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:from-rose-700 hover:to-orange-700 shadow-lg shadow-rose-500/30',
    },
  ];

  const faqs = [
    {
      q: 'Obhyash অ্যাপটি কি সম্পূর্ণ ফ্রি?',
      a: "আমাদের একটি 'বেসিক' প্ল্যান আছে যা আজীবন ফ্রি। এতে প্রতিদিন ১টি ফ্রি এক্সাম এবং লিমিটেড ফিচার ব্যবহারের সুযোগ রয়েছে। তবে আনলিমিটেড এক্সাম, AI ব্যাখ্যা এবং অ্যাডভান্সড এনালাইসিস ব্যবহারের জন্য আপনাকে মাসিক বা ত্রৈমাসিক সাবস্ক্রিপশন নিতে হবে।",
    },
    {
      q: 'OMR স্ক্যান ফিচারটি কিভাবে কাজ করে?',
      a: 'বাসায় বসে সাধারণ কাগজে পরীক্ষা দাও এবং আমাদের অ্যাপের ক্যামেরা দিয়ে ওএমআর শিটটির ছবি তোলো। আমাদের অত্যাধুনিক AI ২০ সেকেন্ডের মধ্যে আপনার খাতা মূল্যায়ন করে নির্ভুল স্কোর এবং সঠিক উত্তরের ব্যাখ্যা দেখাবে। এটি কোচিং সেন্টারের ওএমআর রিডারের মতোই কার্যকর।',
    },
    {
      q: 'AI ব্যাখ্যা এবং সমাধান কতটা নির্ভুল?',
      a: 'আমরা গুগল-এর শক্তিশালী Gemini AI ব্যবহার করি যা গাণিতিক সমস্যা এবং সৃজনশীল যুক্তিতে অত্যন্ত দক্ষ। এটি প্রতিটি ভুল উত্তরের পেছনে কারণ ব্যাখ্যা করে এবং সঠিক সমাধান বুঝতে সাহায্য করে। তবে আমরা সবসময় টেক্সটবুক ফলো করার পরামর্শ দেই।',
    },
    {
      q: 'সাবস্ক্রিপশন পেমেন্ট করার পদ্ধতি কী?',
      a: 'আমরা বাংলাদেশের জনপ্রিয় সব পেমেন্ট মেথড সাপোর্ট করি। আপনি bKash, নাগদ বা রকেটের মাধ্যমে খুব সহজেই পেমেন্ট করতে পারবেন। পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই আপনার অ্যাকাউন্ট প্রিমিয়াম ফিচারে আপডেট হয়ে যাবে।',
    },
    {
      q: 'আমি কি একাধিক ডিভাইসে অ্যাপটি ব্যবহার করতে পারবো?',
      a: 'হ্যাঁ, আপনি একই অ্যাকাউন্ট দিয়ে স্মার্টফোন, ট্যাবলেট এবং পিসিতে লগইন করতে পারবেন। আপনার সব এক্সাম রেকর্ড এবং ডাটা ক্লাউডে সুরক্ষিত থাকবে, ফলে আপনি যেকোনো ডিভাইস থেকে নিজের অগ্রগতি দেখতে পাবেন।',
    },
    {
      q: 'প্রশ্নপত্র কি ডাউনলোড বা প্রিন্ট করা যায়?',
      a: 'অবশ্যই! আমাদের প্রিমিয়াম ইউজাররা চাইলে যেকোনো কাস্টম প্রশ্নপত্র এবং ওএমআর শিট PDF আকারে ডাউনলোড করতে পারেন। এটি অফলাইনে পরীক্ষা দেওয়ার এবং প্র্যাকটিস করার জন্য অত্যন্ত সহায়ক।',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors font-sans selection:bg-rose-500/20">
      {/* Background Gradients - Adjusted for Reddish Theme */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-500/10 dark:bg-transparent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-500/10 dark:bg-transparent rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-red-500/5 dark:bg-transparent rounded-full blur-[80px]"></div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-red-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onGetStarted}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                />
              </svg>
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

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
            >
              শুরু করুন
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              এক সাবস্ক্রিপশনেই সব ফিচার
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.25]">
              আপনার প্রস্তুতি হোক <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-600 py-2">
                স্মার্ট ও নির্ভুল
              </span>
            </h1>

            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              আনলিমিটেড প্রশ্নে ইচ্ছেমতো পরীক্ষা,{' '}
              <span className="text-indigo-600 dark:text-indigo-400">
                OMR Upload
              </span>{' '}
              এবং নিজের অগ্রগতি যাচাই করো এক নিমিষেই। একাডেমিক এবং অ্যাডমিশন
              প্রস্তুতির সেরা সঙ্গী।
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={onGetStarted}
                className="sm:w-auto w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                নতুন পরীক্ষা দাও
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  window.scrollTo({ top: 800, behavior: 'smooth' })
                }
                className="sm:w-auto w-full px-8 py-4 bg-white dark:bg-black border-2 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl font-bold text-base transition-all active:scale-95 flex items-center justify-center whitespace-nowrap"
              >
                ফিচারগুলো দেখো
              </button>
            </div>

            <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-sm text-neutral-600 dark:text-neutral-500 font-medium">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                আনলিমিটেড এক্সাম
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                দেশব্যাপী লিডারবোর্ড
              </span>
            </div>
          </div>

          {/* Right Interactive Demo */}
          <div className="lg:w-1/2 w-full">
            <div className="w-full relative bg-white dark:bg-black rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-red-100 dark:border-neutral-800 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 overflow-hidden">
              {/* Fake Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex bg-neutral-800 rounded-lg p-1 text-[10px] font-bold">
                  <button
                    onClick={() => setActiveDemoTab('generate')}
                    className={`px-3 py-1 rounded-md transition-all ${activeDemoTab === 'generate' ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`}
                  >
                    কাস্টম এক্সাম
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('omr')}
                    className={`px-3 py-1 rounded-md transition-all ${activeDemoTab === 'omr' ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`}
                  >
                    OMR যাচাই
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('analytics')}
                    className={`px-3 py-1 rounded-md transition-all ${activeDemoTab === 'analytics' ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`}
                  >
                    এনালাইসিস
                  </button>
                </div>
              </div>

              {/* Demo Content Area */}
              <div className="p-6 min-h-[380px] flex flex-col relative">
                {/* Demo Tabs */}
                {activeDemoTab === 'generate' && (
                  <div className="animate-fade-in space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
                        Input Prompt
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          পদার্থবিজ্ঞান ১ম পত্র{' '}
                        </span>
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          নিউটনীয় বলবিদ্যা{' '}
                        </span>
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          কঠিন{' '}
                        </span>
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          ADMISSION{' '}
                        </span>
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          ২০ মার্কস{' '}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-black border-l-4 border-l-indigo-600 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800 rounded-r-xl shadow-sm p-5">
                      <div className="flex justify-between mb-4">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                          Question Demo
                        </span>
                        <span className="text-xs font-bold text-neutral-400">
                          1.0 Mark
                        </span>
                      </div>
                      <h3 className="font-serif-exam text-lg text-neutral-900 dark:text-neutral-200 mb-4">
                        <LatexText text={demoQuestion.text} />
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {demoQuestion.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded border text-sm font-medium ${i === 1 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
                          >
                            <LatexText text={opt} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeDemoTab === 'omr' && (
                  <div className="animate-fade-in flex flex-col items-center justify-center h-full pt-4">
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
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      উত্তরপত্র যাচাই চলছে...
                    </div>
                  </div>
                )}
                {activeDemoTab === 'analytics' && (
                  <div className="animate-fade-in pt-4">
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
                    <div className="h-40 flex items-end justify-between gap-2 px-2">
                      {[30, 45, 35, 60, 55, 75, 85].map((h, i) => (
                        <div
                          key={i}
                          className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-t-lg relative group"
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-t-lg transition-all duration-1000 group-hover:opacity-90"
                            style={{ height: `${h}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-neutral-400 font-bold uppercase">
                      <span>শনি</span>
                      <span>রবি</span>
                      <span>সোম</span>
                      <span>মঙ্গল</span>
                      <span>বুধ</span>
                      <span>বৃহঃ</span>
                      <span>শুক্র</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - UPDATED */}
      <section className="py-20 max-w-7xl mx-auto px-4 lg:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            সফলতার জন্য যা কিছু প্রয়োজন
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-4 max-w-2xl mx-auto">
            Obhyash অ্যাপে রয়েছে আপনার প্রস্তুতির প্রতিটি ধাপের জন্য অত্যাধুনিক
            সব টুলস। এবং খুব শীঘ্রই যুক্ত হচ্ছে আরও নতুন সব ফিচার।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {/* Card 1: AI Exam */}
          <div className="lg:col-span-3 p-8 rounded-3xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-rose-200 dark:hover:border-rose-900 transition-all">
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Available Now
            </div>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              AI জেনারেটেড কাস্টম এক্সাম
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 text-sm">
              Gemini 2.5 এর শক্তিতে তৈরি করুন আপনার প্রয়োজন অনুযায়ী প্রশ্নপত্র।
              বিষয়, অধ্যায়, টপিক এবং কঠিনতার লেভেল সেট করে আনলিমিটেড মক টেস্ট
              দাও। সাথে থাকছে প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা।
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs md:text-sm text-neutral-500 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                LaTeX সাপোর্ট
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                নেগেটিভ মার্কিং
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                টাইমার কন্ট্রোল
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                ইনস্ট্যান্ট রেজাল্ট
              </li>
            </ul>
          </div>

          {/* Card 2: OMR Scanner */}
          <div className="lg:col-span-3 p-8 rounded-3xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-orange-200 dark:hover:border-orange-900 transition-all">
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Available Now
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              OMR স্ক্যানার
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              খাতায় পরীক্ষা দিয়ে ছবি তুলুন। আমাদের কম্পিউটার ভিশন টেকনোলজি
              মুহূর্তের মধ্যে খাতা মূল্যায়ন করে নির্ভুল ফলাফল ও ব্যাখ্যা প্রদান
              করবে।
            </p>
          </div>

          {/* Card 3: Analysis */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Available Now
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              স্মার্ট এনালাইসিস
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              সাবজেক্ট ভিত্তিক দুর্বলতা চিহ্নিত করো। গ্রাফ এবং চার্টের মাধ্যমে
              নিজের অগ্রগতি ট্র্যাক করুন এবং সময়ের সঠিক ব্যবহার শিখুন।
            </p>
          </div>

          {/* Card 4: Leaderboard */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900 transition-all">
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Available Now
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              লিডারবোর্ড ও XP
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              প্রতিটি সঠিক উত্তরে অর্জন করুন XP পয়েন্ট। লেভেল আনলক করুন এবং সারা
              দেশের শিক্ষার্থীদের সাথে প্রতিযোগিতায় নিজেকে যাচাই করো।
            </p>
          </div>

          {/* Card 5: PDF Tools */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:border-purple-200 dark:hover:border-purple-900 transition-all">
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Available Now
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              PDF ও অফলাইন টুলস
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              প্রশ্নপত্র এবং OMR শিট PDF আকারে ডাউনলোড করে প্রিন্ট করো। অফলাইনে
              পরীক্ষা দেওয়ার পূর্ণ স্বাধীনতা।
            </p>
          </div>
        </div>

        {/* Future Plans Section */}
        <div className="bg-[#1c1917] dark:bg-black rounded-3xl p-8 md:p-12 relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-64 h-64"
            >
              <path
                fillRule="evenodd"
                d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM1.875 3a.75.75 0 0 1 .75 0 2.25 2.25 0 0 0 2.25 2.25.75.75 0 0 1 0 1.5 2.25 2.25 0 0 0-2.25 2.25.75.75 0 0 1-1.5 0 2.25 2.25 0 0 0-2.25-2.25.75.75 0 0 1 0-1.5 2.25 2.25 0 0 0 2.25-2.25.75.75 0 0 1 .75-.75Zm11.25 12.75a.75.75 0 0 1 .75 0 2.25 2.25 0 0 0 2.25 2.25.75.75 0 0 1 0 1.5 2.25 2.25 0 0 0-2.25 2.25.75.75 0 0 1-1.5 0 2.25 2.25 0 0 0-2.25-2.25.75.75 0 0 1 0-1.5 2.25 2.25 0 0 0 2.25-2.25.75.75 0 0 1 .75-.75Zm-4.5-6a.75.75 0 0 1 .75 0 2.25 2.25 0 0 0 2.25 2.25.75.75 0 0 1 0 1.5 2.25 2.25 0 0 0-2.25 2.25.75.75 0 0 1-1.5 0 2.25 2.25 0 0 0-2.25-2.25.75.75 0 0 1 0-1.5 2.25 2.25 0 0 0 2.25-2.25.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-700">
              Coming Soon
            </span>
            <h3 className="text-2xl font-bold">ভবিষ্যৎ পরিকল্পনা</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-rose-400 font-bold text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                লিখিত পরীক্ষার মূল্যায়ন
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                শুধু MCQ নয়, এবার AI এর মাধ্যমে সৃজনশীল ও লিখিত পরীক্ষার খাতা
                মূল্যায়নের সুবিধা।
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-bold text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                  />
                </svg>
                লাইভ ব্যাটেল
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                বন্ধুদের সাথে লাইভ কুইজ কম্পিটিশন। রিয়েল-টাইম স্কোরবোর্ড এবং
                র‍্যাংকিং।
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sky-400 font-bold text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
                  />
                </svg>
                ইউনিভার্সিটি প্রশ্ন ব্যাংক
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                বুয়েট, মেডিকেল, ঢাবি সহ দেশের শীর্ষ বিশ্ববিদ্যালয়গুলোর বিগত
                বছরের প্রশ্ন সমাধান।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-neutral-50 dark:bg-black border-y border-red-100 dark:border-neutral-800 relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
              আপনার পছন্দের প্ল্যানটি বেছে নাও
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 max-w-2xl mx-auto">
              আমাদের সাশ্রয়ী সাবস্ক্রিপশন প্ল্যানগুলোর মাধ্যমে আপনার প্রস্তুতিকে
              নিয়ে যান অনন্য উচ্চতায়।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white dark:bg-black rounded-3xl p-8 shadow-xl transition-all hover:-tranneutral-y-2 flex flex-col ${plan.highlight ? 'border-2 border-indigo-500 z-10 scale-105' : 'border border-red-100 dark:border-neutral-800'}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -tranneutral-x-1/2 -tranneutral-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                    {plan.title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                      ৳{plan.price}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <svg
                        className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-indigo-500' : 'text-emerald-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${plan.buttonColor}`}
                >
                  {plan.cta}
                </button>
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
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`bg-white dark:bg-black rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/10' : 'border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md'}`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-start justify-between gap-4 group"
                >
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-start gap-3">
                    <span
                      className={`text-indigo-500 text-xl leading-none transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}
                    >
                      Q.
                    </span>
                    {faq.q}
                  </h3>
                  <div
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-500 border-indigo-500 text-white rotate-180' : 'text-neutral-400 group-hover:text-indigo-500 group-hover:border-indigo-500'}`}
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
                  <div className="pl-7 text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-50 dark:border-neutral-800/50 pt-4">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-rose-50/50 dark:bg-black border-y border-red-100 dark:border-neutral-800">
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
                className="bg-white dark:bg-black p-8 rounded-3xl border border-red-100 dark:border-neutral-800 shadow-sm relative hover:-tranneutral-y-1 transition-transform duration-300"
              >
                <div className="absolute top-8 right-8 text-neutral-200 dark:text-neutral-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14.017 21L14.017 18C14.017 16.054 15.192 15.189 16.53 14.253C17.18 13.798 18.067 13.178 18.067 12.063C18.067 10.948 16.594 10.793 16.037 10.793C15.48 10.793 13.567 10.948 13.567 12.063V12.793H10.567V5.793H17.067C19.828 5.793 22.067 8.032 22.067 10.793V12.063C22.067 15.373 19.333 17.287 18.067 18.173C17.23 18.759 16.325 19.393 16.325 21H14.017ZM5.017 21L5.017 18C5.017 16.054 6.192 15.189 7.53 14.253C8.18 13.798 9.067 13.178 9.067 12.063C9.067 10.948 7.594 10.793 7.037 10.793C6.48 10.793 4.567 10.948 4.567 12.063V12.793H1.567V5.793H8.067C10.828 5.793 13.067 8.032 13.067 10.793V12.063C13.067 15.373 10.333 17.287 9.067 18.173C8.23 18.759 7.325 19.393 7.325 21H5.017Z"></path>
                  </svg>
                </div>
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-8 font-medium leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="flex items-center gap-4">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black pt-16 pb-8 border-t border-red-100 dark:border-neutral-800 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                    />
                  </svg>
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
              <div className="space-y-4">
                <div className="flex gap-3">
                  {['facebook', 'instagram', 'youtube', 'linkedin'].map(
                    (social) => (
                      <a
                        key={social}
                        href="#"
                        className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-colors"
                      >
                        <span className="sr-only">{social}</span>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    ),
                  )}
                </div>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <p className="flex items-center gap-2 hover:text-rose-600 transition-colors cursor-pointer">
                    +880 1712 345678
                  </p>
                  <p className="flex items-center gap-2 hover:text-rose-600 transition-colors cursor-pointer">
                    support@zenith.edu.bd
                  </p>
                </div>
                <div className="bg-neutral-100 dark:bg-black rounded-lg p-3 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <strong className="block text-neutral-900 dark:text-white mb-1">
                    হেড অফিস:
                  </strong>
                  লেভেল ৫, হাউজ ৪২, রোড ৭/এ,
                  <br />
                  ধানমন্ডি, ঢাকা - ১২০৯
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-6 text-sm uppercase tracking-wider">
                ফিচারসমূহ
              </h3>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 transition-colors flex items-center gap-2"
                  >
                    মক এক্সাম (Mock Exam)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 transition-colors flex items-center gap-2"
                  >
                    প্রশ্ন ব্যাংক (Question Bank)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 transition-colors flex items-center gap-2"
                  >
                    OMR গ্রেডিং (OMR Grading)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 transition-colors flex items-center gap-2"
                  >
                    লিডারবোর্ড (Leaderboard)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-rose-600 transition-colors flex items-center gap-2"
                  >
                    পারফরম্যান্স এনালাইসিস
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-6 text-sm uppercase tracking-wider">
                কোর্স এবং বিভাগ
              </h3>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    মেডিকেল ভর্তি প্রস্তুতি
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    বিশ্ববিদ্যালয় &apos;ক ইউনিট
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    HSC বিজ্ঞান বিভাগ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    HSC মানবিক ও ব্যবসায় শিক্ষা
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-6 text-sm uppercase tracking-wider">
                কোম্পানি
              </h3>
              <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    আমাদের সম্পর্কে (About Us)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    ক্যারিয়ার
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    টার্মস এন্ড কন্ডিশন
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    প্রাইভেসি পলিসি
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-rose-600 transition-colors">
                    রিফান্ড পলিসি
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-500">
            <p>
              &copy; {new Date().getFullYear()} Obhyash Education Platform. All
              rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-rose-600 transition-colors">
                সাপোর্ট সেন্টার
              </a>
              <a href="#" className="hover:text-rose-600 transition-colors">
                কমিউনিটি
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scan Animation Keyframes */}
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
