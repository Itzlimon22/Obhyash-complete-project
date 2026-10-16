'use client';

import React, { Suspense } from 'react';
import { useAuthSystemMode } from '@/lib/auth-system-mode';
import MinimalAuthPage from '@/components/auth/MinimalAuthPage';
import ClassicLoginPage from '@/components/auth/ClassicLoginPage';
import { Loader2 } from 'lucide-react';

function AuthLoginRouter() {
  const { mode } = useAuthSystemMode();

  if (mode === 'classic') {
    return <ClassicLoginPage />;
  }

  return <MinimalAuthPage defaultMode="login" />;
}

export default function AuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f15]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      }
    >
      <AuthLoginRouter />
    </Suspense>
  );
}
