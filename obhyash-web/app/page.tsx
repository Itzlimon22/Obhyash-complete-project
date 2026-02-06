'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';

import LandingPage from '@/components/landing/LandingPage';
import StudentRoot from '@/components/student/StudentRoot';

export default function Home() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    setMounted(true);

    const init = async () => {
      // 1. Theme Check
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        // User Request: Default is light. Dark only if explicitly toggled.
        const shouldBeDark = storedTheme === 'dark';

        setIsDarkMode(shouldBeDark);
        if (shouldBeDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }

      // 2. Auth Check
      try {
        // We use 'me' to get the current authenticated user from Supabase + DB
        // If not logged in, this usually returns a mock guest or null depending on implementation.
        // But getUserProfile('me') in database.ts falls back to MOCK_USERS if auth fails?
        // Let's verify:
        // getUserProfile('me') -> checks supabase.auth.getUser(). If user, gets from DB.
        // If no user, log warns and falls back to local storage or Mock.
        // Real logic: Check Supabase session first.
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const profile = await getUserProfile('me');
          setCurrentUser(profile);
        } else {
          // Not logged in natively.
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('obhyash_user_profile'); // Clear legacy local user
    // We do NOT clear exam history typically, so guests keep history?
    // Or we clear everything. The dashboard one cleared everything.
    localStorage.clear();
    setCurrentUser(null);
    window.location.href = '/';
  };

  // --- NAVIGATION HANDLERS (For Landing) ---
  const handleLogin = () => router.push('/login');
  const handleGetStarted = () => router.push('/signup');
  const handleHistoryClick = () => {
    // If guest has history, maybe show it? For now just no-op or login prompt
    // But we just direct to login?
    router.push('/login');
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-slate-500">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-slate-800 rounded-full animate-spin border-t-2 border-indigo-600"></div>
          Loading Obhyash...
        </div>
      </div>
    );
  }

  // --- ROUTING ---

  if (currentUser) {
    if (currentUser.role === 'Admin' || currentUser.role === 'Teacher') {
      // Redirect admin/teacher users to the admin panel
      router.push('/admin');
      return null;
    }

    // Default to Student for 'Student' or unknown roles
    return (
      <StudentRoot
        user={currentUser}
        theme={isDarkMode ? 'dark' : 'light'}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    );
  }

  // Guest -> Landing Page
  return (
    <main>
      <LandingPage
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onHistoryClick={handleHistoryClick}
        historyCount={0} // Guests start fresh or read from local?
        // For simplicity, 0. If we want guest history, we'd need to read it.
      />
    </main>
  );
}
