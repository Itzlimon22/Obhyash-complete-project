import { LayoutDashboard, FileEdit, History, Trophy, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  isLiveExam?: boolean;
  onSubmit?: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
  isLiveExam,
  onSubmit,
}) => {
  /* ── Live Exam Mode ─────────────────────────────────────────── */
  if (isLiveExam) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgb(0,0,0,0.08)]">
          <button
            onClick={onSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[15px] py-3.5 px-6 rounded-2xl shadow-lg shadow-red-600/20 active:scale-[0.96] transition-all flex items-center justify-center gap-2.5"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            জমা দাও
          </button>
          <button
            onClick={onMenuClick}
            className="p-3.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 rounded-2xl border border-neutral-200 dark:border-neutral-800 active:scale-[0.9] transition-all"
            aria-label="Menu"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Standard Tab Items ─────────────────────────────────────── */
  const items = [
    { id: 'dashboard', label: 'হোম', icon: LayoutDashboard },
    { id: 'history', label: 'ইতিহাস', icon: History },
    { id: 'setup', label: 'পরীক্ষা', icon: FileEdit, isCenter: true },
    { id: 'leaderboard', label: 'র‍্যাংক', icon: Trophy },
    { id: 'menu', label: 'মেনু', icon: Menu, action: 'menu' as const },
  ];

  const handleTap = (item: (typeof items)[0]) => {
    if (navigator.vibrate) navigator.vibrate(8);
    if (item.action === 'menu') onMenuClick();
    else onTabChange(item.id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="relative bg-white dark:bg-neutral-950 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-end justify-around px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          /* ── Center FAB ("পরীক্ষা") ───────────────────────────── */
          if (item.isCenter) {
            return (
              <div
                key={item.id}
                className="flex flex-col items-center -mt-5 relative z-10"
              >
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => handleTap(item)}
                  className={`
                    w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200
                    ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-emerald-700/30 dark:shadow-emerald-700/20'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-neutral-900/20 dark:shadow-white/10'
                    }
                  `}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </motion.button>
                <span
                  className={`text-[10px] font-bold mt-1.5 transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-500' : 'text-neutral-400 dark:text-neutral-500'}`}
                >
                  {item.label}
                </span>
              </div>
            );
          }

          /* ── Regular Tab ──────────────────────────────────────── */
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleTap(item)}
              className={`
                relative flex flex-col items-center justify-center flex-1 pt-3 pb-2 transition-colors duration-200
                ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-500'
                    : 'text-neutral-400 dark:text-neutral-500 active:text-neutral-600 dark:active:text-neutral-300'
                }
              `}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-emerald-700 dark:bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span
                className={`text-[10px] mt-1 transition-colors ${isActive ? 'font-bold' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
