'use client';

import React from 'react';
import { Video, Users, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScheduleCardProps {
  title?: string;
  timeInfo?: string;
  conductorsText?: string;
  buttonText?: string;
  onJoin?: () => void;
  className?: string;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
];

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  title = 'Daily Meeting',
  timeInfo = '12+ Person • 8:30 PM',
  conductorsText = 'They will conduct the meeting',
  buttonText = 'Click for meeting link',
  onJoin,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#151515] rounded-3xl p-5 shadow-card border border-slate-100/80 dark:border-zinc-800/80',
        'flex flex-col justify-between',
        className,
      )}
    >
      {/* Top Header with Video Icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#e0d6ff] dark:bg-[#2e2354] flex items-center justify-center text-[#6744c8] dark:text-[#b89eff] shrink-0">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h4>
          <p className="text-xs font-medium text-slate-400 dark:text-zinc-400">
            {timeInfo}
          </p>
        </div>
      </div>

      {/* Middle Avatar Group & Conductor Note */}
      <div className="my-4 flex items-center gap-3">
        {/* Overlapping Avatars */}
        <div className="flex -space-x-2.5 overflow-hidden shrink-0">
          {DEFAULT_AVATARS.map((src, i) => (
            <img
              key={i}
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#151515] object-cover"
              src={src}
              alt="Mentor"
            />
          ))}
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">
          {conductorsText}
        </p>
      </div>

      {/* Action Button: Dark Capsule */}
      <button
        onClick={onJoin}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-slate-950 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 shadow-sm"
      >
        <span>{buttonText}</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </button>
    </div>
  );
};

export default ScheduleCard;
