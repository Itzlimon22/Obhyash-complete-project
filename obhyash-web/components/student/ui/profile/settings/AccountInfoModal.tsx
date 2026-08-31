'use client';

import React from 'react';
import { User, Hash, Mail, Phone, Copy, Check } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';

interface AccountInfoModalProps {
  user: UserProfile;
  onClose: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({
  user,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const displayStudentId =
    (user as any)?.student_id ||
    (user as any)?.displayStudentId ||
    user?.id?.slice(0, 8).toUpperCase() ||
    'N/A';

  const copySingle = (label: string, value: string, key: string) => {
    if (!value) return;
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
    lines.push(`• System UUID: ${user.id || 'N/A'}`);

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('সব অ্যাকাউন্ট ইনফো কপি করা হয়েছে!');
  };

  const infoRows = [
    {
      key: 'name',
      label: 'User Name',
      value: user.name || 'শিক্ষার্থী',
      icon: User,
      isMonospace: false,
      showCopy: false,
    },
    {
      key: 'userId',
      label: 'User ID',
      value: displayStudentId,
      icon: Hash,
      isMonospace: true,
      showCopy: true,
    },
    ...(user.email
      ? [
          {
            key: 'email',
            label: 'Email',
            value: user.email,
            icon: Mail,
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
            value: user.phone,
            icon: Phone,
            isMonospace: false,
            showCopy: true,
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#13151F] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-neutral-200/80 dark:border-white/10 font-['HindSiliguri',sans-serif] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-11 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4" />

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
            অ্যাকাউন্ট ইনফো
          </h3>
          <p className="text-[13px] text-neutral-500 dark:text-[#94A3B8] mt-1">
            সাপোর্ট বা অ্যাডমিনের সহায়তার জন্য প্রয়োজনীয় তথ্য
          </p>
        </div>

        {/* Info Rows */}
        <div className="space-y-3.5 mb-6">
          {infoRows.map((row) => {
            const Icon = row.icon;
            const isCopied = copiedKey === row.key;
            return (
              <div
                key={row.key}
                onClick={() => copySingle(row.label, row.value, row.key)}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#1E2235] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Teal circular icon */}
                  <div className="w-11 h-11 rounded-full bg-[#0D9488] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-500 dark:text-[#94A3B8] leading-tight">
                      {row.label}
                    </p>
                    <p
                      className={`text-[15px] font-bold text-neutral-900 dark:text-white truncate mt-0.5 ${
                        row.isMonospace ? 'font-mono tracking-wide' : ''
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
                    className="p-2 rounded-lg text-neutral-400 dark:text-[#64748B] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Big Green Copy Button */}
        <button
          onClick={copyAll}
          className="w-full h-[52px] rounded-[16px] bg-[#047857] hover:bg-[#065f46] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
        >
          <span>Copy</span>
          <Copy className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
};

export default AccountInfoModal;
