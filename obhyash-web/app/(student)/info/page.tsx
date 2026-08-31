'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountInfoPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem('obhyash_active_tab', 'account-info');
    router.replace('/dashboard');
  }, [router]);

  return null;
}
