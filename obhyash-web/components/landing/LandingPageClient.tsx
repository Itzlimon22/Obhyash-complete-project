'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Landing from './Landing';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function LandingPageClient() {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Fixed dark mode on landing page: only dark, no toggle
    setTheme('dark');
    document.documentElement.classList.add('dark');
  }, [setTheme]);

  const handleStart = () => {
    router.push('/auth/login');
  };

  return (
    <div className="dark bg-[#0a0b0b] min-h-screen text-white landing-root font-kalpurush">
      <Landing onStart={handleStart} />
    </div>
  );
}
