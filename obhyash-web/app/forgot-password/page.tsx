'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, Mail, Phone, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if recovery link was clicked
    const type = searchParams.get('type');
    if (type === 'recovery' || window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let target = identifier.trim();
      // Bengali digits to English
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      for (let i = 0; i < 10; i++) {
        target = target.split(bnDigits[i]).join(i.toString());
      }

      let emailToSend = target;

      // If user input phone number
      const cleanDigits = target.replace(/\D/g, '');
      if (cleanDigits.length >= 10 && !target.includes('@')) {
        let normalizedPhone = cleanDigits;
        if (normalizedPhone.startsWith('8801') && normalizedPhone.length === 13) {
          normalizedPhone = normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
          normalizedPhone = '0' + normalizedPhone;
        }

        try {
          const { data: userRows } = await supabase
            .from('users')
            .select('email')
            .or(`phone.eq.${normalizedPhone},phone.eq.+88${normalizedPhone},phone.eq.88${normalizedPhone}`)
            .limit(1);

          if (userRows && userRows.length > 0 && userRows[0].email) {
            emailToSend = userRows[0].email;
          } else {
            setError('এই মোবাইল নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
            setLoading(false);
            return;
          }
        } catch {
          setError('ব্যবহারকারীর তথ্য যাচাইয়ে সমস্যা হয়েছে। দয়া করে ইমেইল দিয়ে চেষ্টা করো।');
          setLoading(false);
          return;
        }
      }

      if (!emailToSend.includes('@')) {
        setError('অনুগ্রহ করে সঠিক ইমেইল অথবা মোবাইল নম্বর দাও।');
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/forgot-password?type=recovery`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccessMessage(
        `পাসওয়ার্ড রিসেট লিংক তোমার ইমেইলে (${emailToSend}) পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করো।`
      );
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'পাসওয়ার্ড রিসেট অনুরোধ ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করো।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড হুবহু এক হতে হবে।');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage('তোমার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন লগইন করতে পারো।');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err) {
      console.error('Update password error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে। লিঙ্কটির মেয়াদ শেষ হয়ে থাকতে পারে।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden flex flex-col justify-between bg-neutral-50 dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#006A4E]/20">
      {/* Top Header */}
      <header className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
        >
          <span>← লগইন পেজে যাও</span>
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

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111216] border border-neutral-200/90 dark:border-neutral-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-200/40 dark:shadow-none space-y-6 transition-colors">
          {/* Logo & Title */}
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
              {isRecoveryMode ? 'নতুন পাসওয়ার্ড সেট করো' : 'পাসওয়ার্ড রিসেট'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-xs mx-auto">
              {isRecoveryMode
                ? 'তোমার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড লিখুন'
                : 'তোমার অ্যাকাউন্টের নিবন্ধিত মোবাইল নম্বর বা ইমেইল দিয়ে পাসওয়ার্ড পুনরুদ্ধার করো'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRecoveryMode ? (
            /* Set New Password Form */
            <form className="space-y-4" onSubmit={handleUpdatePassword}>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  নতুন পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 sm:py-3.5 bg-neutral-50/50 dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  পাসওয়ার্ড নিশ্চিত করো
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="পাসওয়ার্ডটি আবার লেখো"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 sm:py-3.5 bg-neutral-50/50 dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>আপডেট করা হচ্ছে...</span>
                  </>
                ) : (
                  <span>পাসওয়ার্ড আপডেট করো</span>
                )}
              </button>
            </form>
          ) : (
            /* Request Reset Link Form */
            <form className="space-y-4" onSubmit={handleRequestReset}>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                  মোবাইল নম্বর অথবা ইমেইল
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 sm:py-3.5 bg-neutral-50/50 dark:bg-[#16171d] border border-neutral-300 dark:border-neutral-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] transition-all font-medium"
                  placeholder="01XXXXXXXX অথবা example@mail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#006A4E] hover:bg-[#00573e] active:scale-[0.99] text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <span>রিসেট লিংক পাঠাও</span>
                )}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            পাসওয়ার্ড মনে পড়েছে?{' '}
            <Link
              href="/login"
              className="text-[#006A4E] dark:text-[#00A87E] hover:underline font-bold transition-all ml-1"
            >
              লগইন করো
            </Link>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#07080a]">
          <Loader2 className="w-8 h-8 animate-spin text-[#006A4E]" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
