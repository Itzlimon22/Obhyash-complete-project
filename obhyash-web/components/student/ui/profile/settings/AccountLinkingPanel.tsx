'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  Link2,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Unlink,
  PlusCircle,
  Edit3,
  KeyRound,
  Lock,
  AlertCircle,
} from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';

interface AccountLinkingPanelProps {
  user: UserProfile;
}

export default function AccountLinkingPanel({ user }: AccountLinkingPanelProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleIdentity, setGoogleIdentity] = useState<{ id?: string; provider?: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');

  // Phone Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState<boolean>(false);

  // Email States & Modals
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState<boolean>(false);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailOtpCooldown > 0) {
      timer = setTimeout(() => setEmailOtpCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailOtpCooldown]);

  useEffect(() => {
    async function checkIdentities() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          // Fetch live user record to get exact admin flags
          const { data: liveUser } = await supabase
            .from('users')
            .select('phone, is_phone_verified, requires_phone_verification, email, is_email_verified, requires_email_verification')
            .eq('id', authUser.id)
            .maybeSingle();

          const currentPhone = liveUser?.phone || authUser.phone || user.phone || '';
          const currentEmail = liveUser?.email || authUser.email || user.email || '';

          setAuthEmail(currentEmail);
          setAuthPhone(currentPhone);

          setIsPhoneVerified(liveUser?.is_phone_verified ?? (currentPhone ? true : false));
          setRequiresPhoneVerification(liveUser?.requires_phone_verification ?? false);

          setIsEmailVerified(liveUser?.is_email_verified ?? false);
          setRequiresEmailVerification(liveUser?.requires_email_verification ?? false);

          const identities = authUser.identities || [];
          const gIdentity = identities.find(
            (id: { provider?: string }) => id.provider === 'google',
          );
          setIsGoogleLinked(!!gIdentity);
          setGoogleIdentity(gIdentity || null);
          setGoogleEmail(
            (gIdentity as any)?.identity_data?.email ||
              authUser.user_metadata?.email ||
              '',
          );
        }
      } catch (error) {
        console.error('Error fetching identities:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkIdentities();
  }, [user]);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Linking error:', error);
        toast.error('গুগল অ্যাকাউন্ট লিঙ্ক করতে সমস্যা হয়েছে: ' + error.message);
        setIsLinking(false);
      }
    } catch (error) {
      console.error('Unexpected error linking account:', error);
      toast.error('একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
      setIsLinking(false);
    }
  };

  const handleChangeGoogle = async () => {
    if (!googleIdentity) return;
    if (!confirm('আপনি কি বর্তমান গুগল অ্যাকাউন্ট পরিবর্তন করে নতুন একটি গুগল অ্যাকাউন্ট সংযুক্ত করতে চান?')) {
      return;
    }
    setIsLinking(true);
    try {
      const supabase = createClient();
      await supabase.auth.unlinkIdentity(googleIdentity as any);
      await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error: any) {
      console.error('Error changing Google identity:', error);
      toast.error('গুগল অ্যাকাউন্ট পরিবর্তনে সমস্যা: ' + (error.message || 'Error'));
      setIsLinking(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    if (!confirm('আপনি কি নিশ্চিত যে গুগল অ্যাকাউন্টটি এই আইডি থেকে আনলিঙ্ক করতে চান?')) {
      return;
    }
    setIsLinking(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity as any);
      if (error) throw error;
      toast.success('গুগল অ্যাকাউন্ট সফলভাবে আনলিঙ্ক করা হয়েছে।');
      setIsGoogleLinked(false);
      setGoogleIdentity(null);
      setGoogleEmail('');
    } catch (error: any) {
      console.error('Error unlinking Google identity:', error);
      toast.error('আনলিঙ্ক করতে সমস্যা: ' + (error.message || 'Error'));
    } finally {
      setIsLinking(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '');
    const formatted = (clean.length === 13 && clean.startsWith('8801')) ? clean.substring(2) : clean;
    if (formatted.length !== 11 || !formatted.startsWith('01')) {
      toast.error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setIsSavingPhone(true);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('লগইন সেশন পাওয়া যায়নি');

      const { data: res, error } = await supabase.rpc('link_user_phone', {
        p_user_id: authUser.id,
        p_phone: formatted,
      });

      if (error) throw error;

      if (res && res.success) {
        toast.success(res.message || 'মোবাইল নম্বর সফলভাবে যুক্ত হয়েছে!');
        setAuthPhone(formatted);
        setIsPhoneVerified(true);
        setRequiresPhoneVerification(false);
        setIsPhoneModalOpen(false);
      } else {
        toast.error(res?.error || 'মোবাইল নম্বর সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (error: any) {
      console.error('Error saving phone:', error);
      toast.error(error.message || 'সমস্যা হয়েছে');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean.includes('@') || !clean.includes('.')) {
      toast.error('অনুগ্রহ করে সঠিক ইমেইল অ্যাড্রেস লিখুন।');
      return;
    }

    setIsSavingEmail(true);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('লগইন সেশন পাওয়া যায়নি');

      const { data: res, error } = await supabase.rpc('update_unverified_email', {
        p_user_id: authUser.id,
        p_new_email: clean,
      });

      if (error) throw error;

      if (res && res.success) {
        toast.success(res.message || 'ইমেইল পরিবর্তিত হয়েছে। এবার ওটিপি দিয়ে ভেরিফাই করুন।');
        setAuthEmail(clean);
        setIsEmailVerified(false);
        setIsEmailModalOpen(false);
      } else {
        toast.error(res?.error || 'ইমেইল পরিবর্তন ব্যর্থ হয়েছে।');
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'সমস্যা হয়েছে');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (emailOtpCooldown > 0 || isSendingEmailOtp) return;
    const targetEmail = authEmail || user.email || '';
    if (!targetEmail) {
      toast.error('প্রথমে একটি ইমেইল অ্যাড্রেস যুক্ত করুন।');
      return;
    }

    setIsSendingEmailOtp(true);
    try {
      const res = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে');

      toast.success(data.message || 'আপনার ইমেইলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে!');
      setEmailOtpCooldown(data.cooldown_seconds || 60);
      setIsEmailOtpModalOpen(true);
    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      toast.error(error.message || 'ওটিপি পাঠানো যায়নি');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtpInput.trim().length !== 6) {
      toast.error('অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড লিখুন।');
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const res = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail || user.email,
          otp: emailOtpInput.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'ভেরিফিকেশন ব্যর্থ হয়েছে');

      toast.success('ইমেইল সফলভাবে ভেরিফাই ও সুরক্ষিত করা হয়েছে! 🔒🎉');
      setIsEmailVerified(true);
      setRequiresEmailVerification(false);
      setIsEmailOtpModalOpen(false);
      setEmailOtpInput('');
    } catch (error: any) {
      console.error('Error verifying email OTP:', error);
      toast.error(error.message || 'ভুল ওটিপি কোড');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const cardClass =
    'bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300';
  const headerClass =
    'px-6 py-4 border-b border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-900/50 flex items-center justify-between';
  const headerTitleClass =
    'text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2';
  const bodyClass = 'p-6 space-y-5';

  const displayPhone = authPhone || user.phone || '';
  const displayEmail = authEmail || user.email || '';

  const isEmailLocked = !!displayEmail && isEmailVerified && !requiresEmailVerification;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Top Profile Summary ── */}
      <div className={cardClass}>
        <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
          <UserAvatar
            user={user}
            size="xl"
            className="ring-4 ring-emerald-500/10"
          />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                {user.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> সক্রিয় অ্যাকাউন্ট
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-1">
              {displayEmail || displayPhone || 'আইডি: ' + (user.student_id || user.id)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Linked Accounts Section ── */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>
            <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            সংযুক্ত লগইন মাধ্যমসমূহ
          </h3>
        </div>
        <div className={bodyClass}>
          {/* Google Account */}
          <div className="p-5 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center shadow-sm shrink-0">
                <Image
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width={22}
                  height={22}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    Google অ্যাকাউন্ট
                  </h4>
                  {isGoogleLinked && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      সংযুক্ত
                    </span>
                  )}
                </div>
                {isGoogleLinked && googleEmail && (
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                    {googleEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:self-center shrink-0">
              {isGoogleLinked ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleChangeGoogle}
                    disabled={isLinking}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-600/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পরিবর্তন</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlinkGoogle}
                    disabled={isLinking}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>আনলিঙ্ক</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={isLinking || isLoadingAuth}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংযুক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Google লিঙ্ক করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Primary Email */}
          <div className="p-5 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shadow-sm shrink-0">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    ইমেইল অ্যাড্রেস
                  </h4>
                  {isEmailLocked ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      🔒 লকড (ভেরিফাইড)
                    </span>
                  ) : requiresEmailVerification ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      রি-ভেরিফাই প্রয়োজন
                    </span>
                  ) : displayEmail ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      ভেরিফাই করা হয়নি
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-neutral-200 dark:bg-zinc-700 text-neutral-600 dark:text-zinc-300">
                      যুক্ত নেই
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                  {displayEmail || 'কোনো ইমেইল যুক্ত নেই'}
                </p>
              </div>
            </div>

            <div className="sm:self-center shrink-0">
              {!isEmailLocked && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput(displayEmail);
                      setIsEmailModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-600/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ইমেইল পরিবর্তন</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={isSendingEmailOtp}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>ইমেইল ভেরিফাই করো</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Phone */}
          {(() => {
            const isPhoneReverification = requiresPhoneVerification || (displayPhone ? !isPhoneVerified : false);
            const isPhoneLocked = !!displayPhone && isPhoneVerified && !requiresPhoneVerification;

            return (
              <div className="p-5 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-sm shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                        মোবাইল নম্বর
                      </h4>
                      {isPhoneLocked ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          🔒 লকড (ভেরিফাইড)
                        </span>
                      ) : isPhoneReverification ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          রি-ভেরিফাই প্রয়োজন
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          যুক্ত নেই
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                      {displayPhone || 'কোনো ফোন নম্বর যুক্ত নেই'}
                    </p>
                  </div>
                </div>

                <div className="sm:self-center shrink-0">
                  {!isPhoneLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(displayPhone);
                        setIsPhoneModalOpen(true);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isPhoneReverification ? 'রি-ভেরিফাই / আপডেট করুন' : 'ফোন নম্বর যুক্ত ও ভেরিফাই করো'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Email Edit Modal (Before Verification) ── */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  ইমেইল অ্যাড্রেস পরিবর্তন
                </h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  ভেরিফাই করার পূর্বে আপনার আসল ইমেইল লিখুন
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  ইমেইল অ্যাড্রেস (Gmail / Email)
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={isSavingEmail}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmail}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>পরিবর্তন হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পরিবর্তন সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Email 6-Digit OTP Verification Modal ── */}
      {isEmailOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  ইমেইল ভেরিফিকেশন ওটিপি
                </h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  {displayEmail} এ পাঠানো ৬ ডিজিটের কোডটি লিখুন
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  ৬-ডিজিট ভেরিফিকেশন কোড
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={emailOtpInput}
                  onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 rounded-xl text-center text-xl tracking-[0.4em] font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400 pt-1">
                <span>কোড পাননি?</span>
                <button
                  type="button"
                  disabled={emailOtpCooldown > 0 || isSendingEmailOtp}
                  onClick={handleSendEmailOtp}
                  className="font-bold text-blue-600 dark:text-blue-400 disabled:opacity-50 hover:underline"
                >
                  {emailOtpCooldown > 0 ? `পুনরায় পাঠান (${emailOtpCooldown}s)` : 'পুনরায় কোড পাঠান'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailOtpModalOpen(false)}
                  disabled={isVerifyingEmailOtp}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingEmailOtp || emailOtpInput.length !== 6}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isVerifyingEmailOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ভেরিফাই হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ভেরিফাই ও লক করো</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Phone Add/Edit Modal ── */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {displayPhone ? 'মোবাইল নম্বর পরিবর্তন' : 'মোবাইল নম্বর যুক্ত করুন'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  আপনার সক্রিয় ১১ ডিজিটের নম্বর লিখুন
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  বাংলাদেশ মোবাইল নম্বর
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-xs font-bold text-neutral-500 dark:text-zinc-400 border-r border-neutral-200 dark:border-zinc-700 pr-2.5 my-2">
                    🇧🇩 +88
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-20 pr-4 py-2.5 bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  disabled={isSavingPhone}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhone}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavingPhone ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ ও ভেরিফাই করো</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
