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
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="Student">Student</option>
          <option value="Teacher">Teacher</option>
          <option value="Admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        >
          {showAdvancedFilters ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
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
