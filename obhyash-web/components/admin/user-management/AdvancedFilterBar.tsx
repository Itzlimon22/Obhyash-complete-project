import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface User {
  institute?: string;
  batch?: string;
}

interface AdvancedFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  users: User[]; // Used to derive options for Institute/Batch
  isOpen: boolean;
  onToggle: () => void;
}

export interface FilterState {
  lastActiveRange: 'all' | '7days' | '30days' | 'inactive';
  minExams: number;
  maxExams: number;
  institutes: string[];
  batches: string[];
  subscriptionStatus: 'all' | 'Active' | 'Past Due' | 'Expired';
}

export default function AdvancedFilterBar({
  onFilterChange,
  users,
  isOpen,
  onToggle,
}: AdvancedFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    lastActiveRange: 'all',
    minExams: 0,
    maxExams: 1000,
    institutes: [],
    batches: [],
    subscriptionStatus: 'all',
  });

  // Derived Options
  const instituteOptions = Array.from(
    new Set(users.map((u) => u.institute).filter(Boolean)),
  ) as string[];
  const batchOptions = Array.from(
    new Set(users.map((u) => u.batch).filter(Boolean)),
  ) as string[];

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetState: FilterState = {
      lastActiveRange: 'all',
      minExams: 0,
      maxExams: 1000,
      institutes: [],
      batches: [],
      subscriptionStatus: 'all',
    };
    setFilters(resetState);
    onFilterChange(resetState);
  };

  const toggleSelection = (field: 'institutes' | 'batches', value: string) => {
    setFilters((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-6 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Activity & Subscription */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-2">
              Activity Status
            </label>
            <select
              value={filters.lastActiveRange}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  lastActiveRange: e.target.value as 'all' | '7days' | '30days' | 'inactive',
                }))
              }
              className="w-full p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Any Time</option>
              <option value="7days">Active Last 7 Days</option>
              <option value="30days">Active Last 30 Days</option>
              <option value="inactive">Inactive (&gt;30 Days)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-2">
              Subscription
            </label>
            <select
              value={filters.subscriptionStatus}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  subscriptionStatus: e.target.value as 'all' | 'Active' | 'Past Due' | 'Expired',
                }))
              }
              className="w-full p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Past Due">Past Due</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Exam Count Range */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Exams Taken Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.minExams}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minExams: Number(e.target.value),
                }))
              }
              placeholder="Min"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-neutral-400">-</span>
            <input
              type="number"
              value={filters.maxExams}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxExams: Number(e.target.value),
                }))
              }
              placeholder="Max"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Institutes (Multi-select Mock) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Institutes
          </label>
          <div className="h-32 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 space-y-1">
            {instituteOptions.map((inst) => (
              <label
                key={inst}
                className="flex items-center gap-2 p-1 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.institutes.includes(inst)}
                  onChange={() => toggleSelection('institutes', inst)}
                  className="rounded border-neutral-300 text-blue-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {inst}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Batches (Multi-select Mock) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Batches
          </label>
          <div className="h-32 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 space-y-1">
            {batchOptions.map((batch) => (
              <label
                key={batch}
                className="flex items-center gap-2 p-1 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.batches.includes(batch)}
                  onChange={() => toggleSelection('batches', batch)}
                  className="rounded border-neutral-300 text-blue-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {batch}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          Apply Advanced Filters
        </button>
      </div>
    </div>
  );
}
