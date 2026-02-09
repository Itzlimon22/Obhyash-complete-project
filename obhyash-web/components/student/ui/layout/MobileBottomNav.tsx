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
  // Reordered: Home, History, Exam (center), Rank, Menu
  const items = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
    {
      id: 'setup',
      label: 'Exam',
      icon: FileEdit,
      isCenter: true, // Special flag for center button
    },
    {
      id: 'leaderboard',
      label: 'Rank',
      icon: Trophy,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      action: 'menu',
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 rounded-3xl shadow-xl shadow-black/10 dark:shadow-black/30 flex items-center justify-around p-2 pb-safe">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const isCenter = item.isCenter;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action === 'menu') {
                  onMenuClick();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`
                relative flex items-center justify-center transition-all duration-300
                ${
                  isCenter
                    ? 'w-14 h-14 -mt-6 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/40 scale-100 hover:scale-105 active:scale-95'
                    : isActive
                      ? 'w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'w-12 h-12 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
              `}
            >
              <Icon
                size={isCenter ? 24 : 22}
                strokeWidth={isCenter || isActive ? 2.5 : 2}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
