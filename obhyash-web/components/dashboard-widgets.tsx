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
    <div className="relative overflow-hidden bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 rounded-xl p-6 hover:border-brand-300 dark:hover:border-brand-700/50 transition-all duration-300 group shadow-subtle hover:shadow-lg dark:shadow-none">
      {/* Decorative Glow Effect on Hover */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 dark:opacity-0 dark:group-hover:opacity-5 transition-opacity duration-700 ${data.bgClass.replace('/10', '/30')}`}
      />

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
            {data.title}
          </h4>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-paper-900 dark:text-white tracking-tight">
              {data.value}
            </span>
            {data.trend && (
              <span
                className={`text-xs font-semibold flex items-center px-2 py-0.5 rounded-full ${data.trend.isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}
              >
                {data.trend.isPositive ? (
                  <ArrowUpRight size={14} className="mr-0.5" />
                ) : (
                  <ArrowDownRight size={14} className="mr-0.5" />
                )}
                {data.trend.value}%
              </span>
            )}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl ${data.bgClass} ${data.colorClass} dark:bg-opacity-5 bg-opacity-20`}
        >
          <data.icon size={22} />
        </div>
      </div>

      <div className="w-full bg-paper-100 dark:bg-obsidian-800 h-1 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full ${data.colorClass.replace('text-', 'bg-')} opacity-80`}
          style={{ width: '65%' }}
        ></div>
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
