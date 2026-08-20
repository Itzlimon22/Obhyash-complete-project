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
  Check,
  Loader2,
  Globe,
  Sparkles,
} from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';

interface AccountLinkingPanelProps {
  user: UserProfile;
}

export default function AccountLinkingPanel({ user }: AccountLinkingPanelProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');

  useEffect(() => {
    async function checkIdentities() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setAuthEmail(authUser.email || user.email || '');
          setAuthPhone(authUser.phone || user.phone || '');
          const identities = authUser.identities || [];
          const googleLinked = identities.some(
            (id: { provider?: string }) => id.provider === 'google',
          );
          setIsGoogleLinked(googleLinked);
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

  const cardClass =
    'bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300';
  const headerClass =
    'px-6 py-4 border-b border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-900/50 flex items-center justify-between';
  const headerTitleClass =
    'text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2';
  const bodyClass = 'p-6 space-y-5';

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
              {authEmail || authPhone || user.email || 'আইডি: ' + (user.student_id || user.id)}
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
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                  {isGoogleLinked
                    ? 'গুগল অ্যাকাউন্ট সংযুক্ত আছে। আপনি যেকোনো ডিভাইস থেকে ১-ক্লিকে লগইন করতে পারবেন।'
                    : '১-ক্লিকে পাসওয়ার্ড ছাড়াই দ্রুত ও নিরাপদে লগইন করার জন্য গুগল যুক্ত করুন।'}
                </p>
              </div>
            </div>

            <div className="sm:self-center shrink-0">
              {isGoogleLinked ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                  <Check className="w-4 h-4" />
                  <span>Linked</span>
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
          <div className="p-5 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shadow-sm shrink-0">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  ইমেইল অ্যাড্রেস
                </h4>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                  {authEmail || user.email || 'কোনো ইমেইল যুক্ত নেই'}
                </p>
              </div>
            </div>
            {(authEmail || user.email) && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </div>

          {/* Mobile Phone */}
          <div className="p-5 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-sm shrink-0">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  মোবাইল নম্বর
                </h4>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
                  {authPhone || user.phone || 'কোনো ফোন নম্বর যুক্ত নেই'}
                </p>
              </div>
            </div>
            {(authPhone || user.phone) && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* ── Security Info Note ── */}
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
          <span className="font-bold">নিরাপত্তা পরামর্শ:</span> Google বা ফোন নম্বর লিঙ্ক থাকলে যেকোনো নতুন ব্রাউজার বা ডিভাইসে পাসওয়ার্ড ছাড়া ১-ক্লিকেই আপনার পড়াশোনার সকল ডাটা সহ তাৎক্ষণিক লগইন করতে পারবেন।
        </div>
      </div>
    </div>
  );
}
