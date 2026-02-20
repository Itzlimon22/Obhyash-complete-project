import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { User } from '@/lib/types';
import { getTeacherStats } from '@/services/stats-service';

interface TeacherStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function TeacherStatsModal({
  isOpen,
  onClose,
  user,
}: TeacherStatsModalProps) {
  const [stats, setStats] = useState<{
    totalQuestions: number;
    approved: number;
    pending: number;
    rejected: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      const fetchStats = async () => {
        setIsLoading(true);
        // Assuming user.email is used as author identifier for now, as discussed in plan
        const data = await getTeacherStats(user.email);
        setStats(data);
        setIsLoading(false);
      };
      fetchStats();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 w-full max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Teacher Statistics
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user.name} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Total Questions
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {stats?.totalQuestions || 0}
                  </p>
                </div>
                <div className="w-full p-3 bg-white dark:bg-neutral-800 rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-sm">
                  <FileText className="text-blue-500" size={24} />
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Approved
                  </p>
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {stats?.approved || 0}
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Pending
                  </p>
                  <Clock size={16} className="text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {stats?.pending || 0}
                </p>
              </div>

              <div className="col-span-2 bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                    {stats?.rejected || 0}
                  </p>
                </div>
                <AlertCircle size={24} className="text-rose-500" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
