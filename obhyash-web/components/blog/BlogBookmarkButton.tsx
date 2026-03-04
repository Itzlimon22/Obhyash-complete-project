'use client';

import useSWR from 'swr';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BlogBookmarkButton({ slug }: { slug: string }) {
  const { data, mutate } = useSWR('/api/blog/bookmarks', fetcher);
  const [pending, setPending] = useState(false);

  const isBookmarked: boolean = data?.slugs?.includes(slug) ?? false;

  const toggle = async () => {
    if (pending) return;
    // Not logged in
    if (!data) return;
    if (data.slugs === undefined) {
      toast.error('বুকমার্ক করতে লগইন করুন');
      return;
    }

    setPending(true);
    // Optimistic update
    const next = isBookmarked
      ? data.slugs.filter((s: string) => s !== slug)
      : [...data.slugs, slug];
    mutate({ slugs: next }, false);

    try {
      const res = await fetch('/api/blog/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        mutate(); // revert
        toast.error('বুকমার্ক করতে লগইন করুন');
        return;
      }
      const json = await res.json();
      mutate({ slugs: json.bookmarked ? next : next.filter((s: string) => s !== slug) }, false);
      toast.success(json.bookmarked ? 'বুকমার্কে যোগ করা হয়েছে' : 'বুকমার্ক থেকে সরানো হয়েছে');
    } catch {
      mutate(); // revert on error
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border font-anek
        ${isBookmarked
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-950/60'
          : 'bg-slate-100 dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-[#2b2b2b]'
        }
        disabled:opacity-60`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500' : ''}`} />
      {isBookmarked ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}
    </button>
  );
}
