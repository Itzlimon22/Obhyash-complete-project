'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  GraduationCap,
  Phone,
  School,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { searchColleges, getCanonicalCollegeName } from '@/lib/college-mapping';
import { EXAM_TARGETS } from '@/components/student/features/dashboard/ExamTargetModal';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authenticated Google user info
  const [googleUser, setGoogleUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [institute, setInstitute] = useState('');
  const [stream, setStream] = useState('HSC');
  const [group, setGroup] = useState('Science');
  const [batch, setBatch] = useState('HSC 2026');
  const [examTarget, setExamTarget] = useState('Engineering');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // College suggestions
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check auth and registration status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/login');
          return;
        }

        const user = session.user;
        const email = user.email || '';
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0] ||
          'Student';

        // Check if already registered in public.users
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, stream, batch')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile && existingProfile.stream && existingProfile.batch) {
          router.replace('/dashboard');
          return;
        }

        setGoogleUser({
          id: user.id,
          email,
          name,
        });
      } catch (err) {
        console.error('Error checking auth on onboarding:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  const handleInstituteChange = (val: string) => {
    setInstitute(val);
    if (val.trim().length >= 2) {
      const suggestions = searchColleges(val);
      setCollegeSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCollege = (name: string) => {
    setInstitute(name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error('মোবাইল নম্বর উল্লেখ করা আবশ্যক!');
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    if (!institute.trim()) {
      toast.error('তোমার কলেজ বা প্রতিষ্ঠানের নাম লেখো');
      return;
    }

    if (password && password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {
            name: googleUser?.name,
            phone: cleanPhone,
            institute: getCanonicalCollegeName(institute.trim()),
            stream,
            group,
            batch,
            examTarget,
            referralCode: referralCode.trim() || undefined,
          },
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'প্রোফাইল তৈরি করা যায়নি');
      }

      toast.success('অভিনন্দন! তোমার প্রোফাইল তৈরি হয়েছে 🎉');
      // Redirect to dashboard
      window.location.replace('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি হয়েছে। আবার চেষ্টা করুন।';
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-neutral-500 font-bold">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#07080a] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-bengali">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="Obhyash Logo"
            className="w-8 h-8 rounded-xl shadow-xs"
          />
          <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
            অভ্যাশ
          </span>
        </div>

        <Link
          href="/support"
          className="text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          সাপোর্ট লাগবে?
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-xl mx-auto w-full bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold mb-1">
            <Sparkles size={13} />
            <span>১-ক্লিক প্রোফাইল সেটআপ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            স্বাগতম, {googleUser?.name}! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-md mx-auto">
            তোমার অ্যাকাডেমিক প্রোফাইলটি দ্রুত সম্পন্ন করো এবং মুহূর্তেই প্রস্তুতি শুরু করো।
          </p>
        </div>

        {/* Google Verified Banner */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#181920] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {googleUser?.name}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                {googleUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg shrink-0">
            <CheckCircle2 size={13} />
            <span>ভেরিফাইড</span>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Phone size={14} className="text-neutral-400" />
              <span>মোবাইল নম্বর</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01XXXXXXXXX"
                required
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              ফলাফল ও গুরুত্বপূর্ণ নোটিফিকেশনের জন্য এটি ব্যবহৃত হবে।
            </p>
          </div>

          {/* College / Institution with Autocomplete */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <School size={14} className="text-neutral-400" />
              <span>কলেজ / শিক্ষাপ্রতিষ্ঠান</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={institute}
              onChange={(e) => handleInstituteChange(e.target.value)}
              placeholder="যেমন: নটর ডেম কলেজ, ঢাকা কলেজ..."
              required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && collegeSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-1.5 space-y-1">
                {collegeSuggestions.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCollege(col)}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors truncate"
                  >
                    {col}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stream & Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                শ্রেণী / লেভেল
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {(['HSC', 'SSC'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStream(s)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      stream === s
                        ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                বিভাগ / গ্রুপ
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="Science">বিজ্ঞান (Science)</option>
                <option value="Humanities">মানবিক (Humanities)</option>
                <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
              </select>
            </div>
          </div>

          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              এইচএসসি ব্যাচ
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['HSC 2026', 'HSC 2025', 'HSC 2027'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBatch(b)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    batch === b
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Target Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              ভর্তি পরীক্ষার মূল লক্ষ্য
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EXAM_TARGETS.map((t) => {
                const isSelected = examTarget === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExamTarget(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex sm:flex-col items-center sm:items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <div>
                      <p className="text-xs font-extrabold">{t.label}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {t.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Password Field */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Lock size={14} className="text-neutral-400" />
                <span>পাসওয়ার্ড সেট করো (ঐচ্ছিক)</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-medium">
                ঐচ্ছিক
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ইমেইল দিয়ে লগইন করার সুবিধার্থে (কমপক্ষে ৬ অক্ষর)"
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              💡 পাসওয়ার্ড না দিলেও তুমি সবসময় ১-ট্যাপে Google দিয়ে লগইন করতে পারবে।
            </p>
          </div>

          {/* Referral Code (Optional) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Gift size={14} className="text-neutral-400" />
                <span>রেফারেল কোড থাকলে লিখুন (ঐচ্ছিক)</span>
              </label>
            </div>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="যেমন: OBH1234"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>প্রোফাইল তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>পড়াশোনা শুরু করো</span>
                <span>🚀</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div className="text-center py-4 text-xs text-neutral-400">
        © {new Date().getFullYear()} অভ্যাশ প্ল্যাটফর্ম। সর্বস্বত্ব সংরক্ষিত।
      </div>


    </div>
  );
}
