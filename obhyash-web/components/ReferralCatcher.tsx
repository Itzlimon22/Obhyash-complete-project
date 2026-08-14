'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralCatcher() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Save it globally for the signup page
      localStorage.setItem('referralCode', ref);
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}
