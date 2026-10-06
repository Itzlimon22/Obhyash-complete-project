'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Download, ChevronRight, BarChart2, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartDayData {
  day: string;
  regular: number;
  live: number;
}

const DEFAULT_CHART_DATA: ChartDayData[] = [
  { day: 'Sun', regular: 28, live: 22 },
  { day: 'Mon', regular: 34, live: 29 },
  { day: 'Tue', regular: 48, live: 33 },
  { day: 'Wed', regular: 31, live: 25 },
  { day: 'Thu', regular: 35, live: 21 },
  { day: 'Fri', regular: 26, live: 18 },
  { day: 'Sat', regular: 42, live: 36 },
];

interface ParticipationChartProps {
  data?: ChartDayData[];
  onExport?: () => void;
  className?: string;
}

export const ParticipationChart: React.FC<ParticipationChartProps> = ({
  data = DEFAULT_CHART_DATA,
  onExport,
  className,
}) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    // Default CSV export
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Day,Regular Exams,Live Exams', ...data.map((r) => `${r.day},${r.regular}k,${r.live}k`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'obhyash_participation_analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#151515] rounded-3xl p-6 shadow-card border border-slate-100/80 dark:border-zinc-800/80',
        'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch',
        className,
      )}
    >
      {/* Chart Section (Left 8 Cols) */}
      <div className="lg:col-span-8 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Regular Sell
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
              সাপ্তাহিক MCQ অনুশীলন ও লাইভ পার্টিসিপেশন
            </p>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c6f634] hover:bg-[#b8ea27] text-slate-950 font-bold rounded-full text-xs shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export</span>
          </button>
        </div>

        {/* Dual Bar Chart */}
        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}k`}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 60]}
                ticks={[20, 30, 40, 50]}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-950 text-white rounded-2xl p-3 shadow-xl border border-slate-800 text-xs">
                        <p className="font-bold text-slate-200 mb-1.5">{label} Exam Traffic</p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#c8bbf5]" />
                          <span className="text-slate-300">MCQ প্র্যাকটিস:</span>
                          <span className="font-bold ml-auto">{payload[0]?.value}k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#c6f634]" />
                          <span className="text-slate-300">লাইভ সেশন:</span>
                          <span className="font-bold ml-auto">{payload[1]?.value}k</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Lavender Bar */}
              <Bar
                dataKey="regular"
                name="Regular"
                fill="#c8bbf5"
                radius={[6, 6, 0, 0]}
                maxBarSize={18}
              />
              {/* Neo-Lime Bar */}
              <Bar
                dataKey="live"
                name="Live"
                fill="#c6f634"
                radius={[6, 6, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* More Analysis Sub-card (Right 4 Cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-zinc-800/80 pt-4 lg:pt-0 lg:pl-6">
        <div>
          <h4 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            More Analysis
          </h4>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
            There are more to view
          </p>

          <div className="mt-4 space-y-2.5">
            {/* Store Sell Ratio Row */}
            <button
              onClick={() => setActiveAnalysis(activeAnalysis === 'ratio' ? null : 'ratio')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block">
                    Store Sell Ratio
                  </span>
                  <span className="text-[10px] text-slate-400">বিষয়ভিত্তিক অনুপাত</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Top item sold Row */}
            <button
              onClick={() => setActiveAnalysis(activeAnalysis === 'top' ? null : 'top')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block">
                    Top item sold
                  </span>
                  <span className="text-[10px] text-slate-400">সর্বোচ্চ বিক্রিত প্যাকেজ</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer Credit Tag */}
        <div className="pt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
          <span>Analysis created by</span>
          <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-[#c6f634] text-slate-950 font-black text-[10px] flex items-center justify-center">
              W
            </span>
            Obhyash AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default ParticipationChart;
