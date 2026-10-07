'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Mail,
  Lock,
  User,
  Phone,
  School,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  RotateCw,
  X,
  AlertCircle,
  Info,
  ArrowRight,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { getRandomAvatar } from '@/lib/avatar-utils';
import { EXAM_TARGETS } from '@/components/student/features/dashboard/ExamTargetModal';
import { searchColleges, getCanonicalCollegeName } from '@/lib/college-mapping';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import { useTheme } from '@/components/providers/ThemeProvider';

const AUTH_TIMEOUT_MS = 30000;

// Feature Toggle for SMS OTP Verification
// - Set to false when Bulk SMS is not active (bypasses OTP verification)
// - Set to true when Bulk SMS is purchased to instantly re-enable SMS OTP
const ENABLE_PHONE_OTP_VERIFICATION = false;

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMessage: string,
  timeoutMs = AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Phone OTP Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal (Option 2: Name + Phone)
    name: '',
    phone: '',
    gender: '', // Optional

    // Step 2: Academic
    institute: '',
    stream: 'HSC',
    group: 'Science',
    batch: 'HSC 2026',
    examTarget: '', // exam_target in DB

    // Step 3: Credentials
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Cooldown countdown timer
  useEffect(() => {
    if (otpCooldown > 0 && isOtpModalOpen) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown, isOtpModalOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'stream') {
      const firstBatch = `${value} 2026`;
      const newGroup = value === 'HSC' ? 'Science' : formData.group;
      setFormData({ ...formData, stream: value, batch: firstBatch, group: newGroup });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError(null);
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      // Personal
      if (!formData.name.trim()) {
        return 'তোমার নাম উল্লেখ করা আবশ্যক';
      }
      if (!formData.phone.trim()) {
        return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';
      }
      if (!/^01[3-9]\d{8}$/.test(formData.phone.trim())) {
        return 'সঠিক মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)';
      }
    }
    if (currentStep === 2) {
      // Academic
      if (!formData.institute) {
        return 'তোমার শিক্ষা প্রতিষ্ঠানের নাম লেখো';
      }
      if (!formData.batch) {
        return 'ব্যাচ সিলেক্ট করা আবশ্যক';
      }
      if (!formData.gender) {
        return 'লিঙ্গ নির্বাচন করা আবশ্যক';
      }
    }
    if (currentStep === 3) {
      // Credentials
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        return 'সব তথ্য পূরণ করতে হবে';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return 'সঠিক ইমেইল এড্রেস দাও (যেমন: example@gmail.com)';
      }
      if (formData.password.length < 6) {
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'পাসওয়ার্ড দুটি মিলছে না';
      }
    }
    return null;
  };

  const sendOtpRequest = async (phoneToSend: string) => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToSend }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpCooldown(data.cooldown_seconds || 60);
        setIsOtpModalOpen(true);
        setOtpCode('');
        toast.success(data.message || 'মোবাইলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে।');
      } else {
        setError(data.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
        toast.error(data.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সার্ভার সংযোগে ত্রুটি';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtpRequest = async () => {
    if (otpCode.trim().length !== 6) {
      setOtpError('অনুগ্রহ করে ৬ ডিজিটের সম্পূর্ণ ওটিপি লিখুন');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone.trim(), otp: otpCode.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setIsPhoneVerified(true);
        setVerifiedPhone(formData.phone.trim());
        setIsOtpModalOpen(false);
        setStep(2);
        toast.success('মোবাইল নম্বর সফলভাবে যাচাই করা হয়েছে! 🎉');
      } else {
        setOtpError(data.error || 'ভুল ওটিপি কোড! আবার চেষ্টা করুন।');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'যাচাইকরণে ত্রুটি');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleNext = async () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    // Step 1: Enforce OTP Verification (if enabled)
    if (step === 1) {
      const cleanPhone = formData.phone.trim();

      if (!ENABLE_PHONE_OTP_VERIFICATION) {
        setIsPhoneVerified(true);
        setVerifiedPhone(cleanPhone);
        setStep(step + 1);
        return;
      }

      const isAlreadyVerified = isPhoneVerified && verifiedPhone === cleanPhone;

      if (!isAlreadyVerified) {
        await sendOtpRequest(cleanPhone);
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSignup = async () => {
    const errorMsg = validateStep(3);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${location.origin}/dashboard`,
            data: {
              full_name: formData.name,
              name: formData.name,
              role: 'Student',
            },
          },
        }),
        'রেজিস্ট্রেশন অনুরোধের সময়সীমা শেষ হয়েছে। আবার চেষ্টা করো।',
      );

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Create User Profile (upsert to handle DB trigger conflict)
        // The handle_new_user trigger may have already created a minimal row,
        // so we use upsert to merge the full signup data into it.
        const { error: profileError } = await withTimeout(
          supabase.from('users').upsert(
            {
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              phone: formData.phone,
              gender: formData.gender || null,
              institute: getCanonicalCollegeName(formData.institute),
              stream: formData.stream,
              division: formData.group, // Mapping group -> division
              batch: formData.batch,
              exam_target: formData.examTarget || null,
              optional_subject: 'Biology',
              role: 'Student',
              status: 'Active',
              avatar_url: getRandomAvatar(formData.gender, data.user.id),
              is_subscribed: false,
              subscription_status: 'Inactive',
              subscription_expires_at: null,
              subscription: {
                plan: 'Free',
                expiry: null,
                status: 'Inactive',
              },
              xp: 0,
              level: 'Beginner',
              exams_taken: 0,
              enrolled_exams: 0,
              last_active: new Date().toISOString(),
            },
            { onConflict: 'id' },
          ),
          'প্রোফাইল তৈরি করতে দেরি হচ্ছে। আবার চেষ্টা করো।',
        );

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error(getErrorMessage(profileError));
        }

        // If Auto-Confirm is enabled in Supabase, we get a session immediately.
        if (data.session) {
          window.location.replace('/dashboard');
          return;
        }

        setSuccess(true);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Signup Error:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-neutral-50 dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#006A4E]/20">
        <header className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <span>← হোম</span>
          </Link>

          <div className="flex items-center gap-3">
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
                title={theme === 'dark' ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <Link
              href="/support"
              className="text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              সাপোর্ট লাগবে?
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111216] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-200/40 dark:shadow-none border border-neutral-200/90 dark:border-neutral-800/80 text-center animate-in fade-in zoom-in duration-300 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              অ্যাকাউন্ট তৈরি সফল!
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              তোমার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন লগইন করো।
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3.5 px-6 font-bold text-white bg-[#006A4E] hover:bg-[#00573e] rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-600/20 text-sm"
              >
                লগইন পেজে যাও
              </Link>
            </div>
          </div>
        </main>

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

  // --- RENDER STEPS ---

  // Progress Stepper matching Flutter Screenshot 3
  const stepLabels = ['বেসিক তথ্য', 'একাডেমিক', 'অ্যাকাউন্ট'];

  const renderProgress = () => (
    <div className="flex items-center justify-between max-w-xs mx-auto mb-6 px-1">
      {[1, 2, 3].map((s, idx) => (
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
          {s < 3 && (
            <div
              className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                step > s ? 'bg-[#006A4E]' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-gradient-to-b from-[#fbfefd] via-[#f2f8f5] to-[#eef7f3] dark:from-[#090d0b] dark:via-[#0c120f] dark:to-[#080b09] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#066b4f]/20">
      {/* Background Ambience Glow Orbs matching design */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#066b4f]/10 dark:bg-[#066b4f]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-4 -right-20 w-80 h-80 rounded-full bg-[#e9c46a]/15 dark:bg-[#e9c46a]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md mx-auto px-5 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#6b7a74] hover:text-[#066b4f] dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>আগের ধাপ</span>
          </button>
        ) : (
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-[#6b7a74] hover:text-[#066b4f] dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <span>← হোম</span>
          </Link>
        )}

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-[#6b7a74] hover:text-[#066b4f] dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Frosted Support Pill on top right */}
          <Link
            href="/support"
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#15201b]/80 backdrop-blur-md border border-[#d5e8e0] dark:border-[#203a30] text-[#066b4f] dark:text-[#34d399] text-xs sm:text-sm font-semibold shadow-xs hover:bg-white dark:hover:bg-[#1a2822] hover:shadow transition-all"
          >
            সাপোর্ট লাগবে?
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-end sm:justify-center px-0 sm:px-6 pt-2 pb-0 sm:pb-8">
        {/* Brand Logo & Slogan Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6 pt-2 px-4">
          <img
            src="/obhyash_full_logo.png"
            alt="Obhyash Logo"
            className="h-11 sm:h-12 w-auto object-contain dark:hidden drop-shadow-xs"
          />
          <img
            src="/obhyash_full_logo_dark.png"
            alt="Obhyash Logo"
            className="h-11 sm:h-12 w-auto object-contain hidden dark:block drop-shadow-xs"
          />
          <p className="mt-2 text-sm sm:text-base font-medium text-[#52655d] dark:text-neutral-400 tracking-wide">
            অভ্যাসে শুরু সাফল্যে শেষ
          </p>
        </div>

        {/* Auth Sheet/Card - Extends to bottom on mobile */}
        <div className="w-full max-w-[440px] flex-1 sm:flex-initial flex flex-col justify-between bg-white dark:bg-[#121714] border-t sm:border border-[#e4ebe8] dark:border-[#1d2722] rounded-t-[32px] sm:rounded-b-[32px] p-6 sm:p-8 shadow-[0_20px_45px_-15px_rgba(6,107,79,0.12)] dark:shadow-none space-y-5 transition-colors">
          {renderProgress()}

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}


          <div className="space-y-4 md:space-y-6">
            {/* STEP 1: PERSONAL DETAILS (Option 2: Name + Phone) */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-[#2d3748] dark:text-neutral-300 block">
                    তোমার নাম
                  </label>
                  <div className="relative flex items-center h-11 bg-white dark:bg-[#16171d] border border-transparent rounded-xl px-3 shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus-within:border-[#066b4f] focus-within:ring-2 focus-within:ring-[#066b4f]/15 transition-all">
                    <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="পূর্ণ নাম (Full Name)"
                      className="w-full h-full bg-transparent pl-2.5 pr-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-semibold text-[#2d3748] dark:text-neutral-300 block">
                      মোবাইল নম্বর
                    </label>
                    {isPhoneVerified && verifiedPhone === formData.phone.trim() && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        যাচাইকৃত
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center h-11 bg-white dark:bg-[#16171d] border border-transparent rounded-xl px-3 shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus-within:border-[#066b4f] focus-within:ring-2 focus-within:ring-[#066b4f]/15 transition-all">
                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 select-none pr-2 border-r border-neutral-200 dark:border-neutral-800">
                      <Phone className="w-3.5 h-3.5 text-[#066b4f] dark:text-[#34d399]" />
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        +88
                      </span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className="w-full h-full bg-transparent pl-2.5 pr-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none font-medium tracking-wide"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#16171d] shadow-xs shadow-black/[0.03] dark:shadow-black/20 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-bengali">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    পরবর্তী ধাপে যাওয়ার সময় তোমার মোবাইলে ৬ ডিজিটের ওটিপি যাচাই কোড পাঠানো হবে।
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC INFO */}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                    শিক্ষা প্রতিষ্ঠান
                  </label>
                  <div className="relative group">
                    <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#006A4E] transition-colors pointer-events-none" />
                    <input
                      type="text"
                      name="institute"
                      value={formData.institute}
                      onChange={(e) => {
                        handleChange(e);
                        setShowCollegeSuggestions(true);
                      }}
                      onFocus={() =>
                        formData.institute.length > 0 &&
                        setShowCollegeSuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowCollegeSuggestions(false), 150)
                      }
                      placeholder="কলেজ / স্কুলের নাম"
                      autoComplete="off"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                    {showCollegeSuggestions &&
                      searchColleges(formData.institute).length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden">
                          {searchColleges(formData.institute).map((name) => (
                            <button
                              key={name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({ ...formData, institute: name });
                                setShowCollegeSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                    স্ট্রিম (Stream)
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      name="stream"
                      value={formData.stream}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="HSC">HSC</option>
                      <option value="SSC">SSC</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                      বিভাগ (Division)
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        name="group"
                        value={formData.group}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="Science">Science (বিজ্ঞান)</option>
                        {formData.stream === 'SSC' ? (
                          <>
                            <option value="Business Studies">Business Studies (ব্যবসায় শিক্ষা)</option>
                            <option value="Humanities">Humanities (মানবিক)</option>
                          </>
                        ) : (
                          <>
                            <option value="Business Studies" disabled className="text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800">
                              Business Studies (ব্যবসায় শিক্ষা) - শীঘ্রই আসছে
                            </option>
                            <option value="Humanities" disabled className="text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800">
                              Humanities (মানবিক) - শীঘ্রই আসছে
                            </option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                      ব্যাচ
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white appearance-none cursor-pointer"
                      >
                        {(formData.stream === 'SSC' ? [2026, 2027, 2028] : [2025, 2026, 2027, 2028]).map((year) => (
                          <option
                            key={year}
                            value={`${formData.stream} ${year}`}
                          >
                            {formData.stream} {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                    লিঙ্গ (Gender)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all shadow-xs shadow-black/[0.04] dark:shadow-black/20 ${
                          formData.gender === g
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-[#006A4E] text-[#006A4E] dark:text-[#34d399] font-semibold'
                            : 'bg-white dark:bg-[#16171d] border border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1f2029]'
                        }`}
                      >
                        {g === 'Male' ? 'ছেলে' : 'মেয়ে'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CREDENTIALS */}
            {step === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                      ইমেইল এড্রেস
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#006A4E] transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                      পাসওয়ার্ড
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#006A4E] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 ml-0.5">
                      পাসওয়ার্ড নিশ্চিত করো
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#006A4E] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="পাসওয়ার্ডটি আবার লেখো"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#16171d] border border-transparent rounded-xl shadow-xs shadow-black/[0.05] dark:shadow-black/25 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex gap-2.5">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-11 h-11 items-center justify-center flex rounded-xl border border-transparent bg-white dark:bg-[#16171d] text-neutral-600 dark:text-neutral-300 shadow-xs shadow-black/[0.05] dark:shadow-black/25 hover:bg-neutral-50 dark:hover:bg-[#1f2924] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={step === 3 ? handleSignup : handleNext}
                disabled={loading || isSendingOtp}
                className="flex-1 h-11 bg-gradient-to-r from-[#0a8a66] to-[#066b4f] hover:from-[#087b5a] hover:to-[#055b43] active:scale-[0.99] text-white font-bold rounded-xl shadow-[0_8px_20px_-6px_rgba(6,107,79,0.5)] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading || isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSendingOtp ? 'ওটিপি পাঠানো হচ্ছে...' : 'অপেক্ষা করো...'}</span>
                  </>
                ) : step === 3 ? (
                  'অ্যাকাউন্ট তৈরি করো'
                ) : (
                  <>
                    <span>পরবর্তী ধাপ</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider & Google Social Login (Step 1 only) */}
          {step === 1 && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e4ebe8] dark:border-[#222e28]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-[#121714] px-3 text-[#6b7a74] dark:text-neutral-400 font-medium">
                    অথবা চালিয়ে যান
                  </span>
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="h-11 w-full bg-[#f6f9f8] dark:bg-[#18201c] rounded-xl animate-pulse" />
                }
              >
                <SocialLoginButton
                  mode="signup"
                  label="Google দিয়ে চালিয়ে যান"
                  className="!h-11 !py-2.5 !rounded-xl !bg-white dark:!bg-[#16171d] !border-transparent !text-neutral-800 dark:!text-neutral-200 !shadow-xs hover:!bg-neutral-50 dark:hover:!bg-[#1f2924] transition-all font-semibold text-sm"
                />
              </Suspense>
            </>
          )}

          {/* OTP VERIFICATION MODAL */}
          {isOtpModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 font-bengali">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        মোবাইল নম্বর যাচাই
                      </h3>
                      <p className="text-xs text-neutral-500">
                        নিরাপত্তা স্বার্থে ৬ ডিজিটের ওটিপি লিখুন
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-neutral-50 dark:bg-[#16171d] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-neutral-500">নম্বর:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {formData.phone}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                    SMS পাঠানো হয়েছে
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      if (otpError) setOtpError(null);
                    }}
                    placeholder="••••••"
                    className="w-full py-3.5 text-center text-3xl font-mono font-bold tracking-[0.4em] bg-neutral-100 dark:bg-[#16171d] text-neutral-900 dark:text-white border-2 border-emerald-500/50 focus:border-emerald-500 rounded-2xl focus:outline-none transition-all"
                  />
                  {otpError && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {otpError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={verifyOtpRequest}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full bg-[#006A4E] hover:bg-[#00573e] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      যাচাই করা হচ্ছে...
                    </>
                  ) : (
                    'যাচাই করে এগিয়ে যাও'
                  )}
                </button>

                <div className="text-center text-xs">
                  {otpCooldown > 0 ? (
                    <span className="text-neutral-400">
                      পুনরায় পাঠানো যাবে: <b className="text-neutral-600 dark:text-neutral-300">{otpCooldown}</b> সেকেন্ড পর
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendOtpRequest(formData.phone.trim())}
                      disabled={isSendingOtp}
                      className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      ওটিপি পুনরায় পাঠাও
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Prompt */}
          <div className="pt-1 text-center">
            <div className="text-xs sm:text-sm text-[#6b7a74] dark:text-neutral-400">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link
                href="/login"
                className="text-[#066b4f] dark:text-[#34d399] hover:underline font-bold transition-all ml-1"
              >
                লগইন করুন
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-[#6b7a74] dark:text-neutral-500 flex items-center justify-center gap-4 bg-white dark:bg-[#121714] sm:bg-transparent sm:dark:bg-transparent">
        <Link href="/privacy-policy" className="hover:underline hover:text-neutral-800 dark:hover:text-neutral-300">
          গোপনীয়তা নীতি
        </Link>
        <span>•</span>
        <Link href="/terms-and-conditions" className="hover:underline hover:text-neutral-800 dark:hover:text-neutral-300">
          শর্তাবলী
        </Link>
        <span>•</span>
        <Link href="/faq" className="hover:underline hover:text-neutral-800 dark:hover:text-neutral-300">
          সহায়তা / FAQ
        </Link>
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
