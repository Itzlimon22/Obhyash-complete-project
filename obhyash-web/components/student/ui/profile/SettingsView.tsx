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
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { UserProfile } from '@/lib/types';
import AccountInfoModal from './settings/AccountInfoModal';
import DeleteAccountModal from './settings/DeleteAccountModal';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => Promise<void> | void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

type ItemType = 'navigate' | 'action';

interface SettingsItem {
  label: string;
  icon: React.ElementType;
  svgAsset?: string;
  type: ItemType;
  route?: string;
  actionId?: string;
  danger?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onNavigate,
  onLogout,
  toggleTheme,
  isDarkMode = false,
}) => {
  const [showAccountInfoModal, setShowAccountInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 1:1 matching Flutter settings_view.dart _buildGroups
  const groups: SettingsGroup[] = [
    {
      title: 'কার্যকলাপ',
      items: [
        {
          label: 'প্রোফাইল',
          icon: User,
          svgAsset: '/dashboard-icons/analytics.svg',
          type: 'navigate',
          route: 'profile',
        },
        {
          label: 'বুকমার্ক',
          icon: Bookmark,
          svgAsset: '/dashboard-icons/bookmarks.svg',
          type: 'navigate',
          route: 'bookmarks',
        },
        {
          label: 'রিপোর্ট',
          icon: AlertTriangle,
          svgAsset: '/dashboard-icons/mistake_review.svg',
          type: 'navigate',
          actionId: 'reports',
        },
        {
          label: 'নোটিফিকেশন',
          icon: Bell,
          svgAsset: '/dashboard-icons/bell_notification.svg',
          type: 'navigate',
          actionId: 'notifications',
        },
        {
          label: 'অভিযোগ ও মতামত',
          icon: MessageSquare,
          svgAsset: '/dashboard-icons/feedback_chat.svg',
          type: 'navigate',
          route: 'complaint',
        },
        {
          label: 'ফিচার রিকোয়েস্ট',
          icon: Lightbulb,
          svgAsset: '/dashboard-icons/feature_lightbulb.svg',
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
          icon: Crown,
          svgAsset: '/dashboard-icons/pro_crown.svg',
          type: 'navigate',
          actionId: 'my-subscription',
        },
        {
          label: 'আপগ্রেড',
          icon: TrendingUp,
          svgAsset: '/dashboard-icons/leaderboard_trophy.svg',
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
          icon: Info,
          svgAsset: '/dashboard-icons/app_icon.svg',
          type: 'navigate',
          actionId: 'about',
        },
        {
          label: 'প্রাইভেসি',
          icon: Shield,
          svgAsset: '/dashboard-icons/privacy_shield.svg',
          type: 'navigate',
          actionId: 'privacy',
        },
        {
          label: 'শর্তাবলী',
          icon: FileText,
          svgAsset: '/dashboard-icons/terms_doc.svg',
          type: 'navigate',
          actionId: 'terms',
        },
        {
          label: 'সাহায্য',
          icon: HelpCircle,
          svgAsset: '/dashboard-icons/help_question.svg',
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
          icon: Fingerprint,
          svgAsset: '/dashboard-icons/account_card.svg',
          type: 'action',
          actionId: 'accountInfo',
        },
        {
          label: 'অ্যাকাউন্ট লিংকিং',
          icon: Link2,
          svgAsset: '/dashboard-icons/settings_gear.svg',
          type: 'navigate',
          actionId: 'account-linking',
        },
        {
          label: isDarkMode ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো',
          icon: isDarkMode ? Sun : Moon,
          type: 'action',
          actionId: 'toggleTheme',
        },
        {
          label: 'লগ আউট',
          icon: LogOut,
          type: 'action',
          actionId: 'logout',
          danger: true,
        },
        {
          label: 'অ্যাকাউন্ট মুছুন',
          icon: Trash2,
          type: 'action',
          actionId: 'deleteAccount',
          danger: true,
        },
      ],
    },
  ];

  const handleItemClick = (item: SettingsItem) => {
    if (item.actionId === 'logout') {
      setShowLogoutModal(true);
      return;
    }
    if (item.actionId === 'toggleTheme') {
      toggleTheme?.();
      return;
    }
    if (item.actionId === 'accountInfo' || item.actionId === 'account-info') {
      setShowAccountInfoModal(true);
      return;
    }
    if (item.actionId === 'deleteAccount' || item.actionId === 'delete-account') {
      setShowDeleteModal(true);
      return;
    }
    if (item.actionId === 'personal' || item.actionId === 'edit-profile') {
      onNavigate?.('personal');
      return;
    }
    if (item.actionId === 'reports') {
      onNavigate?.('reports');
      return;
    }
    if (item.actionId === 'notifications') {
      onNavigate?.('notifications');
      return;
    }
    if (item.actionId === 'my-subscription') {
      onNavigate?.('my-subscription');
      return;
    }
    if (item.actionId === 'upgrade') {
      onNavigate?.('subscription');
      return;
    }
    if (item.actionId === 'about') {
      onNavigate?.('about');
      return;
    }
    if (item.actionId === 'privacy') {
      onNavigate?.('privacy');
      return;
    }
    if (item.actionId === 'terms') {
      onNavigate?.('terms');
      return;
    }
    if (item.actionId === 'faq') {
      onNavigate?.('faq');
      return;
    }
    if (item.actionId === 'account-linking') {
      onNavigate?.('account-linking');
      return;
    }

    if (item.type === 'navigate' && item.route) {
      onNavigate?.(item.route);
    }
  };

  const hasPhone = Boolean(user.phone && user.phone.trim().length > 0);
  const hasInstitute = Boolean(
    user.institute && user.institute.trim().length > 0
  );
  const hasBatch = Boolean(user.batch && user.batch.trim().length > 0);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 py-2 font-sans pb-16">
      {/* ── 1. Profile Card (1:1 with Flutter SettingsView) ── */}
      <div className="rounded-[20px] border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Deep Green Gradient Header (Matching Flutter 1:1) */}
        <div className="w-full pt-7 pb-6 px-5 flex flex-col items-center text-center text-white bg-gradient-to-br from-[#064E3B] to-[#047857] dark:from-[#064E3B] dark:to-[#022C22]">
          <div className="ring-[3px] ring-white/30 rounded-full shadow-lg">
            <UserAvatar user={user} size="2xl" priority className="w-20 h-20" />
          </div>
          <h2 className="text-[16px] font-semibold text-white leading-tight mt-3">
            {user.name || 'শিক্ষার্থী'}
          </h2>
          {user.email && (
            <p className="text-[12.5px] text-white/80 font-normal mt-[3px] truncate max-w-sm">
              {user.email}
            </p>
          )}
        </div>

        {/* Info Chips & 4 Action Buttons */}
        <div className="p-4 space-y-4">
          {/* Info Chips (Matching Flutter _InfoChip) */}
          <div className="flex flex-col gap-2">
            {(hasPhone || hasInstitute) && (
              <div className="flex items-center gap-2">
                {hasPhone && (
                  <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[12px] font-normal flex items-center justify-center gap-1.5 truncate">
                    <span className="text-[12px] shrink-0">📞</span>
                    <span className="truncate">{user.phone}</span>
                  </div>
                )}
                {hasInstitute && (
                  <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[12px] font-normal flex items-center justify-center gap-1.5 truncate">
                    <span className="text-[12px] shrink-0">🏫</span>
                    <span className="truncate">{user.institute}</span>
                  </div>
                )}
              </div>
            )}

            {hasBatch && (
              <div className="w-full px-2.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] text-[12px] font-normal flex items-center justify-center gap-1.5 truncate">
                <span className="text-[12px] shrink-0">📅</span>
                <span className="truncate">
                  {user.batch?.toLowerCase().includes('ব্যাচ')
                    ? user.batch
                    : `ব্যাচ ${user.batch}`}
                </span>
              </div>
            )}
          </div>

          {/* 4 Action Buttons Row (Matching Flutter _ActionBtn) */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* 1. Profile */}
            <button
              type="button"
              onClick={() => onNavigate?.('profile')}
              className="flex-1 py-[9px] px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-[3px] cursor-pointer active:scale-95"
            >
              <User size={16} />
              <span className="text-[12px] font-medium leading-none">
                প্রোফাইল
              </span>
            </button>

            {/* 2. Edit */}
            <button
              type="button"
              onClick={() => onNavigate?.('personal')}
              className="flex-1 py-[9px] px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-[3px] cursor-pointer active:scale-95"
            >
              <Pencil size={16} />
              <span className="text-[12px] font-medium leading-none">
                এডিট
              </span>
            </button>

            {/* 3. Info */}
            <button
              type="button"
              onClick={() => setShowAccountInfoModal(true)}
              className="flex-1 py-[9px] px-1 rounded-[10px] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#374151] dark:text-[#E4E4E7] hover:brightness-95 transition-all flex flex-col items-center justify-center gap-[3px] cursor-pointer active:scale-95"
            >
              <Info size={16} />
              <span className="text-[12px] font-medium leading-none">
                ইনফো
              </span>
            </button>

            {/* 4. Refer (Accent) */}
            <button
              type="button"
              onClick={() => onNavigate?.('referral')}
              className="flex-1 py-[9px] px-1 rounded-[10px] bg-[#FFF1F2] dark:bg-[#881337]/20 border border-[#FECDD3] dark:border-[#7F1D1D]/50 text-[#EF4444] hover:bg-rose-100 dark:hover:bg-[#881337]/30 transition-all flex flex-col items-center justify-center gap-[3px] cursor-pointer active:scale-95"
            >
              <Gift size={16} />
              <span className="text-[12px] font-medium leading-none">
                রেফার
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Settings Groups (1:1 with Flutter _SettingsGroup & _NavItem) ── */}
      <div className="space-y-4">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            {/* Group Header Title */}
            {group.title && (
              <h3 className="px-2.5 pt-2 text-[14px] font-bold text-[#71717A] dark:text-[#A1A1AA]">
                {group.title}
              </h3>
            )}

            {/* Group Items as Individual 14px-radius Cards (Matching Flutter _NavItem) */}
            <div className="space-y-2">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isAction = item.type === 'action';

                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full px-[14px] py-[11px] rounded-[14px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] shadow-[0_1px_4px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3.5 text-left hover:bg-neutral-50/80 dark:hover:bg-[#202024] transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-[14px] min-w-0 flex-1">
                      {/* SVG or Lucide Icon (38x38 matching Flutter) */}
                      {item.svgAsset ? (
                        <div className="w-[38px] h-[38px] shrink-0 flex items-center justify-center">
                          <img
                            src={item.svgAsset}
                            alt={item.label}
                            className="w-[38px] h-[38px] object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${
                            item.danger
                              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-[#EF4444]'
                              : 'bg-[#059669]/10 dark:bg-[#059669]/20 text-[#059669] dark:text-[#34D399]'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                      )}

                      {/* Item Label (Matching Flutter fontSize: 14, fontWeight: FontWeight.w500) */}
                      <span
                        className={`text-[14px] font-medium truncate ${
                          item.danger
                            ? 'text-[#EF4444]'
                            : 'text-[#111827] dark:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Right Circular Pill Chevron (Matching Flutter shape: BoxShape.circle) */}
                    {!isAction && (
                      <div className="w-[23px] h-[23px] rounded-full bg-[#F3F4F6] dark:bg-[#27272A] flex items-center justify-center shrink-0">
                        <ChevronRight
                          size={15}
                          className="text-[#71717A] dark:text-[#A1A1AA]"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Account Info Modal (1:1 with Flutter AccountInfoModal.show) ── */}
      {showAccountInfoModal && (
        <AccountInfoModal
          user={user}
          onClose={() => setShowAccountInfoModal(false)}
        />
      )}

      {/* ── 4. Delete Account Modal (1:1 with Flutter DeleteAccountModal.show) ── */}
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
