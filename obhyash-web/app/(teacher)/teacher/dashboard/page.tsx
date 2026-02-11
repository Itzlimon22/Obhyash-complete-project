'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTeacherStats } from '@/services/stats-service';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Loader2,
  Upload,
  PlusCircle,
  FileQuestion,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  BookOpen,
  Zap,
  Calendar,
} from 'lucide-react';

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Progress ring component
function ProgressRing({
  percentage,
  size = 100,
  strokeWidth = 8,
  color = '#10b981',
  bgColor = '#e5e7eb',
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  bgGlow,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  bgGlow?: string;
  trend?: string;
}) {
  const animatedValue = useAnimatedCounter(value);
  return (
    <div className="relative bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 group overflow-hidden">
      {bgGlow && (
        <div
          className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity blur-2xl ${bgGlow}`}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}
          >
            <Icon size={20} className={iconColor} />
          </div>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <p className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums">
          {animatedValue}
        </p>
        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalQuestions: number;
    approved: number;
    pending: number;
    rejected: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      const fetchStats = async () => {
        setIsLoading(true);
        const data = await getTeacherStats(user.email!);
        setStats(data);
        setIsLoading(false);
      };
      fetchStats();
    }
  }, [user]);

  const approvalRate = useMemo(() => {
    if (!stats || stats.totalQuestions === 0) return 0;
    return Math.round((stats.approved / stats.totalQuestions) * 100);
  }, [stats]);

  const estimatedEarnings = (stats?.approved || 0) * 10;
  const userName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'শিক্ষক';

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'সুপ্রভাত' : hour < 17 ? 'শুভ দুপুর' : 'শুভ সন্ধ্যা';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-500/20">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
        <p className="text-sm font-bold text-neutral-400 animate-pulse">
          ড্যাশবোর্ড লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Welcome Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">
                {greeting} 👋
              </p>
              <h1 className="text-2xl md:text-3xl font-black mb-2">
                {userName}
              </h1>
              <p className="text-emerald-100 text-sm max-w-lg">
                আপনার কন্ট্রিবিউশনের মাধ্যমে শিক্ষার্থীদের সফলতায় সহায়তা করুন।
                আপনার প্রতিটি প্রশ্ন একটি শিক্ষার্থীকে সাফল্যের দিকে এগিয়ে
                নেয়।
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <Calendar size={16} className="text-emerald-200" />
              <span className="text-sm font-bold text-emerald-50">
                {new Date().toLocaleDateString('bn-BD', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={FileText}
          label="মোট প্রশ্ন"
          value={stats?.totalQuestions || 0}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
          bgGlow="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="অনুমোদিত"
          value={stats?.approved || 0}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          bgGlow="bg-emerald-500"
        />
        <StatCard
          icon={Clock}
          label="অপেক্ষমান"
          value={stats?.pending || 0}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
          bgGlow="bg-amber-500"
        />
        <StatCard
          icon={AlertCircle}
          label="বাতিলকৃত"
          value={stats?.rejected || 0}
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-600 dark:text-rose-400"
          bgGlow="bg-rose-500"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => router.push('/teacher/question-management')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all group text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              বাল্ক আপলোড
            </p>
            <p className="text-[11px] text-neutral-400 font-medium">
              CSV/JSON থেকে প্রশ্ন আপলোড
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
          />
        </button>

        <button
          onClick={() => router.push('/teacher/question-management')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/5 transition-all group text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              নতুন প্রশ্ন তৈরি
            </p>
            <p className="text-[11px] text-neutral-400 font-medium">
              একটি প্রশ্ন ম্যানুয়ালি তৈরি
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-neutral-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
          />
        </button>

        <button
          onClick={() => router.push('/teacher/question-management')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md hover:shadow-violet-500/5 transition-all group text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileQuestion size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              প্রশ্ন ব্যাংক দেখুন
            </p>
            <p className="text-[11px] text-neutral-400 font-medium">
              আপনার সকল প্রশ্ন ব্রাউজ
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-neutral-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all"
          />
        </button>
      </div>

      {/* ── Bottom Row: Earnings + Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Earnings Card - 3 columns */}
        <div className="lg:col-span-3 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4">
              <DollarSign size={140} strokeWidth={1} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="font-black text-sm uppercase tracking-wider text-indigo-200">
                  আনুমানিক আয়
                </span>
                <span className="block text-[10px] text-indigo-300 font-medium">
                  Estimated Earnings
                </span>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black mb-1 tabular-nums">
              ৳{estimatedEarnings.toLocaleString('bn-BD')}
            </h2>
            <p className="text-indigo-200 text-sm mb-6">
              {stats?.approved || 0}টি অনুমোদিত প্রশ্নের ভিত্তিতে
            </p>

            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/15">
              <div>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-black mb-1">
                  প্রতি প্রশ্ন
                </p>
                <p className="text-lg font-black">৳১০</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-black mb-1">
                  পেমেন্ট স্ট্যাটাস
                </p>
                <p className="text-lg font-black text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  সক্রিয়
                </p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-black mb-1">
                  সফলতার হার
                </p>
                <p className="text-lg font-black">{approvalRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Ring - 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col items-center justify-center">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-5">
            অনুমোদনের হার
          </h3>
          <div className="relative">
            <ProgressRing
              percentage={approvalRate}
              size={140}
              strokeWidth={10}
              color={
                approvalRate >= 80
                  ? '#10b981'
                  : approvalRate >= 50
                    ? '#f59e0b'
                    : '#ef4444'
              }
              bgColor="rgba(0,0,0,0.05)"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-neutral-900 dark:text-white">
                {approvalRate}%
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Approval
              </span>
            </div>
          </div>
          <div className="mt-5 w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  অনুমোদিত
                </span>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {stats?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  অপেক্ষমান
                </span>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {stats?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  বাতিলকৃত
                </span>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {stats?.rejected || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Guidelines ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-emerald-600" />
          <h3 className="text-base font-black text-neutral-900 dark:text-white">
            নির্দেশনা ও টিপস
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-0.5">
                সঠিক অধ্যায় নির্বাচন করুন
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
                প্রশ্ন আপলোড করার সময় সঠিক বিষয়, অধ্যায় এবং টপিক নির্বাচন
                করুন যাতে শিক্ষার্থীরা সহজে খুঁজে পায়।
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-0.5">
                ব্যাখ্যা যোগ করুন
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 leading-relaxed">
                প্রতিটি প্রশ্নের সাথে বিস্তারিত ব্যাখ্যা এবং ছবি যুক্ত করলে
                অনুমোদনের সম্ভাবনা বৃদ্ধি পায়।
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-0.5">
                বাল্ক আপলোড ব্যবহার করুন
              </p>
              <p className="text-xs text-blue-700/80 dark:text-blue-400/70 leading-relaxed">
                একসাথে অনেক প্রশ্ন আপলোড করতে JSON/CSV ফাইল ব্যবহার করুন।
                টেমপ্লেট ডাউনলোড করে কাজ শুরু করুন।
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 rounded-xl bg-violet-50/60 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-800 dark:text-violet-400 mb-0.5">
                গুণগত মান বজায় রাখুন
              </p>
              <p className="text-xs text-violet-700/80 dark:text-violet-400/70 leading-relaxed">
                প্রশ্নের ভাষা পরিষ্কার রাখুন, সঠিক উত্তর যাচাই করুন এবং
                প্রাসঙ্গিক ট্যাগ যোগ করুন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
