'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import StudentRoot from '@/components/student/StudentRoot';
import { UserProfile } from '@/lib/types';

interface DashboardClientProps {
  user: UserProfile;
  subjects?: any[]; // Using any[] for now or define Subject type if available
}

export default function DashboardClient({
  user,
  subjects = [],
}: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as 'light' | 'dark';
      return stored || 'light';
    }
    return 'light';
  });

  // Cache user profile locally for instant loading on next visit
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('obhyash_user_profile', JSON.stringify(user));
    }
  }, [user]);

  // Load theme from local storage or preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    // Clear cached data on logout
    sessionStorage.removeItem('obhyash_active_tab');
    localStorage.removeItem('obhyash_user_profile');
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/');
  };

  return (
    <StudentRoot
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
      subjects={subjects}
    />
  );
}
