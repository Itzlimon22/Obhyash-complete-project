'use client';

import React, { useState } from 'react';
import {
  User,
  Pencil,
  Info,
  Gift,
  Bookmark,
  AlertTriangle,
  Bell,
  MessageSquare,
  Lightbulb,
  Crown,
  TrendingUp,
  Shield,
  FileText,
  HelpCircle,
  Fingerprint,
  Link2,
  Sun,
  Moon,
  LogOut,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { UserProfile } from '@/lib/types';
import PersonalDetailsPanel from './settings/PersonalDetailsPanel';
import AccountLinkingPanel from './settings/AccountLinkingPanel';
import ReportsPanel from './settings/ReportsPanel';
import MySubscriptionPanel from './settings/MySubscriptionPanel';
import SubscriptionView from './SubscriptionView';
import AboutUsView from './AboutUsView';
import PrivacyPolicyView from './PrivacyPolicyView';
import TermsConditionsView from './TermsConditionsView';
import FaqPanel from './settings/FaqPanel';
import AccountInfoModal from './settings/AccountInfoModal';
import AccountInfoView from './settings/AccountInfoView';
import DeleteAccountModal from './settings/DeleteAccountModal';
import NotificationsView from '@/components/student/features/notifications/NotificationsView';

import DeleteAccountPanel from './settings/DeleteAccountPanel';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => Promise<void> | void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

type ActivePanel =
  | null
  | 'personal'
  | 'account-linking'
  | 'account-info'
  | 'reports'
  | 'my-subscription'
  | 'upgrade'
  | 'notifications'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'delete-account';

type ItemType = 'navigate' | 'external' | 'action';

interface SettingsItem {
  label: string;
  description: string;
  icon: React.ElementType;
  type: ItemType;
  route?: string;
  url?: string;
  actionId?: string;
  danger?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onSave,
  onNavigate,
  onLogout,
  toggleTheme,
  isDarkMode = false,
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showAccountInfoModal, setShowAccountInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const groups: SettingsGroup[] = [
    {
      title: 'কার্যকলাপ',
      items: [
        {
          label: 'প্রোফাইল',
          description: 'এক্সাম ইতিহাস, বিষয়ভিত্তিক স্কোর',
          icon: User,
          type: 'navigate',
          route: 'analysis',
        },
        {
          label: 'বুকমার্ক',
          description: 'সংরক্ষণ করা প্রশ্নগুলো',
          icon: Bookmark,
          type: 'navigate',
          route: 'bookmarks',
        },
        {
          label: 'রিপোর্ট',
          description: 'রিপোর্ট করা প্রশ্ন ও অ্যাডমিন ফিডব্যাক',
          icon: AlertTriangle,
          type: 'navigate',
          actionId: 'reports',
        },
        {
          label: 'নোটিফিকেশন',
          description: 'নতুন আপডেট ও বার্তা',
          icon: Bell,
          type: 'navigate',
          actionId: 'notifications',
        },
        {
          label: 'অভিযোগ ও মতামত',
          description: 'অ্যাপের সমস্যা, বাগ বা ফিচারের পরামর্শ জানাও',
          icon: MessageSquare,
          type: 'navigate',
          route: 'complaint',
        },
        {
          label: 'ফিচার রিকোয়েস্ট',
          description: 'অ্যাপের জন্য নতুন ফিচারের প্রস্তাব ও আইডিয়া পাঠাও',
          icon: Lightbulb,
          type: 'navigate',
          route: 'feature-requests',
        },
      ],
    },
    {
      title: 'সাবস্ক্রিপশন',
      items: [
        {
          label: 'সাবস্ক্রিপশন',
          description: 'বর্তমান প্ল্যান, ইতিহাস ও লেনদেন',
          icon: Crown,
          type: 'navigate',
          actionId: 'my-subscription',
        },
        {
          label: 'আপগ্রেড',
          description: 'নতুন প্ল্যান কিনুন',
          icon: TrendingUp,
          type: 'navigate',
          actionId: 'upgrade',
        },
      ],
    },
    {
      title: 'অ্যাপ ও আইনি',
      items: [
        {
          label: 'পরিচিতি',
          description: 'Obhyash সম্পর্কে জানো',
          icon: Info,
          type: 'navigate',
          actionId: 'about',
        },
        {
          label: 'প্রাইভেসি',
          description: 'তোমার ডেটা কীভাবে ব্যবহার হয়',
          icon: Shield,
          type: 'navigate',
          actionId: 'privacy',
        },
        {
          label: 'শর্তাবলী',
          description: 'শর্ত ও বিধিমালা',
          icon: FileText,
          type: 'navigate',
          actionId: 'terms',
        },
        {
          label: 'সাহায্য',
          description: 'সাধারণ প্রশ্নের উত্তর',
          icon: HelpCircle,
          type: 'navigate',
          actionId: 'faq',
        },
      ],
    },
    {
      title: 'অ্যাকাউন্ট ও সেটিংস',
      items: [
        {
          label: 'অ্যাকাউন্ট ইনফো',
          description: 'ইউজার আইডি ও সাপোর্টে দেওয়ার জরুরি তথ্য',
          icon: Fingerprint,
          type: 'action',
          actionId: 'accountInfo',
        },
        {
          label: 'অ্যাকাউন্ট লিংকিং',
          description: 'গুগল ও অন্যান্য অ্যাকাউন্ট সংযুক্ত ও ম্যানেজ করো',
          icon: Link2,
          type: 'navigate',
          actionId: 'account-linking',
        },
        {
          label: isDarkMode ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো',
          description: 'অ্যাপের কালার থিম পরিবর্তন করো',
          icon: isDarkMode ? Sun : Moon,
          type: 'action',
          actionId: 'toggleTheme',
        },
        {
          label: 'লগ আউট',
          description: 'অ্যাকাউন্ট থেকে বের হও',
          icon: LogOut,
          type: 'action',
          actionId: 'logout',
          danger: true,
        },
        {
          label: 'অ্যাকাউন্ট মুছুন',
          description: 'স্থায়ীভাবে তোমার অ্যাকাউন্ট ও ডেটা ডিলিট করো',
          icon: Trash2,
          type: 'action',
          actionId: 'deleteAccount',
          danger: true,
        },
      ],
    },
  ];

  const handleItemClick = (item: SettingsItem) => {
    if (item.actionId === 'accountInfo') {
      setActivePanel('account-info');
      return;
    }
    if (item.actionId === 'deleteAccount') {
      setActivePanel('delete-account');
      return;
    }
    if (item.actionId === 'logout') {
      setShowLogoutModal(true);
      return;
    }
    if (item.actionId === 'toggleTheme') {
      toggleTheme?.();
      return;
    }
    if (item.actionId === 'reports') {
      setActivePanel('reports');
      return;
    }
    if (item.actionId === 'notifications') {
      setActivePanel('notifications');
      return;
    }
    if (item.actionId === 'my-subscription') {
      setActivePanel('my-subscription');
      return;
    }
    if (item.actionId === 'upgrade') {
      setActivePanel('upgrade');
      return;
    }
    if (item.actionId === 'about') {
      setActivePanel('about');
      return;
    }
    if (item.actionId === 'privacy') {
      setActivePanel('privacy');
      return;
    }
    if (item.actionId === 'terms') {
      setActivePanel('terms');
      return;
    }
    if (item.actionId === 'faq') {
      setActivePanel('faq');
      return;
    }
    if (item.actionId === 'account-linking') {
      setActivePanel('account-linking');
      return;
    }

    if (item.type === 'navigate' && item.route) {
      onNavigate?.(item.route);
    }
  };

  // ── Render Sub-Panels if Active ────────────────────────────────────────────
  if (activePanel) {
    return (
      <div className="max-w-4xl mx-auto p-2 sm:p-4 font-['HindSiliguri',sans-serif]">
        <button
          onClick={() => setActivePanel(null)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>সেটিংস এ ফিরে যান</span>
        </button>

        {activePanel === 'personal' && (
          <PersonalDetailsPanel
            user={user}
            onSave={async (data) => {
              if (onSave) await onSave(data);
              setActivePanel(null);
            }}
          />
        )}

        {activePanel === 'account-linking' && <AccountLinkingPanel user={user} />}

        {activePanel === 'account-info' && (
          <AccountInfoView user={user} onBack={() => setActivePanel(null)} />
        )}

        {activePanel === 'reports' && <ReportsPanel user={user} />}

        {activePanel === 'my-subscription' && (
          <MySubscriptionPanel onUpgrade={() => setActivePanel('upgrade')} />
        )}

        {activePanel === 'upgrade' && <SubscriptionView />}

        {activePanel === 'notifications' && <NotificationsView />}

        {activePanel === 'about' && <AboutUsView initialPolicy="about" />}
        {activePanel === 'privacy' && <PrivacyPolicyView />}
        {activePanel === 'terms' && <TermsConditionsView />}

        {activePanel === 'faq' && (
          <FaqPanel onNavigateComplaint={() => onNavigate?.('complaint')} />
        )}

        {activePanel === 'delete-account' && (
          <DeleteAccountPanel user={user} onBack={() => setActivePanel(null)} />
        )}
      </div>
    );
  }

  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0);
  const hasInstitute = Boolean(
    user.institute && user.institute.trim().length > 0
  );
  const hasBatch = Boolean(user.batch && user.batch.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-2 px-2.5 sm:px-4 py-3 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Top Profile Card (1:1 with Flutter SettingsView) ── */}
      <div className="rounded-[20px] border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Forest Green Gradient Banner */}
        <div className="bg-gradient-to-br from-[#166534] to-[#14532D] pt-7 pb-6 px-5 flex flex-col items-center text-center text-white">
          <div className="ring-[3px] ring-white/30 rounded-full shadow-lg">
            <UserAvatar user={user} size="2xl" className="w-20 h-20" />
          </div>
          <h2 className="text-[20px] font-bold text-white leading-tight mt-3">
            {user.name || 'শিক্ষার্থী'}
          </h2>
          {user.email && (
            <p className="text-[14px] text-white/80 font-normal mt-1 truncate max-w-sm">
              {user.email}
            </p>
          )}
        </div>

        {/* Info Chips & 4 Action Buttons Row */}
        <div className="p-4 space-y-4">
          {/* Info Chips */}
          <div className="flex flex-col gap-2">
            {(hasPhone || hasInstitute) && (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {hasPhone && (
                  <div className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[13px] font-medium flex items-center justify-center gap-1.5 truncate">
                    <span>📞</span>
                    <span className="truncate">{user.phone}</span>
                  </div>
                )}
                {hasInstitute && (
                  <div className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[13px] font-medium flex items-center justify-center gap-1.5 truncate">
                    <span>🏫</span>
                    <span className="truncate">{user.institute}</span>
                  </div>
                )}
              </div>
            )}

            {hasBatch && (
              <div className="w-full px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[13px] font-medium flex items-center justify-center gap-1.5 truncate">
                <span>📅</span>
                <span className="truncate">
                  {user.batch?.toLowerCase().includes('ব্যাচ')
                    ? user.batch
                    : `ব্যাচ ${user.batch}`}
                </span>
              </div>
            )}
          </div>

          {/* 4 Action Buttons Row */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* 1. Profile */}
            <button
              type="button"
              onClick={() => onNavigate?.('analysis')}
              className="flex-1 py-2.5 px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <User className="w-[17px] h-[17px]" />
              <span className="text-[13px] font-semibold leading-none">
                প্রোফাইল
              </span>
            </button>

            {/* 2. Edit */}
            <button
              type="button"
              onClick={() => setActivePanel('personal')}
              className="flex-1 py-2.5 px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Pencil className="w-[17px] h-[17px]" />
              <span className="text-[13px] font-semibold leading-none">
                এডিট
              </span>
            </button>

            {/* 3. Info */}
            <button
              type="button"
              onClick={() => setActivePanel('account-info')}
              className="flex-1 py-2.5 px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Info className="w-[17px] h-[17px]" />
              <span className="text-[13px] font-semibold leading-none">
                ইনফো
              </span>
            </button>

            {/* 4. Refer (Accent) */}
            <button
              type="button"
              onClick={() => onNavigate?.('referral')}
              className="flex-1 py-2.5 px-1 rounded-[10px] bg-[#FFF1F2] dark:bg-[#881337]/20 border border-[#FECDD3] dark:border-[#7F1D1D]/50 text-[#EF4444] hover:bg-rose-100 dark:hover:bg-[#881337]/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Gift className="w-[17px] h-[17px]" />
              <span className="text-[13px] font-semibold leading-none">
                রেফার
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Settings Groups (Individual cards matching Flutter) ── */}
      <div className="space-y-4 pt-2">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            {/* Group Header Title */}
            {group.title && (
              <h3 className="px-2 text-[14px] font-bold text-[#71717A] dark:text-[#A1A1AA]">
                {group.title}
              </h3>
            )}

            {/* Group Items as Separate Cards */}
            <div className="space-y-2">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isAction = item.type === 'action';

                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full p-3.5 rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-[0_1px_4px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 text-left hover:bg-neutral-50 dark:hover:bg-[#202024] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon Container */}
                      <div
                        className={`
                          w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                          ${
                            item.danger
                              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-[#EF4444]'
                              : 'bg-[#059669]/10 dark:bg-[#059669]/20 text-[#059669] dark:text-[#34D399]'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Text Column */}
                      <div className="min-w-0">
                        <p
                          className={`
                            text-[16px] font-semibold leading-tight truncate
                            ${
                              item.danger
                                ? 'text-[#EF4444]'
                                : 'text-[#111827] dark:text-white'
                            }
                          `}
                        >
                          {item.label}
                        </p>
                        <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] font-normal truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Indicator (Circle with Chevron or External Link) */}
                    {!isAction && (
                      <div className="w-6 h-6 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] flex items-center justify-center shrink-0">
                        <ChevronRight className="w-[15px] h-[15px] text-[#71717A] dark:text-[#A1A1AA]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Account Info Modal ── */}
      {showAccountInfoModal && (
        <AccountInfoModal
          user={user}
          onClose={() => setShowAccountInfoModal(false)}
        />
      )}

      {/* ── 4. Delete Account Modal ── */}
      {showDeleteModal && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onSuccessLogout={onLogout}
        />
      )}

      {/* ── 5. Logout Confirmation Modal (1:1 with Flutter AlertDialog) ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[20px] border border-neutral-200 dark:border-[#27272A] p-6 shadow-2xl font-['HindSiliguri',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              লগ আউট
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
              তুমি কি নিশ্চিতভাবে লগ আউট করতে চাও?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout?.();
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-[#B91C1C] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                লগ আউট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
