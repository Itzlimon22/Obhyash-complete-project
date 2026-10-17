'use client';

import React, { Suspense } from 'react';
import MinimalAuthPage from '@/components/auth/MinimalAuthPage';
import { Loader2 } from 'lucide-react';

export default function AuthResisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f15]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      }
    >
      <MinimalAuthPage defaultMode="register" />
    </Suspense>
  );
}
