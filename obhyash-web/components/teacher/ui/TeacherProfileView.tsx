'use client';

import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Edit3,
  Award,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import Link from 'next/link';

interface TeacherProfileViewProps {
  user: UserProfile;
  stats?: {
    totalQuestions: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

const cardClass =
  'bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden';
const headerClass =
  'px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2';
const headerTitleClass =
  'text-base font-bold text-neutral-800 dark:text-neutral-100';
const bodyClass = 'p-6';

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 break-words">
        {value || '—'}
      </p>
    </div>
  </div>
);

export default function TeacherProfileView({
  user,
  stats,
}: TeacherProfileViewProps) {
  const teacherData = user as any;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const approvalRate =
    stats && stats.totalQuestions > 0
      ? Math.round((stats.approved / stats.totalQuestions) * 100)
      : 0;

  const estimatedEarnings = (stats?.approved || 0) * 10;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24 animate-in fade-in duration-300">
      {/* ── Profile Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <UserAvatar
              user={user}
              size="2xl"
              showBorder
              className="ring-4 ring-emerald-500/30"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 border-2 border-emerald-900 flex items-center justify-center shadow-lg">
              <Shield size={12} className="text-white" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black mb-2 truncate text-white">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full bg-emerald-700/50 backdrop-blur-sm border border-emerald-600/30 text-emerald-100 text-xs font-bold">
                👨‍🏫 শিক্ষক
              </span>
              {user.institute && (
                <span className="px-3 py-1 rounded-full bg-emerald-700/50 backdrop-blur-sm border border-emerald-600/30 text-emerald-100 text-xs font-bold truncate max-w-[200px]">
                  🏫 {user.institute}
                </span>
              )}
            </div>
          </div>

          <Link
            href="/teacher/settings"
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex-shrink-0"
          >
            <Edit3 size={14} />
            এডিট প্রোফাইল
          </Link>
        </div>
      </div>

      {/* ── Contribution Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
              <FileText
                size={18}
                className="text-emerald-700 dark:text-emerald-400"
              />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {stats.totalQuestions}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              মোট প্রশ্ন
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
              <CheckCircle
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {stats.approved}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              অনুমোদিত
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
              <Clock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {stats.pending}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              অপেক্ষমান
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-2">
              <AlertCircle
                size={18}
                className="text-rose-600 dark:text-rose-400"
              />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {stats.rejected}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              বাতিলকৃত
            </p>
          </div>
        </div>
      )}

      {/* ── Earnings Summary ── */}
      {stats && stats.approved > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-6 text-white shadow-lg shadow-rose-600/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4">
              <Award size={100} strokeWidth={1} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-1">
              আনুমানিক আয়
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-1 tabular-nums">
              ৳{estimatedEarnings.toLocaleString('bn-BD')}
            </h2>
            <p className="text-rose-100 text-sm">
              {stats.approved}টি অনুমোদিত প্রশ্ন × ৳১০ = মোট আয়
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div>
                <p className="text-rose-200 font-bold">অনুমোদনের হার</p>
                <p className="text-lg font-black">{approvalRate}%</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-rose-200 font-bold">প্রতি প্রশ্ন</p>
                <p className="text-lg font-black">৳১০</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Personal Info ── */}
      <div className={cardClass}>
        <div className={headerClass}>
          <User size={18} className="text-emerald-700 dark:text-emerald-500" />
          <h3 className={headerTitleClass}>ব্যক্তিগত তথ্য</h3>
        </div>
        <div className={bodyClass}>
          <InfoRow icon={User} label="নাম" value={user.name} />
          <InfoRow icon={Mail} label="ইমেইল" value={user.email} />
          <InfoRow icon={Phone} label="ফোন" value={user.phone} />
          <InfoRow icon={Calendar} label="জন্ম তারিখ" value={user.dob} />
          <InfoRow icon={User} label="লিঙ্গ" value={user.gender} />
          <InfoRow icon={MapPin} label="ঠিকানা" value={user.address} />
        </div>
      </div>

      {/* ── Professional Info ── */}
      <div className={cardClass}>
        <div className={headerClass}>
          <Briefcase
            size={18}
            className="text-emerald-700 dark:text-emerald-500"
          />
          <h3 className={headerTitleClass}>পেশাগত তথ্য</h3>
        </div>
        <div className={bodyClass}>
          <InfoRow
            icon={Building2}
            label="শিক্ষা প্রতিষ্ঠান"
            value={user.institute}
          />
        </div>
      </div>

      {/* ── Bio ── */}
      {teacherData.bio && (
        <div className={cardClass}>
          <div className={headerClass}>
            <User
              size={18}
              className="text-emerald-700 dark:text-emerald-500"
            />
            <h3 className={headerTitleClass}>সংক্ষিপ্ত পরিচিতি</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {teacherData.bio}
            </p>
          </div>
        </div>
      )}

      {/* ── Account Info ── */}
      <div className={cardClass}>
        <div className={headerClass}>
          <Shield
            size={18}
            className="text-emerald-700 dark:text-emerald-500"
          />
          <h3 className={headerTitleClass}>অ্যাকাউন্ট তথ্য</h3>
        </div>
        <div className={bodyClass}>
          <InfoRow icon={Calendar} label="যোগদানের তারিখ" value={joinDate} />
          <InfoRow icon={Shield} label="ভূমিকা" value="শিক্ষক (Teacher)" />
        </div>
      </div>
    </div>
  );
}
