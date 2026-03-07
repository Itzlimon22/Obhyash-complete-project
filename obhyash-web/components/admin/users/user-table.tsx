import React, { useState, useMemo } from 'react';
import { Search, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

import { User, UserRole } from '@/lib/types';
import { StatusBadge, RoleBadge } from './shared';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | UserRole>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'All' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-obsidian-900 p-4 rounded-xl border border-paper-200 dark:border-obsidian-800 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -tranneutral-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'All' | UserRole)}
            className="pl-3 pr-8 py-2 bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 rounded-lg text-sm font-medium dark:text-white focus:border-brand-500 outline-none cursor-pointer"
          >
            <option value="All">সকল রোল</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 rounded-xl overflow-visible shadow-sm min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper-50 dark:bg-obsidian-950 border-b border-paper-200 dark:border-obsidian-800 text-xs uppercase text-gray-500 font-semibold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Subscription</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-100 dark:divide-obsidian-800 text-sm">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-paper-50 dark:hover:bg-obsidian-950/50 group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-obsidian-800 flex items-center justify-center text-gray-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-paper-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {user.subscription.plan}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === user.id ? null : user.id)
                    }
                    className="p-1.5 text-gray-400 hover:text-paper-900 dark:hover:text-white rounded hover:bg-paper-100 dark:hover:bg-obsidian-800"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === user.id && (
                    <div className="absolute right-8 top-8 z-20 w-40 bg-white dark:bg-obsidian-900 rounded-lg shadow-xl border border-paper-200 dark:border-obsidian-800 py-1 text-left animate-fade-in">
                      <button
                        onClick={() => {
                          onEdit(user);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-sm hover:bg-paper-50 dark:hover:bg-obsidian-800 flex items-center gap-2 dark:text-gray-200"
                      >
                        <Edit2 size={14} /> এডিট করো
                      </button>
                      <button
                        onClick={() => {
                          onDelete(user.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> ডিলিট করো
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            কোনো ইউজার পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
};
