'use client';

import TeacherSidebar from '@/components/teacher/layout/TeacherSidebar';
import { useSessionMonitor } from '@/hooks/use-session-monitor';
import { useDeviceSession } from '@/hooks/use-device-session';
import { ManageDevicesModal } from '@/components/auth/ManageDevicesModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Multi-device session monitor - keeps the Supabase Realtime connection warm
  useSessionMonitor({
    userId: profile?.id || user?.id,
    onForcedSignOut: signOut,
  });

  // Device session limiting (Netflix-style)
  const deviceSession = useDeviceSession(profile?.id || user?.id);

  // Redirect if definitely not a teacher once loading is done
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/login');
    } else if (
      mounted &&
      !loading &&
      user &&
      profile &&
      profile.role !== 'Teacher'
    ) {
      // If admin, they might be visiting. But if not teacher/admin, redirect
      if (profile.role === 'Student') router.replace('/dashboard');
      else if (profile.role === 'Admin') {
        // Allow admin for now? Or keep separate.
        // For strictness, if this is teacher-only layout:
        // router.replace('/admin/dashboard');
      }
    }
  }, [mounted, loading, user, profile, router]);

  // Loading state for initial session hydration
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-neutral-500 animate-pulse">
            রিসেট হচ্ছে সেশন (Restoring Session)...
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash before redirect
  if (
    !user ||
    (profile && profile.role !== 'Teacher' && profile.role !== 'Admin')
  ) {
    return null;
  }

  return (
    <>
      {deviceSession.blocked && deviceSession.limitData && (
        <ManageDevicesModal
          open={true}
          limit={deviceSession.limitData.limit}
          plan={deviceSession.limitData.plan}
          initialDevices={deviceSession.limitData.devices as never}
          onDeviceRemoved={() => window.location.reload()}
        />
      )}
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
    </>
  );
}
