import React, { useState } from 'react';
import { Check, ChevronDown, Search, X, BookOpen } from 'lucide-react';
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

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-14 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
        বিষয় (Subject)
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 outline-none',
          'bg-white dark:bg-neutral-900',
          isOpen
            ? 'border-rose-500 ring-2 ring-rose-500/10'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-lg',
              selectedSubjectData
                ? 'bg-rose-50 dark:bg-rose-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800',
            )}
          >
            {selectedSubjectData ? (
              selectedSubjectData.icon
            ) : (
              <BookOpen size={16} className="text-neutral-400" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span
              className={cn(
                'text-sm font-semibold',
                selectedSubjectData
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-400',
              )}
            >
              {selectedSubjectData
                ? selectedSubjectData.name
                : 'বিষয় নির্বাচন করুন'}
            </span>
          </div>
        </div>
        <ChevronDown size={20} className="text-neutral-400" />
      </button>

      {/* Bottom Sheet / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative w-full md:max-w-xl md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[600px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                বিষয় নির্বাচন
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="বিষয় খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredSubjects.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  কোনো বিষয় পাওয়া যায়নি
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredSubjects.map((subject) => {
                    const isSelected = selectedSubject === subject.id;
                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSelect(subject.id)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 border group',
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                            : 'bg-white dark:bg-neutral-800/30 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700',
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-xl shadow-sm border border-neutral-100 dark:border-neutral-700 group-hover:scale-110 transition-transform">
                          {subject.icon}
                        </div>
                        <span
                          className={cn(
                            'flex-1 font-bold text-sm',
                            isSelected
                              ? 'text-rose-900 dark:text-rose-100'
                              : 'text-neutral-700 dark:text-neutral-200',
                          )}
                        >
                          {subject.name}
                        </span>
                        {isSelected && (
                          <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
