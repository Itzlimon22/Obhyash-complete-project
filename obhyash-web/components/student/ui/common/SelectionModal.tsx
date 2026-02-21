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
 * Extracts the repeated modal pattern from ExamSetupForm.
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
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-3xl">
          <div>
            <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs font-medium text-neutral-500 mt-1">
              {selectedItems.length} টি নির্বাচিত
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 p-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <button
            onClick={onSelectAll}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            সবগুলো সিলেক্ট
          </button>
          <div className="w-px bg-neutral-200 dark:bg-neutral-800 h-6 my-auto"></div>
          <button
            onClick={onClearAll}
            className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            মুছে ফেলুন
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center text-neutral-400 py-12 text-sm flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8 opacity-50" />
              কোন আইটেম পাওয়া যায়নি
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selectedItems.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => onToggle(item)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 group',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20 shadow-sm'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 scale-100'
                          : 'border-neutral-300 dark:border-neutral-600 bg-transparent group-hover:border-indigo-400',
                      )}
                    >
                      {isSelected && (
                        <CheckSquare className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold leading-snug',
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-100'
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
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            সম্পন্ন করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
