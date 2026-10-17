'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Logo, Heading, PrimaryButton, Field, PasswordField, BackButton } from '@/components/auth/figma/ui';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get('identifier');
    if (idParam) {
      setIdentifier(idParam);
    }
    const type = searchParams.get('type');
    if (type === 'recovery' || (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))) {
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
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      for (let i = 0; i < 10; i++) {
        target = target.split(bnDigits[i]).join(i.toString());
      }

      let emailToSend = target;

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
            setError('এই মোবাইল নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
            setLoading(false);
            return;
          }
        } catch {
          setError('ব্যবহারকারীর তথ্য যাচাইয়ে সমস্যা হয়েছে। দয়া করে ইমেইল দিয়ে চেষ্টা করো।');
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
        `পাসওয়ার্ড রিসেট লিংক তোমার ইমেইলে (${emailToSend}) পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করো।`
      );
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'পাসওয়ার্ড রিসেট অনুরোধ ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করো।'
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
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড হুবহু এক হতে হবে।');
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

      setSuccessMessage('তোমার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! লগইন পেজে নিয়ে যাচ্ছি…');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (err) {
      console.error('Update password error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে। লিঙ্কটির মেয়াদ শেষ হয়ে থাকতে পারে।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 font-['Kalpurush',sans-serif]">
      <BackButton onClick={() => router.push('/auth/login')} />
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
        <Logo />

        <div className="mt-8 sm:mt-10 w-full animate-step">
          <Heading
            title={isRecoveryMode ? 'নতুন পাসওয়ার্ড সেট করো' : 'পাসওয়ার্ড রিসেট'}
            sub={
              isRecoveryMode
                ? 'তোমার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড দাও'
                : 'নিবন্ধিত মোবাইল নম্বর বা ইমেইল দিয়ে পাসওয়ার্ড পুনরুদ্ধার করো'
            }
          />

          {error && (
            <div className="mt-5 p-3.5 rounded-2xl bg-[#ef4136]/10 border border-[#ef4136]/30 text-[#ff6b6b] text-sm text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#34d399] text-sm text-center leading-relaxed">
              {successMessage}
            </div>
          )}

          {isRecoveryMode ? (
            <form className="mt-8 space-y-4" onSubmit={handleUpdatePassword}>
              <PasswordField
                label="নতুন পাসওয়ার্ড"
                required
                autoFocus
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
              />
              <PasswordField
                label="পাসওয়ার্ড নিশ্চিত করো"
                required
                placeholder="পাসওয়ার্ডটি পুনরায় লিখো"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
              />
              <PrimaryButton loading={loading} disabled={newPassword.length < 6 || !confirmPassword}>
                পাসওয়ার্ড আপডেট করো
              </PrimaryButton>
            </form>
          ) : (
            <form className="mt-8" onSubmit={handleRequestReset}>
              <Field
                label="মোবাইল নম্বর অথবা ইমেইল"
                icon="user"
                required
                autoFocus
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                placeholder="01XXXXXXXXX অথবা example@mail.com"
              />
              <PrimaryButton loading={loading} disabled={!identifier.trim()}>
                রিসেট লিংক পাঠাও
              </PrimaryButton>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              পাসওয়ার্ড মনে পড়েছে? <span className="text-[#ef4136] hover:underline">লগইন করো</span>
            </Link>
          </div>
        </div>

        <a
          href="/support"
          className="mt-12 text-sm text-zinc-400 transition hover:text-white"
        >
          সাপোর্ট লাগবে?
        </a>
        <nav className="mt-5 flex items-center gap-3 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-300">
            গোপনীয়তা নীতি
          </Link>
          <span>·</span>
          <Link href="/terms-and-conditions" className="hover:text-zinc-300">
            শর্তাবলী
          </Link>
          <span>·</span>
          <Link href="/about-us#faq" className="hover:text-zinc-300">
            সহায়তা
          </Link>
        </nav>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07080b]">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-[#ef4136]" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
