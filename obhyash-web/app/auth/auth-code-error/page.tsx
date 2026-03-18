import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2rem] p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-neutral-800 dark:text-white mb-3 tracking-tight">
          অথেন্টিকেশন ত্রুটি!
        </h1>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
          আপনার অথেন্টিকেশন লিঙ্কটি অবৈধ অথবা মেয়াদ শেষ হয়ে গেছে। দয়া করে আবার চেষ্টা করুন।
        </p>
        
        <div className="space-y-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            আবার লগইন করো
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম পেজে ফিরে যাও
          </Link>
        </div>
      </div>
    </div>
  );
}
