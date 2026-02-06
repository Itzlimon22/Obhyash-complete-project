
import React from 'react';

interface StatsGridProps {
  examsTaken: number;
  avgScore: number;
  xp: number;
  streak: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({ examsTaken, avgScore, xp, streak }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Exams */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">মোট পরীক্ষা</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{examsTaken}</div>
        </div>

        {/* Avg Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">গড় স্কোর</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgScore}%</div>
        </div>

        {/* Total XP */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-200 dark:hover:border-amber-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.302 5.002" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">মোট XP</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{xp.toLocaleString()}</div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">স্ট্রিক</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{streak} দিন</div>
        </div>
    </div>
  );
};

export default StatsGrid;
