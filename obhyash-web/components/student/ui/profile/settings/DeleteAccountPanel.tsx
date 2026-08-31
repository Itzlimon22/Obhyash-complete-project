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

  const isPro = user.level?.toLowerCase().includes('pro') ?? false;

  const handleDelete = async () => {
    if (confirmationText.trim() !== 'DELETE') {
      setErrorMessage('অ্যাকাউন্ট মুছতে নিশ্চিতকরণ বক্সে "DELETE" লিখো।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // 1. Call secure RPC delete_user_account
      try {
        const { error: rpcErr } = await supabase.rpc('delete_user_account', {
          p_reason: 'User requested deletion from web',
        });
        if (rpcErr) throw rpcErr;
      } catch (rpcErr) {
        console.warn('RPC delete_user_account failed, attempting fallback deletion:', rpcErr);
        // Fallback: Delete from public.users directly
        const { error: dbErr } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        if (dbErr) throw dbErr;
      }

      // 2. Clear local storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      // 3. Sign out from Supabase Auth
      await supabase.auth.signOut();

      toast.success('তোমার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
      router.push('/login');
    } catch (e: any) {
      console.error('Delete account error:', e);
      const msg = e?.message || 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setErrorMessage(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-3 font-['HindSiliguri',sans-serif] pb-24 animate-in fade-in duration-200">
      {/* ── Top Header / Back ── */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সেটিংসে ফিরে যাও</span>
        </button>
      )}

      {/* ── Danger Hero Banner (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-7 rounded-[24px] bg-red-50 dark:bg-[#200A0A] border border-red-200 dark:border-red-900/50 shadow-sm mb-5">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-red-700 dark:text-red-400">
              অ্যাকাউন্ট মুছে ফেলো (Delete Account)
            </h2>
            <p className="text-xs text-red-600/80 dark:text-red-300/70 font-semibold">
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
        <div className="p-4 sm:p-5 rounded-[20px] bg-amber-50 dark:bg-[#261505] border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 mb-5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
            <span className="font-black text-amber-700 dark:text-amber-400 block mb-0.5">
              সতর্কতা: তোমার অ্যাকাউন্টে প্রো সাবস্ক্রিপশন সক্রিয় আছে!
            </span>
            অ্যাকাউন্ট মুছে ফেললে তোমার সাবস্ক্রিপশন অবিলম্বে চিরতরে বাতিল হবে এবং এর জন্য কোনো রিফান্ড প্রযোজ্য হবে না।
          </div>
        </div>
      )}

      {/* ── Consequences Card ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[22px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-5">
        <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white mb-3.5 flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirmation Input Card (1:1 with Flutter) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[22px] p-5 sm:p-6 border border-red-200 dark:border-red-900/40 shadow-xs mb-5">
        <label className="block text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          নিশ্চিত করতে নিচের বক্সে বড় হাতের অক্ষরে <span className="font-mono font-black text-red-600 dark:text-red-400">"DELETE"</span> লিখো:
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
          className="w-full py-3 px-4 rounded-[14px] bg-neutral-50 dark:bg-[#202024] border border-neutral-300 dark:border-neutral-700 text-base font-mono font-black text-neutral-900 dark:text-white tracking-widest focus:outline-none focus:border-red-500 uppercase placeholder-neutral-400"
        />

        {errorMessage && (
          <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || confirmationText.trim() !== 'DELETE'}
            className="flex-1 py-3.5 px-5 rounded-[16px] bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 active:scale-[0.99] cursor-pointer"
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
              className="py-3.5 px-6 rounded-[16px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
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
