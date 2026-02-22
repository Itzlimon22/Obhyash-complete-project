import React from 'react';
import { UserProfile } from '@/lib/types';
import UserAvatar from '../common/UserAvatar';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean; // Mobile state
  onClose: () => void; // Mobile close
  onLogout: () => void;
  isCollapsed: boolean; // Desktop collapsed state
  toggleCollapse: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user?: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  onLogout,
  isCollapsed,
  toggleCollapse,
  isDarkMode,
  toggleTheme,
  user,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'ড্যাশবোর্ড',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      ),
    },
    {
      id: 'setup',
      label: 'মক পরীক্ষা',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
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
      id: 'practice',
      label: 'অনুশীলন',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
        />
      ),
    },
    {
      id: 'leaderboard',
      label: 'লিডারবোর্ড',
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
      label: 'এনালাইসিস',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      ),
    },
    {
      id: 'my-reports',
      label: 'আমার রিপোর্ট',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
        />
      ),
    },
    {
      id: 'complaint',
      label: 'অভিযোগ ও পরামর্শ',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      ),
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed lg:static top-0 left-0 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-[60] transition-all duration-300 ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] transform shadow-xl lg:shadow-none flex flex-col justify-between
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div
            className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-neutral-100 dark:border-neutral-800 shrink-0`}
          >
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onTabChange('dashboard')}
            >
              <div className="w-9 h-9 bg-emerald-700 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-tight font-sans">
                    OBHYASH
                  </span>
                  <span className="text-xl font-bold text-neutral-900 dark:text-white font-serif-exam leading-tight">
                    অভ্যাস
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`
                    relative w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'} py-2.5 rounded-xl transition-all duration-300 group
                    ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={`
                    transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}
                  `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      {item.icon}
                    </svg>
                  </span>
                  {!isCollapsed && (
                    <span
                      className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/50">
            {/* User Card */}
            {user && (
              <button
                onClick={() => onTabChange('settings')}
                className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center p-1' : 'gap-3 p-2.5'} rounded-xl 
                        bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700
                        hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 shadow-sm group
                    `}
                title={isCollapsed ? 'Profile' : undefined}
              >
                <UserAvatar
                  user={user}
                  size="sm"
                  className="group-hover:scale-105 transition-transform"
                />

                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                      Settings & Profile
                    </p>
                  </div>
                )}

                {!isCollapsed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )}

            <div
              className={`flex ${isCollapsed ? 'flex-col gap-3' : 'justify-between items-center'} px-1`}
            >
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? (
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
                      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                    />
                  </svg>
                ) : (
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
                      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                    />
                  </svg>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 hover:text-red-600 transition-all"
                title="Logout"
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
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12H9m9 0-3-3m3 3-3 3"
                  />
                </svg>
              </button>

              {/* Collapse Toggle (Desktop Only) */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-2 rounded-lg text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-red-600 transition-all"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
