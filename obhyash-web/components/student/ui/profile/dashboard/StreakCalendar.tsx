'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface MonthCalendarDay {
  date: string;
  dayOfMonth: number;
  examCount: number;
  isCurrentMonth: boolean;
}

interface StreakCalendarProps {
  calendarData: MonthCalendarDay[];
  streakCount: number;
}

const WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const StreakCalendar: React.FC<StreakCalendarProps> = ({
  calendarData,
  streakCount,
}) => {
  const [hoveredDay, setHoveredDay] = useState<MonthCalendarDay | null>(null);

  // Clean, solid colors without light faded pastel tints
  const getColorClass = (examCount: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-neutral-50 dark:bg-[#141416] text-neutral-300 dark:text-[#3f3f46]';
    if (examCount === 0) return 'bg-neutral-100 dark:bg-[#222226] text-neutral-600 dark:text-[#a1a1aa] border border-neutral-200/80 dark:border-[#2c2c30]';
    if (examCount === 1) return 'bg-[#059669] text-white shadow-sm font-bold';
    return 'bg-[#047857] dark:bg-[#10b981] text-white shadow-md font-bold';
  };

  // Get current month name in Bengali
  const getMonthName = () => {
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    return months[new Date().getMonth()];
  };

  // Split calendar data into weeks
  const weeks: MonthCalendarDay[][] = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] shadow-sm p-5 sm:p-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#27272a] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center min-w-[80px]">
            {getMonthName()}
          </h3>
          <button className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#27272a] transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{streakCount} দিন স্ট্রিক</span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-neutral-400 dark:text-neutral-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1 sm:space-y-1.5 relative">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {week.map((day, dayIdx) => (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={`
                  aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold cursor-pointer
                  transition-all duration-150 hover:scale-105
                  ${getColorClass(day.examCount, day.isCurrentMonth)}
                `}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {day.dayOfMonth}
              </div>
            ))}
          </div>
        ))}

        {/* Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-3.5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs rounded-xl shadow-xl pointer-events-none z-10 border border-white/10 dark:border-black/10">
            <div className="font-bold">
              {new Date(hoveredDay.date).toLocaleDateString('bn-BD', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="text-[11px] opacity-80">
              {hoveredDay.examCount > 0
                ? `${hoveredDay.examCount}টি পরীক্ষা`
                : 'কোনো পরীক্ষা নেই'}
            </div>
          </div>
        )}
      </div>

      {/* Clean Minimal Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-[4px] bg-neutral-100 dark:bg-[#222226] border border-neutral-300 dark:border-[#3f3f46]" />
          <span>০ পরীক্ষা</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-[4px] bg-[#059669]" />
          <span>১টি পরীক্ষা</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-[4px] bg-[#047857] dark:bg-[#10b981]" />
          <span>২+ পরীক্ষা</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendar;
