'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';
import {
  AlertTriangle,
  AlertCircle,
  Trash2,
  Loader2,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { isUserPro } from '@/lib/subscription-utils';

interface DeleteAccountPanelProps {
  user: UserProfile;
  onBack?: () => void;
}

export const DeleteAccountPanel: React.FC<DeleteAccountPanelProps> = ({
  user,
  onBack,
}) => {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = isUserPro(user);

  const handleDelete = async () => {
    if (confirmationText.trim() !== 'DELETE') {
      setErrorMessage('অ্যাকাউন্ট মুছতে নিশ্চিতকরণ বক্সে "DELETE" লিখো।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // 1. Call server-side delete-account API endpoint
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // Fallback: Attempt direct RPC delete_user_account from client
        const { error: rpcErr } = await supabase.rpc('delete_user_account', {
          p_reason: 'User requested deletion from web panel',
        });
        if (rpcErr) {
          const { error: dbErr } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
          if (dbErr) throw dbErr;
        }
      }

      // 2. Clear all local storage & session storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      // 3. Clear all client cookies
      try {
        document.cookie = 'obhyash_role_cache=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'obhyash_user_profile=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch (_) {}

      // 4. Sign out from Supabase Auth & server
      await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});

      toast.success('তোমার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
      window.location.href = '/login?logout=true';
    } catch (e: any) {
      console.error('Delete account error:', e);
      const msg = e?.message || 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setErrorMessage(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── Danger Hero Banner (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-7 rounded-[20px] bg-rose-50 dark:bg-[#200A0A] border border-rose-200 dark:border-rose-900/50 shadow-xs mb-5">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#B91C1C] dark:text-[#FCA5A5] font-['Anek_Bangla',sans-serif]">
              অ্যাকাউন্ট মুছে ফেলো (Delete Account)
            </h2>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/70 font-semibold">
              এই প্রক্রিয়াটি অপরিবর্তনীয় ও স্থায়ী
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          তুমি যদি তোমার অ্যাকাউন্ট মুছে ফেলো, তবে তোমার সকল পরীক্ষার রেকর্ড, মেধা তালিকা র‍্যাংক এবং প্রোফাইল তথ্য চিরতরে মুছে যাবে।
        </p>
      </div>

      {/* ── Active Subscription Warning Banner (if Pro) ── */}
      {isPro && (
        <div className="p-4 sm:p-5 rounded-[18px] bg-amber-50 dark:bg-[#261505] border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 mb-5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5 font-['Anek_Bangla',sans-serif]">
              সতর্কতা: তোমার অ্যাকাউন্টে প্রো সাবস্ক্রিপশন সক্রিয় আছে!
            </span>
            অ্যাকাউন্ট মুছে ফেললে তোমার সাবস্ক্রিপশন অবিলম্বে চিরতরে বাতিল হবে এবং এর জন্য কোনো রিফান্ড প্রযোজ্য হবে না।
          </div>
        </div>
      )}

      {/* ── Consequences Card ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-5 sm:p-6 border border-[#E5E7EB] dark:border-[#27272A] shadow-xs mb-5">
        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white mb-3.5 flex items-center gap-2 font-['Anek_Bangla',sans-serif]">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
          <span>অ্যাকাউন্ট মুছে ফেললে যা ঘটবে:</span>
        </h3>

        <div className="space-y-2.5">
          {[
            'তোমার নাম, ইমেইল ও সমস্ত ব্যক্তিগত প্রোফাইল চিরতরে মুছে যাবে।',
            'সমস্ত পরীক্ষার ইতিহাস, নম্বর, মেধা স্কোর ও স্ট্রিক রেকর্ড নষ্ট হবে।',
            'বুকমার্ক করা গুরুত্বপূর্ণ প্রশ্ন ও কাস্টম নোটস আর পুনরুদ্ধার করা যাবে না।',
            'একই ফোন নম্বর বা ইমেইল দিয়ে পরবর্তীতে লগইন করলে নতুন অ্যাকাউন্ট তৈরি হবে।',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirmation Input Card (1:1 with Flutter) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-5 sm:p-6 border border-rose-200 dark:border-rose-900/40 shadow-xs mb-5">
        <label className="block text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2 font-['Anek_Bangla',sans-serif]">
          নিশ্চিত করতে নিচের বক্সে বড় হাতের অক্ষরে <span className="font-mono font-black text-[#DC2626] dark:text-[#F87171]">&ldquo;DELETE&rdquo;</span> লিখো:
        </label>

        <input
          type="text"
          value={confirmationText}
          onChange={(e) => {
            setConfirmationText(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="DELETE"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-[14px] bg-[#F8FAFC] dark:bg-[#121214] border border-[#FCA5A5] dark:border-[#991B1B] text-base font-mono font-bold text-[#DC2626] dark:text-[#F87171] tracking-widest focus:outline-none focus:border-[#DC2626] uppercase placeholder-neutral-400"
        />

        {errorMessage && (
          <p className="text-xs font-bold text-[#EF4444] mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || confirmationText.trim() !== 'DELETE'}
            className="flex-1 py-3.5 px-5 rounded-[14px] bg-[#740A03] hover:bg-[#5C0802] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm font-['Anek_Bangla',sans-serif] flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Trash2 className="w-4.5 h-4.5" />
            )}
            <span>চিরতরে অ্যাকাউন্ট মুছুন</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="py-3.5 px-6 rounded-[14px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm font-['Anek_Bangla',sans-serif] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPanel;
