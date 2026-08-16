'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import AdminMobileBottomNav from '@/components/admin/layout/AdminMobileBottomNav';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = useAdminAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-neutral-900 dark:text-zinc-100 font-sans flex transition-colors">
      {/* Dedicated Admin Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      {/* Main Administrative Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Dedicated Admin Header */}
        <AdminHeader
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          adminName={profile?.name || user?.email?.split('@')[0] || 'Super Admin'}
          adminEmail={profile?.email || user?.email || 'admin@obhyash.com'}
        />

        {/* Dynamic Page Workspace */}
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
