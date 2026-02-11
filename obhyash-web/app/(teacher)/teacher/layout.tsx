'use client';

import React from 'react';
import TeacherSidebar from '@/components/teacher/layout/TeacherSidebar';
import { Header } from '@/components/layout/header'; // Named import

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <TeacherSidebar />
      <div className="lg:pl-72 transition-all duration-300">
        <Header toggleSidebar={() => {}} /> {/* Pass dummy prop for now */}
        <main className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
