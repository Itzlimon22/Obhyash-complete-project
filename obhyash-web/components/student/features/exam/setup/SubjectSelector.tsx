import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  serial?: number; // Serial number for ordering
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
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);

  // Filter subjects while maintaining their serial order
  const filteredSubjects = subjects
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.serial || 0) - (b.serial || 0));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-14 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
        বিষয়
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 outline-none select-none",
          "bg-white dark:bg-neutral-900",
          isOpen
            ? "border-emerald-500 ring-4 ring-emerald-500/10"
            : "border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-neutral-700",
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors",
              selectedSubjectData
                ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400",
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
              "text-sm font-bold truncate",
              selectedSubjectData
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-400",
            )}
          >
            {selectedSubjectData
              ? selectedSubjectData.name
              : "বিষয় নির্বাচন করো..."}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={cn(
            "text-neutral-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          <div className="relative w-full md:max-w-xl md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[50vh] md:max-h-[600px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                  বিষয়
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>



            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[30vh]">
              {filteredSubjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <BookOpen size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">কোনো বিষয় পাওয়া যায়নি</p>
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
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 group border",
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
                          : "bg-white dark:bg-neutral-800/50 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center text-lg shadow-sm border shrink-0",
                          isSelected
                            ? "bg-white dark:bg-neutral-900 border-emerald-200 dark:border-emerald-500/30"
                            : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-700 group-hover:border-neutral-300 dark:group-hover:border-neutral-600",
                        )}
                      >
                        {subject.icon}
                      </div>
                      <span className="flex-1 font-semibold text-sm md:text-base">
                        {subject.name}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full border border-emerald-600 bg-emerald-600 text-white flex items-center justify-center transition-all shrink-0">
                           <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Safe area padding for bottom */}
            <div className="pb-safe" />
          </div>
        </div>
      )}
    </div>
  );
};
