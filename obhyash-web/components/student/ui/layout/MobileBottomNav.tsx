import React from 'react';
import { LayoutDashboard, FileEdit, History, Trophy, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
}) => {
  const items = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'setup',
      label: 'Exam', // Changed from 'Setup' to 'Exam' for better clarity
      icon: FileEdit,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
    {
      id: 'leaderboard',
      label: 'Rank',
      icon: Trophy,
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 flex items-center justify-around p-2 pb-safe">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

              {/* Optional: Tooltip or Label if needed, but icon-only is cleaner for floating nav */}
              {/* <span className="sr-only">{item.label}</span> */}
            </button>
          );
        })}

        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="relative flex items-center justify-center w-12 h-12 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
