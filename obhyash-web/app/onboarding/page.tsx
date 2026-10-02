'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  Phone,
  School,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  GraduationCap,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { searchColleges, getCanonicalCollegeName } from '@/lib/college-mapping';
import { EXAM_TARGETS } from '@/components/student/features/dashboard/ExamTargetModal';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Authenticated Google user info
  const [googleUser, setGoogleUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);

  // Form state
  // Step 1: Mandatory
  const [phone, setPhone] = useState('');
  const [institute, setInstitute] = useState('');
  const [stream, setStream] = useState<'HSC' | 'SSC'>('HSC');
  const [group, setGroup] = useState('Science');
  const [batch, setBatch] = useState('HSC 2026');

  // Step 2: Optional
  const [examTarget, setExamTarget] = useState('Engineering');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // College suggestions
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check auth and registration status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/login');
          return;
        }

        const user = session.user;
        const email = user.email || '';
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0] ||
          'Student';

        // Check if already registered in public.users
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, stream, batch')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile && existingProfile.stream && existingProfile.batch) {
          router.replace('/dashboard');
          return;
        }

        setGoogleUser({
          id: user.id,
          email,
          name,
        });
      } catch (err) {
        console.error('Error checking auth on onboarding:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  const handleInstituteChange = (val: string) => {
    setInstitute(val);
    setError(null);
    if (val.trim().length >= 2) {
      const suggestions = searchColleges(val);
      setCollegeSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCollege = (name: string) => {
    setInstitute(name);
    setShowSuggestions(false);
    setError(null);
  };

  const handleStreamChange = (newStream: 'HSC' | 'SSC') => {
    setStream(newStream);
    const defaultBatch = newStream === 'HSC' ? 'HSC 2026' : 'SSC 2026';
    setBatch(defaultBatch);
  };

  const validateStep1 = () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক!';
    }
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)';
    }
    if (!institute.trim()) {
      return 'তোমার কলেজ বা প্রতিষ্ঠানের নাম লেখো';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validationError = validateStep1();
    if (validationError) {
      setStep(1);
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (password && password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cleanPhone = phone.trim();
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {
            name: googleUser?.name,
            phone: cleanPhone,
            institute: getCanonicalCollegeName(institute.trim()),
            stream,
            group,
            batch,
            examTarget: examTarget || 'Engineering',
          },
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'প্রোফাইল তৈরি করা যায়নি');
      }

      toast.success('অভিনন্দন! তোমার প্রোফাইল তৈরি হয়েছে 🎉');
      // Redirect to dashboard
      window.location.replace('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি হয়েছে। আবার চেষ্টা করুন।';
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#07080a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#006A4E] animate-spin" />
          <p className="text-xs text-neutral-500 font-bold">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // 2-Step Stepper Component
  const stepLabels = ['প্রয়োজনীয় তথ্য', 'ঐচ্ছিক তথ্য'];

  const renderProgress = () => (
    <div className="flex items-center justify-between max-w-xs mx-auto mb-6 px-4">
      {[1, 2].map((s, idx) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= s
                  ? 'bg-[#006A4E] text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}
            >
              {s}
            </div>
            <span
              className={`text-[11px] sm:text-xs mt-1.5 transition-colors whitespace-nowrap ${
                step >= s
                  ? 'font-bold text-neutral-900 dark:text-white'
                  : 'font-medium text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {stepLabels[idx]}
            </span>
          </div>
          {s < 2 && (
            <div
              className={`flex-1 h-0.5 mx-3 -mt-5 transition-colors ${
                step > s ? 'bg-[#006A4E]' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-white dark:bg-[#07080a] md:bg-neutral-50 md:dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#006A4E]/20">
      {/* Top Header */}
      <header className="w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto px-5 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="text-xs sm:text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>আগের ধাপ</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Obhyash Logo"
              className="w-7 h-7 rounded-lg shadow-xs"
            />
            <span className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
              অভ্যাস
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={theme === 'dark' ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <Link
            href="/support"
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            সাপোর্ট লাগবে?
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-6 py-4 sm:py-8">
        <div className="w-full max-w-sm sm:max-w-md md:bg-white md:dark:bg-[#111216] md:border md:border-neutral-200/90 md:dark:border-neutral-800/80 md:rounded-3xl sm:p-2 md:p-8 md:shadow-xl md:shadow-neutral-200/40 md:dark:shadow-none space-y-6 transition-colors">
          {/* Welcome Header */}
          <div className="text-center space-y-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              স্বাগতম, {googleUser?.name}! 🎉
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-xs mx-auto">
              তোমার অ্যাকাডেমিক তথ্য দিয়ে প্রোফাইলটি সম্পন্ন করো।
            </p>
          </div>

          {/* Google Verified Banner */}
          <div className="p-3.5 rounded-2xl bg-[#f3f4f6] dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {googleUser?.name}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                  {googleUser?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg shrink-0">
              <CheckCircle2 size={13} />
              <span>ভেরিফাইড</span>
            </div>
          </div>

          {/* Stepper Progress */}
          {renderProgress()}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: MANDATORY INFORMATION */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#006A4E] transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                      setError(null);
                    }}
                    placeholder="01XXXXXXXXX"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-mono font-medium"
                  />
                </div>
              </div>

              {/* College / Institution */}
              <div className="space-y-1.5 relative">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  কলেজ / প্রতিষ্ঠান <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#006A4E] transition-colors" />
                  <input
                    type="text"
                    value={institute}
                    onChange={(e) => handleInstituteChange(e.target.value)}
                    onFocus={() => institute.trim().length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="যেমন: নটর ডেম কলেজ, ঢাকা কলেজ..."
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && collegeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-1.5 space-y-1">
                    {collegeSuggestions.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCollege(col);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors truncate"
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stream & Division */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                    শ্রেণী
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f3f4f6] dark:bg-[#16171d] rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    {(['HSC', 'SSC'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStreamChange(s)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                          stream === s
                            ? 'bg-[#006A4E] text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                    বিভাগ
                  </label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f3f4f6] dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20"
                  >
                    <option value="Science">বিজ্ঞান</option>
                    <option value="Humanities">মানবিক</option>
                    <option value="Commerce">ব্যবসায় শিক্ষা</option>
                  </select>
                </div>
              </div>

              {/* Batch Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  {stream === 'HSC' ? 'এইচএসসি ব্যাচ' : 'এসএসসি ব্যাচ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(stream === 'HSC'
                    ? ['HSC 2026', 'HSC 2025', 'HSC 2027']
                    : ['SSC 2026', 'SSC 2027', 'SSC 2028']
                  ).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBatch(b)}
                      className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all text-center ${
                        batch === b
                          ? 'bg-[#006A4E]/10 border-[#006A4E] text-[#006A4E] dark:text-emerald-400 font-extrabold ring-1 ring-[#006A4E]/20'
                          : 'bg-white dark:bg-[#16171d] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Step Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-14 bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OPTIONAL INFORMATION */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                <Info className="w-4 h-4 text-[#006A4E] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  এই তথ্যগুলো ঐচ্ছিক। তুমি চাইলে এগুলো এখনই নির্বাচন করতে পারো অথবা পরে প্রোফাইল থেকেও পরিবর্তন করতে পারবে।
                </span>
              </div>

              {/* Admission Target Cards */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  ভর্তি পরীক্ষার লক্ষ্য (ঐচ্ছিক)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXAM_TARGETS.map((t) => {
                    const isSelected = examTarget === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setExamTarget(t.id)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#006A4E]/10 border-[#006A4E] text-[#006A4E] dark:text-emerald-300 ring-1 ring-[#006A4E]/20'
                            : 'bg-white dark:bg-[#16171d] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-xl">{t.emoji}</span>
                        <p className="text-xs font-bold">{t.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Password Field */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                    পাসওয়ার্ড (ঐচ্ছিক)
                  </label>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    ঐচ্ছিক
                  </span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#006A4E] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ইমেইল দিয়ে লগইন করতে চাইলে (কমপক্ষে ৬ অক্ষর)"
                    className="w-full pl-12 pr-11 py-3.5 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-2xl text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  💡 পাসওয়ার্ড না দিলেও তুমি সবসময় ১-ট্যাপে Google দিয়ে লগইন করতে পারবে।
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-14 h-14 items-center justify-center flex rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#16171d] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>প্রোফাইল তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>পড়াশোনা শুরু করো</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>

              {/* Skip option */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline font-medium cursor-pointer"
                >
                  পরে সেট করব (সরাসরি ড্যাশবোর্ডে যাও)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-4">
        <Link href="/privacy-policy" className="hover:underline hover:text-neutral-600 dark:hover:text-neutral-300">
          গোপনীয়তা নীতি
        </Link>
        <span>•</span>
        <Link href="/terms-and-conditions" className="hover:underline hover:text-neutral-600 dark:hover:text-neutral-300">
          শর্তাবলী
        </Link>
        <span>•</span>
        <Link href="/faq" className="hover:underline hover:text-neutral-600 dark:hover:text-neutral-300">
          সহায়তা / FAQ
        </Link>
      </footer>
    </div>
  );
}
