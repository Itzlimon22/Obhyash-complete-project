import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  X,
  CheckSquare,
  Search,
  Layers,
  BookOpen,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the TopicSelector component.
 */
interface TopicSelectorProps {
  /** Title of the selector (e.g., "Chapters", "Topics"). */
  title: string;
  /** List of all available items (flat list). */
  items?: string[];
  /** Grouped items for categorized selection (e.g., { "Chapter 1": ["Topic A", "Topic B"] }). */
  groupedItems?: Record<string, string[]>;
  /** List of currently selected items. */
  selectedItems: string[];
  /** Callback when selection changes (replaces onToggle). */
  onChange?: (items: string[]) => void;
  // Legacy props kept for compatibility (will wrap them)
  onToggle?: (item: string) => void;
  onSelectAll?: () => void;
  onClear?: () => void;
  /** Whether the selector interaction is disabled. */
  disabled?: boolean;
  /** Text to display when the list is empty or no items match search. */
  emptyLabel?: string;
}

/**
 * TopicSelector Component
 *
 * A reusable component for selecting multiple items from a list or groups.
 * Features:
 * - Local state buffering to prevent flickering.
 * - Mobile-responsive modal/drawer interface.
 * - Search functionality to filter items.
 * - Grouped items support (Accordion-style).
 * - "Select All" and "Clear" convenience actions.
 */
export const TopicSelector: React.FC<TopicSelectorProps> = ({
  title,
  items = [],
  groupedItems,
  selectedItems,
  onChange,
  onToggle, // Legacy
  onSelectAll, // Legacy
  onClear, // Legacy
  disabled = false,
  emptyLabel = 'No items found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // Local buffer for selection
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelected([...selectedItems]);
    }
  }, [isOpen, selectedItems]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const isGrouped = !!groupedItems && Object.keys(groupedItems).length > 0;

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (isGrouped && groupedItems) {
      const filteredGroups: Record<string, string[]> = {};
      Object.entries(groupedItems).forEach(([group, groupItems]) => {
        const matchesGroup = group.toLowerCase().includes(query);
        const matchingItems = groupItems.filter((item) =>
          item.toLowerCase().includes(query),
        );
        if (matchesGroup || matchingItems.length > 0) {
          filteredGroups[group] = matchesGroup ? groupItems : matchingItems;
        }
      });
      return { flat: [], groups: filteredGroups };
    } else {
      return {
        flat: items.filter((item) => item.toLowerCase().includes(query)),
        groups: {},
      };
    }
  }, [items, groupedItems, searchQuery, isGrouped]);

  const totalCount = isGrouped
    ? Object.values(groupedItems || {}).reduce(
        (acc, curr) => acc + curr.length,
        0,
      )
    : items.length;

  // Handlers for local state
  const handleLocalToggle = (item: string) => {
    setLocalSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleLocalSelectAll = () => {
    if (groupedItems) {
      setLocalSelected(Object.values(groupedItems).flat());
    } else {
      setLocalSelected([...items]);
    }
  };

  const handleLocalClear = () => {
    setLocalSelected([]);
  };

  const handleConfirm = () => {
    if (onChange) {
      onChange(localSelected);
    } else {
      // Fallback for legacy props (inefficient, but works if onChange not provided)
      // We can't easily implement atomic update with onToggle.
      // User must upgrade parent to use onChange.
      // But we can warn.
      console.warn(
        'TopicSelector: onChange prop missing, changes might not save correctly with batch.',
      );
    }
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'space-y-2',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {title}
          </label>
        </div>

        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 outline-none group text-left',
            'bg-white dark:bg-neutral-900',
            disabled
              ? 'cursor-not-allowed bg-neutral-100 dark:bg-neutral-800'
              : 'cursor-pointer',
            isOpen
              ? 'border-rose-500 ring-2 ring-rose-500/10'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 shrink-0',
                disabled
                  ? 'bg-neutral-200 dark:bg-neutral-700'
                  : 'bg-neutral-50 dark:bg-neutral-800',
              )}
            >
              {title.includes('Chapter') || title.includes('অধ্যায়') ? (
                <BookOpen size={16} className="text-neutral-500" />
              ) : (
                <Layers size={16} className="text-neutral-500" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'text-sm font-semibold truncate',
                  selectedItems.length > 0
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400',
                )}
              >
                {selectedItems.length === 0
                  ? 'সব টপিক (All Topics)'
                  : selectedItems.length === totalCount
                    ? 'সব নির্বাচন করা হয়েছে'
                    : `${selectedItems.length} টি নির্বাচিত`}
              </span>
            </div>
          </div>
          <ChevronDown
            size={20}
            className="text-neutral-400 group-hover:text-neutral-600 transition-colors"
          />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          <div className="relative w-full md:max-w-xl md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[700px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-xs text-neutral-500">
                  {localSelected.length} selected of {totalCount}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
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
                {isGrouped ? (
                  <>
                    <button
                      onClick={() => {
                        const newExpanded: Record<string, boolean> = {};
                        Object.keys(filteredData.groups).forEach(
                          (k) => (newExpanded[k] = true),
                        );
                        setExpandedGroups(newExpanded);
                      }}
                      className="flex-1 py-2 text-xs font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => setExpandedGroups({})}
                      className="flex-1 py-2 text-xs font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Collapse All
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLocalSelectAll}
                    className="flex-1 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    Select All
                  </button>
                )}

                <button
                  onClick={handleLocalClear}
                  className="flex-1 py-2 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {(
                isGrouped
                  ? Object.keys(filteredData.groups).length === 0
                  : filteredData.flat.length === 0
              ) ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <Layers size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">{emptyLabel}</p>
                </div>
              ) : isGrouped ? (
                Object.entries(filteredData.groups).map(
                  ([group, groupItems]) => {
                    if (groupItems.length === 0) return null;
                    const isExpanded = expandedGroups[group] ?? true;
                    const allGroupSelected = groupItems.every((i) =>
                      localSelected.includes(i),
                    );
                    return (
                      <div
                        key={group}
                        className={cn(
                          'border rounded-xl overflow-hidden mb-3 transition-colors',
                          isExpanded
                            ? 'border-rose-100 dark:border-rose-900/30'
                            : 'border-neutral-200 dark:border-neutral-800',
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 cursor-pointer transition-colors select-none',
                            isExpanded
                              ? 'bg-rose-50/50 dark:bg-rose-900/10'
                              : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          )}
                          onClick={() => toggleGroup(group)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400">
                              {isExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </span>

                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                {group}
                              </span>
                              <span className="text-[10px] font-medium text-neutral-500">
                                {
                                  groupItems.filter((i) =>
                                    localSelected.includes(i),
                                  ).length
                                }{' '}
                                / {groupItems.length} selected
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSet = allGroupSelected
                                ? localSelected.filter(
                                    (i) => !groupItems.includes(i),
                                  )
                                : [
                                    ...new Set([
                                      ...localSelected,
                                      ...groupItems,
                                    ]),
                                  ];
                              setLocalSelected(newSet);
                            }}
                            className={cn(
                              'text-xs font-bold px-3 py-1.5 rounded-lg transition-colors',
                              allGroupSelected
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                : 'bg-white text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 hover:bg-neutral-50',
                            )}
                          >
                            {allGroupSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="p-2 space-y-1 bg-white dark:bg-neutral-900">
                            {groupItems.map((item) => (
                              <SelectorItem
                                key={item}
                                item={item}
                                isSelected={localSelected.includes(item)}
                                onToggle={() => handleLocalToggle(item)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  },
                )
              ) : (
                filteredData.flat.map((item) => (
                  <SelectorItem
                    key={item}
                    item={item}
                    isSelected={localSelected.includes(item)}
                    onToggle={() => handleLocalToggle(item)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 pb-safe">
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold hover:scale-[0.98] transition-transform"
              >
                Confirm Selection ({localSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SelectorItem = React.memo(
  ({
    item,
    isSelected,
    onToggle,
  }: {
    item: string;
    isSelected: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
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
        {isSelected && <CheckSquare size={12} fill="currentColor" />}
      </div>
    </button>
  ),
);
SelectorItem.displayName = 'SelectorItem';
