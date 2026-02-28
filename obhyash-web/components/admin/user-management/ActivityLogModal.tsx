import React, { useEffect, useState } from 'react';
import { X, Search, Filter, Download, Activity } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogModalProps {
  userId: string | null;
  userName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityLogModal({
  userId,
  userName,
  isOpen,
  onClose,
}: ActivityLogModalProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen && userId) {
      fetchActivities();

      // Real-time subscription
      const supabase = createClient();
      const channel = supabase
        .channel('activity_log_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_activity_log',
            filter: `user_id=eq.${userId}`,
          },
          (payload: { new: ActivityLog }) => {
            setActivities((prev) => [payload.new as ActivityLog, ...prev]);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, userId]);

  const fetchActivities = async () => {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Description'].join(','),
      ...activities.map((a) =>
        [
          new Date(a.created_at).toLocaleString(),
          a.activity_type,
          `"${a.description}"`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${userName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Activity log exported');
  };

  const filteredActivities =
    filter === 'all'
      ? activities
      : activities.filter((a) => a.activity_type === filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Activity Log
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              History for{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                {userName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Activities</option>
              <option value="LOGIN">Login</option>
              <option value="UPDATE">Updates</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="EXAM">Exams</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              Loading activity history...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              No activity records found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                >
                  <div
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      activity.activity_type === 'LOGIN'
                        ? 'bg-emerald-500'
                        : activity.activity_type === 'SUBSCRIPTION'
                          ? 'bg-red-500'
                          : activity.activity_type === 'EXAM'
                            ? 'bg-emerald-500'
                            : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {activity.activity_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 break-words">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
