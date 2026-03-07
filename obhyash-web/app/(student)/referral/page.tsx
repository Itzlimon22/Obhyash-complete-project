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
  Edit2,
  Check,
  X,
  Link as LinkIcon,
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
    admin_status: 'Pending' | 'Approved' | 'Rejected';
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
  const [isEditing, setIsEditing] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');

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
  const generateCode = async (customCode?: string) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/referral/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: customCode ? JSON.stringify({ customCode }) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'কোড তৈরি করা সম্ভব হয়নি');

      if (json.referral) {
        setData((prev) => ({ ...prev, referral: json.referral }));
        toast.success(
          customCode ? 'কাস্টম কোড সেট করা হয়েছে!' : 'রেফারেল কোড তৈরি হয়েছে!',
        );
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করো।');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Copy Link ─── */
  const copyLink = () => {
    if (!data.referral?.code) return;
    const link = `${window.location.origin}/signup?ref=${data.referral.code}`;
    navigator.clipboard.writeText(link);
    toast.success('রেফারেল লিংক কপি হয়েছে!');
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
      title="রেফারেল"
      noPadding
    >
      <div className="min-h-full bg-neutral-50 dark:bg-black pb-24 animate-fade-in relative font-sans">
        {/* ── Top Header Bar (Mobile App Style) ── */}
        <div className="bg-emerald-900 text-white px-4 pt-6 pb-4 md:pt-8 md:pb-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-950 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex items-center justify-between mb-6">
            <button
              onClick={() => goTo('profile')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black tracking-wide">
              রেফারেল প্রোগ্রাম
            </h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          <div className="relative z-10 text-center px-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner mb-4">
              <Gift className="w-8 h-8 text-emerald-300 drop-shadow-md" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
              বন্ধুদের আমন্ত্রণ জানাও
            </h2>
            <p className="text-emerald-100/90 text-[13px] md:text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
              তোমার কোড শেয়ার করো। বন্ধু প্রিমিয়াম পেলে তুমিও পাবে{' '}
              <span className="font-bold text-white">১ মাস ফ্রি!</span>
            </p>
          </div>
        </div>

        {/* ── Main Content Container ── */}
        <div className="px-4 -mt-6 relative z-20 space-y-4 max-w-2xl mx-auto">
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              {
                icon: Users,
                label: 'মোট রেফারেল',
                value: loading ? '-' : data.history.length,
              },
              {
                icon: Crown,
                label: 'অর্জিত মাস',
                value: loading
                  ? '-'
                  : data.history.filter((h) => h.admin_status === 'Approved')
                      .length,
              },
              {
                icon: TrendingUp,
                label: 'পেন্ডিং',
                value: loading
                  ? '-'
                  : data.history.filter((h) => h.admin_status === 'Pending')
                      .length,
              },
            ].map(({ icon: Icon, label, value }, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]"
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
                  {value}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Referral Code Card ── */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] p-5 sm:p-7 shadow-sm relative overflow-hidden">
            {/* subtle background decor */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-[13px] font-black uppercase tracking-wider text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              তোমার রেফারেল কোড
            </h3>

            {loading ? (
              <div className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            ) : data.referral?.code ? (
              <div className="space-y-4">
                {/* code display or editor */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customCodeInput}
                      onChange={(e) =>
                        setCustomCodeInput(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, ''),
                        )
                      }
                      className="flex-1 px-4 py-3.5 text-lg font-black tracking-widest text-center border-2 border-emerald-500/30 rounded-2xl dark:bg-neutral-950 outline-none focus:border-emerald-500 transition-all text-neutral-900 dark:text-white"
                      placeholder="নগদ/বিকাশ"
                      maxLength={15}
                    />
                    <button
                      onClick={() => generateCode(customCodeInput)}
                      disabled={generating || customCodeInput.length < 4}
                      className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {generating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-2xl transform transition-transform group-hover:scale-[1.02]"></div>
                      <div className="relative flex items-center justify-between p-2 pl-5 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed group-hover:border-solid transition-all">
                        <code className="text-2xl font-black tracking-[0.2em] text-neutral-900 dark:text-white uppercase select-all">
                          {data.referral.code}
                        </code>
                        <button
                          onClick={() => {
                            setCustomCodeInput(data.referral!.code);
                            setIsEditing(true);
                          }}
                          className="p-3 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                          title="কোড এডিট করো"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* action buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyCode}
                    className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    <Copy className="w-5 h-5 mb-0.5" />
                    কোড
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyLink}
                    className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    <LinkIcon className="w-5 h-5 mb-0.5" />
                    লিংক
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={shareCode}
                    className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    <Share2 className="w-5 h-5 mb-0.5" />
                    শেয়ার
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) =>
                      setCustomCodeInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                      )
                    }
                    className="flex-1 px-4 py-3.5 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl dark:bg-neutral-950 outline-none focus:border-emerald-500 transition-all font-black tracking-widest text-center"
                    placeholder="CODE (ঐচ্ছিক)"
                    maxLength={15}
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        if (customCodeInput && customCodeInput.length < 4) {
                          toast.error('কোড কমপক্ষে ৪ অক্ষরের হতে হবে');
                          return;
                        }
                        generateCode(customCodeInput || undefined);
                      }}
                      disabled={generating}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-sm shadow-lg shadow-emerald-900/10 disabled:opacity-60 transition-all"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'সেভ করো'
                      )}
                    </motion.button>
                    {!customCodeInput && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => generateCode()}
                        disabled={generating}
                        className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-bold text-xs"
                      >
                        অটো
                      </motion.button>
                    )}
                  </div>
                </div>
                <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                  আপনি নিজের পছন্দমতো কোড দিতে পারেন অথবা 'অটো' বাটনে ক্লিক করতে
                  পারেন।
                </p>
              </div>
            )}
          </div>

          {/* ── How it works ── */}
          <div className="px-1 mb-8">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-500 mb-4 px-2">
              কীভাবে কাজ করে?
            </h3>
            <div className="space-y-3">
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
              ].map(({ step, title, desc }, idx) => (
                <div
                  key={step}
                  className="flex gap-4 p-4 bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-[3rem] transition-transform group-hover:scale-110"></div>
                  <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                    {step}
                  </div>
                  <div className="pt-1 z-10">
                    <h4 className="font-black text-neutral-900 dark:text-white text-[15px] mb-0.5">
                      {title}
                    </h4>
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── History ── */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-5 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/10">
              <h3 className="text-sm font-black uppercase text-neutral-800 dark:text-white">
                হিস্ট্রি
              </h3>
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
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
                    className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-800/50">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">
                        {new Date(h.redeemed_at).getDate()}
                      </span>
                      <span className="text-[8px] font-bold uppercase text-emerald-500/80">
                        {new Date(h.redeemed_at).toLocaleDateString('en-US', {
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[15px] text-neutral-900 dark:text-white truncate">
                        {h.redeemed_by.name || h.redeemed_by.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(h.redeemed_at).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <span className="text-[10px] text-neutral-300">•</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            h.admin_status === 'Approved'
                              ? 'bg-emerald-500 text-white'
                              : h.admin_status === 'Rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {h.admin_status === 'Approved'
                            ? 'সফল'
                            : h.admin_status === 'Rejected'
                              ? 'বাতিল'
                              : 'পেন্ডিং'}
                        </span>
                      </div>
                    </div>
                    {h.admin_status === 'Approved' && (
                      <div className="flex bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase">
                          রিওয়ার্ড
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          +১ মাস
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
