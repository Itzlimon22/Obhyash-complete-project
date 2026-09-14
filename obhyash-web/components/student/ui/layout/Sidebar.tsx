"use client";

import React, { useMemo } from "react";
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
  X,
} from "lucide-react";
import { UserProfile } from "@/lib/types";
import { isUserPro } from "@/lib/subscription-utils";
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
  const isPro = useMemo(() => isUserPro(user), [user]);

  // ── Streamlined Menu Items (Referral and Formula removed) ──
  const menuItems = [
    {
      id: "dashboard",
      label: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      svg: "/dashboard-icons/fire_streak.svg",
    },
    {
      id: "setup",
      label: "পরীক্ষা",
      icon: FileEdit,
      svg: "/dashboard-icons/exam_pencil.svg",
    },
    {
      id: "live_exam",
      label: "লাইভ পরীক্ষা",
      icon: Radio,
      svg: "/dashboard-icons/live_exam.svg",
    },
    {
      id: "question_bank",
      label: "প্রশ্ন ব্যাংক",
      icon: BookOpen,
      svg: "/dashboard-icons/help_question.svg",
    },
    {
      id: "history",
      label: "ইতিহাস",
      icon: History,
      svg: "/dashboard-icons/history_clock.svg",
    },
    {
      id: "practice",
      label: "অনুশীলন",
      icon: PenTool,
      svg: "/dashboard-icons/practice_target.svg",
    },
    {
      id: "leaderboard",
      label: "লিডারবোর্ড",
      icon: Trophy,
      svg: "/dashboard-icons/leaderboard_trophy.svg",
    },
    {
      id: "analysis",
      label: "এনালাইসিস",
      icon: BarChart2,
      svg: "/dashboard-icons/analytics.svg",
    },
    {
      id: "blog",
      label: "ব্লগ",
      icon: Newspaper,
      svg: "/dashboard-icons/feature_lightbulb.svg",
    },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 touch-none"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer (Width: 240px on mobile, 210px on desktop, 64px collapsed) ── */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full h-[100dvh] bg-white dark:bg-[#000000] border-r border-[#E5E7EB] dark:border-[#2C2C2C] z-[60] 
          transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform shadow-2xl lg:shadow-none flex flex-col justify-between
          select-none font-['HindSiliguri',sans-serif] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
          ${isOpen ? "translate-x-0 w-[240px]" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-[64px]" : "lg:w-[210px]"}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* ── Brand Header (Height 52px matching top bar, px-3.5) ── */}
          <div
            className={`h-[52px] flex items-center justify-between ${
              isCollapsed ? "px-2 justify-center" : "px-3.5"
            } border-b border-[#E5E7EB] dark:border-[#2C2C2C] shrink-0`}
          >
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => {
                onTabChange("dashboard");
                if (window.innerWidth < 1024) onClose();
              }}
            >
              {/* Logo: 32x32 with borderRadius 8 */}
              <div className="w-[32px] h-[32px] rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center bg-[#059669]">
                <img
                  src="/obhyash_logo.svg"
                  alt="Obhyash Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = "none";
                  }}
                />
              </div>

              {/* Brand Text Column */}
              {!isCollapsed && (
                <div className="flex flex-col justify-center text-left leading-none">
                  <span className="text-[10px] font-semibold text-[#A3A3A3] dark:text-[#737373] tracking-[1.5px] font-sans">
                    OBHYASH
                  </span>
                  <span className="text-[15.5px] font-semibold text-[#000000] dark:text-white font-['Anek_Bangla',sans-serif] leading-[1.1] mt-0.5">
                    অভ্যাস
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Navigation (Clean, compact list) ── */}
          <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === "question_bank" && (activeTab === "question-bank" || activeTab === "question_bank")) ||
                (item.id === "practice" && activeTab === "bookmarks") ||
                (item.id === "leaderboard" && (activeTab === "legends-league" || activeTab === "legends_league"));

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center ${
                      isCollapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-[7.5px]"
                    } rounded-[10px] transition-all duration-300 group text-left cursor-pointer relative
                    ${
                      isActive
                        ? isCollapsed
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/50"
                          : "bg-[#12544F] dark:bg-[#092328] text-white border border-[#12544F] dark:border-[#2C2C2C]"
                        : "text-[#525252] dark:text-[#E5E5E5] hover:bg-[#F5F5F5] dark:hover:bg-[#1C1C1E] border border-transparent"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isCollapsed ? (
                    <span className="relative flex items-center justify-center">
                      <img
                        src={item.svg}
                        alt={item.label}
                        className={`w-6 h-6 object-contain transition-transform duration-200 ${
                          isActive ? "scale-105" : "group-hover:scale-105 opacity-85 group-hover:opacity-100"
                        }`}
                      />
                      {isActive && (
                        <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#000000]" />
                      )}
                    </span>
                  ) : (
                    <>
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                        <img
                          src={item.svg}
                          alt={item.label}
                          className={`w-6 h-6 object-contain ${
                            isActive ? "brightness-125" : "opacity-85 group-hover:opacity-100"
                          }`}
                        />
                      </div>

                      <span
                        className={`text-[13.5px] font-['Anek_Bangla',sans-serif] tracking-[0.1px] truncate ${
                          isActive
                            ? "font-semibold text-white"
                            : "font-normal text-[#525252] dark:text-[#E5E5E5]"
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Bottom Section ── */}
          <div className="p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#E5E7EB] dark:border-[#2C2C2C] bg-[#FAFAFA] dark:bg-[#000000] space-y-2 shrink-0">
            {/* User Button */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  onTabChange("settings");
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center ${
                    isCollapsed ? "justify-center p-1.5" : "gap-2.5 p-2"
                  } rounded-[10px] 
                  ${
                    activeTab === "settings" || activeTab === "profile"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 dark:border-emerald-600/40 ring-1 ring-emerald-500/20"
                      : "bg-white dark:bg-[#092328] border-[#E5E7EB] dark:border-[#2C2C2C]"
                  } border
                  transition-all duration-200 text-left group cursor-pointer
                `}
                title={isCollapsed ? `${user.name} - Settings & Profile` : undefined}
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    user={user}
                    size="sm"
                    className="w-8 h-8 rounded-full ring-[1.5px] ring-white"
                  />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#000000] dark:text-white truncate leading-tight font-['Anek_Bangla',sans-serif]">
                      {user.name || "শিক্ষার্থী"}
                    </p>
                    <p className="text-[11px] font-normal text-[#737373] dark:text-[#A3A3A3] truncate leading-tight mt-0.5">
                      Settings & Profile
                    </p>
                  </div>
                )}

                {!isCollapsed && (
                  <ChevronRight
                    size={15}
                    className="text-[#A3A3A3] shrink-0"
                  />
                )}
              </button>
            )}

            {/* Actions Row */}
            <div
              className={`flex ${
                isCollapsed ? "flex-col gap-1.5" : "justify-between items-center"
              }`}
            >
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-[7px] bg-white dark:bg-[#1C1C1E] text-[#737373] hover:text-[#000000] dark:hover:text-white transition-all cursor-pointer shadow-xs border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                title={isDarkMode ? "লাইট মোড চালু করো" : "ডার্ক মোড চালু করো"}
                aria-label="Theme toggle"
              >
                {isDarkMode ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                  onLogout();
                }}
                className="p-1.5 rounded-[7px] bg-white dark:bg-[#1C1C1E] text-[#737373] hover:text-[#B91C1C] hover:bg-[#E11D48]/20 transition-all cursor-pointer shadow-xs border border-transparent"
                title="লগআউট করো"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 rounded-[7px] bg-white dark:bg-[#1C1C1E] text-[#737373] hover:text-[#000000] dark:hover:text-white transition-all cursor-pointer shadow-xs border border-transparent"
                title={isCollapsed ? "প্রসারিত করো" : "সংকোচন করো"}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft
                  size={18}
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
