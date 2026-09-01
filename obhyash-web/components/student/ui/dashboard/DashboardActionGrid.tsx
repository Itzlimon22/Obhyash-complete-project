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
      icon: FileText,
      primaryColor: "text-[#059669] dark:text-emerald-400",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800/60",
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
      onClick: onExamClick,
    },
    {
      title: "ফর্মুলা",
      icon: Binary,
      primaryColor: "text-[#6366F1] dark:text-indigo-400",
      bgLight: "bg-indigo-50 dark:bg-indigo-950/50",
      borderColor: "border-indigo-200 dark:border-indigo-800/60",
      hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
      onClick: onFormulasClick,
    },
    {
      title: "ইতিহাস",
      icon: History,
      primaryColor: "text-[#0284C7] dark:text-sky-400",
      bgLight: "bg-sky-50 dark:bg-sky-950/50",
      borderColor: "border-sky-200 dark:border-sky-800/60",
      hoverBorder: "hover:border-sky-400 dark:hover:border-sky-600",
      onClick: onHistoryClick,
    },
    {
      title: "লিডারবোর্ড",
      icon: Trophy,
      primaryColor: "text-[#D97706] dark:text-amber-400",
      bgLight: "bg-amber-50 dark:bg-amber-950/50",
      borderColor: "border-amber-200 dark:border-amber-800/60",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
      onClick: onLeaderboardClick,
    },
    {
      title: "এনালাইসিস",
      icon: LineChart,
      primaryColor: "text-[#9333EA] dark:text-purple-400",
      bgLight: "bg-purple-50 dark:bg-purple-950/50",
      borderColor: "border-purple-200 dark:border-purple-800/60",
      hoverBorder: "hover:border-purple-400 dark:hover:border-purple-600",
      onClick: onAnalysisClick,
    },
    {
      title: "লাইভ পরীক্ষা",
      icon: Radio,
      primaryColor: "text-[#E11D48] dark:text-rose-400",
      bgLight: "bg-rose-50 dark:bg-rose-950/50",
      borderColor: "border-rose-200 dark:border-rose-800/60",
      hoverBorder: "hover:border-rose-400 dark:hover:border-rose-600",
      onClick: onLiveExamClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 font-['HindSiliguri']">
      {actions.map((action, idx) => {
        const Icon = action.icon;
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
            {/* Solid Icon Tile */}
            <div
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shadow-2xs transition-transform duration-150 group-hover:scale-106",
                action.bgLight,
                action.borderColor,
                action.primaryColor
              )}
            >
              <Icon size={19} className="sm:w-5 sm:h-5" strokeWidth={2.3} />
            </div>

            {/* Title */}
            <span className="text-xs sm:text-[12.5px] font-bold text-neutral-800 dark:text-neutral-200 truncate w-full text-center tracking-tight">
              {action.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DashboardActionGrid;

