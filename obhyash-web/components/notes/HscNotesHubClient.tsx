'use client';

import { useState, useMemo } from 'react';
import { HSC_SCIENCE_NOTES } from '@/data/hsc-ka-kha-notes';
import { SubjectNoteCard } from './SubjectNoteCard';
import { Search, Sparkles, Download, Layers } from 'lucide-react';

export function HscNotesHubClient() {
  const [filter, setFilter] = useState<'all' | 'free' | 'app'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return HSC_SCIENCE_NOTES.filter((item) => {
      // Tab filter
      if (filter === 'free' && !item.isFreePdf) return false;
      if (filter === 'app' && item.isFreePdf) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.titleBn.toLowerCase().includes(q) ||
        item.paperBn.toLowerCase().includes(q) ||
        item.descriptionBn.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery]);

  return (
    <div className="w-full">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12">
        {/* Filter Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto shadow-inner">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>সকল বিষয় (৬)</span>
          </button>

          <button
            onClick={() => setFilter('free')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              filter === 'free'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ফ্রি PDF (২)</span>
          </button>

          <button
            onClick={() => setFilter('app')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              filter === 'app'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-indigo-700 dark:text-indigo-400 hover:text-indigo-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>অ্যাপে এক্সক্লুসিভ (৪)</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বিষয় বা অধ্যায় খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 placeholder:text-slate-400 text-slate-900 dark:text-white shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredNotes.map((item) => (
            <SubjectNoteCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400 mb-2">
            আপনার খোঁজা বিষয়ের সাথে কোনো নোট মেলেনি
          </p>
          <button
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline"
          >
            সকল বিষয় রিসেট করুন
          </button>
        </div>
      )}
    </div>
  );
}
