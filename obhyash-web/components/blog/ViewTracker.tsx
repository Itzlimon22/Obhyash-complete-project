'use client';

import { useEffect, useRef } from 'react';
import { trackUserView } from '@/lib/blog-recommendations';
import { markPostAsRead } from '@/hooks/use-read-history';

export default function ViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tracked.current) {
        trackUserView(slug);
        markPostAsRead(slug); // persist to localStorage for read-history indicator
        tracked.current = true;
      }
    }, 5000); // Wait 5 seconds to ensure it's a real view

    return () => clearTimeout(timer);
  }, [slug]);

  return null; // Invisible component
}
