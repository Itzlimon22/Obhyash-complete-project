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
    if (val.trim().length > 0) {
      const suggestions = searchColleges(val);
      setCollegeSuggestions(suggestions);
      setShowSuggestions(true);
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
    if (newStream === 'HSC') {
      setGroup('Science');
    }
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
    if (stream === 'HSC' && group !== 'Science') {
      return 'এইচএসসি এর জন্য বর্তমানে শুধুমাত্র বিজ্ঞান বিভাগ চালু আছে';
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
    <div className="flex items-center justify-between max-w-[240px] mx-auto mb-1 px-2">
      {[1, 2].map((s, idx) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                step >= s
                  ? 'bg-[#066b4f] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}
            >
              {s}
            </div>
            <span
              className={`text-[10px] sm:text-[11px] mt-1 transition-colors whitespace-nowrap ${
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
              className={`flex-1 h-0.5 mx-2 -mt-3.5 transition-colors ${
                step > s ? 'bg-[#066b4f]' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-neutral-50 dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#066b4f]/20">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto px-4 pt-2.5 pb-1 flex items-center justify-between shrink-0">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-[#6b7a74] hover:text-[#066b4f] dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>আগের ধাপ</span>
          </button>
        ) : (
          <div className="w-16" />
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 rounded-full text-[#6b7a74] hover:text-[#066b4f] dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <Link
            href="/support"
            className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/80 dark:bg-[#15201b]/80 backdrop-blur-md border border-[#d5e8e0] dark:border-[#203a30] text-[#066b4f] dark:text-[#34d399] text-[11px] font-semibold shadow-2xs hover:bg-white transition-all"
          >
            সাপোর্ট লাগবে?
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-1 sm:py-3">
        {/* Brand Logo & Slogan Header */}
        <div className="flex flex-col items-center justify-center text-center mb-2.5 sm:mb-3 px-4 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/obhyash_full_logo.png"
            alt="Obhyash Logo"
            className="h-8 sm:h-9 w-auto object-contain dark:hidden drop-shadow-xs"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/obhyash_full_logo_dark.png"
            alt="Obhyash Logo"
            className="h-8 sm:h-9 w-auto object-contain hidden dark:block drop-shadow-xs"
          />
          <p className="mt-1 text-[11px] sm:text-xs font-medium text-[#52655d] dark:text-neutral-400 tracking-wide">
            অভ্যাসে শুরু সাফল্যে শেষ
          </p>
        </div>

        {/* Auth Sheet/Card */}
        <div className="w-full max-w-[420px] bg-white dark:bg-[#121714] border-t sm:border border-[#e4ebe8] dark:border-[#1d2722] rounded-t-[28px] sm:rounded-b-[28px] px-4 py-3.5 sm:px-6 sm:py-5 shadow-[0_20px_45px_-15px_rgba(6,107,79,0.12)] dark:shadow-none space-y-3 transition-colors">
          {/* Stepper Progress */}
          {renderProgress()}

          {/* Google Verified Banner (Only shown in Step 1) */}
          {step === 1 && (
            <div className="h-10 px-3 rounded-xl bg-[#f4f7f5] dark:bg-[#17201c] border border-[#dce9e2] dark:border-[#22352b] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {googleUser?.email}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 border border-emerald-500/20">
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>ভেরিফাইড</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-medium animate-in slide-in-from-top-1">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: MANDATORY INFORMATION */}
          {step === 1 && (
            <div className="space-y-3 animate-in slide-in-from-right-4 fade-in duration-200">
              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center h-10 sm:h-11 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl px-3 shadow-2xs focus-within:border-[#066b4f] focus-within:ring-2 focus-within:ring-[#066b4f]/15 transition-all">
                  <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                      setError(null);
                    }}
                    placeholder="01XXXXXXXXX"
                    required
                    className="w-full h-full bg-transparent pl-2.5 pr-1 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none font-mono font-medium"
                  />
                </div>
              </div>

              {/* College / Institution */}
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                  {stream === 'SSC' ? 'স্কুল / প্রতিষ্ঠান' : 'কলেজ / প্রতিষ্ঠান'} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center h-10 sm:h-11 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl px-3 shadow-2xs focus-within:border-[#066b4f] focus-within:ring-2 focus-within:ring-[#066b4f]/15 transition-all">
                  <School className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={institute}
                    onChange={(e) => handleInstituteChange(e.target.value)}
                    onFocus={() => institute.trim().length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={stream === 'SSC' ? 'স্কুল বা প্রতিষ্ঠানের নাম...' : 'কলেজ বা প্রতিষ্ঠানের নাম...'}
                    required
                    className="w-full h-full bg-transparent pl-2.5 pr-1 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && institute.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1 space-y-0.5">
                    {collegeSuggestions.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCollege(col);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors truncate"
                      >
                        {col}
                      </button>
                    ))}
                    {!collegeSuggestions.includes(institute.trim()) && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 rounded-lg transition-colors flex items-center gap-1.5 border-t border-emerald-100 dark:border-emerald-900/50"
                      >
                        <span>➕ প্রতিষ্ঠান হিসেবে &quot;{institute.trim()}&quot; ব্যবহার করো</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stream & Division (Both Dropdowns as requested) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* শ্রেণী Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                    শ্রেণী
                  </label>
                  <div className="relative">
                    <select
                      value={stream}
                      onChange={(e) => handleStreamChange(e.target.value as 'HSC' | 'SSC')}
                      className="w-full h-10 sm:h-11 px-3 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#066b4f] focus:ring-2 focus:ring-[#066b4f]/15 transition-all appearance-none pr-8 cursor-pointer"
                    >
                      <option value="HSC">এইচএসসি (HSC)</option>
                      <option value="SSC">এসএসসি (SSC)</option>
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* বিভাগ Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                    বিভাগ
                  </label>
                  <div className="relative">
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full h-10 sm:h-11 px-3 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-[#066b4f] focus:ring-2 focus:ring-[#066b4f]/15 transition-all appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Science">Science (বিজ্ঞান)</option>
                      {stream === 'SSC' ? (
                        <>
                          <option value="Business Studies">Business Studies (ব্যবসায় শিক্ষা)</option>
                          <option value="Humanities">Humanities (মানবিক)</option>
                        </>
                      ) : (
                        <>
                          <option
                            value="Business Studies"
                            disabled
                            className="text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800"
                          >
                            Business Studies (ব্যবসায় শিক্ষা) - শীঘ্রই আসছে
                          </option>
                          <option
                            value="Humanities"
                            disabled
                            className="text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800"
                          >
                            Humanities (মানবিক) - শীঘ্রই আসছে
                          </option>
                        </>
                      )}
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                  {stream === 'HSC' ? 'এইচএসসি ব্যাচ' : 'এসএসসি ব্যাচ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(stream === 'HSC'
                    ? ['HSC 2026', 'HSC 2027', 'HSC 2025']
                    : ['SSC 2026', 'SSC 2027', 'SSC 2028']
                  ).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBatch(b)}
                      className={`h-9 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                        batch === b
                          ? 'bg-[#066b4f]/10 border-[#066b4f] text-[#066b4f] dark:text-emerald-400 ring-1 ring-[#066b4f]/20 font-extrabold'
                          : 'bg-white dark:bg-[#16171d] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Step Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-11 sm:h-12 bg-[#066b4f] hover:bg-[#055841] active:scale-[0.99] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OPTIONAL INFORMATION */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Optional Password Field (Clean login style) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2d3748] dark:text-neutral-300 block">
                  পাসওয়ার্ড (ঐচ্ছিক)
                </label>
                <div className="relative flex items-center h-10 sm:h-11 bg-white dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl px-3 shadow-2xs focus-within:border-[#066b4f] focus-within:ring-2 focus-within:ring-[#066b4f]/15 transition-all">
                  <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দাও (কমপক্ষে ৬ অক্ষর)"
                    className="w-full h-full bg-transparent pl-2.5 pr-8 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-11 h-11 sm:w-12 sm:h-12 items-center justify-center flex rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#16171d] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 h-11 sm:h-12 bg-[#066b4f] hover:bg-[#055841] active:scale-[0.99] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>প্রোফাইল তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পড়াশোনা শুরু করো</span>
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
