'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  SlidersHorizontal,
  Sparkles,
  Check,
  Gift,
  Zap,
  FileCheck,
  Phone,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppConfig } from '@/components/admin/dashboard/system-controls-card';

// ── MODERN FIGMA/IOS INTERACTIVE SWITCH PILL ──
interface ModernSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'pink' | 'lime';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({
  checked,
  onChange,
  disabled,
  color = 'emerald',
  label,
  size = 'md',
}) => {
  const colorClasses = {
    emerald: checked
      ? 'bg-emerald-500 shadow-emerald-500/25 ring-2 ring-emerald-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    rose: checked
      ? 'bg-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    amber: checked
      ? 'bg-amber-500 shadow-amber-500/25 ring-2 ring-amber-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    blue: checked
      ? 'bg-blue-600 shadow-blue-500/25 ring-2 ring-blue-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    purple: checked
      ? 'bg-purple-600 shadow-purple-500/25 ring-2 ring-purple-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    pink: checked
      ? 'bg-pink-600 shadow-pink-500/25 ring-2 ring-pink-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
    lime: checked
      ? 'bg-[#c6f634] text-slate-950 shadow-lime-500/30 ring-2 ring-lime-500/20'
      : 'bg-slate-200 dark:bg-zinc-800',
  };

  const dimensions = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8',
  };

  const thumbDimensions = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const thumbTranslate = {
    sm: checked ? 'translate-x-4' : 'translate-x-1',
    md: checked ? 'translate-x-6' : 'translate-x-1',
    lg: checked ? 'translate-x-7' : 'translate-x-1',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center shrink-0 ${dimensions[size]} rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/30 ${colorClasses[color]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
      }`}
      title={label || (checked ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)')}
    >
      <span
        className={`inline-block ${thumbDimensions[size]} transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-md ${thumbTranslate[size]}`}
      />
    </button>
  );
};

const SYSTEM_CONTROLS_CACHE_KEY = 'obhyash_admin_system_controls_cache_v1';

export default function ControlPanelPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('all');

  // Instant SWR Hydration
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SYSTEM_CONTROLS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setConfig(parsed);
          setInitialConfig(parsed);
          setIsLoading(false);
        }
      }
    } catch (_) {}
  }, []);

  const fetchConfig = useCallback(async () => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/system-controls');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
        setInitialConfig(data.data);
        try {
          sessionStorage.setItem(SYSTEM_CONTROLS_CACHE_KEY, JSON.stringify(data.data));
        } catch (_) {}
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

  // Track if text/slider changes are pending save
  const hasUnsavedChanges = useMemo(() => {
    if (!config || !initialConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

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
        setInitialConfig(payload);
        try {
          sessionStorage.setItem(SYSTEM_CONTROLS_CACHE_KEY, JSON.stringify(payload));
        } catch (_) {}
        setLastUpdated(new Date().toLocaleTimeString('bn-BD'));
        toast.success('সকল সিস্টেম কন্ট্রোল সেটিংস ডাটাবেজে সংরক্ষিত ও কার্যকর হয়েছে');
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMessage(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
        toast.error(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'সার্ভার এরর');
      toast.error(err.message || 'সার্ভার এরর');
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (id === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
          মাস্টার কন্ট্রোল প্যানেল লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center space-y-4 shadow-card">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">
            {errorMessage || 'কনফিগারেশন পাওয়া যায়নি'}
          </h3>
          <button
            onClick={fetchConfig}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 transition shadow-sm cursor-pointer"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-28 px-2 sm:px-4 transition-colors">
      
      {/* ── 1. TOP UTILITY ACTION BAR & QUICK JUMP PILLS ── */}
      <div className="flex flex-col gap-3.5 bg-white/90 dark:bg-[#151515]/90 backdrop-blur-md border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  মাস্টার কনফিগারেশন হাব
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  রিয়েল-টাইম সিঙ্ক
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
                {lastUpdated ? `সর্বশেষ ডাটাবেজ আপডেট: ${lastUpdated}` : 'সব কন্ট্রোল ক্লাউড এজ সার্ভারের সাথে সিঙ্কড'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={fetchConfig}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs border border-slate-200/60 dark:border-zinc-700/60"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>রিলোড</span>
            </button>
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4.5 py-2 bg-[#12544F] hover:bg-[#0E423E] text-white rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              <span>{saveSuccess ? 'সংরক্ষিত!' : 'সব পরিবর্তন সংরক্ষণ'}</span>
            </button>
          </div>
        </div>

        {/* Section Quick Jump Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs font-bold">
          {[
            { id: 'all', label: 'সব কন্ট্রোল' },
            { id: 'sec-emergency', label: '১. জরুরি সুইচ' },
            { id: 'sec-payments', label: '২. পেমেন্ট মেথড' },
            { id: 'sec-security', label: '৩. নিরাপত্তা ও অ্যান্টি-চিট' },
            { id: 'sec-version', label: '৪. ভার্সন কন্ট্রোল' },
            { id: 'sec-broadcast', label: '৫. ব্রডকাস্ট নোটিশ' },
            { id: 'sec-promo', label: '৬. প্রমো ব্যানার' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeSection === item.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. SPECIAL SAFETY GUARDIAN: MAINTENANCE MODE KILL SWITCH ── */}
      <div
        className={`p-6 rounded-3xl border transition-all duration-300 shadow-card ${
          config.maintenance_mode
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 ring-2 ring-rose-500/20'
            : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-900 border-emerald-500/30 dark:border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 shadow-xs ${
                config.maintenance_mode
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {config.maintenance_mode ? (
                <AlertOctagon size={26} />
              ) : (
                <ShieldCheck size={26} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                  মেইনটেন্যান্স মোড (Platform Kill Switch)
                </h3>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    config.maintenance_mode
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {config.maintenance_mode ? '• অফলাইন / সক্রিয়' : '• সিস্টেম অনলাইন'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {config.maintenance_mode
                  ? 'সতর্কতা: পুরো প্ল্যাটফর্ম শিক্ষার্থীদের জন্য বন্ধ রয়েছে। শুধুমাত্র অ্যাডমিনরা অ্যাক্সেস করতে পারছে।'
                  : 'প্ল্যাটফর্ম সচল এবং স্বাভাবিক রয়েছে। জরুরি ডেটাবেজ মাইগ্রেশন বা সার্ভার ডাউনটাইম ব্যতিত এটি অন করবেন না।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {config.maintenance_mode ? 'মেইনটেন্যান্স চালু' : 'মেইনটেন্যান্স বন্ধ'}
            </span>
            <ModernSwitch
              checked={config.maintenance_mode || false}
              onChange={(checked) => handleToggle('maintenance_mode', checked)}
              color="rose"
              size="lg"
            />
          </div>
        </div>

        {/* Live Message Input when Maintenance is Active */}
        {config.maintenance_mode && (
          <div className="mt-5 pt-4 border-t border-rose-200 dark:border-rose-900/60 space-y-2">
            <label className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <Megaphone size={14} />
              শিক্ষার্থীদের স্ক্রিনে প্রদর্শিত রক্ষণাবেক্ষণ বার্তা:
            </label>
            <textarea
              rows={2}
              value={config.maintenance_message || ''}
              onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="সার্ভার রক্ষণাবেক্ষণ চলছে। শীঘ্রই ফিরছি..."
              className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed shadow-xs"
            />
          </div>
        )}
      </div>

      {/* ── 3. SECTION 1: PLATFORM EMERGENCY CONTROLS (BENTO GRID) ── */}
      <div
        id="sec-emergency"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              ১. প্ল্যাটফর্ম জরুরি সুইচ (Emergency Switches)
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400">
              এক ক্লিকে প্ল্যাটফর্মের মূল ফিচারগুলো নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card: Live Exams */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Radio size={17} className={config.live_exams_enabled ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    লাইভ প্রতিযোগিতা
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {config.live_exams_enabled ?? true ? 'সক্রিয় • Live' : 'স্থগিত • Paused'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.live_exams_enabled ?? true}
                onChange={(checked) => handleToggle('live_exams_enabled', checked)}
                color="amber"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.live_exams_enabled ?? true
                ? 'শিক্ষার্থীরা নির্ধারিত সময়ে লাইভ পরীক্ষায় অংশ নিতে পারছে'
                : 'লাইভ পরীক্ষা স্থগিত রাখা হয়েছে'}
            </p>
          </div>

          {/* Card: New Registrations */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <UserPlus size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    নতুন রেজিস্ট্রেশন
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {config.registration_enabled ?? true ? 'উন্মুক্ত • Open' : 'লক • Locked'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.registration_enabled ?? true}
                onChange={(checked) => handleToggle('registration_enabled', checked)}
                color="blue"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.registration_enabled ?? true
                ? 'নতুন শিক্ষার্থীরা অবাধে সাইন আপ করতে পারছে'
                : 'নতুন অ্যাকাউন্ট খোলা সাময়িক লক করা রয়েছে'}
            </p>
          </div>

          {/* Card: Payment Gateways */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <CreditCard size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    পেমেন্ট গেটওয়ে
                  </h4>
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                    {config.payments_enabled ?? true ? 'সচল • Online' : 'রক্ষণাবেক্ষণ • Off'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.payments_enabled ?? true}
                onChange={(checked) => handleToggle('payments_enabled', checked)}
                color="pink"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.payments_enabled ?? true
                ? 'পেমেন্ট গেটওয়ে ও সাবস্ক্রিপশন পারচেজ সচল'
                : 'পেমেন্ট বন্ধ (রক্ষণাবেক্ষণ চলছে নোটিশ প্রদর্শিত হবে)'}
            </p>
          </div>

          {/* Card: Leaderboard */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Trophy size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    মেধা তালিকা (Leaderboard)
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {config.leaderboard_enabled ?? true ? 'দৃশ্যমান • Visible' : 'প্রচ্ছন্ন • Hidden'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.leaderboard_enabled ?? true}
                onChange={(checked) => handleToggle('leaderboard_enabled', checked)}
                color="amber"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.leaderboard_enabled ?? true
                ? 'শিক্ষার্থীদের কাছে মেধা তালিকা দৃশ্যমান'
                : 'মেধা তালিকা সাময়িক স্থগিত ও প্রচ্ছন্ন'}
            </p>
          </div>

          {/* Card: Free Trial */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    ফ্রি ট্রায়াল অ্যাক্সেস
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    {config.free_trial_enabled ?? true ? 'সক্রিয় • Active' : 'শুধুমাত্র পেইড'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.free_trial_enabled ?? true}
                onChange={(checked) => handleToggle('free_trial_enabled', checked)}
                color="emerald"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.free_trial_enabled ?? true
                ? 'নতুন শিক্ষার্থীদের জন্য ফ্রি ট্রায়াল কার্যকর'
                : 'ফ্রি ট্রায়াল বন্ধ (শুধুমাত্র পেইড এক্সেস)'}
            </p>
          </div>

          {/* Card: Referral System */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Gift size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    রেফারেল সিস্টেম
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {config.referral_system_enabled ?? true ? 'সক্রিয় • Live' : 'স্থগিত • Paused'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.referral_system_enabled ?? true}
                onChange={(checked) => handleToggle('referral_system_enabled', checked)}
                color="emerald"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.referral_system_enabled ?? true
                ? 'রেফারেল কোড তৈরি, শেয়ার ও রিওয়ার্ড রিডেম্পশন পূর্ণ সক্রিয়'
                : 'রেফারেল সিস্টেম স্থগিত (কোড রিডেম্পশন সাময়িকভাবে বন্ধ)'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. SECTION 2: PAYMENT METHODS & GATEWAYS ── */}
      <div
        id="sec-payments"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="p-2 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              ২. পেমেন্ট মেথড ও গেটওয়ে নিয়ন্ত্রণ (Payment Methods Control)
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400">
              মোবাইল অ্যাপ ও ওয়েবের অটো, ম্যানুয়াল ও গুগল প্লে পেমেন্ট কনফিগারেশন
            </p>
          </div>
        </div>

        {/* Master Payment Gateway Banner */}
        <div
          className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            config.payments_enabled ?? true
              ? 'bg-gradient-to-r from-pink-500/10 to-transparent dark:from-pink-950/25 dark:to-zinc-900 border-pink-300 dark:border-pink-900/60'
              : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                পেমেন্ট সিস্টেম মাস্টার সুইচ (Master Gateway)
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  config.payments_enabled ?? true
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200'
                }`}
              >
                {config.payments_enabled ?? true ? 'সক্রিয় (Active)' : 'বন্ধ (Disabled)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {config.payments_enabled ?? true
                ? 'প্ল্যাটফর্মে পেমেন্ট সিস্টেম সম্পূর্ণরূপে চালু রয়েছে'
                : 'জরুরি রক্ষণাবেক্ষণে সকল পেমেন্ট মেথড একসাথে বন্ধ রয়েছে'}
            </p>
          </div>

          <ModernSwitch
            checked={config.payments_enabled ?? true}
            onChange={(checked) => handleToggle('payments_enabled', checked)}
            color="pink"
            size="lg"
          />
        </div>

        {/* 3 Granular Payment Method Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Method 1: Automatic */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Zap size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    অটোমেটিক পেমেন্ট
                  </h4>
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                    উদ্দোক্তাপেমেন্ট গেটওয়ে
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.payment_auto_enabled ?? true}
                onChange={(checked) => handleToggle('payment_auto_enabled', checked)}
                color="pink"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.payment_auto_enabled ?? true
                ? 'বিকাশ, নগদ, রকেট, কার্ড তাত্ক্ষণিক অটো-অ্যাক্টিভেশন সক্রিয়'
                : 'অটোমেটিক পেমেন্ট মেথড অ্যাপে প্রদর্শিত হবে না'}
            </p>
          </div>

          {/* Method 2: Manual */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileCheck size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    ম্যানুয়াল পেমেন্ট
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Send Money & TrxID
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.payment_manual_enabled ?? true}
                onChange={(checked) => handleToggle('payment_manual_enabled', checked)}
                color="emerald"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.payment_manual_enabled ?? true
                ? 'Send Money করে TrxID দিয়ে সাবমিশন ফর্ম চালু'
                : 'ম্যানুয়াল TrxID পেমেন্ট অপশনটি বন্ধ থাকবে'}
            </p>
          </div>

          {/* Method 3: Google Play */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Smartphone size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    গুগল ইন-অ্যাপ পারচেজ
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Play Store Billing
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.payment_google_play_enabled ?? false}
                onChange={(checked) => handleToggle('payment_google_play_enabled', checked)}
                color="blue"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.payment_google_play_enabled ?? false
                ? 'গুগল প্লে স্টোর অফিসিয়াল ডিজিটাল বিলিং চালু'
                : 'প্লে কনসোল রিভিউ চলাকালে বা টেস্ট অবস্থায় বিলিং বন্ধ'}
            </p>
          </div>
        </div>

        {/* Merchant Number Input */}
        <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Phone size={14} className="text-emerald-600 dark:text-emerald-400" />
              ম্যানুয়াল পেমেন্ট মার্চেন্ট নম্বর (Official Merchant / Personal Number):
            </label>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400">
              অ্যাপে শিক্ষার্থীরা &quot;কপি করুন&quot; বাটনে চাপলে এই নম্বরটি কপি হবে এবং নির্দেশিকাতে প্রদর্শিত হবে
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={config.manual_payment_merchant_number || '01749591456'}
              onChange={(e) => setConfig({ ...config, manual_payment_merchant_number: e.target.value })}
              className="w-44 px-3.5 py-2 text-sm font-mono font-bold rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
            <button
              onClick={() => saveConfig(config)}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              আপডেট
            </button>
          </div>
        </div>

        {/* Google Play Reviewer Shield */}
        <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <ShieldAlert size={14} className="text-blue-600 dark:text-blue-400" />
              গুগল রিভিউয়ার / টেস্টার ইমেইল গার্ড (Google Tester Shield):
            </label>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400">
              এই ইমেইলগুলো দিয়ে লগইন করলে ডাটাবেজে বিকাশ/নগদ অন থাকলেও অ্যাপ স্বয়ংক্রিয়ভাবে <strong>শুধুমাত্র Google Play Billing</strong> দেখাবে
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={
                config.reviewer_emails ||
                'tester@obhyash.com,review@obhyash.com,reviewer@obhyash.com,google@obhyash.com'
              }
              onChange={(e) => setConfig({ ...config, reviewer_emails: e.target.value })}
              className="w-72 px-3.5 py-2 text-xs font-mono rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <button
              onClick={() => saveConfig(config)}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              সেভ
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. SECTION 3: SECURITY, ANTI-CHEAT & ANTI-ABUSE ── */}
      <div
        id="sec-security"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              ৩. নিরাপত্তা, অ্যান্টি-চিট ও অপব্যবহার রোধ (Security & Anti-Abuse)
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400">
              চরচা (Chorcha) স্ট্যান্ডার্ড প্রোডাকশন সিকিউরিটি — একাউন্ট শেয়ারিং, স্ক্রিনশট পাইরেসি ও নকল প্রতিরোধ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Security 1: Single Device Session Lock */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldAlert size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    সিঙ্গেল ডিভাইস লগইন লক
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {config.single_device_login_enabled ?? true ? 'সক্রিয় • Locked' : 'শিথিল'}
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.single_device_login_enabled ?? true}
                onChange={(checked) => handleToggle('single_device_login_enabled', checked)}
                color="emerald"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.single_device_login_enabled ?? true
                ? 'নতুন ফোনে লগইন হওয়ামাত্র আগের সকল ফোন থেকে সাইলেন্ট অটো-লগআউট (একাউন্ট শেয়ারিং বন্ধ)'
                : 'একাধিক ডিভাইসে একই সময়ে ব্যবহারের অনুমতি সচল'}
            </p>
          </div>

          {/* Security 2: Anti-Piracy Screenshot Blocker */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <CameraOff size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    স্ক্রিনশট ব্লকার
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Android FLAG_SECURE
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.screenshot_protection_enabled ?? true}
                onChange={(checked) => handleToggle('screenshot_protection_enabled', checked)}
                color="purple"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.screenshot_protection_enabled ?? true
                ? 'Android FLAG_SECURE সক্রিয়: অ্যাপের কনটেন্ট স্ক্রিনশট ও স্ক্রিন রেকর্ড বন্ধ (কালো স্ক্রিন)'
                : 'স্ক্রিনশট গ্রহণ অনুমোদিত'}
            </p>
          </div>

          {/* Security 3: Live Exam Anti-Cheat Guard */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertOctagon size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    লাইভ এক্সামে নকল রোধ
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    অ্যান্টি-মিনিমাইজ গার্ড
                  </span>
                </div>
              </div>
              <ModernSwitch
                checked={config.exam_anti_cheat_enabled ?? true}
                onChange={(checked) => handleToggle('exam_anti_cheat_enabled', checked)}
                color="amber"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {config.exam_anti_cheat_enabled ?? true
                ? 'পরীক্ষায় অ্যাপ মিনিমাইজ করলে ২ বার ওয়ার্নিং, এরপর পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হবে'
                : 'ট্যাব সুইচ ট্র্যাকিং বন্ধ'}
            </p>
          </div>

          {/* Control: Max Tab Switches Allowed */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-amber-600 dark:text-amber-400" />
                সর্বোচ্চ ট্যাব পরিবর্তন
              </span>
              <select
                value={config.max_tab_switches_allowed ?? 2}
                onChange={(e) => handleToggle('max_tab_switches_allowed', parseInt(e.target.value))}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white outline-none cursor-pointer shadow-xs"
              >
                <option value={1}>১ বার (কঠোর)</option>
                <option value={2}>২ বার (স্ট্যান্ডার্ড)</option>
                <option value={3}>৩ বার</option>
                <option value={5}>৫ বার (শিথিল)</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              শিক্ষার্থী {config.max_tab_switches_allowed ?? 2} বারের বেশি অ্যাপ মিনিমাইজ করলে পরীক্ষা অটো-সাবমিট হয়ে যাবে।
            </p>
          </div>

          {/* Control: Free Exam Daily Quota */}
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between gap-3 shadow-xs md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-teal-600 dark:text-teal-400" />
                ফ্রি ইউজার দৈনিক এক্সাম কোটা
              </span>
              <span className="text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800/80">
                {config.max_free_exams_per_day ?? 5} টি পরীক্ষা / দিন
              </span>
            </div>
            <div className="space-y-1.5 mt-2">
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
                className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>১টি</span>
                <span>৫টি (ডিফল্ট)</span>
                <span>১০টি</span>
                <span>২০টি</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              নন-প্রো শিক্ষার্থীরা দিনে সর্বোচ্চ {config.max_free_exams_per_day ?? 5} টি পরীক্ষা দিতে পারবে। কোটা শেষ হলে প্রো সাবস্ক্রিপশন ডায়ালগ আসবে।
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. SECTION 4: VERSION CONTROL & FORCE UPDATE ── */}
      <div
        id="sec-version"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">
                ৪. মোবাইল ভার্সন কন্ট্রোল ও ফোর্স আপডেট (Mobile App Version Control)
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-400">
                প্লে স্টোরে নতুন ভার্সন এলে পুরোনো ভার্সন ব্যবহারকারীদের আপডেট বাধ্য করা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">ফোর্স আপডেট:</span>
            <ModernSwitch
              checked={config.force_update || false}
              onChange={(checked) => handleToggle('force_update', checked)}
              color="purple"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80">
            <label className="text-xs font-bold text-slate-900 dark:text-white">
              মিনিমাম প্রয়োজনীয় ভার্সন (Min Version)
            </label>
            <input
              type="text"
              value={config.min_app_version || '1.0.0'}
              onChange={(e) => setConfig({ ...config, min_app_version: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="1.0.0"
              className="w-full text-xs p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-xs"
            />
            <p className="text-[10px] text-slate-400">এর নিচের ভার্সনে অ্যাপ ওপেন করলে আপডেট স্ক্রিন আটকে থাকবে</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80">
            <label className="text-xs font-bold text-slate-900 dark:text-white">
              সর্বশেষ ভার্সন (Latest Version)
            </label>
            <input
              type="text"
              value={config.latest_app_version || '1.0.0'}
              onChange={(e) => setConfig({ ...config, latest_app_version: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="1.0.0"
              className="w-full text-xs p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-xs"
            />
            <p className="text-[10px] text-slate-400">গুগল প্লে স্টোরের বর্তমান অফিসিয়াল রিলিজ ভার্সন</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80">
            <label className="text-xs font-bold text-slate-900 dark:text-white">
              গুগল প্লে স্টোর লিঙ্ক (Update URL)
            </label>
            <input
              type="text"
              value={config.update_url || ''}
              onChange={(e) => setConfig({ ...config, update_url: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="https://play.google.com/store/apps/details?id=com.obhyash.app"
              className="w-full text-xs p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-xs"
            />
            <p className="text-[10px] text-slate-400">অ্যাপের &quot;আপডেট করুন&quot; বাটনে ট্যাপ করলে এই ইউআরএলে রিডাইরেক্ট হবে</p>
          </div>
        </div>
      </div>

      {/* ── 7. SECTION 5: LIVE BROADCAST ANNOUNCEMENT BANNER ── */}
      <div
        id="sec-broadcast"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">
                ৫. গ্লোবাল ইন-অ্যাপ ব্রডকাস্ট ব্যানার (Live Announcement Broadcaster)
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-400">
                সকল শিক্ষার্থীর অ্যাপের হোমস্ক্রিনে তাৎক্ষণিক জরুরি বার্তা, নোটিশ বা অফার পাঠানো
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">ব্যানার প্রদর্শন:</span>
            <ModernSwitch
              checked={config.global_announcement_enabled || false}
              onChange={(checked) => handleToggle('global_announcement_enabled', checked)}
              color="emerald"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white">বার্তার ধরণ</label>
            <select
              value={config.global_announcement_type || 'info'}
              onChange={(e) => handleToggle('global_announcement_type', e.target.value)}
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-semibold text-slate-900 dark:text-white outline-none cursor-pointer shadow-xs"
            >
              <option value="info">তথ্যমূলক (Info - নীল)</option>
              <option value="warning">সতর্কবার্তা (Warning - হলুদ)</option>
              <option value="danger">জরুরি / বিপদ (Danger - লাল)</option>
              <option value="success">সুসংবাদ / অফার (Success - সবুজ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white">টার্গেট অডিয়েন্স</label>
            <select
              value={config.global_announcement_target || 'all'}
              onChange={(e) => handleToggle('global_announcement_target', e.target.value)}
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-semibold text-slate-900 dark:text-white outline-none cursor-pointer shadow-xs"
            >
              <option value="all">সকল শিক্ষার্থী (All Users)</option>
              <option value="hsc">শুধুমাত্র HSC ব্যাচ</option>
              <option value="ssc">শুধুমাত্র SSC ব্যাচ</option>
              <option value="admission">শুধুমাত্র এডমিশন ব্যাচ</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900 dark:text-white">নোটিশের টেক্সট</label>
          <textarea
            rows={3}
            value={config.global_announcement_text || ''}
            onChange={(e) => setConfig({ ...config, global_announcement_text: e.target.value })}
            onBlur={() => saveConfig(config)}
            placeholder="উদাহরণ: আজ রাত ৯টায় এইচএসসি পূর্ণাঙ্গ লাইভ মডেল টেস্ট অনুষ্ঠিত হবে। সবাইকে যথাসময়ে উপস্থিত থাকার অনুরোধ করা হচ্ছে।"
            className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed shadow-xs"
          />
        </div>

        {/* Live Simulator Preview */}
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
            অ্যাপে যেভাবে লাইভ ব্যানার দেখাবে (Live Simulator):
          </span>
          {config.global_announcement_enabled && config.global_announcement_text ? (
            <div
              className={`p-4 rounded-3xl border flex items-center gap-3.5 shadow-sm transition-all animate-in fade-in ${
                config.global_announcement_type === 'warning'
                  ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : config.global_announcement_type === 'danger'
                  ? 'bg-rose-500/10 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : config.global_announcement_type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-blue-500/10 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="p-2 rounded-xl bg-white/80 dark:bg-black/40 shrink-0">
                <Megaphone size={16} />
              </div>
              <p className="text-xs font-bold leading-relaxed flex-1">
                {config.global_announcement_text}
              </p>
              <span className="text-[10px] px-2.5 py-1 rounded-xl font-black uppercase bg-white/80 dark:bg-black/50 tracking-wider">
                {config.global_announcement_target}
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
              ব্যানার বর্তমানে বন্ধ রয়েছে অথবা কোনো টেক্সট লেখা হয়নি
            </div>
          )}
        </div>
      </div>

      {/* ── 8. SECTION 6: FLOATING PROMO BANNER ── */}
      <div
        id="sec-promo"
        className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">
                ৬. প্রমোশনাল বটম ব্যানার (Floating Promo Banner)
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-400">
                মোবাইল অ্যাপের বটম নেভ বারের উপরে ডিসকাউন্ট, সাবস্ক্রিপশন অফার বা বোনাস প্রচার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">ব্যানার সক্রিয়:</span>
            <ModernSwitch
              checked={config.promo_banner_enabled ?? true}
              onChange={(checked) => handleToggle('promo_banner_enabled', checked)}
              color="amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white">অফার টাইপ</label>
            <select
              value={config.promo_banner_type || 'auto'}
              onChange={(e) => handleToggle('promo_banner_type', e.target.value)}
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-semibold text-slate-900 dark:text-white outline-none cursor-pointer shadow-xs"
            >
              <option value="auto">অটো (ফ্রিদের সাবস্ক্রিপশন, প্রোদের রেফারেল)</option>
              <option value="subscription">শুধুমাত্র সাবস্ক্রিপশন অফার</option>
              <option value="referral">শুধুমাত্র রেফারেল বোনাস</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white">ব্যানার টাইটেল (Title)</label>
            <input
              type="text"
              value={config.promo_banner_title || ''}
              onChange={(e) => setConfig({ ...config, promo_banner_title: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="ডিফল্ট: প্রো সাবস্ক্রিপশনে বিশেষ ছাড়!"
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white">সাবটাইটেল / অ্যাকশন টেক্সট</label>
            <input
              type="text"
              value={config.promo_banner_subtitle || ''}
              onChange={(e) => setConfig({ ...config, promo_banner_subtitle: e.target.value })}
              onBlur={() => saveConfig(config)}
              placeholder="ডিফল্ট: আনলক করতে ট্যাপ করো এখানে →"
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Live Replica Preview of Mobile Banner */}
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
            অ্যাপে যেভাবে বটম ব্যানার প্রদর্শিত হবে (Live App Preview):
          </span>
          <div className="p-4 rounded-3xl bg-[#092328] border border-amber-500/40 text-white flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
                <Gift size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-white">
                  {config.promo_banner_title || 'প্রো সাবস্ক্রিপশনে বিশেষ ছাড়!'}
                </p>
                <p className="text-[11px] text-zinc-300 font-medium">
                  {config.promo_banner_subtitle || 'আনলক করতে ট্যাপ করো এখানে →'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-[#c6f634] text-slate-950 text-xs font-black rounded-xl shadow-xs">
                ক্লেম করো
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 9. STICKY FLOATING CHANGE-TRACKER / SAVE BAR ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#c6f634] animate-ping" />
            <span>অসংরক্ষিত পরিবর্তন রয়েছে</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (initialConfig) setConfig(initialConfig);
              }}
              className="px-3 py-1 text-xs font-semibold rounded-full hover:bg-white/10 dark:hover:bg-slate-100 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#c6f634] hover:bg-[#b5e625] text-slate-950 text-xs font-black rounded-full transition active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
