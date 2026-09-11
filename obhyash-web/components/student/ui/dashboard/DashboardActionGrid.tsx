"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DashboardActionGridProps {
  onExamClick: () => void;
  onFormulasClick: () => void;
  onHistoryClick: () => void;
  onLeaderboardClick: () => void;
  onAnalysisClick: () => void;
  onLiveExamClick: () => void;
}

export const DashboardActionGrid: React.FC<DashboardActionGridProps> = ({
  onExamClick,
  onFormulasClick,
  onHistoryClick,
  onLeaderboardClick,
  onAnalysisClick,
  onLiveExamClick,
}) => {
  const actions = [
    {
      title: "পরীক্ষা",
      svgIcon: "/dashboard-icons/exam_pencil.svg",
      primaryColor: "#12544F",
      lightBg: "bg-[#E6F0EC] dark:bg-[#12544F]/18",
      hoverBorder: "hover:border-[#12544F] dark:hover:border-[#34D399]",
      onClick: onExamClick,
    },
    {
      title: "ফর্মুলা",
      svgIcon: "/dashboard-icons/formulas.svg",
      primaryColor: "#601D49",
      lightBg: "bg-[#FDF2F8] dark:bg-[#601D49]/18",
      hoverBorder: "hover:border-[#601D49] dark:hover:border-[#D946EF]",
      onClick: onFormulasClick,
    },
    {
      title: "ইতিহাস",
      svgIcon: "/dashboard-icons/history_clock.svg",
      primaryColor: "#12544F",
      lightBg: "bg-[#E6F0EC] dark:bg-[#12544F]/18",
      hoverBorder: "hover:border-[#12544F] dark:hover:border-[#34D399]",
      onClick: onHistoryClick,
    },
    {
      title: "লিডারবোর্ড",
      svgIcon: "/dashboard-icons/leaderboard_trophy.svg",
      primaryColor: "#601D49",
      lightBg: "bg-[#FDF2F8] dark:bg-[#601D49]/18",
      hoverBorder: "hover:border-[#601D49] dark:hover:border-[#D946EF]",
      onClick: onLeaderboardClick,
    },
    {
      title: "এনালাইসিস",
      svgIcon: "/dashboard-icons/analytics.svg",
      primaryColor: "#12544F",
      lightBg: "bg-[#E6F0EC] dark:bg-[#12544F]/18",
      hoverBorder: "hover:border-[#12544F] dark:hover:border-[#34D399]",
      onClick: onAnalysisClick,
    },
    {
      title: "লাইভ পরীক্ষা",
      svgIcon: "/dashboard-icons/live_exam.svg",
      primaryColor: "#740A03",
      lightBg: "bg-[#FEF2F2] dark:bg-[#740A03]/18",
      hoverBorder: "hover:border-[#740A03] dark:hover:border-[#F87171]",
      onClick: onLiveExamClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 font-['HindSiliguri']">
      {actions.map((action, idx) => {
        return (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            className={cn(
              "rounded-2xl bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] p-2.5 sm:p-3.5 flex flex-col items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 group cursor-pointer select-none",
              action.hoverBorder
            )}
          >
            {/* Gamified 3D Icon Badge Container */}
            <div
              className={cn(
                "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
                action.lightBg
              )}
            >
              <img
                src={action.svgIcon}
                alt={action.title}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs group-hover:drop-shadow-sm transition-all"
              />
            </div>

            {/* Title */}
            <span className="text-xs sm:text-[13.5px] font-bold text-[#1F2937] dark:text-[#F3F4F6] truncate w-full text-center tracking-tight">
              {action.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DashboardActionGrid;
