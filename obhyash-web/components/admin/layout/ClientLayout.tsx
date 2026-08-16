'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import AdminMobileBottomNav from '@/components/admin/layout/AdminMobileBottomNav';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ShieldAlert, ArrowLeft, LogIn, Sparkles } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isLoading, isAuthorized, authError, signOut } = useAdminAuth();
  const router = useRouter();
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

  // 1. Premium Loading State (Obsidian Glass Skeleton)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-zinc-300 p-6">
        <div className="relative flex flex-col items-center gap-6 max-w-sm text-center">
          {/* Pulsing Emerald Crest */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#004633] to-[#00664B] border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-950/60 animate-pulse">
              <span className="text-white font-black text-2xl font-mono">O</span>
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-emerald-500/10 blur-xl animate-pulse pointer-events-none" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              অভ্যাস কমান্ড সেন্টার
            </h3>
            <p className="text-xs text-zinc-400 font-mono flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Verifying Administrative Credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthorized / Access Denied State (Clean, helpful screen)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-zinc-300 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert size={32} strokeWidth={2.2} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">
              অ্যাডমিন অ্যাক্সেস প্রয়োজন
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {authError ||
                'এই পেজে প্রবেশের জন্য আপনার অ্যাকাউন্টে অ্যাডমিনিস্ট্রেটর অনুমতি প্রয়োজন। অনুগ্রহ করে অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।'}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-[#004633] hover:bg-[#005a42] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              <span>লগইন করুন (Admin Login)</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full py-3 px-4 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700/60 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>শিক্ষার্থী ড্যাশবোর্ডে ফিরে যান</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Super Admin Layout
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
