'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getCanonicalCollegeName } from '@/lib/college-mapping';
import { Logo } from './ui';
import Identify, { isPhone, isEmail, normalizeToEn } from './steps/Identify';
import Password from './steps/Password';
import Otp from './steps/Otp';
import Academic from './steps/Academic';
import NameInstitution from './steps/NameInstitution';
import Gender from './steps/Gender';
import Profile from './steps/Profile';
import NewPassword from './steps/NewPassword';
import Success from './steps/Success';
import Batch from './steps/Batch';

type Step =
  | 'identify'
  | 'password'
  | 'reg-otp'
  | 'academic'
  | 'batch'
  | 'name'
  | 'gender'
  | 'profile'
  | 'reg-done'
  | 'forgot-otp'
  | 'new-password'
  | 'reset-done'
  | 'logged-in';

interface AuthFlowProps {
  defaultMode?: 'login' | 'register';
  initialIdentifier?: string;
}

export default function AuthFlow({ defaultMode = 'login', initialIdentifier = '' }: AuthFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextParam = searchParams.get('next') || '/dashboard';

  const [step, setStep] = useState<Step>('identify');
  const [id, setId] = useState(initialIdentifier);
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [name, setName] = useState('');
  const [academicData, setAcademicData] = useState<{ level: string; group: string }>({ level: 'এইচএসসি', group: 'বিজ্ঞান' });
  const [batch, setBatch] = useState('HSC 2026');
  const [institution, setInstitution] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // Handle URL errors (e.g. from Google OAuth cancellation)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'unregistered_google') {
      alert('এই গুগল অ্যাকাউন্ট দিয়ে কোনো প্রোফাইল পাওয়া যায়নি। আবার চেষ্টা করো।');
    }
  }, [searchParams]);

  const showFooter = ['identify', 'password', 'reg-otp', 'forgot-otp'].includes(step);
  const showLogo = !['reg-otp', 'academic', 'batch', 'name', 'gender', 'profile', 'reg-done'].includes(step);
  const home = () => setStep('identify');

  // Check if identifier exists in Supabase
  const handleIdentifyNext = async (rawInput: string) => {
    const clean = normalizeToEn(rawInput);
    setId(clean);

    let cleanPhone = '';
    let cleanEmail = '';

    if (isPhone(clean)) {
      const digits = clean.replace(/\D/g, '');
      if (digits.startsWith('8801') && digits.length === 13) {
        cleanPhone = digits.substring(2);
      } else if (digits.startsWith('1') && digits.length === 10) {
        cleanPhone = '0' + digits;
      } else {
        cleanPhone = digits;
      }
    } else {
      cleanEmail = clean.toLowerCase();
    }

    try {
      let exists = false;
      let targetAuthEmail = '';

      if (cleanPhone) {
        const { data: userRows } = await supabase
          .from('users')
          .select('id, email, phone')
          .or(`phone.eq.${cleanPhone},phone.eq.+88${cleanPhone},phone.eq.88${cleanPhone}`)
          .limit(1);

        if (userRows && userRows.length > 0) {
          exists = true;
          targetAuthEmail = userRows[0].email || `${cleanPhone}@user.obhyash.com`;
        }
      } else if (cleanEmail) {
        const { data: userRows } = await supabase
          .from('users')
          .select('id, email, phone')
          .ilike('email', cleanEmail)
          .limit(1);

        if (userRows && userRows.length > 0) {
          exists = true;
          targetAuthEmail = userRows[0].email || cleanEmail;
        }
      }

      if (exists) {
        setResolvedEmail(targetAuthEmail);
        setStep('password');
      } else {
        // New user -> Start registration steps!
        setStep('academic');
      }
    } catch (err) {
      console.error('User lookup error:', err);
      // Fallback to password or academic
      setStep('academic');
    }
  };

  // Password Login
  const handlePasswordSubmit = async (password: string, currentId?: string) => {
    try {
      let target = resolvedEmail;
      const activeId = currentId ? normalizeToEn(currentId) : id;
      if (currentId && currentId !== id) {
        setId(activeId);
        target = '';
      }

      if (!target) {
        if (isPhone(activeId)) {
          const cleanPhone = activeId.replace(/\D/g, '');
          const normPhone =
            cleanPhone.length === 10
              ? '0' + cleanPhone
              : cleanPhone.startsWith('8801')
              ? cleanPhone.substring(2)
              : cleanPhone;
          const { data: userRows } = await supabase
            .from('users')
            .select('id, email, phone')
            .or(`phone.eq.${normPhone},phone.eq.+88${normPhone},phone.eq.88${normPhone}`)
            .limit(1);
          target = userRows?.[0]?.email || `${normPhone}@user.obhyash.com`;
        } else {
          target = activeId.toLowerCase().trim();
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: target,
        password,
      });

      if (error) {
        return { success: false, error: 'পাসওয়ার্ড ভুল হয়েছে। সঠিক পাসওয়ার্ড দাও।' };
      }

      if (data?.user) {
        setStep('logged-in');
        router.refresh();
        setTimeout(() => {
          router.push(nextParam);
        }, 600);
        return { success: true };
      }

      return { success: false, error: 'লগইন সম্পন্ন করা যায়নি।' };
    } catch {
      return { success: false, error: 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করো।' };
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  // Final Registration Submission
  const handleRegistrationSubmit = async ({ password, secondaryId }: { password: string; secondaryId: string }) => {
    try {
      const isPhoneId = isPhone(id);
      const rawPhone = isPhoneId ? id : secondaryId;
      const rawEmail = isPhoneId ? secondaryId : id;

      const digits = rawPhone.replace(/\D/g, '');
      const normalizedPhone =
        digits.length === 10
          ? '0' + digits
          : digits.startsWith('8801')
          ? digits.substring(2)
          : digits;
      const email = rawEmail.toLowerCase().trim();
      const canonicalCollege = getCanonicalCollegeName(institution.trim()) || institution.trim() || 'অন্যান্য প্রতিষ্ঠান';
      const streamVal = academicData.level === 'এইচএসসি' ? 'HSC' : 'SSC';
      let batchVal = streamVal === 'HSC' ? 'HSC 2026' : 'SSC 2026';
      if (batch) {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        let yr = batch.replace(/\D/g, '');
        for (let i = 0; i < 10; i++) {
          yr = yr.split(bnDigits[i]).join(i.toString());
        }
        batchVal = `${streamVal} ${yr || '2026'}`;
      }


      const groupMap: Record<string, string> = {
        'বিজ্ঞান': 'Science',
        'ব্যবসায় শিক্ষা': 'Business Studies',
        'ব্যবসায় শিক্ষা': 'Business Studies',
        'মানবিক': 'Humanities',
      };
      const groupVal = groupMap[academicData.group] || 'Science';

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
            phone: normalizedPhone,
            role: 'Student',
            stream: streamVal,
            batch: batchVal,
            division: groupVal,
            institute: canonicalCollege,
            gender: gender === 'male' ? 'Male' : 'Female',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          return { success: false, error: 'এই মোবাইল অথবা ইমেইল দিয়ে ইতোমধ্যে একাউন্ট খোলা আছে। লগইন করো।' };
        }
        return { success: false, error: signUpError.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' };
      }

      if (signUpData?.user) {
        // Ensure sign in session
        let session = signUpData.session;
        if (!session) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
            if (signInData?.session) {
              session = signInData.session;
            }
          } catch {
            // ignore
          }
        }

        // Complete profile via server-side Admin API (upserts users table, sets role cache cookie)
        try {
          await fetch('/api/auth/complete-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              userId: signUpData.user.id,
              profileData: {
                name: name.trim(),
                phone: normalizedPhone,
                gender: gender === 'male' ? 'Male' : 'Female',
                institute: canonicalCollege,
                stream: streamVal,
                group: groupVal,
                batch: batchVal,
                examTarget: 'Engineering',
              },
              password,
            }),
          });
        } catch (apiErr) {
          console.warn('complete-profile API call warning:', apiErr);
        }

        // Fallback client-side direct upsert into public.users
        try {
          await supabase.from('users').upsert(
            {
              id: signUpData.user.id,
              email,
              name: name.trim(),
              phone: normalizedPhone,
              gender: gender === 'male' ? 'Male' : 'Female',
              institute: canonicalCollege,
              stream: streamVal,
              division: groupVal,
              batch: batchVal,
              role: 'Student',
              status: 'Active',
            },
            { onConflict: 'id' }
          );
        } catch (dbErr) {
          console.warn('Direct user upsert fallback:', dbErr);
        }

        router.refresh();
        setStep('reg-done');
        return { success: true };
      }

      return { success: false, error: 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' };
    } catch {
      return { success: false, error: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।' };
    }
  };

  // Forgot password OTP request
  const handleForgotOtpDone = async (code: string) => {
    // In demo / Supabase OTP flow:
    if (code.length === 6) {
      setStep('new-password');
      return { success: true };
    }
    return { success: false, error: 'সঠিক কোড দাও' };
  };

  // Reset password
  const handleResetPassword = async (newPw: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        return { success: false, error: error.message };
      }
      setStep('reset-done');
      return { success: true };
    } catch {
      return { success: false, error: 'পাসওয়ার্ড পরিবর্তন করা যায়নি।' };
    }
  };

  const view = (() => {
    switch (step) {
      case 'identify':
        return (
          <Identify
            initial={id}
            onNext={handleIdentifyNext}
            onGoogleLogin={handleGoogleLogin}
          />
        );
      case 'password':
        return (
          <Password
            id={id}
            onBack={home}
            onForgot={() => {
              // OTP is temporarily inactive; redirect to password recovery page
              router.push(`/forgot-password?identifier=${encodeURIComponent(id)}`);
            }}
            onDone={handlePasswordSubmit}
            onGoogleLogin={handleGoogleLogin}
          />
        );
      case 'reg-otp':
        return (
          <Otp
            id={id}
            title="কোড যাচাই করো"
            onBack={home}
            onDone={async (c) => {
              if (c.length === 6) {
                setStep('academic');
                return { success: true };
              }
              return { success: false, error: 'কোডটি সঠিক নয়' };
            }}
          />
        );
      case 'academic':
        return (
          <Academic
            onBack={home}
            onDone={(a) => {
              setAcademicData(a);
              setStep('batch');
            }}
          />
        );
      case 'batch':
        return (
          <Batch
            stream={academicData.level}
            onBack={() => setStep('academic')}
            onDone={(b) => {
              setBatch(b);
              setStep('name');
            }}
          />
        );
      case 'name':
        return (
          <NameInstitution
            onBack={() => setStep('batch')}
            onDone={(a) => {
              setName(a.name);
              setInstitution(a.institution);
              setStep('gender');
            }}
          />
        );
      case 'gender':
        return (
          <Gender
            onBack={() => setStep('name')}
            onDone={(g) => {
              setGender(g);
              setStep('profile');
            }}
          />
        );
      case 'profile':
        return (
          <Profile
            id={id}
            onBack={() => setStep('gender')}
            onEditId={() => setStep('identify')}
            onDone={handleRegistrationSubmit}
          />
        );
      case 'reg-done':
        return (
          <Success
            title={`স্বাগতম, ${name || 'শিক্ষার্থী'}!`}
            sub="তোমার অ্যাকাউন্ট তৈরি হয়েছে। চলো শেখা শুরু করি।"
            cta="শেখা শুরু করো"
            onCta={() => {
              router.refresh();
              router.push(nextParam);
            }}
          />
        );
      case 'forgot-otp':
        return (
          <Otp
            id={id}
            title="পাসওয়ার্ড রিসেট"
            onBack={() => setStep('password')}
            onDone={handleForgotOtpDone}
          />
        );
      case 'new-password':
        return <NewPassword onDone={handleResetPassword} />;
      case 'reset-done':
        return (
          <Success
            title="পাসওয়ার্ড পরিবর্তন হয়েছে"
            sub="নতুন পাসওয়ার্ড দিয়ে লগ ইন করো"
            cta="লগ ইন করো"
            onCta={() => setStep('password')}
          />
        );
      case 'logged-in':
        return (
          <Success
            title="লগ ইন সফল!"
            sub="তোমার ড্যাশবোর্ডে নিয়ে যাচ্ছি…"
            cta="ড্যাশবোর্ডে যাও"
            onCta={() => {
              router.push(nextParam);
            }}
          />
        );
    }
  })();

  return (
    <div className="min-h-[100dvh] bg-[#07080b] text-zinc-100 font-['Kalpurush',sans-serif] flex flex-col justify-between overflow-x-hidden">
      <main
        className={`mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 sm:px-5 py-3 sm:py-8 ${
          ['academic', 'batch', 'name', 'gender'].includes(step)
            ? 'justify-start pt-8 sm:pt-14'
            : 'justify-center'
        }`}
      >
        {showLogo && <Logo className="shrink-0" />}
        <div key={step} className={`animate-step w-full ${showLogo ? 'mt-3 sm:mt-8' : ''}`}>
          {view}
        </div>
        {showFooter && (
          <div className="mt-4 sm:mt-8 flex flex-col items-center shrink-0">
            <a
              href="/support"
              className="text-xs sm:text-sm text-zinc-400 transition hover:text-white"
            >
              সাপোর্ট লাগবে?
            </a>
            <nav className="mt-2.5 sm:mt-3 flex items-center gap-3 text-[11px] sm:text-xs text-zinc-600">
              <a href="/privacy-policy" className="hover:text-zinc-300">
                গোপনীয়তা নীতি
              </a>
              <span>·</span>
              <a href="/terms-and-conditions" className="hover:text-zinc-300">
                শর্তাবলী
              </a>
              <span>·</span>
              <a href="/about-us#faq" className="hover:text-zinc-300">
                সহায়তা
              </a>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
