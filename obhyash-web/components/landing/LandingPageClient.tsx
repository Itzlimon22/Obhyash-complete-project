'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './LandingPage';

export default function LandingPageClient() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const dark = stored === 'dark';
      setIsDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <LandingPage
      onGetStarted={() => router.push('/signup')}
      onLogin={() => router.push('/login')}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    />
  );
}
