'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REACTIONS = [
  { emoji: '🔥', label: 'দারুণ' },
  { emoji: '💡', label: 'শিক্ষণীয়' },
  { emoji: '❤️', label: 'ভালো লাগলো' },
  { emoji: '😮', label: 'অবাক করলো' },
];

interface EmojiReactionsProps {
  slug: string;
}

interface ReactionsData {
  counts: Record<string, number>;
  userReactions: string[];
}

export default function EmojiReactions({ slug }: EmojiReactionsProps) {
  const { data, mutate } = useSWR<ReactionsData>(
    `/api/blog/reactions?slug=${encodeURIComponent(slug)}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const counts = useMemo(() => data?.counts ?? {}, [data]);
  const userReacted = useMemo(() => new Set(data?.userReactions ?? []), [data]);

  const toggle = async (emoji: string) => {
    if (!data) return;

    const alreadyOn = userReacted.has(emoji);
    const nextCounts = { ...counts };
    const nextUser = new Set<string>();

    if (!alreadyOn) {
      // Remove any previously active reaction (single-reaction enforcement)
      userReacted.forEach((oldEmoji) => {
        nextCounts[oldEmoji] = Math.max(0, (nextCounts[oldEmoji] ?? 1) - 1);
        if (nextCounts[oldEmoji] === 0) delete nextCounts[oldEmoji];
      });
      // Add new reaction
      nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
      nextUser.add(emoji);
    } else {
      // Toggling off
      nextCounts[emoji] = Math.max(0, (nextCounts[emoji] ?? 1) - 1);
      if (nextCounts[emoji] === 0) delete nextCounts[emoji];
    }

    mutate({ counts: nextCounts, userReactions: Array.from(nextUser) }, false);

    const res = await fetch('/api/blog/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, emoji }),
    });

    if (res.status === 401) {
      mutate(); // revert
      return;
    }

    const json = await res.json();
    mutate({ counts: json.counts, userReactions: json.userReactions }, false);
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mt-8 mb-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-anek">
          প্রতিক্রিয়া
        </span>
        {totalReactions > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-anek">
            · {totalReactions} জন প্রতিক্রিয়া জানিয়েছেন
          </span>
        )}
      </div>

      {/* Reaction buttons */}
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ emoji, label }) => {
          const count = counts[emoji] ?? 0;
          const active = userReacted.has(emoji);
          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              aria-label={label}
              title={label}
              className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-sm font-medium transition-all duration-150 select-none
                ${
                  active
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 shadow-sm'
                    : 'bg-white dark:bg-[#111] border-slate-200 dark:border-[#2b2b2b] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#3b3b3b] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
                }`}
            >
              <span
                className={`text-[18px] leading-none transition-transform duration-150 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                style={{
                  fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
                }}
              >
                {emoji}
              </span>
              <span className="hidden sm:inline font-anek text-[13px]">
                {label}
              </span>
              {count > 0 && (
                <span
                  className={`ml-0.5 min-w-[18px] text-center text-[12px] font-bold rounded-full px-1 font-anek
                    ${active ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
