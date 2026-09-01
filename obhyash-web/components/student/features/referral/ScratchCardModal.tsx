'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PartyPopper, X, Loader2, Gift } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ScratchCardModalProps {
  cardId: string;
  onClose: () => void;
  onScratched: () => void;
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  cardId,
  onClose,
  onScratched,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardTitle, setRewardTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const scratchedPixels = useRef(0);

  const getRewardTitle = (type: string | null) => {
    switch (type) {
      case '1_month_free':
        return '১ মাসের ফ্রি প্রিমিয়াম!';
      case '2_months_free':
        return '২ মাসের ফ্রি প্রিমিয়াম!';
      case '3_months_free':
        return '৩ মাসের ফ্রি প্রিমিয়াম!';
      case '50_percent_off':
        return 'যেকোনো প্ল্যানে ৫০% ছাড়!';
      default:
        return '১ মাসের ফ্রি প্রিমিয়াম!';
    }
  };

  const revealReward = async () => {
    if (isProcessing || isRevealed) return;
    setIsProcessing(true);

    try {
      const supabase = createClient();
      const { data: res, error } = await supabase.rpc('reveal_scratch_card_tx', {
        p_card_id: cardId,
      });

      if (error) throw error;

      const title = getRewardTitle(res?.toString() || '1_month_free');
      setRewardTitle(title);
      setIsRevealed(true);
      toast.success(`অভিনন্দন! তুমি পেয়েছো: ${title}`);
      onScratched();
    } catch (err: any) {
      console.error('Error revealing scratch card:', err);
      setErrorMessage('পুরস্কার খুলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with silver-gold metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#D1D5DB');
    gradient.addColorStop(0.5, '#E5E7EB');
    gradient.addColorStop(1, '#9CA3AF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern text
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 16px HindSiliguri, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎁 ঘষে পুরস্কার দেখো 🎁', canvas.width / 2, canvas.height / 2);
  }, []);

  const handleScratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    scratchedPixels.current += 1;
    // When enough scratching has happened, reveal reward
    if (scratchedPixels.current > 35 && !isRevealed) {
      revealReward();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['HindSiliguri',sans-serif]">
      <div className="w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[24px] p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          তোমার উপহার!
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4">
          পুরস্কার দেখতে কার্ডটি ঘষো বা ক্লিক করো
        </p>

        {errorMessage && (
          <p className="text-xs text-red-500 mb-3">{errorMessage}</p>
        )}

        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-amber-300 dark:border-amber-700/50 shadow-inner bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
          {/* Revealed Reward underneath */}
          <div className="flex flex-col items-center justify-center p-4">
            <PartyPopper className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-bounce mb-2" />
            <span className="text-lg font-extrabold text-amber-900 dark:text-amber-300">
              {rewardTitle || '১ মাসের ফ্রি প্রিমিয়াম!'}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1">
              🎉 অ্যাকাউন্ট এ যুক্ত হয়েছে
            </span>
          </div>

          {/* Canvas Scratcher on Top */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={320}
              height={176}
              className="absolute inset-0 w-full h-full cursor-pointer touch-none"
              onMouseDown={() => (isDrawing.current = true)}
              onMouseUp={() => (isDrawing.current = false)}
              onMouseMove={(e) => {
                if (isDrawing.current) {
                  handleScratch(e.clientX, e.clientY);
                }
              }}
              onTouchStart={() => (isDrawing.current = true)}
              onTouchEnd={() => (isDrawing.current = false)}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  handleScratch(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onClick={() => revealReward()}
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-5">
          {isRevealed ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              বন্ধ করো
            </button>
          ) : (
            <button
              type="button"
              onClick={revealReward}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              <span>পুরস্কার দেখো</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScratchCardModal;
