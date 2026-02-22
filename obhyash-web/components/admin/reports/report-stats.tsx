import React from 'react';
import { Flag, AlertOctagon } from 'lucide-react';

export const ReportStats = ({
  pending,
  highSeverity,
}: {
  pending: number;
  highSeverity: number;
}) => (
  <div className="flex gap-2 md:gap-3">
    <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2.5">
      <div className="p-1 px-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
        <AlertOctagon size={14} />
      </div>
      <div>
        <p className="text-[9px] text-red-600/70 font-black uppercase tracking-tight">
          High
        </p>
        <p className="text-sm md:text-lg font-black text-red-700 dark:text-red-400 leading-none">
          {highSeverity}
        </p>
      </div>
    </div>
    <div className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center gap-2.5 shadow-sm">
      <div className="p-1 px-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg">
        <Flag size={14} />
      </div>
      <div>
        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-tight">
          Pending
        </p>
        <p className="text-sm md:text-lg font-black text-neutral-900 dark:text-white leading-none">
          {pending}
        </p>
      </div>
    </div>
  </div>
);
