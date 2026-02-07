'use client';

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Bell,
  Monitor,
  Moon,
  Sun,
  Lock,
  Smartphone,
  Mail,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

type TabId = 'general' | 'security' | 'notifications';

const TabButton = ({
  id,
  label,
  icon: Icon,
  activeTab,
  setActiveTab,
}: {
  id: TabId;
  label: string;
  icon: LucideIcon;
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
}) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all border-b-2 
      ${
        activeTab === id
          ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/10'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-obsidian-800'
      }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-paper-900 dark:text-white">
            Settings
          </h1>
          <p className="text-paper-500 dark:text-gray-400 mt-1">
            Manage your account preferences and system configurations.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl shadow-sm border border-paper-200 dark:border-obsidian-800 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-paper-200 dark:border-obsidian-800 overflow-x-auto">
          <TabButton
            id="general"
            label="General"
            icon={Monitor}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="security"
            label="Security"
            icon={Shield}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="notifications"
            label="Notifications"
            icon={Bell}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-lg font-semibold text-paper-900 dark:text-white mb-4">
                  Appearance
                </h3>
                <div className="bg-gray-50 dark:bg-obsidian-800/50 rounded-xl p-4 border border-gray-200 dark:border-obsidian-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${isDarkMode ? 'bg-obsidian-900 text-purple-400' : 'bg-orange-100 text-orange-500'}`}
                    >
                      {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                      <p className="font-medium text-paper-900 dark:text-white">
                        Dark Mode
                      </p>
                      <p className="text-sm text-paper-500 dark:text-gray-400">
                        Reduce eye strain in low-light environments.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => toggleTheme(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-paper-900 dark:text-white mb-4">
                  Language & Region
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-paper-700 dark:text-gray-300">
                        Display Language
                      </label>
                      <select className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 dark:bg-obsidian-800 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white">
                        <option>English (US)</option>
                        <option>Bengali</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-paper-700 dark:text-gray-300">
                        Timezone
                      </label>
                      <select className="w-full px-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white">
                        <option>Dhaka (GMT+6)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-lg font-semibold text-paper-900 dark:text-white mb-4">
                  Password
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-paper-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 dark:bg-obsidian-800 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-paper-700 dark:text-gray-300">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-paper-700 dark:text-gray-300">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                    Forgot Password?
                  </button>
                </div>
              </section>

              <div className="h-px bg-paper-200 dark:bg-obsidian-800 my-6"></div>

              <section>
                <h3 className="text-lg font-semibold text-paper-900 dark:text-white mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="bg-paper-50 dark:bg-obsidian-800/50 rounded-xl p-4 border border-paper-100 dark:border-obsidian-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-paper-900 dark:text-white">
                        Authenticator App
                      </p>
                      <p className="text-sm text-paper-500 dark:text-gray-400">
                        Secure your account with TOTP (Google Auth, Authy).
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white dark:bg-obsidian-700 border border-paper-200 dark:border-obsidian-600 rounded-lg text-paper-900 dark:text-white text-sm font-medium hover:bg-paper-50 dark:hover:bg-obsidian-600 transition-colors">
                    Setup
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-lg font-semibold text-paper-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail size={18} /> Email Notifications
                </h3>
                <div className="space-y-3">
                  {[
                    'New User Signup',
                    'Payment Request Received',
                    'System Updates',
                    'Weekly Report',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 hover:bg-paper-50 dark:hover:bg-obsidian-800/50 rounded-lg transition-colors"
                    >
                      <span className="text-paper-700 dark:text-gray-300 font-medium">
                        {item}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
