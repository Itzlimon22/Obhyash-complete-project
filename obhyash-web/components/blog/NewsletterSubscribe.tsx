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
    <div className="mt-16 w-full max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-100 dark:border-rose-900/30 p-8 sm:p-10 font-anek text-center shadow-sm">
      <div className="w-14 h-14 bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-6 h-6 text-rose-500" />
      </div>

      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
        আমাদের নিউজলেটারে যোগ দিন
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed text-[15px]">
        প্রতি সপ্তাহে সেরা স্টাডি টিপস, রুটিন এবং অভ্যাস একাডেমি এর এক্সক্লুসিভ
        আপডেটগুলো সরাসরি আপনার ইনবক্সে পেতে আজই সাবস্ক্রাইব করুন।
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative group"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="আপনার ইমেইল এড্রেস লিখুন..."
          className="flex-1 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:focus:ring-rose-500/30 transition-all text-[15px] shadow-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              সাবস্ক্রাইব <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        আমরা স্প্যাম মেইল পাঠাই না। আপনি যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।
      </p>
    </div>
  );
}
