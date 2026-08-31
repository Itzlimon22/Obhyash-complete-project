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
      primaryColor: "text-[#059669]",
      bgLight: "bg-[#ECFDF5] dark:bg-[#064E3B]/30",
      borderColor: "border-[#A7F3D0]/60 dark:border-[#059669]/30",
      onClick: onExamClick,
    },
    {
      title: "ফর্মুলা",
      icon: Binary,
      primaryColor: "text-[#6366F1]",
      bgLight: "bg-[#EEF2FF] dark:bg-[#312E81]/30",
      borderColor: "border-[#C7D2FE]/60 dark:border-[#6366F1]/30",
      onClick: onFormulasClick,
    },
    {
      title: "ইতিহাস",
      icon: History,
      primaryColor: "text-[#0284C7]",
      bgLight: "bg-[#F0F9FF] dark:bg-[#075985]/30",
      borderColor: "border-[#BAE6FD]/60 dark:border-[#0284C7]/30",
      onClick: onHistoryClick,
    },
    {
      title: "লিডারবোর্ড",
      icon: Trophy,
      primaryColor: "text-[#D97706]",
      bgLight: "bg-[#FFFBEB] dark:bg-[#78350F]/30",
      borderColor: "border-[#FDE68A]/60 dark:border-[#D97706]/30",
      onClick: onLeaderboardClick,
    },
    {
      title: "এনালাইসিস",
      icon: LineChart,
      primaryColor: "text-[#9333EA]",
      bgLight: "bg-[#FAF5FF] dark:bg-[#581C87]/30",
      borderColor: "border-[#E9D5FF]/60 dark:border-[#9333EA]/30",
      onClick: onAnalysisClick,
    },
    {
      title: "লাইভ পরীক্ষা",
      icon: Radio,
      primaryColor: "text-[#E11D48]",
      bgLight: "bg-[#FFF1F2] dark:bg-[#881337]/30",
      borderColor: "border-[#FECDD3]/60 dark:border-[#E11D48]/30",
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
            className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700 py-2 sm:py-2.5 px-1.5 sm:px-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 group select-none"
          >
            <div
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105",
                action.bgLight,
                action.borderColor,
                action.primaryColor
              )}
            >
              <Icon size={17} strokeWidth={2.2} />
            </div>

            <span className="text-xs sm:text-[13px] font-bold text-neutral-800 dark:text-neutral-200 truncate w-full text-center">
              {action.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DashboardActionGrid;
