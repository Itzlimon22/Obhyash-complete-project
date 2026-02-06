import React from 'react';
import { Flag, AlertOctagon } from 'lucide-react';

export const ReportStats = ({
  pending,
  highSeverity,
}: {
  pending: number;
  highSeverity: number;
}) => (
  <div className="flex gap-3">
    <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-lg flex items-center gap-3">
      <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-md">
        <AlertOctagon size={16} />
      </div>
      <div>
        <p className="text-xs text-rose-600/80 font-bold uppercase">
          Pending High
        </p>
        <p className="text-lg font-bold text-rose-700 dark:text-rose-400">
          {highSeverity}
        </p>
      </div>
    </div>
    <div className="px-4 py-2 bg-paper-50 dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 rounded-lg flex items-center gap-3">
      <div className="p-1.5 bg-paper-200 dark:bg-obsidian-800 text-gray-600 dark:text-gray-400 rounded-md">
        <Flag size={16} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase">
          Total Pending
        </p>
        <p className="text-lg font-bold text-paper-900 dark:text-white">
          {pending}
        </p>
      </div>
    </div>
  </div>
);
