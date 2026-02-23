import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DeactivatedPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        setLoading(false);
      }
    };

    handleSignOut();
  }, [supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-black px-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 rounded-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-500" />

        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 md:p-10 relative text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">
            অ্যাকাউন্ট নিষ্ক্রিয়
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            আপনার অ্যাকাউন্ট সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে অথবা সাসপেন্ড করা
            হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className={`group w-full bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  সাইন আউট করা হচ্ছে...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  লগইন পেজে ফিরে যান
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
