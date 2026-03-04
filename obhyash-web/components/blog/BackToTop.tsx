'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="উপরে স্ক্রল করুন"
      className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
