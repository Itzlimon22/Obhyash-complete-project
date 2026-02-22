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
  onStatClick?: (type: 'active' | 'students' | 'premium' | 'total') => void;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  stats,
  isLoading,
  onStatClick,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Users',
      value: stats.total,
      icon: User,
      gradient: 'from-red-500 to-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
      onClick: () => onStatClick?.('total'),
    },
    {
      id: 'active',
      label: 'Active Users',
      value: stats.active,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      onClick: () => onStatClick?.('active'),
    },
    {
      id: 'students',
      label: 'Students',
      value: stats.students,
      icon: BookOpen,
      gradient: 'from-red-500 to-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
      onClick: () => onStatClick?.('students'),
    },
    {
      id: 'premium',
      label: 'Premium Users',
      value: stats.premium,
      icon: Crown,
      gradient: 'from-red-500 to-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
      onClick: () => onStatClick?.('premium'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
      {cards.map((stat, i) => (
        <button
          key={i}
          onClick={stat.onClick}
          className="bg-white dark:bg-neutral-900 p-3 md:p-6 rounded-2xl md:rounded-[1.75rem] border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-all group text-left w-full outline-none focus:ring-2 focus:ring-red-500/20"
        >
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div
              className={`p-2 md:p-3 rounded-lg md:rounded-xl ${stat.bg} bg-gradient-to-br ${stat.gradient} bg-clip-padding flex items-center justify-center`}
            >
              <stat.icon className="w-4.5 h-4.5 md:w-6 md:h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-[8px] md:text-xs font-extrabold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 mb-0.5 md:mb-1 opacity-80 truncate">
              {stat.label}
            </p>
            <p className="text-lg md:text-3xl font-bold text-neutral-900 dark:text-white">
              {isLoading ? '...' : stat.value.toLocaleString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default UserStatsCards;
