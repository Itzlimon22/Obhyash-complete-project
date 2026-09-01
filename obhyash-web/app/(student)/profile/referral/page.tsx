'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift } from 'lucide-react';
import ReferralView from '@/components/student/features/referral/ReferralView';

export default function StudentReferralPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans pb-16">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ড্যাশবোর্ডে ফিরে যাও</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Gift className="w-3.5 h-3.5" />
            <span>রেফারেল ড্যাশবোর্ড</span>
          </div>
        </div>
      </div>

      {/* Main Internal Referral Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <ReferralView />
      </main>
    </div>
  );
}
