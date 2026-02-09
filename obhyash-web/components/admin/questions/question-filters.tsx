import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { QuestionFilters } from '@/services/database';
import { getSubjects, getChapters, getTopics } from '@/services/database';

interface FilterItem {
  id: string;
  name: string;
}

interface QuestionFiltersProps {
  filters: QuestionFilters;
  onFiltersChange: (filters: QuestionFilters) => void;
  onClear: () => void;
}

export const QuestionFiltersPanel: React.FC<QuestionFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  const [subjects, setSubjects] = useState<FilterItem[]>([]);
  const [chapters, setChapters] = useState<FilterItem[]>([]);
  const [topics, setTopics] = useState<FilterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm || null });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load subjects on mount
  useEffect(() => {
    const loadSubjects = async () => {
      const subs = await getSubjects();
      setSubjects(subs);
    };
    loadSubjects();
  }, []);

  // Load chapters when subject changes
  useEffect(() => {
    const loadChapters = async () => {
      if (!filters.subject) {
        setChapters([]);
        setTopics([]);
        return;
      }

      const chaps = await getChapters(filters.subject!);
      setChapters(chaps);
      setTopics([]);
    };
    loadChapters();
  }, [filters.subject]);

  // Load topics when chapter changes
  useEffect(() => {
    const loadTopics = async () => {
      if (!filters.chapter) {
        setTopics([]);
        return;
      }

      const tops = await getTopics(filters.chapter!);
      setTopics(tops);
    };
    loadTopics();
  }, [filters.chapter]);

  const handleSubjectChange = (value: string) => {
    onFiltersChange({
      ...filters,
      subject: value || null,
      chapter: null,
      topic: null,
    });
  };

  const handleChapterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      chapter: value || null,
      topic: null,
    });
  };

  const hasActiveFilters =
    filters.subject ||
    filters.chapter ||
    filters.topic ||
    filters.difficulty ||
    filters.status ||
    filters.search;

  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.subject ||
    filters.chapter ||
    filters.topic ||
    filters.difficulty ||
    filters.status ||
    filters.search;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Search size={16} className="text-rose-600" />
          ফিল্টার ও সার্চ
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:hover:text-rose-500 flex items-center gap-1 transition-colors mr-2"
            >
              <X size={14} />
              সব মুছুন
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden text-xs font-medium bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400"
          >
            {isExpanded ? 'লুকান' : 'ফিল্টার'}
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 ${isExpanded ? 'block' : 'hidden lg:grid'}`}
      >
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            সার্চ করুন
          </label>
          <input
            type="text"
            placeholder="প্রশ্ন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            বিষয়
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">সকল বিষয়</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            অধ্যায়
          </label>
          <select
            value={filters.chapter || ''}
            onChange={(e) => handleChapterChange(e.target.value)}
            disabled={!filters.subject}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">সকল অধ্যায়</option>
            {chapters.map((chap) => (
              <option key={chap.id} value={chap.id}>
                {chap.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            টপিক
          </label>
          <select
            value={filters.topic || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, topic: e.target.value || null })
            }
            disabled={!filters.chapter}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">সকল টপিক</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            কঠিন্য
          </label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                difficulty: e.target.value || null,
              })
            }
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">সকল স্তর</option>
            <option value="Easy">সহজ</option>
            <option value="Medium">মাঝারি</option>
            <option value="Hard">কঠিন</option>
          </select>
        </div>

        {/* Status */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            স্ট্যাটাস
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value || null })
            }
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Mobile Only Search Bar (When hidden) */}
      {!isExpanded && (
        <div className="lg:hidden mt-2">
          <input
            type="text"
            placeholder="প্রশ্ন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
          />
        </div>
      )}
    </div>
  );
};
