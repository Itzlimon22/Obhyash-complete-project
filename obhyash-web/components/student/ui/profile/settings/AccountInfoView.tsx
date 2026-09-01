'use client';

import React, { useState } from 'react';
import {
  User,
  Hash,
  Mail,
  Phone,
  GraduationCap,
  School,
  KeyRound,
  Calendar,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import UserAvatar from '../../common/UserAvatar';

interface AccountInfoViewProps {
  user: UserProfile;
  onBack?: () => void;
}

export const AccountInfoView: React.FC<AccountInfoViewProps> = ({
  user,
  onBack,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const displayStudentId =
    (user as any)?.student_id ||
    (user as any)?.displayStudentId ||
    (user.id ? `OBH-${user.id.slice(0, 5).toUpperCase()}` : 'N/A');

  const copySingle = (label: string, value: string, key: string) => {
    if (!value || value === 'N/A') return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${label} কপি করা হয়েছে!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAll = () => {
    const lines = [
      '📋 Obhyash Account Info:',
      `• Student ID: ${displayStudentId}`,
      `• User Name: ${user.name || 'N/A'}`,
    ];
    if (user.email) lines.push(`• Email: ${user.email}`);
    if (user.phone) lines.push(`• Phone: ${user.phone}`);
    if (user.stream) {
      lines.push(
        `• Stream: ${user.stream}${user.batch ? ` (${user.batch})` : ''}`
      );
    }
    if (user.institute) lines.push(`• Institute: ${user.institute}`);
    if (user.target) lines.push(`• Target: ${user.target}`);
    lines.push(`• System UUID: ${user.id || 'N/A'}`);

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('সব অ্যাকাউন্ট ইনফো কপি করা হয়েছে!');
  };

  const infoRows = [
    {
      key: 'name',
      label: 'User Name',
      bengaliLabel: 'ব্যবহারকারীর নাম',
      value: user.name || 'শিক্ষার্থী',
      icon: User,
      iconBg: 'bg-[#0D9488]',
      isMonospace: false,
      showCopy: true,
    },
    {
      key: 'userId',
      label: 'User ID (Student ID)',
      bengaliLabel: 'স্টুডেন্ট আইডি',
      value: displayStudentId,
      icon: Hash,
      iconBg: 'bg-[#0D9488]',
      isMonospace: true,
      showCopy: true,
    },
    ...(user.email
      ? [
          {
            key: 'email',
            label: 'Email',
            bengaliLabel: 'ইমেইল',
            value: user.email,
            icon: Mail,
            iconBg: 'bg-[#0D9488]',
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
    ...(user.phone
      ? [
          {
            key: 'phone',
            label: 'Phone',
            bengaliLabel: 'ফোন নম্বর',
            value: user.phone,
            icon: Phone,
            iconBg: 'bg-[#0D9488]',
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
    ...(user.stream
      ? [
          {
            key: 'stream',
            label: 'Stream & Batch',
            bengaliLabel: 'বিভাগ ও ব্যাচ',
            value: `${user.stream}${user.batch ? ` (${user.batch})` : ''}`,
            icon: GraduationCap,
            iconBg: 'bg-[#0D9488]',
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
    ...(user.institute
      ? [
          {
            key: 'institute',
            label: 'Institute',
            bengaliLabel: 'শিক্ষা প্রতিষ্ঠান',
            value: user.institute,
            icon: School,
            iconBg: 'bg-[#0D9488]',
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
    ...(user.target
      ? [
          {
            key: 'target',
            label: 'Target',
            bengaliLabel: 'টার্গেট',
            value: user.target,
            icon: Target,
            iconBg: 'bg-[#0D9488]',
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
    {
      key: 'uuid',
      label: 'System UUID',
      bengaliLabel: 'সিস্টেম আইডি (UUID)',
      value: user.id || 'N/A',
      icon: KeyRound,
      iconBg: 'bg-[#0D9488]',
      isMonospace: true,
      showCopy: true,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── Header Card ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-6 text-center space-y-3">
        <div className="mx-auto w-fit">
          <UserAvatar
            user={user}
            size="2xl"
            showBorder
            className="border-3 border-[#0D9488] shadow-md"
          />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
            {user.name || 'শিক্ষার্থী'}
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#059669] dark:text-[#34D399] font-mono text-xs font-bold border border-[#A7F3D0] dark:border-[#059669]/40">
              {displayStudentId}
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
            সাপোর্ট বা অ্যাডমিনের সহায়তার জন্য প্রয়োজনীয় তথ্য
          </p>
        </div>
      </div>

      {/* ── Info Items List (1:1 with Flutter AccountInfoModal) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs space-y-2.5 mb-6">
        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          অ্যাকাউন্ট বিবরণী
        </h3>

        <div className="divide-y divide-neutral-100 dark:divide-[#27272A]">
          {infoRows.map((row) => {
            const Icon = row.icon;
            const isCopied = copiedKey === row.key;

            return (
              <div
                key={row.key}
                onClick={() => copySingle(row.label, row.value, row.key)}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 dark:hover:bg-[#1E2235]/60 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Teal circular icon container */}
                  <div className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                        {row.label}
                      </span>
                    </div>
                    <p
                      className={`text-sm sm:text-[15px] font-bold text-[#0F172A] dark:text-white truncate mt-0.5 ${
                        row.isMonospace ? 'font-mono text-xs sm:text-sm' : ''
                      }`}
                    >
                      {row.value}
                    </p>
                  </div>
                </div>

                {row.showCopy && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copySingle(row.label, row.value, row.key);
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                    title={`${row.label} কপি করো`}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Copy All Button (1:1 with Flutter Copy Button) ── */}
      <div>
        <button
          type="button"
          onClick={copyAll}
          className="w-full h-13 rounded-[16px] bg-[#047857] hover:bg-[#065F46] text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-[#047857]/20 active:scale-[0.99] cursor-pointer"
        >
          <span>সব তথ্য কপি করো</span>
          <Copy className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Support note */}
      <div className="mt-4 p-3.5 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
        <ShieldCheck className="w-4.5 h-4.5 text-[#059669] shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
          যেকোনো অভিযোগ বা সাপোর্টের জন্য যোগাযোগ করার সময় তোমার{' '}
          <strong className="font-bold">স্টুডেন্ট আইডি ({displayStudentId})</strong> উল্লেখ করো।
        </p>
      </div>
    </div>
  );
};

export default AccountInfoView;
