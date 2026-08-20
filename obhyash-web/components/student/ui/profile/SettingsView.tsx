'use client';

import { useState } from 'react';
import {
  User,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Bell,
  BookOpen,
  Crown,
  ArrowUpRight,
  Info,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Bookmark,
  MessageSquare,
  Sparkles,
  Fingerprint,
  Copy,
  Check,
  Hash,
  Mail,
  Phone,
  X,
  Trash2,
  Link2,
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { UserProfile } from '@/lib/types';
import PersonalDetailsPanel from './settings/PersonalDetailsPanel';
import AccountLinkingPanel from './settings/AccountLinkingPanel';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

import ReportsPanel from './settings/ReportsPanel';
import MySubscriptionPanel from './settings/MySubscriptionPanel';
import SubscriptionView from './SubscriptionView';
import NotificationsView from '@/components/student/features/notifications/NotificationsView';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => Promise<void> | void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

type PanelSection =
  | 'personal'
  | 'account-linking'
  | 'reports'
  | 'my-subscription'
  | 'notifications'
  | 'upgrade';

interface BaseItem {
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}
interface PanelItem extends BaseItem {
  type: 'panel';
  id: PanelSection;
}
interface InternalItem extends BaseItem {
  type: 'internal';
  tab: string;
}
interface ExternalItem extends BaseItem {
  type: 'external';
  href: string;
}
interface ActionItem extends BaseItem {
  type: 'action';
  id: string;
  danger?: boolean;
}

type SettingsItem = PanelItem | InternalItem | ExternalItem | ActionItem;

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

const GROUPS: SettingsGroup[] = [
  {
    title: 'অ্যাকাউন্ট',
    items: [
      {
        type: 'panel',
        id: 'personal',
        label: 'ব্যক্তিগত তথ্য',
        description: 'নাম, ছবি, একাডেমিক তথ্য',
        Icon: User,
      },
      {
        type: 'panel',
        id: 'account-linking',
        label: 'অ্যাকাউন্ট লিংকিং',
        description: 'Google ও অন্যান্য অ্যাকাউন্ট সংযুক্ত ও ম্যানেজ করো',
        Icon: Link2,
      },
      {
        type: 'action',
        id: 'accountInfo',
        label: 'অ্যাকাউন্ট ইনফো',
        description: 'ইউজার আইডি ও সাপোর্টে দেওয়ার তথ্য',
        Icon: Fingerprint,
      },
    ],
  },
  {
    title: 'কার্যকলাপ',
    items: [
      {
        type: 'internal',
        tab: 'bookmarks',
        label: 'আমার বুকমার্কস',
        description: 'সংরক্ষণ করা প্রশ্নগুলো',
        Icon: Bookmark,
      },
      {
        type: 'panel',
        id: 'reports',
        label: 'আমার রিপোর্ট',
        description: 'রিপোর্ট করা প্রশ্ন ও অ্যাডমিন ফিডব্যাক',
        Icon: AlertTriangle,
      },
      {
        type: 'panel',
        id: 'notifications',
        label: 'নোটিফিকেশন',
        description: 'নতুন আপডেট ও বার্তা',
        Icon: Bell,
      },
      {
        type: 'internal',
        tab: 'complaint',
        label: 'অভিযোগ ও মতামত',
        description: 'অ্যাপের সমস্যা, বাগ বা ফিচারের পরামর্শ জানাও',
        Icon: MessageSquare,
      },
      {
        type: 'internal',
        tab: 'feature-requests',
        label: 'নতুন ফিচার প্রস্তাব',
        description: 'অ্যাপের জন্য নতুন ফিচারের আইডিয়া পাঠাও',
        Icon: Sparkles,
      },
    ],
  },
  {
    title: 'সাবস্ক্রিপশন',
    items: [
      {
        type: 'panel',
        id: 'my-subscription',
        label: 'আমার সাবস্ক্রিপশন',
        description: 'বর্তমান প্ল্যান, ইতিহাস ও লেনদেন',
        Icon: Crown,
      },
      {
        type: 'panel',
        id: 'upgrade',
        label: 'আপগ্রেড করো',
        description: 'প্ল্যান দেখো ও আপগ্রেড করো',
        Icon: ArrowUpRight,
      },
    ],
  },
  {
    title: 'কন্টেন্ট',
    items: [
      {
        type: 'internal',
        tab: 'blog',
        label: 'ব্লগ',
        description: 'আর্টিকেল ও গাইড পড়ো',
        Icon: BookOpen,
      },
    ],
  },
  {
    title: 'অ্যাপ ও আইনি',
    items: [
      {
        type: 'internal',
        tab: 'about',
        label: 'আমাদের সম্পর্কে',
        description: 'Obhyash সম্পর্কে জানো',
        Icon: Info,
      },
      {
        type: 'external',
        href: '/privacy',
        label: 'প্রাইভেসি পলিসি',
        description: 'তোমার ডেটা কীভাবে ব্যবহার হয়',
        Icon: Shield,
      },
      {
        type: 'external',
        href: '/terms',
        label: 'ব্যবহারের নিয়মাবলী',
        description: 'শর্ত ও বিধিমালা',
        Icon: FileText,
      },
      {
        type: 'external',
        href: '/faq',
        label: 'সাহায্য ও FAQ',
        description: 'সাধারণ প্রশ্নের উত্তর',
        Icon: HelpCircle,
      },
    ],
  },
  {
    title: '',
    items: [
      {
        type: 'action',
        id: 'logout',
        label: 'লগ আউট',
        description: 'অ্যাকাউন্ট থেকে বের হও',
        Icon: LogOut,
        danger: true,
      },
      {
        type: 'action',
        id: 'deleteAccount',
        label: 'অ্যাকাউন্ট মুছুন',
        description: 'স্থায়ীভাবে তোমার অ্যাকাউন্ট ও ডেটা ডিলিট করো',
        Icon: Trash2,
        danger: true,
      },
    ],
  },
];

function ProfileCard({
  user,
  isDarkMode,
  toggleTheme,
}: {
  user: UserProfile;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto mb-6 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-md">
      {/* Green gradient header */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 px-6 py-8 flex flex-col items-center gap-3">
        <UserAvatar user={user} size="2xl" showBorder />
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-tight">
            {user.name}
          </h2>
          {user.email && (
            <p className="text-sm text-white/70 mt-1 truncate max-w-xs">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Info chips + theme toggle */}
      <div className="bg-white dark:bg-neutral-950 px-5 pt-4 pb-5 space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {user.phone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              📞 {user.phone}
            </span>
          )}
          {user.institute && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              🏫 {user.institute}
            </span>
          )}
          {user.batch && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              📅 ব্যাচ {user.batch}
            </span>
          )}
        </div>

        {toggleTheme && (
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => isDarkMode && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all ${
                !isDarkMode
                  ? 'bg-green-800 text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              লাইট
            </button>
            <button
              onClick={() => !isDarkMode && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-green-800 text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              ডার্ক
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsView({
  user,
  onSave,
  onNavigate,
  onLogout,
  toggleTheme,
  isDarkMode,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const desktopSection: PanelSection = activeSection ?? 'personal';

  const displayStudentId =
    user.student_id ||
    (user.id
      ? `OBH-${user.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
      : `OBH-${Math.floor(10000 + Math.random() * 90000)}`);

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const lines = [
      '📋 Obhyash Account Info:',
      `• Student ID: ${displayStudentId}`,
      `• User Name: ${user.name || 'N/A'}`,
      user.email ? `• Email: ${user.email}` : null,
      user.phone ? `• Phone: ${user.phone}` : null,
      user.stream ? `• Stream: ${user.stream}${user.batch ? ` (${user.batch})` : ''}` : null,
      user.institute ? `• Institute: ${user.institute}` : null,
      `• System UUID: ${user.id || 'N/A'}`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim() !== 'DELETE') {
      toast.error('অ্যাকাউন্ট মুছতে নিশ্চিতকরণ বক্সে "DELETE" লিখো।');
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_user_account', {
        p_reason: 'User requested deletion',
      });

      if (error) throw error;

      await supabase.auth.signOut();
      toast.success('তোমার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
      window.location.href = '/login';
    } catch (err: unknown) {
      setIsDeleting(false);
      const msg = err instanceof Error ? err.message : 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে।';
      toast.error(msg.replace('Exception:', '').trim());
    }
  };

  const handleItem = (item: SettingsItem) => {
    if (item.type === 'panel') {
      setActiveSection(item.id);
      return;
    }
    if (item.type === 'internal') {
      onNavigate?.(item.tab);
      return;
    }
    if (item.type === 'external') {
      window.open(item.href, '_blank', 'noopener');
      return;
    }
    if (item.type === 'action') {
      if (item.id === 'accountInfo') {
        setShowAccountInfo(true);
        return;
      }
      if (item.id === 'deleteAccount') {
        setShowDeleteModal(true);
        return;
      }
      if (item.id === 'logout') {
        onLogout?.();
        return;
      }
    }
  };

  const renderPanel = (section: PanelSection) => {
    const panelTitles: Record<PanelSection, string> = {
      personal: 'ব্যক্তিগত তথ্য',
      'account-linking': 'অ্যাকাউন্ট লিংকিং',
      reports: 'আমার রিপোর্ট',
      'my-subscription': 'আমার সাবসক্রিপশন',
      notifications: 'নোটিফিকেশন',
      upgrade: 'আপগ্রেড করো',
    };
    const content = (() => {
      switch (section) {
        case 'personal':
          return <PersonalDetailsPanel user={user} onSave={onSave} />;
        case 'account-linking':
          return <AccountLinkingPanel user={user} />;
        case 'reports':
          return <ReportsPanel user={user} />;
        case 'my-subscription':
          return (
            <MySubscriptionPanel
              onUpgrade={() => setActiveSection('upgrade')}
            />
          );
        case 'notifications':
          return <NotificationsView />;
        case 'upgrade':
          return <SubscriptionView />;
      }
    })();

    return (
      <div>
        {/* Panel header with back button — shown on desktop */}
        <div className="hidden md:flex items-center gap-3 mb-5 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveSection('personal')}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 dark:text-neutral-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            সেটিংস
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {panelTitles[section]}
          </h2>
        </div>
        {content}
      </div>
    );
  };

  // Sidebar nav item renderer
  const NavItem = ({ item }: { item: SettingsItem }) => {
    const isPanel = item.type === 'panel';
    const active = isPanel && desktopSection === (item as PanelItem).id;
    const isDanger = item.type === 'action' && (item as ActionItem).danger;
    const isExternal = item.type === 'external';
    const isInternal = item.type === 'internal';

    return (
      <li>
        <button
          onClick={() => handleItem(item)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
            active
              ? 'bg-green-800 text-white font-bold shadow-sm'
              : isDanger
                ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
          }`}
        >
          <item.Icon className="w-4 h-4 shrink-0" />
          <span className="text-sm flex-1">{item.label}</span>
          {(isExternal || isInternal) && !active && (
            <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
          )}
        </button>
      </li>
    );
  };

  return (
    <>
      {/* ── Profile Card — only on main settings page ─────── */}
      {activeSection === null && (
        <ProfileCard
          user={user}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}

      {/* ── DESKTOP (md+): sidebar + content ─────────────── */}
      <div className="hidden md:flex gap-6 max-w-5xl mx-auto pb-24 items-start">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 sticky top-4">
          <nav className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-green-800">
              <p className="text-[11px] font-bold text-green-100 uppercase tracking-widest">
                সেটিংস
              </p>
            </div>
            <div className="p-2">
              {GROUPS.map((group, gi) => (
                <div
                  key={gi}
                  className={
                    gi > 0
                      ? 'mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800'
                      : ''
                  }
                >
                  {group.title && (
                    <p className="px-3 mb-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
                      {group.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0">{renderPanel(desktopSection)}</div>
      </div>

      {/* ── MOBILE: menu list → sub-panel with back button ── */}
      <div className="md:hidden pb-24">
        {activeSection === null ? (
          <div className="space-y-4">
            {GROUPS.map((group, gi) => (
              <div key={gi}>
                {group.title && (
                  <p className="px-1 mb-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isDanger =
                      item.type === 'action' && (item as ActionItem).danger;
                    const isExternal = item.type === 'external';
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleItem(item)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left active:scale-[0.99] transition-transform shadow-sm ${
                          isDanger
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 hover:border-red-400'
                            : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-green-700 dark:hover:border-green-700'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isDanger ? 'bg-red-600' : 'bg-green-800'
                          }`}
                        >
                          <item.Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold ${isDanger ? 'text-red-600 dark:text-red-500' : 'text-neutral-800 dark:text-neutral-100'}`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        {isExternal ? (
                          <ExternalLink className="w-4 h-4 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 ${isDanger ? 'text-red-400' : 'text-neutral-400'}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 mb-5 text-sm font-bold text-green-800 dark:text-green-400 hover:text-green-900"
            >
              <ArrowLeft className="w-4 h-4" />
              সেটিংস
            </button>
            {renderPanel(activeSection)}
          </div>
        )}
      </div>

      {/* ── Account Info Modal ── */}
      {showAccountInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowAccountInfo(false)}
        >
          <div
            className="w-full max-w-md bg-[#13151F] text-white rounded-3xl p-6 shadow-2xl border border-neutral-800 space-y-6 animate-scaleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAccountInfo(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-black font-serif-exam tracking-wide text-white">
                অ্যাকাউন্ট ইনফো
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                সাপোর্ট বা অ্যাডমিন সহায়তার জন্য প্রয়োজনীয় তথ্য
              </p>
            </div>

            {/* Rows */}
            <div className="space-y-4 pt-2">
              {/* User Name */}
              <div
                onClick={() => handleCopy('name', user.name || '')}
                className="flex items-center gap-4 p-2 rounded-2xl hover:bg-neutral-800/40 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/30">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-400">
                    User Name
                  </p>
                  <p className="text-base font-bold text-white truncate">
                    {user.name || 'N/A'}
                  </p>
                </div>
                {copiedField === 'name' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                )}
              </div>

              {/* User ID */}
              <div
                onClick={() => handleCopy('id', displayStudentId)}
                className="flex items-center gap-4 p-2 rounded-2xl hover:bg-neutral-800/40 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/30">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-400">
                    User ID
                  </p>
                  <p className="text-base font-mono font-bold text-white truncate">
                    {displayStudentId}
                  </p>
                </div>
                {copiedField === 'id' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                )}
              </div>

              {/* Email */}
              {user.email && (
                <div
                  onClick={() => handleCopy('email', user.email || '')}
                  className="flex items-center gap-4 p-2 rounded-2xl hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/30">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-400">
                      Email
                    </p>
                    <p className="text-base font-bold text-white truncate">
                      {user.email}
                    </p>
                  </div>
                  {copiedField === 'email' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  )}
                </div>
              )}

              {/* Phone */}
              {user.phone && (
                <div
                  onClick={() => handleCopy('phone', user.phone || '')}
                  className="flex items-center gap-4 p-2 rounded-2xl hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/30">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-400">
                      Phone
                    </p>
                    <p className="text-base font-bold text-white truncate">
                      {user.phone}
                    </p>
                  </div>
                  {copiedField === 'phone' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Copy All Button */}
            <button
              onClick={handleCopyAll}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <span>Copy</span>
                  <Copy className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Delete Account Modal ────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 rounded-3xl p-6 border border-red-900/50 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 font-anek">
                    অ্যাকাউন্ট মুছুন (Delete Account)
                  </h3>
                  <p className="text-xs text-neutral-400 font-anek">
                    এই প্রক্রিয়াটি অপরিবর্তনীয় ও স্থায়ী
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pro Warning */}
            {user.subscription?.plan === 'Pro' && (
              <div className="p-3.5 bg-amber-950/50 border border-amber-800/60 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 font-anek font-semibold leading-relaxed">
                  সতর্কতা: তোমার অ্যাকাউন্টে প্রো সাবস্ক্রিপশন সক্রিয় আছে। অ্যাকাউন্ট মুছে ফেললে সাবস্ক্রিপশন বাতিল হবে এবং কোনো রিফান্ড প্রযোজ্য হবে না।
                </p>
              </div>
            )}

            {/* Warning Points */}
            <div className="space-y-2 text-xs text-neutral-300 font-anek bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
              <p className="font-bold text-neutral-200 mb-1">অ্যাকাউন্ট মুছে ফেললে:</p>
              <p className="flex items-center gap-2 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                সমস্ত ব্যক্তিগত প্রোফাইল ও লগইন চিরতরে ডিলিট হবে।
              </p>
              <p className="flex items-center gap-2 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                পরীক্ষার ইতিহাস, স্কোর, স্ট্রিক ও ফলাফল মুছে যাবে।
              </p>
              <p className="flex items-center gap-2 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                সংরক্ষিত বুকমার্ক ও স্ক্র্যাচ কার্ড নষ্ট হবে।
              </p>
            </div>

            {/* Confirm Type */}
            <div>
              <label className="block text-xs font-bold text-neutral-200 font-anek mb-1.5">
                নিশ্চিত করতে নিচে &quot;DELETE&quot; লিখো:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 bg-neutral-800/80 border border-red-800/60 rounded-xl text-sm font-mono font-bold tracking-widest text-red-400 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 uppercase"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-2xl font-bold font-anek text-sm transition-colors"
              >
                বাতিল করো
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmation.trim() !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold font-anek text-sm shadow-lg shadow-red-950/50 transition-all active:scale-[0.98]"
              >
                {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলো'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
