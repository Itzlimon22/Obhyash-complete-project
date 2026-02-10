import { LayoutDashboard, FileEdit, History, Trophy, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

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
      label: 'হোম',
      icon: LayoutDashboard,
    },
    {
      id: 'history',
      label: 'ইতিহাস',
      icon: History,
    },
    {
      id: 'setup',
      label: 'পরীক্ষা',
      icon: FileEdit,
      isCenter: true,
    },
    {
      id: 'leaderboard',
      label: 'র‍্যাংক',
      icon: Trophy,
    },
    {
      id: 'menu',
      label: 'মেনু',
      icon: Menu,
      action: 'menu',
    },
  ];

  const handleTap = (item: (typeof items)[0]) => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (item.action === 'menu') {
      onMenuClick();
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Top subtle shadow/border */}
      <div className="bg-white dark:bg-neutral-950 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-stretch justify-around px-1 pb-safe">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleTap(item)}
              className={`
                relative flex items-center justify-center flex-1 py-4 transition-colors duration-200
                ${
                  isActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-neutral-400 dark:text-neutral-500 active:text-neutral-600 dark:active:text-neutral-300'
                }
              `}
            >
              {/* Active top indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-rose-500 dark:bg-rose-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
