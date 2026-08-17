'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function NetworkStatusListener() {
  useEffect(() => {
    const handleOffline = () => {
      toast.error('ইন্টারনেট সংযোগ বিচ্ছিন্ন, অনুগ্রহ করে নেট কানেকশন চেক করো', {
        id: 'network-status',
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      toast.success('ইন্টারনেট সংযোগ ফিরে এসেছে!', {
        id: 'network-status',
        duration: 3000,
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
