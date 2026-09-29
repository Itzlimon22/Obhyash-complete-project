'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './LandingPage';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function LandingPageClient() {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Fixed dark mode on landing page: only dark, no toggle
    setTheme('dark');
    document.documentElement.classList.add('dark');
  }, [setTheme]);

  return (
    <div className="dark bg-black min-h-screen text-neutral-100">
      <LandingPage
        onGetStarted={() => router.push('/signup')}
        onLogin={() => router.push('/login')}
      />
    </div>
  );
}

