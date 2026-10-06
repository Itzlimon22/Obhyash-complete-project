'use client';

import React from 'react';
import { Share2, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuestionSetItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  amount: string;
  tag?: string;
}

const DEFAULT_SETS: QuestionSetItem[] = [
  {
    id: '1',
    name: 'Solaris Sparkle',
    category: 'Miami, Florida',
    quantity: '102 Quantity',
    amount: '12.50K',
  },
  {
    id: '2',
    name: 'Crimson Dusk',
    category: 'Denver, Colorado',
    quantity: '214 Quantity',
    amount: '07.85K',
  },
  {
    id: '3',
    name: 'Indigo Zephyr',
    category: 'Orlando, Florida',
    quantity: '143 Quantity',
    amount: '16.40K',
  },
  {
    id: '4',
    name: 'Roseate Crest',
    category: 'Las Vegas, Nevada',
    quantity: '185 Quantity',
    amount: '23.64K',
  },
];

interface QuestionSetTableProps {
  title?: string;
  items?: QuestionSetItem[];
  onShare?: () => void;
  className?: string;
}

export const QuestionSetTable: React.FC<QuestionSetTableProps> = ({
  title = 'Top Store',
  items = DEFAULT_SETS,
  onShare,
  className,
}) => {
  const handleShare = () => {
    if (onShare) {
      onShare();
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: 'Obhyash Top Performing Sets',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('লিঙ্ক কপি করা হয়েছে!');
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#151515] rounded-3xl p-6 shadow-card border border-slate-100/80 dark:border-zinc-800/80',
        className,
      )}
    >
      {/* Table Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
            শীর্ষ পারফরমিং প্রশ্নব্যাংক ও এক্সাম সেটসমূহ
          </p>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c6f634] hover:bg-[#b8ea27] text-slate-950 font-bold rounded-full text-xs shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Share</span>
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80">
              <th className="pb-3 pr-4 font-semibold">Store Name</th>
              <th className="pb-3 px-4 font-semibold">Location</th>
              <th className="pb-3 px-4 font-semibold">Sell</th>
              <th className="pb-3 pl-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/60 text-xs">
            {items.map((item) => (
              <tr
                key={item.id}
                className="group hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-500 dark:text-zinc-400 font-medium">
                  {item.category}
                </td>
                <td className="py-4 px-4 text-slate-600 dark:text-zinc-300 font-semibold">
                  {item.quantity}
                </td>
                <td className="py-4 pl-4 text-right font-black text-slate-900 dark:text-white">
                  {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionSetTable;
