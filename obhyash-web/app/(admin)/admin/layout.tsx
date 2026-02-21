'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import AdminMobileBottomNav from '@/components/admin/layout/AdminMobileBottomNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State to manage the sidebar's open/close status
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Effect to handle responsive behavior (Mobile vs Desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // 1024px is standard "Large Tablet/Laptop" breakpoint
        setIsMobile(true);
        setIsSidebarOpen(false); // Default to closed on mobile
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true); // Default to open on desktop
      }
    };

    // Run on mount
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white font-sans flex">
      {/* 1. The Sidebar (Fixed Left) */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      {/* 2. The Main Content Wrapper */}
      {/* This div slides left/right based on the sidebar state.
         ml-64 = 256px (Full Sidebar)
         ml-20 = 80px (Mini Sidebar)
         ml-0  = Mobile (Sidebar is an overlay)
      */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* 3. The Header (Sticky Top) */}
        {/* We pass the toggle function so the Mobile Menu button works */}
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* 4. The Page Content */}
        <main
          className={`flex-1 min-w-0 p-6 overflow-x-hidden ${isMobile ? 'pb-24' : ''}`}
        >
          {children}
        </main>

        {/* 5. Mobile Bottom Navigation */}
        {isMobile && (
          <AdminMobileBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
        )}
      </div>

      {/* Mobile Overlay (Darkens background when sidebar is open on mobile) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
