import React from 'react';
import { User, UserCheck, BookOpen, Crown } from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    total: number;
    active: number;
    students: number;
    premium: number;
  };
  isLoading: boolean;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  stats,
  isLoading,
}) => {
  const cards = [
    {
      label: 'Total Users',
      value: stats.total,
      icon: User,
      gradient: 'from-rose-500 to-red-500',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      label: 'Active Users',
      value: stats.active,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Students',
      value: stats.students,
      icon: BookOpen,
      gradient: 'from-rose-500 to-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      label: 'Premium Users',
      value: stats.premium,
      icon: Crown,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-3 rounded-xl ${stat.bg} bg-gradient-to-br ${stat.gradient} bg-clip-padding`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {stat.label}
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {isLoading ? '...' : stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCards;
