'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        'লগইন অনুরোধের সময়সীমা শেষ হয়েছে। আবার চেষ্টা করো।',
      );

      const user = data?.user;

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError(
            'দয়া করে আপনার ইমেইল চেক করো এবং ভেরিফাই লিংক এ ক্লিক করো।',
          );
        } else {
          setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করো।');
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-black px-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 rounded-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-500" />

        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 md:p-10 relative">
          <div className="text-center mb-6">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">
              স্বাগতম!
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              আপনার অ্যাকাউন্টে লগইন করো
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                ইমেইল এড্রেস
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-neutral-800 dark:text-neutral-200 md:py-3.5"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                পাসওয়ার্ড
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-neutral-800 dark:text-neutral-200 md:py-3.5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 md:py-3.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  প্রবেশ করা হচ্ছে...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  লগইন
                </>
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-950 px-2 text-slate-500 dark:text-slate-400 font-bold">
                অথবা
              </span>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            }
          >
            <SocialLoginButton mode="signin" />
          </Suspense>

          <div className="mt-6 text-center space-y-4 md:mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              অ্যাকাউন্ট নেই?{' '}
              <Link
                href="/signup"
                className="text-red-600 hover:text-red-700 font-bold hover:underline transition-all"
              >
                নতুন অ্যাকাউন্ট খোলো
              </Link>
            </p>
            {/* Optional: Forgot Password Link */}
            {/* <Link href="/forgot-password" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
              পাসওয়ার্ড ভুলে গেছেন?
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
}
