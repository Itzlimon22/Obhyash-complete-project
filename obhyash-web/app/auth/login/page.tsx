'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AUTH_SYSTEM_MODE } from '@/lib/constants/auth-config';
import MinimalAuthPage from '@/components/auth/MinimalAuthPage';
import ClassicLoginPage from '@/components/auth/ClassicLoginPage';
import { Loader2 } from 'lucide-react';

function AuthLoginRouter() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');

  // URL query parameter ?mode=classic or ?mode=minimal overrides default config
  const activeMode = urlMode === 'classic' || urlMode === 'minimal' ? urlMode : AUTH_SYSTEM_MODE;

  if (activeMode === 'classic') {
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
