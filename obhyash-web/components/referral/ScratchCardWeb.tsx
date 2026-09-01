'use client';

import React, { useState } from 'react';
import { Gift, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ScratchCardWebProps {
  card: {
    id: string;
    is_scratched: boolean;
    reward_type?: string;
  };
  onRevealed: () => void;
}

export const ScratchCardWeb: React.FC<ScratchCardWebProps> = ({ card, onRevealed }) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [localReward, setLocalReward] = useState<string | null>(card.reward_type || null);
  const [isScratched, setIsScratched] = useState(card.is_scratched);

  const supabase = createClient();

  const handleReveal = async () => {
    if (isScratched || isRevealing) return;

    setIsRevealing(true);
    try {
      const { data, error } = await supabase.rpc('reveal_scratch_card_tx', {
        p_card_id: card.id,
      });

      if (error) throw error;

      setLocalReward(data as string);
      setIsScratched(true);
      toast.success('অভিনন্দন! আপনি একটি নতুন পুরস্কার পেয়েছেন!');
      onRevealed();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'পুরস্কার খুলতে সমস্যা হয়েছে।');
    } finally {
      setIsRevealing(false);
    }
  };

  const getRewardTitle = (type: string | null) => {
    switch (type) {
      case '1_month_free':
        return '১ মাস ফ্রি প্রিমিয়াম!';
      case '2_months_free':
        return '২ মাস ফ্রি প্রিমিয়াম!';
      case '3_months_free':
        return '৩ মাস ফ্রি প্রিমিয়াম!';
      case '50_percent_off':
        return 'যেকোনো প্ল্যানে ৫০% ছাড়!';
      default:
        return 'পুরস্কার';
    }
  };

  if (isScratched) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl">
        <CheckCircle2 className="w-10 h-10 text-slate-400 mb-3" />
        <p className="font-bold text-slate-500 dark:text-slate-400">ব্যবহৃত</p>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
          {getRewardTitle(localReward)}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleReveal}
      disabled={isRevealing}
      className="relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl hover:scale-105 transition-transform disabled:opacity-80 disabled:hover:scale-100 border border-yellow-300 shadow-xl shadow-yellow-500/20 w-full"
    >
      {isRevealing ? (
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      ) : (
        <>
          <Gift className="w-10 h-10 text-white mb-3" />
          <p className="font-bold text-white text-lg font-anek">খুলতে ক্লিক করুন</p>
        </>
      )}
    </button>
  );
};
