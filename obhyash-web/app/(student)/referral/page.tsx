'use client';

import { useEffect, useState } from 'react';
import {
  Gift,
  Copy,
  CheckCheck,
  Users,
  Crown,
  TrendingUp,
  Share2,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AppLayout from '@/components/student/ui/layout/AppLayout';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ReferralInfo {
  referral?: { id: string; code: string; created_at: string } | null;
  history: Array<{
    id: string;
    redeemed_at: string;
    redeemed_by: { email: string; name: string };
  }>;
}

export default function ReferralPage() {
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<ReferralInfo>({
    referral: null,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  /* ─── Initialise ─── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as 'light' | 'dark';
      if (stored) {
        setTheme(stored);
        document.documentElement.classList.toggle('dark', stored === 'dark');
      }
      const cachedUser = localStorage.getItem('obhyash_user_profile');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {}
      }
    }

    fetch('/api/referral/me')
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ─── Theme ─── */
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  /* ─── Navigation helpers ─── */
  const goTo = (tab: string) => {
    sessionStorage.setItem('obhyash_active_tab', tab);
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('obhyash_active_tab');
    localStorage.removeItem('obhyash_user_profile');
    await supabase.auth.signOut();
    router.replace('/');
  };

  /* ─── Generate code ─── */
  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/referral/create', { method: 'POST' });
      const json = await res.json();
      if (json.referral) {
        setData((prev) => ({ ...prev, referral: json.referral }));
        toast.success('রেফারেল কোড তৈরি হয়েছে!');
      } else {
        toast.error(json.error || 'কোড তৈরি করা সম্ভব হয়নি');
      }
    } catch {
      toast.error('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Copy code ─── */
  const copyCode = () => {
    if (!data.referral?.code) return;
    navigator.clipboard.writeText(data.referral.code);
    setCopied(true);
    toast.success('কোড কপি হয়েছে!');
    setTimeout(() => setCopied(false), 2500);
  };

  /* ─── Share ─── */
  const shareCode = () => {
    if (!data.referral?.code) return;
    const text = `আমার রেফারেল কোড ব্যবহার করো এবং ১ মাস বিনামূল্যে প্রিমিয়াম পাও! কোডটি হল: ${data.referral.code}\n\nhttps://obhyash.vercel.app/signup`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('শেয়ার লিংক কপি হয়েছে!');
    }
  };

  return (
    <AppLayout
      activeTab="profile"
      user={user || undefined}
      onTabChange={goTo}
      onLogout={handleLogout}
      toggleTheme={toggleTheme}
      isDarkMode={theme === 'dark'}
      title="রেফারেল প্রোগ্রাম"
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16 animate-fade-in">
        {/* ── Back button ── */}
        <button
          onClick={() => goTo('profile')}
          className="flex items-center gap-1.5 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> প্রোফাইলে ফিরুন
        </button>

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-7 sm:p-10 shadow-2xl text-white">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-700/30 -mb-10 -ml-10" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Gift className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-emerald-700/60 border border-emerald-600/40 text-emerald-200 mb-2 inline-block">
                রেফারেল প্রোগ্রাম
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mb-1.5">
                বন্ধুকে আমন্ত্রণ জানাও
              </h1>
              <p className="text-emerald-200/80 text-sm leading-relaxed max-w-sm">
                তোমার কোড শেয়ার করো। বন্ধু সাইন আপ করলে তুমি পাবে{' '}
                <span className="text-white font-bold">১ মাস প্রিমিয়াম</span>,
                বন্ধুও পাবে বিনামূল্যে প্রিমিয়াম।
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 mt-7 grid grid-cols-3 gap-3">
            {[
              {
                icon: Users,
                label: 'মোট রেফারেল',
                value: loading ? '—' : String(data.history.length),
              },
              {
                icon: Crown,
                label: 'অর্জিত মাস',
                value: loading ? '—' : String(data.history.length),
              },
              {
                icon: TrendingUp,
                label: 'পুরস্কার (মাস)',
                value: loading ? '—' : String(data.history.length),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white/10 border border-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center"
              >
                <Icon className="w-5 h-5 text-emerald-300 mx-auto mb-1.5" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[10px] sm:text-xs text-emerald-200/70 font-medium leading-tight mt-0.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Referral Code Card ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-black text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </span>
            তোমার রেফারেল কোড
          </h2>

          {loading ? (
            <div className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ) : data.referral?.code ? (
            <div className="space-y-3">
              {/* code display */}
              <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <code className="flex-1 text-2xl font-black tracking-[0.25em] text-neutral-900 dark:text-white text-center">
                  {data.referral.code}
                </code>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={copyCode}
                  className={`p-2.5 rounded-xl font-bold transition-colors ${
                    copied
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </motion.button>
              </div>

              {/* action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={copyCode}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  কোড কপি করো
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={shareCode}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-sm transition-colors shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  শেয়ার করো
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                তোমার এখনও কোনো রেফারেল কোড নেই। নিচের বাটন থেকে একটি তৈরি করো।
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={generateCode}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-sm shadow-lg shadow-emerald-900/30 disabled:opacity-60 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" /> কোড তৈরি করো
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {/* ── How it works ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-black text-neutral-800 dark:text-white mb-4">
            কীভাবে কাজ করে?
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: '১',
                title: 'কোড তৈরি করো',
                desc: 'একটি ইউনিক রেফারেল কোড জেনারেট করো।',
              },
              {
                step: '২',
                title: 'বন্ধুকে শেয়ার করো',
                desc: 'লিংক বা কোড শেয়ার করো যেকোনো বন্ধুকে।',
              },
              {
                step: '৩',
                title: 'দুজনেই পুরস্কার পাও',
                desc: 'বন্ধু সাইন আপ করলে তুমি এবং বন্ধু — দুজনেই ১ মাস বিনামূল্যে প্রিমিয়াম পাবে!',
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex items-start gap-4">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0">
                  {step}
                </span>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    {title}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── History ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-base font-black text-neutral-800 dark:text-white">
              রিডিম্পশন ইতিহাস
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              কারা তোমার কোড ব্যবহার করেছে
            </p>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Users className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
              </div>
              <p className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
                এখনও কেউ কোড ব্যবহার করেনি
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                বন্ধুদের সাথে শেয়ার করো!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {data.history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {h.redeemed_by.name || h.redeemed_by.email}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {new Date(h.redeemed_at).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shrink-0">
                    +১ মাস
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
