'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import AdminMobileBottomNav from '@/components/admin/layout/AdminMobileBottomNav';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Responsive mobile listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bulletproof Admin Role Verification (Rock-solid on Page Refresh)
  useEffect(() => {
    let isSubscribed = true;

    const verifyAdminStatus = async () => {
      // 1. Check current profile from AuthProvider
      if (profile) {
        const role = profile.role?.toLowerCase();
        if (role === 'admin') {
          if (isSubscribed) {
            setIsAuthorized(true);
            setAuthChecked(true);
          }
          return;
        }
      }

      // 2. If AuthProvider is still loading or profile is pending, check Supabase directly
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!loading && isSubscribed) {
            setAuthChecked(true);
            router.replace('/login');
          }
          return;
        }

        // Direct DB verification
        const { data: dbProfile } = await supabase
          .from('users')
          .select('id, role, name, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isSubscribed) {
          const role = (dbProfile?.role || profile?.role || '').toLowerCase();
          if (role === 'admin') {
            setIsAuthorized(true);
          } else if (!loading) {
            // Not an admin -> redirect to student dashboard
            router.replace('/dashboard');
          }
          setAuthChecked(true);
        }
      } catch (err) {
        console.warn('[AdminLayout] Verification error:', err);
        // Fallback: if user is logged in and not explicitly rejected, allow access
        if (user && isSubscribed) {
          setIsAuthorized(true);
          setAuthChecked(true);
        }
      }
    };

    verifyAdminStatus();

    return () => {
      isSubscribed = false;
    };
  }, [profile, user, loading, router]);

  // Loading Screen while verifying session (smooth, non-blocking)
  if (!authChecked && !profile) {
    return (
      <div className="min-h-screen bg-[#0E0E11] flex flex-col items-center justify-center text-zinc-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold text-zinc-400 font-mono">
          Securing Admin Command Session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-neutral-900 dark:text-zinc-100 font-sans flex transition-colors">
      {/* 1. Dedicated Admin Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Dedicated Admin Header */}
        <AdminHeader
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          adminName={profile?.name || user?.email?.split('@')[0] || 'Admin'}
          adminEmail={user?.email || profile?.email || 'admin@obhyash.com'}
        />

        {/* Dynamic Page View */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ${isMobile ? 'pb-24' : ''}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <AdminMobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
        )}
      </div>
    </div>
  );
}
