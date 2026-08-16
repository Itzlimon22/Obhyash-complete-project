import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  category?: 'compulsory' | 'core' | 'elective' | string;
  serial?: number; // Serial number for ordering
  sort_order?: number;
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

  // Group into Compulsory, Core, Elective
  const compulsory: Subject[] = [];
  const core: Subject[] = [];
  const elective: Subject[] = [];

  subjects.forEach((s) => {
    if (!s.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

    let cat = s.category;
    if (!cat) {
      const idLower = s.id.toLowerCase();
      const nameLower = s.name.toLowerCase();
      if (
        idLower.includes('bangla') ||
        idLower.includes('english') ||
        idLower.includes('ict') ||
        nameLower.includes('বাংলা') ||
        nameLower.includes('ইংরেজি') ||
        nameLower.includes('তথ্য')
      ) {
        cat = 'compulsory';
      } else if (
        idLower.includes('biology') ||
        idLower.includes('statistics') ||
        nameLower.includes('জীববিজ্ঞান') ||
        nameLower.includes('পরিসংখ্যান')
      ) {
        cat = 'elective';
      } else {
        cat = 'core';
      }
    }

    if (cat === 'compulsory') compulsory.push(s);
    else if (cat === 'elective') elective.push(s);
    else core.push(s);
  });

  const sections = [
    { title: 'আবশ্যিক বিষয়সমূহ (Compulsory)', items: compulsory, color: 'bg-blue-500' },
    { title: 'বিভাগীয় মূল বিষয়সমূহ (Core Subjects)', items: core, color: 'bg-emerald-500' },
    { title: 'ঐচ্ছিক / ৪র্থ বিষয় (Elective)', items: elective, color: 'bg-purple-500' },
  ].filter((sec) => sec.items.length > 0);

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
          <div className="relative w-full md:max-w-xl md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[60vh] md:max-h-[600px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                  বিষয় নির্বাচন করো
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[30vh]">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <BookOpen size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">কোনো বিষয় পাওয়া যায়নি</p>
                </div>
              ) : (
                sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className={cn("w-1.5 h-3.5 rounded-full", section.color)} />
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        {section.title}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {section.items.map((subject) => {
                        const isSelected = selectedSubject === subject.id;
                        return (
                          <button
                            key={subject.id}
                            onClick={() => {
                              onSelect(subject.id);
                              setIsOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 group border",
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50 font-bold"
                                : "bg-white dark:bg-neutral-800/60 border-neutral-100 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200",
                            )}
                          >
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
                      })}
                    </div>
                  </div>
                ))
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
