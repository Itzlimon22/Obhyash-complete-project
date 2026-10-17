'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, Phone } from 'lucide-react';
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
  const [stream, setStream] = useState<'HSC' | 'SSC'>('HSC');
  const [group, setGroup] = useState('Science');
  const [batch, setBatch] = useState('HSC 2026');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [name, setName] = useState('');
  const [institute, setInstitute] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState(initialIdentifier);
  const [secondaryIdentifier, setSecondaryIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check whether initial input is a phone number
  const isInitialPhone = Boolean(
    phoneOrEmail && !phoneOrEmail.includes('@') && /^[0-9+০-৯\s-]+$/.test(phoneOrEmail.trim())
  );

  // College suggestions
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIdentifier) {
      setPhoneOrEmail(initialIdentifier);
    } else if (!phoneOrEmail) {
      onBackToLogin();
    }
  }, [initialIdentifier, phoneOrEmail, onBackToLogin]);

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

  // Step 3: Stream Options - Pure Bangla in UI with 3D Icons
  const streamOptions = [
    { id: 'HSC', title: 'এইচএসসি', badge: 'জনপ্রিয়', icon: '🎓', image: '/images/auth-icons/hsc.png' },
    { id: 'SSC', title: 'এসএসসি', icon: '🎒', image: '/images/auth-icons/ssc.png' },
  ];

  // Step 4: Group Options - Pure Bangla in UI with 3D Icons
  const getGroupOptions = () => {
    return [
      { id: 'Science', title: 'বিজ্ঞান', icon: '🧪', image: '/images/auth-icons/science.png' },
      { id: 'Business Studies', title: 'ব্যবসায় শিক্ষা', icon: '💼', image: '/images/auth-icons/business.png' },
      { id: 'Humanities', title: 'মানবিক', icon: '🌍', image: '/images/auth-icons/humanities.png' },
    ];
  };

  // Step 5: Batch Options based on Stream - Pure Bangla in UI
  const getBatchOptions = () => {
    if (stream === 'HSC') {
      return [
        { id: 'HSC 2025', title: 'এইচএসসি ২০২৫' },
        { id: 'HSC 2026', title: 'এইচএসসি ২০২৬' },
        { id: 'HSC 2027', title: 'এইচএসসি ২০২৭' },
        { id: 'HSC 2028', title: 'এইচএসসি ২০২৮' },
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

    const cleanPrimary = phoneOrEmail.trim();
    const cleanSecondary = secondaryIdentifier.trim();

    if (!cleanPrimary) {
      setError('মোবাইল নম্বর অথবা ইমেইল দাও');
      return;
    }

    if (!cleanSecondary) {
      if (isInitialPhone) {
        setError('তোমার ইমেইল অ্যাড্রেস (Gmail) প্রদান করা বাধ্যতামূলক');
      } else {
        setError('তোমার ১১ ডিজিটের মোবাইল নম্বর প্রদান করা বাধ্যতামূলক');
      }
      return;
    }

    const rawPhone = isInitialPhone ? cleanPrimary : cleanSecondary;
    const rawEmail = isInitialPhone ? cleanSecondary : cleanPrimary;

    // 1. Phone Normalization & Validation
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let phoneDigits = rawPhone;
    for (let i = 0; i < 10; i++) {
      phoneDigits = phoneDigits.split(bnDigits[i]).join(i.toString());
    }
    const cleanDigits = phoneDigits.replace(/\D/g, '');
    let normalizedPhone = cleanDigits;
    if (normalizedPhone.startsWith('8801') && normalizedPhone.length === 13) {
      normalizedPhone = normalizedPhone.substring(2);
    } else if (normalizedPhone.startsWith('1') && normalizedPhone.length === 10) {
      normalizedPhone = '0' + normalizedPhone;
    }

    if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)');
      return;
    }

    // 2. Email Validation
    const cleanEmail = rawEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('সঠিক ইমেইল অ্যাড্রেস লিখো (যেমন: student@gmail.com)');
      return;
    }

    // 3. Password Validation
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
      // 2. Prepare Canonical Data
      const canonicalCollege = getCanonicalCollegeName(institute.trim()) || 'অন্যান্য প্রতিষ্ঠান';

      // 3. Register via Supabase Auth with REAL email & phone
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
            phone: normalizedPhone,
            role: 'Student',
            stream: stream,
            batch: batch,
            division: group,
            institute: canonicalCollege,
            gender: gender,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('এই মোবাইল অথবা ইমেইল দিয়ে ইতোমধ্যে একাউন্ট খোলা আছে। লগইন করো।');
        } else {
          setError(signUpError.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।');
        }
        setLoading(false);
        return;
      }

      const user = signUpData?.user;
      if (user) {
        // Ensure active session
        let session = signUpData.session;
        if (!session) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (signInData?.session) {
              session = signInData.session;
            }
          } catch {
            // non-fatal
          }
        }

        // 4. Complete profile via server-side Admin API (bypasses RLS & triggers safely)
        try {
          await fetch('/api/auth/complete-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              userId: user.id,
              profileData: {
                name: name.trim(),
                phone: normalizedPhone,
                gender: gender,
                institute: canonicalCollege,
                stream: stream,
                group: group,
                batch: batch,
                examTarget: 'Engineering',
              },
              password,
            }),
          });
        } catch (apiErr) {
          console.warn('complete-profile API call warning:', apiErr);
        }

        // 5. Also perform direct update with client as immediate fallback
        try {
          await supabase
            .from('users')
            .update({
              name: name.trim(),
              email: cleanEmail,
              phone: normalizedPhone,
              gender: gender,
              institute: canonicalCollege,
              stream: stream,
              division: group,
              batch: batch,
              exam_target: 'Engineering',
            })
            .eq('id', user.id);
        } catch (dbErr) {
          console.warn('Direct user update warning:', dbErr);
        }

        // 6. Cache role cookie WITH stream and batch for instant middleware validation
        try {
          const roleCookieValue = encodeURIComponent(
            JSON.stringify({
              userId: user.id,
              role: 'student',
              status: 'Active',
              stream: stream,
              batch: batch,
            })
          );
          document.cookie = `obhyash_role_cache=${roleCookieValue}; path=/; max-age=180; SameSite=Lax`;
          localStorage.removeItem('obhyash_user_profile');
          localStorage.removeItem('obhyash_cached_subjects');
          localStorage.removeItem('obhyash_exam_history');
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
      setError('একটি সমস্যা হয়েছে। আবার চেষ্টা করো।');
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0a0c12] text-white px-4 py-2.5 sm:py-8 overflow-hidden relative selection:bg-emerald-500/20 font-sans">
      {/* Background Soft Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(16,185,129,0.10),transparent_60%)]"
        aria-hidden="true"
      />

      {/* Top Left: Back Navigation Arrow */}
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 left-4 sm:top-6 sm:left-8 p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors z-20 cursor-pointer"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[420px] flex flex-col items-center">
        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs sm:text-sm text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* ── STEP 1: Name & Institute (Formerly Step 5) ───────────── */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-5 sm:mb-14">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-100 tracking-tight">
                তোমার নাম ও প্রতিষ্ঠান?
              </h2>
            </div>

            <div className="w-full space-y-3 sm:space-y-4">
              {/* Name Field */}
              <div className="space-y-1 sm:space-y-1.5 text-left">
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
                  className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_22px_rgba(16,185,129,0.25)] transition-all"
                />
              </div>

              {/* Institute Field (Right Below Name) */}
              <div className="space-y-1 sm:space-y-1.5 text-left relative">
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
                  className="w-full px-4 py-2.5 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_22px_rgba(16,185,129,0.25)] transition-all"
                />

                {/* College Autocomplete Dropdown */}
                {showSuggestions && collegeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#141824]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] z-30 divide-y divide-white/[0.04]">
                    {collegeSuggestions.map((colName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCollege(colName)}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-neutral-200 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors"
                      >
                        {colName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={handleNextFromName}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-[#064e3b] hover:bg-[#065f46] text-white border-b-[4px] border-[#022c22] shadow-[0_4px_16px_rgba(6,78,59,0.4)] active:translate-y-[2px] active:border-b-2 active:shadow-none transition-all cursor-pointer"
                >
                  এগিয়ে যাও
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Gender Selection (Formerly Step 4) ───────────── */}
        {step === 2 && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-5 sm:mb-14">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-100 tracking-tight">
                তুমি একজন
              </h2>
            </div>

            <div className="w-full space-y-2.5 sm:space-y-3">
              <button
                type="button"
                onClick={() => {
                  setGender('Male');
                  setStep(3);
                }}
                className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 cursor-pointer ${
                  gender === 'Male'
                    ? 'border-2 border-emerald-500 border-b-[4px] border-b-[#047857] bg-[#064e3b]/35 backdrop-blur-md text-white shadow-[0_3px_0_0_#047857,0_0_20px_rgba(16,185,129,0.2)] active:translate-y-[2px] active:border-b-2'
                    : 'border border-white/[0.08] border-b-[3px] border-b-[#1b1f2d] bg-[#131620]/75 backdrop-blur-md text-neutral-200 shadow-[0_3px_0_0_#1b1f2d,0_4px_14px_rgba(0,0,0,0.3)] hover:bg-[#1a1e2b] hover:border-b-[#262c3e] active:translate-y-[1px] active:border-b-2'
                }`}
              >
                <img
                  src="/images/auth-icons/boy.png"
                  alt="ছেলে"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                />
                <span className="font-bold text-sm sm:text-base">ছেলে</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGender('Female');
                  setStep(3);
                }}
                className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 cursor-pointer ${
                  gender === 'Female'
                    ? 'border-2 border-emerald-500 border-b-[4px] border-b-[#047857] bg-[#064e3b]/35 backdrop-blur-md text-white shadow-[0_3px_0_0_#047857,0_0_20px_rgba(16,185,129,0.2)] active:translate-y-[2px] active:border-b-2'
                    : 'border border-white/[0.08] border-b-[3px] border-b-[#1b1f2d] bg-[#131620]/75 backdrop-blur-md text-neutral-200 shadow-[0_3px_0_0_#1b1f2d,0_4px_14px_rgba(0,0,0,0.3)] hover:bg-[#1a1e2b] hover:border-b-[#262c3e] active:translate-y-[1px] active:border-b-2'
                }`}
              >
                <img
                  src="/images/auth-icons/girl.png"
                  alt="মেয়ে"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                />
                <span className="font-bold text-sm sm:text-base">মেয়ে</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Stream Selection (Formerly Step 1) ───────────── */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-5 sm:mb-14">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-100 tracking-tight">
                কী নিয়ে অভ্যাস করতে চাও?
              </h2>
            </div>

            <div className="w-full space-y-2.5 sm:space-y-3">
              {streamOptions.map((opt) => {
                const isSelected = stream === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setStream(opt.id as 'HSC' | 'SSC');
                      const defaultBatch = opt.id === 'HSC' ? 'HSC 2026' : 'SSC 2026';
                      setBatch(defaultBatch);
                      setGroup('Science');
                      setStep(4);
                    }}
                    className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-500 border-b-[4px] border-b-[#047857] bg-[#064e3b]/35 backdrop-blur-md text-white shadow-[0_3px_0_0_#047857,0_0_20px_rgba(16,185,129,0.2)] active:translate-y-[2px] active:border-b-2'
                        : 'border border-white/[0.08] border-b-[3px] border-b-[#1b1f2d] bg-[#131620]/75 backdrop-blur-md text-neutral-200 shadow-[0_3px_0_0_#1b1f2d,0_4px_14px_rgba(0,0,0,0.3)] hover:bg-[#1a1e2b] hover:border-b-[#262c3e] active:translate-y-[1px] active:border-b-2'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center">
                        <img
                          src={opt.image}
                          alt={opt.title}
                          className="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
                        />
                      </div>
                      <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Group Selection ─────────────────────────────────── */}
        {step === 4 && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-4 sm:mb-12">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-100 tracking-tight">
                তুমি কোন বিভাগে?
              </h2>
            </div>

            <div className="w-full space-y-2 sm:space-y-3">
              {getGroupOptions().map((opt) => {
                const isSelected = group === opt.id;
                const isDisabled = (opt as any).disabled;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      setGroup(opt.id);
                      setStep(5);
                    }}
                    className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed border border-white/[0.04] bg-[#12141c]/50 text-neutral-500'
                        : isSelected
                        ? 'border-2 border-emerald-500 border-b-[4px] border-b-[#047857] bg-[#064e3b]/35 backdrop-blur-md text-white shadow-[0_3px_0_0_#047857,0_0_20px_rgba(16,185,129,0.2)] cursor-pointer active:translate-y-[2px] active:border-b-2'
                        : 'border border-white/[0.08] border-b-[3px] border-b-[#1b1f2d] bg-[#131620]/75 backdrop-blur-md text-neutral-200 shadow-[0_3px_0_0_#1b1f2d,0_4px_14px_rgba(0,0,0,0.3)] hover:bg-[#1a1e2b] hover:border-b-[#262c3e] cursor-pointer active:translate-y-[1px] active:border-b-2'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center">
                        <img
                          src={opt.image}
                          alt={opt.title}
                          className="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
                        />
                      </div>
                      <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                      {(opt as any).badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">
                          {(opt as any).badge}
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: Batch Selection (Formerly Step 3) ────────────── */}
        {step === 5 && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-4 sm:mb-12">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-100 tracking-tight">
                তোমার ব্যাচ?
              </h2>
            </div>

            <div className="w-full space-y-2 sm:space-y-3">
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
                    className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-500 border-b-[4px] border-b-[#047857] bg-[#064e3b]/35 backdrop-blur-md text-white shadow-[0_3px_0_0_#047857,0_0_20px_rgba(16,185,129,0.2)] active:translate-y-[2px] active:border-b-2'
                        : 'border border-white/[0.08] border-b-[3px] border-b-[#1b1f2d] bg-[#131620]/75 backdrop-blur-md text-neutral-200 shadow-[0_3px_0_0_#1b1f2d,0_4px_14px_rgba(0,0,0,0.3)] hover:bg-[#1a1e2b] hover:border-b-[#262c3e] active:translate-y-[1px] active:border-b-2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
                        <img
                          src="/images/auth-icons/batch.png"
                          alt="ব্যাচ"
                          className="w-full h-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.4)]"
                        />
                      </div>
                      <span className="font-bold text-sm sm:text-base">{opt.title}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 6: Password Setup ─────────────────────────────────── */}
        {step === 6 && (
          <form onSubmit={handleFinalSubmit} className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-3 sm:mb-10">
              <h2 className="text-base sm:text-2xl font-bold text-neutral-100 tracking-tight">
                একটি পাসওয়ার্ড সেট করো
              </h2>
            </div>

            <div className="w-full space-y-2 sm:space-y-3.5">
              {/* Confirmed Mobile/Email Display */}
              {phoneOrEmail && (
                <div className="flex items-center justify-between px-3 py-1.5 sm:py-2.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-neutral-300 truncate mr-2">
                    <span className="text-neutral-500 font-medium shrink-0">
                      {isInitialPhone ? 'মোবাইল:' : 'ইমেইল:'}
                    </span>
                    <span className="font-bold text-white tracking-wide truncate font-mono">{phoneOrEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer shrink-0"
                  >
                    পরিবর্তন
                  </button>
                </div>
              )}

              {/* Dynamic Secondary Identifier Input (Mandatory) */}
              <div className="space-y-1 sm:space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-neutral-300 flex items-center justify-between">
                  <span>{isInitialPhone ? 'ইমেইল অ্যাড্রেস (Gmail)' : 'মোবাইল নম্বর'}</span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-400 font-normal">বাধ্যতামূলক</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    {isInitialPhone ? <Mail className="w-4 h-4 sm:w-5 sm:h-5" /> : <Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <input
                    type={isInitialPhone ? 'email' : 'tel'}
                    required
                    value={secondaryIdentifier}
                    onChange={(e) => {
                      setSecondaryIdentifier(e.target.value);
                      setError(null);
                    }}
                    placeholder={
                      isInitialPhone
                        ? 'student@gmail.com'
                        : '১১ ডিজিটের নম্বর (যেমন: 017XXXXXXXX)'
                    }
                    className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-xs sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_22px_rgba(16,185,129,0.25)] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 sm:space-y-1.5 text-left">
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
                    className="w-full pl-4 pr-11 py-2 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-xs sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_22px_rgba(16,185,129,0.25)] transition-all"
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
              <div className="space-y-1 sm:space-y-1.5 text-left">
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
                  className="w-full px-4 py-2 sm:py-3.5 rounded-xl bg-[#131620]/75 backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.4)] text-white placeholder-neutral-500 text-xs sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_22px_rgba(16,185,129,0.25)] transition-all"
                />
              </div>

              {/* Final Submit Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-[#064e3b] hover:bg-[#065f46] text-white border-b-[4px] border-[#022c22] shadow-[0_4px_16px_rgba(6,78,59,0.4)] active:translate-y-[2px] active:border-b-2 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
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
