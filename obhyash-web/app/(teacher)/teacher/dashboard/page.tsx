'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTeacherStats } from '@/services/stats-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  User,
  LayoutDashboard,
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
    <div className="relative bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden">
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-500/20">
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
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* ── Welcome Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-emerald-900/10 border border-emerald-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-emerald-100 text-xs font-bold mb-3 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                শিক্ষক প্যানেল
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
                স্বাগতম, {userName}! 👋
              </h1>
              <p className="text-emerald-100 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                আপনার ড্যাশবোর্ডে আপনাকে স্বাগতম। প্রশ্ন তৈরি করুন এবং
                শিক্ষার্থীদের অগ্রগতি পর্যবেক্ষণ করুন।
              </p>
            </div>
            <Link
              href="/teacher/questions/create"
              className="group flex items-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all text-sm md:text-base mr-auto md:mr-0"
            >
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              নতুন প্রশ্ন তৈরি করুন
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/50 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-3xl font-black">
                  {stats?.totalQuestions || 0}
                </p>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                  মোট প্রশ্ন
                </p>
              </div>
            </div>
            <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/50 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-3xl font-black">{stats?.approved || 0}</p>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                  অনুমোদিত
                </p>
              </div>
            </div>
            <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/50 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-3xl font-black">{stats?.pending || 0}</p>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                  অপেক্ষমান
                </p>
              </div>
            </div>
            <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/50 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <p className="text-3xl font-black text-white">
                  ৳{(stats?.approved || 0) * 10}
                </p>
                <p className="text-xs font-bold text-red-300 uppercase tracking-widest">
                  মোট আয়
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 px-2 mt-8 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-red-500" />
        কুইক অ্যাকশন
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/teacher/questions"
          className="group relative overflow-hidden bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            প্রশ্ন ব্যাংক
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            সকল প্রশ্ন দেখুন ও ম্যানেজ করুন
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </Link>

        <Link
          href="/teacher/questions/create"
          className="group relative overflow-hidden bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
            <PlusCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            নতুন প্রশ্ন
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            নতুন একটি প্রশ্ন যোগ করুন
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </Link>

        <Link
          href="/teacher/questions/bulk-upload"
          className="group relative overflow-hidden bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
            <Upload size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            বাল্ক আপলোড
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            একসাথে অনেক প্রশ্ন আপলোড করুন (CSV/JSON)
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </Link>

        <Link
          href="/teacher/profile"
          className="group relative overflow-hidden bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <User size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            প্রোফাইল
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            আপনার তথ্য আপডেট করুন
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </Link>
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
          <div className="flex gap-3 p-4 rounded-xl bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-400 mb-0.5">
                বাল্ক আপলোড ব্যবহার করুন
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-400/70 leading-relaxed">
                একসাথে অনেক প্রশ্ন আপলোড করতে JSON/CSV ফাইল ব্যবহার করুন।
                টেমপ্লেট ডাউনলোড করে কাজ শুরু করুন।
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-0.5">
                গুণগত মান বজায় রাখুন
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 leading-relaxed">
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
