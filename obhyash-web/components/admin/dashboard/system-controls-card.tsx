'use client';

import React, { useState } from 'react';
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
  BellRing,
} from 'lucide-react';

export interface AppConfig {
  maintenance_mode?: boolean;
  maintenance_message?: string;
  live_exams_enabled?: boolean;
  registration_enabled?: boolean;
  free_trial_enabled?: boolean;
  min_app_version?: string;
  latest_app_version?: string;
  force_update?: boolean;
  global_announcement_enabled?: boolean;
  global_announcement_text?: string;
  global_announcement_type?: string;
  global_announcement_target?: string;
}

interface SystemControlsCardProps {
  initialConfig: AppConfig;
  onUpdate?: () => void;
}

export function SystemControlsCard({
  initialConfig,
  onUpdate,
}: SystemControlsCardProps) {
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggle = async (key: keyof AppConfig, value: boolean) => {
    if (key === 'maintenance_mode' && value === true) {
      if (
        !confirm(
          '⚠️ সতর্কতা: আপনি কি নিশ্চিত যে মেইনটেন্যান্স মোড চালু করতে চান? এর ফলে সাধারণ শিক্ষার্থীরা অ্যাপ বা ওয়েব ব্যবহার করতে পারবে না।',
        )
      ) {
        return;
      }
    }

    const updated = { ...config, [key]: value };
    setConfig(updated);
    await saveConfig(updated);
  };

  const saveConfig = async (newConfig: AppConfig) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/system-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onUpdate?.();
      } else {
        alert('Failed to update system controls.');
      }
    } catch (e) {
      alert('Error updating system controls: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
              মাস্টার প্ল্যাটফর্ম কন্ট্রোলার (Master Controls)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              অ্যাপের জরুরি সুইচ, গ্লোবাল নোটিশ ও ভার্সন কন্ট্রোল সিস্টেম
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 size={14} /> সেটিংস সংরক্ষিত হয়েছে
          </span>
        )}
      </div>

      {/* 4 Emergency Switches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Switch 1: Maintenance Mode */}
        <div
          className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            config.maintenance_mode
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800'
              : 'bg-neutral-50/70 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-700/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle
                size={14}
                className={config.maintenance_mode ? 'text-rose-600 animate-bounce' : 'text-slate-400'}
              />
              মেইনটেন্যান্স মোড
            </span>
            <input
              type="checkbox"
              checked={config.maintenance_mode || false}
              onChange={(e) => handleToggle('maintenance_mode', e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
            {config.maintenance_mode
              ? '🚨 সম্পূর্ণ প্ল্যাটফর্মে রক্ষণাবেক্ষণ নোটিশ সক্রিয় রয়েছে'
              : 'প্ল্যাটফর্ম সচল ও অনলাইন'}
          </p>
        </div>

        {/* Switch 2: Live Exams */}
        <div className="p-4 rounded-xl border bg-neutral-50/70 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Radio
                size={14}
                className={config.live_exams_enabled ? 'text-amber-500 animate-pulse' : 'text-slate-400'}
              />
              লাইভ প্রতিযোগিতা
            </span>
            <input
              type="checkbox"
              checked={config.live_exams_enabled ?? true}
              onChange={(e) => handleToggle('live_exams_enabled', e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
            {config.live_exams_enabled ? 'শিক্ষার্থীরা লাইভ এক্সামে অংশ নিতে পারছে' : 'লাইভ এক্সাম সাময়িক বন্ধ'}
          </p>
        </div>

        {/* Switch 3: New Registrations */}
        <div className="p-4 rounded-xl border bg-neutral-50/70 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <UserPlus size={14} className="text-blue-500" />
              নতুন রেজিস্ট্রেশন
            </span>
            <input
              type="checkbox"
              checked={config.registration_enabled ?? true}
              onChange={(e) => handleToggle('registration_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
            {config.registration_enabled ? 'নতুন শিক্ষার্থীরা সাইন আপ করতে পারবে' : 'নতুন সাইন আপ সাময়িক লক'}
          </p>
        </div>

        {/* Switch 4: Mobile Force Update */}
        <div className="p-4 rounded-xl border bg-neutral-50/70 dark:bg-zinc-800/30 border-neutral-200/80 dark:border-zinc-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Smartphone size={14} className="text-purple-500" />
              ফোর্স আপডেট (v{config.min_app_version || '1.0.0'})
            </span>
            <input
              type="checkbox"
              checked={config.force_update || false}
              onChange={(e) => handleToggle('force_update', e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
            {config.force_update ? 'পুরোনো অ্যাপ ভার্সনে আপডেট স্ক্রিন দেখাবে' : 'স্বাভাবিক আপডেট পরামর্শ'}
          </p>
        </div>
      </div>

      {/* ── Global In-App Announcement Broadcaster ── */}
      <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <Megaphone size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>গ্লোবাল ইন-অ্যাপ ব্রডকাস্ট ব্যানার (Live Announcement)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700 dark:text-zinc-300">
            <span>ব্যানার প্রদর্শন:</span>
            <input
              type="checkbox"
              checked={config.global_announcement_enabled || false}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  global_announcement_enabled: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="যেমন: আজ রাত ৯টায় ফিজিক্স লাইভ এক্সাম অনুষ্ঠিত হবে! সকল পরীক্ষার্থীদের প্রস্তুত থাকার অনুরোধ..."
            value={config.global_announcement_text || ''}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                global_announcement_text: e.target.value,
              }))
            }
            className="flex-1 px-4 py-2 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
          />

          <select
            value={config.global_announcement_type || 'info'}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                global_announcement_type: e.target.value,
              }))
            }
            className="px-3 py-2 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl outline-none font-semibold text-neutral-800 dark:text-zinc-200"
          >
            <option value="info">ℹ️ তথ্যমূলক (Info)</option>
            <option value="warning">⚠️ সতর্কতা (Warning)</option>
            <option value="success">🎉 সুখবর (Success)</option>
            <option value="danger">🚨 জরুরি (Alert)</option>
          </select>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => saveConfig(config)}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> সংরক্ষণে...
              </>
            ) : (
              <>
                <Save size={14} /> ব্রডকাস্ট প্রকাশ করুন
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
