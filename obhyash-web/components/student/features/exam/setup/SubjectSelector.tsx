import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists, or we use the local helper

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
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
          />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400 text-sm border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
        কোনো বিষয় পাওয়া যায়নি (No subjects found)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-neutral-900 dark:text-white">
        বিষয় নির্বাচন করুন (Select Subject)
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {subjects.map((subject) => {
          const isSelected = selectedSubject === subject.id;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelect(subject.id)}
              className={cn(
                'relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center group active:scale-95',
                isSelected
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 shadow-md shadow-rose-500/10'
                  : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-sm',
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white animate-in zoom-in-50 duration-200">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <span
                className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
              >
                {subject.icon}
              </span>

              <span
                className={cn(
                  'text-xs font-bold leading-tight',
                  isSelected
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white',
                )}
              >
                {subject.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
