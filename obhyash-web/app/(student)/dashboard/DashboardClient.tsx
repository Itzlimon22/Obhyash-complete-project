'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import StudentRoot from '@/components/student/StudentRoot';
import { UserProfile } from '@/lib/types';
import { useTheme } from '@/components/providers/ThemeProvider';

interface DashboardClientProps {
  user: UserProfile;
  subjects?: any[];
}

export default function DashboardClient({
  user,
  subjects = [],
}: DashboardClientProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Sync user profile locally for instant loading on next visit
  useEffect(() => {
    if (user && user.id) {
      const currentCache = localStorage.getItem('obhyash_user_profile');
      const userDataStr = JSON.stringify(user);

      if (currentCache !== userDataStr) {
        localStorage.setItem('obhyash_user_profile', userDataStr);
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
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
