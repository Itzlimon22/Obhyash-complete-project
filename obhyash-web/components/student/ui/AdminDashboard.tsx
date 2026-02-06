import React from 'react';
import { ExamResult } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface AdminDashboardProps {
  history: ExamResult[];
  onUpdateHistory: (history: ExamResult[]) => void;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  history,
  onUpdateHistory,
  onClose,
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">
          Total Exams in History: {history.length}
        </p>

        {/* Placeholder for actual admin dashboard content */}
        <div className="bg-white dark:bg-neutral-900 border rounded-lg p-8 text-center text-neutral-500">
          Admin Dashboard Content Coming Soon
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
