import { Metadata } from 'next';
import { Suspense } from 'react';
import LiveExamDashboard from '@/components/admin/features/live-exams/LiveExamDashboard';

export const metadata: Metadata = {
  title: 'Live Exams Management | Admin',
  description: 'Manage scheduled live exams for students.',
};

export default function LiveExamsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 font-mono text-xs">লাইভ এক্সাম ডাটা লোড হচ্ছে...</div>}>
      <LiveExamDashboard />
    </Suspense>
  );
}
