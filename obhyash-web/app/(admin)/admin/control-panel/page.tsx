'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Radio,
  UserPlus,
  Smartphone,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  CameraOff,
  AlertOctagon,
  CreditCard,
  Trophy,
  Sliders,
  RefreshCw,
  Lock,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Check,
  Info,
  Globe,
  ExternalLink,
  Gift,
} from 'lucide-react';
import { AppConfig } from '@/components/admin/dashboard/system-controls-card';

export default function ControlPanelPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/system-controls');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
        if (data.data.updated_at) {
          setLastUpdated(new Date(data.data.updated_at).toLocaleTimeString('bn-BD'));
        }
      } else {
        setErrorMessage(data.error || 'কনফিগারেশন লোড করা সম্ভব হয়নি');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'নেটওয়ার্ক এরর');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggle = async (key: keyof AppConfig, value: any) => {
    if (!config) return;

    if (key === 'maintenance_mode' && value === true) {
      if (
        !confirm(
          '⚠️ সতর্কতা: আপনি কি নিশ্চিত যে পুরো প্ল্যাটফর্মে মেইনটেন্যান্স মোড চালু করতে চান? এর ফলে সাধারণ শিক্ষার্থীরা অ্যাপ বা ওয়েবসাইটে ঢুকতে পারবে না।',
        )
      ) {
        return;
      }
    }

    const updated = { ...config, [key]: value };
    setConfig(updated);
    await saveConfig(updated);
  };

  const saveConfig = async (payloadToSave?: AppConfig) => {
    const payload = payloadToSave || config;
    if (!payload) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/system-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setLastUpdated(new Date().toLocaleTimeString('bn-BD'));
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMessage(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'সার্ভার এরর');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          মাস্টার কন্ট্রোল প্যানেল লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
            {errorMessage || 'কনফিগারেশন পাওয়া যায়নি'}
          </h3>
          <button
            onClick={fetchConfig}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                কন্ট্রোল প্যানেল (Master Controls)
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                রিয়েলটাইম সচল
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
              প্ল্যাটফর্মের সকল জরুরি সুইচ, অ্যান্টি-চিট, নিরাপত্তা ও লাইভ কনফিগারেশন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lastUpdated && (
            <span className="text-[11px] text-neutral-400 dark:text-zinc-500 hidden md:inline">
              সর্বশেষ সিঙ্ক: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchConfig}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-zinc-800/80 hover:bg-neutral-200 text-neutral-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            রিলোড
          </button>
          <button
            onClick={() => saveConfig()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {saveSuccess ? 'সংরক্ষিত!' : 'সব পরিবর্তন সংরক্ষণ'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 size={16} />
          সকল সিস্টেম কন্ট্রোল সেটিংস ডাটাবেজে সংরক্ষিত হয়েছে এবং রিয়েলটাইমে সক্রিয় হয়েছে!
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300">
          <AlertTriangle size={16} />
          {errorMessage}
        </div>
      )}

      {/* ── Section 1: প্ল্যাটফর্ম জরুরি সুইচ (Platform Emergency Controls) ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ১. প্ল্যাটফর্ম জরুরি সুইচ (Emergency Switches)
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                সার্ভার রক্ষণাবেক্ষণ বা যেকোনো অনাকাঙ্ক্ষিত পরিস্থিতিতে ইনস্ট্যান্ট অ্যাকশন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Switch 1: Maintenance Mode */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              config.maintenance_mode
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800'
                : 'bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle
                    size={16}
                    className={config.maintenance_mode ? 'text-rose-600 animate-bounce' : 'text-slate-400'}
                  />
                  মেইনটেন্যান্স মোড
                </span>
                <input
                  type="checkbox"
                  checked={config.maintenance_mode || false}
                  onChange={(e) => handleToggle('maintenance_mode', e.target.checked)}
                  className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
                {config.maintenance_mode
                  ? '⚠️ প্ল্যাটফর্ম সাময়িকভাবে বন্ধ রয়েছে'
                  : 'প্ল্যাটফর্ম সচল এবং স্বাভাবিক রয়েছে'}
              </p>
            </div>
            {config.maintenance_mode && (
              <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900 space-y-1.5">
                <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                  শিক্ষার্থীদের জন্য বার্তা:
                </label>
                <textarea
                  rows={2}
                  value={config.maintenance_message || ''}
                  onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
                  onBlur={() => saveConfig(config)}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-neutral-800 dark:text-zinc-200 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Switch 2: Live Exams */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Radio
                  size={16}
                  className={config.live_exams_enabled ? 'text-amber-500 animate-pulse' : 'text-slate-400'}
                />
                লাইভ প্রতিযোগিতা
              </span>
              <input
                type="checkbox"
                checked={config.live_exams_enabled ?? true}
                onChange={(e) => handleToggle('live_exams_enabled', e.target.checked)}
                className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.live_exams_enabled ?? true
                ? 'শিক্ষার্থীরা নির্ধারিত সময়ে লাইভ পরীক্ষায় অংশ নিতে পারছে'
                : 'লাইভ পরীক্ষা স্থগিত রাখা হয়েছে'}
            </p>
          </div>

          {/* Switch 3: New Registrations */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <UserPlus size={16} className="text-blue-500" />
                নতুন রেজিস্ট্রেশন
              </span>
              <input
                type="checkbox"
                checked={config.registration_enabled ?? true}
                onChange={(e) => handleToggle('registration_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.registration_enabled ?? true
                ? 'নতুন শিক্ষার্থীরা অবাধে সাইন আপ করতে পারছে'
                : 'নতুন অ্যাকাউন্ট খোলা সাময়িক লক'}
            </p>
          </div>

          {/* Switch 4: Payment Gateways */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard
                  size={16}
                  className={config.payments_enabled ?? true ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'}
                />
                পেমেন্ট গেটওয়ে (বিকাশ/উদ্দোক্তাপেমেন্ট)
              </span>
              <input
                type="checkbox"
                checked={config.payments_enabled ?? true}
                onChange={(e) => handleToggle('payments_enabled', e.target.checked)}
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.payments_enabled ?? true
                ? 'পেমেন্ট গেটওয়ে ও সাবস্ক্রিপশন পারচেজ সচল'
                : 'পেমেন্ট বন্ধ (গেটওয়ে রক্ষণাবেক্ষণ চলছে নোটিশ)'}
            </p>
          </div>

          {/* Switch 5: Leaderboard */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Trophy
                  size={16}
                  className={config.leaderboard_enabled ?? true ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}
                />
                মেধা তালিকা (Leaderboard)
              </span>
              <input
                type="checkbox"
                checked={config.leaderboard_enabled ?? true}
                onChange={(e) => handleToggle('leaderboard_enabled', e.target.checked)}
                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.leaderboard_enabled ?? true
                ? 'শিক্ষার্থীদের কাছে মেধা তালিকা দৃশ্যমান'
                : 'মেধা তালিকা সাময়িক স্থগিত ও প্রচ্ছন্ন'}
            </p>
          </div>

          {/* Switch 6: Free Trial Access */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-500" />
                ফ্রি ট্রায়াল অ্যাক্সেস
              </span>
              <input
                type="checkbox"
                checked={config.free_trial_enabled ?? true}
                onChange={(e) => handleToggle('free_trial_enabled', e.target.checked)}
                className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.free_trial_enabled ?? true
                ? 'নতুন শিক্ষার্থীদের জন্য ফ্রি ট্রায়াল কার্যকর'
                : 'ফ্রি ট্রায়াল বন্ধ (শুধুমাত্র পেইড এক্সেস)'}
            </p>
          </div>

          {/* Switch 7: Referral System */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Gift
                  size={16}
                  className={config.referral_system_enabled ?? true ? 'text-emerald-500' : 'text-slate-400'}
                />
                রেফারেল সিস্টেম (Referral System)
              </span>
              <input
                type="checkbox"
                checked={config.referral_system_enabled ?? true}
                onChange={(e) => handleToggle('referral_system_enabled', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.referral_system_enabled ?? true
                ? 'রেফারেল কোড তৈরি, শেয়ার ও রিওয়ার্ড রিডেম্পশন পূর্ণ সক্রিয়'
                : 'রেফারেল সিস্টেম স্থগিত (কোড রিডেম্পশন সাময়িকভাবে বন্ধ)'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: নিরাপত্তা, অ্যান্টি-চিট ও অপব্যবহার রোধ ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ২. নিরাপত্তা, অ্যান্টি-চিট ও অপব্যবহার রোধ (Security & Anti-Abuse)
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                চরচা (Chorcha) স্ট্যান্ডার্ড প্রোডাকশন সিকিউরিটি — একাউন্ট শেয়ারিং, স্ক্রিনশট পাইরেসি ও নকল প্রতিরোধ
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Security 1: Single Device Session Lock */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldAlert
                  size={16}
                  className={config.single_device_login_enabled ?? true ? 'text-emerald-500' : 'text-slate-400'}
                />
                ক. সিঙ্গেল ডিভাইস লগইন লক
              </span>
              <input
                type="checkbox"
                checked={config.single_device_login_enabled ?? true}
                onChange={(e) => handleToggle('single_device_login_enabled', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.single_device_login_enabled ?? true
                ? 'নতুন ফোনে লগইন হওয়ামাত্র আগের সকল ফোন থেকে সাইলেন্ট অটো-লগআউট (একাউন্ট শেয়ারিং বন্ধ)'
                : 'একাধিক ডিভাইসে একই সময়ে ব্যবহারের অনুমতি সচল'}
            </p>
          </div>

          {/* Security 2: Anti-Piracy Screenshot Blocker */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CameraOff
                  size={16}
                  className={config.screenshot_protection_enabled ?? true ? 'text-indigo-500' : 'text-slate-400'}
                />
                খ. স্ক্রিনশট ও স্ক্রিন রেকর্ডিং ব্লকার
              </span>
              <input
                type="checkbox"
                checked={config.screenshot_protection_enabled ?? true}
                onChange={(e) => handleToggle('screenshot_protection_enabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.screenshot_protection_enabled ?? true
                ? 'Android FLAG_SECURE সক্রিয়: অ্যাপের কনটেন্ট স্ক্রিনশট ও স্ক্রিন রেকর্ড বন্ধ (কালো স্ক্রিন)'
                : 'স্ক্রিনশট গ্রহণ অনুমোদিত'}
            </p>
          </div>

          {/* Security 3: Live Exam Anti-Cheat Guard */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <AlertOctagon
                  size={16}
                  className={config.exam_anti_cheat_enabled ?? true ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}
                />
                গ. লাইভ এক্সামে নকল রোধ
              </span>
              <input
                type="checkbox"
                checked={config.exam_anti_cheat_enabled ?? true}
                onChange={(e) => handleToggle('exam_anti_cheat_enabled', e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              {config.exam_anti_cheat_enabled ?? true
                ? 'পরীক্ষায় অ্যাপ মিনিমাইজ করলে ২ বার ওয়ার্নিং, এরপর পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হবে'
                : 'ট্যাব সুইচ ট্র্যাকিং বন্ধ'}
            </p>
          </div>

          {/* Control: Max Tab Switches Allowed */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-amber-600" />
                সর্বোচ্চ অনুমোদিত ট্যাব পরিবর্তন
              </span>
              <select
                value={config.max_tab_switches_allowed ?? 2}
                onChange={(e) => handleToggle('max_tab_switches_allowed', parseInt(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-zinc-700 text-neutral-900 dark:text-white"
              >
                <option value={1}>১ বার (কঠোর)</option>
                <option value={2}>২ বার (ডিফল্ট/স্ট্যান্ডার্ড)</option>
                <option value={3}>৩ বার</option>
                <option value={5}>৫ বার (শিথিল)</option>
              </select>
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              শিক্ষার্থী {config.max_tab_switches_allowed ?? 2} বারের বেশি অ্যাপ থেকে বের হলে পরীক্ষা অটো সাবমিট হয়ে যাবে।
            </p>
          </div>

          {/* Control: Free Exam Daily Quota */}
          <div className="p-4 rounded-2xl border bg-neutral-50/60 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-teal-600 dark:text-teal-400" />
                ফ্রি ইউজার দৈনিক এক্সাম কোটা
              </span>
              <span className="text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                {config.max_free_exams_per_day ?? 5} টি
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="1"
                max="20"
                value={config.max_free_exams_per_day ?? 5}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const updated = { ...config, max_free_exams_per_day: val };
                  setConfig(updated);
                }}
                onMouseUp={() => saveConfig(config)}
                onTouchEnd={() => saveConfig(config)}
                className="w-full h-2 bg-neutral-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-2">
              নন-প্রো শিক্ষার্থীরা দিনে সর্বোচ্চ {config.max_free_exams_per_day ?? 5} টি পরীক্ষা দিতে পারবে। কোটা শেষ হলে প্রো সাবস্ক্রিপশন পপআপ আসবে।
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 3: ভার্সন কন্ট্রোল ও মোবাইল ফোর্স আপডেট ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ৩. মোবাইল ভার্সন কন্ট্রোল ও ফোর্স আপডেট (Mobile App Version Control)
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                প্লে স্টোরে নতুন ভার্সন এলে পুরোনো ভার্সন ব্যবহারকারীদের আপডেট বাধ্য করা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300">ফোর্স আপডেট:</span>
            <input
              type="checkbox"
              checked={config.force_update || false}
              onChange={(e) => handleToggle('force_update', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              মিনিমাম প্রয়োজনীয় ভার্সন (Min Version)
            </label>
            <input
              type="text"
              value={config.min_app_version || '1.0.0'}
              onChange={(e) => setConfig({ ...config, min_app_version: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="1.0.0"
              className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <p className="text-[10px] text-neutral-400">এর নিচের ভার্সনের অ্যাপ ব্লক হয়ে আপডেট স্ক্রিন দেখাবে</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              সর্বশেষ ভার্সন (Latest Version)
            </label>
            <input
              type="text"
              value={config.latest_app_version || '1.0.0'}
              onChange={(e) => setConfig({ ...config, latest_app_version: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="1.0.0"
              className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <p className="text-[10px] text-neutral-400">প্লে স্টোরের বর্তমান রিলিজ ভার্সন</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
              গুগল প্লে স্টোর লিঙ্ক (Update URL)
            </label>
            <input
              type="text"
              value={config.update_url || ''}
              onChange={(e) => setConfig({ ...config, update_url: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="https://play.google.com/store/apps/details?id=com.obhyash.app"
              className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <p className="text-[10px] text-neutral-400">আপডেট বাটনে ট্যাপ করলে এই লিঙ্কে যাবে</p>
          </div>
        </div>
      </div>

      {/* ── Section 4: গ্লোবাল ইন-অ্যাপ ব্রডকাস্ট ব্যানার ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ৪. গ্লোবাল ইন-অ্যাপ ব্রডকাস্ট ব্যানার (Live Announcement Broadcaster)
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                সকল শিক্ষার্থীর অ্যাপের হোমস্ক্রিনে তাৎক্ষণিক জরুরি বার্তা, নোটিশ বা অফার পাঠানো
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300">ব্যানার প্রদর্শন:</span>
            <input
              type="checkbox"
              checked={config.global_announcement_enabled || false}
              onChange={(e) => handleToggle('global_announcement_enabled', e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">বার্তার ধরণ</label>
            <select
              value={config.global_announcement_type || 'info'}
              onChange={(e) => handleToggle('global_announcement_type', e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 font-semibold text-neutral-900 dark:text-white"
            >
              <option value="info">তথ্যমূলক (Info - নীল)</option>
              <option value="warning">সতর্কবার্তা (Warning - হলুদ)</option>
              <option value="danger">জরুরি / বিপদ (Danger - লাল)</option>
              <option value="success">সুসংবাদ / অফার (Success - সবুজ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">টার্গেট অডিয়েন্স</label>
            <select
              value={config.global_announcement_target || 'all'}
              onChange={(e) => handleToggle('global_announcement_target', e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 font-semibold text-neutral-900 dark:text-white"
            >
              <option value="all">সকল শিক্ষার্থী (All Users)</option>
              <option value="hsc">শুধুমাত্র HSC ব্যাচ</option>
              <option value="ssc">শুধুমাত্র SSC ব্যাচ</option>
              <option value="admission">শুধুমাত্র এডমিশন ব্যাচ</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">নোটিশের টেক্সট</label>
          <textarea
            rows={3}
            value={config.global_announcement_text || ''}
            onChange={(e) => setConfig({ ...config, global_announcement_text: e.target.value })}
            onBlur={() => saveConfig(config)}
            placeholder="উদাহরণ: আজ রাত ৯টায় এইচএসসি পূর্ণাঙ্গ লাইভ মডেল টেস্ট অনুষ্ঠিত হবে। সবাইকে যথাসময়ে উপস্থিত থাকার অনুরোধ করা হচ্ছে।"
            className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
          />
        </div>

        {/* Live Preview */}
        {config.global_announcement_enabled && config.global_announcement_text && (
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
              অ্যাপে যেভাবে লাইভ ব্যানার দেখাবে (Live Preview):
            </span>
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                config.global_announcement_type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                  : config.global_announcement_type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200'
                  : config.global_announcement_type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 text-blue-900 dark:text-blue-200'
              }`}
            >
              <Megaphone size={18} className="shrink-0 animate-bounce" />
              <p className="text-xs font-semibold leading-relaxed flex-1">
                {config.global_announcement_text}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-white/70 dark:bg-black/40">
                {config.global_announcement_target}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
