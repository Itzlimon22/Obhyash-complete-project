import React from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (val: boolean) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs md:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:contents">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs md:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs md:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="mt-3 md:mt-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        >
          {showAdvancedFilters ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
          {showAdvancedFilters
            ? 'Hide Advanced Filters'
            : 'Show Advanced Filters'}
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
