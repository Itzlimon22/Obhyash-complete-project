'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Mail,
  Lock,
  User,
  Phone,
  School,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import Logo from '@/components/student/ui/Logo';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal (Was Step 2)
    name: '',
    phone: '',
    gender: '', // Male, Female, Other

    // Step 2: Academic (Was Step 3)
    institute: '',
    stream: 'HSC',
    group: 'Science',
    batch: 'HSC 2025',

    // Step 3: Credentials (Was Step 1)
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      // Personal
      if (!formData.name) {
        return 'আপনার নাম উল্লেখ করা আবশ্যক';
      }
      if (!formData.phone) {
        return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';
      }
      if (!/^01\d{9}$/.test(formData.phone)) {
        return 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)';
      }
      if (!formData.gender) {
        return 'লিঙ্গ নির্বাচন করা আবশ্যক';
      }
    }
    if (currentStep === 2) {
      // Academic
      if (!formData.batch) {
        return 'ব্যাচ সিলেক্ট করা আবশ্যক';
      }
      if (!formData.institute) {
        return 'আপনার শিক্ষা প্রতিষ্ঠানের নাম লিখুন';
      }
    }
    if (currentStep === 3) {
      // Credentials
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        return 'সব তথ্য পূরণ করতে হবে';
      }
      // Strict Email Validation (Gmail included in standard format)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return 'সঠিক ইমেইল এড্রেস দিন (যেমন: example@gmail.com)';
      }
      if (formData.password.length < 6) {
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'পাসওয়ার্ড দুটি মিলছে না';
      }
    }
    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSignup = async () => {
    const errorMsg = validateStep(3);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${location.origin}/dashboard`,
          data: {
            full_name: formData.name,
            name: formData.name,
            role: 'Student',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Create User Profile
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender || null,
          institute: formData.institute,
          stream: formData.stream,
          division: formData.group, // Mapping group -> division
          batch: formData.batch,
          role: 'Student',
          status: 'Active',
          subscription: {
            plan: 'Free',
            expiry: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: 'Active',
          },
          xp: 0,
          level: 'Beginner',
          examsTaken: 0,
          enrolledExams: 0,
          lastActive: new Date().toISOString(),
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw here if auth succeeded, just log it.
          // The auth trigger might have handled it, or we can handle it on dashboard.
          toast.error(
            'প্রোফাইল তৈরিতে সমস্যা হয়েছে, তবে অ্যাকাউন্ট তৈরি হয়েছে।',
            {
              description: profileError.message,
            },
          );
        }

        // If Auto-Confirm is enabled in Supabase, we get a session immediately.
        if (data.session) {
          router.push('/dashboard');
          return;
        }

        setSuccess(true);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Signup Error:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl text-center border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            অ্যাকাউন্ট তৈরি সফল!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন লগইন করুন।
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3.5 px-6 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER STEPS ---

  // Progress Bar
  const renderProgress = () => (
    <div className="flex items-center justify-center mb-8 gap-3">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step >= s
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 scale-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 scale-90'
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-1 rounded-full mx-2 transition-all duration-500 ${
                step > s ? 'bg-rose-600' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans max-md:pt-20">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-10">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              মাত্র ৩টি ধাপে সম্পন্ন করুন আপনার রেজিস্ট্রেশন
            </p>
          </div>

          {renderProgress()}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-6">
            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    আপনার নাম
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="পূর্ণ নাম (Full Name)"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    ফোন নাম্বার
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    লিঙ্গ (Gender)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                          formData.gender === g
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {g === 'Male' ? 'পুরুষ' : 'মহিলা'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC INFO (Was Step 3) */}
            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    শিক্ষা প্রতিষ্ঠান
                  </label>
                  <div className="relative group">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                      type="text"
                      name="institute"
                      value={formData.institute}
                      onChange={handleChange}
                      placeholder="কলেজ / স্কুলের নাম"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      বিভাগ (Group)
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        name="group"
                        value={formData.group}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200 appearance-none cursor-pointer"
                      >
                        <option value="Science">Science</option>
                        <option value="Business Studies">
                          Business Studies
                        </option>
                        <option value="Humanities">Humanities</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      ব্যাচ
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200 appearance-none cursor-pointer"
                      >
                        <option>HSC 2024</option>
                        <option>HSC 2025</option>
                        <option>HSC 2026</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CREDENTIALS & GOOGLE (Was Step 1) */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      ইমেইল এড্রেস
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      পাসওয়ার্ড
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      পাসওয়ার্ড নিশ্চিত করুন
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="পাসওয়ার্ডটি আবার লিখুন"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-4 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-14 items-center justify-center flex rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <button
                type="button"
                onClick={step === 3 ? handleSignup : handleNext}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    অপেক্ষা করুন...
                  </>
                ) : step === 3 ? (
                  'অ্যাকাউন্ট তৈরি করুন'
                ) : (
                  <>
                    পরবর্তী ধাপ <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              আগেই অ্যাকাউন্ট আছে?{' '}
              <Link
                href="/login"
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
