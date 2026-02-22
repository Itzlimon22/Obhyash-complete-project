import React from 'react';

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
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      ),
    },
    {
      id: 'history',
      label: 'ইতিহাস',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      ),
    },
    {
      id: 'leaderboard',
      label: 'র‍্যাংক',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002"
        />
      ),
    },
    {
      id: 'analysis',
      label: 'রিপোর্ট',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
        />
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pb-safe z-50 lg:hidden px-2 py-1 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={activeTab === item.id ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={activeTab === item.id ? 2 : 1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {item.icon}
          </svg>
          <span className="text-[10px] font-medium tracking-wide">
            {item.label}
          </span>
        </button>
      ))}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        <span className="text-[10px] font-medium tracking-wide">মেনু</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
