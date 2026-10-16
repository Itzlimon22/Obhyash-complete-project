'use client';

import React, { Suspense } from 'react';
import { useAuthSystemMode } from '@/lib/auth-system-mode';
import MinimalAuthPage from '@/components/auth/MinimalAuthPage';
import ClassicSignupPage from '@/components/auth/ClassicSignupPage';
import { Loader2 } from 'lucide-react';

function SignupRouter() {
  const { mode } = useAuthSystemMode();

  if (mode === 'classic') {
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
