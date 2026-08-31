'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountInfoAliasPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem('obhyash_active_tab', 'account-info');
    router.replace('/dashboard');
  }, [router]);

  return null;
}
