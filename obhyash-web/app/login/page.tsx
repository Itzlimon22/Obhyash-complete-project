'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, Loader2, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import { useTheme } from '@/components/providers/ThemeProvider';

const AUTH_TIMEOUT_MS = 30000;

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

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const supabase = createClient();

  // Handle errors passed via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'unregistered_google') {
      setTimeout(() => {
        setError('এই গুগল ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে আগে নতুন অ্যাকাউন্ট খুলুন।');
      }, 0);
      window.history.replaceState({}, '', '/login');
    } else if (err === 'oauth_cancelled') {
      setTimeout(() => {
        setError('গুগল লগইন বাতিল বা ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
      }, 0);
      window.history.replaceState({}, '', '/login');
    } else if (params.get('logout') === 'true') {
      window.history.replaceState({}, '', '/login');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let targetEmail = identifier.trim();

      // Convert any Bengali numerals (০-৯) to English digits (0-9)
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      for (let i = 0; i < 10; i++) {
        targetEmail = targetEmail.split(bnDigits[i]).join(i.toString());
      }

      // If user provided a phone number instead of email
      const cleanDigits = targetEmail.replace(/\D/g, '');
      if (cleanDigits.length >= 10 && !targetEmail.includes('@')) {
        let normalizedPhone = cleanDigits;
        if (normalizedPhone.startsWith('8801') && normalizedPhone.length === 13) {
          normalizedPhone = normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
          normalizedPhone = '0' + normalizedPhone;
        }

        let resolvedEmail: string | null = null;

        // Fast phone lookup with limit(1) to avoid multi-row errors and 404 RPC delays
        try {
          const { data: userRows } = await supabase
            .from('users')
            .select('email')
            .or(`phone.eq.${normalizedPhone},phone.eq.+88${normalizedPhone},phone.eq.88${normalizedPhone}`)
            .limit(1);
          if (userRows && userRows.length > 0 && userRows[0].email) {
            resolvedEmail = userRows[0].email;
          }
        } catch {
          // ignore and proceed
        }

        if (!resolvedEmail) {
          setError('এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
          setLoading(false);
          return;
        }
        targetEmail = resolvedEmail;
      }

      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        }),
        'লগইন অনুরোধের সময়সীমা শেষ হয়েছে। আবার চেষ্টা করো।',
      );

      const user = data?.user;

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError(
            'দয়া করে তোমার ইমেইল চেক করো এবং ভেরিফাই লিংক এ ক্লিক করো।',
          );
        } else {
          setError('মোবাইল/ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করো।');
        }
        setLoading(false);
        return;
      }

      // Login Success!
      // Fetch actual role from public.users so Admin and Teacher accounts redirect properly
      if (user) {
        let role = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
        let status = 'Active';

        try {
          const { data: profileRow } = await supabase
            .from('users')
            .select('role, status')
            .eq('id', user.id)
            .maybeSingle();

          if (profileRow?.role) {
            role = profileRow.role.toLowerCase();
          }
          if (profileRow?.status) {
            status = profileRow.status || 'Active';
          }
        } catch {
          // non-fatal fallback
        }

        if (!role) role = 'student';

        try {
          const roleCookieValue = encodeURIComponent(
            JSON.stringify({ userId: user.id, role, status })
          );
          document.cookie = `obhyash_role_cache=${roleCookieValue}; path=/; max-age=180; SameSite=Lax`;
          localStorage.removeItem('obhyash_user_profile');
          localStorage.removeItem('obhyash_cached_subjects');
          localStorage.removeItem('obhyash_exam_history');
        } catch {
          // non-fatal
        }

        // Redirect immediately via full navigation so server receives fresh cookies
        const params = new URLSearchParams(window.location.search);
        const nextParam = params.get('next');
        const targetUrl =
          nextParam && nextParam.startsWith('/')
            ? nextParam
            : role === 'admin'
              ? '/admin/dashboard'
              : role === 'teacher'
                ? '/teacher/dashboard'
                : '/dashboard';

        window.location.replace(targetUrl);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : '';
      setError(
        message.includes('সময়') || message.toLowerCase().includes('timeout')
          ? 'সার্ভার রেসপন্স দিতে দেরি করছে। একটু পরে আবার চেষ্টা করো।'
          : 'একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করো।',
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-neutral-50 dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#006A4E]/20">
      {/* Top Header / Language Switcher & Back Link */}
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

          {/* Support Link */}
          <Link
            href="/support"
            className="text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            সাপোর্ট লাগবে?
          </Link>
        </div>
      </header>

      {/* Center Auth Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111216] border border-neutral-200/90 dark:border-neutral-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-200/40 dark:shadow-none space-y-6 transition-colors">
          {/* Centered Brand Logo & Title */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
            <img
              src="/obhyash_full_logo.png"
              alt="Obhyash Logo"
              className="h-10 w-auto object-contain dark:hidden"
            />
            <img
              src="/obhyash_full_logo_dark.png"
              alt="Obhyash Logo"
              className="h-10 w-auto object-contain hidden dark:block"
            />
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              লগইন/রেজিস্টার
            </h1>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                মোবাইল নম্বর
              </label>
              <input
                id="identifier"
                type="text"
                required
                className="w-full px-4 py-3 sm:py-3.5 bg-neutral-50/50 dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                placeholder="01XXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-4 pr-11 py-3 sm:py-3.5 bg-neutral-50/50 dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {/* Forgot password link */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>প্রবেশ করা হচ্ছে...</span>
                </>
              ) : (
                <span>এগিয়ে যাও</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-[#111216] px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                Login / Registration with
              </span>
            </div>
          </div>

          {/* Social Google Login Card */}
          <Suspense
            fallback={
              <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl sm:rounded-2xl animate-pulse" />
            }
          >
            <SocialLoginButton
              mode="signin"
              label="Google"
              className="!py-3.5 !rounded-xl sm:!rounded-2xl !bg-white dark:!bg-[#16171d] !border !border-neutral-300 dark:!border-neutral-700/80 !text-neutral-800 dark:!text-neutral-200 !shadow-2xs hover:!bg-neutral-50 dark:hover:!bg-neutral-800/80 transition-all font-semibold"
            />
          </Suspense>

          {/* Registration Prompt */}
          <div className="pt-2 text-center">
            <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              অ্যাকাউন্ট নেই?{' '}
              <Link
                href="/signup"
                className="text-[#006A4E] dark:text-[#00A87E] hover:underline font-bold transition-all ml-1"
              >
                নতুন অ্যাকাউন্ট খুলুন
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
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
