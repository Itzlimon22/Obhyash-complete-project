'use client'; // Error components must be Client Components

import { Inter, Anek_Bangla } from 'next/font/google';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const anekBangla = Anek_Bangla({
  variable: '--font-anek',
  subsets: ['bengali', 'latin'],
  display: 'swap',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${anekBangla.variable} ${inter.variable}`}>
      <body className="antialiased bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center p-6 text-center w-full max-w-lg">
          <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-100 dark:border-rose-900/50">
            <AlertOctagon size={48} />
          </div>
          <h2 className="text-2xl font-black mb-3">ক্রিটিক্যাল সিস্টেম এরর!</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed font-medium">
            অ্যাপ্লিকেশনের মূল লেআউট লোড হতে ব্যর্থ হয়েছে। সাধারণত ইন্টারনেট বা
            ক্যাশ সমস্যার কারণে এটি হতে পারে।
          </p>
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mx-auto"
          >
            <RefreshCw size={18} />
            পেজ রিলোড করুন
          </button>
        </div>
      </body>
    </html>
  );
}
