'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';

import LandingPage from '@/components/landing/LandingPage';
import StudentRoot from '@/components/student/StudentRoot';
import InitialLoader from '@/components/student/ui/InitialLoader';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- INITIALIZATION ---
  // 2. Auth Check - Now handled by AuthProvider, but we keep the initial check
  // for faster first-paint on refresh if needed, however, useAuth is preferred.
  // We'll trust the AuthProvider for the main state but keep init for theme/mounting.
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const shouldBeDark = storedTheme === 'dark';
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync auth state from AuthProvider
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      setCurrentUser(profile);
      setLoading(false);
    }
  }, [profile, authLoading]);

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

  if (!mounted) return null;

  if (loading) {
    return <InitialLoader />;
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
      />
    </main>
  );
}
