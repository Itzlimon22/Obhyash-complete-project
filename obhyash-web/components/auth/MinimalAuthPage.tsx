'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import StepByStepRegistration from './StepByStepRegistration';

const AUTH_TIMEOUT_MS = 25000;

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

interface MinimalAuthPageProps {
  defaultMode?: 'login' | 'register';
}

function MinimalAuthForm({ defaultMode = 'login' }: MinimalAuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [resolvedTargetEmail, setResolvedTargetEmail] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nextParam = searchParams.get('next') || '/dashboard';

  // Check URL errors on mount
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'unregistered_google') {
      setError('এই গুগল অ্যাকাউন্ট দিয়ে কোনো প্রোফাইল পাওয়া যায়নি। আবার চেষ্টা করো।');
    } else if (err === 'oauth_cancelled') {
      setError('গুগল লগইন বাতিল করা হয়েছে। আবার চেষ্টা করো।');
    }
  }, [searchParams]);

  // Focus password input when opening password step
  useEffect(() => {
    if (isPasswordStep) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isPasswordStep]);

  // If in step-by-step registration mode, render the gamified onboarding steps
  if (isRegistering) {
    return (
      <StepByStepRegistration
        initialIdentifier={identifier}
        onBackToLogin={() => {
          setIsRegistering(false);
          setIsPasswordStep(false);
          setPassword('');
          setError(null);
          try {
            window.history.replaceState(null, '', '/auth/login');
          } catch {
            // ignore
          }
        }}
        nextUrl={nextParam}
      />
    );
  }

  // Handle Form Submit:
  // Stage 1 (isPasswordStep = false): Checks if user exists. If yes, reveals password box. If no, redirects to registration step 1.
  // Stage 2 (isPasswordStep = true): Authenticates with password.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('মোবাইল নম্বর অথবা ইমেইল লিখো');
      return;
    }

    // 1. Convert any Bengali digits (০-৯) to English (0-9)
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let targetInput = cleanInput;
    for (let i = 0; i < 10; i++) {
      targetInput = targetInput.split(bnDigits[i]).join(i.toString());
    }

    const cleanDigits = targetInput.replace(/\D/g, '');
    const isPhone = !targetInput.includes('@') && /^[0-9+]+$/.test(targetInput.replace(/\s|-/g, ''));
    let cleanEmail = '';
    let normalizedPhone = '';

    if (isPhone) {
      normalizedPhone = cleanDigits;
      if (normalizedPhone.startsWith('8801') && normalizedPhone.length === 13) {
        normalizedPhone = normalizedPhone.substring(2);
      } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
        normalizedPhone = '0' + normalizedPhone;
      }

      if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
        setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)');
        return;
      }
    } else {
      cleanEmail = targetInput.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setError('সঠিক মোবাইল নম্বর অথবা ইমেইল লিখো');
        return;
      }
    }

    // --- STAGE 1: Check If User Exists in Database ---
    if (!isPasswordStep) {
      setLoading(true);

      try {
        let isUserExisting = false;
        let targetAuthEmail = '';

        if (isPhone) {
          const { data: userRows } = await supabase
            .from('users')
            .select('id, email, phone')
            .or(`phone.eq.${normalizedPhone},phone.eq.+88${normalizedPhone},phone.eq.88${normalizedPhone}`)
            .limit(1);

          if (userRows && userRows.length > 0) {
            isUserExisting = true;
            targetAuthEmail = userRows[0].email || `${normalizedPhone}@user.obhyash.com`;
          }
        } else {
          const { data: userRows } = await supabase
            .from('users')
            .select('id, email, phone')
            .ilike('email', cleanEmail)
            .limit(1);

          if (userRows && userRows.length > 0) {
            isUserExisting = true;
            targetAuthEmail = userRows[0].email || cleanEmail;
          }
        }

        // Case A: User exists -> Open password box & change button to "লগইন করো"
        if (isUserExisting) {
          setResolvedTargetEmail(targetAuthEmail);
          setIsPasswordStep(true);
          setLoading(false);
          return;
        }

        // Case B: User does not exist -> Direct to Step 1 of registration flow!
        setLoading(false);
        try {
          window.history.replaceState(null, '', '/auth/register');
        } catch {
          // ignore
        }
        setIsRegistering(true);
        return;
      } catch (err) {
        console.error('Identifier check error:', err);
        setError('ব্যবহারকারী যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
        setLoading(false);
        return;
      }
    }

    // --- STAGE 2: Password Submission for Existing User ---
    if (!password) {
      setError('পাসওয়ার্ড লিখো');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);

    try {
      const { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: resolvedTargetEmail,
          password,
        }),
        'অনুরোধের সময়সীমা শেষ হয়েছে। আবার চেষ্টা করো।'
      );

      // Sign-In Failed
      if (signInError) {
        setError('পাসওয়ার্ড ভুল হয়েছে। সঠিক পাসওয়ার্ড দাও অথবা পাসওয়ার্ড রিসেট করো।');
        setLoading(false);
        return;
      }

      // Sign-In Succeeded
      if (signInData?.user) {
        const user = signInData.user;
        let role = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
        let status = 'Active';
        let stream = '';
        let batch = '';

        try {
          const { data: profileRow } = await supabase
            .from('users')
            .select('role, status, stream, batch')
            .eq('id', user.id)
            .maybeSingle();

          if (profileRow) {
            if (profileRow.role) role = profileRow.role.toLowerCase();
            if (profileRow.status) status = profileRow.status;
            if (profileRow.stream) stream = profileRow.stream;
            if (profileRow.batch) batch = profileRow.batch;
          }
        } catch {
          // ignore
        }

        if (!role) role = 'student';

        // Cache role cookie
        try {
          const roleCookieValue = encodeURIComponent(
            JSON.stringify({ userId: user.id, role, status, stream, batch })
          );
          document.cookie = `obhyash_role_cache=${roleCookieValue}; path=/; max-age=180; SameSite=Lax`;
          localStorage.removeItem('obhyash_user_profile');
          localStorage.removeItem('obhyash_cached_subjects');
          localStorage.removeItem('obhyash_exam_history');
        } catch {
          // non-fatal
        }

        // Determine destination: if incomplete profile, send to onboarding
        let destination = nextParam;
        if (!destination || destination === '/dashboard') {
          if (!stream || !batch) {
            destination = '/onboarding';
          } else if (role === 'admin') {
            destination = '/admin/dashboard';
          } else if (role === 'teacher') {
            destination = '/teacher/dashboard';
          } else {
            destination = '/dashboard';
          }
        }

        window.location.replace(destination);
        return;
      }
    } catch (err: unknown) {
      console.error('Unified auth error:', err);
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg.includes('timeout') || msg.includes('সময়সীমা')
          ? 'সার্ভার রেসপন্স দিতে দেরি করছে। আবার চেষ্টা করো।'
          : 'একটি সমস্যা হয়েছে। আবার চেষ্টা করো।'
      );
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError('গুগল লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করো।');
      setGoogleLoading(false);
    }
  };

  const isButtonActive = isPasswordStep
    ? password.length > 0
    : identifier.trim().length > 0;

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0d0f15] text-white px-4 py-2.5 sm:py-8 overflow-hidden relative selection:bg-red-500/20 font-sans">
      {/* Background Subtle Gradient Vignette */}
      <div
        className="pointer-events-none fixed inset-0 bg-radial-at-c from-neutral-900/30 via-transparent to-black/60"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[410px] flex flex-col items-center">
        {/* Top: Obhyash Logo */}
        <Link href="/" className="mb-2 sm:mb-4 inline-flex items-center justify-center transition-transform hover:scale-105 duration-200">
          <img
            src="/obhyash_full_logo_dark.svg"
            alt="Obhyash Logo"
            className="h-8 sm:h-11 w-auto object-contain drop-shadow-md"
          />
        </Link>

        {/* Subtitle / Header */}
        <h1 className="text-base sm:text-xl font-bold text-neutral-100 tracking-tight text-center mb-2.5 sm:mb-5">
          {isPasswordStep ? 'লগ ইন' : 'রেজিস্ট্রেশন/ লগ ইন'}
        </h1>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm text-center leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm text-center leading-relaxed animate-in fade-in">
            {successMessage}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-2.5 sm:space-y-4">
          {/* Stage 1: Mobile or Email Input */}
          {!isPasswordStep ? (
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                মোবাইল নম্বর বা ইমেইল
              </label>
              <input
                ref={identifierInputRef}
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="01XXXXXXXXX অথবা example@mail.com"
                disabled={loading || googleLoading}
                autoComplete="username"
                autoFocus
                className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 focus:shadow-[0_0_22px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50"
              />
            </div>
          ) : (
            /* Stage 2: Confirmed Identifier Chip */
            <div className="flex items-center justify-between px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#131620]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.3)] text-xs sm:text-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-neutral-300 truncate mr-2">
                <span className="text-neutral-500 font-medium shrink-0">
                  {identifier.includes('@') ? 'ইমেইল:' : 'মোবাইল:'}
                </span>
                <span className="font-bold text-white tracking-wide truncate font-mono">{identifier}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordStep(false);
                  setPassword('');
                  setError(null);
                  setTimeout(() => {
                    identifierInputRef.current?.focus();
                  }, 100);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer shrink-0"
              >
                পরিবর্তন
              </button>
            </div>
          )}

          {/* Stage 2: Password (ONLY shown when isPasswordStep is true) */}
          {isPasswordStep && (
            <div className="space-y-1 sm:space-y-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="পাসওয়ার্ড লিখো"
                  disabled={loading || googleLoading}
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-2.5 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 focus:shadow-[0_0_22px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>

              <div className="flex justify-end pt-0.5">
                <Link
                  href="/forgot-password"
                  className="text-[11px] sm:text-xs text-neutral-400 hover:text-red-400 transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছো?
                </Link>
              </div>
            </div>
          )}

          {/* Action Button: "এগিয়ে যাও" initially, "লগইন করো" when password step */}
          <div className="pt-0.5 sm:pt-1">
            <button
              type="submit"
              disabled={loading || googleLoading || !isButtonActive}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-150 ${
                isButtonActive && !loading && !googleLoading
                  ? 'bg-[#991b1b] hover:bg-[#b91c1c] text-white border-b-[4px] border-[#5e0e0e] shadow-[0_4px_16px_rgba(153,27,27,0.4)] active:translate-y-[2px] active:border-b-2 active:shadow-none cursor-pointer'
                  : 'bg-[#1b1e28] text-neutral-500 border-b-[3px] border-[#13151d] cursor-not-allowed opacity-75'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>অপেক্ষা করো...</span>
                </>
              ) : (
                <span>{isPasswordStep ? 'লগইন করো' : 'এগিয়ে যাও'}</span>
              )}
            </button>
          </div>

          {/* Direct Link to Register (only on initial step) */}
          {!isPasswordStep && (
            <div className="pt-0.5 sm:pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  const cleanInput = identifier.trim();
                  if (!cleanInput) {
                    setError('রেজিস্ট্রেশন শুরু করতে প্রথমে তোমার মোবাইল নম্বর বা ইমেইল লিখো');
                    identifierInputRef.current?.focus();
                    return;
                  }

                  // If mobile number, validate 11 digits
                  const isPhone = !cleanInput.includes('@') && /^[0-9+]+$/.test(cleanInput.replace(/\s|-/g, ''));
                  if (isPhone) {
                    const cleanDigits = cleanInput.replace(/\D/g, '');
                    let norm = cleanDigits;
                    if (norm.startsWith('8801') && norm.length === 13) norm = norm.substring(2);
                    if (norm.startsWith('1') && norm.length === 10) norm = '0' + norm;
                    if (norm.length !== 11 || !norm.startsWith('01')) {
                      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)');
                      identifierInputRef.current?.focus();
                      return;
                    }
                  }

                  setError(null);
                  try {
                    window.history.replaceState(null, '', '/auth/register');
                  } catch {
                    // ignore
                  }
                  setIsRegistering(true);
                }}
                className="text-xs sm:text-sm text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>নতুন শিক্ষার্থী? রেজিস্ট্রেশন করো</span>
              </button>
            </div>
          )}
        </form>

        {/* Divider: অথবা, (shown on initial step) */}
        {!isPasswordStep && (
          <div className="relative w-full my-3 sm:my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative z-10 px-3 bg-[#0d0f15] text-[11px] sm:text-sm font-medium text-neutral-400">
              অথবা,
            </span>
          </div>
        )}

        {/* Google Continue Button (shown on initial step) */}
        {!isPasswordStep && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-2.5 sm:py-3.5 px-4 rounded-xl bg-[#161923]/80 hover:bg-[#1f2330] border border-white/[0.08] border-b-[3px] border-b-[#12141c] text-neutral-200 font-semibold text-xs sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 transition-all active:translate-y-[1px] active:border-b-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_3px_0_0_#12141c,0_4px_14px_rgba(0,0,0,0.3)]"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-neutral-400" />
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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
            )}
            <span>Google দিয়ে চালিয়ে যাও</span>
          </button>
        )}

        {/* Support Link Text: google diye caliye jao er niche just text */}
        <div className="pt-2 sm:pt-3 text-center">
          <Link
            href="/support"
            className="text-xs sm:text-sm text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer hover:underline"
          >
            সাপোর্ট লাগবে?
          </Link>
        </div>

        {/* Footer info & Links */}
        <div className="mt-3 sm:mt-6 text-center text-xs text-neutral-500">
          <div className="flex items-center justify-center gap-3 text-[11px] text-neutral-500">
            <Link href="/privacy" className="hover:underline hover:text-neutral-400">
              গোপনীয়তা নীতি
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline hover:text-neutral-400">
              শর্তাবলী
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:underline hover:text-neutral-400">
              সহায়তা
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MinimalAuthPage({ defaultMode = 'login' }: MinimalAuthPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f15]">
          <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
        </div>
      }
    >
      <MinimalAuthForm defaultMode={defaultMode} />
    </Suspense>
  );
}
