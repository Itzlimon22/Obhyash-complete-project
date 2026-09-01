"use client";

import React from "react";
import {
  FileText,
  Binary,
  History,
  Trophy,
  LineChart,
  Radio,
} from "lucide-react";
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
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
      onClick: onExamClick,
    },
    {
      title: "ফর্মুলা",
      svgIcon: "/dashboard-icons/formulas.svg",
      hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
      onClick: onFormulasClick,
    },
    {
      title: "ইতিহাস",
      svgIcon: "/dashboard-icons/history_clock.svg",
      hoverBorder: "hover:border-sky-400 dark:hover:border-sky-600",
      onClick: onHistoryClick,
    },
    {
      title: "লিডারবোর্ড",
      svgIcon: "/dashboard-icons/leaderboard_trophy.svg",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
      onClick: onLeaderboardClick,
    },
    {
      title: "এনালাইসিস",
      svgIcon: "/dashboard-icons/analytics.svg",
      hoverBorder: "hover:border-purple-400 dark:hover:border-purple-600",
      onClick: onAnalysisClick,
    },
    {
      title: "লাইভ পরীক্ষা",
      svgIcon: "/dashboard-icons/live_exam.svg",
      hoverBorder: "hover:border-rose-400 dark:hover:border-rose-600",
      onClick: onLiveExamClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 font-['HindSiliguri']">
      {actions.map((action, idx) => {
        return (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            className={cn(
              "rounded-xl sm:rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:shadow-sm transition-all duration-150 active:scale-95 group cursor-pointer select-none",
              action.hoverBorder
            )}
          >
            {/* 3D Gamified SVG Badge Tile */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
              <img
                src={action.svgIcon}
                alt={action.title}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all"
              />
            </div>

            {/* Title */}
            <span className="text-xs sm:text-[13px] font-bold text-neutral-800 dark:text-neutral-200 truncate w-full text-center tracking-tight">
              {action.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DashboardActionGrid;

