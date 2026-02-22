'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100 dark:border-red-900/50">
        <AlertOctagon size={48} />
      </div>
      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">
        দুঃখিত! অপ্রত্যাশিত কিছু ঘটেছে।
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed font-medium">
        আমাদের সিস্টেমে সাময়িক সমস্যা হয়েছে অথবা আপনার ইন্টারনেট সংযোগ
        বিচ্ছিন্ন হতে পারে। দয়া করে আবার চেষ্টা করুন।
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <Button
          onClick={() => reset()}
          size="lg"
          className="w-full sm:w-auto px-8 rounded-xl font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all active:scale-95"
        >
          <RefreshCw size={18} />
          আবার চেষ্টা করুন
        </Button>
        <Link
          href="/"
          className="w-full sm:w-auto px-8 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 h-11"
        >
          <Home size={18} />
          হোমপেজে যান
        </Link>
      </div>

      {/* Dev-only error stack trace mapping */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 w-full max-w-3xl bg-neutral-950 dark:bg-black rounded-2xl p-6 text-left overflow-auto border border-neutral-800 shadow-2xl">
          <p className="text-red-400 font-mono text-sm mb-3 font-bold flex items-center gap-2">
            <AlertOctagon size={16} /> Error Details (Dev Only):
          </p>
          <pre className="text-neutral-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            <span className="text-red-300 font-bold">{error.name}: </span>
            {error.message}
            {'\n\n'}
            <span className="opacity-70">{error.stack}</span>
            {error.digest && (
              <div className="mt-4 pt-4 border-t border-neutral-800 text-neutral-500">
                Digest: {error.digest}
              </div>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
