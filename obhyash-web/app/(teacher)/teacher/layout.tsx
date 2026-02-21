'use client';

import React from 'react';
import TeacherSidebar from '@/components/teacher/layout/TeacherSidebar';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
