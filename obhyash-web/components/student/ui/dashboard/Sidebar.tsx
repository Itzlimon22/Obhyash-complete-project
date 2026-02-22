import React, { useState } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Clock,
  Trophy,
  BarChart3,
  Moon,
  Sun,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  user?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  onLogout,
  toggleTheme,
  isDarkMode,
  user,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'setup', label: 'মক পরীক্ষা', icon: FileText },
    { id: 'history', label: 'ইতিহাস', icon: Clock },
    { id: 'leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
    { id: 'analysis', label: 'এনালাইসিস', icon: BarChart3 },
    { id: 'complaint', label: 'সাপোর্ট ও অভিযোগ', icon: MessageSquare },
  ];

  const handleLinkClick = (id: string) => {
    onTabChange(id);
    onClose(); // Close mobile menu if open
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed lg:static top-0 left-0 h-full bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 z-50 transition-all duration-300 transform shadow-sm
        ${isOpen ? 'tranneutral-x-0' : '-tranneutral-x-full lg:tranneutral-x-0'}
        ${collapsed ? 'w-20' : 'w-72'}
      `}
      >
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div
            className={`h-20 flex items-center px-6 border-b border-red-50 dark:border-neutral-800 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden whitespace-nowrap">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] leading-none mb-0.5">
                  OBHYASH
                </span>
                <span className="block text-xl font-bold font-serif-exam text-neutral-800 dark:text-white leading-none">
                  অভ্যাস
                </span>
              </div>
            )}
            {/* Mobile Close Button */}
            <button
              className="ml-auto lg:hidden p-1 text-neutral-400"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  title={collapsed ? item.label : ''}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative
                    ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }
                    ${collapsed ? 'justify-center px-0' : ''}
                  `}
                >
                  <item.icon
                    className={`shrink-0 transition-all ${collapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
                  />

                  {!collapsed && (
                    <span className="font-semibold text-[15px] tracking-wide">
                      {item.label}
                    </span>
                  )}

                  {/* Active Indicator on Left (Optional, maybe specific to design preference) */}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-50"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer - Profile */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
            <div
              className={`
              bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 
              transition-all duration-300 group hover:border-red-200 dark:hover:border-neutral-700 hover:shadow-sm
              ${collapsed ? 'items-center justify-center flex flex-col gap-2' : ''}
            `}
            >
              <div
                className={`flex items-center gap-3 cursor-pointer ${collapsed ? 'flex-col' : ''}`}
                onClick={() => handleLinkClick('profile')}
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                  {user?.name?.[0] || 'U'}
                </div>

                {!collapsed && (
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-neutral-800 dark:text-white text-sm truncate">
                      {user?.name || 'আপনি (You)'}
                    </h4>
                    <p className="text-xs text-neutral-500 truncate">
                      Settings & Profile
                    </p>
                  </div>
                )}

                {!collapsed && (
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div
              className={`mt-4 flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between px-2'}`}
            >
              <button
                onClick={onLogout}
                className="text-neutral-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>

              <button
                onClick={toggleTheme}
                className="text-neutral-400 hover:text-emerald-600 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:block text-neutral-300 hover:text-neutral-500 transition-colors"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
