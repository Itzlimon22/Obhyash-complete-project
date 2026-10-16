'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import { searchColleges, getCanonicalCollegeName } from '@/lib/college-mapping';
import { createClient } from '@/utils/supabase/client';
import { getRandomAvatar } from '@/lib/avatar-utils';

interface StepByStepRegistrationProps {
  initialIdentifier?: string;
  onBackToLogin: () => void;
  nextUrl?: string;
}

export default function StepByStepRegistration({
  initialIdentifier = '',
  onBackToLogin,
  nextUrl = '/dashboard',
}: StepByStepRegistrationProps) {
  const supabase = createClient();

  // Current Step: 1 (Stream) -> 2 (Group) -> 3 (Batch) -> 4 (Gender) -> 5 (Name & Institute) -> 6 (Password Setup)
  const [step, setStep] = useState(1);

  // Form State
  const [stream, setStream] = useState<'HSC' | 'SSC' | 'Dakhil' | 'Alim'>('HSC');
  const [group, setGroup] = useState('Science');
  const [batch, setBatch] = useState('HSC 2026');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [name, setName] = useState('');
  const [institute, setInstitute] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // College suggestions
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIdentifier && !phoneOrEmail) {
      setPhoneOrEmail(initialIdentifier);
    }
  }, [initialIdentifier]);

  // College search handler
  const handleInstituteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInstitute(val);
    setError(null);

    if (val.trim().length >= 2) {
      const suggestions = searchColleges(val).slice(0, 6);
      setCollegeSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCollege = (collegeName: string) => {
    setInstitute(collegeName);
    setShowSuggestions(false);
    setError(null);
  };

  // Back Navigation
  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBackToLogin();
    }
  };

  // Step 1: Stream Options
  const streamOptions = [
    { id: 'HSC', title: 'এইচএসসি / অ্যাডমিশন', badge: 'সবচেয়ে জনপ্রিয়', icon: '🎓' },
    { id: 'SSC', title: 'এসএসসি', icon: '🎒' },
    { id: 'Dakhil', title: 'দাখিল', icon: '📖' },
    { id: 'Alim', title: 'আলিম', icon: '🏛️' },
  ];

  // Step 2: Group Options
  const groupOptions = [
    { id: 'Science', title: 'বিজ্ঞান', icon: '🧪' },
    { id: 'English Version', title: 'ইংলিশ ভার্সন', icon: '🔬' },
    { id: 'Humanities', title: 'মানবিক', icon: '🌍' },
    { id: 'Business', title: 'বাণিজ্য', icon: '💼' },
  ];

  // Step 3: Batch Options based on Stream
  const getBatchOptions = () => {
    if (stream === 'HSC') {
      return [
        { id: 'Admission 2026', title: 'অ্যাডমিশন ২০২৬' },
        { id: 'HSC 2026', title: 'এইচএসসি ২০২৬' },
        { id: 'HSC 2027', title: 'এইচএসসি ২০২৭' },
        { id: 'HSC 2028', title: 'এইচএসসি ২০২৮' },
        { id: 'Re-Admission 2025', title: 'রি-অ্যাডমিশন ২০২৫' },
      ];
    }
    return [
      { id: 'SSC 2026', title: 'এসএসসি ২০২৬' },
      { id: 'SSC 2027', title: 'এসএসসি ২০২৭' },
      { id: 'SSC 2028', title: 'এসএসসি ২০২৮' },
    ];
  };

  // Step 1 Validation (Name & Institute)
  const handleNextFromName = () => {
    if (!name.trim()) {
      setError('তোমার নাম উল্লেখ করা আবশ্যক');
      return;
    }
    if (!institute.trim()) {
      setError('তোমার শিক্ষা প্রতিষ্ঠান বা কলেজের নাম লিখো');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 6 Final Submit (Password & Registration)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanContact = phoneOrEmail.trim();
    if (!cleanContact) {
      setError('মোবাইল নম্বর অথবা ইমেইল দাও');
      return;
    }
    if (!password) {
      setError('পাসওয়ার্ড লিখো');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }

    setLoading(true);

    try {
      // 1. Bengali to English digits
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      let targetInput = cleanContact;
      for (let i = 0; i < 10; i++) {
        targetInput = targetInput.split(bnDigits[i]).join(i.toString());
      }

      let targetEmail = targetInput.toLowerCase();
      let inputPhone = '';
      const isPhone = !targetInput.includes('@') && /^[0-9+]+$/.test(targetInput.replace(/\s|-/g, ''));

      if (isPhone) {
        const cleanDigits = targetInput.replace(/\D/g, '');
        let normalizedPhone = cleanDigits;
        if (normalizedPhone.startsWith('8801') && normalizedPhone.length === 13) {
          normalizedPhone = normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
          normalizedPhone = '0' + normalizedPhone;
        }

        if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
          setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)');
          setLoading(false);
          return;
        }

        inputPhone = normalizedPhone;
        targetEmail = `${normalizedPhone}@user.obhyash.com`;
      }

      // 2. Register via Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
            phone: inputPhone || null,
            role: 'Student',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('এই মোবাইল/ইমেইল দিয়ে ইতোমধ্যে একাউন্ট খোলা আছে। লগইন করো।');
        } else {
          setError(signUpError.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।');
        }
        setLoading(false);
        return;
      }

      const user = signUpData?.user;
      if (user) {
        // Upsert full profile data
        const canonicalCollege = getCanonicalCollegeName(institute.trim());
        const mappedStream = stream === 'Dakhil' || stream === 'Alim' ? 'HSC' : stream;

        await supabase.from('users').upsert(
          {
            id: user.id,
            email: targetEmail,
            name: name.trim(),
            phone: inputPhone || null,
            gender: gender,
            institute: canonicalCollege,
            stream: mappedStream,
            division: group,
            batch: batch,
            exam_target: 'Engineering',
            optional_subject: 'Biology',
            role: 'Student',
            status: 'Active',
            avatar_url: getRandomAvatar(gender, user.id),
            is_subscribed: false,
            subscription_status: 'Inactive',
            xp: 0,
            level: 'Beginner',
            exams_taken: 0,
            enrolled_exams: 0,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );

        // Cache role cookie
        try {
          const roleCookieValue = encodeURIComponent(
            JSON.stringify({ userId: user.id, role: 'student', status: 'Active' })
          );
          document.cookie = `obhyash_role_cache=${roleCookieValue}; path=/; max-age=180; SameSite=Lax`;
          localStorage.removeItem('obhyash_user_profile');
        } catch {
          // non-fatal
        }

        window.location.replace(nextUrl || '/dashboard');
      } else {
        setError('অ্যাকাউন্ট তৈরি হয়েছে। এবার লগইন করো।');
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError('একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করো।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0d0f15] text-white px-4 py-8 relative selection:bg-emerald-500/20">
      {/* Top Left: Back Navigation Arrow */}
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-6 left-5 sm:left-8 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors z-20 cursor-pointer"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Progress Dots / Steps */}
      <div className="absolute top-7 right-5 sm:right-8 flex items-center gap-1.5 z-20">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-2 bg-emerald-700' : 'w-2 bg-neutral-800'
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] flex flex-col items-center">
        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs sm:text-sm text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* ── STEP 1: Name & Institute (Formerly Step 5) ───────────── */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="তোমার নাম ও প্রতিষ্ঠান?" mood="happy" />

            <div className="w-full space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                  তোমার নাম
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="তোমার নাম লিখো"
                  autoFocus
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              {/* Institute Field (Right Below Name) */}
              <div className="space-y-1.5 text-left relative">
                <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                  শিক্ষা প্রতিষ্ঠান / কলেজ
                </label>
                <input
                  type="text"
                  value={institute}
                  onChange={handleInstituteChange}
                  onFocus={() => {
                    if (institute.trim().length >= 2) setShowSuggestions(true);
                  }}
                  placeholder="কলেজ বা প্রতিষ্ঠানের নাম লিখো"
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />

                {/* College Autocomplete Dropdown */}
                {showSuggestions && collegeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#1a1e29] border border-[#2e3447] rounded-xl shadow-2xl z-30 divide-y divide-neutral-800">
                    {collegeSuggestions.map((colName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCollege(colName)}
                        className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-neutral-200 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors"
                      >
                        {colName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNextFromName}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  এগিয়ে যাও
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Gender Selection (Formerly Step 4) ───────────── */}
        {step === 2 && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="তুমি একজন" mood="thinking" />

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => {
                  setGender('Male');
                  setStep(3);
                }}
                className={`w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                  gender === 'Male'
                    ? 'border-2 border-emerald-500 bg-[#0f231c] text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                    : 'border border-[#232734] bg-[#161922] hover:bg-[#1e222e] text-neutral-200'
                }`}
              >
                <span className="text-2xl">👦</span>
                <span className="font-bold text-base">ছেলে</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGender('Female');
                  setStep(3);
                }}
                className={`w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                  gender === 'Female'
                    ? 'border-2 border-emerald-500 bg-[#0f231c] text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                    : 'border border-[#232734] bg-[#161922] hover:bg-[#1e222e] text-neutral-200'
                }`}
              >
                <span className="text-2xl">👧</span>
                <span className="font-bold text-base">মেয়ে</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Stream Selection (Formerly Step 1) ───────────── */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="তুমি কি বিষয়ে অভ্যাস করতে চাও?" mood="reading" />

            <div className="w-full space-y-3">
              {streamOptions.map((opt) => {
                const isSelected = stream === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setStream(opt.id as any);
                      const defaultBatch = opt.id === 'HSC' ? 'HSC 2026' : 'SSC 2026';
                      setBatch(defaultBatch);
                      setStep(4);
                    }}
                    className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-500 bg-[#0f231c] text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                        : 'border border-[#232734] bg-[#161922] hover:bg-[#1e222e] text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Group Selection (Formerly Step 2) ────────────── */}
        {step === 4 && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="তুমি কোন বিভাগে?" mood="happy" />

            <div className="w-full space-y-3">
              {groupOptions.map((opt) => {
                const isSelected = group === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setGroup(opt.id);
                      setStep(5);
                    }}
                    className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-500 bg-[#0f231c] text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                        : 'border border-[#232734] bg-[#161922] hover:bg-[#1e222e] text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: Batch Selection (Formerly Step 3) ────────────── */}
        {step === 5 && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="তোমার ব্যাচ?" mood="thinking" />

            <div className="w-full space-y-3">
              {getBatchOptions().map((opt) => {
                const isSelected = batch === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setBatch(opt.id);
                      setStep(6);
                    }}
                    className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-500 bg-[#0f231c] text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                        : 'border border-[#232734] bg-[#161922] hover:bg-[#1e222e] text-neutral-200'
                    }`}
                  >
                    <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 6: Password Setup (User: erpor ashbe password setup page) */}
        {step === 6 && (
          <form onSubmit={handleFinalSubmit} className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MascotAvatar speechText="একটি পাসওয়ার্ড সেট করো" mood="thinking" />

            <div className="w-full space-y-4">
              {/* Password */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="পাসওয়ার্ড লিখো (কমপক্ষে ৬ অক্ষর)"
                    className="w-full pl-4 pr-11 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-neutral-300">
                  পাসওয়ার্ড নিশ্চিত করো
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="পাসওয়ার্ড পুনরায় লিখো"
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-[#171a23] border border-[#262a36] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              {/* Final Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <span>রেজিস্ট্রেশন সম্পন্ন করো</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
