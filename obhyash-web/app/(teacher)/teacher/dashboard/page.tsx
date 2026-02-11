'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Fixed import path
import { getTeacherStats } from '@/services/stats-service';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Loader2,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
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
        // Using email as author identifier as per plan
        const data = await getTeacherStats(user.email!);
        setStats(data);
        setIsLoading(false);
      };
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  // Calculate generic payment metrics (placeholder logic)
  // Assuming 10 BDT per approved question
  const estimatedEarnings = (stats?.approved || 0) * 10;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          স্বাগতম, {user?.user_metadata?.name || 'শিক্ষক'}!
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          আপনার কন্ট্রিবিউশন এবং পারফরম্যান্স ওভারভিউ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={80} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {stats?.totalQuestions || 0}
            </p>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              মোট প্রশ্ন আপলোড
            </p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={80} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle size={24} />
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {stats?.approved || 0}
            </p>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              অনুমোদিত প্রশ্ন
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={80} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {stats?.pending || 0}
            </p>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              অপেক্ষমান প্রশ্ন
            </p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={80} className="text-rose-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {stats?.rejected || 0}
            </p>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
              বাতিলকৃত প্রশ্ন
            </p>
          </div>
        </div>
      </div>

      {/* Payment / Earnings Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 opacity-90">
              <TrendingUp size={20} />
              <span className="font-medium text-sm uppercase tracking-wider">
                Estimated Earnings
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-1">
              BDT {estimatedEarnings.toLocaleString()}
            </h2>
            <p className="text-indigo-200 text-sm">
              Based on {stats?.approved || 0} approved questions
            </p>

            <div className="mt-8 pt-6 border-t border-indigo-500/30 flex gap-6">
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold">
                  Rate per Question
                </p>
                <p className="text-lg font-bold">BDT 10</p>
              </div>
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold">
                  Payment Status
                </p>
                <p className="text-lg font-bold text-emerald-300">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity or Notifications Placeholder */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            সাম্প্রতিক নির্দেশনা
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                <span className="font-bold text-rose-600">গুরুত্বপূর্ণ:</span>{' '}
                প্রশ্ন আপলোড করার সময় সঠিক অধ্যায় এবং টপিক নির্বাচন করুন।
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                <span className="font-bold text-emerald-600">টিপস:</span>{' '}
                ব্যাখ্যার জন্য ছবি যুক্ত করলে প্রশ্নের গুণগত মান বৃদ্ধি পায়।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
