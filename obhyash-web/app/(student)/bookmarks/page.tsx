'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem('obhyash_active_tab', 'bookmarks');
    router.replace('/dashboard');
  }, [router]);

  return null;
}
