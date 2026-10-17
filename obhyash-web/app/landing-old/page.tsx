'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LandingPageOld from '@/components/landing/LandingPageOld';

export default function LandingOldPage() {
  const router = useRouter();

  return (
    <div className="dark bg-black min-h-screen text-neutral-100">
      <LandingPageOld
        onGetStarted={() => router.push('/auth/register')}
        onLogin={() => router.push('/auth/login')}
      />
    </div>
  );
}
