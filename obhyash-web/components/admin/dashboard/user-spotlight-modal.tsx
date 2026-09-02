'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  Crown,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  X,
  Flame,
  Award,
} from 'lucide-react';
import { isUserPro } from '@/lib/subscription-utils';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  plan?: string;
  is_subscribed?: boolean;
  subscription_status?: string;
  subscription_expires_at?: string;
  subscription?: any;
  status?: string;
  exams_taken?: number;
  xp?: number;
  created_at: string;
}

export function UserSpotlightSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/user-spotlight?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAction = async (action: string, value: any) => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/user-spotlight', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, action, value }),
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedUser(json.data);
        // Also update in results list
        setResults((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? json.data : u)),
        );
      } else {
        alert('Action failed');
      }
    } catch (e) {
      alert('Error updating user: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3.5 text-neutral-400 dark:text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="শিক্ষার্থীর ফোন, ইমেইল বা নাম দিয়ে তাৎক্ষণিক সার্চ..."
          className="w-full pl-10 pr-10 py-2 text-xs bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 shadow-sm"
        />
        {isLoading ? (
          <Loader2
            size={15}
            className="absolute right-3.5 text-emerald-500 animate-spin"
          />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Instant Search Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
              খুঁজে পাওয়া শিক্ষার্থী ({results.length})
            </div>
            {results.map((user) => {
              const isPro = isUserPro(user);
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {user.name || 'No Name'}
                        </span>
                        {isPro && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Crown size={10} /> PRO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-zinc-400 block truncate">
                        {user.email || user.phone || 'No Contact'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 capitalize">
                    {user.role || 'student'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── User Master Spotlight Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg flex items-center justify-center">
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    {selectedUser.name || 'Unnamed User'}
                    {isUserPro(selectedUser) && (
                      <Crown size={14} className="text-amber-500" />
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">
                    {selectedUser.email || selectedUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-zinc-800 text-center">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                  Exams Taken
                </span>
                <span className="text-base font-extrabold text-neutral-900 dark:text-white font-mono">
                  {selectedUser.exams_taken || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-zinc-800 text-center">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                  XP Points
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedUser.xp || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-zinc-800 text-center">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                  Status
                </span>
                <span
                  className={`text-xs font-extrabold capitalize ${
                    selectedUser.status === 'banned'
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {selectedUser.status || 'Active'}
                </span>
              </div>
            </div>

            {/* 1-Click Master Control Buttons */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-neutral-500 dark:text-zinc-400 mb-2">
                মাস্টার কন্ট্রোল অ্যাকশন (1-Click Actions):
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Toggle Pro */}
                <button
                  disabled={isUpdating}
                  onClick={() =>
                    handleAction(
                      'toggle_plan',
                      isUserPro(selectedUser) ? 'free' : 'pro',
                    )
                  }
                  className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isUserPro(selectedUser)
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <Crown size={14} />
                  <span>
                    {isUserPro(selectedUser)
                      ? 'Remove Pro (Make Free)'
                      : 'Upgrade to PRO'}
                  </span>
                </button>

                {/* Toggle Ban */}
                <button
                  disabled={isUpdating}
                  onClick={() =>
                    handleAction(
                      'toggle_status',
                      selectedUser.status === 'banned' ? 'active' : 'banned',
                    )
                  }
                  className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedUser.status === 'banned'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <Ban size={14} />
                  <span>
                    {selectedUser.status === 'banned'
                      ? 'Unban User'
                      : 'Ban Account'}
                  </span>
                </button>
              </div>

              {/* Role Change Buttons */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-zinc-400 font-semibold">
                  অ্যাকাউন্ট রোল পরিবর্তন:
                </span>
                <div className="flex gap-1.5">
                  {['student', 'teacher', 'admin'].map((role) => (
                    <button
                      key={role}
                      disabled={isUpdating || selectedUser.role === role}
                      onClick={() => handleAction('toggle_role', role)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition ${
                        selectedUser.role === role
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
