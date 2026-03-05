'use client';

import { useState, FormEvent } from 'react';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      toast.success(data.message);
      setEmail('');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'সাবস্ক্রাইব করতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-100 dark:border-rose-900/30 px-5 py-5 sm:px-8 sm:py-6 font-anek shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-white dark:bg-[#121212] rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
              নিউজলেটারে যোগ দিন
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              নতুন পোস্ট প্রকাশ হলে সরাসরি ইমেইলে পাবেন
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 w-full sm:w-auto sm:shrink-0"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ইমেইল ঠিকানা..."
            className="flex-1 min-w-0 sm:w-52 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-[14px]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="shrink-0 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 text-[14px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">সাবস্ক্রাইব</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
