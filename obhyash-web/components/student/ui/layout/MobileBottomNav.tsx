import { LayoutDashboard, FileEdit, History, Trophy, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  isLiveExam?: boolean;
  onSubmit?: () => void;
  isOmrMode?: boolean;
  onUpload?: () => void;
  hasSelectedScript?: boolean;
  answeredCount?: number;
  totalQuestions?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
  isLiveExam,
  onSubmit,
  isOmrMode,
  onUpload,
  hasSelectedScript,
  answeredCount,
  totalQuestions,
}) => {
  /* ── Live Exam Mode ─────────────────────────────────────────── */
  if (isLiveExam) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgb(0,0,0,0.08)]">
          {isOmrMode ? (
            <div className="flex-1 flex gap-2">
              <button
                onClick={onUpload}
                className={`flex-1 font-bold text-sm py-2.5 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${hasSelectedScript ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 active:scale-[0.96]'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                </svg>
                {hasSelectedScript ? 'সংগৃহীত' : 'OMR ক্যাপচার'}
              </button>
              <button
                onClick={onSubmit}
                disabled={!hasSelectedScript}
                className="flex-[1.2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 disabled:shadow-none text-white font-extrabold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.96] transition-all flex items-center justify-center gap-2"
              >
                জমা দাও
              </button>
            </div>
          ) : (
            <button
              onClick={onSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[14px] py-3 px-6 rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.96] transition-all flex items-center justify-center gap-2.5"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              পরীক্ষা শেষ করো
            </button>
          )}
          <button
            onClick={onMenuClick}
            className="p-3 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 rounded-xl border border-neutral-200 dark:border-neutral-800 active:scale-[0.9] transition-all"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={2.5} />
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
