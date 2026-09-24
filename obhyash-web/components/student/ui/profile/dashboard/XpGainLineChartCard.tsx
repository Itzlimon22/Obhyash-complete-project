'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

export interface DailyXpPoint {
  date: string;
  dayLabel: string;
  myXP: number;
  targetXP?: number;
}

interface XpGainLineChartCardProps {
  data: DailyXpPoint[];
  primaryTotal: number;
  secondaryTotal?: number;
  targetName?: string;
  isViewingSelf: boolean;
}

export default function XpGainLineChartCard({
  data,
  primaryTotal,
  secondaryTotal,
  targetName,
  isViewingSelf,
}: XpGainLineChartCardProps) {
  const targetFirstName = targetName ? targetName.split(' ')[0] : 'প্রতিপক্ষ';

  const subtitle = isViewingSelf
    ? 'গত ৭ দিনে অর্জিত পয়েন্টের চিত্র'
    : 'গত ৭ দিনের অর্জিত XP-এর মুখোমুখি তুলনা';

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#27272a] p-5 sm:p-7 shadow-sm">
      {/* Header with Title and Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            XP অর্জনের ধারা
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Legend Pill Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* My XP Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              তুমি: {BanglaNameHelper.toBanglaNumeral(primaryTotal)} XP
            </span>
          </div>

          {/* Opponent XP Pill (only when not viewing self) */}
          {!isViewingSelf && secondaryTotal !== undefined && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>
                {targetFirstName}: {BanglaNameHelper.toBanglaNumeral(secondaryTotal)} XP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 sm:h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={{ stroke: '#27272a', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickFormatter={(v) => BanglaNameHelper.toBanglaNumeral(v)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as DailyXpPoint;
                return (
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 shadow-xl text-xs space-y-1 z-50">
                    <p className="font-bold text-gray-300 border-b border-[#27272a] pb-1 mb-1">
                      {point.dayLabel} ({point.date})
                    </p>
                    <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        তুমি:
                      </span>
                      <span>{BanglaNameHelper.toBanglaNumeral(point.myXP)} XP</span>
                    </div>
                    {!isViewingSelf && point.targetXP !== undefined && (
                      <div className="flex items-center justify-between gap-3 text-indigo-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          {targetFirstName}:
                        </span>
                        <span>{BanglaNameHelper.toBanglaNumeral(point.targetXP)} XP</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {/* Primary line: You */}
            <Area
              type="monotone"
              dataKey="myXP"
              name="তুমি"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#emeraldGrad)"
              dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#ffffff' }}
            />
            {/* Secondary line: Target User */}
            {!isViewingSelf && (
              <Area
                type="monotone"
                dataKey="targetXP"
                name={targetFirstName}
                stroke="#6366F1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#indigoGrad)"
                dot={{ r: 3.5, fill: '#6366F1', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5.5, fill: '#6366F1', strokeWidth: 2, stroke: '#ffffff' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
