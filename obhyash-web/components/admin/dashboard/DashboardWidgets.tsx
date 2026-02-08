'use client';

import React, { useState } from 'react';
// ✅ Ensure this path matches where you put your types.ts
import { StatData, DatabaseTool } from '@/lib/types';
import {
  Database,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Activity,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner'; // ✅ Added for better notifications
import { createClient } from '@/utils/supabase/client'; // ✅ Added for future DB calls

/**
 * StatCard Component
 * Displays a single statistic with a trend indicator and a decorative icon.
 * (No changes needed here, purely presentational)
 */
export const StatCard: React.FC<{ data: StatData }> = ({ data }) => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-rose-300 dark:hover:border-rose-900/50 transition-all duration-300 group shadow-sm hover:shadow-xl dark:shadow-none">
      {/* Decorative Glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-700 ${data.bgClass.replace('/30', '/60')}`}
      />

      <div className="flex justify-between items-start relative z-10 mb-4">
        <div className="space-y-1">
          <h4 className="text-neutral-500 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            {data.title}
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {data.value.toLocaleString()}
            </span>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl ${data.bgClass} ${data.colorClass} dark:bg-opacity-10 bg-opacity-20 flex items-center justify-center shadow-inner`}
        >
          <data.icon size={20} strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        {data.trend ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              data.trend.isPositive
                ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
            }`}
          >
            {data.trend.isPositive ? (
              <ArrowUpRight size={12} strokeWidth={3} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={3} />
            )}
            {data.trend.value}%
          </div>
        ) : (
          <div className="h-5" /> // Spacer
        )}

        <div className="text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">
          Monthly
        </div>
      </div>

      {/* Modern thin progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out group-hover:opacity-100 opacity-60 ${data.colorClass.replace('text-', 'bg-')}`}
          style={{ width: '70%' }}
        />
      </div>
    </div>
  );
};

/**
 * ToolItem Component
 * Actionable list items with internal loading state.
 */
const ToolItem: React.FC<{ tool: DatabaseTool }> = ({ tool }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await tool.action(); // Execute the passed function
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      // ✅ UPDATED: Use toast instead of alert for better UI
      toast.error('Action failed. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group flex items-center justify-between p-5 bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 rounded-xl hover:bg-white dark:hover:bg-obsidian-900 hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:border-brand-200 dark:group-hover:border-brand-900/50 transition-all duration-300 shadow-sm">
          {isLoading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : isSuccess ? (
            <Check size={22} className="text-emerald-500" />
          ) : (
            <tool.icon size={22} />
          )}
        </div>
        <div>
          <h5 className="text-base font-semibold text-paper-900 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {isSuccess ? 'Operation Successful' : tool.label}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 text-gray-300 dark:text-obsidian-700 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-all">
        <ArrowUpRight size={18} />
      </div>
    </div>
  );
};

/**
 * DatabaseToolsSection Component
 * Contains the actual logic for system tools.
 */
export const DatabaseToolsSection: React.FC = () => {
  const supabase = createClient();

  // ✅ UPDATED: Define tools with Supabase logic or mock simulations
  const tools: DatabaseTool[] = [
    {
      id: 'seed-hsc',
      label: 'Seed HSC Data',
      description: 'Populate database with default HSC subjects/chapters.',
      icon: Database,
      action: async () => {
        // ⚠️ LOGIC: Usually strictly restricted to Admins.
        // For now, we simulate a delay. In production, call a Supabase RPC function.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success('HSC Data Seeded Successfully!');
        // Example real call: await supabase.rpc('seed_hsc_data');
      },
    },
    {
      id: 'backup-daily',
      label: 'Manual Backup',
      description: 'Trigger a manual backup snapshot.',
      icon: Upload,
      action: async () => {
        // ⚠️ LOGIC: Supabase handles backups automatically.
        // This button could trigger a CSV export or just be a visual placeholder.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast.success('Backup trigger sent to system.');
      },
    },
  ];

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="text-lg font-bold text-paper-900 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-brand-500" />
          System Operations
        </h3>
        <button className="text-gray-400 hover:text-paper-900 dark:text-gray-500 dark:hover:text-white transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 rounded-2xl p-6 shadow-subtle dark:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <ToolItem key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-50/50 dark:bg-yellow-500/5 border border-amber-100 dark:border-yellow-500/10">
          <div className="flex gap-4 items-start">
            <div className="text-amber-600 dark:text-yellow-600 mt-0.5 p-1.5 bg-amber-100 dark:bg-yellow-500/10 rounded-md">
              <Database size={16} />
            </div>
            <div>
              <h6 className="text-sm font-semibold text-amber-900 dark:text-yellow-500">
                Scheduled Maintenance
              </h6>
              <p className="text-sm text-amber-700 dark:text-gray-400 mt-1 leading-relaxed">
                Database maintenance is scheduled for{' '}
                <span className="font-semibold">Sunday at 02:00 AM UTC</span>.
                Write operations may be paused for ~15 mins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
