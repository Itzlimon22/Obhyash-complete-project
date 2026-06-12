import { Metadata } from 'next';
import LiveExamDashboard from '@/components/admin/features/live-exams/LiveExamDashboard';

export const metadata: Metadata = {
  title: 'Live Exams Management | Admin',
  description: 'Manage scheduled live exams for students.',
};

export default function LiveExamsPage() {
  return <LiveExamDashboard />;
}
