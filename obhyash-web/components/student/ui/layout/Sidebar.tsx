"use client";

import React from "react";
import {
  LayoutDashboard,
  FileEdit,
  Radio,
  History,
  PenTool,
  Trophy,
  BarChart2,
  Newspaper,
  BookOpen,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { UserProfile } from "@/lib/types";
import UserAvatar from "../common/UserAvatar";

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean; // Mobile state
  onClose: () => void; // Mobile close
  onLogout: () => void;
  isCollapsed?: boolean; // Desktop collapsed state
  toggleCollapse?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  onLogout,
  isCollapsed = false,
  toggleCollapse = () => {},
  isDarkMode,
  toggleTheme,
  user,
}) => {
  // ── Exact 9 Menu Items from Flutter MainSidebar.dart ───────────────────────
  const menuItems = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { id: "setup", label: "পরীক্ষা", icon: FileEdit },
    { id: "live_exam", label: "লাইভ পরীক্ষা", icon: Radio },
    { id: "history", label: "ইতিহাস", icon: History },
    { id: "practice", label: "অনুশীলন", icon: PenTool },
    { id: "leaderboard", label: "লিডারবোর্ড", icon: Trophy },
    { id: "analysis", label: "এনালাইসিস", icon: BarChart2 },
    { id: "blog", label: "ব্লগ", icon: Newspaper },
  ];

  const handleItemClick = (id: string) => {
    if (id === "blog") {
      window.location.href = "/blog";
      return;
    }
    onTabChange(id);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* ── Mobile Backdrop Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / Drawer (Width: 250px, Background: #0C0A09 / white) ── */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full bg-white dark:bg-[#0C0A09] border-r border-[#F5F5F5] dark:border-[#1C1C1E] z-[60] 
          transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform shadow-2xl lg:shadow-none flex flex-col justify-between
          select-none font-['HindSiliguri',sans-serif]
          ${isOpen ? "translate-x-0 w-[250px]" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-[250px]"}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* ── 1. Brand Logo & Title (Matching Flutter MainSidebar Header: h-16, px-5) ── */}
          <div
            className={`h-16 flex items-center ${
              isCollapsed ? "justify-center px-2" : "justify-start px-5"
            } border-b border-[#F5F5F5] dark:border-[#1C1C1E] shrink-0`}
          >
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                onTabChange("dashboard");
                if (window.innerWidth < 1024) onClose();
              }}
            >
              {/* Emerald Green Logo Box (36x36, rounded-lg, #059669) */}
              <div className="w-9 h-9 bg-[#059669] rounded-[8px] flex items-center justify-center text-white shadow-[0_2px_4px_rgba(4,120,87,0.2)] group-hover:scale-105 transition-transform shrink-0">
                <BookOpen size={20} className="stroke-[2.2]" />
              </div>

              {/* Brand Text Column */}
              {!isCollapsed && (
                <div className="flex flex-col justify-center text-left leading-none">
                  <span className="text-[13px] font-bold text-[#A3A3A3] dark:text-[#737373] uppercase tracking-[2px] font-sans">
                    OBHYASH
                  </span>
                  <span className="text-[22px] font-bold text-[#000000] dark:text-white font-['Anek_Bangla',sans-serif] leading-[1.1] mt-0.5">
                    অভ্যাস
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. Navigation Items (Matching Flutter: px-3, py-6, 9 items) ── */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === "practice" && activeTab === "bookmarks") ||
                (item.id === "formulas" && activeTab === "formulas");

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center ${
                      isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                    } rounded-[12px] transition-all duration-200 group text-left cursor-pointer
                    ${
                      isActive
                        ? "bg-[#059669] text-white shadow-[0_2px_6px_rgba(5,150,105,0.25)] font-semibold"
                        : "text-[#525252] dark:text-[#E5E5E5] hover:bg-[#F5F5F5] dark:hover:bg-[#1C1C1E] font-semibold"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={`shrink-0 transition-transform duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-white stroke-[2.2]"
                          : "text-[#525252] dark:text-[#A3A3A3] group-hover:text-neutral-900 dark:group-hover:text-white stroke-[2]"
                      }
                    />
                  </span>

                  {!isCollapsed && (
                    <span
                      className={`text-[16px] font-['Anek_Bangla',sans-serif] font-semibold tracking-[0.2px] truncate ${
                        isActive ? "text-white font-semibold" : "text-[#525252] dark:text-[#E5E5E5]"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── 3. Bottom Section (Matching Flutter: p-4, bg #FAFAFA/50 / #171717/50, border-t) ── */}
          <div className="p-4 border-t border-[#F5F5F5] dark:border-[#1C1C1E] bg-[#FAFAFA]/50 dark:bg-[#171717]/50 space-y-3 shrink-0">
            {/* User Profile Card */}
            {user && (
              <button
                onClick={() => {
                  onTabChange("settings");
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center ${
                    isCollapsed ? "justify-center p-1.5" : "gap-3 p-2.5"
                  } rounded-[12px] 
                  bg-white dark:bg-[#1C1C1E] border border-[#E5E5E5] dark:border-[#27272A]
                  shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#059669]/60 dark:hover:border-[#059669]/60 
                  transition-all duration-200 text-left group cursor-pointer
                `}
                title={isCollapsed ? `${user.name} - Settings & Profile` : undefined}
              >
                <UserAvatar
                  user={user}
                  size="sm"
                  className="w-9 h-9 rounded-full ring-[1.5px] ring-white dark:ring-[#1C1C1E] group-hover:scale-105 transition-transform shrink-0"
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-[#000000] dark:text-white truncate leading-tight font-['Anek_Bangla',sans-serif]">
                      {user.name || "শিক্ষার্থী"}
                    </p>
                    <p className="text-[13px] font-medium text-[#737373] dark:text-[#A3A3A3] truncate leading-tight mt-0.5">
                      Settings & Profile
                    </p>
                  </div>
                )}

                {!isCollapsed && (
                  <ChevronRight
                    size={16}
                    className="text-[#A3A3A3] group-hover:text-[#059669] transition-colors shrink-0"
                  />
                )}
              </button>
            )}

            {/* Actions Row (Theme Toggle, Logout, Collapse) */}
            <div
              className={`flex ${
                isCollapsed ? "flex-col gap-2" : "justify-between items-center"
              }`}
            >
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-[8px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5E5] dark:border-[#27272A] text-[#737373] hover:text-[#000000] dark:hover:text-white transition-all shadow-xs cursor-pointer"
                title={isDarkMode ? "লাইট মোড চালু করো" : "ডার্ক মোড চালু করো"}
                aria-label="Theme toggle"
              >
                {isDarkMode ? (
                  <Sun size={20} className="text-amber-400" />
                ) : (
                  <Moon size={20} />
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                  onLogout();
                }}
                className="p-2 rounded-[8px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5E5] dark:border-[#27272A] text-[#737373] hover:text-[#B91C1C] hover:bg-[#E11D48]/10 transition-all shadow-xs cursor-pointer"
                title="লগআউট করো"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-2 rounded-[8px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5E5] dark:border-[#27272A] text-[#A3A3A3] hover:text-[#000000] dark:hover:text-white transition-all shadow-xs cursor-pointer"
                title={isCollapsed ? "Expand" : "Collapse"}
                aria-label="Collapse"
              >
                <ChevronLeft
                  size={20}
                  className={`transition-transform duration-300 ${
                    isCollapsed ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
