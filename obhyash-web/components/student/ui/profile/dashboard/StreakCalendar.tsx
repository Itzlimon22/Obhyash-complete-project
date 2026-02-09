'use client';

import React, { useState } from 'react';

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

  // Get color intensity based on exam count
  const getColorClass = (examCount: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-neutral-100 dark:bg-neutral-800/30';
    if (examCount === 0) return 'bg-neutral-200 dark:bg-neutral-700';
    if (examCount === 1) return 'bg-emerald-300 dark:bg-emerald-700';
    if (examCount === 2) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500';
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
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {getMonthName()} কার্যক্রম
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            এই মাসে আপনার পরীক্ষার পরিসংখ্যান
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-100 dark:border-orange-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-orange-500"
          >
            <path
              fillRule="evenodd"
              d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {streakCount} দিন স্ট্রিক
          </span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1 relative">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer
                  transition-all duration-200 hover:scale-110 hover:shadow-md
                  ${getColorClass(day.examCount, day.isCurrentMonth)}
                  ${day.isCurrentMonth ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-600'}
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
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg shadow-lg pointer-events-none z-10">
            <div className="font-bold">
              {new Date(hoveredDay.date).toLocaleDateString('bn-BD', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div>
              {hoveredDay.examCount > 0
                ? `${hoveredDay.examCount}টি পরীক্ষা`
                : 'কোনো পরীক্ষা নেই'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" />
          <span>০</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-700" />
          <span>১</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-600" />
          <span>২</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>৩+</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendar;
