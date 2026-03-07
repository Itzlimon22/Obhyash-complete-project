'use client';

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Bell,
  Monitor,
  Moon,
  Sun,
  Lock,
  Smartphone,
  Mail,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

type TabId = 'general' | 'security' | 'notifications';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            সেটিংস
          </h1>
          <div className="h-1 w-12 bg-red-600 rounded-full mt-2"></div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-red-500/30 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-70 active:scale-95"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} strokeWidth={3} />
          )}
          সেভ করো
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto no-scrollbar scroll-smooth bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="flex min-w-full sm:min-w-0 px-2 sm:px-6">
            {[
              { id: 'general', label: 'সাধারণ', icon: Monitor },
              { id: 'security', label: 'নিরাপত্তা', icon: Shield },
              { id: 'notifications', label: 'নোটিফিকেশন', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-3 px-8 py-6 text-xs font-black uppercase tracking-widest transition-all relative truncate whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
              >
                <tab.icon
                  size={18}
                  strokeWidth={activeTab === tab.id ? 3 : 2}
                />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-6 right-6 h-1 bg-red-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-10">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-6 ml-1">
                  থিম ও ডিজাইন
                </h3>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-[2rem] p-6 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <div className="flex items-center gap-5">
                    <div
                      className={`p-4 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-neutral-900 text-red-400 shadow-red-900/20' : 'bg-white text-red-600 shadow-neutral-200'}`}
                    >
                      {isDarkMode ? (
                        <Moon size={24} strokeWidth={3} />
                      ) : (
                        <Sun size={24} strokeWidth={3} />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-neutral-900 dark:text-white text-base">
                        ডার্ক মোড
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mt-1">
                        চোখের আরামের জন্য ব্যবহার করো
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer active:scale-90 transition-transform">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => toggleTheme(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-6 ml-1">
                  ভাষা ও অঞ্চল
                </h3>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">
                        ব্যবহারযোগ্য ভাষা
                      </label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all appearance-none cursor-pointer">
                        <option>বাংলা (Bengali)</option>
                        <option>English (US)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">
                        সময় অঞ্চল (Timezone)
                      </label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all appearance-none cursor-pointer">
                        <option>ঢাকা (GMT+6)</option>
                        <option>UTC (Coordinated Universal Time)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="space-y-6">
                <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-6 ml-1">
                  পাসওয়ার্ড পরিবর্তন
                </h3>
                <div className="grid gap-6 bg-neutral-50 dark:bg-neutral-800/50 p-6 sm:p-8 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 shadow-sm">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">
                      বর্তমান পাসওয়ার্ড
                    </label>
                    <div className="relative group">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors"
                      />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">
                        নতুন পাসওয়ার্ড
                      </label>
                      <div className="relative group">
                        <Lock
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors"
                        />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">
                        নিশ্চিত করো
                      </label>
                      <div className="relative group">
                        <Lock
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors"
                        />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <button className="text-xs font-black text-red-600 uppercase tracking-widest hover:text-red-700 text-left w-fit ml-1 active:scale-95 transition-all">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-6 ml-1">
                  অতিরিক্ত নিরাপত্তা (2FA)
                </h3>
                <div className="bg-red-50 dark:bg-neutral-800/50 rounded-[2rem] p-6 border border-red-100 dark:border-neutral-800 flex items-center justify-between group transition-all hover:bg-red-100 dark:hover:bg-neutral-800">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-transform group-hover:scale-110">
                      <Smartphone size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-black text-neutral-900 dark:text-white text-base">
                        অথেনটিকেটর অ্যাপ
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mt-1">
                        TOTP (Google Auth, Authy) ব্যবহার করো
                      </p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-all active:scale-95 shadow-sm">
                    সেটআপ
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 ml-1">
                  <span className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl">
                    <Mail size={18} strokeWidth={3} />
                  </span>
                  ইমেইল নোটিফিকেশন
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: 'নতুন ইউজার সাইনআপ',
                      desc: 'নতুন কোনো ইউজার আমাদের সিস্টেমে যুক্ত হলে নোটিফিকেশন পাবেন।',
                    },
                    {
                      label: 'পেমেন্ট রিকোয়েস্ট প্রাপ্তি',
                      desc: 'কোনো শিক্ষার্থী পেমেন্ট পাঠালে আপনাকে জানানো হবে।',
                    },
                    {
                      label: 'সিস্টেম আপডেট',
                      desc: 'সিস্টেমের গুরুত্বপূর্ণ পরিবর্তন এবং মেইনটেন্যাও্স অ্যালার্ট।',
                    },
                    {
                      label: 'সাপ্তাহিক রিপোর্ট',
                      desc: 'পুরো সপ্তাহের কাজের একটি সংক্ষিপ্ত রিপোর্ট ইমেইলে পাবেন।',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 group"
                    >
                      <div className="flex-1 pr-6">
                        <p className="text-sm font-black text-neutral-900 dark:text-white leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer active:scale-90 transition-transform">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6.5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
