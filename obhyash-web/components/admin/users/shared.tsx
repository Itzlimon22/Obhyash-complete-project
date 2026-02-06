import React from 'react';
import { Shield, GraduationCap, User as UserIcon } from 'lucide-react';
import { UserRole, UserStatus } from '@/lib/types';

// --- Status Badge (স্ট্যাটাস ব্যাজ) ---
export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const styles = {
    Active:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    Inactive:
      'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
    Suspended:
      'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Inactive}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500' : status === 'Suspended' ? 'bg-rose-500' : 'bg-gray-400'}`}
      ></span>
      {status}
    </span>
  );
};

// --- Role Badge (রোল ব্যাজ) ---
export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const icons = {
    Admin: <Shield size={12} className="mr-1.5 text-indigo-500" />,
    Teacher: <GraduationCap size={12} className="mr-1.5 text-amber-500" />,
    Student: <UserIcon size={12} className="mr-1.5 text-brand-500" />,
  };

  return (
    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 font-medium">
      {icons[role] || icons.Student}
      {role}
    </div>
  );
};
