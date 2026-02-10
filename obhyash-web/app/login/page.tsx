'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import Logo from '@/components/student/ui/Logo';
import SocialLoginButton from '@/components/auth/SocialLoginButton';

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

    // 1. Log in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        setError('দয়া করে আপনার ইমেইল চেক করুন এবং ভেরিফাই লিংক এ ক্লিক করুন।');
      } else {
        setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।');
      }
      setLoading(false);
      return;
    }

    // 2. Login Success! Now Find User Role manually.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // console.log('1. User ID:', user.id);
      // console.log('2. Database Error:', profileError);
      // console.log('3. Profile Data:', profile);

      const role = profile?.role || 'Student';

      // 3. Force Redirect based on role (case-insensitive)
      if (role.toLowerCase() === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }

      // Force a hard refresh to ensure middleware picks up the new cookie
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-black px-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />

        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 md:p-10 relative">
          <div className="text-center mb-8">
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">
              স্বাগতম!
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              আপনার অ্যাকাউন্টে লগইন করুন
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                ইমেইল এড্রেস
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-200"
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
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
              <span className="bg-white dark:bg-gray-950 px-2 text-slate-500 dark:text-slate-400 font-bold">
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

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              অ্যাকাউন্ট নেই?{' '}
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all"
              >
                নতুন অ্যাকাউন্ট খুলুন
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
