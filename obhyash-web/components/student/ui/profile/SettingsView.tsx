'use client';

import { useState } from 'react';
import { User, Monitor, ChevronRight, ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import PersonalDetailsPanel from './settings/PersonalDetailsPanel';
import ManageDevicesPanel from './settings/ManageDevicesPanel';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => void;
}

type SettingsSection = 'personal' | 'devices';

const SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'personal',
    label: 'ব্যক্তিগত তথ্য',
    description: 'নাম, ছবি, একাডেমিক তথ্য',
    Icon: User,
  },
  {
    id: 'devices',
    label: 'ডিভাইস ম্যানেজ',
    description: 'লগইন করা ডিভাইস দেখো ও সরাও',
    Icon: Monitor,
  },
];

export default function SettingsView({ user, onSave }: SettingsViewProps) {
  // null = mobile menu list, a section id = viewing that section
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(
    null,
  );

  // Desktop always shows a section; default to 'personal'
  const desktopSection: SettingsSection = activeSection ?? 'personal';

  const renderPanel = (section: SettingsSection) => {
    switch (section) {
      case 'personal':
        return <PersonalDetailsPanel user={user} onSave={onSave} />;
      case 'devices':
        return <ManageDevicesPanel userId={user.id ?? ''} />;
    }
  };

  return (
    <>
      {/* ── DESKTOP (md+): sidebar + content ─────────────── */}
      <div className="hidden md:flex gap-6 max-w-5xl mx-auto pb-24 items-start">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 sticky top-4">
          <nav className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-green-800">
              <p className="text-[11px] font-bold text-green-100 uppercase tracking-widest">
                সেটিংস
              </p>
            </div>
            <ul className="p-2 space-y-0.5">
              {SECTIONS.map(({ id, label, Icon }) => {
                const active = desktopSection === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => setActiveSection(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        active
                          ? 'bg-green-800 text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0">{renderPanel(desktopSection)}</div>
      </div>

      {/* ── MOBILE: menu list → sub-page with back button ── */}
      <div className="md:hidden pb-24">
        {activeSection === null ? (
          /* Menu list */
          <div className="space-y-2">
            {SECTIONS.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-left active:scale-[0.99] transition-transform shadow-sm hover:border-green-700 dark:hover:border-green-700"
              >
                <div className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                    {label}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                    {description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          /* Sub-page */
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
