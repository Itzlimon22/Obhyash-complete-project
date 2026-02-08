import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubject: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  selectedSubject,
  onSelect,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-14 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
        বিষয় (Subject)
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 outline-none select-none',
          'bg-white dark:bg-neutral-900',
          isOpen
            ? 'border-indigo-500 ring-4 ring-indigo-500/10'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-neutral-700',
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors',
              selectedSubjectData
                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400',
            )}
          >
            {selectedSubjectData ? (
              <span className="text-xl">{selectedSubjectData.icon}</span>
            ) : (
              <BookOpen size={16} />
            )}
          </div>
          <span
            className={cn(
              'text-sm font-bold truncate',
              selectedSubjectData
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-400',
            )}
          >
            {selectedSubjectData
              ? selectedSubjectData.name
              : 'বিষয় নির্বাচন করুন...'}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'text-neutral-400 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          'absolute z-50 w-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden transition-all duration-200 origin-top',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 visible'
            : 'opacity-0 -translate-y-2 scale-95 invisible pointer-events-none',
        )}
      >
        {/* Search */}
        <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="বিষয় খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus={isOpen}
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredSubjects.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-sm">
              কোনো বিষয় পাওয়া যায়নি
            </div>
          ) : (
            filteredSubjects.map((subject) => {
              const isSelected = selectedSubject === subject.id;
              return (
                <button
                  key={subject.id}
                  onClick={() => {
                    onSelect(subject.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm border',
                      isSelected
                        ? 'bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-700 group-hover:border-neutral-300 dark:group-hover:border-neutral-600',
                    )}
                  >
                    {subject.icon}
                  </div>
                  <span className="flex-1 font-bold text-sm">
                    {subject.name}
                  </span>
                  {isSelected && (
                    <Check size={16} className="text-indigo-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
