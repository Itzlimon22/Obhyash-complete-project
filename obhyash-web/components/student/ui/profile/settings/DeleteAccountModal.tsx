'use client';

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface DeleteAccountModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccessLogout?: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  user,
  onClose,
  onSuccessLogout,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro =
    Boolean(user?.level?.toLowerCase().includes('pro')) ||
    Boolean((user as any)?.is_pro);

  const handleDelete = async () => {
    if (confirmText.trim() !== 'DELETE') {
      setErrorMessage('অ্যাকাউন্ট মুছতে নিশ্চিতকরণ বক্সে "DELETE" লিখো।');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // Call secure RPC if present, or fallback to user delete
      try {
        const { error: rpcErr } = await supabase.rpc('delete_user_account', {
          p_reason: 'User requested deletion',
        });
        if (rpcErr) throw rpcErr;
      } catch (rpcErr) {
        console.warn('RPC delete failed, falling back to db delete:', rpcErr);
        const { error: dbErr } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        if (dbErr) throw dbErr;
      }

      // Clear local storage and sign out
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      await supabase.auth.signOut();

      toast.success('তোমার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
      onClose();

      if (onSuccessLogout) {
        onSuccessLogout();
      } else {
        window.location.href = '/login';
      }
    } catch (e: any) {
      console.error('Delete account error:', e);
      const msg =
        e?.message || 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#13151F] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-neutral-200/80 dark:border-white/10 font-['HindSiliguri',sans-serif] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-11 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4" />

        {/* Danger Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] dark:bg-[#450A0A] border border-[#FECACA] dark:border-[#991B1B] flex items-center justify-center text-[#DC2626] shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#B91C1C] dark:text-[#FCA5A5] leading-tight">
              অ্যাকাউন্ট মুছে ফেলো (Delete Account)
            </h3>
            <p className="text-[12.5px] text-neutral-500 dark:text-[#94A3B8] mt-0.5">
              এই প্রক্রিয়াটি অপরিবর্তনীয় ও স্থায়ী
            </p>
          </div>
        </div>

        {/* Active Pro Subscription Warning Banner */}
        {isPro && (
          <div className="p-3.5 mb-4 rounded-[14px] bg-[#FFFBEB] dark:bg-[#3B1D04] border border-[#FDE68A] dark:border-[#B45309] flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-[#92400E] dark:text-[#FDE68A] leading-relaxed">
              সতর্কতা: তোমার অ্যাকাউন্টে প্রো সাবস্ক্রিপশন সক্রিয় আছে। অ্যাকাউন্ট মুছে ফেললে সাবস্ক্রিপশন চিরতরে বাতিল হবে এবং এর জন্য কোনো রিফান্ড প্রযোজ্য হবে না।
            </p>
          </div>
        )}

        {/* Consequences Bullet Points */}
        <div className="space-y-2 mb-5">
          <p className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
            অ্যাকাউন্ট মুছে ফেললে যা ঘটবে:
          </p>
          <ul className="space-y-2 text-[12.5px] text-neutral-600 dark:text-[#CBD5E1] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#F87171] mt-1.5 shrink-0" />
              <span>তোমার নাম, ইমেইল ও সমস্ত ব্যক্তিগত প্রোফাইল চিরতরে মুছে যাবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#F87171] mt-1.5 shrink-0" />
              <span>সমস্ত পরীক্ষার ইতিহাস, নম্বর, মেধা স্কোর ও স্ট্রিক রেকর্ড নষ্ট হবে।</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#F87171] mt-1.5 shrink-0" />
              <span>সংরক্ষিত বুকমার্ক, স্টাডি নোট ও স্ক্র্যাচ কার্ড মুছে যাবে।</span>
            </li>
          </ul>
        </div>

        {/* Confirmation Text Box */}
        <div className="space-y-2 mb-5">
          <label className="block text-[13px] font-bold text-neutral-900 dark:text-white">
            নিশ্চিত করতে নিচে &ldquo;DELETE&rdquo; লিখো:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="DELETE"
            className="w-full px-3.5 py-3 rounded-[12px] bg-[#F8FAFC] dark:bg-[#1E2235] border border-[#FCA5A5] dark:border-[#991B1B] text-sm font-mono font-bold tracking-widest text-[#DC2626] dark:text-[#F87171] placeholder-neutral-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          {errorMessage && (
            <p className="text-xs font-bold text-[#EF4444] mt-1">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-3.5 rounded-[14px] border border-neutral-300 dark:border-white/20 text-neutral-700 dark:text-white font-bold text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            বাতিল করো
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || confirmText.trim() !== 'DELETE'}
            className="py-3.5 rounded-[14px] bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>হ্যাঁ, মুছে ফেলো</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
