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
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safety timeout: if we're stuck loading for more than 8 seconds, show an error
  useEffect(() => {
    if (loading || (!profile && user)) {
      const timer = setTimeout(() => setShowTimeoutError(true), 8000);
      return () => clearTimeout(timer);
    } else {
      // Defer state reset to avoid synchronous cascading render warning
      const resetTimer = setTimeout(() => setShowTimeoutError(false), 0);
      return () => clearTimeout(resetTimer);
    }
  }, [loading, profile, user]);

  // Redirect if definitely not an admin once loading is done
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (
      !loading &&
      user &&
      profile &&
      profile.role?.toLowerCase() !== 'admin'
    ) {
      // If not an admin, send to appropriate home or error
      const role = profile.role?.toLowerCase();
      if (role === 'student') router.replace('/dashboard');
      else if (role === 'teacher') router.replace('/teacher/dashboard');
      else router.replace('/');
    }
  }, [loading, user, profile, router]);

  // Loading state for initial session hydration
  if (loading || !user || !profile || profile.role?.toLowerCase() !== 'admin') {
    const isProfileMissing = !loading && user && !profile;
    const shouldShowError = showTimeoutError || isProfileMissing;

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {shouldShowError ? (
            <div className="text-center space-y-4">
              <p className="text-sm font-bold text-red-500">
                {isProfileMissing 
                  ? "Admin profile not found or access denied." 
                  : "Session restore timed out."}
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-md text-sm font-medium"
                >
                  Retry
                </button>
                <button 
                  onClick={async () => {
                    const { createClient } = await import('@/utils/supabase/client');
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          )}
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
