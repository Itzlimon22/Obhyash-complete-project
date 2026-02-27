'use client';

import { useEffect, useState } from 'react';

export default function ProgressBar() {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.body.scrollHeight;
      const windowHeight = window.innerHeight;

      if (scrollHeight === windowHeight) {
        setReadingProgress(100);
      } else {
        const progress = (currentScrollY / (scrollHeight - windowHeight)) * 100;
        // Clamp between 0 and 100
        setReadingProgress(Math.min(Math.max(progress, 0), 100));
      }
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    // Trigger once on mount
    updateScrollProgress();

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[60] bg-transparent pointer-events-none">
      <div
        className="h-full bg-rose-500 rounded-r-full transition-all duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
    </div>
  );
}
