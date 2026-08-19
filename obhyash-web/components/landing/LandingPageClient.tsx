'use client';

import { useRouter } from 'next/navigation';
import LandingPage from './LandingPage';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function LandingPageClient() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  return (
    <LandingPage
      onGetStarted={() => router.push('/signup')}
      onLogin={() => router.push('/login')}
      isDarkMode={isDark}
      toggleTheme={toggleTheme}
    />
  );
}
