'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import AdminMobileBottomNav from '@/components/admin/layout/AdminMobileBottomNav';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if definitely not an admin once loading is done
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/login');
    } else if (
      mounted &&
      !loading &&
      user &&
      profile &&
      profile.role !== 'Admin'
    ) {
      // If not an admin, send to appropriate home or error
      if (profile.role === 'Student') router.replace('/dashboard');
      else if (profile.role === 'Teacher') router.replace('/teacher/dashboard');
      else router.replace('/');
    }
  }, [mounted, loading, user, profile, router]);

  // Loading state for initial session hydration
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-neutral-500 animate-pulse">
            Restoring Admin Session...
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash before redirect.
  // Wait for BOTH user AND profile to be confirmed before rendering children.
  // If only user is set but profile is still null (still being fetched), we wait —
  // this prevents data-fetching useEffects from firing before auth is complete.
  // NOTE: return the spinner (not null) so the admin never sees a blank screen if
  // the profile DB fetch failed or is still in-flight after loading resolves.
  if (!user || !profile || profile.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-neutral-500 animate-pulse">
            Restoring Admin Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white font-sans flex">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main
          className={`flex-1 min-w-0 p-6 overflow-x-hidden ${isMobile ? 'pb-24' : ''}`}
        >
          {children}
        </main>
        {isMobile && (
          <AdminMobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
        )}
      </div>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
