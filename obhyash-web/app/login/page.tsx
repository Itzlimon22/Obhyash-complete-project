'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, Loader2, ArrowRight } from 'lucide-react';
import SocialLoginButton from '@/components/auth/SocialLoginButton';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else if (params.get('logout') === 'true') {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

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

        // 1. Try RPC get_email_by_phone
        try {
          const { data, error: rpcErr } = await supabase.rpc('get_email_by_phone', {
            p_phone: normalizedPhone,
          });
          if (!rpcErr && data) {
            resolvedEmail = data;
          }
        } catch {
          // ignore and fallback
        }

        // 2. Fallback direct table query
        if (!resolvedEmail) {
          try {
            const { data: userRow } = await supabase
              .from('users')
              .select('email')
              .or(`phone.eq.${normalizedPhone},phone.eq.+88${normalizedPhone},phone.eq.88${normalizedPhone}`)
              .maybeSingle();
            if (userRow?.email) {
              resolvedEmail = userRow.email;
            }
          } catch {
            // ignore
          }
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

      // 2. Login Success! Redirect to /dashboard — middleware handles
      // role-based forwarding (admin → /admin/dashboard, teacher → /teacher/dashboard).
      if (user) {
        router.push('/dashboard');
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
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans selection:bg-emerald-500/20">
      {/* Top Header / Branding */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-transform">
            অ
          </div>
          <span className="font-extrabold text-xl tracking-tight text-neutral-900 dark:text-white">
            OBHYASH
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
        >
          <span>হোমপেজে ফিরে যাও</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Center Auth Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900/80 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xl shadow-neutral-200/40 dark:shadow-none p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              স্বাগতম!
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              তোমার অ্যাকাউন্টে লগইন করো
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                মোবাইল নম্বর অথবা ইমেইল
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  id="identifier"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-neutral-800 dark:text-neutral-200"
                  placeholder="017XXXXXXXX অথবা example@mail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                পাসওয়ার্ড
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-neutral-800 dark:text-neutral-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>প্রবেশ করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>লগইন</span>
                </>
              )}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400 font-bold">
                অথবা
              </span>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            }
          >
            <SocialLoginButton mode="signin" />
          </Suspense>

          <div className="pt-2 text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            অ্যাকাউন্ট নেই?{' '}
            <Link
              href="/signup"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition-all ml-1"
            >
              নতুন অ্যাকাউন্ট খোলো
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs text-neutral-400 dark:text-neutral-600 flex items-center justify-center gap-4">
        <Link href="/privacy" className="hover:underline">
          গোপনীয়তা নীতি
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:underline">
          শর্তাবলী
        </Link>
        <span>•</span>
        <Link href="/faq" className="hover:underline">
          সহায়তা / FAQ
        </Link>
      </footer>
    </div>
  );
}
