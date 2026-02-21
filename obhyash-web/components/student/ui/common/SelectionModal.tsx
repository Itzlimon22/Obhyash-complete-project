'use client';

import React from 'react';
import { X, CheckSquare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

/**
 * Reusable selection modal for chapters, topics, etc.
 * Follows the unified bottom-sheet design standard.
 */
const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  selectedItems,
  onToggle,
  onSelectAll,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[50vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent — deep green */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-emerald-700 rounded-t-3xl z-10" />

        {/* Header */}
        <div className="rounded-t-3xl sm:rounded-t-3xl bg-white dark:bg-neutral-950 border border-b-0 border-neutral-200 dark:border-neutral-800 px-6 pt-5 pb-4 flex-shrink-0">
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {selectedItems.length} টি নির্বাচিত
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="বন্ধ করো"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <button
              onClick={onSelectAll}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              সবগুলো সিলেক্ট
            </button>
            <div className="w-px bg-neutral-200 dark:bg-neutral-800 h-5 my-auto" />
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              মুছে ফেলো
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-950 border-x border-neutral-200 dark:border-neutral-800 px-4 py-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center text-neutral-400 py-12 text-sm flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8 opacity-40" />
              কোনো আইটেম পাওয়া যায়নি
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => {
                const isSelected = selectedItems.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => onToggle(item)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-150',
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-700/20'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        isSelected
                          ? 'bg-emerald-700 border-emerald-700'
                          : 'border-neutral-300 dark:border-neutral-600',
                      )}
                    >
                      {isSelected && (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold leading-snug',
                        isSelected
                          ? 'text-emerald-900 dark:text-emerald-300'
                          : 'text-neutral-700 dark:text-neutral-300',
                      )}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rounded-b-none sm:rounded-b-3xl bg-white dark:bg-neutral-950 border border-t-0 border-neutral-200 dark:border-neutral-800 px-6 py-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-950 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md transition-all duration-150"
          >
            সম্পন্ন করো ({selectedItems.length} নির্বাচিত)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
