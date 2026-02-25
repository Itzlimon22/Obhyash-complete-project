'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AppLayout from '@/components/student/ui/layout/AppLayout';
import { UserProfile } from '@/lib/types';

interface ReferralInfo {
  referral?: { code: string } | null;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (storedTheme) setTheme(storedTheme);

      const storedUser = localStorage.getItem('obhyash_user_profile');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      } else {
        // Fallback fetch if not in local storage
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
              .then(({ data }) => {
                if (data) setUser(data);
              });
          }
        });
      }
    }

    fetch('/api/referral/me')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [supabase]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleTabChange = (tab: string) => {
    // Save intended tab for the SPA, then route to dashboard
    sessionStorage.setItem('obhyash_active_tab', tab);
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('obhyash_active_tab');
    localStorage.removeItem('obhyash_user_profile');
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/');
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/referral/create', { method: 'POST' });
      const json = await res.json();
      if (json.referral) {
        setData((prev) => ({ ...prev, referral: json.referral }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout
      activeTab="profile" // keeping 'profile' so sidebar highlights correctly
      user={user || undefined}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      toggleTheme={toggleTheme}
      isDarkMode={theme === 'dark'}
      title="রেফারেল প্রোগ্রাম"
    >
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          রেফারেল প্রোগ্রাম
        </h1>

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 rounded-2xl">
          <p className="text-red-800 dark:text-red-200 font-medium">
            உங்கள் বন্ধুদের আমন্ত্রণ জানান। তারা আপনার রেফারেল কোড দিয়ে সাইন আপ
            করলে আপনার জন্য ১ মাসের বিনামূল্যে সাবস্ক্রিপশন যোগ করা হবে। (Invite
            your friends. When they sign up using your code, 1 month free
            subscription will be added for you.)
          </p>
        </div>

        {/* Referral Code Section */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-red-600 dark:text-red-400" />
              <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                আপনার রেফারেল কোড
              </span>
            </div>
            {data.referral?.code ? (
              <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-950 px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <code className="text-lg font-black text-red-600 dark:text-red-400 tracking-wider">
                  {data.referral.code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.referral!.code);
                    alert('কোড কপি করা হয়েছে!');
                  }}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-bold"
                >
                  কপি করুন
                </button>
              </div>
            ) : (
              <button
                onClick={generateCode}
                disabled={generating}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
              >
                {generating ? 'তৈরি হচ্ছে...' : 'নতুন কোড তৈরি করুন'}
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
              রিডিম্পশন ইতিহাস
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              কারা আপনার কোড ব্যবহার করেছে তার তালিকা
            </p>
          </div>

          <div className="p-0">
            {loading ? (
              <p className="text-neutral-500 dark:text-neutral-400 p-5 font-medium">
                হালনাগাদ হচ্ছে…
              </p>
            ) : data.history.length === 0 ? (
              <div className="p-10 text-center">
                <Gift className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  এখনও কোনো বন্ধু আপনার রেফারেল কোড ব্যবহার করেনি।
                </p>
              </div>
            ) : (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                    <th className="px-5 py-3 text-left text-sm font-bold text-neutral-600 dark:text-neutral-300">
                      তারিখ
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-bold text-neutral-600 dark:text-neutral-300">
                      ব্যবহারকারী
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {data.history.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {new Date(h.redeemed_at).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {h.redeemed_by.name || h.redeemed_by.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.setItem('obhyash_active_tab', 'profile');
            router.push('/dashboard');
          }}
          className="inline-flex items-center gap-2 mt-4 text-red-600 dark:text-red-400 font-bold hover:underline"
        >
          ← প্রোফাইলে ফিরে যান
        </button>
      </div>
    </AppLayout>
  );
}
