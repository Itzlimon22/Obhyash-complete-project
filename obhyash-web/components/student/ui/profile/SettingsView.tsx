'use client';

import { useState } from 'react';
import {
  User,
  Monitor,
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
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { UserProfile } from '@/lib/types';
import PersonalDetailsPanel from './settings/PersonalDetailsPanel';
import ManageDevicesPanel from './settings/ManageDevicesPanel';
import ReportsPanel from './settings/ReportsPanel';
import MySubscriptionPanel from './settings/MySubscriptionPanel';
import SubscriptionView from './SubscriptionView';
import NotificationsView from '@/components/student/features/notifications/NotificationsView';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

type PanelSection =
  | 'personal'
  | 'devices'
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
        id: 'devices',
        label: 'ডিভাইস ম্যানেজ',
        description: 'লগইন করা ডিভাইস দেখো ও সরাও',
        Icon: Monitor,
      },
    ],
  },
  {
    title: 'কার্যকলাপ',
    items: [
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
        label: 'আপগ্রেড করুন',
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
  const desktopSection: PanelSection = activeSection ?? 'personal';

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
    if (item.type === 'action' && item.id === 'logout') {
      onLogout?.();
      return;
    }
  };

  const renderPanel = (section: PanelSection) => {
    const panelTitles: Record<PanelSection, string> = {
      personal: 'ব্যক্তিগত তথ্য',
      devices: 'ডিভাইস ম্যানেজ',
      reports: 'আমার রিপোর্ট',
      'my-subscription': 'আমার সাবসক্রিপশন',
      notifications: 'নোটিফিকেশন',
      upgrade: 'আপগ্রেড করুন',
    };
    const content = (() => {
      switch (section) {
        case 'personal':
          return <PersonalDetailsPanel user={user} onSave={onSave} />;
        case 'devices':
          return <ManageDevicesPanel userId={user.id ?? ''} />;
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
    </>
  );
}
