'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AUTH_SYSTEM_MODE } from '@/lib/constants/auth-config';
import MinimalAuthPage from '@/components/auth/MinimalAuthPage';
import ClassicSignupPage from '@/components/auth/ClassicSignupPage';
import { Loader2 } from 'lucide-react';

function SignupRouter() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');

  // URL query parameter ?mode=classic or ?mode=minimal overrides default config
  const activeMode = urlMode === 'classic' || urlMode === 'minimal' ? urlMode : AUTH_SYSTEM_MODE;

  if (activeMode === 'classic') {
    return <ClassicSignupPage />;
  }

  return <MinimalAuthPage />;
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f15]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      }
    >
      <SignupRouter />
    </Suspense>
  );
}
