'use client';

import TeacherSidebar from '@/components/teacher/layout/TeacherSidebar';
import { useSessionMonitor } from '@/hooks/use-session-monitor';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, signOut } = useAuth();

  // Multi-device session monitor - keeps the Supabase Realtime connection warm
  useSessionMonitor({
    userId: profile?.id || user?.id,
    onForcedSignOut: signOut,
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <TeacherSidebar />
      {/* Main content area offset by sidebar width */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top spacer for mobile menu button */}
        <div className="h-14 lg:h-0" />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto min-w-0 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
