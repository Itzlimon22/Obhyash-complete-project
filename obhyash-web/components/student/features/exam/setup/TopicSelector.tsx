import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ListFilter,
  X,
  CheckSquare,
  Search,
  Layers,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Sheet component imports removed as they were unused and the module does not exist

interface TopicSelectorProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  disabled?: boolean;
  emptyLabel?: string;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  title,
  items,
  selectedItems,
  onToggle,
  onSelectAll,
  onClear,
  disabled = false,
  emptyLabel = 'No items found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  // Mobile Drawer / Modal Component
  const SelectorModal = () => (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="relative w-full md:max-w-md md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[600px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-neutral-500">
              {selectedItems.length} selected of {items.length}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="flex-1 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onClear}
              className="flex-1 py-2 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Layers size={32} className="mb-2 opacity-20" />
              <p className="text-sm">{emptyLabel}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItems.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => onToggle(item)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 border',
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                      : 'bg-white dark:bg-neutral-800/50 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected
                        ? 'text-rose-900 dark:text-rose-100'
                        : 'text-neutral-700 dark:text-neutral-300',
                    )}
                  >
                    {item}
                  </span>

                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600',
                    )}
                  >
                    {isSelected && (
                      <CheckSquare size={12} fill="currentColor" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 pb-safe">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold hover:scale-[0.98] transition-transform"
          >
            Confirm Selection ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'space-y-4',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className="group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-neutral-900 dark:text-white pointer-events-none">
              {title}
            </label>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl flex items-center justify-between hover:border-rose-300 dark:hover:border-rose-700 transition-colors shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                {title === 'অধ্যায় (Chapters)' ? (
                  <BookOpen size={20} />
                ) : (
                  <Layers size={20} />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-neutral-900 dark:text-white">
                  {selectedItems.length === 0
                    ? 'Select items...'
                    : selectedItems.length === items.length
                      ? 'All Selected'
                      : `${selectedItems.length} Selected`}
                </span>
                <span className="text-xs text-neutral-500 truncate max-w-[200px]">
                  {selectedItems.length === 0
                    ? `Choose from ${items.length} options`
                    : selectedItems.join(', ')}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
              <ChevronRight size={16} className="text-neutral-400" />
            </div>
          </div>
        </div>
      </div>

      {isOpen && <SelectorModal />}
    </>
  );
};
