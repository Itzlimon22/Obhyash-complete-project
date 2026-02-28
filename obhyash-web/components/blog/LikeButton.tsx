'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LikeButtonProps {
  postSlug: string;
}

export default function LikeButton({ postSlug }: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  // Local state for optimistic UI updates
  const [localLikes, setLocalLikes] = useState(0);
  const [localHasLiked, setLocalHasLiked] = useState(false);

  const { data, error, mutate, isLoading } = useSWR<{
    likes: number;
    hasLiked: boolean;
  }>(`/api/blog/likes?slug=${postSlug}`, fetcher);

  // Sync server data to local state when it loads
  useEffect(() => {
    if (data && !isLoading && !isLiking) {
      setLocalLikes(data.likes || 0);
      setLocalHasLiked(data.hasLiked || false);
    }
  }, [data, isLoading, isLiking]);

  const toggleLike = async () => {
    if (!user) {
      toast('লগইন প্রয়োজন', {
        description: 'পোস্ট লাইক করতে অনুগ্রহ করে আপনার একাউন্টে প্রবেশ করুন।',
      });
      return;
    }

    if (isLiking) return;

    // Optimistic UI update
    setIsLiking(true);
    const previousHasLiked = localHasLiked;
    const previousLikes = localLikes;

    setLocalHasLiked(!previousHasLiked);
    setLocalLikes(previousHasLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      const res = await fetch('/api/blog/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: postSlug }),
      });

      if (!res.ok) throw new Error('Failed to toggle like');

      const result = await res.json();

      // Sync with strict server state just in case
      setLocalHasLiked(result.hasLiked);

      // Revalidate SWR silently in the background
      mutate();
    } catch (err: unknown) {
      // Revert to previous state if API call failed
      setLocalHasLiked(previousHasLiked);
      setLocalLikes(previousLikes);
      toast.error('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300
        ${
          localHasLiked
            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:bg-[#121212] dark:border-[#2b2b2b] dark:text-slate-400 dark:hover:bg-[#1a1a1a] dark:hover:text-slate-200'
        }
      `}
      aria-label={localHasLiked ? 'Unlike post' : 'Like post'}
    >
      <Heart
        className={`w-5 h-5 transition-transform duration-300 ${localHasLiked ? 'fill-current scale-110' : 'scale-100 hover:scale-110'}`}
      />
      <span className="font-semibold text-[15px] tabular-nums">
        {isLoading && localLikes === 0 ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          localLikes
        )}
      </span>
    </button>
  );
}
